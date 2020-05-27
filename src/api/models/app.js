const { v4: uuidv4 } = require('uuid');
const DB = require('../../lib/db');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
var tar = require('tar-fs');
var s3Helper = require('./s3');

var s3 = new AWS.S3({
  "accessKeyId": "S3RVER",
  "secretAccessKey": "S3RVER",
  "region": "test",
  "s3ForcePathStyle": true,
  "endpoint": new AWS.Endpoint('http://localhost:8034'),
  signatureVersion: 'v4',
});

var compareVersions = require('compare-versions');


findCurrentVersion = async () => {

}

module.exports.publish = async (req) => {
  let data = req.body;
  const name = data.name;
  const version = data.version;
  const files = JSON.parse(data.assets);
  const config = JSON.parse(data.config);

  console.log("files", files, data.assets);

  //compare versions.
  // try to get a current version.
  const currentItem = await DB.get('StitchApp', { id: name });
  console.log("currentItem", currentItem);
  if(currentItem.Item) {
    // validate that this version is bigger.
    if( compareVersions(version, currentItem.Item.version) < 1) {
      // todo: restore version check
      // throw Error(`The '${name}' is currently at  '${currentItem.Item.version} version ${version}'. You tried to publish version '${version}'. Please upgrade the package version.`);
    }
    console.log("version", currentItem.Item.version, version, compareVersions(version, currentItem.Item.version));
  }


  // create a unique id
  const id = uuidv4();

  // generate the bucket presigned url for all assets.
  const assets = [];
  files.forEach((a) => {
    const presignedS3Url = s3.getSignedUrl('putObject', {
      Bucket: 'local-bucket',
      Key: id + a,
      Expires: 10,
    });

    assets.push({
      file: a,
      presignedS3Url: presignedS3Url || null
    })
  });


  // create the record in the db for this version.
  var item = {
    id: id,
    name: name,
    version: version,
    config: config.stitch, // json string of config.
    type: config.stitch.type || 'app',
    assets: assets,
    sent_at: Date.now()
  }
  await DB.put('StitchAppVersion', item);

  return item;
}

savePipeSync = (stream, destination) => {
  return new Promise((resolve, reject) => {
    var w = fs.createWriteStream(destination);
    stream.pipe(w);

    w.on('finish', () => {
      resolve();
    });
  });
}


tarPipeSync = (stream, destination) => {
  return new Promise((resolve, reject) => {
    var extract = tar.extract(destination);
    extract.on('finish', () => {
      resolve();
    })
    stream.pipe(extract);
  });
}

publishVersion = async (item) => {
  await DB.update('StitchApp',  {
    keys: { id: item.name },
    ExpressionAttributeNames: { '#status': 'status', '#source': 'source', '#type': 'type' },
    UpdateExpression: 'set #status = :status,  #source = :source, config = :c, version = :version, #type = :type, assets = :assets',
    ExpressionAttributeValues: {':status': 'published', ':source': item.id, ':c': item.config, ':version': item.version, ':type': item.type, ':assets': item.assets }
  });
}



module.exports.upload = async (req) => {
  const id = req.query.id;
  const name = req.query.name;

  //get the document db item for this id.
  const item = await DB.get('StitchAppVersion', { id, name });
  console.log("Item from db", item);


  // dest directory, this is available on lambda and local.
  const dir = '/tmp/app';
  if (fs.existsSync(dir)){
    fs.rmdirSync(dir,  { recursive: true });
  }
  fs.mkdirSync(dir);
  const dest = path.join(dir, 'app.tar.gz');



  // unzipped archive dest
  const outputDest = path.join(dir, 'output')
  if (fs.existsSync(outputDest)){
    fs.rmdirSync(outputDest,  { recursive: true });
  }
  fs.mkdirSync(outputDest);

  //save tar file
  await savePipeSync(req, dest);

  // untar archive.
  await tarPipeSync(fs.createReadStream(dest), outputDest)

  //upload archive to s3 bucket.
  var options = null;
  var invalidation = null
  const files = await s3Helper.upload(outputDest, 'local-bucket/' +  id);

  //update item entry to 'published'
  await publishVersion(item.Item);


  console.log("DONE publishing module");

}

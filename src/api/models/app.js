const { v4: uuidv4 } = require('uuid');
const DB = require('../../lib/db');
const AWS = require('aws-sdk');

let s3 = null;
if(process.env.IS_OFFLINE === "true") {
  s3 = new AWS.S3({
    "accessKeyId": "S3RVER",
    "secretAccessKey": "S3RVER",
    "region": "test",
    "s3ForcePathStyle": true,
    "endpoint": new AWS.Endpoint('http://localhost:8034'),
    signatureVersion: 'v4',
  });
}
else {
  s3 = new AWS.S3({
    "s3ForcePathStyle": true,
    "region": process.env.region,
    signatureVersion: 'v4',
  });
}


var compareVersions = require('compare-versions');


module.exports.upload = async (req) => {
  let data = req.body;
  const name = data.name;
  const version = data.version.toString();
  const files = JSON.parse(data.assets);
  const config = JSON.parse(data.config);

  console.log("files", files, data.assets);

  //compare versions.
  // try to get a current version.
  const currentItem = await DB.get('StitchApp', { id: name });
  console.log("currentItem", currentItem);
  if(currentItem.Item) {
    // validate that this version is bigger.
    //if( compareVersions(version, currentItem.Item.version.toString()) < 1) {
      // todo: restore version check
      // throw Error(`The '${name}' is currently at  '${currentItem.Item.version} version ${version}'. You tried to publish version '${version}'. Please upgrade the package version.`);
    //}
    //console.log("version", currentItem.Item.version, version, compareVersions(version, currentItem.Item.version));
  }


  // create a unique id
  const id = uuidv4();

  // generate the bucket presigned url for all assets.
  const assets = [];
  files.forEach((a) => {
    const presignedS3Url = s3.getSignedUrl('putObject', {
      Bucket:  process.env.BUCKET_NAME,
      Key: id + a,
      Expires: 100,
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
    config: config, // json string of config.
    type: config.type || 'app',
    assets: assets,
    sent_at: Date.now()
  }
  await DB.put('StitchAppVersion', item);

  return item;
}

publishVersion = async (item) => {
  await DB.update('StitchApp',  {
    keys: { id: item.name },
    ExpressionAttributeNames: { '#status': 'status', '#source': 'source', '#type': 'type' },
    UpdateExpression: 'set #status = :status,  #source = :source, config = :c, version = :version, #type = :type, assets = :assets',
    ExpressionAttributeValues: {':status': 'published', ':source': item.id, ':c': item.config, ':version': item.version, ':type': item.type, ':assets': item.assets }
  });
}

remove = async (item) => {
  await DB.update('StitchApp',  {
    keys: { id: item.id },
    ExpressionAttributeNames: { '#status': 'status' },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {':status': 'deleted' }
  });
}



module.exports.publish = async (req) => {
  const id = req.query.id;
  const name = req.query.name;

  //get the document db item for this id.
  const item = await DB.get('StitchAppVersion', { id });
  console.log("Item from db", item);

  //update item entry to 'published'
  await publishVersion(item.Item);

  return item.Item;

}


module.exports.list = async (req) => {
  const result = await DB.query('StitchApp', {});
  return result.Items;
}


module.exports.remove = async (req) => {
  let result = null;
  const id = req.params.id;

  //get the document db item for this id.
  const item = await DB.get('StitchApp', { id });

  // if there is an item, remove it.
  if(item.Item) {
    remove(item.Item);
  } else {
    throw new Error( `App '${id}' not found. Run 'stitch list' for a list of apps.` );
  }


}




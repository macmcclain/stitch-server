const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
var mime = require('mime-types')

const credentials = {
  "accessKeyId": "S3RVER",
  "secretAccessKey": "S3RVER",
  "region": "test",
  "s3ForcePathStyle": true,
  "endpoint": new AWS.Endpoint('http://localhost:8034'),
  //"bucket": "local-bucket" + "/" + id
}




module.exports.upload = async (dir, bucket) => {
    let s3 = new AWS.S3(credentials);

    const files = [];

    function walkSync(currentDirPath, callback) {
      fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile()) {
          files.push(filePath.replace(dir, ''));
          callback(filePath, stat);
        } else if (stat.isDirectory()) {
          walkSync(filePath, callback);
        }
      });
    }

    walkSync(dir, function(filePath, stat) {
      let bucketPath = filePath.substring(dir.length+1);
      const contentType = mime.contentType(path.extname(filePath));
      let params = {Bucket: bucket, Key: bucketPath, Body: fs.readFileSync(filePath), ContentType: contentType };
      s3.putObject(params, function(err, data) {
        if (err) {
          console.log(err)
        } else {
          console.log('Successfully uploaded '+ bucketPath +' to ' + bucket);
        }
      });

    });

    return files;
}

require('dotenv').config()
const serverless = require('serverless-http');
const express = require('express');
const StitchAppManager = require('./lib/stitchAppManager');
const StitchPage = require('./lib/stitchPage');

// set up routes
var app = express();

// Middleware for serving '/dist' directory
//const staticFileMiddleware = express.static('/app/dist/');
app.use(express.static(__dirname + '/app/dist/'))
console.log("__dirname + '/app/dist/'", __dirname + '/app/dist/')
// 1st call for unredirected requests
//app.use(staticFileMiddleware);


// handle modules
const stitchAppManager = new StitchAppManager();


app.get('*', async (req, res, next) => {
  //const index = __dirname + '/app/dist/index.html';
  const index = __dirname + '/index.html';
  console.log("A");
  // compile the apps.
  await stitchAppManager.compile();

  console.log("B");
  // stitch page based on route.
  const path = req.path.replace(/^\/|\/$/g, '');
  let assetHostUrl = null;

  console.log("C");
  if(process.env.IS_OFFLINE) {
    assetHostUrl = "http://localhost:8034/" + process.env.BUCKET_NAME;
  }
  else {
    assetHostUrl = "https://s3.amazonaws.com/"  + process.env.BUCKET_NAME;
  }
  const stitchPage = new StitchPage({path, stitchAppManager, assetHostUrl: assetHostUrl})

  console.log("D");
  console.log("stitchPage", stitchPage);

  const page = stitchPage.getPage();

  console.log("E");
  // serve the page.
  res.set('Content-Type', 'text/html')
  res.end(page.html);


});

module.exports.handler = serverless(app);


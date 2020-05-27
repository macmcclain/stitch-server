require('dotenv').config()
const serverless = require('serverless-http');
const express = require('express');
const fs = require('fs')
const cheerio = require('cheerio');
const StitchAppManager = require('./lib/stitchAppManager');
const StitchPage = require('./lib/stitchPage');

// set up routes
var app = express();

// Middleware for serving '/dist' directory
//const staticFileMiddleware = express.static('/app/dist/');
app.use(express.static(__dirname + '/app/dist/'))

// 1st call for unredirected requests
//app.use(staticFileMiddleware);


// handle modules
const stitchAppManager = new StitchAppManager();


app.get('*', async (req, res, next) => {
  //const index = __dirname + '/app/dist/index.html';
  const index = __dirname + '/index.html';

  // compile the apps.
  await stitchAppManager.compile();


  // stitch page based on route.
  const path = req.path.replace(/^\/|\/$/g, '');
  const stitchPage = new StitchPage({path, stitchAppManager, assetHostUrl: 'http://localhost:8034/local-bucket'})


  console.log("stitchPage", stitchPage);

  const page = stitchPage.getPage();

  // serve the page.
  res.set('Content-Type', 'text/html')
  res.end(page.html);


});

module.exports.handler = serverless(app);

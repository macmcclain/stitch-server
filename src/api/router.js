const serverless = require('serverless-http');
const express = require('express')()
const app = require('./models/app');
var bodyParser = require('body-parser')


express.use(bodyParser.json());


express.post('/api/app/publish', async (req, res, next)  => {
  try {
    const item = await app.publish(req);
    res.send(item);
  }
  catch (err) {
    next(err);
  }

});

express.post('/api/app/upload', async (req, res, next) => {
  await app.upload(req);
  req.on('end', next);
  res.send("done");
});


// Finally, your custom error handler
express.use(function customErrorHandler(err, req, res, next) {
  res.status(500).json({ message: err.message });
});

module.exports.handler = serverless(express);


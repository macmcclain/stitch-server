const serverless = require('serverless-http');
const express = require('express')()
const app = require('./models/app');
var bodyParser = require('body-parser')


express.use(bodyParser.json());


express.post('/api/ping', async (req, res, next)  => {
  try {
    res.send(true);
  }
  catch (err) {
    next(err);
  }

});

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
  const item = await app.upload(req);
  res.send(item);
});


express.post('/api/app/list', async (req, res, next) => {
  const items = await app.list();
  res.send(items);
});

express.post('/api/app/:id/remove', async (req, res, next) => {
  try {
    const item = await app.remove(req);
    res.send(item);
  }
  catch (err) {
    next(err.message );
  }

});


// Finally, your custom error handler
express.use(function customErrorHandler(err, req, res, next) {
  res.status(500).json({ message: err.message });
});

module.exports.handler = serverless(express);


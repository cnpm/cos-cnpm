/**
 * Module dependencies.
 */

var path = require('path');
var COS = require('./sdk/cos');
var fs = require('co-fs')
var stream = require('stream');
var sdkConfig = require('./sdk/config')

/**
 * Expose `Client`
 */
module.exports = Client;

function Client(options) {
  if (!(this instanceof Client)) {
    return new Client(options);
  }

  this.bucket = options.bucket || 'tnpmnfs';
  this.region = options.region || 'cn-south';
  sdkConfig.APPID = options.APPID;
  sdkConfig.SECRET_ID = options.SECRET_ID;
  sdkConfig.SECRET_KEY = options.SECRET_KEY;
}

Client.prototype.upload = function*(filepath, options) {
  var content = yield fs.readFile(filepath);
  return yield this.uploadBuffer(content, options)
};

Client.prototype.uploadBuffer = function*(content, options) {
  var key = trimKey(options.key);
  var contentLength = content.length;
  var body = bufferToReadStream(content); // 转换成 read stream

  var params = {
    Bucket: this.bucket, /* 必须 */
    Region: this.region,  //cn-south、cn-north、cn-east  /* 必须 */
    Key: key, /* 必须 */
    Body: body, /* 必须 */
    ContentLength: contentLength, /* 必须 */
  };

  yield new Promise(function (resolve, reject) {
    COS.putObject(params, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve(data); // {ETag: 'xxxxxxx'}
    });
  })

  return {key: key};
};

Client.prototype.download = function*(key, savePath, options) {
  var key = trimKey(key);

  var params = {
    Bucket: this.bucket, /* 必须 */
    Region: this.region,  //cn-south、cn-north、cn-east  /* 必须 */
    Key: key, /* 必须 */
    Output: savePath
  };


  yield new Promise(function (resolve, reject) {
    COS.getObject(params, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve(data);
    })
  })
};

Client.prototype.remove = function*(key) {
  var key = trimKey(key);

  var params = {
    Bucket: this.bucket, /* 必须 */
    Region: this.region,  //cn-south、cn-north、cn-east  /* 必须 */
    Key: key, /* 必须 */
  };

  yield new Promise(function (resolve, reject) {
    COS.deleteObject(params, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve();
    })
  })
};

function trimKey(key) {
  return key ? key.replace(/^\//, '') : '';
}

function bufferToReadStream(buf) {
  // Initiate the source
  var bufferStream = new stream.PassThrough();

  // Write your buffer
  bufferStream.end(buf);

  return bufferStream
}
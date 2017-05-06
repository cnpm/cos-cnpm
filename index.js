/**
 * Module dependencies.
 */

var path = require('path');

/**
 * Expose `Client`
 */
module.exports = Client;

function Client(options) {
  if (!(this instanceof Client)) {
    return new Client(options);
  }
}

Client.prototype.upload = function* (filepath, options) {
  var destpath = this._getpath(options.key);
  yield ensureDirExists(destpath);
  var content = yield fs.readFile(filepath);
  yield fs.writeFile(destpath, content);
  return { key: options.key };
};

Client.prototype.uploadBuffer = function* (content, options) {
  var filepath = this._getpath(options.key);
  yield ensureDirExists(filepath);
  yield fs.writeFile(filepath, content);
  return { key: options.key };
};

Client.prototype.download = function* (key, savePath, options) {
  var filepath = this._getpath(key);
  var content = yield fs.readFile(filepath);
  yield fs.writeFile(savePath, content);
};

Client.prototype.remove = function* (key) {
  var filepath = this._getpath(key);
  yield fs.unlink(filepath);
};

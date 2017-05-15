var assert = require('assert')
var co = require('co')
var path = require('path')
var fs = require('co-fs')


var client = require('..')({
  APPID: process.env.CNPM_COS_APPID,
  SECRET_ID: process.env.CNPM_COS_SECRET_ID,
  SECRET_KEY: process.env.CNPM_COS_SECRET_KEY,
  bucket: 'test',

  // 从 https://github.com/tencentyun/cos-java-sdk-v5/blob/master/src/main/java/com/qcloud/cos/region/Region.java 中选择。默认是 cn-south 华南
  region: 'cn-south',
});



describe('test/index.test.js', function () {
  it('should ok', co.wrap(function *() {
    var result = yield Promise.resolve('hello')
    assert(result === 'hello')
  }))

  var uploadFilepath = path.join(__dirname, 'upload_file.testfile')
  var downloadFilepath = path.join(__dirname, 'download_file.testfile')
  var filekey = 'test_suite/upload_file'
  var fileContent = String(+new Date());


  before(co.wrap(function *() {
    yield fs.writeFile(uploadFilepath, fileContent);
  }))

  it('should upload', co.wrap(function * () {

    yield client.upload(uploadFilepath, {key: filekey})
  }))

  it('should download', co.wrap(function * () {
    yield client.download(filekey, downloadFilepath)

    var content = yield fs.readFile(downloadFilepath, 'utf-8')

    assert(content === fileContent)
  }))

  it('should remove', co.wrap(function * () {
    yield client.remove(filekey)

    try {
      yield client.download(filekey, downloadFilepath)
    } catch (e) {
      assert(e.statusCode === 404)
    }
  }))


  it('should remove not exist key', co.wrap(function *() {
    yield client.remove('not_exits');
  }))
})

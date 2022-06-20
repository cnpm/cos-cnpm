'use strict';

const path = require('path');
const fs = require('fs');
const assert = require('assert');
const urllib = require('urllib');
const Client = require('..');
const config = require('./config');

describe('test/index.test.js', () => {
  [
    {
      name: 'one region oss client',
      nfs: new Client(config),
      prefix: '/oss-cnpm-example',
    },
  ].forEach(item => {
    describe(item.name, () => {
      const nfs = item.nfs;
      const key = item.prefix + '/-/example2.js-' + process.version || '1.0.0';

      it('should upload file', async () => {
        const currentFileBuf = fs.readFileSync(__filename);
        const info = await nfs.upload(currentFileBuf, { key });
        assert.equal(typeof info.key, 'string');
      });

      it('should upload bytes', async () => {
        const bytesKey = `${key}-upload-bytes`;
        await nfs.uploadBytes('hello oss-cnpm 😄', { key: bytesKey });
        const bytes = await nfs.readBytes(bytesKey);
        assert(bytes.toString() === 'hello oss-cnpm 😄');
      });

      it('should append bytes', async () => {
        const bytesKey = `${key}-append-bytes.log`;
        await nfs.remove(bytesKey);

        const contentType = 'text/plain; charset=UTF-8';
        const { nextAppendPosition } = await nfs.appendBytes('hello oss-cnpm 😄', {
          key: bytesKey,
          Headers: {
            'Content-Type': contentType,
          },
        });
        assert(nextAppendPosition);
        console.log('nextAppendPosition', nextAppendPosition);
        await nfs.appendBytes(' world (*´▽｀)ノノ\nNew line', {
          key: bytesKey,
          position: nextAppendPosition,
          Headers: {
            'Content-Type': contentType,
          },
        });
        const bytes = await nfs.readBytes(bytesKey);
        assert(bytes.toString() === 'hello oss-cnpm 😄 world (*´▽｀)ノノ\nNew line');
        const url = await nfs.url(bytesKey);
        const { headers } = await urllib.request(url);
        console.log(url);
        assert(headers['content-type'] === 'text/plain; charset=UTF-8');
      });

      it('should download file', async () => {
        const tmpFile = path.join(__dirname, '.tmp-file.js');
        await nfs.download(key, tmpFile);
        assert.equal(fs.readFileSync(tmpFile, 'utf8'), fs.readFileSync(__filename, 'utf8'));
      });

      it('should get download stream', async () => {
        const tmpFile = path.join(__dirname, '.tmp-file.js');
        const stream = await nfs.createDownloadStream(key);
        const ws = fs.createWriteStream(tmpFile);
        function end() {
          return function(callback) {
            ws.on('close', callback);
          };
        }
        stream.pipe(ws);
        await end();
        assert.equal(fs.readFileSync(tmpFile, 'utf8'), fs.readFileSync(__filename, 'utf8'));
      });

      it('should create signature url', async () => {
        const url = await nfs.url(key);
        const prefix = 'https://' + config.bucket + '.cos.' + config.region + '.myqcloud.com' + key;
        assert.equal(typeof url, 'string');
        assert(url.startsWith(prefix));
      });

      it('should create signature url with ":"', async () => {
        const url = await nfs.url(key);
        assert.equal(typeof url, 'string');
        const domain = 'https://' + config.bucket + '.cos.' + config.region + '.myqcloud.com';
        const prefix = domain + key;
        const withSignUrlPrefix = prefix + '?q-sign-algorithm=sha1&q-ak=';
        assert(url.startsWith(withSignUrlPrefix));
      });

      it('should upload file with headers', async () => {
        // 腾讯云没有这种功能
        const cacheKey = key + '-cache';
        const info = await nfs.upload(__filename, {
          key: cacheKey,
        });
        assert.equal(typeof info.key, 'string');
        const url = await nfs.url(info.key);
        const r = await urllib.request(url, {
          method: 'GET',
        });
        assert.equal(r.status, 200);
      });

      it('should remove the file', async () => {
        const tmpFile = path.join(__dirname, '.tmp-file.js');
        await nfs.download(key, tmpFile);
        await nfs.remove(key);
        try {
          await nfs.download(key, tmpFile);
          throw new Error('should not run this');
        } catch (err) {
          assert.equal(err.name, 'NoSuchKey');
        }
      });

      it('should list files', async () => {
        const prefix = item.prefix.substring(1);
        const files = await nfs.list(`${prefix}/-/`);
        assert(files);
        assert(files.length);
      });

      it('should list with max', async () => {
        const prefix = item.prefix.substring(1);
        const files = await nfs.list(`${prefix}/-/`, {
          max: 1,
        });
        assert(files);
        assert(files.length > 0);
      });
    });
  });
});


'use strict';

const assert = require('assert');
const Client = require('..');
const config = require('./config');

describe('test/fix_url.test.js', () => {
  it('should auto fix internal oss url to public', async () => {
    const nfs = new Client({
      ...config,
    });
    const key = '/oss-cnpm-example/-/example2.js-' + process.version || '1.0.0';
    const url = await nfs.url(key);
    const prefix = 'https://' + config.bucket + '.cos.' + config.region + '.myqcloud.com';
    assert(url.startsWith(prefix));
  });
});

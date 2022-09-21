'use strict';
const Client = require('cos-nodejs-sdk-v5');
const fs = require('fs');
const util = require('util');
const stream = require('stream');
const assert = require('assert');

function trimKey(key) {
  return key ? key.replace(/^\//, '') : '';
}

function addBrowserDownloadQuery(url = '') {
  const prefix = url.includes('?') ? '&' : '?';
  return `${url}${prefix}response-content-disposition=attachment`;
}

function bufferToReadStream(buf) {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(buf);

  return bufferStream;
}

class OssWrapper {
  constructor(options) {
    assert(options.bucket, 'options.bucket 为必传字段');
    assert(options.region, 'options.region 为必传字段');
    assert(options.secretId, 'options.secretId 为必传字段');
    assert(options.secretKey, 'options.secretKey 为必传字段');
    this.client = new Client({
      SecretId: options.secretId,
      SecretKey: options.secretKey,
      Protocol: options.protocol || 'https:',
    });
    this.options = options;
    this.bucket = options.bucket;
    this.region = options.region;
    this.storageClass = options.storageClass || 'MAZ_STANDARD';
  }

  get commonBucketConfig() {
    return {
      Bucket: this.bucket,
      Region: this.region,
    };
  }

  async upload(filePath, options) {
    return await this.uploadBuffer(filePath, options);
  }

  async uploadBuffer(content, options) {
    const key = trimKey(options.key);
    const contentLength = content.length;
    const body = bufferToReadStream(content);
    const params = {
      ...this.commonBucketConfig,
      Key: key,
      Body: body,
      ContentLength: contentLength,
      StorageClass: this.storageClass,
    };
    const putObjectPromise = util.promisify(this.client.putObject).bind(this.client);
    await putObjectPromise(params);
    return { key };
  }

  async uploadBytes(bytes, options) {
    if (typeof bytes === 'string') {
      bytes = Buffer.from(bytes);
    }
    return await this.upload(bytes, options);
  }

  async appendBytes(bytes, options) {
    const Key = trimKey(options.key);
    if (typeof bytes === 'string') {
      bytes = Buffer.from(bytes);
    }
    const headObjectPromise = util.promisify(this.client.headObject).bind(this.client);
    try {
      const headRes = await headObjectPromise({
        ...this.commonBucketConfig,
        ...options,
        Key,
      });
      if (!options.position) {
        options.position = headRes.headers['content-length'] ?? 0;
      }
    } catch (err) {
      console.log('head object error', err);
    }
    const appendObjectPromise = util.promisify(this.client.appendObject).bind(this.client);
    const appendRes = await appendObjectPromise({
      ...this.commonBucketConfig,
      ...options,
      Key,
      Body: bytes,
      Position: Number(options.position) || 0,
    });

    return {
      ...appendRes,
      // 这是因为 cnpmcore 的 NFSAdapter 需要
      nextAppendPosition: appendRes.headers['x-cos-next-append-position'],
    };
  }

  async readBytes(key) {
    const Key = trimKey(key);
    const getObjectPromise = util.promisify(this.client.getObject).bind(this.client);
    const { Body } = await getObjectPromise({
      Key,
      ...this.commonBucketConfig,
    });
    return Body;
  }

  // eslint-disable-next-line no-unused-vars
  async download(key, filepath, options) {
    const Key = trimKey(key);
    const getObjectPromise = util.promisify(this.client.getObject).bind(this.client);
    // todo: 检查options
    await getObjectPromise({
      Key,
      ...this.commonBucketConfig,
      Output: fs.createWriteStream(filepath),
    });
  }

  /**
   * @param {string} prefix - file prefix
   * @param {object} [options] -
   * @param {number} [options.max] - default 1000
   * @return {Promise<string[]>} -
   */
  async list(prefix, options) {
    const max = options && options.max || 1000;
    const stepMax = Math.min(1000, max);
    let Marker = null;
    let files = [];
    const getBucketPromise = util.promisify(this.client.getBucket).bind(this.client);
    do {
      const trimPrefix = trimKey(prefix);
      const res = await getBucketPromise({
        ...this.commonBucketConfig,
        Prefix: trimPrefix,
        MaxKeys: stepMax,
        Marker,
      });
      const objects = res.Contents || [];
      const prefixLength = trimPrefix.length;
      const nextFiles = objects.map(o => o.Key.substring(prefixLength));
      files = files.concat(nextFiles);
      Marker = res.NextMarker;
    } while (Marker && files.length <= max);
    return files;
  }

  async createDownloadStream(key) {
    const Key = trimKey(key);

    return this.client.getObjectStream({
      ...this.commonBucketConfig,
      Key,
    });
  }

  // todo options 会传什么值？
  // eslint-disable-next-line no-unused-vars
  async url(key, options) {
    const Key = trimKey(key);
    const getObjectUrlPromise = util.promisify(this.client.getObjectUrl).bind(this.client);
    const { Url } = await getObjectUrlPromise({
      ...this.commonBucketConfig,
      Key,
      Sign: true,
    });
    return addBrowserDownloadQuery(Url);
  }

  async urls(key, options) {
    return await this.url(key, options);
  }

  async remove(key) {
    const deleteObjectPromise = util.promisify(this.client.deleteObject).bind(this.client);
    const Key = trimKey(key);
    await deleteObjectPromise({
      ...this.commonBucketConfig,
      Key,
    });
  }
}

module.exports = OssWrapper;

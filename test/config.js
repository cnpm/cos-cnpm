'use strict';

const env = process.env;

module.exports = {
  bucket: env.OSS_CNPM_BUCKET,
  region: env.OSS_CNPM_REGION,
  secretId: env.OSS_CNPM_SECRET_ID,
  secretKey: env.OSS_CNPM_SECRET,
  // storageClass: 'STANDARD',
};

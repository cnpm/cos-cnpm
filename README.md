# cos-cnpm

fs storage wrapper for cnpm

## Installation

```bash
$ npm install cos-cnpm
```

## Warning!!!

Only support singleton. Don't initialize two `cos-cnpm` instance.

## Usage

```js
var client = require('cos-cnpm')({
  APPID: '',
  SECRET_ID: '',
  SECRET_KEY: '',
  bucket: 'tnpmnfs',
  
  // 从 https://github.com/tencentyun/cos-java-sdk-v5/blob/master/src/main/java/com/qcloud/cos/region/Region.java 中选择。默认是 cn-south 华南
  region: 'cn-south', 
})
```

## API

All the APIs are following [cnpm nfs guide](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).

- `upload`: upload a file from filepath 

- `uploadBuffer`: upload a file from buffer

- `download`: download file by key

- `remove`: remove file by key

### License

MIT

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
import COSClient from 'cos-cnpm';

config.nfs = {
  client: new COSClient({
    secretId: '',
    secretKey: '',
    bucket: '',
    region: '',
  }),
  // dir: join(config.dataDir, 'nfs'),
};
```

## API

All the APIs are following [cnpm nfs guide](https://github.com/cnpm/cnpmjs.org/wiki/NFS-Guide).

- `upload`: upload a file from filepath 

- `uploadBuffer`: upload a file from buffer

- `download`: download file by key

- `remove`: remove file by key

- `uploadBytes`: upload bytes

- `appendBytes`: append bytes

- `readBytes`: read bytes

- `list`: list files by prefix

- `url`: get download url

- `urls`: get download urls

### License

MIT

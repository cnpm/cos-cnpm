var COS = require('../sdk/cos');

var params = {
  Bucket : 'test',    /* 必须 */
  Region : 'cn-south',  //cn-south、cn-north、cn-east  /* 必须 */
  Key : 'haha2/test.js',    /* 必须 */
};

COS.deleteObject(params, function(err, data) {
  if(err) {
    console.log(err);
  } else {
    console.log(data);
  }
})
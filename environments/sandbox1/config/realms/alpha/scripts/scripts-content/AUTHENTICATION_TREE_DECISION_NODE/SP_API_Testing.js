/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var https = require('https');
//var fs = require('fs');
 
var options = {
  hostname: 'prod-57.eastus.logic.azure.com',
  port: 443,
  path: '/workflows/3e53adfcb02647dc84aa8a2d09c03062/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=O98wvg_fIkVKFmwrgSnwD9u-e13bBj72uwcpQjBQ8yw',
  method: 'POST',
  key: systemEnv.getProperty("esv.ad.private.key"),
  cert: systemEnv.getProperty("esv.ad.cert.sp")
};
 logger.error("key "+key);
 logger.error("cert "+cert);
 
var req = https.request(options, (res) => {
  var data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    logger.error("Data" + data);
  });
});
 
req.on('error', (e) => {
  logger.error(e);
});
 
req.end();

outcome = "true";

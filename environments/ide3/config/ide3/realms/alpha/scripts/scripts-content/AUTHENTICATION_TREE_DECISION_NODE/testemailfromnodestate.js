/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//var mail = nodeState.get("objectAttributes").get("mail");
logger.error("value for sv.kyid.2b.kogapi.token.clientid::::"+systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientid"));
logger.error("value for esv.kyid.2b.kogapi.token.clientcredentials::::"+systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientcredentials"));
logger.error("value for esv.kyid.kogapi.token.scope::::"+systemEnv.getProperty("esv.kyid.kogapi.token.scope"));
logger.error("value for esv.kyid.kogapi.token.granttype::::"+systemEnv.getProperty("esv.kyid.kogapi.token.granttype"));
var frIndexedString5 = "Testone.account@eide.extdev.ky.gov";
var mail = "IDE_KYAUG_T10@mailinator.com";
//nodeState.putShared("frIndexedString5",frIndexedString5)
nodeState.putShared("mail",mail)
//nodeState.putShared("objectAttributes", {"mail": "Testone.account@eide.extdev.ky.gov"});
nodeState.putShared("objectAttributes", {"mail": "IDE_KYAUG_T10@mailinator.com"});
// //nodeState.putShared("objectAttributes", {"mail": nodeState.get("mail")});
// nodeState.putShared("objectAttributes", {"frIndexedString1": nodeState.get("objectAttributes").get("mail")});
//logger.error("printing mail from nodestate in test journey" +displaymail);
outcome = "true";

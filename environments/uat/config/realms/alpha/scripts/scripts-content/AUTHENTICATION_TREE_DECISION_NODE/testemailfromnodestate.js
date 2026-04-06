/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//var mail = nodeState.get("objectAttributes").get("mail");
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

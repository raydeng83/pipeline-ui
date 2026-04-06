/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


logger.error("the pd for connector:  "+ systemEnv.getProperty("esv.ad.external.creds"))

logger.error("the pd for  interal connector:  "+ systemEnv.getProperty("esv.ad.internal.kyide.creds"))

logger.error("Symantec Issue"+ nodeState.get("responsecode"))
logger.error("Symantec Issue"+ nodeState.get("responsebody"))
logger.error("Symantec Issue"+(nodeState.getObject("objectAttributes")).get("mail"))
logger.error("Symantec Issue"+(nodeState.getObject("objectAttributes")).get("userName"))
nodeState.putShared("securityCode", (nodeState.getObject("objectAttributes")).get("mail"));
nodeState.putShared("Id", "12121111");
nodeState.putShared("CredID","SYMC71914959"); 
nodeState.putShared("credId","SYMC71914959"); 
nodeState.putShared("otp1", (nodeState.getObject("objectAttributes")).get("mail"));
nodeState.putShared("otp2", (nodeState.getObject("objectAttributes")).get("userName"));


outcome = "true";

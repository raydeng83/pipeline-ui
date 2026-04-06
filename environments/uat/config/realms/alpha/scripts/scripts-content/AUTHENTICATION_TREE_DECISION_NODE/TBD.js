/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//logger.error("the pd for connector:  "+ systemEnv.getProperty("esv.ad.external.creds"))

//logger.error("the pd for  interal connector:  "+ systemEnv.getProperty("esv.ad.internal.kyide.creds"))

logger.error("Secret printing:  "+ systemEnv.getProperty("esv.kyid.2b.kogapi.token.clientid"))

logger.error("Secret printin:  "+ systemEnv.getProperty("esv.kyid.2b.kogapi.token"))

//logger.error("Symantec Issue"+ nodeState.get("responsecode"))
//logger.error("Symantec Issue"+ nodeState.get("responsebody"))
//logger.error("Symantec Issue"+(nodeState.getObject("objectAttributes")).get("mail"))
//nodeState.putShared("securityCode", (nodeState.getObject("objectAttributes")).get("mail"));
//nodeState.putShared("Id", "12121111");
//nodeState.putShared("CredID","SYMC71914959"); 

outcome = "true";

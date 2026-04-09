/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//if(systemEnv.getProperty("esv.kyid.mtls.pfx.cert")){
    var esv = systemEnv.getProperty("esv.kyid.mtls.pfx.cert")

        logger.error(" esv value is :: "+ esv)
    //logger.error("the secret  is:: "+systemEnv.getProperty("esv.kyid.kogapi.token.dev.clientid")) 
//}
outcome = "true";

/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


 var isJitRequired = systemEnv.getProperty("esv.isjitrequiredflag");
logger.debug("valueForJitFlag:"+isJitRequired)
    if(isJitRequired)
    { 
        logger.debug("Jit is required");
        nodeState.putShared("isJitRequired", "true");
        action.goTo("true");
    }
    else{
        logger.debug("Jit is not required");
        nodeState.putShared("isJitRequired", "false");
        action.goTo("false");
     
    }
 



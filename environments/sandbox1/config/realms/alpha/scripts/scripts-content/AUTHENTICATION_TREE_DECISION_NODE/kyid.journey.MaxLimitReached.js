/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


logger.error("*******************comming here**************")
//changes
if (callbacks.isEmpty()) {
   //changes
callbacksBuilder.textOutputCallback(1,"Maximum_Limit_Reached")
    logger.error("OTP  validation failed - Max Retry Limit Reached");
    action.goTo("true");
 
} 

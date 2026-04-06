/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.debug("Inside InternalUsersForgotPassword script");
if(callbacks.isEmpty()){
    logger.debug("callbacks empty");
    callbacksBuilder.textOutputCallback(0, "1_Reset password");
    var message = "As per the Commonwealth policy, you can reset your password using the following link."
    callbacksBuilder.textOutputCallback(0, message);
}

outcome = "true";

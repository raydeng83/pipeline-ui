/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

logger.error("the esv value esv.kyid.v2grecaptcha.key : " + systemEnv.getProperty("esv.kyid.v2grecaptcha.key"))
logger.error("the esv value esv.kyid.v2grecaptcha.secret : " + systemEnv.getProperty("esv.kyid.v2grecaptcha.secret"))
//logger.error("the esv value esv-kyid-kogapi-token-clientcredentials : " + systemEnv.getProperty("esv.kyid.kogapi.token.clientcredentials"))
logger.error("the esv value esv.kyid.grecaptcha.key : " + systemEnv.getProperty("esv.kyid.grecaptcha.key"))
logger.error("the esv value esv.kyid.grecaptcha.secret : " + systemEnv.getProperty("esv.kyid.grecaptcha.secret"))




outcome = "true";

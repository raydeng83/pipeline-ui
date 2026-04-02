/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.debug("Inside ForgotPasswordCreateAccountLink script");
if(callbacks.isEmpty()){
    logger.debug("callbacks empty");
    callbacksBuilder.textOutputCallback(0, "1_Let's recover your account");
    var message = "It looks like you are trying to login for the first time on this new login screen. Click create an account to proceed."
    callbacksBuilder.textOutputCallback(0, message);

    //FAQ Topic
        var lib = require("KYID.Library.FAQPages");
    var process ="ForgotPasswordFirstTimeUser";
    var pageHeader= "1_Let's recover your account";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

    if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
}

outcome = "true";

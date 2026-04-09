/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

  logger.error("**************start with existing check**************")

var telephone=nodeState.get("telephoneNumber");
  logger.error("**************Phone NO**************"+telephone)

function lookupInPhone(telephone) {
    //logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
            logger.error("**************entering lookup**************")

    var mfaMethodResponses = openidm.query("managed/alpha_user", { "_queryFilter": '/telephoneNumber eq "' + telephone + '"' });
      logger.error("*************mfaMethodResponses***************"+mfaMethodResponses)

    if (mfaMethodResponses.result.length > 0) {
               logger.error("**************true at mfa**************")

                return true;
            }
}

if(lookupInPhone(telephone)){
        logger.error("**************true**************")

    action.goTo("true")
}
else{
        logger.error("**************false**************")

    action.goTo("false")
}


//callbacksBuilder.textOutputCallback(1,mail);


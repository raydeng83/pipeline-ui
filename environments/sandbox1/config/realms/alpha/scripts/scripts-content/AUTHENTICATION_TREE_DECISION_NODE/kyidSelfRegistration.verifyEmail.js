/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var config = {
  tenantFqdn: "esv.kyid.tenant.fqdn",
  ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
  templateID: "emailOtpTestTemplate",
  nodeName: "kyid.send.email.otp.template",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate"
    
};
var NodeOutcome = {
    PASS: "success",
    FAIL: "fail",
    RESEND: "resend",
    WRONGMAIL:"wrongMail",
    RETRY:"retry"
};

if(callbacks.isEmpty()){
      callbacksBuilder.passwordCallback("One-Time Password", false);
    callbacksBuilder.confirmationCallback(1,0,["Resend","Submit"],1);

  
}
else{
    logger.error("Getting callbacks for the first time");
   var choice = callbacks.getConfirmationCallbacks()[0];
    var otp = callbacks.getPasswordCallbacks()[0];
    // logger.error("Pwd",+pwd);
    // logger.error("Choice"+choice);

    if(choice===0){
        logger.error("Choice = zero resending");
        action.goTo(NodeOutcome.RESEND);
    }
    else if(choice===1){
        var hotp = nodeState.get("hotp");
        logger.error("---------------------HOTP--------------"+hotp)
         logger.error("---------------------OTP--------------"+otp)
        if (otp == hotp) {
            logger.error("otp matched");
            outcome =NodeOutcome.PASS;
        }
        else{
             logger.error("otp error");
            
          //  callbacksBuilder.textOutputCallback(1,"Wrong OTP!! Please try again ");
            action.goTo(NodeOutcome.FAIL);
        }
        
    }
    logger.error("Exit");
    
        }
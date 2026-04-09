/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.error("****************************start email***********************")

var config = {
  tenantFqdn: "esv.kyid.tenant.fqdn",
  ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
  nodeName: "kyid.send.email.otp.template",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyidEmailOtp",
    nodeName: "kyid.send.email.otp.template"
    
};

var NodeOutcome = {
  PASS: "success",
  FAIL: "failure"
};

function sendMail(hotp, mail) {
   try {
        var params =  new Object();
        params.templateName = config.templateID;
        params.to =  mail;
        params.object = {
            "otp": hotp
        };
  
        openidm.action(config.idmEndpoint, config.idmAction, params);
        logger.error("Email send successfully");
        return NodeOutcome.PASS;
    }
    catch (e){
        logger.error("Failed" + e);
        return NodeOutcome.FAIL;
    }
}
    
//var username = nodeState.get("username");

var Secondary_Email =nodeState.get("Secondary_Email");  
nodeState.putShared("Secondary_Email",Secondary_Email);
nodeState.get("KOGId");
//nodeState.putShared("givenName",givenName);
var hotp =nodeState.get("oneTimePassword");  
nodeState.putShared("hotp",hotp);

outcome = sendMail(hotp, Secondary_Email);
logger.error("****************************sent email***********************")

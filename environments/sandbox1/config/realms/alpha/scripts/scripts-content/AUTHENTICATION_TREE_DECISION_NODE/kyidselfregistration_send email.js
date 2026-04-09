/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//outcome = "true";

var config = {
  tenantFqdn: "esv.kyid.tenant.fqdn",
  ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
  //templateID: "emailOtpTestTemplate",
    templateID:"kyidEmailOtp",
  nodeName: "kyid.send.email.otp.template",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate"
    
};

var NodeOutcome = {
  PASS: "success",
  FAIL: "failure"
};

function sendMail(username, hotp, mail, givenName,sn) {
   try {
        var params =  new Object();
        params.templateName = config.templateID;

        params.to =  mail;
        params.object = {
            "givenName": givenName,
            "sn" : sn,
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
var objectAttributes = nodeState.get("objectAttributes")
var username = nodeState.get("mail");
var givenName =objectAttributes.get("givenName"); 
var sn =objectAttributes.get("sn");
var mail =objectAttributes.get("mail");  
//nodeState.putShared("userName",mail);
//nodeState.putShared("username",mail);
nodeState.putShared("mail",mail);
nodeState.putShared("sn",sn);
nodeState.putShared("givenName",givenName);
var hotp =nodeState.get("oneTimePassword");  
nodeState.putShared("hotp",hotp);

outcome = sendMail(username, hotp, mail, givenName,sn);


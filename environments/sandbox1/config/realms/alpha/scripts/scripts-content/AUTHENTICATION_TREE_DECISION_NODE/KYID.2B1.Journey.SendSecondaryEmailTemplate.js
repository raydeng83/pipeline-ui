/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

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
        logger.info("Email send successfully");
       var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
        logger.info(transactionid+"Email OTP Notification sent successfully to "+mail)
        return NodeOutcome.PASS;
    }
    catch (e){
        logger.error("Failed" + e);
           var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
        logger.error(transactionid+"Send Email OTP Notification Failed for"+mail)
        return NodeOutcome.FAIL;
    }
}
    
//var username = nodeState.get("username");
//var objectAttributes = nodeState.get("objectAttributes")
var username = nodeState.get("mail");
var givenName =nodeState.get("givenName");
var sn =nodeState.get("sn");
var mail =nodeState.get("mail");  
var smail=nodeState.get("Secondary_Email")
nodeState.putShared("mail",mail);
nodeState.putShared("sn",sn);
nodeState.putShared("givenName",givenName);
var hotp =nodeState.get("oneTimePassword");  
nodeState.putShared("hotp",hotp);

outcome = sendMail(username, hotp, smail, givenName,sn);

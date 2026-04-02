var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "Send Email OTP",
      script: "Script",
      scriptName: "KYID.2B1.Journey.Registration_Acceptance.SendEmail",
      idmEndpoint: "external/email",
      idmAction: "sendTemplate",
      templateID: "kyid2B1EmailOtpValidation",
      templateIDCreateAccount: "kyid2B1EmailOtpValidationCreateAccount",
      errorId_EmailFailure:"errorID::KYID004",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };

var NodeOutcome = {
  SUCCESS: "success",
  FAILURE: "failure",
  SENDALTERNATEEMAIL: "sendAlternateEmail"
};
  
  
  /**
     * Logging function
     * @type {Function}
     */
  var nodeLogger = {
      // Logs detailed debug messages for troubleshooting  
      debug: function (message) {
          logger.debug(message);
      },
      // Logs Error that can impact Application functionality
      error: function (message) {
          logger.error(message);
      },
      info: function (message) {
          logger.info(message);
      },
      
  };

function getLangCode(code,languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}


// Send Email Function
function sendMail( hotp, mail, givenName,sn,phoneContact,emailContact) {
    var getLanguagePreference = require("KYID.2B1.Library.GenericUtils")
   try {
        var params =  new Object();
        var lang = null; 
        var langCode = nodeState.get("languagePreference") || "1";
        var languageMap =systemEnv.getProperty("esv.language.preference");
        logger.debug("langCode is :: "+ langCode);
        logger.debug("languageMap is :: "+ languageMap)
       
     //logger.debug("givenName === null || sn === null = "+givenName === null || sn === null);
       if(givenName === null || sn === null) {
            params.templateName = nodeConfig.templateIDCreateAccount;
           //params.templateName =null;
       } else {
           //params.templateName =null;
           params.templateName = nodeConfig.templateID;
       }
        
        lang = getLangCode(langCode,languageMap);
        logger.debug("lang is :: "+lang)
        //lang = nodeState.get("userLanguage") || "en"
        params.to =  mail;
        params._locale = lang;
        params.object = {
            "givenName": givenName,
            "sn" : sn,
            "otp": hotp,
            "phoneContact":phoneContact,              
            "emailContact":emailContact
        };
        openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
        nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Email OTP Notification sent successfully to"+"::"+mail );
        return true;
       
    }
    catch (error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Send Email OTP Notification Failed for"+"::"+mail+"::"+"::"+nodeConfig.errorId_EmailFailure+"::"+error );
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"SMTP: Email notification not triggered"+"::"+mail+"::"+"::"+nodeConfig.errorId_EmailFailure+"::"+error );
        nodeState.putShared("emailOTPFailed","true");
        return true;
    }
}

 try{
    var appName = "KYID Helpdesk";
    var eventName;
    var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact",{_queryFilter: 'name eq "' + appName + '"'},["phoneContact", "emailContact"]); 
    //logger.debug("Result = "+ userQueryResult2);
    nodeState.putShared("phoneContact",userQueryResult2.result[0].phoneContact[0].phoneNumber)
    nodeState.putShared("emailContact",userQueryResult2.result[0].emailContact[0].emailAddress)
    var phoneContact = nodeState.get("phoneContact"); 
      var emailContact = nodeState.get("emailContact"); 
    //logger.debug("phone contact = "+userQueryResult2.result[0].phoneContact[0].phoneNumber);
    //logger.debug("email contact = "+userQueryResult2.result[0].emailContact[0].emailAddress);

}      
     catch(error){
      logger.error("Error in catch of helpdesk retrieval :: => "+ error);
     }   

try{
    var sn = null;
      var givenName = null;
    // defect 214936 fix
    if(nodeState.get("lastName") != null && nodeState.get("firstName") != null){
        sn = nodeState.get("lastName");   
        givenName = nodeState.get("firstName");
    }
    logger.debug("sn : "+sn);
    logger.debug("givenName : "+givenName);

    var hotp = nodeState.get("oneTimePassword");  
    nodeState.putShared("hotp",hotp);
    logger.debug("hotp primary email: "+hotp);


    /////////////////////
if(nodeState.get("primary_secondary_email") == true && nodeState.get("primary_secondary_email") != null){
logger.debug("primaryEmailComplete : "+nodeState.get("primaryEmailComplete"));
if(nodeState.get("primaryEmailComplete") === true || (nodeState.get("resend_alternate_mail") === true && nodeState.get("resend_alternate_mail") != null)){
    logger.debug("inside primaryEmailSent true")
    var email = nodeState.get("alternatemail");
    logger.debug("email 1 : "+email);
    var hotp = nodeState.get("oneTimePassword");  
    logger.debug("hotp : "+hotp);
    nodeState.putShared("alternatemailhotp",hotp);
    var sendemail = sendMail(hotp, email, givenName, sn, phoneContact, emailContact);
    logger.debug("sendemail response 1"+sendemail);
    if(sendemail == true){
         outcome = "success";
    } else{
        outcome = "failure";
    }
} else if(nodeState.get("primaryEmailComplete") === null || (nodeState.get("resend_primary_mail") === true && nodeState.get("resend_primary_mail") != null)){
    logger.debug("inside primaryEmailSent false")
    var email = nodeState.get("mail");
     logger.debug("email 2 : "+email);
    var hotp = nodeState.get("oneTimePassword");  
    logger.debug("hotp : "+hotp);
    nodeState.putShared("primaryemailhotp",hotp);
    var sendemail = sendMail(hotp, email, givenName, sn, phoneContact, emailContact);
    logger.debug("sendemail response 2"+sendemail);
    nodeState.putShared("primaryEmailComplete", true);
    if(sendemail == true){
        outcome = "verifyPrimaryEmail";
    } else{
        outcome = "failure";
    }
}

     } else{ 
        //registration journey logic
        logger.debug("primary_secondary_email false in send primary mail")
        // var username = nodeState.get("mail");
        var alternateEmail = null;
        var collectedPrimaryEmail = null;
        var addtionalEmailFlag = "false";
        eventName = "createAccount";
        if(nodeState.get("addtionalEmailFlag") != null ){
            addtionalEmailFlag =nodeState.get("addtionalEmailFlag");
        }
        if(nodeState.get("alternateEmail") != null ){
            alternateEmail =nodeState.get("alternateEmail");
        }
        if(addtionalEmailFlag == "true"){
            var email=nodeState.get("alternateEmail")
        }
        else if (nodeState.get("collectedPrimaryEmail") != null){
            collectedPrimaryEmail = nodeState.get("collectedPrimaryEmail");
            var email =collectedPrimaryEmail;
            
        }
        else{
            var email = nodeState.get("mail")
        }
        var sendmail = sendMail( hotp, email, givenName,sn, phoneContact, emailContact);
        if(sendmail == true){
            outcome = "success";
        } else{
            outcome = "failure";
        }
    }
}catch(error){
    logger.error("Exception in send otp main : "+error);
   // action.goTo(NodeOutcome.FAILURE);
    outcome = "failure";
}

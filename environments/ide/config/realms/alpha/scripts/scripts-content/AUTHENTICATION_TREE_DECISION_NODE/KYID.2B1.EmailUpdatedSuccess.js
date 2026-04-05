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
    }
}

var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var nodeConfig = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyid2B1UserEmailChange",
    begin: "Beginning Node Execution",
    node: "Node",
    script: "Script",
    scriptName: "KYID.2B1.ReadContextDetails",
    errorId_NotificationFailed:"errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
  };

var NodeOutcome = {
    TRUE: "true"
};

function getLangCode(code,languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}

function sendMail(mail,oldMail,newMail, givenName,lastName, phoneContact, emailContact) {
     try {
         var params =  new Object();
         var lang = null; 
         var langCode = nodeState.get("languagePreference") || "1";
         var languageMap =systemEnv.getProperty("esv.language.preference");
         lang = getLangCode(langCode,languageMap);
         params.templateName = nodeConfig.templateID;
         params.to =  mail;
         params._locale = lang;
         params.object = {
              "oldMail":oldMail,
              "newMail":newMail,
              "givenName":givenName,
              "lastName":lastName,
            "phoneContact":phoneContact,              
            "emailContact":emailContact
         };
    
          openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
          nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email OTP Notification sent successfully to ::"+ mail);
          return NodeOutcome.TRUE;
      }
      catch (error){
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
          return NodeOutcome.TRUE;
      }
  }

//main Execution
logger.debug("Entering main");
var isHelpDesk = nodeState.get("isHelpDesk");
logger.debug("isHelpdesk Is" + isHelpDesk);
// if (isHelpDesk === true || isHelpDesk === "true")
// {
var userName =nodeState.get("usrKOGID");
logger.debug("userName Is" + userName);

var givenName="";
var lastName="";

 if (userName) {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + userName + '"'
        }, []);
    }
    var user = userQueryResult.result[0]

    logger.debug("reading user attributes from FetchUserInfoforManageProfile" + user)
    if (user) {

         givenName = user.givenName;
         lastName = user.sn;
 }

try{
    var appName = "KYID Helpdesk";
    var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact",{_queryFilter: 'name eq "' + appName + '"'},["phoneContact", "emailContact"]); 
    nodeState.putShared("phoneContact",userQueryResult2.result[0].phoneContact[0].phoneNumber)
    nodeState.putShared("emailContact",userQueryResult2.result[0].emailContact[0].emailAddress)
    var phoneContact = nodeState.get("phoneContact"); 
      var emailContact = nodeState.get("emailContact"); 

}      
     catch(error){
      logger.error("Error in catch of helpdesk retrieval :: => "+ error);
     }   

logger.debug("givenName Is" + givenName);
logger.debug("lastName Is" + lastName);

var oldMFAEmailValue = nodeState.get("mail");
logger.debug("Old Mail: " + oldMFAEmailValue);
var newMFAEmailValue = nodeState.get("newemail1");
logger.debug("New Mail: " + newMFAEmailValue);
var isHelpDesk =nodeState.get("isHelpDesk");
logger.debug("isHelpDesk:" + isHelpDesk);
var outcomeOldEmail = sendMail(oldMFAEmailValue,oldMFAEmailValue,newMFAEmailValue,givenName,lastName, phoneContact, emailContact);
var outcomeNewEmail = sendMail(newMFAEmailValue, oldMFAEmailValue,newMFAEmailValue,givenName,lastName, phoneContact, emailContact);

logger.debug("outcomeNewEmail: " + outcomeNewEmail);

if (outcomeNewEmail === NodeOutcome.TRUE && outcomeOldEmail === NodeOutcome.TRUE) {
    logger.debug("True : " + outcomeNewEmail);
    nodeState.putShared("validationErrorCode","email_updated_successfully");
    outcome = "true";
}
logger.debug("else : " + outcomeNewEmail);
// } else {
   nodeState.putShared("validationErrorCode","email_updated_successfully");
   outcome = "true";
   
// }


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
    templateID: "kyid2B1ResetPassword", 
    begin: "Beginning Node Execution",
    node: "Node",
    script: "Script",
    scriptName: "KYID.2B1.EmailPasswordReset",
    errorId_NotificationFailed:"errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
  };
var convertTime = require("KYID.2B1.Library.ConvertDateTimeFormat");
//kyid2B1MfaAdded kyid2B1ResetPassword 
var NodeOutcome = {
    TRUE: "true"
};


function getLangCode(code,languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}

function sendMail(mail,date, givenName,lastName,phoneContact,emailContact) {
     try {
          var params =  new Object();
          var lang = null; 
          var langCode = nodeState.get("languagePreference") || "1";
          // logger.debug("langCode is :: "+ langCode);
          var languageMap =systemEnv.getProperty("esv.language.preference");
          // logger.debug("languageMap is :: "+ languageMap)
          lang = getLangCode(langCode,languageMap);
          logger.debug("lang is :: "+lang)
          params.templateName = nodeConfig.templateID;
          var easternTimeStamp = convertTime.isoToEastern();
          params.to =  mail;
          params._locale = lang;
          params.object = {
              "mail":mail,
              "date":easternTimeStamp,
              "givenName":givenName,
              "lastName":lastName,
            "phoneContact":phoneContact,              
            "emailContact":emailContact
          };
    
          openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
          //nodeLogger.debug(transactionid+"Email OTP Notification sent successfully to "+mail)
          nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email OTP Notification sent successfully to ::"+ mail);
          return NodeOutcome.TRUE;
      }
      catch (error){
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
          return NodeOutcome.TRUE;
      }
  }



function getDate() {
     try {
    var today = new Date();
    var month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-based, so +1
    var day = String(today.getDate()).padStart(2, '0');
    var year = today.getFullYear();
    return `${month}-${day}-${year}`;
    
     }catch (error){
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
          //return "false";
      }
}


//main Execution
 logger.debug("Entering main");

 var date=getDate();
logger.debug("getDate "+ date);

var userName =nodeState.get("KOGID");
logger.debug("userName Is" + userName);
 nodeState.putShared("username",userName);

var mail =nodeState.get("mail");
logger.debug("mail Is" + mail);

var givenName="";
var lastName="";


 if (userName) {
    var userQueryResult = openidm.query("managed/alpha_user", {"_queryFilter": 'userName eq "' + userName + '"'}, [""])}
    var user = userQueryResult.result[0]

    logger.debug("reading user attributes from FetchUserInfoforManageProfile" + user)
    if (user) {

         givenName = user.givenName;
         lastName = user.sn;
        nodeState.putShared("_id",user._id);
        
 }

logger.debug("givenName Is" + givenName);
logger.debug("lastName Is" + lastName);


try{
    var appName = "KYID Helpdesk";
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


var outcomeEmail = sendMail(mail,date,givenName,lastName,phoneContact,emailContact);
logger.debug("outcomeEmail Is" + outcomeEmail);

if (outcomeEmail === NodeOutcome.TRUE ) {
 
    //nodeState.putShared("validationErrorCode","email_updated_successfully");
    outcome = "true";
} else {
   //nodeState.putShared("validationErrorCode","email_updated_successfully");
   outcome = "true";
}


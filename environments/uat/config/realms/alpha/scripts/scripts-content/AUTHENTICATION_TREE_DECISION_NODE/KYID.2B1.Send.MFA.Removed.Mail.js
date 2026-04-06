//var _ = require('lib/lodash');
//var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var convertTime = require("KYID.2B1.Library.ConvertDateTimeFormat");
var auditLib = require("KYID.2B1.Library.AuditLogger")

var nodeConfig = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.mfa.removed.template",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyid2B1MfaRemoved" ,
    begin: "Beginning Node Execution",
    node: "Node",
    // nodeName: "Read Enrollement Context Details",
    script: "Script",
    scriptName: "KYID.2B1.Send.MFA.Removed.Mail",
    errorId_NotificationFailed:"errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
    PASS: "success",
    FAIL: "failure"
  };
logger.debug(nodeState.get("removeMfaMethod"))

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

function getLangCode(code,languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}

function sendMail(mail, givenName,sn,mfaMethod,phoneContact,emailContact) {
     try {
          var params =  new Object();
          var lang = null; 
          var langCode = nodeState.get("languagePreference") || "1";
          var languageMap =systemEnv.getProperty("esv.language.preference");
          logger.debug("langCode is :: "+ langCode);
          logger.debug("languageMap is :: "+ languageMap)
          var easternTimeStamp = convertTime.isoToEastern();
          lang = getLangCode(langCode,languageMap);
          logger.debug("lang is :: "+lang)
          params.templateName = nodeConfig.templateID;
          params.to =  mail;
          params._locale = lang;
          params.object = {
              "givenName": givenName,
              "sn" : sn,
              "mail" : mail,
              "timeStamp": easternTimeStamp,
              "MFAMethod": mfaMethod,
              "phoneContact":phoneContact,              
              "emailContact":emailContact
          };
         logger.debug("Values for mail: "+JSON.stringify(params.object));
          openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
          nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email OTP Notification sent successfully to ::"+ mail);
          
         return NodeOutcome.PASS;
      }
      catch (error){
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
          return NodeOutcome.FAIL;
      }
  }

function getUserDetails(userId){
    try{
      var userQueryResult = openidm.query("managed/alpha_user",{_queryFilter: 'userName eq "' + userId + '"'},["mail", "sn", "givenName"]); 
      nodeState.putShared("mail",userQueryResult.result[0].mail)
      nodeState.putShared("givenName",userQueryResult.result[0].givenName)
      nodeState.putShared("sn",userQueryResult.result[0].sn) 
try{
    var appName = "KYID Helpdesk";
    var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact",{_queryFilter: 'name eq "' + appName + '"'},["phoneContact", "emailContact"]); 
    nodeState.putShared("phoneContact",userQueryResult2.result[0].phoneContact[0].phoneNumber)
    nodeState.putShared("emailContact",userQueryResult2.result[0].emailContact[0].emailAddress)
    
    logger.debug("email contact = "+userQueryResult2.result[0].emailContact[0].emailAddress);

}      
     catch(error){
      logger.error("Error in catch of helpdesk retrieval :: => "+ error);}   
    }catch(error){
      logger.error("Error in catch of main :: => "+ error)
    }


}

// main execution
function main(){
    try{
        var givenName =nodeState.get("givenName");
        var sn =nodeState.get("lastName");
        var mail = nodeState.get("mail");
        logger.debug("EmailAddressInSendEmail:"+nodeState.get("mail"));
        var mfaMethod = null;
        mfaMethod = nodeState.get("removeMfaMethod");
        logger.debug("Node:State = "+nodeState);
        var userId = nodeState.get("userId");
        logger.debug("userID is :: =>"+nodeState.get("userId") )
        var usrKOGID = nodeState.get("KOGID");
        var op = getUserDetails(usrKOGID);
        logger.debug(userId+" "+nodeState.get("givenName") +" "+nodeState.get("sn") +" "+nodeState.get("mail")+" "+mfaMethod+" "+nodeConfig.timestamp);

     //   auditLib.auditLogger("MFA001",sessionDetails,"MFA Method Removal Success", eventDetails, requesterUserId, userId, transactionid, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
       //  auditLog("MFA001", "MFA Method Removal Success");
         if (mfaMethod == "SMSVOICE")
        {
            //mfa Method is SMS Voice Hence Sending Phone Number in the Confirmation Email
            mfaMethod = "Phone number";
        }
        else if (mfaMethod == "SECONDARY_EMAIL"){
            mfaMethod = "Alternate Email"
        }
        else if (mfaMethod == "PUSH"){
            mfaMethod = "Forgerock Authenticator - PUSH"
        }
        else if(mfaMethod == "TOTP"){
            var authenticator = nodeState.get("removeMFAValue");
            if (authenticator == "FORGEROCK"){
                mfaMethod = "Forgerock Authenticator - TOTP";
            }
            else if (authenticator == "GOOGLE"){
                mfaMethod = "Google Authenticator - TOTP";
            }
            else if (authenticator == "MICROSOFT"){
                mfaMethod = "Microsoft Authenticator - TOTP";
            }
        }
        else if (mfaMethod == "SYMANTEC"){
            mfaMethod = "Symantec VIP";
        }
        outcome = sendMail( nodeState.get("mail"), nodeState.get("givenName"), nodeState.get("sn"),mfaMethod,nodeState.get("phoneContact"),nodeState.get("emailContact"));        
    }catch(error){
        logger.error("Error in catch of main :: => "+ error)
    }
}



main();

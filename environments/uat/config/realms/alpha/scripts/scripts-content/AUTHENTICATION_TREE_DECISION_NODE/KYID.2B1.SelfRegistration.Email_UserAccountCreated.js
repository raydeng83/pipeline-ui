var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
//var url = systemEnv.getProperty("esv.portal.url");

var nodeConfig = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.accountcreate.template",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyid2B1CreateAccountWelocomeEmailTemplate" ,
    begin: "Beginning Node Execution",
    node: "Node",
    // nodeName: "Read Enrollement Context Details",
    script: "Script",
    scriptName: "KYID.2B1.ReadContextDetails",
    errorId_NotificationFailed:"errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
    PASS: "success"
  };

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

function sendMail(mail, givenName,sn, phoneContact, emailContact) {
    var getLanguagePreference = require("KYID.2B1.Library.GenericUtils")
     try {
          var params =  new Object();
          var lang = null; 
          var langCode = nodeState.get("languagePreference") || "1";
          var languageMap =systemEnv.getProperty("esv.language.preference");
          logger.debug("langCode is :: "+ langCode);
          logger.debug("languageMap is :: "+ languageMap)

          lang = getLangCode(langCode,languageMap);
          logger.debug("lang is :: "+lang)
         
          params.templateName = nodeConfig.templateID;
          params.to =  mail;
          params._locale = lang;
          params.object = {
              "givenName": givenName,
              "sn" : sn,
              "mail" : mail,
              "phoneContact":phoneContact
          };
    
          openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
          // nodeLogger.error(transactionid+"Email OTP Notification sent successfully to "+mail)
          nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email OTP Notification sent successfully to ::"+ mail);
          return NodeOutcome.PASS;
      }
      catch (error){
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
          return NodeOutcome.PASS;
      }
  }


// main execution
    var appName = "KYID Helpdesk";
     var userQueryResult = openidm.query("managed/alpha_kyid_helpdeskcontact",{_queryFilter: 'name eq "' + appName + '"'},["phoneContact", "emailContact"]);
    nodeState.putShared("phoneContact",userQueryResult.result[0].phoneContact[0].phoneNumber)
    nodeState.putShared("emailContact",userQueryResult.result[0].emailContact[0].emailAddress)
var phoneContact = nodeState.get("phoneContact"); 
  var emailContact = nodeState.get("emailContact"); 
  var givenName =nodeState.get("givenName");
  var sn =nodeState.get("lastName");
  var mail = nodeState.get("verifiedPrimaryEmail");
  outcome = sendMail(mail, givenName,sn, phoneContact, emailContact);
  action.goTo(outcome);
  
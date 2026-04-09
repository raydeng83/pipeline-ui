//var _ = require('lib/lodash');
//var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var convertTime = require("KYID.2B1.Library.ConvertDateTimeFormat");
var auditLib = require("KYID.2B1.Library.AuditLogger")

var nodeConfig = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.appenroll",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyid2B1RidpAppEnrollment" ,
    begin: "Beginning Node Execution",
    node: "Node",
    // nodeName: "Read Enrollement Context Details",
    script: "Script",
    scriptName: "KYID.2B1.Send.Mail.AppEnroll",
    errorId_NotificationFailed:"errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
    PASS: "success",
    FAIL: "failure"
  };
logger.debug(nodeState.get("_id"))
var userId = nodeState.get("_id");

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

  function sendMail(mail, givenName,sn,phoneContact,emailContact) {
      // var changeLog = nodeState.get("changeLog") || "";
     try {
          var params =  new Object();
          var lang = null; 
          var langCode = nodeState.get("languagePreference") || "1";
          logger.debug("langCode is :: "+ langCode);
          var languageMap =systemEnv.getProperty("esv.language.preference");
          logger.debug("languageMap is :: "+ languageMap)
          lang = getLangCode(langCode,languageMap);
          var easternTimeStamp = convertTime.isoToEastern();
          params.templateName = nodeConfig.templateID;
         
          
          params.to =  mail;
          params._locale = lang;
          // params.object = {
          //     "givenName": givenName,
          //     "sn" : sn,
          //     "mail" : mail,
          //     "timeStamp": easternTimeStamp,
          //     "phoneContact":phoneContact,              
          //     "emailContact":emailContact,
          //     "changeList":getHTMLChangeLog(),
          // };
          params.object = {
              "givenName": givenName,
              "sn" : sn,
              "mail" : mail,
              "timeStamp": easternTimeStamp,
              "phoneContact":phoneContact,              
              "emailContact":emailContact,
          };
         logger.debug("Values for mail: "+JSON.stringify(params.object));
        //nodeLogger.info(params.object);
          openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
          // nodeLogger.error(transactionid+"Email OTP Notification sent successfully to "+mail)
          nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email OTP Notification sent successfully to ::"+ mail);
          
         return NodeOutcome.PASS;
      }
      catch (error){
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
          return NodeOutcome.FAIL;
      }
  }

function getHTMLChangeLog(){
    try {
        var html;
        logger.error("changelog is --> "+ nodeState.get("changeLog"))
        if(nodeState.get("changeLog")){
            html = `<ul>`
            var changeLog = JSON.parse(nodeState.get("changeLog"))
            
            
            for (var i = 0; i < changeLog.length; i++) {
                var item = changeLog[i];
                
                // Rhino-safe way to get keys and values
                for (var key in item) {
                    if (item.hasOwnProperty(key)) {
                        html += `<li>Your <b>${key}</b> was updated to <b>${item[key]}</b>.</li>`
                    }
                }
            }
            
            html += `</ul>`;
        }
        return html
        
    } catch (error) {
        return ""
    }
}

function getUserDetails(userId){
    try{
        var params = {
                "_queryFilter": '_id eq "' + userId + '"'
        };
        var fields = ["mail", "sn", "givenName"];
        var userQueryResult = openidm.query("managed/alpha_user", params, fields);
        if (userQueryResult.result && userQueryResult.result.length > 0) {
            var fn = userQueryResult.result[0].givenName || "";
            var sn = userQueryResult.result[0].sn || "";
            var mail = userQueryResult.result[0].mail || "";

          nodeState.putShared("mail",mail)
          nodeState.putShared("givenName",fn)
          nodeState.putShared("sn",sn) 
        }
    } catch(error){
      logger.error("Error in catch of main :: => "+ error)
    }
           
    try{
        var appName = "KYID Helpdesk";
        var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact",{_queryFilter: 'name eq "' + appName + '"'},["phoneContact", "emailContact"]); 
        //logger.error("Result = "+ userQueryResult2);
        nodeState.putShared("phoneContact",userQueryResult2.result[0].phoneContact[0].phoneNumber)
        nodeState.putShared("emailContact",userQueryResult2.result[0].emailContact[0].emailAddress)
        logger.debug("email contact = "+userQueryResult2.result[0].emailContact[0].emailAddress);
    
    }      
     catch(error){
      logger.error("Error in catch of helpdesk retrieval :: => "+ error);
    }       

}

// main execution
function main(){
    try{
        var givenName =nodeState.get("givenName");
        var sn =nodeState.get("lastName");
        var mail = nodeState.get("mail");
        logger.debug("EmailAddressInSendEmail:"+nodeState.get("mail"));
        
        logger.debug("Node:State = "+nodeState);
        
        var op = getUserDetails(userId);
        logger.debug(userId+" "+nodeState.get("givenName") +" "+nodeState.get("sn") +" "+nodeState.get("mail")+" "+nodeConfig.timestamp);

        outcome = sendMail( nodeState.get("mail"), nodeState.get("givenName"), nodeState.get("sn"),nodeState.get("phoneContact"),nodeState.get("emailContact"));        
    }catch(error){
        logger.error("Error in catch of main :: => "+ error)
    }
}
main();

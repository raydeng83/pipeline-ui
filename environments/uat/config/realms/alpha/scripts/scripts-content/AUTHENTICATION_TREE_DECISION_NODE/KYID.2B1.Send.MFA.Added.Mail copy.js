//var _ = require('lib/lodash');
//var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
var dateTime = new Date().toISOString();
var convertTime = require("KYID.2B1.Library.ConvertDateTimeFormat");
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var nodeConfig = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.mfa.added.template",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyid2B1MfaAdded" ,
    begin: "Beginning Node Execution",
    node: "Node",
    // nodeName: "Read Enrollement Context Details",
    script: "Script",
    scriptName: "KYID.2B1.Send.MFA.Added.Mail",
    errorId_NotificationFailed:"errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
    PASS: "success",
    FAIL: "failure"
  };
logger.error(nodeState.get("MFAMethod"))

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

  function sendMail(mail, givenName,sn,mfaMethod,phoneContact,emailContact) {
     try {
          logger.error("ISO time" +nodeConfig.timestamp);
          var easternTimeStamp = convertTime.isoToEastern();
          var params =  new Object();
          params.templateName = nodeConfig.templateID;
          params.to =  mail;
          params.object = {
              "givenName": givenName,
              "sn" : sn,
              "mail" : mail,
              "timeStamp": easternTimeStamp,
              "MFAMethod": mfaMethod,
              "phoneContact":phoneContact,              
              "emailContact":emailContact
          };
         logger.info("Values for mail: "+JSON.stringify(params.object));
        //nodeLogger.info(params.object);
          openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
          // nodeLogger.error(transactionid+"Email OTP Notification sent successfully to "+mail)
          nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email OTP Notification sent successfully to ::"+ mail);
          return NodeOutcome.PASS;
      }
      catch (error){
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
          return NodeOutcome.PASS;
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
    //logger.error("Result = "+ userQueryResult2);
    nodeState.putShared("phoneContact",userQueryResult2.result[0].phoneContact[0].phoneNumber)
    nodeState.putShared("emailContact",userQueryResult2.result[0].emailContact[0].emailAddress)
    //logger.error("phone contact = "+userQueryResult2.result[0].phoneContact[0].phoneNumber);
    //logger.error("email contact = "+userQueryResult2.result[0].emailContact[0].emailAddress);

}      
     catch(error){
      logger.error("Error in catch of helpdesk retrieval :: => "+ error);
     }   
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
        var mfaMethod = null;
        mfaMethod = nodeState.get("MFAMethod");
        var usrKOGID = nodeState.get("KOGID");
        var op = getUserDetails(usrKOGID);
        logger.error(usrKOGID+" "+nodeState.get("givenName") +" "+nodeState.get("sn") +" "+nodeState.get("mail")+" "+mfaMethod+" "+nodeConfig.timestamp);
        var res = sendMail( nodeState.get("mail"), nodeState.get("givenName"), nodeState.get("sn"),mfaMethod,nodeState.get("phoneContact"),nodeState.get("emailContact"));
        action.goTo(res)
    }catch(error){
        logger.error("Error in catch of main :: => "+ error)
    }
}
main();

//var _ = require('lib/lodash');
//var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
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

  function sendMail(mail, givenName,sn,mfaMethod) {
     try {
          var params =  new Object();
          params.templateName = nodeConfig.templateID;
          params.to =  mail;
          params.object = {
              "givenName": givenName,
              "sn" : sn,
              "mail" : mail,
              "timeStamp": nodeConfig.timestamp,
              "MFAMethod": mfaMethod
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
          return NodeOutcome.FAIL;
      }
  }

function getUserDetails(userId){
    try{
      var userQueryResult = openidm.query("managed/alpha_user",{_queryFilter: 'userName eq "' + userId + '"'},["mail", "sn", "givenName"]); 
      nodeState.putShared("mail",userQueryResult.result[0].mail)
      nodeState.putShared("givenName",userQueryResult.result[0].givenName)
      nodeState.putShared("sn",userQueryResult.result[0].sn)       
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
        mfaMethod = nodeState.get("removeMfaMethod");
        logger.debug("Node:State = "+nodeState);
        var userId = nodeState.get("userId");
        logger.debug("userID is :: =>"+nodeState.get("userId") )
        var usrKOGID = nodeState.get("KOGID");
        var op = getUserDetails(usrKOGID);
        logger.debug(userId+" "+nodeState.get("givenName") +" "+nodeState.get("sn") +" "+nodeState.get("mail")+" "+mfaMethod+" "+nodeConfig.timestamp);
        outcome = sendMail( nodeState.get("mail"), nodeState.get("givenName"), nodeState.get("sn"),mfaMethod);        
    }catch(error){
        logger.error("Error in catch of main :: => "+ error)
    }
}
main();

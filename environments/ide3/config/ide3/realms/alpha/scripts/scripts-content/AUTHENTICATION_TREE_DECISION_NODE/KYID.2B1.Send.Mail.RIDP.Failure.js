//var _ = require('lib/lodash');
//var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var convertTime = require("KYID.2B1.Library.ConvertDateTimeFormat");
var auditLib = require("KYID.2B1.Library.AuditLogger")

var nodeConfig = {
    tenantFqdn: "esv.kyid.tenant.fqdn",
    ACCESS_TOKEN_STATE_FIELD: "idmAccessToken",
    nodeName: "kyid.send.email.ridp.failure",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateID: "kyid2B1RidpFailure" ,
    begin: "Beginning Node Execution",
    node: "Node",
    // nodeName: "Read Enrollement Context Details",
    script: "Script",
    scriptName: "KYID.2B1.Send.Mail.RIDP.Failure",
    errorId_NotificationFailed:"errorID::KYID018",
    timestamp: dateTime,
    end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
    PASS: "success",
    FAIL: "failure"
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

  function sendMail(mail, givenName,sn,verifMethod,reason,phoneContact,emailContact) {
     try {
          var params =  new Object();
          var easternTimeStamp = convertTime.isoToEastern();
          params.templateName = nodeConfig.templateID;
          params.to =  mail;
          params.object = {
              "givenName": givenName,
              "sn" : sn,
              "mail" : mail,
              "timeStamp": easternTimeStamp,
              "verificationType":verifMethod,
              "failureReason":reason,
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
    //logger.error("Result = "+ userQueryResult2);
    nodeState.putShared("phoneContact",userQueryResult2.result[0].phoneContact[0].phoneNumber)
    nodeState.putShared("emailContact",userQueryResult2.result[0].emailContact[0].emailAddress)
    logger.debug("phone contact = "+userQueryResult2.result[0].phoneContact[0].phoneNumber);
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
        if(nodeState.get("KOGID")!== null && nodeState.get("KOGID")){
        var usrKOGID = nodeState.get("KOGID");   
                }
        var verifMethod = null;
        verifMethod = nodeState.get("RIDPMethodUsed");
        logger.debug("Method called: " +nodeState.get("RIDPMethodUsed"));
        logger.debug("EmailAddressInSendEmail:"+nodeState.get("mail"));
        
        logger.debug("Node:State = "+nodeState);

        var reason = "Unable to verify identity due to invalid inputs"
        
        var op = getUserDetails(usrKOGID);
        logger.debug(userId+" "+nodeState.get("givenName") +" "+nodeState.get("sn") +" "+nodeState.get("mail")+" "+verifMethod+" "+ reason + " " +nodeConfig.timestamp);

        outcome = sendMail( nodeState.get("mail"), nodeState.get("givenName"), nodeState.get("sn"),verifMethod,reason,nodeState.get("phoneContact"),nodeState.get("emailContact"));        
    }catch(error){
        logger.error("Error in catch of main :: => "+ error)
    }
}
main();

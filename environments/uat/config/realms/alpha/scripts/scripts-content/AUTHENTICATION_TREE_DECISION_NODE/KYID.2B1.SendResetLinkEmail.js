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
    templateID: "kyid2BResetPassword",
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

function sendMail(mail, givenName,lastName) {
     try {
          var params =  new Object();
          params.templateName = nodeConfig.templateID;
          params.to =  mail;
          params.object = {
              "mail":mail,
              "givenName":givenName,
              "lastName":lastName
          };
    
          openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
          nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Email OTP Notification sent successfully to ::"+ mail);
          return NodeOutcome.TRUE;
      }
      catch (error){
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " ::"+"error occurred while sendting email notification"+"::"+ error);
          return NodeOutcome.TRUE;
      }
  }

//main Execution
logger.debug("Entering main");
var userName =nodeState.get("KOGID");
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

logger.debug("givenName Is" + givenName);
logger.debug("lastName Is" + lastName);

var emailValue = nodeState.get("mail");

logger.debug("isHelpDesk:" + isHelpDesk);
var outcomeOldEmail = sendMail(emailValue,givenName,lastName);

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


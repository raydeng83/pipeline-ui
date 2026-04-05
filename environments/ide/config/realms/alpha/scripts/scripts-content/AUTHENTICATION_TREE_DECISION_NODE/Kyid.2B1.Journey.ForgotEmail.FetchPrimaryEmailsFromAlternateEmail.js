var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

 var lib = require("KYID.Library.FAQPages");
 var process ="AccountRecovery";
 var pageHeader= "3_account_recovery";
var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
var auditLib = require("KYID.2B1.Library.AuditLogger")

//Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Account Recovery Forgot Email",
    script: "Script",
    scriptName: "kyid.2B1.Journey.ForgotEmail.FetchPrimaryEmailsFromAlternateEmail",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: true
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
    }
};


var userId = null;
var headerName = "X-Real-IP";
var headerValues = requestHeaders.get(headerName); 
var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
var browser = requestHeaders.get("user-agent"); 
var os = requestHeaders.get("sec-ch-ua-platform"); 

var eventDetails = {};
eventDetails["IP"] = ipAdress;
eventDetails["Browser"] = browser;
eventDetails["OS"] = os;
eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") ||  nodeState.get("alternateEmail") || "";

  var sessionDetails = {}
        var sessionDetail = null
        if(nodeState.get("sessionRefId")){
            sessionDetail = nodeState.get("sessionRefId") 
            sessionDetails["sessionRefId"] = sessionDetail
        }else if(typeof existingSession != 'undefined'){
            sessionDetail = existingSession.get("UserId")
            sessionDetails["sessionRefId"] = sessionDetail
        }else{
             sessionDetails = {"sessionRefId": ""}
        }
    
var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

function fecthPrimaryEmail(){
   
   if(nodeState.get("alternateEmail")) {
        
    var altEmail=nodeState.get("alternateEmail");
    var emailList=[]; 
   var queryFilter = 'MFAMethod eq "SECONDARY_EMAIL" and MFAStatus eq "ACTIVE" and  MFAValue eq "' + altEmail + '"';
       
    var querKOGIdResult= openidm.query("managed/alpha_kyid_mfa_methods",{
        "_queryFilter": queryFilter,
        "_fields": "KOGId"
    });

    logger.debug("querKOGIdResult:"+querKOGIdResult.result);
    
   
    if(querKOGIdResult && querKOGIdResult.result && querKOGIdResult.result.length>0){
      //logger.error("Inside_second_query");
      nodeState.putShared("PrimaryEmailFlag",true);
       for (var i=0; i< querKOGIdResult.result.length; i++){
           
           var queryEmailResult= openidm.query("managed/alpha_user",{
        "_queryFilter":'userName eq "'+querKOGIdResult.result[i].KOGId+'"',
        "_fields": "mail"
        });
        logger.debug("queryEmailResult:"+queryEmailResult.result);
          if (queryEmailResult.result.length === 0) {
                    logger.debug("queryEmailResult is empty, skipping value retrieval.");
                } else {
                    emailList.push(queryEmailResult.result[0].mail)

                }
    }

        if(emailList.length>0){
             nodeState.putShared("ListOfPrimaryEmails",emailList);
            //auditLib.auditLogger("VER007",sessionDetails,"Validate Alternate Email", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
           // auditLib.auditLogger("ACR001",sessionDetails,"Primary Email Address Recovery", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId)
        }
        else{
            nodeState.putShared("PrimaryEmailFlag",false);
            nodeState.putShared("ListOfPrimaryEmails",null);
            auditLog("ACR002","Account Recovery Failure");
        }
           
    }
    logger.debug("ListOfPrimaryEmails:"+JSON.stringify(emailList));
    nodeState.putShared("ListOfPrimaryEmails",emailList);
        
    for (var i=0; i< emailList.length; i++){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "List_of_PrimaryEmails:"+emailList[i]);
    }
        
}
        
    else{
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "No Primary Email associated with the provided alt email");
        nodeState.putShared("PrimaryEmailFlag",false);
        auditLog("ACR002","Account Recovery Failure");
    }
    action.goTo(NodeOutcome.TRUE);
}



//Execution Begins
try{
    nodeState.putShared("forgotEmailviaAlternatemail", true);
    fecthPrimaryEmail();
}

catch(e){
   nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Inside Catch::"+e);
    auditLib.auditLogger("ACR002",sessionDetails,"Account Recovery Failure", eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
}


function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
          var headerName = "X-Real-IP";
         var headerValues = requestHeaders.get(headerName); 
          var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
           var browser = requestHeaders.get("user-agent"); 
           var os = requestHeaders.get("sec-ch-ua-platform"); 
         //  var userId = null;
                   var eventDetails = {};
              eventDetails["IP"] = ipAdress;
               eventDetails["Browser"] = browser;
         eventDetails["OS"] = os;
         eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
          //var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

                if (userEmail){
              var userQueryResult = openidm.query("managed/alpha_user", {
                     _queryFilter: 'mail eq "' + userEmail + '"'
                 }, ["_id"]);
              userId = userQueryResult.result[0]._id;
                }

                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log the user activity "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}




/**
* Script: KYID.2B1.Journey.ReadContextIDInfo
* Description: This script is used to read contextID from sharedState and userID information from existing session.        
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "Read ContextID Info",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ReadContextIDInfo",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     SUCCESS: "Success",
     ERROR: "Error"
 };


function fetchKOGIDFromUserStore(id) {
  try {
    // Query using 'mail'
    var userQueryResult = openidm.query(
      "managed/alpha_user",
      {
        _queryFilter: '_id eq "' + id + '"',
      },
      ["userName","mail","sn","givenName","frIndexedString1"]
    );

    if (userQueryResult.result && userQueryResult.result.length > 0) {
      var userName = userQueryResult.result[0].userName || null;
      logger.debug("userName found - " + userName);
      var mail = userQueryResult.result[0].mail || null;  
      var sn = userQueryResult.result[0].sn || null;  
      var givenName = userQueryResult.result[0].givenName || null;
      logger.debug("mail - " + mail+" | sn - "+sn+" | givenName - "+givenName);  
      nodeState.putShared("sendAccessGrantAttr_MAIL",mail);
      nodeState.putShared("sendAccessGrantAttr_SN",sn);
      nodeState.putShared("sendAccessGrantAttr_GIVENNAME",givenName);

    nodeState.putShared("audit_KOGID", userName)
    nodeState.putShared("audit_LOGON", userQueryResult.result[0].frIndexedString1)
    nodeState.putShared("audit_ID", id)

      return userName;
        
    } else {
      logger.error("userName not found");
      return null;
    }
  } catch (error) {
    logger.error("Error in fetchdescriptionFromUserStore: " + error);
    return null;
  }
}


function main(){

    //Function Name
    nodeConfig.functionName = "main()";

    //Local Variables
    var txid = null;
    var errMsg = null;
    var prereq_KOGID = null;
    var nodeLogger = null;
    var messageUserID = null;
    var messageContextID = null;
    var response = {};
    
    try {      
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));  
        nodeLogger = require("KYID.2B1.Library.Loggers");
        nodeLogger.log("error", nodeConfig, "begin", txid);
     
        if(typeof existingSession != 'undefined'){

             if(existingSession.get("UserId")!=null && existingSession.get("UserId")){
                logger.debug("userID in session is - "+existingSession.get("UserId"))
                prereq_KOGID = fetchKOGIDFromUserStore(existingSession.get("UserId")); 
                nodeState.putShared("prereq_KOGID",prereq_KOGID);
                nodeState.putShared("KOGID",prereq_KOGID);
                messageUserID = "userID in session is - "+existingSession.get("UserId");
                nodeState.putShared("userIDinSession",existingSession.get("UserId"));
                nodeLogger.log("error", nodeConfig, "mid", txid, messageUserID);       
                 
             } else {
                errMsg = nodeLogger.readErrorMessage("KYID102"); 
                nodeState.putShared("readErrMsgFromCode",errMsg); 
                nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg));
                nodeLogger.log("error", nodeConfig, "end", txid); 
                action.goTo(nodeOutcome.ERROR); 
             }
          
             if(nodeState.get("contextID")[0]!=null && nodeState.get("contextID")){
                 messageContextID = "contextID in query param is - "+nodeState.get("contextID")[0];
                 nodeState.putShared("prereqContextID",nodeState.get("contextID")[0]);
                 nodeLogger.log("error", nodeConfig, "mid", txid, messageContextID); 
                 nodeLogger.log("error", nodeConfig, "end", txid);
                 action.goTo(nodeOutcome.SUCCESS); 
             
             } else {
                errMsg = nodeLogger.readErrorMessage("KYID104"); 
                nodeState.putShared("readErrMsgFromCode",errMsg); 
                nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg));
                nodeLogger.log("error", nodeConfig, "end", txid); 
                action.goTo(nodeOutcome.ERROR);  
             }
                             
        } 
    
    } catch(error){
        errMsg = nodeLogger.readErrorMessage("KYID100"); 
        nodeState.putShared("readErrMsgFromCode",errMsg); 
        nodeLogger.log("error", nodeConfig, "mid", txid, error); 
        nodeLogger.log("error", nodeConfig, "end", txid); 
        action.goTo(nodeOutcome.ERROR);
    }
}

//Invoke Main Function
main();


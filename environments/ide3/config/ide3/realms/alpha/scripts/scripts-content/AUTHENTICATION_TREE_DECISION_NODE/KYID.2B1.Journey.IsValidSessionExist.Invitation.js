/**
* Script: KYID.Journey.IsValidSessionExistMFAForSelf
* Description: This script is used to check existing session of the user.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 6th August 2024
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check Existing Session",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IsValidSessionExist.Invitation",
    missingHeaders: "Missing origin header value",
    missingReqParam_goto: "Missing goto request parameter value",
    missingRequestURLParams: "Following mandatory request URL params are missing",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     SESSION_EXIST: "hasSession",
     SESSION_NOTEXIST: "noSession"
 };

 // Declare Global Variables
    var missingRequestParamsOrHeaders = [];


 //Logging Function
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


function main(){

    try {
        if(typeof existingSession != 'undefined'){
            logger.debug("InsideSessionExist")
            nodeState.putShared("Session","true")
            action.goTo(nodeOutcome.SESSION_EXIST);
        }else{
            logger.debug("InsideSessionDoesnotExist")
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::Session expired for user ");
             nodeState.putShared("Session","false")
            action.goTo(nodeOutcome.SESSION_NOTEXIST);
        }
    
    } catch(error){
        logger.debug("InsideCatch_NoSession")
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
        nodeState.putShared("Session","false")
        action.goTo(nodeOutcome.SESSION_NOTEXIST);
    }
}

main();

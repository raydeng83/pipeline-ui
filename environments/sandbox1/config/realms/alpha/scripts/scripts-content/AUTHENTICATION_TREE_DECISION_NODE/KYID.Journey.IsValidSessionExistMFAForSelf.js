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
    scriptName: "KYID.Journey.IsValidSessionExistMFAForSelf",
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
            logger.error("InsideSessionExist")
            action.goTo(nodeOutcome.SESSION_EXIST);
        }else{
            logger.error("InsideSessionDoesnotExist")
            action.goTo(nodeOutcome.SESSION_NOTEXIST);
        }
    
    } catch(error){
        logger.error("InsideCatch_NoSession")
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
        action.goTo(nodeOutcome.SESSION_NOTEXIST);
    }
}

main();


/**
* Script: KYID.Journey.CheckMethodSmsOrVoice
* Description: This script is used to check existing session of the user.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 21 April 2025
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Check Existing Session",
    script: "Script",
    scriptName: "KYID.Journey.CheckMethodSmsOrVoice",
    missingHeaders: "Missing origin header value",
    missingReqParam_goto: "Missing goto request parameter value",
    missingRequestURLParams: "Following mandatory request URL params are missing",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     TRUE: "True",
     FALSE: "False"
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
        var mfaMethod= nodeState.get("MFAMethod");
        if(mfaMethod === "sms"){
        action.goTo("True");
            action.goTo(nodeOutcome.TRUE);
        }
        else{
            action.goTo(nodeOutcome.FALSE);
        }        
    } 
    catch(error){
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
        action.goTo(nodeOutcome.TRUE);
    }
}

main();

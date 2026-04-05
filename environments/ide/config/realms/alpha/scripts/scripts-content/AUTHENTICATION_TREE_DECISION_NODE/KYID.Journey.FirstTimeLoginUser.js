/**
 * Function: KYID.Journey.FirstTimeLoginUser
 * Description: This script is used to set FirstTimeLoginUser flag on user's IDM Profile.
 * Param(s):
 * Input:
 *     <String> credentials              
 *                
 * Returns: 
 * Date: 26th July 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "FirstTimeLoginUser",
    script: "Script",
    scriptName: "KYID.Journey.FirstTimeLoginUser",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    idmQueryFail: "IDM Query Operation Failed",
    ExistInIDM: "User Record Found in IDM",
    notExistInIDM: "User Record Not Found in IDM", 
    idmPatchOperationSuccess: "IDM Patch/Update Operation Success",
    idmPatchOperationFailed: "IDM Patch/Update Operation Failed",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Declare Global Variables
var id = null;
var mail = null;
var jsonObj = {};
var jsonArray = []; 
var missingInputs = [];


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


/*
  Name: isMandatoryConfigParamsPresent()
  Description: Checks whether mandatory configuration parameters are present or not.
  Returns: If mandatory configuration parameters are present, returns True. 
           Otherwise, returns False.
 */
function isMandatoryConfigParamsPresent(){
    
    if(nodeState.get("mail")) {
         mail = nodeState.get("mail");
    }  else {
         missingInputs.push(nodeConfig.missingEmail);
    }
    
    if(missingInputs.length>0){
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                     +"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams+"::"+missingInputs);
        return false;
        
    } else {
        return true;
    }
}


function main(){

     if(!isMandatoryConfigParamsPresent()){
        action.goTo(nodeOutcome.ERROR);
    }
     else {
         try {
             var response = openidm.query("managed/alpha_user", { "_queryFilter": "/mail eq \""+mail+"\""}, ["mail", "_id"]);
             if (response.result.length==1) {
                 nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.ExistInIDM);
                 id = response.result[0]._id
                 
             } else {
                 nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.notExistInIDM);
                 action.goTo(nodeOutcome.ERROR);
             }             
          } catch(error){
             nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::"+error);
             action.goTo(nodeOutcome.ERROR);
          }
 
          jsonObj["operation"] = "replace";
          jsonObj["field"] = "frUnindexedString4";
          jsonObj["value"] = "false";
          jsonArray.push(jsonObj);
        
          try {
             openidm.patch("managed/alpha_user/"+id, null, jsonArray);
             nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmPatchOperationSuccess);
             action.goTo(nodeOutcome.SUCCESS);  

          } catch(error) {
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.idmPatchOperationFailed+"::"+error);
                 action.goTo(nodeOutcome.ERROR);
          }
     }

}

main();

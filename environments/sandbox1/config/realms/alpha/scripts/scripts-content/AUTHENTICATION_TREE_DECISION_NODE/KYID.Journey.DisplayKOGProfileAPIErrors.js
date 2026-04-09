/**
 * Script: 
 * Description:               
 * Date: 9th Sept 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "KOG Profile API Errors",
    script: "Script",
    scriptName: "KYID.Journey.DisplayKOGProfileAPIErrors",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False",
};
 
// Declare Global Variables
var errMessage = null;


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
 

// Main Function
function main() {
    
    try{    
        if(nodeState.get("unregisteredAccountErrorMessage") && nodeState.get("unregisteredAccountErrorMessage")!=null){
            errMessage = nodeState.get("unregisteredAccountErrorMessage");
            
        } else if(nodeState.get("profileApifailErrorMsg") && nodeState.get("profileApifailErrorMsg")!=null){
            errMessage = nodeState.get("profileApifailErrorMsg"); 
            
        } else if(nodeState.get("inValidAccountErrorMessage") && nodeState.get("inValidAccountErrorMessage")!=null){
            errMessage = nodeState.get("inValidAccountErrorMessage");
            
        } else if(nodeState.get("stubAccountErrorMessage") && nodeState.get("stubAccountErrorMessage")!=null){
            errMessage = nodeState.get("stubAccountErrorMessage");
            
        } else if(nodeState.get("notAllowedToLoginErrorMessage") && nodeState.get("notAllowedToLoginErrorMessage")!=null){
            errMessage = nodeState.get("notAllowedToLoginErrorMessage");
            
        }  
        action.goTo(nodeOutcome.SUCCESS).withErrorMessage(errMessage);   
    
    } catch(error) {
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                         +"::"+nodeConfig.scriptName+"::"+error);
    }
}


//Invoke Main Function
main() 


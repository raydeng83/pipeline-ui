/**
 * Script: KYID.Journey.IsKOGVisitRequired
 * Description: This script is used to redirect user to KOG portal based on claim value. 
 * Date: 8th August 2024
 * Author: Deloitte
 */

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "NeedKOGVisit",
    script: "Script",
    scriptName: "KYID.Journey.IsKOGVisitRequired",
    timestamp: dateTime,
    end: "Node Execution Completed",
};

// Node outcomes
var nodeOutcome = {
SUCCESS: "yes",
ERROR: "no"
};

// Declare Global Variables
var needkogvisit = "no";

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

try{    
    if(nodeState.get("needkogvisit") && nodeState.get("needkogvisit") != null) {
        needkogvisit = nodeState.get("needkogvisit").toLowerCase();   
        //nodeLogger.error("needkogvisit: "+needkogvisit); 
          nodeLogger.error("needkogvisit is: "+needkogvisit + "::mail" +nodeState.get("mail"))
        if(needkogvisit.localeCompare("yes")==0){
            action.goTo(nodeOutcome.SUCCESS);
        } else {
            action.goTo(nodeOutcome.ERROR);
        }  
    }  else {    
        action.goTo(nodeOutcome.ERROR);
    }
   
}catch(error){
      nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
}


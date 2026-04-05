/**
 * Script: 
 * Description:               
 * Date: 4th Nov 2024
 * Author: Deloitte
 **/

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check EnvType",
    script: "Script",
    scriptName: "KYID.2B1.Journey.EnvironmentType",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NONPROD: "nonprod",
    PROD: "prod"
};

// Declare Global Variables
var envType = "";

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



function main() {
    var envType = systemEnv.getProperty("esv.environment.type");
    nodeLogger.debug("********envType: "+envType)
    if(envType === "nonProduction") {
         nodeLogger.debug("Environment is non-production");
        action.goTo(NodeOutcome.NONPROD);
    } else {
          nodeLogger.debug("Environment is Production");
        action.goTo(NodeOutcome.PROD);
    }
}

//Invoke Main Function
main() 

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Node Execution Begin",
    node: "Node",
    nodeName: "Check First Time User",
    script: "Script",
    scriptName: "KYID.Journey.CheckFirstTimeUser",
    timestamp: dateTime,
    ExistInIDM: "User Record Found in IDM",
    notExistInIDM: "User Record Not Found in IDM", 
    idmQueryFail: "IDM Query Operation Failed",
    end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
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


// Declare Global Variables
var mail = "";

if(nodeState.get("mail") && nodeState.get("mail")!=null) {
    mail = nodeState.get("mail");
    nodeLogger.error("Email value is: " + mail);
    
    try{     
        var response = openidm.query("managed/alpha_user", { "_queryFilter": "/mail eq \""+mail+"\""}, ["mail", "_id"]);
        if (response.result.length==1) {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.ExistInIDM+"::Email:"+mail);              
            action.goTo(nodeOutcome.SUCCESS);
            
        } else {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.notExistInIDM+"::Email:"+mail);
            action.goTo(nodeOutcome.ERROR);
        }
       
    } catch(error){
          nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
                             +"::"+nodeConfig.scriptName+"::"+nodeConfig.idmQueryFail+"::Email:"+mail+"::"+error);
          action.goTo(nodeOutcome.ERROR);
    }
    
} else {
    nodeLogger.error("No Email Found");
    action.goTo(nodeOutcome.ERROR);
}





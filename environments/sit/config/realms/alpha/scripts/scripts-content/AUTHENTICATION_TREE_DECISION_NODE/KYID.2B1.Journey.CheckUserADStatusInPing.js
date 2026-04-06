var dateTime = new Date().toISOString();
var txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Check user AD Status",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckUserADStatus",
    timestamp: dateTime,
};

// Node outcomes
var nodeOutcome = {
    TRUE: "True",
    FALSE: "False",
    ERROR: "Error"
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

    var errMsg = null;
    var prereq_KOGID = null;
    var nodeLogger = null;
    var messageUserID = null;
    var messageContextID = null;
    var response = {};
    var kogId = null;

nodeLogger = require("KYID.2B1.Library.Loggers");

function main(){
    var userStatusResult = null;
    var ops = null;
    var userstatus = null;
    var params ={};
    var paramFields = [];

    //Function Name
    nodeConfig.functionName = "main()";
        try {
          logger.debug(txid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
        ops = require("KYID.2B1.Library.IDMobjCRUDops");

        if(nodeState.get("KOGID")){      
            kogId = nodeState.get("KOGID");
        }
        params["key"] = "userName";
        params["ops"] = "eq";
        params["value"] = kogId;
        paramFields.push("custom_ADFlag");
        userStatusResult = ops.crudOps("query", "alpha_user", null, params, paramFields, null);
        if (!userStatusResult || !userStatusResult.result || !userStatusResult.result[0] || typeof userStatusResult.result[0].custom_ADFlag === 'undefined') {
            logger.debug("user details is not available in Ping");
            action.goTo(nodeOutcome.FALSE);
        }
        else
        { 
            userstatus = userStatusResult.result[0].custom_ADFlag;
         if (userstatus === true || userstatus === "true" || userstatus === "" || userstatus === null || userstatus === undefined) {
            logger.info("user AD status is true");
                action.goTo(nodeOutcome.TRUE);
            } else if (userstatus === false || userstatus === "false") {
            logger.info("user AD status is false");
                action.goTo(nodeOutcome.FALSE);
            } else {
                action.goTo(nodeOutcome.FALSE);
            }
        }
        
}catch(e){
        logger.error(txid + "::" + nodeConfig.timestamp + "::" +nodeConfig.node + "::" + nodeConfig.nodeName + "::" +nodeConfig.script +"::" +nodeConfig.scriptName + "::" +e);
        action.goTo(nodeOutcome.ERROR);               
    }   
}


main();



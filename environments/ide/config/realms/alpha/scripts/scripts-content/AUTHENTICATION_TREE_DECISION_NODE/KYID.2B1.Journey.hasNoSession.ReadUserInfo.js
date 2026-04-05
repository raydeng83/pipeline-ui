/**
* Script: KYID.2B1.Journey.hasNoSession.ReadUserInfo
* Description: This script is used to read userID information in the scenario of no valid session.        
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_LoginMFA_Register_PhoneNumber",
    node: "Node",
    nodeName: "Read userInfo without a session",
    script: "Script",
    scriptName: "KYID.2B1.Journey.hasNoSession.ReadUserInfo",
    begin: "Begin Function Execution",
    function: "Function",
    functionName: "",
    end: "Function Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Success",
    ERROR: "Error",
    HASSESSION: "hasSession"
};

function main() {

    //Function Name
    nodeConfig.functionName = "main()";

    var KOGID = null;
    var userName = null;
    var mail = null;
    var txid = null;
    var errMsg = null;
    var nodeLogger = null;

    try {
        logger.debug("inside try");
        nodeLogger = require("KYID.2B1.Library.Loggers");
        nodeLogger.log("error", nodeConfig, "begin", txid);

        if (typeof existingSession == 'undefined') {

            if (nodeState.get("KOGID") != null) {
                KOGID = nodeState.get("KOGID");
                // logger.debug("KOGID"+KOGID);
                // nodeState.putShared("userId",KOGID);
                // KOGID = "e53843a0-4001-4294-8582-96cdf8eb4060";
                nodeState.putShared("objectAttributes", { "userName": KOGID });
                logger.debug("userName issssss: " + (nodeState.get("userName")));
                action.goTo(nodeOutcome.SUCCESS);



            }
            else {
            
                errMsg = nodeLogger.readErrorMessage("KYID102"); 
                nodeState.putShared("readErrMsgFromCode",errMsg); 
                nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg));
                action.goTo(nodeOutcome.ERROR);
            }
        }
        else {
            logger.info("user has an valid session");
            action.goTo(nodeOutcome.HASSESSION);
        }
    }
    catch (error) {
        errMsg = nodeLogger.readErrorMessage("KYID100"); 
        nodeState.putShared("readErrMsgFromCode",errMsg); 
        nodeLogger.log("error", nodeConfig, "mid", txid, error); 
        nodeLogger.log("error", nodeConfig, "end", txid); 
        action.goTo(nodeOutcome.ERROR);
    }
}

//Invoke Main Function
main();

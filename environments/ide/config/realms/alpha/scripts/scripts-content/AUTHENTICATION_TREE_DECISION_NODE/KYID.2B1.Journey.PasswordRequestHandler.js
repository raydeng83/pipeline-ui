var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "PasswordRequestHandler",
    script: "Script",
    scriptName: "KYID.2B1.Journey.PasswordRequestHandler",
    timestamp: dateTime,
      end: "Node Execution Completed"
};

var NodeOutcome = {
    IS_HELPDESK_USER: "isHelpDeskUser",
    IS_SELFSERVICE_USER: "isSelfUser",
};

//main
var isHelpDesk = nodeState.get("isHelpDesk");
if (isHelpDesk) {
     logger.debug("Action is requested by HelpDesk User: " + isHelpDesk);
     action.goTo(NodeOutcome.IS_HELPDESK_USER);
} else {
     logger.debug("Action is requested by Self Service User: ");
     action.goTo(NodeOutcome.IS_SELFSERVICE_USER);
}






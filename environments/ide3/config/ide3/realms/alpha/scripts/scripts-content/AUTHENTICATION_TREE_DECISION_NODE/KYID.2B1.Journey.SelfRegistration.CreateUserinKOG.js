var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Create user in KOG",
    script: "Script",
    scriptName: "KYID.2B1.Journey.SelfRegistration.CreateUserinKOG",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     TRUE: "true",
     FALSE: "false"
 };


var body = {
    "KYID": "",
    "Legal First Name": nodeState.get("givenName"),
    "Legal Last Name": nodeState.get("lastName")
}

var apiKOGCreateUserRequest = require("KYID.2B1.Library.ProcessKOGAPIRequest");
var kogApi = "https://prod-57.eastus.logic.azure.com:443/workflows/3e53adfcb02647dc84aa8a2d09c03062/triggers/manual/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=O98wvg_fIkVKFmwrgSnwD9u-e13bBj72uwcpQjBQ8yw"
logger.debug("body in the create user in KOG API" + JSON.stringify(body))
var response = apiKOGCreateUserRequest.processHttpRequest(null, kogApi, "POST", body, null);
logger.debug("inside response" + JSON.stringify(response))

// Log API response
logger.debug("inside script create user in KOG");
logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::response status is " + response.status)
//nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: API Request Status: " + response.status);
//nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: API Request Success: " + JSON.stringify(response));


//logger.debug("inside response" + status)
if (response.status === 200) {
    logger.debug("200 response");
    action.goTo("true");
} else {
    logger.debug("false response");
    action.goTo("false");
}

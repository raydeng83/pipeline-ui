var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Create user in KOG",
    script: "Script",
    scriptName: "KYID.2B1.Journey.SendDetailsinIdentityProofing",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     TRUE: "true",
     FALSE: "false"
 };

 // Logging function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
};


var body = {
    "Legal First Name": nodeState.get("givenName"),
    "Legal Last Name": nodeState.get("lastName"),
    "Legal Middle Name":  nodeState.get("custom_middleName"),
    "Siffix": nodeState.get("custom_suffix"),
    "Gender": nodeState.get("custom_gender"),
    "Date of birth": nodeState.get("custom_dateofBirth"),
    "Address1": nodeState.get("postalAddress"),
    "Address2":  nodeState.get("custom_postalAddress2"),
    "City":  nodeState.get("city"),
    "State":  nodeState.get("stateProvince"),
    "PostalCode": nodeState.get("postalCode"),
    "Country": nodeState.get("country")
}

var apiidproofing = require("KYID.2B1.Library.ProcessKOGAPIRequest");

//var idurl = systemEnv.getProperty("esv.idproofingurl")
var idurl = "null"
var response = apiidproofing.processHttpRequest(null, idurl, "POST", body, null);

// For testing Only as long as we do not receive the API Url
response = response || {};
if (!response.status) {
    response.status = 200; // Simulate success
    response.message = "Mocked successful response";
}

nodeLogger.error("ID Proofing API response: " + JSON.stringify(response));
nodeLogger.error("Response status is: " + response.status);

// Outcome logic
if (response.status === 200) {
    nodeLogger.info("ID Proofing API returned 200, proceeding to TRUE outcome.");
    action.goTo(nodeOutcome.TRUE);
} else {
    nodeLogger.error("ID Proofing API did not return 200, proceeding to FALSE outcome.");
    action.goTo(nodeOutcome.FALSE);
}
//This script is triggered by Master login journey for authorozation flow. when user has application roles and active enrolments both
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_MasterLogin",
    node: "Node",
    nodeName: "CheckUserHasRolesAndActiveEnrolment",
    script: "Script",
    scriptName: "kyid.2B1.Journey.CheckUserHasRolesAndActiveEnrolment",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
    HASROLEACTIVEENROLMENT: "hasRoleActiveEnrolment",
    TRUE: "true"
 };

 // Logger
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

if (typeof existingSession !== 'undefined') {
    var sessionValue = existingSession.get("hasRolesAndActiveEnrolment");

    if (sessionValue != null && sessionValue === "true") {
        logger.debug("hasRolesAndActiveEnrolment: " + sessionValue);
        action.goTo(nodeOutcome.HASROLEACTIVEENROLMENT);
    } else {
        action.goTo(nodeOutcome.TRUE);
    }
}
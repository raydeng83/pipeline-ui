var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Role Check Node",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CheckUserAuthorized",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    HASROLES: "hasRoles",
    NOROLES: "noRoles",
    ENROLLMENTFOUND: "activeenrollmentfound",
    USERHASROLESANDENROLLMENT: "userhasRolesActiveEnrolment",
    HASCONTEXTID: "hasContextID",
    ERROR: "error"
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

var loginauthz = nodeState.get("loginauthz");

if (loginauthz === "userhasrolesandenrolment") {
    logger.debug("userhasrolesandenrolment")
    action.goTo(NodeOutcome.USERHASROLESANDENROLLMENT).putSessionProperty('hasRolesAndActiveEnrolment', "true");
} else if (loginauthz === "userhasroles") {
    logger.debug("userhasroles")
    action.goTo(NodeOutcome.HASROLES);
} else if (loginauthz === "enrolmentfound") {
    logger.debug("enrolmentfound")
    action.goTo(NodeOutcome.ENROLLMENTFOUND);
} else if (loginauthz === "norolesfound") {
    logger.debug("norolesfound")
    action.goTo(NodeOutcome.NOROLES);
} else if (loginauthz === "hascontextId") {
    logger.debug("hascontextId")
    action.goTo(NodeOutcome.HASCONTEXTID);
} else {
    nodeLogger.error("AUDIT:: Unexpected or missing loginauthz value: " + loginauthz);
    action.goTo(NodeOutcome.ERROR);
}
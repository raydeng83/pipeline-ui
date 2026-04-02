var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Role Check Node",
    script: "Script",
    scriptName: "KYID.2B1.Journey.isUserAuthorized",
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

// === Get User Roles ===
function getUserRole(userId) {
    try {
        var response = openidm.query("managed/alpha_user/", {
            "_queryFilter": '/_id/ eq "' + userId + '"'
        }, [""]);
        
        var result = response.result[0].effectiveRoles;
        const userRoleIds = [];

        // Loop through the effectiveRoles array and collect role IDs
        for (var i = 0; i < result.length; i++) {
            userRoleIds.push(result[i]._refResourceId);
        }

        // Return the list of role IDs assigned to the user
        return userRoleIds;

    } catch (error) {
        nodeLogger.error("getUserRole() error: " + error);
        return "error";
    }
}

// === Get Application Roles for the application user is accessing===
function getAppRole(appId) {
    try {
        var response = openidm.query("managed/alpha_application/" + appId + "/roles", {
            "_queryFilter": "true"
        }, [""]);

        const appRoleIds = [];

        for (var i = 0; i < response.result.length; i++) {
            appRoleIds.push(response.result[i]._refResourceId);
        }

        nodeState.putShared("AppRoleIds", appRoleIds); 
        return appRoleIds;

    } catch (error) {
        nodeLogger.error("getAppRole() error: " + error);
        return "error";
    }
}

//===Checks if user already has an active enrollment for any of the app roles===
function hasActiveEnrollment(userId, appRoleIds) {
    try {
        var allowedStatuses = ["TODO", "NOT_STARTED", "IN_PROGRESS", "PENDINGAPPROVAL"];

        var queryFilter = 'requester eq "' + userId + '" and (' +
            allowedStatuses.map(status => 'status eq "' + status + '"').join(' or ') + ')';

        var kyidResponse = openidm.query("managed/alpha_kyid_request", { "_queryFilter": queryFilter }, []);

        if (!kyidResponse || kyidResponse.result.length === 0) {
            nodeLogger.debug("No pending KYID requests found.");
            return false;
        }

        // Loop through all requests to check if any approleid matches app roles
        for (var i = 0; i < kyidResponse.result.length; i++) {
            var req = kyidResponse.result[i];
            var requestRoleId = req.approleid;

            if (requestRoleId && appRoleIds.includes(requestRoleId)) {
                nodeLogger.debug("Found active enrollment request with approleid: " + requestRoleId);
                return true;
            }
        }

        nodeLogger.debug("No matching approleid found in active enrollments.");
        return false;

    } catch (error) {
        nodeLogger.error("Error in hasActiveEnrollment: " + error);
        return false;
    }
}

// === Role Matching & Enrollment Evaluation ===
function evaluateUserRolesAndEnrollment(appId, userId) {
    try {
        // Fetch roles assigned to the user
        var userRoleIds = getUserRole(userId);

        // Fetch roles associated with the application
        var appRoleIds = getAppRole(appId);

        nodeLogger.debug("User Roles: " + JSON.stringify(userRoleIds));
        nodeLogger.debug("Application Roles: " + JSON.stringify(appRoleIds));

        if (userRoleIds === "error" || appRoleIds === "error" || !userRoleIds || !appRoleIds) {
            nodeLogger.debug("Invalid role data.");
        } else {
            // Check if user has any roles that match application roles
            var hasMatchingRole = appRoleIds.some(function (role) {
                return userRoleIds.includes(role);
            });

            var enrollmentFound = hasActiveEnrollment(userId, appRoleIds);
            
            //User has roles and also an active enrollment for that app
        if (hasMatchingRole && enrollmentFound) {
            nodeLogger.debug("User has matching roles AND active enrollment. Routing to userhasRolesActiveEnrolment");
            nodeState.putShared("appIDReq",appId)
            nodeState.putShared("loginauthz","userhasrolesandenrolment")
            action.goTo(NodeOutcome.USERHASROLESANDENROLLMENT);
            return;
        }
            
            // If user has matching role, route to HASROLES
            if (hasMatchingRole) {
                nodeLogger.debug("User has matching role(s) → Routing to hasRoles");
                nodeState.putShared("loginauthz","userhasroles")
                action.goTo(NodeOutcome.HASROLES);
                return;
            }
        }

        // If no roles matched, check for active enrollment
       // var enrollmentFound = hasActiveEnrollment(userId, appRoleIds);

        if (enrollmentFound) {
            nodeLogger.debug("Active enrollment request found. Routing to activeenrollmentfound");
            nodeState.putShared("appIDReq",appId)
            nodeState.putShared("loginauthz","enrolmentfound")
            action.goTo(NodeOutcome.ENROLLMENTFOUND);
        } else {
            nodeLogger.debug("No roles or enrollments. Routing to Request Access");
            nodeState.putShared("appIDinWidget",appId)
            nodeState.putShared("loginauthz","norolesfound")
            action.goTo(NodeOutcome.NOROLES);
        }

    } catch (error) {
        nodeLogger.error("Exception in evaluateUserRolesAndEnrollment(): " + error);
        // nodeState.putShared("appIDinWidget",appId)
        // nodeState.putShared("loginauthz","norolesfound")
        //action.goTo(NodeOutcome.NOROLES);
        action.goTo(NodeOutcome.ERROR);
    }
}

// === Main Execution ===
(function main() {
    try {
        var userId = nodeState.get("_id");
       // var appId = nodeState.get("spEntityID");
       var appId = "5dbc4dd8-ccb0-4c5c-a039-873ca45355f6";

       if (requestParameters.get("contextID")) {
        var contextID = requestParameters.get("contextID")[0];
    
        var queryFilter = '_id eq "' + contextID + '"';
        var existingContextResult = openidm.query("managed/alpha_kyid_enrolmentcontext", {
            "_queryFilter": queryFilter
        });
    
        if (existingContextResult && existingContextResult.result.length > 0) {
            nodeLogger.debug("Existing enrolment context found: " + contextID);
            var contextUserId = existingContextResult.result[0].userID;
            var userId = nodeState.get("_id");  
    
            if (userId === contextUserId) {
                nodeState.putShared("contextID", contextID);
                 nodeLogger.debug("going to hascontextid");
                nodeState.putShared("loginauthz","hascontextId")
                action.goTo(NodeOutcome.HASCONTEXTID);
                return;
            } else {
                nodeLogger.debug("User ID mismatch for contextID: " + contextID);
            }
        }
    }
        
        nodeState.putShared("appIDinWidget",appId)
        nodeLogger.debug(nodeConfig.begin);
        nodeLogger.debug("Evaluating roles and enrollments for User ID: " + userId + ", App ID: " + appId);

        evaluateUserRolesAndEnrollment(appId, userId);

        nodeLogger.debug(nodeConfig.end);
    } catch (e) {
        nodeLogger.error("Main execution error: " + e);
        action.goTo(NodeOutcome.ERROR);
    }
})();
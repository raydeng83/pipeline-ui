
// === Normalize roleIds from nodeState ===
        var rawRoleIds = nodeState.get("roleIds");
        var roleIds;

        if (typeof rawRoleIds === "object") {
            roleIds = JSON.parse(JSON.stringify(rawRoleIds));
        } else {
            roleIds = rawRoleIds;
        }

        if (typeof roleIds === "string") {
            try {
                roleIds = JSON.parse(roleIds);
                if (!Array.isArray(roleIds)) roleIds = [roleIds];
            } catch (e) {
                roleIds = [roleIds];
            }
        } else if (!Array.isArray(roleIds)) {
            roleIds = [roleIds];
        }

        logger.debug("Final roleID array: " + JSON.stringify(roleIds));

// Get userId and userKyAccountType
var userKyAccountType;
var userId = "";

if (nodeState.get("_id")) {
    userId = nodeState.get("_id");
    var userObj = openidm.read("managed/alpha_user/" + userId);
    if (userObj) {
        userKyAccountType = mapKyAccountTypeToNumber(userObj.custom_kyidAccountType);
    }
} else {
    if (existingSession.get("KOGID")) {
        var KOGID = existingSession.get("KOGID");
        var user = queryUserByKOGID(KOGID);
        if (user) {
            userId = user._id;
            userKyAccountType = mapKyAccountTypeToNumber(user.custom_kyidAccountType);
        }
    }
}

nodeState.putShared("_id", userId);

logger.debug("Searching access objects for userId: " + userId + " and roleIds: " + JSON.stringify(roleIds));

// === Retrieve access role IDs based on roleIds ===
function getUserRoles(userId, roleIdsArray) {
    try {
        var accessIdsArray = [];

        for (var i = 0; i < roleIdsArray.length; i++) {
            var currentRoleId = roleIdsArray[i];

            var queryFilter = 'userIdentifier eq "' + userId + '" AND (recordState eq "0" OR recordState eq "ACTIVE") AND role/_refResourceId eq "' + currentRoleId + '"';
            var resp = openidm.query("managed/alpha_kyid_access", {
                "_queryFilter": queryFilter
            }, ["*"]);

            if (resp && resp.result && resp.result.length > 0) {
                logger.debug(`Access MO(s) found for roleId ${currentRoleId}: ${JSON.stringify(resp.result)}`);

                for (var j = 0; j < resp.result.length; j++) {
                    var accessEntry = resp.result[j];
                    if (accessEntry && accessEntry._id) {
                        accessIdsArray.push(accessEntry._id);
                        logger.debug("Access MO found: accessId=" + accessEntry._id);
                    }
                }
            } else {
                logger.error("No access MO found for roleId: " + currentRoleId);
            }
        }

        if (accessIdsArray.length > 0) {
            nodeState.putShared("accessroleid", accessIdsArray);
            logger.debug("Stored access role IDs in nodeState: " + JSON.stringify(accessIdsArray));
            return accessIdsArray;
        }

        return null;
    } catch (error) {
        logger.error("Error querying alpha_kyid_access: " + error.message);
        return null;
    }
}

// Execute function
var accessInfo = getUserRoles(userId, roleIds);

if (accessInfo) {
    logger.debug("Access Info retrieved successfully: " + JSON.stringify(accessInfo));
    action.goTo("success");
} else {
    logger.debug("No access info found or error occurred.");
    action.goTo("error"); 
}


function mapKyAccountTypeToNumber(typeStr) {
    var map = {
        "P": 0,
        "B": 1,
        "C": 2
    };
    return map[typeStr];
}

function queryUserByKOGID(KOGID) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, ["_id", "userName", "mail", "custom_kyidAccountType"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
        return userQueryResult.result[0];
    } 
    } catch (error) {
        nodeLogger.error("Error querying user by KOGID: " + error.message);
        return null;
    }
}
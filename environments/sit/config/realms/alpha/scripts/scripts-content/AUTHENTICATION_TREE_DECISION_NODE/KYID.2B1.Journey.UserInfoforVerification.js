// Get userId from request parameters
var userId = requestParameters.get("_id")[0];
logger.error("The userID from request parameters: " + userId);

if (!userId) {
    logger.error("No userId found in request parameters.");
    action.goTo("inactive"); 
}

// Query user by ID
function queryUserById(userId) {
    try {
        logger.debug("Looking up user with ID: " + userId);
        var userResult = openidm.read("managed/alpha_user/" + userId);

        if (userResult) {
            logger.debug("User found: " + JSON.stringify(userResult));
            return userResult;
        } else {
            logger.error("No user found for ID: " + userId);
            return null;
        }
    } catch (error) {
        logger.error("Error querying user by ID: " + error.message);
        return null;
    }
}

var user = queryUserById(userId);

if (!user) {
    logger.error("User not found. Exiting...");
    action.goTo("inactive");
}

// Check if account is active
if (user.accountStatus && user.accountStatus.toLowerCase() === "active") {
    logger.error("User account is active");

    // Store user info in nodeState
    nodeState.putShared("firstName", user.givenName);
    nodeState.putShared("lastName", user.sn);
    nodeState.putShared("email", user.mail);

    action.goTo("active");
} else {
    logger.error("User account is inactive or status missing");
    nodeState.putShared("inactiveUserError","User is Inactive")
    action.goTo("inactive");
}
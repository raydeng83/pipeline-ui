/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var email = nodeState.get("objectAttributes").get("mail");

if (!email) {
    logger.error("No email found in shared state");
    action.goTo("false");
} else {
    try {
        var queryResult = openidm.query(
            "managed/alpha_user",
            {
                "_queryFilter": 'mail eq "' + email + '"'
            },
            ["userName", "_id", "mail"]
        );

        if (queryResult && queryResult.result && queryResult.result.length > 0) {
            var user = queryResult.result[0];
            var username = user.userName;

            if (username) {
                nodeState.putShared("username", username);
                nodeState.putShared("userid", user._id);
                action.goTo("true");
            } else {
                logger.warn("User found but userName is empty");
                action.goTo("false");
            }
        } else {
            logger.warn("No user found for email: " + email);
            action.goTo("false");
        }
    } catch (error) {
        logger.error("Error querying user: " + error.message);
        action.goTo("false");
    }
}

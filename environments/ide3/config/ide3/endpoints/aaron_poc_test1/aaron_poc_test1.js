(function () {
    var VERSION = "v1.8.0";
    var ENDPOINT_NAME = "aaron_poc_test1";

    // Hardcoded values for POC
    var USER_ID = "2ae33a24-16b0-409b-9fd1-6afddc9d64f0";
    var OBJECT_NAME = "alpha_kyid_access";

    /**
     * Get role-based authorization filter string for a user
     * @returns {String} Combined filter string, or "true" if no filters
     */
    function getRoleBasedFilters() {
        try {
            var authRequest = {
                action: "getFilter",
                userId: USER_ID,
                objectName: OBJECT_NAME
            };

            logger.info(ENDPOINT_NAME + ": getRoleBasedFilters authRequest: " + JSON.stringify(authRequest));

            var authResponse = openidm.create("endpoint/dataAuthorizationCheck_aaron_test1", null, authRequest);

            logger.info(ENDPOINT_NAME + ": getRoleBasedFilters authResponse: " + JSON.stringify(authResponse));

            if (authResponse && authResponse.filter && authResponse.filter.length > 0) {
                var filterStrings = [];
                authResponse.filter.forEach(function(filterObj) {
                    if (filterObj.objectFilter) {
                        filterStrings.push(filterObj.objectFilter);
                    }
                });

                if (filterStrings.length > 0) {
                    // Use OR - user with multiple roles sees users from ALL their authorized apps
                    var finalFilter = "(" + filterStrings.join(") OR (") + ")";
                    logger.info(ENDPOINT_NAME + ": getRoleBasedFilters result: " + finalFilter);
                    return finalFilter;
                }
            }

            // No filters found (404 cases: user not found, no filter, no internal role)
            logger.info(ENDPOINT_NAME + ": getRoleBasedFilters no filters, returning 'false'");
            return "false";
        } catch (e) {
            // Error cases (including 404 responses) - return false to deny access
            logger.error(ENDPOINT_NAME + ": getRoleBasedFilters error: " + e.message);
            return "false";
        }
    }

    /**
     * Query access MO with filter and return unique user IDs array
     * @returns {Array} Array of unique userIds
     */
    function getAuthorizedUserIds(filter) {
        try {
            logger.info(ENDPOINT_NAME + ": getAuthorizedUserIds with filter: " + filter);

            // If filter is "false", skip query and return empty array (no access)
            if (filter === "false") {
                logger.info(ENDPOINT_NAME + ": getAuthorizedUserIds filter is 'false', returning empty array");
                return [];
            }

            // If filter is/contains "true" (master role), return true to skip post-filter
            if (filter === "true" || filter.indexOf("true") !== -1) {
                logger.info(ENDPOINT_NAME + ": getAuthorizedUserIds filter contains 'true' (master role), returning true");
                return true;
            }

            var queryResult = openidm.query("managed/" + OBJECT_NAME, {
                "_queryFilter": filter,
                "_fields": "userIdentifier"
            });

            logger.info(ENDPOINT_NAME + ": getAuthorizedUserIds result count: " + queryResult.result.length);

            var userIds = [];
            queryResult.result.forEach(function(access) {
                if (access.userIdentifier && userIds.indexOf(access.userIdentifier) === -1) {
                    userIds.push(access.userIdentifier);
                }
            });

            logger.info(ENDPOINT_NAME + ": getAuthorizedUserIds unique users: " + userIds.length);
            return userIds;
        } catch (e) {
            logger.error(ENDPOINT_NAME + ": getAuthorizedUserIds error: " + e.message);
            return [];
        }
    }

    // Main
    logger.info(ENDPOINT_NAME + ": START");

    var filter = getRoleBasedFilters();
    var authorizedUserIds = getAuthorizedUserIds(filter);

    return {
        success: true,
        version: VERSION,
        userId: USER_ID,
        objectName: OBJECT_NAME,
        filter: filter,
        authorizedUserIds: authorizedUserIds,
        userCount: authorizedUserIds === true ? "ALL (master role)" : authorizedUserIds.length,
        timestamp: new Date().toISOString()
    };
}());

/**
 * @name Aaron Option B Test
 * @description Test endpoint for Option B — reads auth filter injected by router filter,
 *              uses it in openidm.query() to managed/alpha_user.
 * @version v1.0.0
 */

(function () {
    logger.error("aaron_optb_test: START - method=" + request.method);

    if (request.method === "read") {
        try {
            // Read auth filter injected by router filter
            var params = request.params || request.additionalParameters || {};
            var authFilter = params.authFilter || null;

            logger.error("aaron_optb_test: authFilter from router=" + authFilter);
            logger.error("aaron_optb_test: all params keys=" + Object.keys(params));
            logger.error("aaron_optb_test: all params=" + JSON.stringify(params));

            // Use authFilter if present, otherwise default to "true" (all users)
            var queryFilter = authFilter || "true";

            logger.error("aaron_optb_test: querying managed/alpha_user with filter=" + queryFilter);

            var result = openidm.query("managed/alpha_user", {
                "_queryFilter": queryFilter,
                "_pageSize": 5,
                "_fields": "userName,givenName,sn"
            });

            logger.error("aaron_optb_test: query returned " + result.result.length + " results");

            var users = [];
            for (var i = 0; i < result.result.length; i++) {
                users.push({
                    id: result.result[i]._id,
                    userName: result.result[i].userName,
                    givenName: result.result[i].givenName,
                    sn: result.result[i].sn
                });
            }

            return {
                message: "aaron_optb_test results",
                version: "v1.0.0",
                authFilterFromRouter: authFilter,
                queryFilterUsed: queryFilter,
                resultCount: result.result.length,
                users: users,
                timestamp: new Date().toISOString()
            };

        } catch (e) {
            logger.error("aaron_optb_test: ERROR - " + e.message);
            return {
                error: true,
                message: e.message,
                timestamp: new Date().toISOString()
            };
        }
    } else {
        throw { code: 405, message: "Method not allowed: " + request.method };
    }
}());

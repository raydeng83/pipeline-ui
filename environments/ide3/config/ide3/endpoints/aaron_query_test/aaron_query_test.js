/**
 * @name Aaron Query Test
 * @description Test endpoint that queries managed/alpha_user.
 *              Used to verify if a router filter on managed/alpha_user
 *              can intercept and modify the queryFilter.
 * @version v1.0.0
 */

(function () {
    logger.error("aaron_query_test: START - method=" + request.method);

    if (request.method === "read") {
        try {
            // Simple query: get all alpha_users, limited to 5
            var params = request.params || request.additionalParameters || {};
            var queryFilter = params.filter || "true";
            var pageSize = parseInt(params.pageSize) || 5;

            logger.error("aaron_query_test: Querying managed/alpha_user with filter=" + queryFilter + " pageSize=" + pageSize);

            var result = openidm.query("managed/alpha_user", {
                "_queryFilter": queryFilter,
                "_pageSize": pageSize,
                "_fields": "userName,givenName,sn"
            });

            logger.error("aaron_query_test: Query returned " + result.result.length + " results");

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
                message: "aaron_query_test results",
                version: "v1.0.0",
                queryFilter: queryFilter,
                resultCount: result.result.length,
                totalResults: result.resultCount,
                users: users,
                timestamp: new Date().toISOString()
            };

        } catch (e) {
            logger.error("aaron_query_test: ERROR - " + e.message);
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

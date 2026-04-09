/**
 * @name Aaron External Test
 * @description Endpoint that calls external API using openidm.action
 * @version v1.0.0
 */

(function () {
    var ENDPOINT_NAME = "aaron_external_test";
    var requestTrackingId = "REQ_" + new Date().getTime();

    logger.info(ENDPOINT_NAME + ": [" + requestTrackingId + "] Starting external API call");

    try {
        // Test with a public API endpoint - JSONPlaceholder (free test API)
        var externalUrl = "https://jsonplaceholder.typicode.com/todos/1";

        logger.info(ENDPOINT_NAME + ": [" + requestTrackingId + "] Calling external URL: " + externalUrl);

        // Use openidm.action to call external REST endpoint
        var params = {
            url: externalUrl,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        };

        var response = openidm.action("external/rest", "call", params);

        logger.info(ENDPOINT_NAME + ": [" + requestTrackingId + "] External call SUCCESS");
        logger.info(ENDPOINT_NAME + ": [" + requestTrackingId + "] Response: " + JSON.stringify(response));

        return {
            success: true,
            message: "Successfully called external API",
            externalUrl: externalUrl,
            externalResponse: response,
            trackingId: requestTrackingId,
            timestamp: new Date().toISOString(),
            version: "v1.0.0"
        };

    } catch (error) {
        logger.error(ENDPOINT_NAME + ": [" + requestTrackingId + "] ERROR - " + error.message);
        logger.error(ENDPOINT_NAME + ": [" + requestTrackingId + "] Error details: " + JSON.stringify(error));

        return {
            success: false,
            error: {
                message: error.message || "Unknown error",
                code: error.code || 500,
                trackingId: requestTrackingId
            },
            timestamp: new Date().toISOString()
        };
    }
}());

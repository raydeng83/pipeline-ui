/**
 * @name Aaron IGA Test Endpoint
 * @description Test endpoint for IGA governance API - Simple GET operation
 * @version v1.0.0
 * @author Aaron
 * @created 2025-11-17
 *
 * Usage:
 *    POST /openidm/endpoint/aaron_iga_test
 */

(function () {
    var VERSION = "v1.0.0";
    var ENDPOINT_NAME = "aaron_iga_test";

    var requestTrackingId = "REQ_" + new Date().getTime();

    logger.info(ENDPOINT_NAME + ": [" + requestTrackingId + "] START");

    try {
        // Hardcoded test request ID
        var requestId = "d154a83e-2206-48fe-ad7a-538b7e21fd4d";

        logger.info(ENDPOINT_NAME + ": [" + requestTrackingId + "] Getting IGA request: " + requestId);
        logger.debug(ENDPOINT_NAME + ": [" + requestTrackingId + "] Calling IGA API GET");

        // GET the IGA request
        var igaResponse = openidm.action(
            "/iga/governance/requests/" + requestId,
            "GET",
            {},
            {}
        );

        logger.info(ENDPOINT_NAME + ": [" + requestTrackingId + "] SUCCESS");
        logger.debug(ENDPOINT_NAME + ": [" + requestTrackingId + "] Response: " + JSON.stringify(igaResponse));

        return {
            success: true,
            requestId: requestId,
            response: igaResponse,
            version: VERSION,
            trackingId: requestTrackingId,
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        logger.error(ENDPOINT_NAME + ": [" + requestTrackingId + "] ERROR - " + error.message);

        return {
            success: false,
            error: {
                code: error.code || 500,
                message: error.message || "Unknown error",
                trackingId: requestTrackingId,
                timestamp: new Date().toISOString()
            }
        };
    }
}());

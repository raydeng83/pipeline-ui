/**
 * @name Aaron Caller Test
 * @description Endpoint that calls aaron_simple_test internally using openidm.action
 * @version v1.0.0
 */

(function () {
    logger.info("aaron_caller_test: Starting internal endpoint call using openidm.action");

    try {
        // Call aaron_simple_test endpoint internally using openidm.action
        var response = openidm.action("endpoint/aaron_simple_test", "create", {}, {});

        logger.info("aaron_caller_test: Internal call SUCCESS");
        logger.info("aaron_caller_test: Response from aaron_simple_test: " + JSON.stringify(response));

        return {
            success: true,
            message: "Successfully called aaron_simple_test internally using openidm.action",
            internalResponse: response,
            timestamp: new Date().toISOString(),
            version: "v1.0.0"
        };

    } catch (error) {
        logger.error("aaron_caller_test: Internal call FAILED - " + error.message);

        return {
            success: false,
            error: {
                message: error.message || "Unknown error",
                code: error.code || 500
            },
            timestamp: new Date().toISOString()
        };
    }
}());

/**
 * @name Aaron Router Test
 * @description Simple endpoint to test router filter functionality
 * @version v1.0.0
 */

(function () {
    logger.info("aaron_router_test: Endpoint called - method=" + request.method);

    return {
        message: "Hello from aaron_router_test",
        filtered: false,
        version: "v1.0.0",
        method: request.method,
        timestamp: new Date().toISOString()
    };
}());

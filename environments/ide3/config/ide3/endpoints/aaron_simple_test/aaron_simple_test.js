/**
 * @name Aaron Simple Test
 * @description Very simple test endpoint
 * @version v1.0.0
 */

(function () {
    logger.info("aaron_simple_test: Endpoint called");

    // Retrieve ESV properties
    var jdbcUrl = identityServer.getProperty("esv.dbconnector.jdbcurl");
    var jdbcDriver = identityServer.getProperty("esv.dbconnector.jdbcdriver");
    var dbUsername = identityServer.getProperty("esv.dbconnector.username");
    var dbPassword = identityServer.getProperty("esv-dbconnector-password");

    return {
        message: "Hello from aaron_simple_test!",
        timestamp: new Date().toISOString(),
        method: request.method,
        version: "v1.0.0",
        esvProperties: {
            jdbcUrl: jdbcUrl,
            jdbcDriver: jdbcDriver,
            username: dbUsername,
            password: dbPassword
        }
    };
}());

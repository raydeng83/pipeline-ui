var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "RolerequestAccess",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RoleRequestAccess",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};
if (requestParameters.get("roleIDinWidget") && requestParameters.get("roleIDinWidget")[0]) {
    var roleIDinWidget = requestParameters.get("roleIDinWidget")[0];
    logger.debug("Role ID from request param: " + roleIDinWidget);

    try {
        var roleQuery = openidm.query("managed/alpha_role", {
            "_queryFilter": 'name eq "' + roleIDinWidget + '"'
        });

        if (roleQuery && roleQuery.result && roleQuery.result.length > 0) {
            var role_id = roleQuery.result[0]._id;
            callbacksBuilder.textOutputCallback(0, "roleId:" + role_id);
            action.goTo("success");
        } else {
            logger.debug("No matching role found for name: " + roleIDinWidget);
            action.goTo("failure");
        }
    } catch (e) {
        logger.error("Error querying role by name: " + e.message);
        action.goTo("failure");
    }

} else {
    logger.debug("No roleIDinWidget parameter found in request");
    action.goTo("failure");
}



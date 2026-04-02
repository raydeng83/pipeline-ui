var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Dashboard getWidgetformyAppScreen",
    script: "Script",
    scriptName: "KYID.2B1.getWidget",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FALSE: "false",
    ERROR: "error"
};

// Logger
var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

var dashboardLib = require("KYID.2B1.Library.Dashboard");

function getWidgetForUser(userId) {
    logger.debug("Starting getWidgetForUser for userId: " + userId);

    var matchedWidgets = [];
     
    //Get roles assigned to user and get _id list
    var userRoleIds = dashboardLib.getUserRole(userId); 
    logger.debug("User Role UUIDs: " + JSON.stringify(userRoleIds));
    
    //Get full role objects
    var userRoles = getRolesDetails(userRoleIds);
    var userRoleNames = userRoles.map(function (r) { return r.name; });
    
    //Get the app associated with the roles
    var userAppNames = userRoles.map(function (role) {
        if (role.businessAppId && role.businessAppId._refResourceId) {
            var app = openidm.read("managed/alpha_kyid_businessapplication/" + role.businessAppId._refResourceId);
            return app && app.name;
        }
        return null;
    }).filter(Boolean);
     
    //Get all widgets
    var allWidgets = dashboardLib.getAllWidgets();

    allWidgets.forEach(function (widget) {
        var settings = widget.myAppsSettings || {};
        var appLibSettings = widget.appLibrarySettings || {};
        var associatedRoleName = appLibSettings.associatedRoleSystemName;
        var associatedAppName = appLibSettings.associatedAppSystemName;

        var isRoleMatch = associatedRoleName && userRoleNames.includes(associatedRoleName);
        var isAppMatch = !isRoleMatch && associatedAppName && userAppNames.includes(associatedAppName);

        if (isRoleMatch || isAppMatch) {
            var widgetTags = dashboardLib.getWidgetTags(widget._id);
            var widgetDynamicSE = dashboardLib.getDynamicContentEndpointId(widget._id);

            matchedWidgets.push({
                widgetId: widget._id,
                widgetName: widget.name,
                widgetType: widget.type,
                widgetDescription: widget.description,
                widgetLogoURL: widget.logoURL,
                widgetRoleID: associatedRoleName || null,
                widgetApplicationID: associatedAppName || null,
                widgetlaunchApplicationURL: settings.launchURL || "",
                widgettag: widgetTags,
                widgetContext: appLibSettings.enrollmentScope,
                widgetdynamicContentEndpointId: widgetDynamicSE || "null",
                widgetmaintainenceView: widget.maintenanceModeSettingsisEnabled,
                widgetmaintainenceMessage: widget.maintenanceModeSettingsmessage,
                contentTitle: (widget.content && widget.content[0] && widget.content[0].title) || {},
                contentMyApps: (widget.content && widget.content[0] && widget.content[0].myAppsDescription) || {},
                contentAppLibrary: (widget.content && widget.content[0] && widget.content[0].appLibDescription) || {},
                ellipsisActions: dashboardLib.getEllipsisActions(settings, null, associatedRoleName, appLibSettings)
            });

            logger.debug("Widget matched and added: " + widget._id);
        }
    });

    return matchedWidgets;
}

// Get full role objects
function getRolesDetails(roleIds) {
    var roles = [];
    if (roleIds && roleIds.length > 0) {
        for (var i = 0; i < roleIds.length; i++) {
            var roleObj = openidm.read("managed/alpha_role/" + roleIds[i]);
            if (roleObj) {
                roles.push(roleObj);
            }
        }
    }
    return roles;
}

// Main Execution
try {
   var userId = nodeState.get("_id")
   //var userId = "798c6cf1-899c-45fd-83c9-06e44a51738c"; // test

    logger.debug("Fetching widgets for userId: " + userId);
    var widgetresponseArray = getWidgetForUser(userId);

    if (!widgetresponseArray || widgetresponseArray.length === 0) {
        nodeState.putShared("myappswidgets", "empty");
        nodeState.putShared("allAppsResponse", null);
        logger.debug("No widgets found for user.");
        action.goTo(NodeOutcome.FALSE);
    } else {
        var allAppsResponse = JSON.stringify(widgetresponseArray);
        nodeState.putShared("allAppsResponse", allAppsResponse);
        logger.debug("Widgets returned for user: " + allAppsResponse);
        action.goTo(NodeOutcome.TRUE);
    }
} catch (error) {
    logger.error("Unexpected error while fetching widgets: " + error);
    callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
    action.goTo(NodeOutcome.ERROR);
}
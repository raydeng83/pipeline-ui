var dashboardLib = require("KYID.2B1.Library.Dashboard");

// === Initial Logging and Node Config ===
var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "RetrieveAppLibraryWidgets",
    script: "Script",
    scriptName: "KYID.2B1.RetrieveAppLibraryWidgets",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FALSE: "false",
    ERROR: "error"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

nodeLogger.debug("=== Starting RetrieveAppLibraryWidgets ===");

// === Build Widget JSON OBJECT ===
function buildWidgetObject(widget, roleName, appName, type) {
    try {
        var appLibSettings = widget.appLibrarySettings || {};
        var settings = widget.myAppsSettings || {};
        var enrollmentScope = appLibSettings.enrollmentScope;
        var widgetTags = dashboardLib.getWidgetTags(widget._id);
        var widgetDynamicSE = dashboardLib.getDynamicContentEndpointId(widget._id);
        var obj = {
            widgetId: widget._id,
            widgetName: widget.name,
            widgetType: widget.type,
            widgetDescription: widget.description,
            widgetLogoURL: widget.logoURL || null,
            widgetRoleID: appLibSettings.associatedRoleSystemName || null,
            widgetApplicationID: appLibSettings.associatedAppSystemName || null,
            widgetdynamicContentEndpointId: widgetDynamicSE || "null",
            widgetlaunchApplicationURL: settings.launchURL || null,
            widgetisFeatured: widget.isFeatured || false,
            widgettag: widgetTags,
            widgetContext: appLibSettings.enrollmentScope,
            contentTitle: (widget.content && widget.content[0] && widget.content[0].title) || {},
            contentMyApps: (widget.content && widget.content[0] && widget.content[0].myAppsDescription) || {},
            contentAppLibrary: (widget.content && widget.content[0] && widget.content[0].appLibDescription) || {},
            ellipsisActions: dashboardLib.getEllipsisActions(settings, type, roleName, appLibSettings),
            typeofwidgetinappLibrary: type
        };

        if (enrollmentScope === "2") {
            obj.applicationURL = appLibSettings.applicationURL || null;
        }

        nodeLogger.debug("Built widget object: " + widget._id + " as type: " + type);
        return obj;
    } catch (e) {
        nodeLogger.debug("Error building widget object for widgetId: " + (widget && widget._id) + " — " + e);
        throw e;
    }
}

function getMatchedWidgets(userId, allWidgets) {
    nodeLogger.debug("Matching widgets for userId: " + userId);
    var matched = [], seen = [];

    var roleIds = dashboardLib.getUserRole(userId) || [];
    var userRoles = [];

    var userRoleNames = [];
    var userAppNames = [];

    for (var i = 0; i < roleIds.length; i++) {
        var role = openidm.read("managed/alpha_role/" + roleIds[i]);
        if (role) {
            userRoles.push(role);
            userRoleNames.push(role.name);
            if (role.businessAppId && role.businessAppId._refResourceId) {
                var app = openidm.read("managed/alpha_kyid_businessapplication/" + role.businessAppId._refResourceId);
                if (app && app.name) {
                    userAppNames.push(app.name);
                }
            }
        }
    }

    nodeLogger.debug("User roles: " + userRoleNames + ", apps: " + userAppNames);

    for (var j = 0; j < allWidgets.length; j++) {
        var widget = allWidgets[j];
        if (!widget || !widget.myAppsSettings || !widget.appLibrarySettings) {
            nodeLogger.debug("Skipping invalid widget (missing settings): " + (widget && widget._id));
            continue;
        }

        var associatedRole = widget.appLibrarySettings.associatedRoleSystemName;
        var associatedApp = widget.appLibrarySettings.associatedAppSystemName;

        var isRoleMatch = userRoleNames.indexOf(associatedRole) >= 0;
        var isAppMatch = userAppNames.indexOf(associatedApp) >= 0;

        if ((isRoleMatch || isAppMatch) && seen.indexOf(widget._id) < 0) {
            nodeLogger.debug("Matched widget: " + widget._id);
            matched.push(buildWidgetObject(widget, associatedRole, associatedApp, "launch"));
            seen.push(widget._id);
        }
    }

    return matched;
}

function getUnmatchedWidgets(allWidgets, matchedIds) {
    nodeLogger.debug("Filtering unmatched widgets...");
    var unmatched = [];

    for (var i = 0; i < allWidgets.length; i++) {
        var widget = allWidgets[i];
        if (!widget || !widget.myAppsSettings || !widget.appLibrarySettings) {
            nodeLogger.debug("Skipping invalid widget in unmatched set: " + (widget && widget._id));
            continue;
        }

        if (matchedIds.indexOf(widget._id) >= 0) {
            continue;
        }

        var roleName = widget.appLibrarySettings.associatedRoleSystemName || null;
        var appName = widget.appLibrarySettings.associatedAppSystemName || null;

        var enrollType = "enroll";
        if (widget.appLibrarySettings.enrollmentScope === "2") {
            enrollType = "Start an App";
        }

        var obj = buildWidgetObject(widget, roleName, appName, enrollType);

        if (widget.appLibrarySettings.enrollmentScope === "1") {
            obj.widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID=" + roleName;
        } else {
            obj.widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_requestAccess&appIDinWidget=" + appName;
        }

        nodeLogger.debug("Unmatched widget added: " + widget._id);
        unmatched.push(obj);
    }

    return unmatched;
}

// === Main Execution ===
try {
   var userId = nodeState.get("_id");
//var userId = "798c6cf1-899c-45fd-83c9-06e44a51738c"; // test
    nodeLogger.debug("Starting widget processing for userId: " + userId);

    var allWidgets = dashboardLib.getAllWidgets();
    var launches = getMatchedWidgets(userId, allWidgets);
    var launchIds = launches.map(function (x) { return x.widgetId; });
    var enrolls = getUnmatchedWidgets(allWidgets, launchIds);
    var combined = launches.concat(enrolls);

    nodeLogger.debug("Total launch widgets: " + launches.length);
    nodeLogger.debug("Total enroll widgets: " + enrolls.length);
    nodeLogger.debug("Final widget total: " + combined.length);

    nodeState.putShared("combinedWidgets", JSON.stringify(combined));

    if (combined.length === 0) {
        nodeLogger.debug("No widgets matched or available for enroll.");
        callbacksBuilder.textOutputCallback(0, "No_results_found.");
        action.goTo(NodeOutcome.FALSE);
    } else {
        action.goTo(NodeOutcome.TRUE);
    }

} catch (err) {
    nodeLogger.error("Fatal error during execution: " + err);
    callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
    action.goTo(NodeOutcome.ERROR);
}
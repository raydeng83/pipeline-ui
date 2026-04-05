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

// ===Build Widget JSON OBJECT ===
function buildWidgetObject(widget, roleId, appId, type) {
    try {
        var appLibSettings = widget.appLibrarySettings || {};
        var settings = widget.myAppsSettings || {};
        var enrollmentScope = appLibSettings.enrollmentScope;
        var widgetTags = dashboardLib.getWidgetTags(widget._id)
        var widgetDynamicSE = dashboardLib.getDynamicContentEndpointId(widget._id)
        var obj = {
            widgetId: widget._id,
            widgetName: widget.name,
            widgetType: widget.type,
            widgetDescription: widget.description,
            widgetLogoURL: widget.logoURL || null,
            widgetRoleID: settings.associatedRoleSystemName || null,
            widgetApplicationID: settings.associatedAppSystemName || null,
            widgetdynamicContentEndpointId: widgetDynamicSE || "null",
            widgetlaunchApplicationURL: settings.launchURL || null,
            widgetisFeatured: widget.isFeatured || false,
            widgettag: widgetTags,
            widgetContext: appLibSettings.enrollmentScope,
            contentTitle: (widget.content && widget.content[0] && widget.content[0].title) || {},
            contentMyApps: (widget.content && widget.content[0] && widget.content[0].myAppsDescription) || {},
            contentAppLibrary: (widget.content && widget.content[0] && widget.content[0].appLibDescription) || {},
            ellipsisActions: dashboardLib.getEllipsisActions(settings, type, roleId, appLibSettings),
            typeofwidgetinappLibrary: type
        };

        //Only add applicationURL when enrollmentScope === "2"
        if (enrollmentScope === "2") {
            obj.applicationURL = appLibSettings.applicationURL || null;
        }

        nodeLogger.debug("Built widget object: " + widget._id + " as type: " + type);
        return obj;
    } catch (e) {
        nodeLogger.error("Error building widget object for widgetId: " + (widget && widget._id) + " — " + e);
        throw e;
    }
}

function getMatchedWidgets(userId, allWidgets) {
    nodeLogger.debug("Matching widgets for userId: " + userId);
    var matched = [], seen = [];
    var roles = dashboardLib.getUserRole(userId) || [];

    nodeLogger.debug("User roles: " + JSON.stringify(roles));

    for (var i = 0; i < roles.length; i++) {
        var rid = roles[i];
        var found = false;

        for (var j = 0; j < allWidgets.length; j++) {
            var w = allWidgets[j];

            if (!w || !w.myAppsSettings || !w.appLibrarySettings) {
                nodeLogger.debug("Skipping invalid widget (missing settings) in match: " + (w && w._id));
                continue;
            }

            // Direct role match (associatedRoleSystemName === role UUID)
            if (w.appLibrarySettings.associatedRoleSystemName === rid && seen.indexOf(w._id) < 0) {
                nodeLogger.debug("Matched widget via roleId: " + rid + " -> widgetId: " + w._id);
                matched.push(buildWidgetObject(w, rid, null, "launch"));
                seen.push(w._id);
                found = true;
                break;
            }
        }

        // Fallback to businessAppId
        if (!found) {
            nodeLogger.debug("RoleId not matched directly. Trying fallback via application for role: " + rid);

            var roleObj = openidm.read("managed/alpha_role/" + rid);
            if (roleObj && roleObj.businessAppId && roleObj.businessAppId._refResourceId) {
                var appId = roleObj.businessAppId._refResourceId;

                for (var k = 0; k < allWidgets.length; k++) {
                    var w2 = allWidgets[k];

                    if (!w2 || !w2.myAppsSettings || !w2.appLibrarySettings) {
                        nodeLogger.debug("Skipping invalid widget (missing settings) in match: " + (w2 && w2._id));
                        continue;
                    }

                    if (w2.appLibrarySettings.associatedAppSystemName === appId && seen.indexOf(w2._id) < 0) {
                        nodeLogger.debug("Matched widget via appId: " + appId + " -> widgetId: " + w2._id);
                        matched.push(buildWidgetObject(w2, null, appId, "launch"));
                        seen.push(w2._id);
                        break;
                    }
                }
            } else {
                nodeLogger.debug("No businessAppId found for roleId: " + rid);
            }
        }
    }

    return matched;
}


// ===Enroll Widgets or Start an App Widgets ===
function getUnmatchedWidgets(allWidgets, matchedIds) {
    nodeLogger.debug("Filtering unmatched widgets...");
    var unmatched = [];

    for (var i = 0; i < allWidgets.length; i++) {
        var w = allWidgets[i];
        if (!w || !w.myAppsSettings || !w.appLibrarySettings) {
        nodeLogger.debug("Skipping invalid widget in unmatched set: " + (w && w._id));
        continue;
    }

        if (matchedIds.indexOf(w._id) >= 0) {
            continue;
        }

        var roleID = null;
        if (w.appLibrarySettings && w.appLibrarySettings.associatedRoleSystemName) {
            roleID = w.appLibrarySettings.associatedRoleSystemName;
        }

        var appID = null;
        if (w.appLibrarySettings && w.appLibrarySettings.associatedAppSystemName) {
            appID = w.appLibrarySettings.associatedAppSystemName;
        }

        var enrollType = "enroll";
        if (w.appLibrarySettings && w.appLibrarySettings.enrollmentScope === "2") {
            logger.debug("this widget is app decide"+w)
            enrollType = "Start an App";
        }

        var obj = buildWidgetObject(w, roleID, appID, enrollType);

        if (w.appLibrarySettings && w.appLibrarySettings.enrollmentscope === "1") {
            obj.widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID=" + roleID;
        } else {
            obj.widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_requestAccess&appIDinWidget=" + appID;
        }

        nodeLogger.debug("Unmatched widget added: " + w._id);
        unmatched.push(obj);
    }

    return unmatched;
}

// === Main Execution ===
try {
    var userId = nodeState.get("_id");
    //var userId = "798c6cf1-899c-45fd-83c9-06e44a51738c"; // hardcoded for testing
    
    nodeLogger.debug("Starting widget processing for userId: " + userId);

    var allWidgets = dashboardLib.getAllWidgets();
    var launches = getMatchedWidgets(userId, allWidgets);

    //extracts the widgetId from each object in the launches array and returns a new array of just the widget IDs.
    var launchIds = launches.map(function (x) { return x.widgetId; });

    var enrolls = getUnmatchedWidgets(allWidgets, launchIds);
    var combined = launches.concat(enrolls);

    nodeLogger.debug("Total launch widgets: " + launches.length);
    nodeLogger.debug("Total enroll widgets: " + enrolls.length);
    nodeLogger.debug("Final widget total: " + combined.length);

    nodeState.putShared("combinedWidgets", JSON.stringify(combined));
    // nodeState.putShared("combinedWidgets", combinedResponse);
    if (combined.length === 0) {
        nodeLogger.debug("No widgets matched or available for enroll.");
        callbacksBuilder.textOutputCallback(0, "No_results_found.");
        action.goTo(NodeOutcome.FALSE);
    } else {
        //callbacksBuilder.textOutputCallback(0, JSON.stringify(combined));
        action.goTo(NodeOutcome.TRUE);
    }

} catch (err) {
    nodeLogger.error("Fatal error during execution: " + err);
    callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
    action.goTo(NodeOutcome.ERROR);
}
// var dashboardLib = require("KYID.2B1.Library.Dashboard");

// // === Initial Logging and Node Config ===
// var dateTime = new Date().toISOString();
// var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// var nodeConfig = {
//     begin: "Beginning Node Execution",
//     node: "Node",
//     nodeName: "RetrieveAppLibraryWidgets",
//     script: "Script",
//     scriptName: "KYID.2B1.RetrieveAppLibraryWidgets",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     TRUE: "true",
//     FALSE: "false",
//     ERROR: "error"
// };

// var nodeLogger = {
//     debug: function (message) { logger.debug(message); },
//     error: function (message) { logger.error(message); },
//     info: function (message) { logger.info(message); }
// };

// nodeLogger.error("=== Starting RetrieveAppLibraryWidgets ===");

// // === Build Widget JSON OBJECT ===
// function buildWidgetObject(widget, roleName, appName, type) {
//     try {
//         var appLibSettings = widget.appLibrarySettings || {};
//         var settings = widget.myAppsSettings || {};
//         var enrollmentScope = appLibSettings.enrollmentScope;
//         var widgetTags = dashboardLib.getWidgetTags(widget._id);
//         var widgetDynamicSE = dashboardLib.getDynamicContentEndpointId(widget._id);
//         var obj = {
//             widgetId: widget._id,
//             widgetName: widget.name,
//             widgetType: widget.type,
//             widgetDescription: widget.description,
//             widgetLogoURL: widget.logoURL || null,
//             widgetRoleID: appLibSettings.associatedRoleSystemName || null,
//             widgetApplicationID: appLibSettings.associatedAppSystemName || null,
//             widgetdynamicContentEndpointId: widgetDynamicSE || "null",
//             widgetlaunchApplicationURL: settings.launchURL || null,
//             widgetisFeatured: widget.isFeatured || false,
//             widgettag: widgetTags,
//             widgetContext: appLibSettings.enrollmentScope,
//             contentTitle: (widget.content && widget.content[0] && widget.content[0].title) || {},
//             contentMyApps: (widget.content && widget.content[0] && widget.content[0].myAppsDescription) || {},
//             contentAppLibrary: (widget.content && widget.content[0] && widget.content[0].appLibDescription) || {},
//             ellipsisActions: dashboardLib.getEllipsisActions(settings, type, roleName, appLibSettings),
//             typeofwidgetinappLibrary: type
//         };

//         if (enrollmentScope === "2") {
//             obj.applicationURL = appLibSettings.applicationURL || null;
//         }

//         nodeLogger.error("Built widget object: " + widget._id + " as type: " + type);
//         return obj;
//     } catch (e) {
//         nodeLogger.error("Error building widget object for widgetId: " + (widget && widget._id) + " — " + e);
//         throw e;
//     }
// }

// function getMatchedWidgets(userId, allWidgets) {
//     nodeLogger.error("Matching widgets for userId: " + userId);
//     var matched = [], seen = [];

//     var roleIds = dashboardLib.getUserRole(userId) || [];
//     var userRoles = [];

//     var userRoleNames = [];
//     var userAppNames = [];

//     for (var i = 0; i < roleIds.length; i++) {
//         var role = openidm.read("managed/alpha_role/" + roleIds[i]);
//         if (role) {
//             userRoles.push(role);
//             userRoleNames.push(role.name);
//             if (role.businessAppId && role.businessAppId._refResourceId) {
//                 var app = openidm.read("managed/alpha_kyid_businessapplication/" + role.businessAppId._refResourceId);
//                 if (app && app.name) {
//                     userAppNames.push(app.name);
//                 }
//             }
//         }
//     }

//     nodeLogger.error("User roles: " + userRoleNames + ", apps: " + userAppNames);

//     for (var j = 0; j < allWidgets.length; j++) {
//         var widget = allWidgets[j];
//         if (!widget || !widget.myAppsSettings || !widget.appLibrarySettings) {
//             nodeLogger.error("Skipping invalid widget (missing settings): " + (widget && widget._id));
//             continue;
//         }

//         var associatedRole = widget.appLibrarySettings.associatedRoleSystemName;
//         var associatedApp = widget.appLibrarySettings.associatedAppSystemName;

//         var isRoleMatch = userRoleNames.indexOf(associatedRole) >= 0;
//         var isAppMatch = userAppNames.indexOf(associatedApp) >= 0;

//         if ((isRoleMatch || isAppMatch) && seen.indexOf(widget._id) < 0) {
//             nodeLogger.error("Matched widget: " + widget._id);
//             matched.push(buildWidgetObject(widget, associatedRole, associatedApp, "launch"));
//             seen.push(widget._id);
//         }
//     }

//     return matched;
// }

// function getUnmatchedWidgets(allWidgets, matchedIds) {
//     nodeLogger.error("Filtering unmatched widgets...");
//     var unmatched = [];

//     for (var i = 0; i < allWidgets.length; i++) {
//         var widget = allWidgets[i];
//         if (!widget || !widget.myAppsSettings || !widget.appLibrarySettings) {
//             nodeLogger.debug("Skipping invalid widget in unmatched set: " + (widget && widget._id));
//             continue;
//         }

//         if (matchedIds.indexOf(widget._id) >= 0) {
//             continue;
//         }

//         var roleName = widget.appLibrarySettings.associatedRoleSystemName || null;
//         var appName = widget.appLibrarySettings.associatedAppSystemName || null;

//         var enrollType = "enroll";
//         if (widget.appLibrarySettings.enrollmentScope === "2") {
//             enrollType = "Start an App";
//         }

//         var obj = buildWidgetObject(widget, roleName, appName, enrollType);

//         if (widget.appLibrarySettings.enrollmentScope === "1") {
//             obj.widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_PrerequisitesEnrolment&roleID=" + roleName;
//         } else {
//             obj.widrequestURL = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=kyid_2B1_requestAccess&appIDinWidget=" + appName;
//         }

//         nodeLogger.error("Unmatched widget added: " + widget._id);
//         unmatched.push(obj);
//     }

//     return unmatched;
// }

// // === Main Execution ===
// try {
//    var userId = nodeState.get("_id");
// //var userId = "798c6cf1-899c-45fd-83c9-06e44a51738c"; // test
//     nodeLogger.error("Starting widget processing for userId: " + userId);

//    // var allWidgets = dashboardLib.getAllWidgets();
//     var allWidgets = getAllWidgets();
//     logger.error("allWidgets:::"+allWidgets)
//     var launches = getMatchedWidgets(userId, allWidgets);
//     //flat list of widget IDs that the user has matched with
//     var launchIds = launches.map(function (x) { return x.widgetId; });
//     var enrolls = getUnmatchedWidgets(allWidgets, launchIds);
//     var combined = launches.concat(enrolls);

//     nodeLogger.error("Total launch widgets: " + launches.length);
//     nodeLogger.error("Total enroll widgets: " + enrolls.length);
//     nodeLogger.error("Final widget total: " + combined.length);

//     nodeState.putShared("combinedWidgets", JSON.stringify(combined));

//     if (combined.length === 0) {
//         nodeLogger.error("No widgets matched or available for enroll.");
//         callbacksBuilder.textOutputCallback(0, "No_results_found.");
//         action.goTo(NodeOutcome.FALSE);
//     } else {
//         action.goTo(NodeOutcome.TRUE);
//     }

// } catch (err) {
//     nodeLogger.error("Fatal error during execution: " + err);
//     callbacksBuilder.textOutputCallback(0, "An_unexpected_error_occurred");
//     action.goTo(NodeOutcome.ERROR);
// }


//Function====
function getAllWidgets() {
    logger.error("Fetching all dashboard widgets...");

    var query = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
        "_queryFilter": "true"
    });
    
    var allWidgets = [];
     logger.error("the query result"+query.result)
    if (query.result && query.result.length > 0) {
        logger.error("Total widgets found: " + query.result.length);

        for (var i = 0; i < query.result.length; i++) {
            var widgetId = query.result[i]._id;
            var widgetObj = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);

            if (widgetObj) {
                logger.error("Widget JSON: " + JSON.stringify(widgetObj));

                if (widgetObj) {
                    allWidgets.push(widgetObj);
                } else {
                    logger.error("Skipping widget (missing settings): " + widgetId);
                }
            } else {
                logger.error("Failed to read widget: " + widgetId);
            }
        }
    } else {
        logger.error("No widgets found.");
    }

    return allWidgets;
}

var allWidgets = getAllWidgets()
logger.error("allwidgets"+allWidgets)
callbacksBuilder.textOutputCallback(0,allWidgets)

outcome="true"
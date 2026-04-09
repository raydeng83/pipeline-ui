var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "DisplayViewAppScreen",
    script: "Script",
    scriptName: "KYID.2B1.Journey.DisplayViewBusinessAppScreen",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    CANCEL: "cancel",
    FALSE: "false",
    TRUE: "true"
};

// Logging function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
};

var appLib = require("KYID.2B1.Library.Dashboard"); // for getWidgetTags etc.
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
function getAppDetails() {
    var appResults = [];
    var widgetTagsList = [];
    var maintainanceView = false;
    var launchUrlmyApps = null;
    var widDisplayBanner = null;
    var maintainanceMessage = null, widgetDisplayDesc = null, widgetTitle = null;

    // Read widget data
    var wId = nodeState.get("widgetselected");
    logger.debug("the wID::"+wId)
    if (wId) {
        var w = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + wId);
        if (w) {
            var maintainanceView = false;
            if (w.maintenanceModeSettingsisEnabled !== undefined && w.maintenanceModeSettingsisEnabled !== null) {
                maintainanceView = w.maintenanceModeSettingsisEnabled;
            }
            maintainanceMessage = w.maintenanceModeSettingsmessage || null;

            // Content attributes for localized data
            widgetTitle = (w.content && w.content[0] && w.content[0].title) || {};

            if(nodeState.get("myAppsJourney")=="true"){
              widgetDisplayDesc = (w.content && w.content[0] && w.content[0].myAppsDescription) || {};
              widDisplayBanner = (w.content && w.content[0] && w.content[0].myAppsBanner) || {};
              launchUrlmyApps = w.myAppsSettings.launchURL
            } else {
              widgetDisplayDesc = (w.content && w.content[0] && w.content[0].appLibDescription) || {};
              widDisplayBanner = (w.content && w.content[0] && w.content[0].appLibBanner) || {};
              var launchQuery = openidm.query("managed/alpha_kyid_dashboardapplicationwidget", {
             "_queryFilter":
            'name eq "' + w.name + '"' +
            ' and myAppsSettings/launchURL pr'
            });

            if (launchQuery.result && launchQuery.result.length > 0) {
                launchUrlmyApps = launchQuery.result[0].myAppsSettings.launchURL;
                logger.debug("Launch URL found for widget: " + w.name + " -> " + launchUrlmyApps);
            }
            }

            // widget tags
            var tagResp = openidm.query(
                "managed/alpha_kyid_dashboardapplicationwidget/" + wId + "/widgetTags",
                { "_queryFilter": "true" }
            );
            var tagResp = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + wId + "/widgetTags", { "_queryFilter":"true" });
            tagResp.result.forEach(t => {
                var tObj = openidm.read("managed/alpha_kyid_tag/" + t._refResourceId);
                if (tObj) widgetTagsList.push({id: t._refResourceId, name: tObj.name});
            });

            //Push details
            appResults.push({
                businessAppId: w._id || null,
                businessAppName: widgetTitle,
                widgetDisplayBanner : widDisplayBanner,
                businessAppDescription: widgetDisplayDesc,
                businessAppURL: launchUrlmyApps || null,
                widgetmaintainenceView: maintainanceView,
                widgetmaintainenceMessage: maintainanceMessage,
                widgettag: widgetTagsList,
                widgetLogoURL: w.logoURL || null
            });
        }
        }
   else {
        nodeLogger.debug("No widget selected in nodeState");
    }

    callbacksBuilder.confirmationCallback(0, ["Cancel"], 0);
    return appResults;
}

function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        logger.debug("Selected Outcome: " + selectedOutcome);

        if (selectedOutcome === 0) {
          return "cancel";
        }
        return "true";
    } catch (e) {
        logger.error("Error in handleUserResponses: " + e);
        return "false";
    }
}

// Main
var userId = nodeState.get("_id");

nodeLogger.debug("Fetching view app using userId: " + userId);

if (callbacks.isEmpty()) {
    var results = getAppDetails();
    if (!results || results.length === 0) {
        callbacksBuilder.textOutputCallback(0, "No_results_found.");
        nodeLogger.debug("No App found.");
        action.goTo(NodeOutcome.FALSE);
    } else {
        callbacksBuilder.textOutputCallback(0, JSON.stringify(results));
        nodeLogger.debug("Results: " + JSON.stringify(results));
    }
} else {
    var outcome = handleUserResponses();
    nodeState.putShared("roleIds", null);
    nodeState.putShared("appIDinWidget", null);
    action.goTo(outcome);
}



// var dateTime = new Date().toISOString();
// var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// // Node Config
// var nodeConfig = {
//     begin: "Beginning Node Execution",
//     node: "Node",
//     nodeName: "DisplayViewAppScreen",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.DisplayViewBusinessAppScreen",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     CANCEL: "cancel",
//     FALSE: "false",
//     TRUE: "true"
// };

// // Logging function
// var nodeLogger = {
//     debug: function (message) {
//         logger.debug(message);
//     },
//     error: function (message) {
//         logger.error(message);
//     },
//     info: function (message) {
//         logger.info(message);
//     }
// };

// var appLib = require("KYID.2B1.Library.Dashboard"); // for getWidgetTags etc.
// var ops = require("KYID.2B1.Library.IDMobjCRUDops");
// function getAppDetails() {
//     var appResults = [];
//     var widgetTagsList = [];
//     var maintainanceView = false;

//     var maintainanceMessage = null, widgetDisplayDesc = null, widgetTitle = null;

//     // Read widget data
//     var wId = nodeState.get("widgetselected");
//     logger.error("the wID::"+wId)
//     if (wId) {
//         var w = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + wId);
//         if (w) {
//             var maintainanceView = false;
//             if (w.maintenanceModeSettingsisEnabled !== undefined && w.maintenanceModeSettingsisEnabled !== null) {
//                 maintainanceView = w.maintenanceModeSettingsisEnabled;
//             }
//             maintainanceMessage = w.maintenanceModeSettingsmessage || null;

//             // Content attributes for localized data
//             widgetTitle = (w.content && w.content[0] && w.content[0].title) || {};

//             if(nodeState.get("myAppsJourney")=="true"){
//               widgetDisplayDesc = (w.content && w.content[0] && w.content[0].myAppsDescription) || {};
//             } else {
//               widgetDisplayDesc = (w.content && w.content[0] && w.content[0].appLibDescription) || {};
//             }
 

//             // widget tags
//             var tagResp = openidm.query(
//                 "managed/alpha_kyid_dashboardapplicationwidget/" + wId + "/widgetTags",
//                 { "_queryFilter": "true" }
//             );
//             var tagResp = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + wId + "/widgetTags", { "_queryFilter":"true" });
//             tagResp.result.forEach(t => {
//                 var tObj = openidm.read("managed/alpha_kyid_tag/" + t._refResourceId);
//                 if (tObj) widgetTagsList.push({id: t._refResourceId, name: tObj.name});
//             });

//             //Push details
//             appResults.push({
//                 businessAppId: w._id || null,
//                 businessAppName: widgetTitle,
//                 businessAppDescription: widgetDisplayDesc,
//                 businessAppURL: w.myAppsSettings.launchURL || null,
//                 widgetmaintainenceView: maintainanceView,
//                 widgetmaintainenceMessage: maintainanceMessage,
//                 widgettag: widgetTagsList,
//                 widgetLogoURL: w.logoURL || null
//             });
//         }
//     } else {
//         nodeLogger.error("No widget selected in nodeState");
//     }

//     callbacksBuilder.confirmationCallback(0, ["Cancel"], 0);
//     return appResults;
// }

// function handleUserResponses() {
//     try {
//         var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

//         logger.error("Selected Outcome: " + selectedOutcome);

//         if (selectedOutcome === 0) {
//           return "cancel";
//         }
//         return "true";
//     } catch (e) {
//         logger.error("Error in handleUserResponses: " + e);
//         return "false";
//     }
// }

// // Main
// var userId = nodeState.get("_id");

// nodeLogger.error("Fetching view app using userId: " + userId);

// if (callbacks.isEmpty()) {
//     var results = getAppDetails();
//     if (!results || results.length === 0) {
//         callbacksBuilder.textOutputCallback(0, "No_results_found.");
//         nodeLogger.error("No App found.");
//         action.goTo(NodeOutcome.FALSE);
//     } else {
//         callbacksBuilder.textOutputCallback(0, JSON.stringify(results));
//         nodeLogger.error("Results: " + JSON.stringify(results));
//     }
// } else {
//     var outcome = handleUserResponses();
//     nodeState.putShared("roleIds", null);
//     nodeState.putShared("appIDinWidget", null);
//     action.goTo(outcome);
// }
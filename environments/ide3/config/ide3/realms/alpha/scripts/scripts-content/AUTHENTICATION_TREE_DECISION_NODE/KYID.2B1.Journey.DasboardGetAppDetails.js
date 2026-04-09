var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "DisplayViewAppScreen",
    script: "Script",
    scriptName: "KYID.2B1.Journey.DisplayViewAppScreen",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    CANCEL: "cancel",
    FALSE: "false",
    true: "true"
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

var appLib = require("KYID.2B1.Lib.GetAppandBusinessApp");
var ops = require("KYID.2B1.Library.IDMobjCRUDops");

function getAppDetails() {
    var appResults = [];
    if (nodeState.get("roleIds")) {
        logger.debug("It is getting the application from the role");
        var roleId = nodeState.get("roleIds");
        var appResultsfromRole = appLib.getAppAndBusinessAppFromRole(roleId);
        logger.debug("appResultsfromRole is" + JSON.stringify(appResultsfromRole));
    
        for (var i = 0; i < appResultsfromRole.length; i++) {
            var appEntry = appResultsfromRole[i];
            var maintainanceView = null;
            var widgetTagsList = [];
    
            if (nodeState.get("widgetSelected")) {
                var widgetId = nodeState.get("widgetSelected");
                logger.debug("widget selected " + widgetId);
                var widgetResponse = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);
                if (widgetResponse && widgetResponse.maintainanceView && widgetResponse.maintainanceView[0]) {
                    maintainanceView = widgetResponse.maintainanceView[0].enableMode;
                    var maintainanceMessage = widgetResponse.maintainanceView[0].message
                }
    
                var widgettagResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId + "/widgetTags", {
                    "_queryFilter": "true"
                }, []);
    
                if (widgettagResponse && widgettagResponse.result.length > 0) {
                    for (var j = 0; j < widgettagResponse.result.length; j++) {
                        var tagID = widgettagResponse.result[j]._refResourceId;
                        var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
                        if (tagObj) {
                            widgetTagsList.push({ id: tagID, name: tagObj.name, code: tagObj.code });
                        }
                    }
                }
            }
    
            // Add enriched data to appEntry
            appEntry.widgetmaintainenceView = maintainanceView;
            appEntry.widgetmaintainenceMessage = maintainanceMessage;
            appEntry.widgettag = widgetTagsList;
    
            // Push into final appResults array
            appResults.push(appEntry);
        }
    }
    
    
    else if (nodeState.get("appIDinWidget")) {
        logger.debug("It is getting the application from the user input");
        var appId = nodeState.get("appIDinWidget");
        logger.debug("appId in nodeState: " + appId);

        var appObj = ops.crudOps("read", "alpha_application", null, null, null, appId);
        logger.debug("appObj result: " + JSON.stringify(appObj));
        if (!appObj) {
            logger.debug("No application found for appId: " + appId);
            return []; // Return empty array on failure
        }

        var businessAppId = appObj.businessApplication && appObj.businessApplication._refResourceId;
        logger.debug("businessAppId: " + businessAppId);
        if (!businessAppId) {
            logger.debug("No business application linked with app: " + appId);
            return [];
        }

        var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, businessAppId);
        logger.debug("busApp name: " + busApp.name);
        if (!busApp) {
            logger.debug("Business app not found for id: " + businessAppId);
            return [];
        }

        if(nodeState.get("widgetSelected")){
    var widgetId = nodeState.get("widgetSelected");
    logger.debug("widget selected " + widgetId);
    var widgetResponse = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);
    var maintainanceView = widgetResponse.maintainanceView[0].enableMode
var maintainanceMessage = widgetResponse.maintainanceView[0].message
    var widgettagResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId + "/widgetTags", {
        "_queryFilter": "true"
    }, []);


    var widgetTagsList = [];

                    if (widgettagResponse && widgettagResponse.result.length > 0) {
                        for (var j = 0; j < widgettagResponse.result.length; j++) {
                            var tagID = widgettagResponse.result[j]._refResourceId;
                            var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
                            if (tagObj) {
                                widgetTagsList.push({ id: tagID, name: tagObj.name, code: tagObj.code });
                            }
                        }
                    }

}

        appResults.push({
            appId: appId,
            appName: appObj.name,
            businessAppId: businessAppId,
            businessAppName: busApp.name,
            businessAppLogo: busApp.logoURL,
            businessAppDescription: busApp.description,
            businessAppURL: busApp.applicationURL,
            widgetmaintainenceView: maintainanceView,
            widgetmaintainenceMessage: maintainanceMessage,
            widgettag: widgetTagsList
        });

    } else {
        logger.debug("No roleIds or appIDinWidget found in nodeState.");
    }
 
    callbacksBuilder.confirmationCallback(0, ["Cancel"], 0);
    return appResults;
}


function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        logger.debug("Selected Outcome: " + selectedOutcome);

        if (selectedOutcome === 0) {
          // action.goTo("Cancel")
          return "cancel";
        }
        return "true";
    } catch (e) {
        logger.error("Error in handleUserResponses: " + e);
        return "false";
    }
}
// Main Execution
var userId = nodeState.get("_id");
logger.debug("Fetching widgets for userId: " + userId);
if (callbacks.isEmpty()) {
var getApplicationDetails = getAppDetails();
if (!getApplicationDetails) {
    callbacksBuilder.textOutputCallback(0, "No_results_found.");
    logger.debug("No App found.");
    action.goTo("false");
} else {
    callbacksBuilder.textOutputCallback(0, JSON.stringify(getApplicationDetails));
    logger.debug("Widgets returned for user: " + JSON.stringify(getApplicationDetails));
    //action.goTo("true");
}
} else {
    var result = handleUserResponses();
    nodeState.putShared("roleIds",null)
nodeState.putShared("appIDinWidget",null)
    action.goTo(result);
}



// var appLib = require("KYID.2B1.Lib.GetAppandBusinessApp");
// var ops = require("KYID.2B1.Library.IDMobjCRUDops");

// function getAppDetails() {
//     var appResults = [];


//     if (nodeState.get("roleIds")) {
//         logger.debug("It is getting the application from the role");
//         var roleId = nodeState.get("roleIds");
//         var appResultsfromRole = appLib.getAppAndBusinessAppFromRole(roleId);
//         logger.debug("appResultsfromRole is" + JSON.stringify(appResultsfromRole));
    
//         for (var i = 0; i < appResultsfromRole.length; i++) {
//             var appEntry = appResultsfromRole[i];
//             var maintainanceView = null;
//             var widgetTagsList = [];
    
//             if (nodeState.get("widgetSelected")) {
//                 var widgetId = nodeState.get("widgetSelected");
//                 logger.debug("widget selected " + widgetId);
//                 var widgetResponse = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);
//                 if (widgetResponse && widgetResponse.maintainanceView && widgetResponse.maintainanceView[0]) {
//                     maintainanceView = widgetResponse.maintainanceView[0].enableMode;
//                     var maintainanceMessage = widgetResponse.maintainanceView[0].message
//                 }
    
//                 var widgettagResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId + "/widgetTags", {
//                     "_queryFilter": "true"
//                 }, []);
    
//                 if (widgettagResponse && widgettagResponse.result.length > 0) {
//                     for (var j = 0; j < widgettagResponse.result.length; j++) {
//                         var tagID = widgettagResponse.result[j]._refResourceId;
//                         var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
//                         if (tagObj) {
//                             widgetTagsList.push({ id: tagID, name: tagObj.name, code: tagObj.code });
//                         }
//                     }
//                 }
//             }
    
//             // Add enriched data to appEntry
//             appEntry.widgetmaintainenceView = maintainanceView;
//             appEntry.widgetmaintainenceMessage = maintainanceMessage;
//             appEntry.widgettag = widgetTagsList;
    
//             // Push into final appResults array
//             appResults.push(appEntry);
//         }
//     }
    
    
//     else if (nodeState.get("appIDinWidget")) {
//         logger.debug("It is getting the application from the user input");
//         var appId = nodeState.get("appIDinWidget");
//         logger.debug("appId in nodeState: " + appId);

//         var appObj = ops.crudOps("read", "alpha_application", null, null, null, appId);
//         logger.debug("appObj result: " + JSON.stringify(appObj));
//         if (!appObj) {
//             logger.debug("No application found for appId: " + appId);
//             return []; // Return empty array on failure
//         }

//         var businessAppId = appObj.businessApplication && appObj.businessApplication._refResourceId;
//         logger.debug("businessAppId: " + businessAppId);
//         if (!businessAppId) {
//             logger.debug("No business application linked with app: " + appId);
//             return [];
//         }

//         var busApp = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, businessAppId);
//         logger.debug("busApp name: " + busApp.name);
//         if (!busApp) {
//             logger.debug("Business app not found for id: " + businessAppId);
//             return [];
//         }

//         if(nodeState.get("widgetSelected")){
//     var widgetId = nodeState.get("widgetSelected");
//     logger.debug("widget selected " + widgetId);
//     var widgetResponse = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId);
//     var maintainanceView = widgetResponse.maintainanceView[0].enableMode
// var maintainanceMessage = widgetResponse.maintainanceView[0].message
//     var widgettagResponse = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + widgetId + "/widgetTags", {
//         "_queryFilter": "true"
//     }, []);


//     var widgetTagsList = [];

//                     if (widgettagResponse && widgettagResponse.result.length > 0) {
//                         for (var j = 0; j < widgettagResponse.result.length; j++) {
//                             var tagID = widgettagResponse.result[j]._refResourceId;
//                             var tagObj = openidm.read("managed/alpha_kyid_tag/" + tagID);
//                             if (tagObj) {
//                                 widgetTagsList.push({ id: tagID, name: tagObj.name, code: tagObj.code });
//                             }
//                         }
//                     }

// }

//         appResults.push({
//             appId: appId,
//             appName: appObj.name,
//             businessAppId: businessAppId,
//             businessAppName: busApp.name,
//             businessAppLogo: busApp.logoURL,
//             businessAppDescription: busApp.description,
//             businessAppURL: busApp.applicationURL,
//             widgetmaintainenceView: maintainanceView,
//             widgetmaintainenceMessage: maintainanceMessage,
//             widgettag: widgetTagsList
//         });

//     } else {
//         logger.debug("No roleIds or appIDinWidget found in nodeState.");
//     }

//     return appResults;
// }

// // Main Execution
// var userId = nodeState.get("_id");
// logger.debug("Fetching widgets for userId: " + userId);

// var getApplicationDetails = getAppDetails();

// if (!getApplicationDetails) {
//     callbacksBuilder.textOutputCallback(0, "No_results_found.");
//     logger.debug("No App found.");
//     outcome = "false";
// } else {
//     callbacksBuilder.textOutputCallback(0, JSON.stringify(getApplicationDetails));
//     logger.debug("Widgets returned for user: " + JSON.stringify(getApplicationDetails));
//     outcome = "true";
// }

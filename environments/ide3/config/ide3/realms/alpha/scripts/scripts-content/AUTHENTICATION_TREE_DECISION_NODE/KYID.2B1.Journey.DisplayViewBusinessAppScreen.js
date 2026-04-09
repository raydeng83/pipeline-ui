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

var appLib = require("KYID.2B1.Library.Dashboard"); // for getWidgetTags etc.
var ops = require("KYID.2B1.Library.IDMobjCRUDops");

// Lookup functions

function getAppDetails() {
    var appResults = [];
    var widgetTagsList = [];
    var maintainanceView = null, maintainanceMessage = null;

    if (nodeState.get("roleIds")) {
        logger.debug("role based widget")
        // role-based flow
        var roleName = nodeState.get("roleIds");
        var roleObj = appLib.getRoleByName(roleName);
        if (!roleObj) { 
          nodeLogger.debug("Role not found: " + roleName); 
          return appResults; 
        }

        var apps = appLib.getBusinessAppInfoFromRole(roleObj._id);
        widgetTagsList = [];
        nodeLogger.debug("Apps from role: " + JSON.stringify(apps));

        if (nodeState.get("widgetSelected")) {
            var wId = nodeState.get("widgetSelected");
            var w = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + wId);

            var maintainanceView = false;
            if (w.maintenanceModeSettingsisEnabled !== undefined && w.maintenanceModeSettingsisEnabled !== null) {
                maintainanceView = w.maintenanceModeSettingsisEnabled;
            }
            
            //maintainanceView = w.maintenanceModeSettingsisEnabled || null;
            maintainanceMessage = w.maintenanceModeSettingsmessage || null;
            widgetDisplayDesc = w.description || null;

            var tagResp = openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + wId + "/widgetTags", { "_queryFilter":"true" });
            tagResp.result.forEach(t => {
                var tObj = openidm.read("managed/alpha_kyid_tag/" + t._refResourceId);
                if (tObj) widgetTagsList.push({id: t._refResourceId, name: tObj.name});
            });
        }

        apps.forEach(a => {
            a.widgetmaintainenceView = maintainanceView;
            a.widgetmaintainenceMessage = maintainanceMessage;
            a.widgettag = widgetTagsList;
            a.widgetdisplaydescription = widgetDisplayDesc;
            appResults.push(a);
        });
    }
    else if (nodeState.get("appIDinWidget")) {
        var appName = nodeState.get("appIDinWidget");
        var appObj = appLib.getBusinessAppByName(appName);
        if (!appObj) { nodeLogger.debug("App not found: " + appName); return appResults; }

        var widgetTagsList = [], maintainanceView = null, maintainanceMessage = null;
        if (nodeState.get("widgetSelected")) {
            var w = openidm.read("managed/alpha_kyid_dashboardapplicationwidget/" + nodeState.get("widgetSelected"));

            var maintainanceView = false;
            if (w.maintenanceModeSettingsisEnabled !== undefined && w.maintenanceModeSettingsisEnabled !== null) {
                maintainanceView = w.maintenanceModeSettingsisEnabled;
            }
            
            //maintainanceView = w.maintenanceModeSettingsisEnabled || null;
            maintainanceMessage = w.maintenanceModeSettingsmessage || null;
            widgetDisplayDesc = w.description || null;
            
            openidm.query("managed/alpha_kyid_dashboardapplicationwidget/" + nodeState.get("widgetSelected") + "/widgetTags", { "_queryFilter":"true" }).result
                .forEach(t => {
                    var tObj = openidm.read("managed/alpha_kyid_tag/" + t._refResourceId);
                    if (tObj) widgetTagsList.push({id: t._refResourceId, name: tObj.name});
                });
        }

        appResults.push({
            businessAppId: appObj._id,
            businessAppName: appObj.name,
            businessAppLogo: appObj.logoURL,
            businessAppDescription: appObj.description,
            businessAppURL: appObj.applicationURL,
            widgetmaintainenceView: maintainanceView,
            widgetmaintainenceMessage: maintainanceMessage,
            widgettag: widgetTagsList,
            widgetdisplaydescription: widgetDisplayDesc
        });
    }
    else {
        nodeLogger.debug("No roleIds or appIDinWidget found in nodeState.");
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
//var userId = "798c6cf1-899c-45fd-83c9-06e44a51738c"; // test
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
var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "DisplaymyAppsScreen",
    script: "Script",
    scriptName: "KYID.2B1.Journey.DisplaymyAppsScreen",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    VIEWAPPDETAILS: "viewappdetails",
    SHOWLARGEICON: "showlargeicon",
    REMOVEROLE: "removerole",
    MANAGEACCESS: "manageaccess",
    DATAMISSING: "internalerrordatamissing",
    INVALIDACTION: "invalidaction",
    INVALIDINPUT: "invalidjson",
    ERROR: "error"
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

function deepSortAndRemoveActions(obj) {
    function sortKeys(o) {
        if (Array.isArray(o)) {
            return o.map(sortKeys);
        } else if (o !== null && typeof o === 'object') {
            const sorted = {};
            Object.keys(o).sort().forEach(key => {
                if (key !== 'ellipsisActions') {
                    sorted[key] = sortKeys(o[key]);
                }
            });
            return sorted;
        }
        return o;
    }

    return sortKeys(obj);
}

function clearSharedState() {
    nodeState.putShared("invalidJSONError", null);
    nodeState.putShared("invalidAction", null);
    nodeState.putShared("myappswidgets", null);
    nodeState.putShared("unexpectederror", null);
    nodeState.putShared("roleremovalstatus", null);
    nodeState.putShared("validationError", null);
    nodeState.putShared("internaluser", null);
    nodeState.putShared("rolenotremovable", null);
    nodeState.putShared("requestroleType",null);
}


function requestCallbacks() {
    logger.debug("Inside requestCallbacks");

    try {
        var allAppsResponse = nodeState.get("allAppsResponse");

        if (allAppsResponse) {
            logger.debug("Displaying allAppsResponse: " + allAppsResponse);
            callbacksBuilder.textOutputCallback(0, allAppsResponse);
        } else {
            logger.debug("No allAppsResponse found in nodeState.");
            // No output here anymore
        }

        callbacksBuilder.textInputCallback("Enter JSON Input");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        logger.error("Error in requestCallbacks: " + error.message);
    }
}

function handleUserResponses() {
    try {
        var inputJsonString = callbacks.getTextInputCallbacks().get(0);
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        logger.debug("Selected Outcome: " + selectedOutcome);
        logger.debug("User Input JSON String: " + inputJsonString);

        if (selectedOutcome === 0) {
            try {
                var parsedInput = JSON.parse(inputJsonString);

                var inputId = parsedInput.roleId || parsedInput.applicationId;
                var inputType = parsedInput.roleId ? "roleId" : parsedInput.applicationId ? "applicationId" : null;
                var actionName = parsedInput.action;

                if (!inputId || !inputType || !actionName) {
                    logger.debug("Missing roleId/applicationId or action.");
                    nodeState.putShared("validationError", "invalidjson");
                    return;
                }

                var allAppsResponseString = nodeState.get("allAppsResponse");
                if (!allAppsResponseString) {
                    logger.debug("No allAppsResponse found.");
                    nodeState.putShared("validationError", "internalerrordatamissing");
                    return;
                }

                var allWidgets = JSON.parse(allAppsResponseString);

                var matchedWidget = allWidgets.find(function (w) {
                    return inputType === "roleId"
                        ? w.widgetRoleID === inputId
                        : w.widgetApplicationID === inputId;
                });

                if (!matchedWidget) {
                    logger.debug("No widget matched for provided ID.");
                    nodeState.putShared("validationError", "invalidjson");
                    return;
                }
                //Store the widget selected info
                var widgetSelected = matchedWidget.widgetId;
                logger.debug("widgetId selected by user is " + widgetSelected);
                nodeState.putShared("widgetSelected", widgetSelected);
                
                var validActionFound = matchedWidget.ellipsisActions.some(function (a) {
                    return a.action === actionName;
                });

                if (!validActionFound) {
                    logger.debug("Action '" + actionName + "' not found in widget ellipsisActions.");
                    nodeState.putShared("validationError", "invalidaction");
                    return;
                }

                nodeState.putShared("widgetSelected", matchedWidget.widgetId);
                nodeState.putShared("nextAction", actionName);

                if (inputType === "roleId") {
                    nodeState.putShared("roleIds", inputId);
                    logger.debug("Using roleId: " + inputId);
                } else {
                    nodeState.putShared("appIDinWidget", inputId);
                    logger.debug("Using applicationId: " + inputId);
                }

            } catch (jsonErr) {
                logger.error("JSON parsing error: " + jsonErr.message);
                nodeState.putShared("validationError", "invalidjson");
            }
        } else {
            logger.error("User skipped input.");
        }

    } catch (err) {
        logger.error("Error in handleUserResponses: " + err.message);
        nodeState.putShared("validationError", "internalerror");
    }
}

// Main Execution
try {
    if (callbacks.isEmpty()) {
        if(nodeState.get("unexpectederror")){
        var unexpectederror = nodeState.get("unexpectederror")
        callbacksBuilder.textOutputCallback(0, unexpectederror);
       }

        if (nodeState.get("roleremovalstatus")) {
            logger.debug("roles removed found in nodestate KYID.2B1.Journey.DisplaymyAppsScreen")
            var removalSummary = nodeState.get("roleremovalstatus");
            var successCount = 0;
            var failureCount = 0;

            for (var i = 0; i < removalSummary.length; i++) {
                if (removalSummary[i].roleremovalstatus === "success") {
                    successCount++;
                } else if (removalSummary[i].roleremovalstatus === "failure") {
                    failureCount++;
                }
            }

            var summaryMessage = "";
            if (successCount > 0) {
                summaryMessage += successCount + "_role" + (successCount > 1 ? "s" : "") + "_removed_successfully.";
            }
            if (failureCount > 0) {
                if (summaryMessage.length > 0) summaryMessage += " ";
                summaryMessage += failureCount + "_role" + (failureCount > 1 ? "s" : "") + "_failed_to_remove.";
            }

            callbacksBuilder.textOutputCallback(0, summaryMessage);
        }


        if(nodeState.get("myappswidgets")){
            var myappswidgets = nodeState.get("myappswidgets")
            logger.debug("no widgets found for user");
            callbacksBuilder.textOutputCallback(0, "No_widgets_found_for_myApps");
        }

        if(nodeState.get("invalidJSONError") != null){
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidJSONError"));
        }
      if(nodeState.get("invalidAction") != null){
            callbacksBuilder.textOutputCallback(0, nodeState.get("invalidAction"));
       }

        if(nodeState.get("internaluser") != null){
            callbacksBuilder.textOutputCallback(0, nodeState.get("internaluser"));
        }
    if(nodeState.get("rolenotremovable") != null){
            callbacksBuilder.textOutputCallback(0, nodeState.get("rolenotremovable"));
       }
        
        requestCallbacks();

    } else {
        handleUserResponses();

        // Handle validation errors via redirects
        var validationError = nodeState.get("validationError");
        if (validationError) {
            clearSharedState(); // clearing nodestatevalues
            switch (validationError) {
                case "invalidjson":
                    action.goTo("invalidjson");
                    break;
                case "invalidaction":
                    action.goTo("invalidaction");
                    break;
                case "internalerrordatamissing":
                    action.goTo("internalerrordatamissing");
                    break;
                default:
                    action.goTo("error");
            }
            //return;
        }

        // Handle valid nextAction
        var nextAction = nodeState.get("nextAction");
        if (nextAction) {
            clearSharedState(); // clearing nodestatevalues
            switch (nextAction) {
                case "viewAppDetails":
                    action.goTo("viewappdetails");
                    break;
                case "showLargeIcon":
                    action.goTo("showlargeicon");
                    break;
                case "removeRole":
                    action.goTo("removerole");
                    break;
                case "manageAccess":
                    nodeState.putShared("requestroleType","MY_APPS")
                    action.goTo("manageaccess");
                    break;
                default:
                    logger.error("Unknown action: " + nextAction);
                    action.goTo("error");
            }
        }
    }
} catch (error) {
    logger.error("Fatal error in main: " + error.message);
    action.goTo("error");
}

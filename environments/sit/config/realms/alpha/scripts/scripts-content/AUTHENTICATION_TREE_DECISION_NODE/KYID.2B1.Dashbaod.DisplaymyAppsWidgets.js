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

                if (!Array.isArray(parsedInput) || parsedInput.length !== 1) {
                    logger.debug("Invalid JSON format - not a single widget array.");
                    nodeState.putShared("validationError", "invalidjson");
                    return;
                }

                var inputWidget = parsedInput[0];

                if (!inputWidget.ellipsisActions || !Array.isArray(inputWidget.ellipsisActions) || inputWidget.ellipsisActions.length !== 1) {
                    logger.debug("Widget must have exactly one ellipsisAction.");
                    nodeState.putShared("validationError", "invalidaction");
                    return;
                }

                var inputAction = inputWidget.ellipsisActions[0];
                var allAppsResponseString = nodeState.get("allAppsResponse");

                if (!allAppsResponseString) {
                    logger.debug("No allAppsResponse found.");
                    nodeState.putShared("validationError", "internalerrordatamissing");
                    return;
                }

                var allWidgets = JSON.parse(allAppsResponseString);
                var inputSorted = deepSortAndRemoveActions(inputWidget);

                var matchedOriginal = allWidgets.find(function(originalWidget) {
                    var originalSorted = deepSortAndRemoveActions(originalWidget);
                    return JSON.stringify(originalSorted) === JSON.stringify(inputSorted);
                });

                if (!matchedOriginal) {
                    logger.debug("Widget data altered.");
                    nodeState.put("validationError", "invalidjson");
                    return;
                }

                var validActionFound = matchedOriginal.ellipsisActions.some(function (origAction) {
                    return origAction.action === inputAction.action && origAction.label === inputAction.label;
                });

                if (!validActionFound) {
                    logger.debug("Invalid action selected.");
                    nodeState.putShared("validationError", "invalidaction");
                    return;
                }

                // Valid input
                nodeState.putShared("userInputJson", parsedInput);

                var roleOrAppId = null;
                if (inputWidget.widgetRoleID != null) {
                    roleOrAppId = inputWidget.widgetRoleID;
                    var widgetSelected = inputWidget.widgetId;
                    logger.debug("widgetId selected by user is"+widgetSelected)
                    nodeState.putShared("widgetSelected", widgetSelected);
                    nodeState.putShared("roleIds", roleOrAppId);
                    logger.debug("Using widgetRoleID: " + roleOrAppId);
                } else if (inputWidget.widgetApplicationID != null) {
                    roleOrAppId = inputWidget.widgetApplicationID;
                    var widgetSelected = inputWidget.widgetId;
                    logger.debug("widgetId selected by user is"+widgetSelected)
                    nodeState.putShared("widgetSelected", widgetSelected);
                    nodeState.putShared("appIDinWidget", roleOrAppId);
                    logger.debug("Using widgetApplicationID: " + roleOrAppId);
                } else {
                    logger.debug("No role or app ID found.");
                    nodeState.putShared("validationError", "invalidjson");
                    return;
                }

                nodeState.putShared("nextAction", inputAction.action);

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
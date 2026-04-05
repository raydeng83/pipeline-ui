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

function requestCallbacks() {
    logger.debug("Inside requestCallbacks");

    try {
        var allAppsResponse = nodeState.get("allAppsResponse");

        if (allAppsResponse) {
            logger.debug("Displaying allAppsResponse: " + allAppsResponse);
            callbacksBuilder.textOutputCallback(0, allAppsResponse);
        } else {
            logger.error("No allAppsResponse found in nodeState.");
            //callbacksBuilder.textOutputCallback(0, "No available app data.");
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

                // Validate it's a single widget
                if (!Array.isArray(parsedInput) || parsedInput.length !== 1) {
                    logger.debug("Input must be a JSON array with exactly one widget.");
                    callbacksBuilder.textOutputCallback(0, "Enter a JSON array with only one widget object.");
                    return;
                }

                var inputWidget = parsedInput[0];

                // Validate ellipsisActions
                if (!inputWidget.ellipsisActions || !Array.isArray(inputWidget.ellipsisActions) || inputWidget.ellipsisActions.length !== 1) {
                    logger.debug("Widget must contain exactly one ellipsisAction.");
                    callbacksBuilder.textOutputCallback(0, "Widget must have only one action in ellipsisActions.");
                    return;
                }

                var inputAction = inputWidget.ellipsisActions[0];

                // Fetch and parse original widget list from nodeState
                var allAppsResponseString = nodeState.get("allAppsResponse");

                if (!allAppsResponseString) {
                    logger.debug("No allAppsResponse found in nodeState.");
                    callbacksBuilder.textOutputCallback(0, "Internal error: original widget data missing.");
                    return;
                }

                var allWidgets = JSON.parse(allAppsResponseString);

                // Find a matching widget (excluding actions)
                var inputSorted = deepSortAndRemoveActions(inputWidget);
                var matchedOriginal = allWidgets.find(function(originalWidget) {
                    var originalSorted = deepSortAndRemoveActions(originalWidget);
                    return JSON.stringify(originalSorted) === JSON.stringify(inputSorted);
                });

                if (!matchedOriginal) {
                    logger.debug("Input widget does not match any widget from allAppsResponse.");
                    callbacksBuilder.textOutputCallback(0, "Do not alter the widget data. Only choose an action.");
                    return;
                }

                // Check if the selected action is valid for this widget
                // var validActionFound = matchedOriginal.ellipsisActions.some(function (origAction) {
                //     return origAction.action === inputAction.action;
                // });

                var validActionFound = matchedOriginal.ellipsisActions.some(function (origAction) {
                return origAction.action === inputAction.action && origAction.label === inputAction.label;
            });
                if (!validActionFound) {
                    logger.debug("Invalid action selected: " + inputAction.action);
                    callbacksBuilder.textOutputCallback(0, "Selected action is not valid for the chosen widget.");
                    return;
                }

                // Valid input - Save and proceed
                logger.debug("Valid input. Action selected: " + inputAction.action);
                nodeState.putShared("userInputJson", parsedInput);

                //Get RoleID or ApplicationID from the input
               var roleOrAppId = null;

                if (inputWidget.widgetRoleID != null) {
                    roleOrAppId = inputWidget.widgetRoleID;
                    nodeState.putShared("roleIds", roleOrAppId);
                    logger.debug("Using widgetRoleID: " + roleOrAppId);
                } else if (inputWidget.widgetApplicationID != null) {
                    roleOrAppId = inputWidget.widgetApplicationID;
                    nodeState.putShared("appIDinWidget", roleOrAppId);
                    logger.debug("Using widgetApplicationID: " + roleOrAppId);
                    
                } else {
                    logger.debug("Neither widgetRoleID nor widgetApplicationID is present.");
                    callbacksBuilder.textOutputCallback(0, "Widget must include either a widgetRoleID or widgetApplicationID.");
                    return;
                }
                
                // Save to nodeState
                

                
                switch (inputAction.action) {
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
                        logger.debug("Unknown action: " + inputAction.action);
                        callbacksBuilder.textOutputCallback(0, "Unknown action: " + inputAction.action);
                        break;
                }

            } catch (jsonErr) {
                logger.error("JSON parsing error: " + jsonErr.message);
                callbacksBuilder.textOutputCallback(0, "Invalid JSON format.");
            }
        } else {
            logger.error("User skipped input. Proceeding without action.");
        }

    } catch (err) {
        logger.error("Error in handleUserResponses: " + err.message);
    }
}

// Main Execution
try {
    if (callbacks.isEmpty()) {
        if(nodeState.get("unexpectederror")){
        var unexpectederror = nodeState.get("unexpectederror")
        callbacksBuilder.textOutputCallback(0, unexpectederror);
       }

        if(nodeState.get("roleremovalstatus")){
    var removalSummary = nodeState.get("roleremovalstatus");
    logger.debug("role removal status found in nodestate")

 
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
logger.debug("role removal message" +summaryMessage)
// Output the summary message
callbacksBuilder.textOutputCallback(0, summaryMessage);
}

        if(nodeState.get("myappswidgets")){
    var myappswidgets = nodeState.get("myappswidgets")
    logger.debug("no widgets found for user");
    callbacksBuilder.textOutputCallback(0, "No_widgets_found_for_myApps");
}
        
        logger.debug("Callbacks are empty. Starting user input process.");
        requestCallbacks();
    } else {
        logger.error("Callbacks exist. Handling user responses.");
        handleUserResponses();
    }
} catch (error) {
    logger.error("Error in main execution: " + error.message);
}


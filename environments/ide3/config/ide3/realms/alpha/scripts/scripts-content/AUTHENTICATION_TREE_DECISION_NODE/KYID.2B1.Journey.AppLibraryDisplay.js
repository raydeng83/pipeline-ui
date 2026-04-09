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
    logger.debug("Clearing shared state due to validation failure.");
    nodeState.putShared("inputError", null);
    nodeState.putShared("invalidJSONError", null);
    nodeState.putShared("invalidAction", null);
    nodeState.putShared("unexpectederror", null);
    nodeState.putShared("roleremovalstatus", null);
    nodeState.putShared("internaluser",null) ;
}

function requestCallbacks() {
    logger.debug("Inside requestCallbacks");

    try {
        var combinedResponse = nodeState.get("combinedWidgets");

        if (combinedResponse) {
            logger.debug("Displaying combinedResponse: " + combinedResponse);
            callbacksBuilder.textOutputCallback(0, combinedResponse);
        } else {
            logger.debug("No combinedResponse found in nodeState.");
            callbacksBuilder.textOutputCallback(0, "No available app data.");
        }

        callbacksBuilder.textInputCallback("Enter JSON Input");
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        logger.error("Error in requestCallbacks: " + error.message);
    }
}

function handleUserResponses() {
    try {
        //nodeState.putShared("inputError");  // Reset error

        var inputJsonString = callbacks.getTextInputCallbacks().get(0);
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        logger.debug("Selected Outcome: " + selectedOutcome);
        logger.debug("User Input JSON String: " + inputJsonString);

        if (selectedOutcome === 0) {
            try {
                var parsedInput = JSON.parse(inputJsonString);

                // Validate it's a single widget
                if (!Array.isArray(parsedInput) || parsedInput.length !== 1) {
                    logger.debug("Invalid widget input structure.");
                    nodeState.putShared("inputError", "invalidjson");
                    return;
                }

                var inputWidget = parsedInput[0];

                // Validate ellipsisActions
                if (!inputWidget.ellipsisActions || !Array.isArray(inputWidget.ellipsisActions) || inputWidget.ellipsisActions.length !== 1) {
                    logger.debug("Widget must contain exactly one ellipsisAction.");
                    nodeState.putShared("inputError", "invalidaction");
                    return;
                }

                var inputAction = inputWidget.ellipsisActions[0];

                // Fetch original widget list
                var allAppsResponseString = nodeState.get("combinedWidgets");

                if (!allAppsResponseString) {
                    logger.debug("No allAppsResponse found in nodeState.");
                    nodeState.putShared("inputError", "internalerrordatamissing");
                    return;
                }

                var allWidgets = JSON.parse(allAppsResponseString);

                // Find matching widget
                var inputSorted = deepSortAndRemoveActions(inputWidget);
                var matchedOriginal = allWidgets.find(function(originalWidget) {
                    var originalSorted = deepSortAndRemoveActions(originalWidget);
                    return JSON.stringify(originalSorted) === JSON.stringify(inputSorted);
                });

                if (!matchedOriginal) {
                    logger.debug("Input widget does not match any original widget.");
                    nodeState.putShared("inputError", "invalidjson");
                    return;
                }

                // Validate action
                var validActionFound = matchedOriginal.ellipsisActions.some(function(origAction) {
                    return origAction.action === inputAction.action && origAction.label === inputAction.label;
                });

                if (!validActionFound) {
                    logger.debug("Invalid action selected: " + inputAction.action);
                    nodeState.putShared("inputError", "invalidaction");
                    return;
                }

                // Store valid input
                logger.debug("Valid input. Action selected: " + inputAction.action);
                nodeState.putShared("userInputJson", parsedInput);

                var roleOrAppId = null;

                if (inputWidget.widgetRoleID != null) {
                    roleOrAppId = inputWidget.widgetRoleID;
                    nodeState.putShared("roleIds", roleOrAppId);
                    var widgetSelected = inputWidget.widgetId;
                    logger.debug("widgetId selected by user is"+widgetSelected)
                    nodeState.putShared("widgetSelected", widgetSelected);
                    logger.debug("Using widgetRoleID: " + roleOrAppId);
                } else if (inputWidget.widgetApplicationID != null) {
                    roleOrAppId = inputWidget.widgetApplicationID;
                    nodeState.putShared("appIDinWidget", roleOrAppId);
                    var widgetSelected = inputWidget.widgetId;
                    logger.debug("widgetId selected by user is"+widgetSelected)
                    nodeState.putShared("widgetSelected", widgetSelected);
                    logger.debug("Using widgetApplicationID: " + roleOrAppId);
                } else {
                    logger.debug("Neither widgetRoleID nor widgetApplicationID is present.");
                    nodeState.putShared("inputError", "internalerrordatamissing");
                    return;
                }

                // Store action to take
                nodeState.putShared("actionToTake", inputAction.action);

            } catch (jsonErr) {
                logger.error("JSON parsing error: " + jsonErr.message);
                nodeState.putShared("inputError", "invalidjson");
                return;
            }
        } else {
            logger.debug("User skipped input. Proceeding without action.");
        }

    } catch (err) {
        logger.error("Error in handleUserResponses: " + err.message);
    }
}

// ===== Main Execution =====

try {
    if (callbacks.isEmpty()) {
        // Handle unexpected or post-removal summary messages
        if (nodeState.get("unexpectederror")) {
            var unexpectederror = nodeState.get("unexpectederror");
            callbacksBuilder.textOutputCallback(0, unexpectederror);
        }

        if (nodeState.get("roleremovalstatus")) {
            var removalSummary = nodeState.get("roleremovalstatus");
            logger.debug("role removal status found in nodestate");

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

            logger.debug("role removal message: " + summaryMessage);
            callbacksBuilder.textOutputCallback(0, summaryMessage);
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

        logger.debug("Callbacks are empty. Starting user input process.");
        requestCallbacks();

    } else {
        logger.debug("Callbacks exist. Handling user responses.");
        handleUserResponses();

        // Post-handling: check for validation errors
        var validationError = nodeState.get("inputError");
        if (validationError) {
            logger.debug("Redirecting due to validation error: " + validationError);
            clearSharedState();

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
                    break;
            }
        }

        // Proceed with valid action
        var actionToTake = nodeState.get("actionToTake");
        if (actionToTake) {
            logger.debug("Proceeding to action node: " + actionToTake);
            clearSharedState();
            switch (actionToTake) {
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
                    logger.debug("Unknown action: " + actionToTake);
                    action.goTo("error");
                    break;
            }
        }
    }
} catch (error) {
    logger.error("Error in main execution: " + error.message);
    action.goTo("error");
}
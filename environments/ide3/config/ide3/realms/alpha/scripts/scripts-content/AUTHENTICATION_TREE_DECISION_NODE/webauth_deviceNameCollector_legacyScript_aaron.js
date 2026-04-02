/**
 * Takes the nodeState webauthnDeviceData object, prompts the user for a user-friendly name of the device, 
 * updates the transientState. If user skips it, then it does nothing.
 */

/**
 * Node imports
 */
var javaImports = JavaImporter(
    org.forgerock.openam.auth.node.api.Action,
    javax.security.auth.callback.ConfirmationCallback,
    javax.security.auth.callback.NameCallback,
    java.lang.String
);

/**
 * Node outcomes
 */

var nodeOutcomes = {
    SAVE: "save",
    SKIP: "skip"
};

/**
 * Node config
 */

var nodeConfig = {
    BUTTONS: ["SAVE", "SKIP"],
    SAVE_ACTION_PRESSED: 0,
    SKIP_ACTION_PRESSED: 1,
    deviceDataSharedStatePropertyName: "webauthnDeviceData",
    callbackDisplayTextDeviceNameInput: "Security key name",
    nodeName: "***SecurityKeyNameCollector"
};


/**
 * Node logger
 */

var nodeLogger = {
    debug: function(message) {
        logger.message("***" + nodeConfig.nodeName + " " + message);
    },
    warning: function(message) {
        logger.warning("***" + nodeConfig.nodeName + " " + message);
    },
    error: function(message) {
        logger.error("***" + nodeConfig.nodeName + " " + message);
    }
};

/**
 * Main
 */

(function() {
    nodeLogger.debug("node executing");
    if (callbacks.isEmpty()) {
        action = javaImports.Action.send(
            javaImports.NameCallback(nodeConfig.callbackDisplayTextDeviceNameInput),
            javaImports.ConfirmationCallback(javaImports.ConfirmationCallback.INFORMATION, nodeConfig.BUTTONS, 0)
        ).build();
    } else {
        var userSelection = callbacks[1].getSelectedIndex();
        nodeLogger.debug("User selected: " + userSelection);
        if (userSelection === nodeConfig.SAVE_ACTION_PRESSED) {
            var deviceInputName = javaImports.String(callbacks.get(0).getName());
            nodeLogger.debug("Setting new device name:" + deviceInputName);
            var webauthnDeviceData = nodeState.get(nodeConfig.deviceDataSharedStatePropertyName);
            webauthnDeviceData.put("deviceName", deviceInputName);
            transientState.put("webauthnDeviceData", webauthnDeviceData);
            action = javaImports.Action.goTo(nodeOutcomes.SAVE).build();
        } else {
            action = javaImports.Action.goTo(nodeOutcomes.SKIP).build();
        }
    }
})();
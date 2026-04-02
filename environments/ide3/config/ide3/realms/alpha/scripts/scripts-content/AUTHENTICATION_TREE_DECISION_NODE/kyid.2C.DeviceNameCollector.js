/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

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
 * Main
 */

if (callbacks.isEmpty()) {
    callbacksBuilder.nameCallback(nodeConfig.callbackDisplayTextDeviceNameInput);
    callbacksBuilder.confirmationCallback(0, nodeConfig.BUTTONS, 0)
} else {
    var userSelection = callbacks.getConfirmationCallbacks().get(0);
    if (userSelection === nodeConfig.SAVE_ACTION_PRESSED) {
        var deviceInputName = callbacks.getNameCallbacks().get(0);
        var webauthnDeviceData = nodeState.get(nodeConfig.deviceDataSharedStatePropertyName);
        webauthnDeviceData.put("deviceName", deviceInputName);
        //nodeState.putTransient("webauthnDeviceData", webauthnDeviceData);
        nodeState.putShared("webauthnDeviceData", webauthnDeviceData);
        action.goTo(nodeOutcomes.SAVE);
    } else {
        action.goTo(nodeOutcomes.SKIP);
    }
}

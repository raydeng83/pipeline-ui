/**
 * Script: KYID.Journey.ReadDeviceInformation
 * Description: This script is used to read device context from login request.
 * Date: 26th July 2024
 * Author: Deloitte
 */

try {
    var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Device Context",
    script: "Script",
    scriptName: "KYID.Journey.ReadDeviceInformation",
    timestamp: dateTime,
    deviceInfoFound: "Found Device Info",
    deviceInfoNotFound: "Not Found Device Info",
    deviceLongitude: "Device Profile longitude",
    deviceLatitude: "Device Profile latitude",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
};

// Logging Function
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};

if (nodeState.get("forgeRock.device.profile") !== null) {
    var deviceInfo = nodeState.get("forgeRock.device.profile");
    logger.debug("deviceInfo: "+deviceInfo)
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.deviceInfoFound);
    var os = deviceInfo.metadata.platform.deviceName || "";
    var browser = deviceInfo.metadata.browser.userAgent || "";
    nodeState.putShared("os",os);
    nodeState.putShared("browser",browser);
    var locn = deviceInfo["location"];
    var longitude = locn["longitude"];
    nodeState.putShared("longitude",longitude);
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.deviceLongitude+"::"+longitude);
    var latitude = locn["latitude"];
    nodeState.putShared("latitude",latitude);

    
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.deviceLongitude+"::"+latitude);
    
    action.goTo(nodeOutcome.SUCCESS).putSessionProperty('latitude', latitude).putSessionProperty('longitude', longitude);
    
} else {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.deviceInfoNotFound);
    action.goTo(nodeOutcome.ERROR);
}
    
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
     action.goTo(nodeOutcome.ERROR);
}



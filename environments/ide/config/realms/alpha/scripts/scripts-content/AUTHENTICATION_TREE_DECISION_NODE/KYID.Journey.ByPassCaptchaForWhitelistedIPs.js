// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "ByPassCaptchaForWhitelistedIPs",
    script: "Script",
    scriptName: "KYID.Journey.ByPassCaptchaForWhitelistedIPs",
    byPassingCaptcha: "Found Whitelisted IP Bypassing the Captcha",
    enforcingCaptcha: "Whitelisted Not found Enforcing the Captcha",
    headerValueisNull: "Ip Value in Header is null",
    timestamp: dateTime,
    end: "Node Execution Completed"
};
// Node outcomes
var nodeOutcome = {
    SUCCESS: "true",
    ERROR: "false"
};

/**
   * Logging function
   * @type {Function}
   */
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


// Main Execution 
try {


    var headerName = "X-Real-IP";
    var ipArray = systemEnv.getProperty("esv.recaptcha.whitelisted.ip");
    ipArray = JSON.parse(ipArray);
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Whitelisted IPs are: " + ipArray);
    if (requestHeaders.get(headerName) == null) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.headerValueisNull);
        action.goTo(nodeOutcome.ERROR);

    } else {
        var headerValues = requestHeaders.get(headerName);
        var inputIp = String(headerValues.toArray()[0].split(",")[0]);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Client IP is: " + inputIp);
        var result = isIpInArray(inputIp, ipArray);
        if (result == true) {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.byPassingCaptcha);
            action.goTo(nodeOutcome.SUCCESS);
        }
        else {
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.enforcingCaptcha);
            action.goTo(nodeOutcome.ERROR);
        }

    }

} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    action.goTo(nodeOutcome.ERROR);

}



function isIpInArray(inputIp, ipArray) {
    try {
        // Convert IP to a number for comparison
        var ipToNum = (ip) => {
            return ip.split('.').map(Number).reduce((acc, octet) => (acc << 8) + octet, 0);
        };

        var inputIpNum = ipToNum(inputIp);

        // Loop through the array of IPs and ranges
        for (var i = 0; i < ipArray.length; i++) {
            var entry = ipArray[i];
            if (entry.includes('-')) {

                var [rangeStart, rangeEnd] = entry.split('-');
                var startNum = ipToNum(rangeStart);
                var endNum = ipToNum(rangeEnd);
                if (inputIpNum >= startNum && inputIpNum <= endNum) {
                    return true;
                }
            } else {

                if (inputIp === entry) {
                    return true;
                }
            }
        }

        return false;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);

    }

}






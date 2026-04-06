var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "GetTiles",
    nodeName: "GetAdditionalFlagsInfo",
    script: "Script",
    scriptName: "KYID.2B1.Journey.GetTiles",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "Successful"
};

/**
 * Logging function
 * @type {Function}
 */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function(message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function(message) {
        logger.error(message);
    }
};


function getDelegationFlag() {
    var userId = null;
    try {
        if(typeof existingSession!=='undefined' && existingSession){
            userId =  existingSession.get("UserId")
            logger.debug("userId from existingSession: " + userId);
        }
        var delegationFlag = false;

        var requestBody = {
            "payload": {
                "userAccountId": userId,
                "view": "ShowDelegable"
            },
            "action": 4
    };

    // Call loginprerequisite endpoint
    var response = openidm.create("endpoint/mytiles", null, requestBody);
    logger.debug("Response from mytiles endpoint: " + JSON.stringify(response));
    delegationFlag = response ? response.payload ? response.payload.data ? response.payload.data.showDelegable : false : false : false;  
    logger.debug("delegationFlag is: " + delegationFlag);
    return delegationFlag;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: Error in getDelegationFlag: " + error);
        return false;
    }
}

function main() {
    var myAccount = [];
    var kogData = null;
    var EmployeeAgreementsFlag = false;
    var RACFFlag = false;
    var AccessRecertFlag = false;
    var data = null;
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: script started ");
    try {
        // Get kogData from nodeState if available
         var jsonobj = {"pageHeader": "MyAccount_Tiles"};
         callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
        var userData = nodeState.get("userData");
        if (userData != null && userData) {
            kogData = userData;
        } else {
            kogData = {};
        }
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: kogData is "+ JSON.stringify(kogData));

        // Safely extract flags
        EmployeeAgreementsFlag = !!kogData.EmployeeAgreementsFlag;
        RACFFlag = !!kogData.RACFFlag;
        AccessRecertFlag = !!kogData.AccessRecertFlag;
        // EmployeeAgreementsFlag = true;
        // RACFFlag = true;
        // AccessRecertFlag = true;

        // Query account data
        
        var delegationFlag = getDelegationFlag();
        if(delegationFlag){
            data = openidm.query("managed/alpha_kyid_myaccount/", { "_queryFilter": "true" }, []);
        }else{
            data = openidm.query("managed/alpha_kyid_myaccount/", { "_queryFilter": '!(name eq "Delegations")' }, []);
        }
        
        var results = (data && data.result) ? data.result : [];
        var resultLength = results.length;

        // Internal function to push to myAccount
        function pushAccount(item) {
            myAccount.push({
                name: item.name,
                uri: item.uri,
                icon: item.icon,
                content: (item.localizedContent && item.localizedContent[0]) ? item.localizedContent[0].content : "",
                displayname: item.displayname
            });
        }

        // Predefine names for easier checks
        var alwaysIncludeNames = [
            "Personal Information",
            "Login & Security",
            "Delegations",
            "Account Activity",
            "Verified Pre-requisites"
        ];

        // Loop through results
        for (var i = 0; i < resultLength; i++) {
            var item = results[i];
            if (item.name === "Employee Agreements" && EmployeeAgreementsFlag) {
                pushAccount(item);
                continue;
            }
            if (item.name === "RACF Managements" && RACFFlag) {
                pushAccount(item);
                continue;
            }
            if (item.name === "Access recertification" && AccessRecertFlag) {
                pushAccount(item);
                continue;
            }
            if (alwaysIncludeNames.indexOf(item.name) !== -1) {
                pushAccount(item);
            }
        }
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: myAccount is "+ JSON.stringify(myAccount));
        var tiles = {};
        tiles["TilesData"] = myAccount
        if (callbacks.isEmpty()) {
             callbacksBuilder.textOutputCallback(0, JSON.stringify(tiles));
           // callbacksBuilder.textOutputCallback(0, JSON.stringify(myAccount));
        }
        //return { myAccount: myAccount };
    } catch (error) {
        logger.error("Error is :: =>" + error);
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: Error iS "+ error);
        return { code: 500, message: "Internal server error" };
    }
}

main();
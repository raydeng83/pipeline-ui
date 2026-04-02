var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "UserUpdate",
    script: "Script",
    scriptName: "KYID.2B1.Journey.UserProfileUpdate",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    BACK: "back",
    ERROR: "error"
};

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
// Mapping of internal attribute names to human-readable labels
var attributeLabels = {
    "custom_title": "Title",
    "givenName": "Legal first Name",
    "custom_middleName": "Legal middle Name",
    "sn": "Legal last Name",
    "custom_suffix": "Suffix",
    "custom_gender": "Gender",
    "custom_dateofBirth": "Date of Birth",
    "postalAddress": "Address 1",
    "custom_postalAddress2": "Address 2",
    "city": "City",
    "stateProvince": "State",
    "postalCode": "Zip Code",
    "country": "Country",
    "county": "County",
    "languagePreference": "Language Preference"
};

function requestCallbacks() {
    try {
        var userId = nodeState.get("_id");
        if (!userId) {
            nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::User ID is null or undefined.");
            action.goTo(NodeOutcome.FAILED);
        }

        var attributes = [
            "custom_title", "givenName", "custom_middleName", "sn", "custom_suffix", "custom_gender", 
            "custom_dateofBirth", "postalAddress", "custom_postalAddress2", "city", "stateProvince", 
            "postalCode", "country", "county"
        ];

        var modifiedAttributes = [];

        for (var i = 0; i < attributes.length; i++) {
            var key = attributes[i];
            var newValue = nodeState.get(key) || "";
            var oldValue = nodeState.get("orig_" + key) || "";

            if (newValue !== oldValue) {
                modifiedAttributes.push(attributeLabels[key]);
            }
        }

        var newLangPref = nodeState.get("frUnindexedString3") || "";
        var oldLangPref = nodeState.get("orig_frUnindexedString3") || "";
        if (newLangPref !== oldLangPref) {
            modifiedAttributes.push(attributeLabels["languagePreference"]);
        }

        var promptmessage1 = "Personal_Information_has_been_modified.Do_you_want_to_save_it?";
        var promptmessage2 = "You_have_edited_the_following_items:";

        callbacksBuilder.textOutputCallback(0, promptmessage1);
        callbacksBuilder.textOutputCallback(0, promptmessage2);
        callbacksBuilder.textOutputCallback(0, modifiedAttributes.join(", "));
        
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + ":: Modified Attributes: " + JSON.stringify(modifiedAttributes));

        callbacksBuilder.confirmationCallback(0, ["Yes Save", "No Go_back"], 0);
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Error detecting modified attributes: " + error.message);
        action.goTo(NodeOutcome.ERROR);
    }
}
// function requestCallbacks() {
// try {
//     var userId = nodeState.get("_id");
//     if (!userId) {
//         nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::User ID is null or undefined.");
//         action.goTo(NodeOutcome.FAILED);
//     }

//     var attributes = [
//         "custom_title", "givenName", "custom_middleName", "sn", "custom_suffix", "custom_gender", 
//         "custom_dateofBirth", "postalAddress", "custom_postalAddress2", "city", "stateProvince", 
//         "postalCode", "country", "county"
//     ];

//     var modifiedAttributes = [];

//     for (var i = 0; i < attributes.length; i++) {
//         var key = attributes[i];
//         var newValue = nodeState.get(key) || "";
//         var oldValue = nodeState.get("orig_" + key) || "";

//         if (newValue !== oldValue) {
//             modifiedAttributes.push(key);
//         }
//     }

//     var newLangPref = nodeState.get("languagePreference") || "";
//     var oldLangPref = nodeState.get("orig_languagePreference") || "";
//     if (newLangPref !== oldLangPref) {
//         modifiedAttributes.push("languagePreference");
//     }
//     var promptmessage = "Personal_Information_has_been_modified.Do_you_want_to_save_it"
//     var promptmessage2 = "You_have_edited_the_following_items"
//     callbacksBuilder.textOutputCallback(0,promptmessage);
//     callbacksBuilder.textOutputCallback(0,promptmessage2);
//     callbacksBuilder.textOutputCallback(0,JSON.stringify(modifiedAttributes));
//     nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Modified Attributes: " + JSON.stringify(modifiedAttributes));

//     callbacksBuilder.confirmationCallback(0, ["Yes Save","No Go_back"],0);
// }

// //     action.goTo(NodeOutcome.SUCCESS);

//  catch (error) {
//     nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Error detecting modified attributes: " + error.message);
//     action.goTo(NodeOutcome.ERROR);
// }
// }

function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Invoking handleUserResponses Function");

        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
logger.debug("user selected outcome" +selectedOutcome )
        if (selectedOutcome === 0) {
            logger.debug("user selected yes")
            action.goTo(NodeOutcome.SUCCESS);
        } else if (selectedOutcome === 1) {
            logger.debug("user selected back")
            action.goTo(NodeOutcome.BACK);
        } else {
            action.goTo(NodeOutcome.ERROR);
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in handleUserResponses Function::" + error); 
        action.goTo(NodeOutcome.ERROR);
    }
}

try {
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error in main execution::" + error);
    action.goTo(NodeOutcome.ERROR);
}
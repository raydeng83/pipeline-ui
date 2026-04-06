var dateTime = new Date().toISOString();

var currentTimeEpoch = Date.now();

var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
 
// Node Config

var nodeConfig = {

    begin: "Begining Node Execution",

    node: "Node",

    nodeName: "Script: MCI SYnc",

    script: "Script",

    scriptName: "KYID.2B1.Journey.IDProofing.MCI.SYNC.Create",

    timestamp: dateTime,

    end: "Node Execution Completed"

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

    },

    info: function (message) {

        logger.info(message);

    }

}
 

function updateUserInfo(collectedUserInfo, userAttributes) {
    // Create a lookup map for userAttributes by (lowercased) attributeName
    try{
        var collectedUserInfo = collectedUserInfo || {};
        var userAttributes = userAttributes || [];
        var UpdatedCollectedUserInfo = {};

        if(userAttributes.length>0){
            var attrMap = {};
            for (var i = 0; i < userAttributes.length; i++) {
                attrMap[userAttributes[i].attributeName.toLowerCase()] = userAttributes[i].correctedValue;
            }
            
            UpdatedCollectedUserInfo["givenName"] = attrMap["firstname"] || collectedUserInfo.givenName || "";
            UpdatedCollectedUserInfo["middleName"] = attrMap["middlename"] || collectedUserInfo.middleName || "";
            UpdatedCollectedUserInfo["sn"] = attrMap["lastname"] || collectedUserInfo.sn || "";
            UpdatedCollectedUserInfo["suffix"] = attrMap["suffix"] || collectedUserInfo.suffix || "";
            UpdatedCollectedUserInfo["gender"] = attrMap["gender"] || collectedUserInfo.gender || "";
            UpdatedCollectedUserInfo["dob"] = attrMap["dob"] || collectedUserInfo.dob || "";
            UpdatedCollectedUserInfo["isHomeless"] = attrMap["ishomeless"] || collectedUserInfo.isHomeless || "";
            UpdatedCollectedUserInfo["postalAddress"] = attrMap["addressline1"] || collectedUserInfo.postalAddress || "";
            UpdatedCollectedUserInfo["postalAddress2"] = attrMap["addressline2"] || collectedUserInfo.postalAddress2 || "";
            UpdatedCollectedUserInfo["city"] = attrMap["city"] || collectedUserInfo.city || "";
            UpdatedCollectedUserInfo["stateProvince"] = attrMap["state"] || collectedUserInfo.stateProvince || "";
            UpdatedCollectedUserInfo["postalCode"] = attrMap["zipcode"] || collectedUserInfo.postalCode || "";
            UpdatedCollectedUserInfo["postalExtension"] = attrMap["postalextension"] || collectedUserInfo.postalExtension || "";
            UpdatedCollectedUserInfo["county"] = attrMap["county"] || collectedUserInfo.county || "";
            UpdatedCollectedUserInfo["country"] = attrMap["country"] || collectedUserInfo.country || "";
            UpdatedCollectedUserInfo["title"] = attrMap["title"] || collectedUserInfo.title || "";
            UpdatedCollectedUserInfo["telephoneNumber"] = attrMap["telephonenumber"] || collectedUserInfo.telephoneNumber || "";
            UpdatedCollectedUserInfo["mail"] = attrMap["mail"] || collectedUserInfo.mail || "";
            UpdatedCollectedUserInfo["ssn"] = attrMap["ssn"] || collectedUserInfo.ssn || "";
            UpdatedCollectedUserInfo["DriversLicense"] = attrMap["driverslicense"] || collectedUserInfo.driversLicenseNumber || "";
            UpdatedCollectedUserInfo["kogId"] = collectedUserInfo.kogId || "";
            UpdatedCollectedUserInfo["lexId"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
            UpdatedCollectedUserInfo["isLNKbaRequired"] = nodeState.get("isLNKbaRequired") || nodeState.get("isLNKbaRequired") || "";
        }else{
            UpdatedCollectedUserInfo = collectedUserInfo;
        }
        return UpdatedCollectedUserInfo;
    }catch(error){
        logger.error("Error in catch of updateUserInfo in KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
    }
}


function requestCallbacks() {
logger.error("inside requestCallbacks")
    try{
        if(nodeState.get("journeyName")==="createAccount" || nodeState.get("appEnrollRIDPMethod") === "Experian" || nodeState.get("journeyName")==="updateprofile" || nodeState.get("journeyName")==="organdonor"){

          var kogId= nodeState.get("KOGID") || nodeState.get("userName") || "";

            var userInfo = nodeState.get("userInfoJSON") || {};
            userInfo.kogId = kogId;

            var obj = {
                    "apiCalls":[ { "method": "MCI", "action": "sync" }],
                    "collectedUserInfo": userInfo
                };
            obj["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
            obj["verifiedLexID"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
            obj["UpdatedCollectedUserInfo"] = updateUserInfo(userInfo, obj["userAttributes"]);
            // var obj = {
            //     "MCI": { "method": "MCI", "action": "sync" },
            //     "collectedUserInfo": nodeState.get("userInfoJSON")
            // };
            if (nodeState.get("validationMessage") != null) {
                var errorMessage = nodeState.get("validationMessage");
                callbacksBuilder.textOutputCallback(0, errorMessage);
            }
            var pageHeader= {"pageHeader": "5_RIDP_MCI_SYNC"};
            callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader));
            callbacksBuilder.textOutputCallback(0, JSON.stringify(obj));
            callbacksBuilder.textInputCallback("MCI SYNC");
            callbacksBuilder.confirmationCallback(0, ["next"], 0);
        }
    }catch(error){
       logger.error("Error in catch of requestCallbacks in KYID.2B1.Journey.IDProofing.MCI.SYNC.Create :: " + error)
   }
}

function handleUserResponses() {

    try{
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var kbaStatus = callbacks.getTextInputCallbacks().get(0)

            if (typeof kbaStatus === "string") {
                try {
                    kbaStatus = JSON.parse(kbaStatus);
                    if (!kbaStatus || typeof kbaStatus !== "object" || typeof kbaStatus.status !== "string") {
                        logger.debug("Invalid kbaStatus object or missing status property");
                        nodeState.putShared("validationMessage", "invalid_input");
                        action.goTo("errorMessage");
                        return;
                    }

                    // Only check refId if status is "failure"
                    if (kbaStatus.status.toLowerCase() === "failure") {
                        if (!(kbaStatus.refId === null || typeof kbaStatus.refId === "string")) {
                            logger.debug("Invalid refId in kbaStatus (must be null or string) when status is failure");
                            nodeState.putShared("validationMessage", "invalid_input");
                            action.goTo("errorMessage");
                            return;
                        }else{
                            nodeState.putShared("refId",kbaStatus.refId)
                        }
                    }

                } catch (e) {
                    nodeLogger.error("Error parsing kbaStatus or invalid status: " + e);
                    nodeState.putShared("validationMessage", "invalid_input");
                    action.goTo("errorMessage");
                    return;
                }
            }
        if (selectedOutcome === 0) {
                    //nodeState.putShared("KBABack", "true");
                    // nodeState.putShared("IDProofingAnotherMethod","true")
                    var patchMCIStatusResponse = patchMCIStatus();
                    if(patchMCIStatusResponse && patchMCIStatusResponse != null){
                        logger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "MCI Link Status patched successfully in Function handleResponse");
                        nodeState.putShared("userInfoJSON", null);
                        nodeState.putShared("userAttributesForTransaction", null);
                        nodeState.putShared("UpdatedCollectedUserInfo", null);
                    }
                    nodeState.putShared("validationMessage",null);
                    if(nodeState.get("firsttimeloginjourney") == "true"){
                        action.goTo("firstTimeLogin")  
                    }else{
                         action.goTo("true");
                    }
                    
        }
    }catch(error){
        logger.error("Error in catch of handleUserResponses in KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
    }
}


function patchMCIStatus(){
    logger.debug("starting MCI Patch Status ")
    try{
        var userIdentity = nodeState.get("patchUserId") || nodeState.get("userIdentity");
        if(userIdentity && userIdentity != null && userIdentity != ""){
            logger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "In Function patchMCIStatus");
            var jsonArray = []
            var jsonObj = {
                "operation": "replace",
                "field": "mciLinkStatus",
                "value": true
            }
            jsonArray.push(jsonObj)
            var response = openidm.patch("managed/alpha_kyid_user_identity/" + userIdentity, null, jsonArray);
            return response;
        }else{
            logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Identity is null or empty in Function patchMCIStatus");
            nodeState.putShared("validationMessage", "User Identity is null or empty in Function patchMCIStatus");
            action.goTo("true");
        }
    }catch(error){
         logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script anf function patchMCIStatus:: " + error);
         action.goTo("true");
    }
}


function main(){
   try{
       if (callbacks.isEmpty()) {
            requestCallbacks();
        } else {
            handleUserResponses();
        }
   } catch(error){
       logger.error("Error in catch of KYID.2B1.Journey.IDProofing.MCI.SYNC :: " + error)
   }
}

main();
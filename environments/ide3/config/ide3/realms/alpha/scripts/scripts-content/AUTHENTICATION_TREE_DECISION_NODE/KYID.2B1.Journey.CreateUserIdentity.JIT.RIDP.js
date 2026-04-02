var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: RIDP JIT",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CreateUserIdentity.JIT.RIDP",
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

/// Main Function
function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
    try {
        var userInfoJSON = nodeState.get("userInfoJSON");
        var jitStatus = nodeState.get("JITStatus");
        var jitArray = nodeState.get("jitArray");
        var lib = require("KYID.2B1.Library.RIDP.Generic.Utils");
        var verifiedLexId = nodeState.get("verifiedLexId");
        var proofingMethod = nodeState.get("proofingMethod") || "4"
        // if(nodeState.get("patchUserId") && nodeState.get("patchUserId") !== null && nodeState.get("patchUserId") !== ""){
        //     nodeLogger.debug("User Identity already created with ID going to add accounts: " + nodeState.get("patchUserId"));
        //     nodeLogger.debug("User ID goping to attach is  " + nodeState.get("usrcreatedId"));
        //     patchUserIdentity(nodeState.get("usrcreatedId"))
        //     action.goTo("success")
        // }else{
        //     createUser("4")
        //     action.goTo("success")
        // }
        createUser(proofingMethod);
        action.goTo("success")
    } catch (error) {
        nodeLogger.error("Error occurred while fetching variables in JIT Script: " + error);
    }
}
main();

function patchUserIdentity(userId) {
    logger.debug("userId in patchUserIdentity is :: " + userId)
    try {
        var userData = []
        var patchOperation = {
                        "operation": "add",
                        "field": "account/-",
                        "value": {
                            "_ref": "managed/alpha_user/" + userId,
                            "_refProperties": {
                            }
                        }
                    }
        userData.push(patchOperation)
        var response = openidm.patch("managed/alpha_kyid_user_identity/"+nodeState.get("patchUserId"), null, userData);
        logger.debug("User Identity updated with accounts response is --> " + response)
    } catch (error) {
        logger.error("Errror Occurred While updating user userIdentity with accounts --> " + error)
    }
}

function createUser(proofingMethod) {
    try {
        // var auditDetails = require("KYID.2B1.Library.AuditDetails")
        // var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        // var userInfoJSON = nodeState.get("userInfoJSON")
        // var lexId = null
        // logger.debug("Starting user identity creation for ID: ");
        // if (nodeState.get("verifiedLexId")) {
        //     lexId = nodeState.get("verifiedLexId")
        // }

        // var userData = {
        //     "proofingMethod": proofingMethod,
        //     "lastVerificationDate": dateTime,
        //    "createDate": auditData.createdDate,
        //     "createdBy": auditData.createdBy,
        //     "createdByID": auditData.createdByID,
        //     "createDateEpoch": auditData.createdDateEpoch,
        //     "updateDate": auditData.updatedDate,
        //     "updateDateEpoch": auditData.updatedDateEpoch,
        //     "updatedBy": auditData.updatedBy,
        //     "updatedByID": auditData.updatedByID,
        //     "recordState": "0",
        //     "recordSource": "KYID-System",
        //     account: []

        // }
        // if(lexId && lexId !==null){
        //     userData["uuid"] = lexId
        // }
        // // if (nodeState.get("UserId")) {
        // //     userData.account.push({
        // //         "_ref": "managed/alpha_user/" + nodeState.get("UserId"),
        // //         "_refProperties": {}
        // //     })
        // // }
        //  if (nodeState.get("usrcreatedId")) {
        //     userData.account.push({
        //         "_ref": "managed/alpha_user/" + nodeState.get("usrcreatedId"),
        //         "_refProperties": {}
        //     });
        // }
        // if (userInfoJSON.suffix) {
        //     userData["suffix"] = userInfoJSON.suffix
        // }
        // if (userInfoJSON.middleName) {
        //     userData["middleName"] = userInfoJSON.middleName
        // }
        // if (userInfoJSON.stateProvince) {
        //     userData["stateCode"] = userInfoJSON.stateProvince
        // }
        // if (userInfoJSON.sn) {
        //     userData["sn"] = userInfoJSON.sn
        // }
        // if (userInfoJSON.gender) {
        //     userData["gender"] = userInfoJSON.gender
        // }
        // if (userInfoJSON.dob) {
        //     userData["dob"] = userInfoJSON.dob
        // }
        // if (userInfoJSON.isHomeless) {
        //     userData["isHomeless"] = userInfoJSON.isHomeless
        // }
        // if (userInfoJSON.postalAddress) {
        //     userData["addressLine1"] = userInfoJSON.postalAddress
        // }
        // if (userInfoJSON.postalAddress2) {
        //     userData["addressLine2"] = userInfoJSON.postalAddress2
        // }
        // if (userInfoJSON.givenName) {
        //     userData["givenName"] = userInfoJSON.givenName
        // }
        // if (userInfoJSON.city) {
        //     userData["city"] = userInfoJSON.city
        // }
        // if (userInfoJSON.postalCode) {
        //     userData["zip"] = userInfoJSON.postalCode
        // }
        // if (userInfoJSON.postalExtension) {
        //     userData["postalExtension"] = userInfoJSON.postalExtension
        // }
        // if (userInfoJSON.county) {
        //     userData["countyCode"] = userInfoJSON.county
        // }
        // var response = openidm.create("managed/alpha_kyid_user_identity", null, userData);
        // nodeState.putShared("patchUserId", response._id)
        // logger.debug("response is --> " + response)




        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        logger.debug("Starting user identity creation for ID: ");
        var userInfoJSON = nodeState.get("userInfoJSON")
        var userData = {
            "proofingMethod": proofingMethod,
            "lastVerificationDate": dateTime,
            "createDate": dateTime,
            "updateDate": dateTime,
            "createDateEpoch": currentTimeEpoch,
            "updateDateEpoch": currentTimeEpoch,
            'createDate': auditData.createdDate,
            'createDateEpoch': auditData.createdDateEpoch,
            'createdBy': auditData.createdBy,
            'createdByID': auditData.createdByID,
            'updateDate': auditData.updatedDate,
            'updateDateEpoch': auditData.updatedDateEpoch,
            'updatedBy': auditData.updatedBy,
            'updatedByID': auditData.updatedByID,
            "recordState": "0",
            "recordSource": "KYID-System",
            account: []

        }
        logger.debug("createdUserId is :: " + nodeState.get("createdUserId"))

        if (nodeState.get("verifiedLexId") && nodeState.get("verifiedLexId") !== null && typeof nodeState.get("verifiedLexId") !== 'undefined' ) {
            userData["uuid"] = nodeState.get("verifiedLexId")
        }

        if (nodeState.get("createdUserId")) {
            userData.account.push({ "_ref": "managed/alpha_user/" + nodeState.get("createdUserId"), "_refProperties": {} })
        }
        if (userInfoJSON.suffix) {
            userData["suffix"] = userInfoJSON.suffix
        }
        if (userInfoJSON.middleName) {
            userData["middleName"] = userInfoJSON.middleName
        }
        if (userInfoJSON.stateProvince) {
            userData["stateCode"] = userInfoJSON.stateProvince
        }
        if (userInfoJSON.sn) {
            userData["sn"] = userInfoJSON.sn
        }
        // Adding Homeless Value
        if (userInfoJSON.isHomeless) {
            userData["isHomeless"] = JSON.parse(userInfoJSON.isHomeless)
        }
        else{
            userData["isHomeless"] = false
        }
        if (userInfoJSON.gender) {
            userData["gender"] = userInfoJSON.gender
        }
        if (userInfoJSON.dob) {
            userData["dob"] = userInfoJSON.dob
        }
        if (userInfoJSON.postalAddress) {
            userData["addressLine1"] = userInfoJSON.postalAddress
        }
        if (userInfoJSON.postalAddress2) {
            userData["addressLine2"] = userInfoJSON.postalAddress2
        }
        if (userInfoJSON.givenName) {
            userData["givenName"] = userInfoJSON.givenName
        }
        if (userInfoJSON.city) {
            userData["city"] = userInfoJSON.city
        }
        if (userInfoJSON.postalCode) {
            userData["zip"] = userInfoJSON.postalCode
        }
        if (userInfoJSON.postalExtension) {
            userData["postalExtension"] = userInfoJSON.postalExtension
        }
        if (userInfoJSON.postalExtension) {
            userData["zipExtension"] = userInfoJSON.postalExtension
        }
        if (userInfoJSON.county) {
            userData["countyCode"] = userInfoJSON.county
        }

        if (userInfoJSON.country) {
            userData["countryCode"] = userInfoJSON.country || "us"
        }

        userData["organDonorRegistrationStatus"] ="No"

        if(nodeState.get("userLanguage")){
            var lang = null
            if(nodeState.get("userLanguage") == "en"){
                lang = "1"
            }else if(nodeState.get("userLanguage") == "es"){
                 lang = "2"
            }
            userData["languagePreference"]=lang || "1";
        }else{
            userData["languagePreference"]= "1";
        }

        if(nodeState.get("verificationStatus")){
            userData["verificationStatus"]=nodeState.get("verificationStatus");
        }

        if(nodeState.get("riskIndicator")){
            userData["riskIndicator"]=nodeState.get("riskIndicator");
        }

        //Corrected Values
        if(nodeState.get("userAttributes") && nodeState.get("userAttributes") !== null && typeof nodeState.get("userAttributes") !== 'undefined'){
            nodeLogger.debug("userAttributes are :: " + JSON.stringify(nodeState.get("userAttributes")))
            var userAttributes = JSON.parse(nodeState.get("userAttributes"));
            nodeLogger.debug("userAttributes Array :: " + Array.isArray(userAttributes))
            if(Array.isArray(userAttributes) && userAttributes.length > 0){
                userAttributes.forEach(function(attribute){
                    nodeLogger.debug("attribute is :: " + JSON.stringify(attribute))
                    if(attribute.attributeName && attribute.correctedValue && attribute.status){
                        nodeLogger.debug("Processing attribute :: " + attribute.attributeName)
                        if(attribute.attributeName.toLowerCase() === "firstname"){
                            userData["corrected_givenName"]=attribute.correctedValue;
                            userData["status_givenName"]=attribute.status;
                        }

                        if(attribute.attributeName.toLowerCase() === "lastname"){
                            userData["corrected_sn"]=attribute.correctedValue;
                            userData["status_sn"]=attribute.status;
                        }

                        if(attribute.attributeName.toLowerCase() === "middlename"){
                            userData["corrected_middleName"]=attribute.correctedValue;
                            userData["status_middleName"]=attribute.status;
                        }

                        if(attribute.attributeName.toLowerCase() === "dob"){
                            userData["corrected_dob"]=attribute.correctedValue;
                            userData["status_dob"]=attribute.status;
                        }

                        if(attribute.attributeName.toLowerCase() === "addressline1"){
                            userData["corrected_addressLine1"]=attribute.correctedValue;
                        }

                        if(attribute.attributeName.toLowerCase() === "addressline2"){
                            userData["corrected_addressLine2"]=attribute.correctedValue;
                        }

                        if(attribute.attributeName.toLowerCase() === "city"){
                            userData["corrected_city"]=attribute.correctedValue;
                        }

                        if(attribute.attributeName.toLowerCase() === "statecode"){
                            userData["corrected_stateCode"]=attribute.correctedValue;
                        }   

                        if(attribute.attributeName.toLowerCase() === "countycode"){ 
                            userData["corrected_countyCode"]=attribute.correctedValue;
                        }

                        if(attribute.attributeName.toLowerCase() === "countrycode"){ 
                            userData["corrected_countryCode"]=attribute.correctedValue;
                        }           

                        if(attribute.attributeName.toLowerCase() === "zipcode"){
                            userData["corrected_zip"]=attribute.correctedValue;
                        }

                        if(attribute.attributeName.toLowerCase() === "zipextension"){
                            userData["corrected_zipExtension"]=attribute.correctedValue;
                        }   

                    }
                });
            }
        }

        logger.debug("userData is :: " + JSON.stringify(userData))
        var response = openidm.create("managed/alpha_kyid_user_identity", null, userData);
        nodeState.putShared("patchUserId", response._id)
        logger.debug("response is --> " + response)
        if(response){
            return response;
        }

    } catch (error) {
        logger.error("Errror Occurred While creating userIdentity is --> " + error)

    }

}
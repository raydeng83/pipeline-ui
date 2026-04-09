var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: Create User Identity",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Create.User.Identity",
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

function updateAuditEvents(){
    var sessionRefId = null;
    var auditEvents = null;
    try {
        logger.debug("Updating audit events with userId");
        sessionRefId = nodeState.get("sessionRefId") || ""
        if(sessionRefId){
            auditEvents = openidm.query("managed/alpha_kyid_audit_logger", { "_queryFilter": 'sessionId eq "' + sessionRefId + '"' }, ["*"]);
            logger.debug("Audit Events fetched for sessionRefId is --> " + JSON.stringify(auditEvents))
            if(auditEvents && auditEvents.result && auditEvents.result.length > 0){
                auditEvents.result.forEach(function(event){
                    var id= event._id;
                    var jsonArray = []
                    var jsonObj1 = {
                        "operation": "replace",
                        "field": "requesterUserId",
                        "value": nodeState.get("createdUserId") || ""
                    }
                    var jsonObj2 = {
                        "operation": "replace",
                        "field": "requestedUserId",
                        "value": nodeState.get("createdUserId") || ""
                    }
                    jsonArray.push(jsonObj1)
                    jsonArray.push(jsonObj2)
                    var response = openidm.patch("managed/alpha_kyid_audit_logger/" + id, null, jsonArray);
                    logger.debug("Audit Event updated with userId response is --> " + response)
                });
            }
        }else{
            logger.error("Session Ref Id is not present in the node state, cannot update audit events with userId");
        }
    }catch (error) {
        logger.error("Errror Occurred While updating audit events with userId is --> " + error)
    }
}

function createUser(userInfoJSON, proofingMethod) {

    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        logger.debug("Starting user identity creation for ID: ");
        var userData = {
            "proofingMethod": proofingMethod,
            "lastVerificationDate": dateTime,
            "lastVerificationMethod": "createAccount",
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

        if (nodeState.get("verifiedLexId") && nodeState.get("verifiedLexId") !== null && typeof nodeState.get("verifiedLexId") !== 'undefined' && nodeState.get("verificationStatus") && ((nodeState.get("verificationStatus").toLowerCase() === "fullyverified") || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified") ) {
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

        logger.debug("riskIndicatorDetails :: " + nodeState.get("riskIndicatorDetails"))
        if(nodeState.get("riskIndicatorDetails")){
            // var riskIndicatorDetails = [];
            var riskIndicatorDetail = JSON.parse(nodeState.get("riskIndicatorDetails")).riskIndicatorDetails;
            userData["riskIndicatorDetails"]=riskIndicatorDetail
        }
        

        //assuranceLevel
        if ((nodeState.get("verificationStatus") && nodeState.get("verificationStatus") != null) && (nodeState.get("verificationStatus").toLowerCase() === "fullyverified" || nodeState.get("verificationStatus").toLowerCase() === "partiallyverified")){
             userData["assuranceLevel"]="1";
        }else{
             userData["assuranceLevel"]="";
        }

        //mciKogIDs
        var mciKogIDs = []
        logger.error("mciKogIDs is :: " + JSON.parse(nodeState.get("mciKogIDs")))
        logger.error("mciKogIDs is :: " + Array.isArray(JSON.parse(nodeState.get("mciKogIDs"))))
        if (nodeState.get("mciKogIDs") && nodeState.get("mciKogIDs") != null){
            mciKogIDs = JSON.parse(nodeState.get("mciKogIDs"))
            userData["mciKogIDs"]= mciKogIDs
        }

        //kbaStatus
         userData["kbaStatus"]= nodeState.get("kbaStatus") || "noKBA"

        //Corrected Values
        if(nodeState.get("userAttributes") && nodeState.get("userAttributes") !== null && typeof nodeState.get("userAttributes") !== 'undefined'){
            nodeLogger.debug("userAttributes are :: " + JSON.stringify(nodeState.get("userAttributes")))
            var userAttributes = JSON.parse(nodeState.get("userAttributes"));
            nodeLogger.debug("userAttributes Array :: " + Array.isArray(userAttributes))
            if(Array.isArray(userAttributes) && userAttributes.length > 0){
                userAttributes.forEach(function(attribute){
                    nodeLogger.debug("attribute is :: " + JSON.stringify(attribute))
                    if(attribute.attributeName){
                        nodeLogger.debug("Processing attribute :: " + attribute.attributeName)
                        if(attribute.attributeName.toLowerCase() === "firstname"){
                            userData["corrected_givenName"]=attribute.correctedValue || "";
                            userData["status_givenName"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "lastname"){
                            userData["corrected_sn"]=attribute.correctedValue || "";
                            userData["status_sn"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "middlename"){
                            userData["corrected_middleName"]=attribute.correctedValue || "";
                            userData["status_middleName"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "dob"){
                            userData["corrected_dob"]=attribute.correctedValue || "";
                            userData["status_dob"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "addressline1"){
                            userData["corrected_addressLine1"]=attribute.correctedValue || "";
                            userData["status_addressLine1"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "addressline2"){
                            userData["corrected_addressLine2"]=attribute.correctedValue || "";
                            userData["status_addressLine2"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "city"){
                            userData["corrected_city"]=attribute.correctedValue || "";
                            userData["status_city"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "state"){
                            userData["corrected_stateCode"]=attribute.correctedValue || "";
                             userData["status_stateCode"]=attribute.status || "";
                        }   

                        if(attribute.attributeName.toLowerCase() === "county"){ 
                            userData["corrected_countyCode"]=attribute.correctedValue || "";
                            userData["status_countyCode"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "countrycode"){ 
                            userData["corrected_countryCode"]=attribute.correctedValue || "";
                        }           

                        if(attribute.attributeName.toLowerCase() === "zipcode"){
                            userData["corrected_zip"]=attribute.correctedValue || "";
                            userData["status_zip"]=attribute.status || "";
                        }

                        if(attribute.attributeName.toLowerCase() === "zipextension"){
                            userData["corrected_zipExtension"]=attribute.correctedValue || "";
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
        action.goTo("false")
    }
}

function main() {
    if (nodeState.get("userInfoJSON")) {
        var proofingMethod = nodeState.get("createProofingMethod") || "1";
        //var lexId = nodeState.get("lexId") || null
        var createAccountResponse = createUser(nodeState.get("userInfoJSON"), proofingMethod)
        if (createAccountResponse) {
            //updateAuditEvents();
            action.goTo("true")
        }
    } else {
        logger.error("Failed to create user account in user identity");
        action.goTo("false")
    }

}

main();
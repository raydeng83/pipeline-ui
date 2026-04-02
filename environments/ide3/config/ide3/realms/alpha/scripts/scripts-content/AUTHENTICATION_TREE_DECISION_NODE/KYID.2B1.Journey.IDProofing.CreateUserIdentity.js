var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();

function createUser(userInfoJSON, proofingMethod) {

    try {
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        logger.error("Starting user identity creation for ID: ");
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

        if (nodeState.get("lexId") && nodeState.get("lexId") !== null && typeof nodeState.get("lexId") !== 'undefined' ) {
            userData["uuid"] = nodeState.get("lexId")
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
            userData["countryCode"] = userInfoJSON.country
        }

        userData["organDonorRegistrationStatus"] ="No"
        // logger.debug("requestHeaders in KYID.2B1.Journey.IDProofing.CreateUserIdentity :: => "+ JSON.stringify(requestHeaders));
        // if(requestHeaders.get("accept-language") && requestHeaders.get("accept-language")!=null){
        //     var userLanguage = requestHeaders.get("accept-language");
        //     if(userLanguage.includes("en_ES")){
        //         nodeState.putShared("userLanguage","en")
        //     }else if(userLanguage.includes("es-ES")){
        //         nodeState.putShared("userLanguage","es")
        //     }
        // }

        var userLanguage = "1";
        if(nodeState.get("userLanguage")){
            // if(nodeState.get("userLanguage") == "es") {
            //     userLanguage = "2"
            // }else{
            //     userLanguage = "1"
            // }
            userData["languagePreference"]=nodeState.get("userLanguage") || "1";
        }

        logger.debug("userData is :: " + JSON.stringify(userData))
        var response = openidm.create("managed/alpha_kyid_user_identity", null, userData);
        if (response) {
            return response;
        }
        nodeState.putShared("patchUserId", response._id)
        logger.debug("response is --> " + response)


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
            action.goTo("true")
        }
    } else {
        logger.error("Failed to create user account in user identity");
        action.goTo("false")
    }

}

main();
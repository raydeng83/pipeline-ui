
(function () {
    logger.debug("KYID.2B1.Journey.CreateUserIdentity.JIT script started")
    var dateTime = new Date().toISOString();
    var currentTimeEpoch = Date.now();

    // Proofing method fallback
    var proofingMethod = nodeState.get("createProofingMethod") || "-1";


    try {

        logger.debug("Starting user identity creation...");
          var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        var userData = {
            "proofingMethod": proofingMethod,
            "lastVerificationDate": dateTime,
            "createDate": auditData.createdDate,
            "createDateEpoch": auditData.createdDateEpoch,
            "createdBy":auditData.createdBy,
            "createdByID":auditData.createdByID,
            "recordState": "0",
            "recordSource": "KYID-System",
            "account": []
        };
        //   var userData = {
        //     "proofingMethod": proofingMethod,
        //     "lastVerificationDate": dateTime,
        //     "createDate": dateTime,
        //     "updateDate": dateTime,
        //     "createDateEpoch": currentTimeEpoch,
        //     "updateDateEpoch": currentTimeEpoch,
        //     "recordState": "0",
        //     "recordSource": "KYID-System",
        //     "account": []
        // };

        // UUID from LexId if available
        if (nodeState.get("lexId")) {
            userData["uuid"] = nodeState.get("lexId");
        }

        // Link to alpha_user account
        if (nodeState.get("usrcreatedId")) {
            userData.account.push({
                "_ref": "managed/alpha_user/" + nodeState.get("usrcreatedId"),
                "_refProperties": {}
            });
        } else if(nodeState.get("_id")) {
            userData.account.push({
                "_ref": "managed/alpha_user/" + nodeState.get("_id"),
                "_refProperties": {}
            });
        }

        // fetch the attr
        if (nodeState.get("MiddleName") && nodeState.get("MiddleName") != null) {
            userData["middleName"] = nodeState.get("MiddleName")
        }
        if (nodeState.get("State") && nodeState.get("State") != null) {
            userData["stateCode"] = nodeState.get("State")
        }
        if (nodeState.get("LastName") && nodeState.get("LastName") != null) {
            userData["sn"] = nodeState.get("LastName")
        }

        if (nodeState.get("Address1") && nodeState.get("Address1") != null) {
            userData["addressLine1"] = nodeState.get("Address1")
        }
        if (nodeState.get("Address2") && nodeState.get("Address2") != null) {
            userData["addressLine2"] = nodeState.get("Address2")
        }
        if (nodeState.get("FirstName") && nodeState.get("FirstName") != null) {
            userData["givenName"] = nodeState.get("FirstName")
        }
        if (nodeState.get("City") && nodeState.get("City") != null) {
            userData["city"] = nodeState.get("City")
        }
        if (nodeState.get("postalCode") && nodeState.get("postalCode") != null) {
            userData["zip"] = nodeState.get("postalCode")
        }
        if (nodeState.get("postalCode") && nodeState.get("postalCode") != null) {
            userData["postalExtension"] = nodeState.get("postalCode")
        }
        if (nodeState.get("county") && nodeState.get("county") != null) {
            userData["countyCode"] = nodeState.get("county")
        }
        // Adding Homeless Value
        if (nodeState.get("isHomeless") && nodeState.get("isHomeless") != null) {
            userData["isHomeless"] = JSON.parse(nodeState.get("isHomeless"))
        }
        else{
            userData["isHomeless"] = false
        }

        logger.debug("userData prepared: " + JSON.stringify(userData));

        var response = openidm.create("managed/alpha_kyid_user_identity", null, userData);

        if (response) {
            nodeState.putShared("patchUserId", response._id);
            logger.debug("User identity created successfully. ID: " + response._id);
        } else {
            logger.debug("User identity creation returned null/empty response.");
        }

        action.goTo("success");

    } catch (error) {
        // Just log error, but still route to success
        logger.error("Error occurred while creating user identity: " + error);
        action.goTo("success");
    }
})();
try {
    var usrId = null;

    if (nodeState.get("usrcreatedId")){
        usrId = nodeState.get("usrcreatedId")
    } else if (nodeState.get("_id")) {
        usrId = nodeState.get("_id")
    }
    logger.debug("Looking for KYID User Identity linked to alpha_user: " + usrId);

    // Query user object to resolve linked identity (1-1 relationship)
    var usrHasIdentityResponse = openidm.query(
        "managed/alpha_user", {
            "_queryFilter": '/_id eq "' + usrId + '"'
        },
        ["custom_userIdentity/*"]
    );

    if (usrHasIdentityResponse && usrHasIdentityResponse.result && usrHasIdentityResponse.result.length > 0) {
        var userObj = usrHasIdentityResponse.result[0];

        if (userObj.custom_userIdentity && userObj.custom_userIdentity._id) {
            var identityId = userObj.custom_userIdentity._id;
            logger.debug("Found linked KYID User Identity: " + identityId);

            var kyidIdentityObj = openidm.read("managed/alpha_kyid_user_identity/" + identityId);

            if (kyidIdentityObj) {
                var patchObj = [];

                function addIfChanged(path, newVal, oldVal) {
                    if (newVal != null && newVal !== "" && newVal !== oldVal) {
                        patchObj.push({
                            operation: "replace",
                            field: path,
                            value: newVal
                        });
                        logger.debug("Queuing update for " + path + ": old=[" + oldVal + "], new=[" + newVal + "]");
                    }
                }

                // Conditional updates only if values differ
                addIfChanged("/givenName", nodeState.get("FirstName"), kyidIdentityObj.givenName);
                addIfChanged("/sn", nodeState.get("LastName"), kyidIdentityObj.sn);
                addIfChanged("/middleName", nodeState.get("MiddleName"), kyidIdentityObj.middleName);
                addIfChanged("/addressLine1", nodeState.get("Address1"), kyidIdentityObj.addressLine1);
                addIfChanged("/addressLine2", nodeState.get("Address2"), kyidIdentityObj.addressLine2);
                addIfChanged("/city", nodeState.get("City"), kyidIdentityObj.city);
                addIfChanged("/stateCode", nodeState.get("State"), kyidIdentityObj.stateCode);
                addIfChanged("/zip", nodeState.get("PostalCode"), kyidIdentityObj.zip);
                addIfChanged("/postalExtension", nodeState.get("PostalExtension"), kyidIdentityObj.postalExtension);
                addIfChanged("/countyCode", nodeState.get("County"), kyidIdentityObj.countyCode);

                if (patchObj.length > 0) {

                    try {
                        var auditDetails = require("KYID.2B1.Library.AuditDetails")
                        var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
                        patchObj.push({
                            operation: "replace",
                            field: "/updatedDateEpoch",
                            value: auditData.updatedDateEpoch
                        });
                        //jsonArray.push(jsonObj)
                        patchObj.push({
                            operation: "replace",
                            field: "/updatedByID",
                            value: auditData.updatedByID
                        });
                        //jsonArray.push(jsonObj)
                        patchObj.push({
                            operation: "replace",
                            field: "/updateDate",
                            value: auditData.updatedDate
                        });
                        //jsonArray.push(jsonObj)
                        patchObj.push({
                            operation: "replace",
                            field: "/updatedBy",
                            value: auditData.updatedBy
                        });
                        //jsonArray.push(jsonObj)
                        logger.debug("auditDetail " + JSON.stringify(auditData))
                    } catch (error) {
                        logger.error("Error Occured : Couldnot find audit details" + error)

                    }
                    var patchResponse = openidm.patch("managed/alpha_kyid_user_identity/" + identityId, null, patchObj);
                    logger.debug("Patched KYID User Identity successfully: " + JSON.stringify(patchResponse));
                } else {
                    logger.debug("No attribute changes detected. Nothing to patch.");
                }
                action.goTo("success");
            } else {
                logger.debug("Linked KYID User Identity not found for ID: " + identityId);
                action.goTo("notfoundidentity");
            }
        } else {
            logger.debug("alpha_user/" + usrId + " has no linked custom_userIdentity.");
            action.goTo("notfoundidentity");
        }
    } else {
        logger.debug("No alpha_user found with _id: " + usrId);
        action.goTo("notfoundidentity");
    }
} catch (e) {
    logger.error("Error while querying/patching user identity for usrId: " + usrId + " | error: " + e);
    action.goTo("success");
}
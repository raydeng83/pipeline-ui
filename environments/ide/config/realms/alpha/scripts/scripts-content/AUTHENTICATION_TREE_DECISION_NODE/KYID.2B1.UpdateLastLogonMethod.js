/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


if (nodeState.get("isMasterLogin") === "true") {
    //var MFAMethod = nodeState.get("MFAMethod");
    
    var KOGID = nodeState.get("KOGID");

     var MFAMethod = null;
         if(nodeState.get("verifiedTelephoneNumber") && (nodeState.get("MFAMethod") === "MOBILE" || nodeState.get("MFAMethod") === "sms")){
           MFAMethod = nodeState.get("MFAMethod") + "|" + nodeState.get("verifiedTelephoneNumber")
         } else {
           MFAMethod = nodeState.get("MFAMethod");
         }
    
    var response = openidm.query("managed/alpha_user/", {
        "_queryFilter": 'userName eq "' + KOGID + '"'
    }, ["_id"]);

    var userId = response.result[0]._id

    if (MFAMethod && userId) {
        try {
            openidm.patch("managed/alpha_user/" + userId, null, [{
                "operation": "replace",
                "field": "/custom_lastlogonMFAmethod",
                "value": MFAMethod
            }]);

            try {
             var patchOps = []
                var auditDetails = require("KYID.2B1.Library.AuditDetails")
                var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
                patchOps.push({operation: "replace",field: "/custom_updatedDateEpoch",value: auditData.updatedDateEpoch},
                {operation: "replace",field: "/custom_updatedByID",value: auditData.updatedByID},
                {operation: "replace",field: "/custom_updatedDateISO",value: auditData.updatedDate},
                {operation: "replace",field: "/custom_updatedBy",value: auditData.updatedBy});
                //jsonArray.push(jsonObj)
                logger.error("auditDetail " + JSON.stringify(auditData))

            } catch (error) {
                logger.error("Error Occured : Couldnot find audit details" + error);
            }

            try {
                var patchResult = openidm.patch("managed/alpha_user/" + userId, null, patchOps);
                logger.debug("Patched new audit attributes");
            } catch (error) {
                logger.error("Patch audit attributes failed");
            }


            logger.debug("custom_lastlogonMFAmethod successfully updated to: " + MFAMethod);
            outcome = "true";

        } catch (e) {
            logger.error("Failed to update custom_lastlogonMFAmethod: " + e.message);
            outcome = "false";
        }
    } else {
        logger.error("Missing MFAMethod or userId. Cannot update custom_lastlogonMFAmethod.");
        outcome = "false";
    }
} else {
    outcome = "true"
}
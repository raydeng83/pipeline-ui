(function() {
    try {
        // Step 1: Retrieve IDs from shared state
        var kyid = nodeState.get("KYID");
        var successKOGID = nodeState.get("fetchedKOGID");
        var usrOldKOGID = nodeState.get("oldKOGID");

        if (!kyid || !successKOGID || !usrOldKOGID) {
            logger.debug("Missing required state values. Cannot proceed.");
            action.goTo("FAILED");
            return;
        }


        // Step 2: Update userName
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
        openidm.patch("managed/alpha_user/" + kyid, null, [{
                "operation": "replace",
                "field": "userName",
                "value": successKOGID
            }, {
                operation: "replace",
                field: "/custom_updatedDateEpoch",
                value: auditData.updatedDateEpoch
            },
            {
                operation: "replace",
                field: "/custom_updatedByID",
                value: auditData.updatedByID
            },
            {
                operation: "replace",
                field: "/custom_updatedDateISO",
                value: auditData.updatedDate
            },
            {
                operation: "replace",
                field: "/custom_updatedBy",
                value: auditData.updatedBy
            }
        ]);
        logger.debug("Updated userName for " + kyid + " with " + successKOGID);

        // Step 3: Update accountStatus to "active"
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
        openidm.patch("managed/alpha_user/" + kyid, null, [{
                "operation": "replace",
                "field": "accountStatus",
                "value": "active"
            }, {
                operation: "replace",
                field: "/custom_updatedDateEpoch",
                value: auditData.updatedDateEpoch
            },
            {
                operation: "replace",
                field: "/custom_updatedByID",
                value: auditData.updatedByID
            },
            {
                operation: "replace",
                field: "/custom_updatedDateISO",
                value: auditData.updatedDate
            },
            {
                operation: "replace",
                field: "/custom_updatedBy",
                value: auditData.updatedBy
            }
        ]);
        logger.debug("Set accountStatus to 'active' for " + kyid);

        // Step 4: Search for MFA object(s) using the old KOGID      
        var response = openidm.query("managed/alpha_kyid_mfa_methods/", {
            "_queryFilter": 'KOGId eq "' + usrOldKOGID + '"'
        }, ["_id"]);

        if (!response.result || response.result.length === 0) {
            logger.debug("No MFA record found for old KOGID: " + usrOldKOGID);
            action.goTo("FAILED");
            return;
        }

        // Step 5: Patch each MFA record with the new KOGID
        response.result.forEach(function(mfaObj) {
            var auditDetails = require("KYID.2B1.Library.AuditDetails")
            var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
            var mfaId = mfaObj._id;
            openidm.patch("managed/alpha_kyid_mfa_methods/" + mfaId, null, [{
                    "operation": "replace",
                    "field": "KOGId",
                    "value": successKOGID
                },
                {
                    operation: "replace",
                    field: "/updatedDateEpoch",
                    value: auditData.updatedDateEpoch
                },
                {
                    operation: "replace",
                    field: "/updatedByID",
                    value: auditData.updatedByID
                },
                {
                    operation: "replace",
                    field: "/updatedBy",
                    value: auditData.updatedBy
                },
                {
                    operation: "replace",
                    field: "/updateDate",
                    value: auditData.updatedDate
                }
            ]);
            logger.debug("Updated MFA record " + mfaId + " with new KOGID " + successKOGID);
        });

        // All operations completed
        action.goTo("SUCCESS");
    } catch (e) {
        logger.error("Error in update script: " + e);
        action.goTo("FAILED");
    }
})();
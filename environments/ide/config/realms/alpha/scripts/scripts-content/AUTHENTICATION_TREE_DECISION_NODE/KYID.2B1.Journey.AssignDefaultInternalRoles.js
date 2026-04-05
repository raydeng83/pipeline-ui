var id = nodeState.get("UserId");
nodeState.putShared("createdUserId", id);
var accountType = nodeState.get("kyidAccountType");
var provisioningRole;
logger.debug("User_idForRole: " + id);
logger.debug("AccountType: " + accountType);

var roleName;
if (accountType === "B") {
    roleName = "KYID-Portal-Business";
    provisioningRole = "KYID-Portal-Alpha-Business";
} else if (accountType === "C") {
    roleName = "KYID-Portal-Conmmonwealth";
    provisioningRole = "KYID-Portal-Alpha-Commonwealth";
} else if (accountType === "P") {
    roleName = "KYID-Portal-Personal";
    provisioningRole = "KYID-Portal-Alpha-Personal";
} else {
    logger.debug("Unknown account type: " + accountType);
    action.goTo("True");
}
nodeState.putShared("provisioningRole", provisioningRole);
// Proceed only if roleName determined
if (roleName) {
    try {
        var queryRole = openidm.query("internal/role", {
            "_queryFilter": 'name eq "' + roleName + '"',
            "_fields": "_id"
        });

        if (queryRole && queryRole.result && queryRole.result.length > 0) {
            var roleId = queryRole.result[0]._id;
            logger.debug("Role_Id: " + roleId);

            // Check existing roles of user
            var existingRoles = openidm.query("managed/alpha_user/" + id + "/authzRoles", {
                "_queryFilter": "true"
            }, ["_refResourceId"]);

            var alreadyHasRole = false;
            if (existingRoles && existingRoles.result && existingRoles.result.length > 0) {
                for (var i = 0; i < existingRoles.result.length; i++) {
                    var existingRoleId = existingRoles.result[i]._refResourceId;
                    logger.debug("Existing roleId of user: " + existingRoleId);
                    if (existingRoleId === roleId) {
                        alreadyHasRole = true;
                        break;
                    }
                }
            }

            if (alreadyHasRole) {
                logger.debug("User already has role: " + roleName + " skipping assignment");
            } else {
                var patchOps = [{
                    "operation": "add",
                    "field": "authzRoles/-",
                    "value": {
                        "_ref": "internal/role/" + roleId,
                        "_refProperties": {}
                    },
                }];

                try {
                    var auditDetails = require("KYID.2B1.Library.AuditDetails");
                    var auditData = auditDetails.getAuditDetails("UPDATE", nodeState);
                    patchOps.push({
                        operation: "replace",
                        field: "custom_updatedDateEpoch",
                        value: auditData.updatedDateEpoch
                    });
                    //jsonArray.push(jsonObj)
                    patchOps.push({
                        operation: "replace",
                        field: "custom_updatedByID",
                        value: auditData.updatedByID
                    });
                    //jsonArray.push(jsonObj)
                    patchOps.push({
                        operation: "replace",
                        field: "custom_updatedDateISO",
                        value: auditData.updatedDate
                    });
                    //jsonArray.push(jsonObj)
                    patchOps.push({
                        operation: "replace",
                        field: "custom_updatedBy",
                        value: auditData.updatedBy
                    });
                    //jsonArray.push(jsonObj)
                    logger.debug("auditDetail " + JSON.stringify(auditData));
                } catch (error) {
                    logger.error("Error Occured : Couldnot find audit details" + error);
                }
                try {
                    var patchResult = openidm.patch("managed/alpha_user/" + id, null, patchOps);
                    logger.debug("Patched new role: " + roleName);
                } catch (error) {
                    logger.error("Failed to patch role: " + error);
                }
            }
        } else {
            logger.debug("Role not found for name: " + roleName);
        }
    } catch (error) {
        logger.error("Error while querying role: " + error);
    }
}

// Always move to True
action.goTo("True");
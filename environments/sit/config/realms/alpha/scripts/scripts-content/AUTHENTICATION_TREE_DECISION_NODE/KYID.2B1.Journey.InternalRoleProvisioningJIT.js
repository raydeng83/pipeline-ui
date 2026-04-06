var id = nodeState.get("usrcreatedId");
var roleId;
var role;
var accountType = nodeState.get("kyidAccountType");

if (accountType == "C") {
    role = "KYID-Portal-Conmmonwealth"
} else if (accountType == "B") {
    role = "KYID-Portal-Business"
} else {
    role = "KYID-Portal-Personal"
}

logger.debug("accountType:" + accountType)

// Patch roles if any new roles to assign

var queryRole = openidm.query("internal/role", {
    "_queryFilter": 'name eq "' + role + '"',
    "_fields": "_id"
});

if (queryRole && queryRole.result && queryRole.result.length > 0) {
    roleId = queryRole.result[0]._id
    logger.debug("Role_Id:" + roleId)
}

var patchOps = [{
    "operation": "add",
    "field": "authzRoles/-",
    "value": {
        "_ref": "internal/role/" + roleId,
        "_refProperties": {}
    }
}]

try {
                var auditDetails = require("KYID.2B1.Library.AuditDetails")
                var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
                patchOps.push({operation: "replace",field: "/custom_updatedDateEpoch",value: auditData.updatedDateEpoch},
                {operation: "replace",field: "/custom_updatedByID",value: auditData.updatedByID},
                {operation: "replace",field: "/custom_updatedDateISO",value: auditData.updatedDate},
                {operation: "replace",field: "/custom_updatedBy",value: auditData.updatedBy});
                //jsonArray.push(jsonObj)
                logger.error("auditDetail " + JSON.stringify(auditData))
            } catch (error) {
                logger.error("Error Occured : Couldnot find audit details" + error)

            }

logger.debug("Patching NEW roles");
try {
    var patchResult = openidm.patch("managed/alpha_user/" + id, null, patchOps);
    logger.debug("Patched new roles");

} catch (error) {
    logger.error("Role already exist, patch not needed");
}
action.goTo("True");
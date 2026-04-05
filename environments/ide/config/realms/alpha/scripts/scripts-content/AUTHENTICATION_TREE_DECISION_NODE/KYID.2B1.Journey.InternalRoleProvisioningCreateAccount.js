var id = nodeState.get("createdUserId");
var roleId;
var role = "KYID-Portal-Personal";

logger.debug("User_idForRole:" + id)
var provisioningRole = "KYID-Portal-Alpha-Personal";
nodeState.putShared("provisioningRole", provisioningRole);
// Patch roles if any new roles to assign

var queryRole = openidm.query("internal/role", {
    "_queryFilter": 'name eq "' + role + '"',
    "_fields": "_id"
});

if (queryRole && queryRole.result && queryRole.result.length > 0) {
    roleId = queryRole.result[0]._id
    logger.debug("Role_Id:" + roleId)
}
var auditDetails = require("KYID.2B1.Library.AuditDetails")
var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
var patchOps = [{
    "operation": "add",
    "field": "authzRoles/-",
    "value": {
        "_ref": "internal/role/" + roleId,
        "_refProperties": {}
    }
}, {
    operation: "replace",
    field: "custom_updatedDateEpoch",
    value: auditData.updatedDateEpoch
},
{
    operation: "replace",
    field: "custom_updatedByID",
    value: auditData.updatedByID
},
{
    operation: "replace",
    field: "custom_updatedDateISO",
    value: auditData.updatedDate
},
{
    operation: "replace",
    field: "custom_updatedBy",
    value: auditData.updatedBy
},]

logger.debug("Patching NEW roles");
try {
    var patchResult = openidm.patch("managed/alpha_user/" + id, null, patchOps);
    logger.debug("Patched new roles");

} catch (error) {
    logger.error("Role already exist, patch not needed");
}
action.goTo("True");

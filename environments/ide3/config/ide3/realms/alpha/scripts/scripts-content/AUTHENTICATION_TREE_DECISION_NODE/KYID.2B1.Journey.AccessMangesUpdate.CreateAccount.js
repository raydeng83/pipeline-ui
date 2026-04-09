/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var appName;
var appId;
var roleId;
if (nodeState.get("kogAppName") != null && nodeState.get("kogAppName")) {
    appName = nodeState.get("kogAppName");
}
else if (nodeState.get("applicationName") != null && nodeState.get("applicationName")) {
    appName = nodeState.get("applicationName");
}
else if (nodeState.get("appName") != null && nodeState.get("appName")) {
    appName = nodeState.get("appName");
}
else {
    appName = "KYID Portal"
    logger.debug("ApplicationNameDefault:" + appName)
}

var provisioningRoleName = nodeState.get("provisioningRole");
if(provisioningRoleName && provisioningRoleName ==="KYID-Portal-Alpha-Personal"){
    appName = "KYID Portal"
}
var id = nodeState.get("createdUserId");

var email = nodeState.get("verifiedPrimaryEmail").toLowerCase();

var queryRole = openidm.query("managed/alpha_role", {
    "_queryFilter": 'name eq "' + provisioningRoleName + '"',
    "_fields": "_id"
});

if (queryRole && queryRole.result && queryRole.result.length > 0) {
    roleId = queryRole.result[0]._id
    logger.debug("Role_Id:" + roleId)
}
var appQuery = openidm.query("managed/alpha_kyid_businessapplication", {
    "_queryFilter": 'name eq "' + appName + '"'
});

if (appQuery.result.length > 0) {
    var appId = appQuery.result[0]._id;
}
logger.debug("ApplicationIDforRoes:" + appId)
var auditDetails = require("KYID.2B1.Library.AuditDetails")
var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
logger.debug("KYID auditDetail " + JSON.stringify(auditData))
var data = {

    app: {
        "_ref": "managed/alpha_kyid_businessapplication/" + appId
    },

    user: {
        "_ref": "managed/alpha_user/" + id
    },
    role: {
        "_ref": "managed/alpha_role/" + roleId
    },

    isForwardDelegable: true,
    assignmentDate: new Date().toISOString(),
    assignmentDateEpoch: Date.now(),
    recordState: "0",
    recordSource: "1",
    appIdentifier: appId,
    roleIdentifier: roleId,
    userIdentifier: id,
    createDate: auditData.createdDate,
    createdBy: auditData.createdBy,
    createdByID: auditData.createdByID,
    createDateEpoch: auditData.createdDateEpoch,
    updateDate: auditData.updatedDate,
    updateDateEpoch: auditData.updatedDateEpoch,
    updatedBy: auditData.updatedBy,
    updatedByID: auditData.updatedByID
};


try {
    response = openidm.create("managed/alpha_kyid_access", null, data);
    if (response) {
        logger.debug("Access MO Entry Craeted");
        action.goTo("true")
    }
    else {
        logger.debug("Access Entry Failed");
        action.goTo("true")
    }
}
catch (error) {
    logger.error("Access MO Entry Failed" + JSON.stringify(error))
    action.goTo("true")
}




//outcome = "true";

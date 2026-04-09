var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
if (endpointExecution && endpointExecution === "true") {
    updateAuditFields();
}


function updateAuditFields() {
    var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
    var currDateTime = new Date();
    var userId;
    var userFriendlyName;
    var updateAuditFields = true;
    var blindUpdate = false;
    if (enableAuditLog && enableAuditLog === "true") {
        try {
            if(context && context.oauth2 && context.oauth2.rawInfo) {
                var invokedBy = context.oauth2.rawInfo.subname;
                var userLogon = context.oauth2.rawInfo.logon;
                var clientId = context.oauth2.rawInfo.client_id;
                if (invokedBy && (invokedBy === "idm-provisioning")) {
                    //Updated by journey
                    updateAuditFields = false;
                } else if (clientId && clientId === "idmAdminClient") {
                    //Updated By Tenant Admin
                    userId = context.oauth2.rawInfo.subname;
                    userFriendlyName = "Tenant_Admin";
                    blindUpdate = true;
                } else if (!userLogon || userLogon == null || userLogon === undefined) {
                    //Updated by oauth client
                    userId = context.oauth2.rawInfo.subname;
                    userFriendlyName = "Application_Client";
                } else {
                    //Updated by end user
                    userId = context.oauth2.rawInfo.subname;
                    userFriendlyName = context.oauth2.rawInfo.logon;
                }
            }
            else {
                userId = "System";
                userFriendlyName = "System";
            }
        } catch(error)
        {
            userId = "System";
            userFriendlyName = "System";
        }
        if (updateAuditFields && !blindUpdate) {

            if (!(JSON.stringify(request).includes("updatedByID"))) {
                newObject.updatedByID = userId;
            }
            if (!(JSON.stringify(request).includes("updatedBy"))) {
                newObject.updatedBy = userFriendlyName;
            }
            if (!(JSON.stringify(request).includes("updateDate"))) {
                newObject.updateDate = currDateTime.toISOString();
            }
            if (!(JSON.stringify(request).includes("updateDateEpoch"))) {
                newObject.updateDateEpoch = currDateTime.getTime();
            }

        } else if (updateAuditFields) {
            newObject.updatedByID = userId;
            newObject.updatedBy = userFriendlyName;
            newObject.updateDate = currDateTime.toISOString();
            newObject.updateDateEpoch = currDateTime.getTime();
        }
    }
}
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
				} else if (!userLogon || userLogon == null || userLogon === undefined) {
				//Updated by oauth client
				userId = context.oauth2.rawInfo.subname;
				userFriendlyName = "Application_Client";
				} else {
				//Updated by end user
				userId = context.oauth2.rawInfo.subname;
				userFriendlyName = context.oauth2.rawInfo.logon;
				}
				if (updateAuditFields) {
					if (!object.createdByID) {
						object.createdByID = userId;
					}
					if (!object.createdBy) {
						object.createdBy = userFriendlyName;
					}
					if (!object.createDate) {
						object.createDate = currDateTime.toISOString();
					}
					if (!object.createDateEpoch) {
						object.createDateEpoch = currDateTime.getTime();
					}
					if (!object.updatedByID) {
					object.updatedByID = userId;
					}
					if (!object.updatedBy) {
					object.updatedBy = userFriendlyName;
					}
					if (!object.updateDate) {
					object.updateDate = currDateTime.toISOString();
					}
					if (!object.updateDateEpoch) {
					object.updateDateEpoch = currDateTime.getTime();
					}

				}
		
			}
			else {
                userId = "System";
                userFriendlyName = "System";
            }
			
	   }
	   catch(error)
        {
            userId = "System";
            userFriendlyName = "System";
        }
		
	}
}
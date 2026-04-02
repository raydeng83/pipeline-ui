try {
    var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
    var defaultUserId = identityServer.getProperty("esv.enable.auditlogs.defaultusername");
    var adminClients = identityServer.getProperty("esv.audit.clients");
    var managedObjectName = "alpha"
    var matchedUri = context.parent.matchedUri;
    managedObjectName = matchedUri.split("/").pop();

} catch (error) {
    logger.error("exception during audit logging: " + managedObjectName)
}

if (enableAuditLog === "true") {
    updateAttributes();
}
function updateAttributes() {

    try {
        var createdBy = null;
        try {
            if (newObject && newObject != null) {
                if (newObject.createdBy) {
                    createdBy = newObject.createdBy;
                }

            }
        } catch (error) {
            createdBy = null
            logger.error("exception during audit logging: createdBy: " + error)
        }


        if (!(createdBy != null && createdBy.length > 0)) {
            var isoDateTimeFormat = ""
            var epochTimeFormat = ""
            var userId = ""
            var clientId = null;


            try {
                isoDateTimeFormat = new Date().toISOString();

            } catch (error) {
                isoDateTimeFormat = ""
                logger.error("exception during audit logging: isoDateTimeFormat: " + error)
            }

            try {
                epochTimeFormat = Date.parse(isoDateTimeFormat);

            } catch (error) {
                epochTimeFormat = ""
                logger.error("exception during audit logging: epochTimeFormat: " + error)
            }

            try {
                if (context && context != null) {
                    if (context.oauth2.rawInfo.client_id != null) {
                        clientId = context.oauth2.rawInfo.client_id;
                    }
                }
            } catch (error) {
                clientId = null
                logger.error("exception during audit logging: clientId: " + error)
            }

            try {
                if (context && context != null) {
                    if (context.oauth2.rawInfo.user_id != null) {
                        userId = context.oauth2.rawInfo.user_id;
                    }
                }
            } catch (error) {
                userId = ""
                logger.error("exception during audit logging: userId: " + error)
            }

            object.createDate = isoDateTimeFormat;
            object.createDateEpoch = epochTimeFormat;
        
            if (adminClients.includes(clientId)) {
                logger.error(managedObjectName + " audit admin client found ")
                object.createdBy = "internal/user/" + userId;

            } else {
                var displayName = getDisplayName(userId)
                logger.error(managedObjectName + "audit logging completed display name " + displayName)
                object.createdBy = displayName;
            }

        } else {
            logger.error("audit logging is skipped")
        }
    } catch (error) {
        logger.error("exception during audit logging while updating attributes " + error)
    }
}

function getDisplayName(userId) {
    try {
        var params = {
            "_queryFilter": '_id eq "' + userId + '"'
        };
        var fields = ["mail", "sn", "givenName"];
        var userQueryResult = openidm.query("managed/alpha_user", params, fields);
        if (userQueryResult.result && userQueryResult.result.length > 0) {
            var fn = userQueryResult.result[0].givenName || "";
            var sn = userQueryResult.result[0].sn || "";
            return fn + "." + sn + "@" + userId;
        } else {
            logger.error(managedObjectname + "No user found for userId: " + userId);
            return defaultUserId;
        }
    }
    catch (error) {
        logger.error(managedObjectname + "Error in catch of getDisplayName :: => " + error)
        return defaultUserId;
    }
}
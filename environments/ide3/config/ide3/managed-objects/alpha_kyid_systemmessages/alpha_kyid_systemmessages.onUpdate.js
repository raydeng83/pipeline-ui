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
        var updatedBy = null;
        try {
            if (newObject && newObject != null) {
                if (newObject.updatedBy) {
                    updatedBy = newObject.updatedBy;
                }
            }
        } catch (error) {
            updatedBy = null
            logger.error("exception during audit logging: updatedBy: " + error)
        }

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
            if (context != null && context) {
                if (context.oauth2.rawInfo.user_id != null) {
                    userId =  context.oauth2.rawInfo.user_id;
                }
            }

        } catch (error) {
            userId = ""
            logger.error("exception during audit logging: userId: " + error)
        }

        newObject.updateDate = isoDateTimeFormat;
        newObject.updateDateEpoch = epochTimeFormat;

          if (adminClients.includes(clientId)) {
                newObject.updatedBy = "internal/user/" + userId;

            } else {
                var displayName = getDisplayName(userId)
                newObject.updatedBy = displayName;
            }

        logger.error("audit logging completed " + managedObjectName)

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
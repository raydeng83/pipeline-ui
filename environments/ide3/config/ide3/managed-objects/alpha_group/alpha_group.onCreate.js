var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
var defaultUserId = identityServer.getProperty("esv.enable.auditlogs.defaultusername");

if (enableAuditLog === "true") {

    function updateAttributes() {
        logger.debug("alpha_group on create script method started")

        try {
            var createdBy = null;
            var updatedBy = null;
            try {
                if (object != null && object) {
                    if (object.createdBy) {
                        createdBy = object.createdBy;
                    }

                }
            } catch (error) {
                createdBy = ""
                logger.error("alpha_group on create script exception createdBy")
            }

            try {
                if (object != null && object) {
                    if (object.updatedBy) {
                        updatedBy = object.updatedBy;
                    }

                }
            } catch (error) {
                updatedBy = ""
                logger.error("alpha_group on create script exception updatedBy")
            }

            if (!((createdBy === "ETLUser" || createdBy === "KYIDConversion") && (updatedBy === "ETLUser" || updatedBy === "KYIDConversion"))) {
                var isoDateTimeFormat = ""
                var epochTimeFormat = ""
                var usernameUpdatedBy = ""
                var usernameCreatedBy = ""
                var fullname = "";
                //var userId = null;

                try {
                    isoDateTimeFormat = new Date().toISOString();
                } catch (error) {
                    isoDateTimeFormat = ""
                    logger.error("alpha_group on create script exception isoDateTimeFormat")
                }

                try {
                    epochTimeFormat = Date.parse(isoDateTimeFormat);
                } catch (error) {
                    epochTimeFormat = ""
                    logger.error("alpha_group on create script exception epochTimeFormat")
                }

                try {
                    if (context != null && context) {
                        if (context.oauth2.rawInfo.user_id != null) {
                            usernameCreatedBy = context.oauth2.rawInfo.user_id;
                        }
                    }

                } catch (error) {
                    usernameCreatedBy = ""
                    logger.error("alpha_group on create script exception usernameUpdatedBy")
                }

                object.createDate = isoDateTimeFormat;
                object.createDateEpoch = epochTimeFormat;

                if (usernameCreatedBy != "idm-provisioning") {
                    var tempCreatedBy = getDisplayName(usernameCreatedBy);
                    if (defaultUserId === tempCreatedBy) {
                        object.createdBy = "idm-provisioning"
                    } else {
                        object.createdBy = getDisplayName(usernameCreatedBy)
                    }
                }
                else {
                    object.createdBy = "idm-provisioning"
                }

            } else {
                logger.error("User is a ETL user skipping updated attributes")
            }

        } catch (error) {

            logger.error("alpha_assignment on create script exception while updating attributes")
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
                logger.error("No user found for userId: " + userId);
                return defaultUserId;
            }
        }
        catch (error) {
            logger.error("Error in catch of getDisplayName :: => " + error)
            return defaultUserId;
        }
    }
    updateAttributes();
}
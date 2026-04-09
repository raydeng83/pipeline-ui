var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
var defaultUserId = identityServer.getProperty("esv.enable.auditlogs.defaultusername");
logger.error(" alpha_kyid_access on create script enableAuditLog - " + enableAuditLog)
logger.error(" alpha_kyid_access on create script defaultUserId - " + defaultUserId)
try {
    logger.error(" alpha_kyid_access on create script context value - " + context)
    logger.error(" alpha_kyid_access on create script old object value - " + oldObject)
    logger.error(" alpha_kyid_access on create script request value - " + request)
} catch (error) {
    logger.error("alpha_kyid_access on create script exception while printing context and request value")
}

if (enableAuditLog === "true") {

    function updateAttributes() {
        logger.error("alpha_kyid_access on create script method started")

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
                logger.error("alpha_kyid_access on create script exception createdBy")
            }

            try {
                if (object != null && object) {
                    if (object.updatedBy) {
                        updatedBy = object.updatedBy;
                    }

                }
            } catch (error) {
                updatedBy = ""
                logger.error("alpha_kyid_access on create script exception updatedBy")
            }


            logger.error("alpha_kyid_access on create script createdBy started" + createdBy)
            logger.error("alpha_kyid_access on create script updatedBy started" + updatedBy)

            if (!((createdBy === "ETLUser" || createdBy === "KYIDConversion") && (updatedBy === "ETLUser" || updatedBy === "KYIDConversion"))) {
                var isoDateTimeFormat = ""
                var epochTimeFormat = ""
                var usernameUpdatedBy = ""
                var usernameCreatedBy = ""
                var fullname = "";
                //var userId = null;

                try {
                    isoDateTimeFormat = new Date().toISOString();
                    logger.error("alpha_kyid_access on create script isoDateTimeFormat: " + isoDateTimeFormat)
                } catch (error) {
                    isoDateTimeFormat = ""
                    logger.error("alpha_kyid_access on create script exception isoDateTimeFormat")
                }

                try {
                    epochTimeFormat = Date.parse(isoDateTimeFormat);
                    logger.error("alpha_kyid_access on create script epochTimeFormat: " + epochTimeFormat)
                } catch (error) {
                    epochTimeFormat = ""
                    logger.error("alpha_kyid_access on create script exception epochTimeFormat")
                }

                try {
                    if (context != null && context) {
                        if (context.oauth2.rawInfo.user_id != null) {
                            usernameCreatedBy = context.oauth2.rawInfo.user_id;
                            logger.error("alpha_kyid_access on create script usernameCreatedBy: " + usernameCreatedBy)
                        }
                    }

                } catch (error) {
                    usernameCreatedBy = ""
                    logger.error("alpha_kyid_access on create script exception usernameUpdatedBy")
                }

                object.createDate = isoDateTimeFormat;
                object.createDateEpoch = epochTimeFormat;

                logger.error("usernameUpdatedBy displayname " + getDisplayName(usernameCreatedBy))
                if (usernameCreatedBy != "idm-provisioning") {
                    logger.error(" Not Created by idm-provisioning" + usernameCreatedBy)
                    var tempCreatedBy = getDisplayName(usernameCreatedBy);
                    if (defaultUserId === tempCreatedBy) {
                        object.createdBy = "idm-provisioning"
                    } else {
                        object.createdBy = getDisplayName(usernameCreatedBy)
                    }
                }
                else {
                    logger.error("  Created by idm-provisioning");
                    object.createdBy = "idm-provisioning"
                }

                logger.error("alpha_kyid_access on create script fullname: " + fullname)
                logger.error("alpha_kyid_access on create script usernameCreatedBy: " + usernameCreatedBy)
                logger.error("alpha_kyid_access on create script usernameUpdatedBy: " + usernameUpdatedBy)
            } else {
                logger.error("User is a ETL user skipping updated attributes")
            }

        } catch (error) {

            logger.error("alpha_kyid_access on create script exception while updating attributes")
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
                logger.error("Display Name = " + fn + "." + sn)
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
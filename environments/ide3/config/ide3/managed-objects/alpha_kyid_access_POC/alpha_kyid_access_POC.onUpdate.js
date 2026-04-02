var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
var defaultUserId = identityServer.getProperty("esv.enable.auditlogs.defaultusername");
logger.error(" alpha_kyid_access on update script enableAuditLog - " + enableAuditLog)
logger.error(" alpha_kyid_access on update script defaultUserId - " + defaultUserId)
try {
    logger.error(" alpha_kyid_access on update script context value - " + context)
    logger.error(" alpha_kyid_access on update script old object value - " + oldObject)
    logger.error(" alpha_kyid_access on update script request value - " + request)
} catch (error) {
    logger.error("alpha_kyid_access on update script exception while printing context and request value")
}

if (enableAuditLog === "true") {

    function updateAttributes() {
        logger.error("alpha_kyid_access on update script method started")

        try {
            var createdBy = null;
            var updatedBy = null;
            try {
                if (oldObject != null && oldObject) {
                    if (oldObject.createdBy) {
                        createdBy = oldObject.createdBy;
                    }

                }
            } catch (error) {
                createdBy = ""
                logger.error("alpha_kyid_access on update script exception createdBy")
            }

            try {
                if (oldObject != null && oldObject) {
                    if (oldObject.updatedBy) {
                        updatedBy = oldObject.updatedBy;
                    }

                }
            } catch (error) {
                updatedBy = ""
                logger.error("alpha_kyid_access on update script exception updatedBy")
            }


            logger.error("alpha_kyid_access on update script createdBy started" + createdBy)
            logger.error("alpha_kyid_access on update script updatedBy started" + updatedBy)

            if (!((createdBy === "ETLUser" || createdBy === "KYIDConversion") && (updatedBy === "ETLUser" || updatedBy === "KYIDConversion"))) {
                var isoDateTimeFormat = ""
                var epochTimeFormat = ""
                var usernameUpdatedBy = ""
                var fullname = "";

                try {
                    isoDateTimeFormat = new Date().toISOString();
                    logger.error("alpha_kyid_access on update script isoDateTimeFormat: " + isoDateTimeFormat)
                } catch (error) {
                    isoDateTimeFormat = ""
                    logger.error("alpha_kyid_access on update script exception isoDateTimeFormat")
                }

                try {
                    epochTimeFormat = Date.parse(isoDateTimeFormat);
                    logger.error("alpha_kyid_access on update script epochTimeFormat: " + epochTimeFormat)
                } catch (error) {
                    epochTimeFormat = ""
                    logger.error("alpha_kyid_access on update script exception epochTimeFormat")
                }

                try {
                    if (context != null && context) {
                        if (context.oauth2.rawInfo.user_id != null) {
                            usernameUpdatedBy = context.oauth2.rawInfo.user_id;
                            logger.error("alpha_kyid_access on update script usernameUpdatedBy: " + usernameUpdatedBy)
                        }else{
                             usernameUpdatedBy = oldObject.audit.requesterUserId;
                        }
                    }

                } catch (error) {
                    usernameUpdatedBy = ""
                    logger.error("alpha_kyid_access on update script exception usernameUpdatedBy")
                }


                logger.error("usernameUpdatedBy displayname " + getDisplayName(usernameUpdatedBy))
                if (usernameUpdatedBy != "idm-provisioning") {
                    logger.error(" Not Created by idm-provisioning" + usernameUpdatedBy)
                    var tempCreatedBy = getDisplayName(usernameUpdatedBy);
                    if (defaultUserId === tempCreatedBy) {
                        newObject.updatedBy = "idm-provisioning"
                    } else {
                        newObject.updatedBy = getDisplayName(usernameUpdatedBy)
                    }
                }
                else {
                    logger.error("  Created by idm-provisioning");
                    newObject.updatedBy = "idm-provisioning"
                }

                newObject.createdBy = oldObject.createdBy;
                newObject.createDate = oldObject.createDate;
                newObject.createDateEpoch = oldObject.createDateEpoch;
                newObject.updateDate = isoDateTimeFormat;
                newObject.updateDateEpoch = epochTimeFormat;

                logger.error("alpha_kyid_access on update script fullname: " + fullname)
                logger.error("alpha_kyid_access on update script usernameUpdatedBy: " + usernameUpdatedBy)
                logger.error("alpha_kyid_access on update script usernameUpdatedBy: " + usernameUpdatedBy)
            } else {
                logger.error("User is a ETL user skipping updated attributes")
            }

        } catch (error) {

            logger.error("alpha_kyid_access on update script exception while updating attributes")
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
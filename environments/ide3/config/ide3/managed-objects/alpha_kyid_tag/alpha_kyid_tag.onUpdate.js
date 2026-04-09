var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
var defaultUserId = identityServer.getProperty("esv.enable.auditlogs.defaultusername");

if (enableAuditLog === "true") {

    function updateAttributes() {
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
                logger.error("alpha_kyid_tag on update script exception createdBy")
            }

            try {
                if (oldObject != null && oldObject) {
                    if (oldObject.updatedBy) {
                        updatedBy = oldObject.updatedBy;
                    }

                }
            } catch (error) {
                updatedBy = ""
            }

            if (!((createdBy === "ETLUser" || createdBy === "KYIDConversion") && (updatedBy === "ETLUser" || updatedBy === "KYIDConversion"))) {
                var isoDateTimeFormat = ""
                var epochTimeFormat = ""
                var usernameUpdatedBy = ""
                var fullname = "";

                try {
                    isoDateTimeFormat = new Date().toISOString();
                } catch (error) {
                    isoDateTimeFormat = ""
                    logger.error("alpha_kyid_tag on update script exception isoDateTimeFormat")
                }

                try {
                    epochTimeFormat = Date.parse(isoDateTimeFormat);
                } catch (error) {
                    epochTimeFormat = ""
                    logger.error("alpha_kyid_tag on update script exception epochTimeFormat")
                }

                try {
                    if (context != null && context) {
                        if (context.oauth2.rawInfo.user_id != null) {
                            usernameUpdatedBy = context.oauth2.rawInfo.user_id;
                        }else{
                             usernameUpdatedBy = oldObject.audit.requesterUserId;
                        }
                    }

                } catch (error) {
                    usernameUpdatedBy = ""
                    logger.error("alpha_kyid_tag on update script exception usernameUpdatedBy")
                }

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

            } else {
                logger.error("User is a ETL user skipping updated attributes")
            }

        } catch (error) {

            logger.error("alpha_kyid_tag on update script exception while updating attributes")
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
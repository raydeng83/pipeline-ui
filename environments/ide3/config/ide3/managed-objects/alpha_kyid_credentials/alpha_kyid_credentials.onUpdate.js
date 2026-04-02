var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
var defaultUserId = identityServer.getProperty("esv.enable.auditlogs.defaultusername");
logger.error(" alpha_kyid_credentials updateAttributes enableAuditLog - " + enableAuditLog)
logger.error(" alpha_kyid_credentials updateAttributes defaultUserId - " + defaultUserId)
try {
    logger.error(" alpha_kyid_authenticators updateAttributes context value - " + context)
    logger.error(" alpha_kyid_authenticators updateAttributes old object value - " + oldObject)
    logger.error(" alpha_kyid_authenticators updateAttributes request value - " + request)
} catch (error) {
    logger.error("Exception while printing context and request value")
}

if (enableAuditLog === "true") {

    function updateAttributes() {
        logger.error("alpha_kyid_credentials updateAttributes method started")

        try {
            logger.error("alpha_kyid_credentials updateAttributes method started " + context.parent.remainingUri)


            var createdBy = oldObject.createdBy;
            var updatedBy = oldObject.updatedBy;
            logger.error("alpha_kyid_credentials updateAttributes createdBy started" + createdBy)
            logger.error("alpha_kyid_credentials updateAttributes updatedBy started" + updatedBy)

            if (createdBy != "ETLUser" || updatedBy != "ETLUser" || createdBy != "KYIDConversion" || updatedBy != "KYIDConversion") {
                var isoDateTimeFormat = ""
                var epochTimeFormat = ""
                var userFirstName = ""
                var userLastName = ""
                var usernameUpdatedBy = ""
                var usernameCreatedBy = ""
                var fullname = "";
                var userId = null;

                try {
                    isoDateTimeFormat = new Date().toISOString();
                } catch (error) {
                    isoDateTimeFormat = ""
                    logger.error("Exception isoDateTimeFormat")
                }

                try {
                    epochTimeFormat = Date.parse(isoDateTimeFormat);
                } catch (error) {
                    epochTimeFormat = ""
                    logger.error("Exception epochTimeFormat")
                }
                try {
                    userId = context.parent.remainingUri;
                    logger.error(" alpha_kyid_credentials updateAttributes userId - " + userId)
                } catch (error) {
                    userId = ""
                    logger.error("Exception id")
                }
                try {
                    usernameCreatedBy = context.parent.remainingUri;
                    logger.error("alpha_kyid_credentials updateAttributes usernameCreatedBy: " + usernameCreatedBy)
                    if (usernameCreatedBy === undefined) {
                        usernameCreatedBy = defaultUserId
                    }

                } catch (error) {
                    usernameCreatedBy = ""
                    logger.error("Exception usernameUpdatedBy")
                }

                try {
                    usernameUpdatedBy = context.parent.remainingUri;
                    if (usernameUpdatedBy === "idm-provisioning") {
                        usernameUpdatedBy = object.userName;
                    }
                    logger.error("alpha_kyid_credentials updateAttributes usernameUpdatedBy: " + usernameUpdatedBy)
                    if (usernameUpdatedBy === undefined) {
                        usernameUpdatedBy = defaultUserId
                    }

                } catch (error) {
                    usernameUpdatedBy = ""
                    logger.error("Exception usernameUpdatedBy")
                }

                logger.error("alpha_kyid_credentials updateAttributes isoDateTimeFormat: " + isoDateTimeFormat)
                logger.error("alpha_kyid_credentials updateAttributes epochTimeFormat: " + epochTimeFormat)

                logger.error(" alpha_kyid_credentials updateAttributes userId - " + userId)

                if (userId && (userId === null || userId === "")) {
                    userId = defaultUserId;
                } else {
                    var userAttribute = getUserDetails(userId)
                    logger.error(" userAttribute userId - " + userAttribute)
                    if (userAttribute != null) {
                        userFirstName = userAttribute.result[0].givenName || null;
                        userLastName = userAttribute.result[0].sn || null;

                    }

                }
                logger.error(" alpha_kyid_credentials updateAttributes userFirstName - " + userFirstName)
                logger.error(" alpha_kyid_credentials updateAttributes userLastName - " + userLastName)

                if (userFirstName && userFirstName === null) {
                    userFirstName = "";
                }

                if (userLastName === null) {
                    userLastName = "";
                }

                logger.error(" alpha_kyid_credentials updateAttributes userFirstName - " + userFirstName)

                if (userFirstName != "" && userLastName != "") {
                    fullname = userFirstName + "." + userLastName;
                } else if (userFirstName != "") {
                    fullname = userFirstName;
                } else if (userLastName != "") {
                    fullname = userLastName;
                } else {
                    fullname = userFirstName + "." + userLastName;
                }
                var fullname_updated = getDisplayName(usernameUpdatedBy)
                //newObject.createDate = isoDateTimeFormat;
                //newObject.createDateEpoch = epochTimeFormat;
                newObject.updateDate = isoDateTimeFormat;
                newObject.updateDateEpoch = epochTimeFormat;
                //newObject.createdBy = "AdminKYID" + "@" + usernameCreatedBy;
                //usernameUpdatedBy=context.oauth2.rawInfo.user_id;
                usernameUpdatedBy=context.oauth2.rawInfo.user_id;
                logger.error("usernameUpdatedBy =" + usernameUpdatedBy)
                logger.error("usernameUpdatedBy displayname " + getDisplayName(usernameUpdatedBy))
                if (usernameUpdatedBy != "idm-provisioning") {
                    logger.error(" Not Created by idm-provisioning" + usernameUpdatedBy)
                    newObject.updatedBy = getDisplayName(usernameUpdatedBy)
                }
                else {
                    logger.error("  Created by idm-provisioning");
                    newObject.updatedBy = "idm-provisioning"
                }
                //   newObject.updatedBy = getDisplayName(oldObject.KOGId);
                newObject.createdBy = oldObject.createdBy;
                newObject.createDate = oldObject.createDate;
                newObject.createDateEpoch = oldObject.createDateEpoch
                logger.error("Old Object" + oldObject)

                logger.error("alpha_kyid_credentials updateAttributes fullname: " + fullname)
                logger.error("alpha_kyid_credentials updateAttributes usernameCreatedBy: " + usernameCreatedBy)
                logger.error("alpha_kyid_credentials updateAttributes usernameUpdatedBy: " + usernameUpdatedBy)
            } else {
                logger.error("User is a ETL user skipping updated attributes")
            }

        } catch (error) {

            logger.error("Exception while updating attributes")
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
            return "User ID not found"
        }
    }


    function getUserDetails(userId) {
        try {

            var userQueryResult = openidm.query("managed/alpha_user", {
                _queryFilter: '_id eq "' + userId + '"',
            },
                ["*"]
            );
            //logger.error(" alpha_kyid_credentials updateAttributes userQueryResult - " + userQueryResult)
            //logger.error(" alpha_kyid_credentials updateAttributes userQueryResult.resultCount - " + userQueryResult.result[0])

            if (userQueryResult.result[0]) {

                return userQueryResult;

            } else {
                logger.error(" alpha_kyid_credentials updateAttributes userQueryResult  null")
                return null;
            }

        } catch (error) {
            logger.error("Exception while retriveing user attributes")
            return null;
        }
    }

    updateAttributes();
}
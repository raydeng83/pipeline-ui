var isoDateTime = new Date().toISOString();
object.updateTimestamp = isoDateTime;

var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
var defaultUserId = identityServer.getProperty("esv.enable.auditlogs.defaultusername");

if (enableAuditLog === "true") {

    function updateAttributes() {
        logger.debug("alpha_kyid_authenticators updateAttributes method started")

        try {

            var createdBy = newObject.createdBy;
            var updatedBy = newObject.updatedBy;

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
                } catch (error) {
                    userId = ""
                    logger.error("Exception id")
                }
                try {
                    usernameCreatedBy = context.parent.remainingUri;
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
                    if (usernameUpdatedBy === undefined) {
                        usernameUpdatedBy = defaultUserId
                    }

                } catch (error) {
                    usernameUpdatedBy = ""
                    logger.error("Exception usernameUpdatedBy")
                }

                if (userId && (userId === null || userId === "")) {
                    userId = defaultUserId;
                } else {
                    var userAttribute = getUserDetails(userId)
                    if (userAttribute != null) {
                        userFirstName = userAttribute.result[0].givenName || null;
                        userLastName = userAttribute.result[0].sn || null;

                    }

                }

                if (userFirstName && userFirstName === null) {
                    userFirstName = "";
                }

                if (userLastName === null) {
                    userLastName = "";
                }


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
                usernameUpdatedBy = context.oauth2.rawInfo.user_id;
                if (usernameUpdatedBy != "idm-provisioning") {
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
            //logger.error(" alpha_kyid_authenticators updateAttributes userQueryResult - " + userQueryResult)
            //logger.error(" alpha_kyid_authenticators updateAttributes userQueryResult.resultCount - " + userQueryResult.result[0])

            if (userQueryResult.result[0]) {

                return userQueryResult;

            } else {
                logger.error(" alpha_kyid_authenticators updateAttributes userQueryResult  null")
                return null;
            }

        } catch (error) {
            logger.error("Exception while retriveing user attributes")
            return null;
        }
    }

    updateAttributes();
}
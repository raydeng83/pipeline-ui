var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
var defaultUserId = identityServer.getProperty("esv.enable.auditlogs.defaultusername");
logger.error(" alpha_kyid_policy on update script enableAuditLog - " + enableAuditLog)
logger.error(" alpha_kyid_policy on update script defaultUserId - " + defaultUserId)
try {
    logger.error(" alpha_kyid_policy on update script context value - " + context)
    logger.error(" alpha_kyid_policy on update script old object value - " + oldObject)
    logger.error(" alpha_kyid_policy on update script request value - " + request)
} catch (error) {
    logger.error("alpha_kyid_policy on update script exception while printing context and request value")
}

if (enableAuditLog === "true") {

    function updateAttributes() {
        logger.error("alpha_kyid_policy on update script method started")

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
                logger.error("alpha_kyid_policy on update script exception createdBy")
            }

            try {
                if (oldObject != null && oldObject) {
                    if (oldObject.updatedBy) {
                        updatedBy = oldObject.updatedBy;
                    }

                }
            } catch (error) {
                updatedBy = ""
                logger.error("alpha_kyid_policy on update script exception updatedBy")
            }


            logger.error("alpha_kyid_policy on update script createdBy started" + createdBy)
            logger.error("alpha_kyid_policy on update script updatedBy started" + updatedBy)
            var isoDateTimeFormat = ""
            var epochTimeFormat = ""
            var usernameUpdatedBy = ""
            var fullname = "";

                try {
                    isoDateTimeFormat = new Date().toISOString();
                    logger.error("alpha_kyid_policy on update script isoDateTimeFormat: " + isoDateTimeFormat)
                } catch (error) {
                    isoDateTimeFormat = ""
                    logger.error("alpha_kyid_policy on update script exception isoDateTimeFormat")
                }

                try {
                    epochTimeFormat = Date.parse(isoDateTimeFormat);
                    logger.error("alpha_kyid_policy on update script epochTimeFormat: " + epochTimeFormat)
                } catch (error) {
                    epochTimeFormat = ""
                    logger.error("alpha_kyid_policy on update script exception epochTimeFormat")
                }

                try {
                    if (context != null && context) {
                        if (context.oauth2.rawInfo.user_id != null) {
                            usernameUpdatedBy = context.oauth2.rawInfo.user_id;
                            logger.error("alpha_kyid_policy on update script usernameUpdatedBy: " + usernameUpdatedBy)
                        }else{
                             usernameUpdatedBy = oldObject.audit.requesterUserId;
                        }
                    }

                } catch (error) {
                    usernameUpdatedBy = ""
                    logger.error("alpha_kyid_policy on update script exception usernameUpdatedBy")
                }


                if (context.oauth2.rawInfo.realm === "/alpha") {
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
				} else {
				
				fullname = "tenantAdmin" + "@" +context.oauth2.rawInfo.user_id;
				usernameUpdatedBy = "tenantAdmin" + "@" +context.oauth2.rawInfo.user_id;
				newObject.updatedBy = usernameUpdatedBy;
				}
				 
                newObject.createdBy = oldObject.createdBy;
                newObject.createDate = oldObject.createDate;
                newObject.createDateEpoch = oldObject.createDateEpoch;
                newObject.updateDate = isoDateTimeFormat;
                newObject.updateDateEpoch = epochTimeFormat;
          		

                logger.error("alpha_kyid_policy on update script fullname: " + fullname)
                logger.error("alpha_kyid_policy on update script usernameUpdatedBy: " + usernameUpdatedBy)
                
          

        } catch (error) {

            logger.error("alpha_kyid_policy on update script exception while updating attributes")
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
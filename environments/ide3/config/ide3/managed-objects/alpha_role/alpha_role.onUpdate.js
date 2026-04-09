logger.error("alpha_role onUpdate Script Entry" + object._id)
var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
if (endpointExecution && endpointExecution === "true") {
    updateAuditFields();
    //update role tags based on attribute value
    updateTags("Forward delegable", object.isForwardDelegable);
    updateTags("isOrgScoped", object.isOrgScopedRole);
    updateTags("Delegable", object.isDelegable);

    logger.error("alpha_role onUpdate Script Exit")
}

// //update role tags based on attribute value
// updateTags("Forward delegable", object.isForwardDelegable);
// updateTags("isOrgScoped", object.isOrgScopedRole);
// updateTags("Delegable", object.isDelegable);

// logger.error("alpha_role onUpdate Script Exit")

function updateAuditFields() {
    var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
    var currDateTime = new Date();
    var userId;
    var userFriendlyName;
    var updateAuditFields = true;
    var blindUpdate = false;
    if (enableAuditLog && enableAuditLog === "true") {
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
            blindUpdate = true;
        } else if (!userLogon || userLogon == null || userLogon === undefined) {
            //Updated by oauth client
            userId = context.oauth2.rawInfo.subname;
            userFriendlyName = "Application_Client";
        } else {
            //Updated by end user
            userId = context.oauth2.rawInfo.subname;
            userFriendlyName = context.oauth2.rawInfo.logon;
        }
        if (updateAuditFields && !blindUpdate) {

            if (!(JSON.stringify(request).includes("updatedByID"))) {
                newObject.updatedByID = userId;
            }
            if (!(JSON.stringify(request).includes("updatedBy"))) {
                newObject.updatedBy = userFriendlyName;
            }
            if (!(JSON.stringify(request).includes("updateDate"))) {
                newObject.updateDate = currDateTime.toISOString();
            }
            if (!(JSON.stringify(request).includes("updateDateEpoch"))) {
                newObject.updateDateEpoch = currDateTime.getTime();
            }

        } else if (updateAuditFields) {
            newObject.updatedByID = userId;
            newObject.updatedBy = userFriendlyName;
            newObject.updateDate = currDateTime.toISOString();
            newObject.updateDateEpoch = currDateTime.getTime();
        }
    }
}

//function to check tag based on the tagAttribute value of the role
function updateTags(tagName, tagAttribute) {

    try {

        //get requested tag _id
        logger.error("Function updateTags in alpha_role onUpdate Script Entry")
        let tagId = openidm.query("managed/alpha_kyid_tag", {
            "_queryFilter": "name eq \"" + tagName + "\"",
        }, ["_id"]).result[0]._id;

        let tags;
        if (object.tags) {
            tags = object.tags;
        } else {
            tags = [];
        }

        //check if current object have the requested tag
        let tagsRefs = tags.map(r => r._refResourceId);
        let flag = tagsRefs.includes(tagId);

        
        //assigned/removed tags based on the flag and tag attribute
        if (tagAttribute && !flag) {
                tags.push({
                    "_refResourceCollection": "managed/alpha_kyid_tag",
                    "_refResourceId": tagId,
                    "_ref": "managed/alpha_kyid_tag/" + tagId
                })

            object.tags = tags;
            logger.error("Function updateTags in alpha_role onUpdate Script Exit")
        }else if(flag && !tagAttribute){
            tags = tags.filter(r => r._refResourceId !== tagId)
        }

        object.tags = tags;
        logger.error("Function updateTags in alpha_role onUpdate Script Exit")

    } catch (error) {
        
        logger.error("Exception caught in updateTags in alpha_role onUpdate Script: " + error.message);
       // throw error.code ? error : { code: 400, message: 'Exception : Error in Tags Update' };
    }
}
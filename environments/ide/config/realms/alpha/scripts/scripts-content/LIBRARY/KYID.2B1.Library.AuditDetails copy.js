/*
Script Name# 
Script Description# This library is used to get audit details.  

Functions#
1) getAuditDetails
2) getUserData

*/


function getAuditDetails(operation, nodeState) {
    logger.error(" KYID.2B1.Library.AuditDetails getAuditDetails function started")
    try {
        var userId = null;
        var auditLogOn = null;
        var isoDateTimeFormat = new Date().toISOString();
        var epochTimeFormat = Date.parse(isoDateTimeFormat);
        var auditDetailsMap = {};

        if (nodeState.get("audit_ID")) {
            userId = nodeState.get("audit_ID")
        }
       // logger.error(" KYID.2B1.Library.AuditDetails userId " + userId)

        if (nodeState.get("audit_LOGON")) {
            auditLogOn = nodeState.get("audit_LOGON")
        }
        //logger.error(" KYID.2B1.Library.AuditDetails auditLogOn " + auditLogOn)

        if (operation === "CREATE") {
            //logger.error(" KYID.2B1.Library.AuditDetails in CREATE operation ")

            auditDetailsMap["createdDate"] = isoDateTimeFormat;
            auditDetailsMap["createdDateEpoch"] = epochTimeFormat;
            auditDetailsMap["createdBy"] = auditLogOn;
            auditDetailsMap["createdByID"] =  userId;
            auditDetailsMap["updatedDate"] = isoDateTimeFormat;
            auditDetailsMap["updatedDateEpoch"] = epochTimeFormat;
            auditDetailsMap["updatedBy"] = auditLogOn ;
            auditDetailsMap["updatedByID"] = userId;

           // logger.error(" KYID.2B1.Library.AuditDetails auditDetailsMap " + JSON.stringify(auditDetailsMap))
            return auditDetailsMap;
        }
        if (operation === "UPDATE") {
            auditDetailsMap["updatedDate"] = isoDateTimeFormat;
            auditDetailsMap["updatedDateEpoch"] = epochTimeFormat;
            auditDetailsMap["updatedBy"] = auditLogOn ;
            auditDetailsMap["updatedByID"] = userId;
            return auditDetailsMap;
        }

    } catch (error) {
        logger.error(" KYID.2B1.Library.AuditDetails getAuditDetails exception " + error)
    }
}

exports.getAuditDetails = getAuditDetails;

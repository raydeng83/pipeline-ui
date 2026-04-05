var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
if (endpointExecution && endpointExecution === "true") {
    var auditHistoryEndpoint = identityServer.getProperty("esv.audithistory.endpoint");
    var auditHistoryCredential = identityServer.getProperty("esv.audithistory.secret");
    var enableAuditLogHistory = identityServer.getProperty("esv.enable.auditlogs.history");
    var moName = "alpha_kyid_mfa_methods"
    var eventName = "UPDATE"

    logger.error("Audit History Endpoint Starting ");
    
    if (enableAuditLogHistory && enableAuditLogHistory === "true") {
        try {
          newObject["old_Values"]=oldObject
        var response = openidm.action("external/rest", "call", {
            "url": auditHistoryEndpoint,
            "method": "POST",
            "headers": {
                "Ocp-Apim-Subscription-Key": auditHistoryCredential,
                "Content-Type": "application/json"
            },
            "body": JSON.stringify({ "MoName": moName, "Event": eventName, "Payload": newObject })
        }); 

        //logger.error("Response from Audit History endpoint for UPDATE event on alpha_kyid_enrollment_user_prerequisites object:::: => " + JSON.stringify(response));

        } catch (error) {
            logger.error("An error occurred while updating the UPDATE event audit History events for alpha_kyid_mfa_methods object");
        }
    }   
}
var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
if (endpointExecution && endpointExecution === "true") {
    var auditHistoryEndpoint = identityServer.getProperty("esv.audithistory.endpoint");
    var auditHistoryCredential = identityServer.getProperty("esv.audithistory.secret");
    var enableAuditLogHistory = identityServer.getProperty("esv.enable.auditlogs.history");
    var moName = "alpha_kyid_help_topic"
    var eventName = "CREATE"

    if (enableAuditLogHistory && enableAuditLogHistory === "true") {
        try {
            var response = openidm.action("external/rest", "call", {
                "url": auditHistoryEndpoint,
                "method": "POST",
                "contentType": "application/json",
                "headers": {
                    "Ocp-Apim-Subscription-Key": auditHistoryCredential
                },
                "body": JSON.stringify({ "MoName": moName, "Event": eventName, "Payload": object })
            });
            //logger.error("Response from Audit History endpoint for create event on alpha_kyid_help_topic object:::: => " + JSON.stringify(response));
        } catch (error) {
            logger.error("An error occurred while updating the CREATE event audit History events for alpha_kyid_help_topic object");
        }
    }
}
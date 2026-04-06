logger.error("Object Details Post Update for alpha_user is =>"+JSON.stringify(object))
var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
if(endpointExecution === "true"){
        /*if (object.frUnindexedString1!= null || object.frUnindexedString1!= ""){
    let userType = object.frUnindexedString1;
    }
    if (object.frUnindexedString2 != null || object.frUnindexedString2!= ""){
    let userDomain = frUnindexedString2;
    }*/
    let userType = object.frUnindexedString1;
    logger.error("User Type Is "+ userType )
    postCreate(object);
    //let userDomain = frUnindexedString2;
    if (userType ==="External"){
    logger.info("Creating BirthRight Roles of the User")
    let allRoles = openidm.query("/managed/alpha_role", {
        "_queryFilter": 'name eq "kyidPortal"'
    });
    
    // Ensure there are results from the query
    if (allRoles && allRoles.result && allRoles.result.length > 0) {
        // Iterate over each role in the result
        for (let i = 0; i < allRoles.result.length; i++) {
            let groupId = allRoles.result[i]._id;  // Access the role's ID
            // Perform the patch operation to add the user to the role
            openidm.patch("managed/alpha_role/" + groupId, null, [{
                'operation': 'add',
                'field': '/members/-',
                'value': {
                    '_ref': 'managed/alpha_user/' + object._id
                }
            }]);
        }
    } else {
        // Handle the case where no roles were found
        logger.error("No roles found with the specified query filter.");
    }
    }
    else{
    logger.error("This user does not belongs to external user");
    }

}
else{
//    throw { code: 500, message: "Internal Server Error : Flag Set to False"};
  }

function postCreate(object) {
    var auditHistoryEndpoint = identityServer.getProperty("esv.audithistory.endpoint");
    var auditHistoryCredential = identityServer.getProperty("esv.audithistory.secret");
    var enableAuditLogHistory = identityServer.getProperty("esv.enable.auditlogs.history");
    var moName = "alpha_user"
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
            //logger.error("Response from Audit History endpoint for create event on alpha_user object:::: => " + JSON.stringify(response));
        } catch (error) {
            logger.error("An error occurred while updating the CREATE event audit History events for ALPHA_USER object");
        }
    }
}
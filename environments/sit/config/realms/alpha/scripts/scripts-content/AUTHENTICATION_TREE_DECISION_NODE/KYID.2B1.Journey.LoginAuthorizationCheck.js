var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "Role Check Node",
    script: "Script",
    scriptName: "KYID.2B1.Journey.LoginAuthorizationCheck",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    HASROLES: "hasRoles",
    NOROLES: "noRoles",
    ACTIVE_ENROLLMENT: "activeenrollmentfound",
    NO_ACTIVE_ENROLLMENT: "noactiveenrollmentfound",
    USERHASROLESANDENROLLMENT: "userhasRolesActiveEnrolment",
    HASCONTEXTID: "hasContext",
    ERROR: "error"
};

// Logger
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    }
};

function main() {
    try {
        var userId = nodeState.get("_id");
       // nodeState.putShared("appName","DummyContextApp") //hardcoded for test
        var appName = nodeState.get("appName");
        nodeLogger.debug("App name: " + appName);
        
        var userEmail = nodeState.get("mail") || nodeState.get("userMail")
        //Get the app id. check it for skipping in case user has role and active enrolment both
        var skippedAuthzLogonApps = []
            if(typeof existingSession != 'undefined'){
                if(existingSession.get("skippedAuthzLogonApps")){
                skippedAuthzLogonApps = JSON.parse(existingSession.get("skippedAuthzLogonApps"))  
                }
            }

       // Look up the appId from managed object using appName
            var appResponse = openidm.query(
                "managed/alpha_kyid_businessapplication/",
                { _queryFilter: '/name eq "' + appName + '"' },
                ["_id"]
            );

            var authzlogonAppId = null;
            if (appResponse && appResponse.result && appResponse.result.length > 0) {
                logger.debug("The authzlogonAppId in determining authorization for user " +appResponse.result[0]._id)
                authzlogonAppId = appResponse.result[0]._id;
            }
        
       // KOG parent App Name evaluation
      var hasEnrollment = false;

        if (nodeState.get("kogParentApplicationName")) {
            var kogParentApplicationName = nodeState.get("kogParentApplicationName");

            if (appName === kogParentApplicationName) {
                logger.debug("appName is same as kog parent Application name");
                hasEnrollment = hasActiveEnrollment(userId, appName);
            } else {
                logger.debug("appName is a child Application");
                hasEnrollment = hasActiveEnrollment(userId, kogParentApplicationName);
            }
        } else {
            logger.debug("kogParentApplicationName not found in nodeState");
            hasEnrollment = hasActiveEnrollment(userId, appName);
        }
        
        // Check if user has roles
        var userHasRoles = false;
        var loginAuthz = nodeState.get("loginauthz");
        if (loginAuthz === "userhasroles") {
            userHasRoles = true;
            nodeLogger.debug("User has roles for the application.");
        } else {
            nodeLogger.debug("User does not have roles or loginauthz not set.");
        }

        var requestedUserEmail = null;
        var contextID = null;
       var defaultContextID = systemEnv.getProperty("esv.kyid.default.contextid")

       // var hasEnrollment = hasActiveEnrollment(userId, appName);
        
         if (requestParameters.get("contextId")) {
             //contextID = requestParameters.get("contextId")[0];
             var contextIdParam = requestParameters.get("contextId")[0];
               // Split by comma and take the first context ID
             contextID = contextIdParam.split(',')[0].trim();
            nodeLogger.error("Context ID in requestParam: " + contextID); 
         }

        //Check if the existing context id is not active.Then nullify the context id value
        if(contextID != null && defaultContextID !=null && (contextID !== defaultContextID)){
            var existingContextResult = openidm.read("managed/alpha_kyid_enrollment_contextId/"+contextID)
            nodeLogger.debug("Context found for user. Not equals to Default ContextID");

            if(existingContextResult && existingContextResult.status !== "0"){ 
             contextID = null;
             nodeLogger.error("Context status is not Active. Setting contextID to null");
            } else {
            nodeLogger.error("Context status is Active.");
            }
        }
            
            if(contextID != null && defaultContextID !=null && (contextID !== defaultContextID)){
            var queryFilter = '_id eq "' + contextID + '"';
            var existingContextResult = openidm.read("managed/alpha_kyid_enrollment_contextId/"+contextID)
            nodeLogger.debug("Context found for user. Not equals to Default ContextID");

            if (existingContextResult && existingContextResult.requestedUserAccountId === userId) {
                nodeLogger.debug("Context found for user. Routing to hasContext.");
                nodeState.putShared("route", "hascontext");
                nodeState.putShared("contextID", contextID);
                action.goTo("hasContext");
            } else if (existingContextResult && existingContextResult.requestedUserAccountAttibutes && existingContextResult.requestedUserAccountAttibutes.length>0){

                for(var i=0; i<existingContextResult.requestedUserAccountAttibutes.length ; i++){
                      if(existingContextResult.requestedUserAccountAttibutes[i].attributeName.toLowerCase() === "mail" || existingContextResult.requestedUserAccountAttibutes[i].attributeName.toLowerCase() === "primaryemailaddress"){
                        requestedUserEmail = existingContextResult.requestedUserAccountAttibutes[i].attributeValue
                        if(requestedUserEmail){
                        logger.error("requestedUserEmail from Context is --> "+ requestedUserEmail)
                          break;
                        }
                        if(requestedUserEmail === userEmail){
                            nodeLogger.debug("Context found for user. Routing to hasContext.");
                            nodeState.putShared("route", "hascontext");
                            nodeState.putShared("contextID", contextID);
                            action.goTo("hasContext");
                      } else {
                             nodeState.putShared("route", "hascontext");
                            nodeState.putShared("contextID", contextID);
                            action.goTo("hasContext");
                      }
                    } else {
                          nodeState.putShared("route", "hascontext");
                            nodeState.putShared("contextID", contextID);
                            action.goTo("hasContext");
                    }
                }
            } else if(skippedAuthzLogonApps.includes(authzlogonAppId)){
            logger.error("Skipping the Application as the authzlogonAppId is included in skippedAuthzLogonApps "+ authzlogonAppId)
            nodeState.putShared("loginauthz", "userhasroles");
            action.goTo(NodeOutcome.HASROLES);
    } else{
            nodeState.putShared("route", "hascontext");
            nodeState.putShared("contextID", contextID);
            action.goTo("hasContext");    
    }    
    } else if(skippedAuthzLogonApps.includes(authzlogonAppId)){
            logger.debug("Skipping the Application as the authzlogonAppId is included in skippedAuthzLogonApps "+ authzlogonAppId)
            nodeState.putShared("loginauthz", "userhasroles");
            action.goTo(NodeOutcome.HASROLES);
    } else if (userHasRoles && hasEnrollment) {
        nodeLogger.debug("User has roles and active enrollment.");
        nodeState.putShared("route", "userhasRolesActiveEnrolment");
        action.goTo(NodeOutcome.USERHASROLESANDENROLLMENT);
    } else if (hasEnrollment) {
        nodeLogger.debug("Active enrollment found.");
        nodeState.putShared("route", "activeenrollment");
        action.goTo(NodeOutcome.ACTIVE_ENROLLMENT);
    } else if (!userHasRoles && !hasEnrollment) {
        nodeLogger.debug("User has NO roles and NO active enrollment. Routing to Request Role");
        nodeState.putShared("route", "noactiveenrollment");
        action.goTo(NodeOutcome.NO_ACTIVE_ENROLLMENT);
    } else {
        nodeLogger.debug("User has Roles");
        //nodeState.putShared("loginAuthz", "userhasroles");
        action.goTo(NodeOutcome.HASROLES);
    }


    } catch (e) {
        nodeLogger.error("Main execution error: " + e);
        action.goTo(NodeOutcome.ERROR);
    }
}

function hasActiveEnrollment(userId, appName) {
    var resp = openidm.query("managed/alpha_kyid_enrollment_request", {
        "_queryFilter":
            'requestedUserId eq "' + userId + '"'
            + ' AND (status eq "IN_PROGRESS" or status eq "0")'
            + ' AND (recordState eq "ACTIVE" or recordState eq "0")'
            + ' AND roleContext/[appName eq "' + appName + '"]'
    });
    logger.debug("the hasActiveEnrollment result is::: "+resp)
    return resp.result && resp.result.length > 0;
    
}

main();
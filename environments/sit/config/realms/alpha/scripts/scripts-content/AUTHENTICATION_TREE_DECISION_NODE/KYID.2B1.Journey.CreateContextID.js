var dateTime = new Date().toISOString();

var transactionid = null;
if(requestHeaders.get("X-ForgeRock-TransactionId")){
    transactionid = requestHeaders.get("X-ForgeRock-TransactionId")[0]
}

var auditLib = require("KYID.2B1.Library.AuditLogger");

var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "AppLibraryCombinedNode",
    script: "Script",
    scriptName: "KYID.2B1.Journey.CreateContextID",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

//For Audit Loggers
var headerName = "X-Real-IP";
    var headerValues = requestHeaders.get(headerName);
    var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
      var browser=null;
      if(requestHeaders.get("user-agent"))
      {
         browser = requestHeaders.get("user-agent")[0]; 
      }

      var os=null;
      if(requestHeaders.get("sec-ch-ua-platform")){
         os = requestHeaders.get("sec-ch-ua-platform"); 
      }

    var eventDetails = {};
    eventDetails["IP"] = ipAdress;
    eventDetails["Browser"] = browser;
    eventDetails["OS"] = os;
    eventDetails["applicationName"] = nodeState.get("appIDinWidget") || requestParameters.get("appIDinWidget")[0] || systemEnv.getProperty("esv.kyid.portal.name");
    eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
    var userEmail = nodeState.get("mail") || nodeState.get("userMail") || "";

var sessionDetails = {}
 
	if(nodeState.get("sessionRefId")){
		sessionDetail = nodeState.get("sessionRefId") 
            sessionDetails["sessionRefId"] = sessionDetail
        }else if(typeof existingSession != 'undefined'){
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        }else{
             sessionDetails = {"sessionRefId": ""}
        }

//compare two arrays of role objects for exact match by roleSystemName and applicationSystemName
function rolesMatchExactly(existingRoles, requestedRoles) {
    if (existingRoles.length !== requestedRoles.length) return false;

    // Create lookup maps for comparison
    var mapExisting = {};
    existingRoles.forEach(r => {
        mapExisting[r.applicationSystemName + "|" + r.roleSystemName] = true;
    });

    for (var i = 0; i < requestedRoles.length; i++) {
        var key = requestedRoles[i].applicationSystemName + "|" + requestedRoles[i].roleSystemName;
        if (!mapExisting[key]) {
            return false;
        }
    }
    return true;
}

// 1. Get appId
var appId, appName;

if (nodeState.get("appIDinWidget")) {
    appName = nodeState.get("appIDinWidget");
    var appResult = openidm.query("managed/alpha_kyid_businessapplication", {
        "_queryFilter": 'name eq "' + appName + '"'
    });
    if (appResult.result.length > 0) {
        appId = appResult.result[0]._id;
    } else {
        logger.debug("No application found for name: " + appName);
        action.goTo("error");
    }

} else if (requestParameters.get("appIDinWidget")) {
    appName = requestParameters.get("appIDinWidget")[0];
    var appResult = openidm.query("managed/alpha_kyid_businessapplication", {
        "_queryFilter": 'name eq "' + appName + '"'
    });
    if (appResult.result.length > 0) {
        appId = appResult.result[0]._id;
    } else {
        logger.debug("No application found for name: " + appName);
        action.goTo("error");
    }

} else {
    var roleIDinWidget = requestParameters.get("roleIDinWidget")[0];
    logger.debug("The role ID from the request param: " + roleIDinWidget);

    var roleQuery = openidm.query("managed/alpha_role", {
        "_queryFilter": 'name eq "' + roleIDinWidget + '"'
    });

    if (!roleQuery.result || roleQuery.result.length === 0) {
        logger.debug("No role found for name: " + roleIDinWidget);
        action.goTo("error");
    }

    nodeState.putShared("roleIds", roleQuery.result[0]._id);
    appId = roleQuery.result[0].businessAppId._refResourceId;

    logger.debug("The appId from the role param: " + appId);
    var appNameresult = openidm.read("managed/alpha_kyid_businessapplication/" + appId);
    appName = appNameresult.name;
}

// 3. Get user id
var usrID = "";
if (nodeState.get("_id")) {
    usrID = nodeState.get("_id");
} else {
    if (existingSession.get("KOGID")) {
        var KOGID = existingSession.get("KOGID");
        var user = queryUserByKOGID(KOGID);
        if (user) {
            usrID = user._id;
        }
    }
}

// Function: queryUserByKOGID
function queryUserByKOGID(KOGID) {
    try {
        var userQueryResult = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + KOGID + '"'
        }, ["_id", "userName", "mail"]);

        if (userQueryResult && userQueryResult.result && userQueryResult.result.length === 1) {
            return userQueryResult.result[0];
        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " No user found for KOGID: " + KOGID);
            return null;
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " Error querying user by KOGID: " + error.message);
        return null;
    }
}

// 4. Get list of roleIds
var roleIds;
var rawRoleIds = nodeState.get("roleIds");
logger.debug("the roleIds from nodeState: " + JSON.stringify(rawRoleIds) + " and type: " + typeof rawRoleIds);

if (rawRoleIds) {
    if (typeof rawRoleIds === "object") {
        roleIds = JSON.parse(JSON.stringify(rawRoleIds));  // cloning object/array
    } else {
        roleIds = rawRoleIds;
    }

    if (typeof roleIds === "string") {
        try {
            roleIds = JSON.parse(roleIds);
            if (!Array.isArray(roleIds)) roleIds = [roleIds];
        } catch (e) {
            roleIds = [roleIds];
        }
    } else if (!Array.isArray(roleIds)) {
        roleIds = [roleIds];
    }
} else {
    // rawRoleIds null or undefined
    var approleIds = requestParameters.get("roleIDinWidget")[0];
    roleIds = [approleIds];
}
// 5. Build applicationRoles array
var requestedRoles = [];
for (var i = 0; i < roleIds.length; i++) {
    var roleResult = openidm.read("managed/alpha_role/" + roleIds[i]);
    if (!roleResult || !roleResult.name) {
        //callbacksBuilder.textOutputCallback(0, "Error: Role not found for ID: " + roleIds[i])
        logger.debug("Error: Role not found for ID: " + roleIds[i])
        action.goTo("error")
    }
    requestedRoles.push({
        applicationName: appName,
        roleName: roleResult.name,
        roleId: roleIds[i],
        applicationId: appId
    });
}

var allowedStatuses = ["0"];
// var queryFilter = 'requestedUserAccountId eq "' + usrID + '"'
//             + ' and status eq "' + allowedStatuses[0] + '"';
var currentEpochTime = Date.now();
var queryFilter = 'requestedUserAccountId eq "' + usrID + '"'
logger.error("print the queryFilter"+queryFilter)
var existingResult = openidm.query("managed/alpha_kyid_enrollment_contextId", {
    _queryFilter: queryFilter
});
logger.debug("existingResult Context ID --> "+ existingResult)
var matchingContext = null;
var foundContext = []
 var validEnrollmentContext = []
if (existingResult.result && existingResult.result.length > 0) {
    for (var i = 0; i < existingResult.result.length; i++) {
        var context = existingResult.result[i];
        var roles = [];
        if (context.applicationRoles) {
            roles = JSON.parse(JSON.stringify(context.applicationRoles));
        }
        

        var allRolesExist = true;

        for (var j = 0; j < requestedRoles.length; j++) {
            var requestedRole = requestedRoles[j];
            var found = false;

            for (var k = 0; k < roles.length; k++) {
                var existingRole = roles[k];
                if (
                    existingRole.roleName === requestedRole.roleName &&
                    existingRole.applicationName === requestedRole.applicationName
                ) {
                    // found = true;
                    // break;
                    foundContext.push(context._id)
                }
            }

            // if (!found) {
            //     allRolesExist = false;
            //     break;
            // }
        }

        // if (foundContext && foundContext.length>0) {
        //     matchingContext = context;
        //     break; // Found a matching context
        // }
    }
}
   
    if(foundContext && foundContext.length>0){
        foundContext.forEach(val=>{
         var query = `requestedUserId eq '${usrID}' AND status eq 'IN_PROGRESS' AND recordState eq 'ACTIVE' AND expiryDate gt  '${currentEpochTime}' AND (enrollmentContextId eq '${val}' )`
         var EnrollmentResponse = openidm.query("managed/alpha_kyid_enrollment_request/", {
                    "_queryFilter": query
                }, ["roleIds/*", ["*"]])
        logger.debug("EnrollmentResponse is --> "+EnrollmentResponse)
        if(EnrollmentResponse && EnrollmentResponse.resultCount && EnrollmentResponse.resultCount>0){
           validEnrollmentContext.push(val) 
        }
            
        })
 
        
    }


logger.error("validEnrollmentContext is " +validEnrollmentContext)
// if(matchingContext && EnrollmentResponse && EnrollmentResponse.resultCount && EnrollmentResponse.resultCount>0) {
if(validEnrollmentContext && validEnrollmentContext.length>0) {
    logger.debug("request access is matching context")
  // callbacksBuilder.textOutputCallback(0, "enrolmentContextID:" + matchingContext._id)
    callbacksBuilder.textOutputCallback(0, "enrolmentContextID:" + validEnrollmentContext[0])

   action.goTo("success");
    } else {
        // No exact match, create new enrollment context with requested roles

    
        var now = new Date();
        //Calculate the expiry of contextID
        var defaultContextxpiryInDays = systemEnv.getProperty("esv.enrollment.context.defaultexpiry")
        var contextExpiryDateEpoch = Date.now() + defaultContextxpiryInDays * 24 * 60 * 60 * 1000
        var contextExpiryDate = new Date(contextExpiryDateEpoch).toISOString();

        var redirecttoApp = "true"; //default to true 
            var appIdParam = requestParameters.get("appId");
            var appLogoParam = requestParameters.get("appLogo");
            if (appIdParam && appIdParam.length > 0 && appLogoParam && appLogoParam.length > 0) {
                logger.error("This is request access from login authorization flow. Hence dont show confirmation page");
                redirecttoApp = "false";
            }

           //Set the return URL
            var appURLParam = "";
            var redirectToReturnURL = "";
             if(requestParameters.get("appRedirectURL")){
               appURLParam = decodeURIComponent(requestParameters.get("appRedirectURL")[0]) 

                if (appURLParam && appURLParam.length > 0) {
                logger.error("This is request access from login authorization flow.Add return url");
                redirectToReturnURL = appURLParam;
            } else {
                redirectToReturnURL = "";
            }
             }
    
        var newContext = {
            createDate: new Date().toISOString(),
            createDateEpoch: Date.now(),
            status: "0",
            requestedUserAccountId: usrID,
            requestedUserId: usrID,
            recordState: "0",
            recordSource: "KYID",
            showConfirmationPage: redirecttoApp,
            returnURL: redirectToReturnURL,
            updateDate: new Date().toISOString(),
            updateDateEpoch: Date.now(),
            createdBy: "KYID-System",
            updatedBy: "KYID-System",
            createdByID: usrID,
            updatedByID: usrID,
            expiryDate: contextExpiryDate,
            expiryDateEpoch: contextExpiryDateEpoch,
            applicationRoles: requestedRoles
            
        };

    try {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
             var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
              newContext.createDate= auditData.createdDate
             newContext.createDateEpoch= auditData.createdDateEpoch
             newContext.createdBy= auditData.createdBy
             newContext.createdByID= auditData.createdByID
        newContext.updatedBy= auditData.updatedBy
             newContext.updatedByID= auditData.updatedByID
        
                logger.debug("auditDetail " + JSON.stringify(auditData))
            } catch (error) {
               logger.error("Error Occured : Couldnot find audit details"+ error)
        
            }

    logger.debug("the payload for create enrolment contextID"+JSON.stringify(newContext));
    try{
        var result = openidm.create("managed/alpha_kyid_enrollment_contextId", null, newContext);
        var newId = result._id;

    //var applicationName = nodeState.get("appIDinWidget") || requestParameters.get("appIDinWidget")[0] || ""
      //auditLib.auditLogger("ENM003", sessionDetails, "Request Access", eventDetails, usrID, usrID, transactionid, usrID, eventDetails.applicationName, sessionDetails.sessionRefId,requestHeaders)
     auditLib.auditLogger("ENM003", sessionDetails, "Request Access", eventDetails, usrID, usrID, transactionid, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId,requestHeaders)
        logger.error("request access is created")
        callbacksBuilder.textOutputCallback(0, "enrolmentContextID:" + newId);
        action.goTo("success");
    } catch (e){

       // auditLib.auditLogger("ENM004", sessionDetails, "Request Access Failure", eventDetails, usrID, usrID, transactionid, usrID, eventDetails.applicationName, sessionDetails.sessionRefId,requestHeaders)
        auditLib.auditLogger("ENM004", sessionDetails, "Request Access Failure", eventDetails, usrID, usrID, transactionid, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId,requestHeaders)
        action.goTo("success");
    }
        
    }
 
var _ = require('lib/lodash');
var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");


function getException(e) {
    if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
        return e.javaException.cause.localizedMessage || e.javaException.cause.message;
    } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
        return e.messageDetail.message;
    } else if (_.has(e, 'message')) {
        return e.message;
    } else {
        return e;
    }
}

(function () {
  if(endpointExecution === "true"){
    if (request.method === 'read') {
        // Replace this with dynamic userId if needed (e.g. from request.params)
        var userId = "43740120-94f9-4380-a6ad-da1648f5b5dd";
        return getContextRoleAppDetails(userId);
    } else {
        throw { code: 405, message: 'Method not allowed' };
    }
  }
  else{
    throw { code: 500, message: "Internal Server Error : Flag Set to False"};
  }
}());


function getContextRoleAppDetails(userId) {
    try {
      
        var requestInfo = getFirstContextIdAndRequestId(userId);
        var roleId = getRoleFromContextId(requestInfo.contextId);
        var appInfo = getApplicationFromRole(roleId);
        var businessAppInfo = getBusinessAppFromAppId(appInfo.appId);

        return {
            contextid: requestInfo.contextId,
            requestid: requestInfo.requestId,
            requestedRole: appInfo.appName,
            busAppName: businessAppInfo.name,
            busAppLogourl: businessAppInfo.logoURL
        };
      
    } catch (error) {
        throw { code: 400, message: getException(error) };
    }
}

//Get First Matching Request + Context
function getFirstContextIdAndRequestId(userId) {
    var kyidResponse = openidm.query("managed/alpha_kyid_request", {
        "_queryFilter": 'requester eq "' + userId + '"'
    }, [""]);

    if (!kyidResponse || kyidResponse.result.length === 0) {
        throw { code: 404, message: "No alpha_kyid_request found for requester." };
    }

    var item = kyidResponse.result[0];
    return {
        contextId: item.contextid,
        requestId: item._id
    };
}

//Get Role ID from Enrolment Context
function getRoleFromContextId(contextId) {
    var contextResponse = openidm.query("managed/Alpha_Kyid_EnrolmentContext", {
        "_queryFilter": 'contextID eq "' + contextId + '"'
    }, [""]);

    if (!contextResponse || contextResponse.result.length === 0) {
        throw { code: 404, message: "No enrolment context found for contextID: " + contextId };
    }

    return contextResponse.result[0].role._refResourceId;
}

//Get Application Info from Role
function getApplicationFromRole(roleId) {
    var appResponse = openidm.query("managed/alpha_role/" + roleId + "/applications", {
        "_queryFilter": "true"
    }, [""]);

    if (!appResponse || appResponse.result.length === 0) {
        throw { code: 404, message: "No applications found for role: " + roleId };
    }

    var appItem = appResponse.result[0];
    return {
        appName: appItem.name,
        appId: appItem._refResourceId
    };
}

// Get Business App Info from Application
function getBusinessAppFromAppId(appId) {
    var application = openidm.read("managed/alpha_application/" + appId);

    if (!application || !application.businessApplication) {
        throw { code: 404, message: "Business Application not found for application: " + appId };
    }

    var busAppId = application.businessApplication._refResourceId;
    var busApp = openidm.read("managed/alpha_kyid_businessapplication/" + busAppId);

    if (!busApp) {
        throw { code: 404, message: "Business application details not found for ID: " + busAppId };
    }

    return {
        name: busApp.name,
        logoURL: busApp.logoURL
    };
}





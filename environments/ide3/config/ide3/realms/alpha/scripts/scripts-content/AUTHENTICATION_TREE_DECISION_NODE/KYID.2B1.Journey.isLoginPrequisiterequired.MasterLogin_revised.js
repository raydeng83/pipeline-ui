
var userId = ""
var skippedLogonApps = []

if(nodeState.get("usrcreatedId")){
userId = nodeState.get("usrcreatedId");
}

else if(typeof existingSession != 'undefined'){
 userId = existingSession.get("UserId")
    if(existingSession.get("skippedLogonApps")){
      skippedLogonApps = JSON.parse(existingSession.get("skippedLogonApps"))  
    }
    
 }
    
var appName = nodeState.get("appName");
// var authnTime = nodeState.get("AuthenticationInstant"); //epoch

var authnTime = null
if((typeof existingSession != 'undefined') && existingSession.get("AuthenticationTime")){
    authnTime = existingSession.get("AuthenticationTime").toString()
    // authTime = str.replace("0-","1-")
    authnTime = authnTime.replace(/^0-/, '1-')
    // const parts = authnTime.split("-")
    // if(parts[0]=="0"){
    //     authnTime = "1-"+parts[1]
    // }
}else{
    authnTime = "0-"+Date.now().toString()
    // authnTime1 = Date.now()
    
}
nodeState.putShared("AuthenticationTime",authnTime)

logger.debug("PriyaLogs:: appName is "+appName)
// Look up the appId from managed object using appName
var appResponse = openidm.query(
    "managed/alpha_kyid_businessapplication/",
    { _queryFilter: '/name eq "' + appName + '"' },
    ["*"]
);

var logonAppId = null;
if (appResponse && appResponse.result && appResponse.result.length > 0) {
    logger.debug("The logonAppId in determining login pre req " +appResponse.result[0]._id)
    logonAppId = appResponse.result[0]._id;
    nodeState.putShared("logonAppId",logonAppId)
    nodeState.putShared("softLogoutURL",appResponse.result[0].softLogoutURL)
    nodeState.putShared("appLogo",appResponse.result[0].logoFileName)

    if(appResponse.result[0].applicationURL !== null){
        nodeState.putShared("applicationURL",appResponse.result[0].applicationURL)
    }
    
}

try {
    var requestBody = {
        "payload": {
            "userId": userId,
            "logonAppId": logonAppId,
            "authTime": authnTime
        },
        "action": "11"
    };
    logger.debug("Login Prereq API Call requestBody -> "+JSON.stringify(requestBody))

    // Call loginprerequisite endpoint
    
    if(skippedLogonApps.includes(logonAppId)){
        logger.debug("Skipping the Application "+ logonAppId)
    }
    else{
        var response = openidm.create("endpoint/loginprerequisite", null, requestBody);
    }
    

    logger.debug("Response from loginprerequisite endpoint :: for appName:: " +appName +"::is::"+ JSON.stringify(response));
    
    var isLoginPrereqRequired = false;
     var isMandatoryPreReq = false;
     var isOptionalPrereq = false;

    
    // if (response && response.payload && response.payload.result && typeof response.payload.result.isLoginPrereqRequired !== "undefined") {
       // isLoginPrereqRequired = response.payload.result.isLoginPrereqRequired;
     if (response && response.payload && response.payload.result) {
        isMandatoryPreReq = response.payload.result.mandatoryPrerequisite;
        isOptionalPrereq = response.payload.result.optionalPrerequisite;
        
       // logger.debug("isLoginPrereqRequired value from response: " + isLoginPrereqRequired);
        logger.debug("isMandatoryPreReq value from response for appName:: "+ appName + "::is::" + isMandatoryPreReq);
        logger.debug("isOptionalPrereq value from response for appName:: "+ appName + "::is::" + isOptionalPrereq);

        if(isOptionalPrereq === true || isMandatoryPreReq === true){
            isLoginPrereqRequired = true
        } else {
            isLoginPrereqRequired = false
        }
        
    }

    logger.debug("isLoginPrereqRequired value: " + isLoginPrereqRequired);

    nodeState.putShared("isLoginPrereqRequired", isLoginPrereqRequired);
    nodeState.putShared("isMandatoryPreReq", isMandatoryPreReq);
    nodeState.putShared("isOptionalPrereq", isOptionalPrereq);


} catch (e) {
    logger.error("Error invoking loginprerequisite endpoint: " + e);
    nodeState.putShared("isLoginPrereqRequired", true);
    nodeState.putShared("isMandatoryPreReq", true);
    nodeState.putShared("isOptionalPrereq", true);

}

outcome = "true"
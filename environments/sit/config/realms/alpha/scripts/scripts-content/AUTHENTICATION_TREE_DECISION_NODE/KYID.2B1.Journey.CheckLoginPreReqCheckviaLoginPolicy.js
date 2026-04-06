var appName = nodeState.get("appName");


logger.debug("appName is "+appName)
// Look up the appId from managed object using appName
var appResponse = openidm.query(
    "managed/alpha_kyid_businessapplication/",
    { _queryFilter: '/name eq "' + appName + '"' },
    ["*"]
);

var logonAppId = null;
if (appResponse && appResponse.result && appResponse.result.length > 0) {
    logger.debug("The logonAppId KYID.2B1.Journey.CheckLoginPreReqCheckviaLoginPolicy " +appResponse.result[0]._id)
    logonAppId = appResponse.result[0]._id;
    nodeState.putShared("logonAppId",logonAppId)
    nodeState.putShared("softLogoutURL",appResponse.result[0].softLogoutURL)
    nodeState.putShared("appLogo",appResponse.result[0].logoURL)
    
    if(appResponse.result[0].applicationURL !== null){
        nodeState.putShared("applicationURL",appResponse.result[0].applicationURL)
    }
}

if(nodeState.get("enforcePrereq") === true || nodeState.get("enforcePrereq") === "true"){
    logger.debug("enforcePrereq via login policy is ENABLED. Go to Login PreRequisite check")
    action.goTo("loginprereq")
} else {
    nodeState.putShared("isLoginPrereqRequired", false)
     nodeState.putShared("isMandatoryPreReq", false);
    nodeState.putShared("isOptionalPrereq", false);
    logger.debug("enforcePrereq via login policy is DISABLED.")
    action.goTo("skiploginprereq")
}
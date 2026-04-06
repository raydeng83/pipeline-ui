if(nodeState.get("enforceAccessAuthZ") === true || nodeState.get("enforceAccessAuthZ") === "true"){
    logger.debug("authorization via login policy is ENABLED. Go to Authorization check")
    action.goTo("authz")
} else {
      var contextID = null;
    var defaultContextID = systemEnv.getProperty("esv.kyid.default.contextid")

    if (requestParameters.get("contextId")) {
             contextID = requestParameters.get("contextId")[0];
            logger.debug("Context ID: " + contextID); 
         }
            
    if(contextID != null && defaultContextID !=null && (contextID !== defaultContextID)){
            var queryFilter = '_id eq "' + contextID + '"';
            var existingContextResult = openidm.read("managed/alpha_kyid_enrollment_contextId/"+contextID)
            if(existingContextResult){
            logger.debug("Context found for user. Not equals to Default ContextID. ContextID found");
            nodeState.putShared("route", "hascontext");
            nodeState.putShared("contextID", contextID);
            action.goTo("skipauthz");
            } else {
            nodeState.putShared("loginauthz","userhasroles")
            nodeState.putShared("route",null)
            logger.debug("authorization via login policy is DISABLED. SKIP Authorization check. ContextID not found")
            action.goTo("skipauthz")
            }
            
 
    } else {
    nodeState.putShared("loginauthz","userhasroles")
    nodeState.putShared("route",null)
    logger.debug("authorization via login policy is DISABLED. SKIP Authorization check")
    action.goTo("skipauthz")
    }
    
}
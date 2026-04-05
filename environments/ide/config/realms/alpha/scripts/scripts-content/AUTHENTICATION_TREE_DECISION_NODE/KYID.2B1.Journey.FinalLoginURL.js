/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var authnTimestamp = null
if((typeof existingSession != 'undefined') && existingSession.get("AuthenticationTime")){
    authnTimestamp = null
}
else{
    authnTimestamp = nodeState.get("AuthenticationTime")
}

if(nodeState.get("successfullogin") === "true"){
    logger.debug("authz and login pre req completed")
    if(authnTimestamp){
     action.goTo("login").putSessionProperty("AuthenticationTime",authnTimestamp)   
    }
    else{
        action.goTo("login")
    }
    
}  else {
    if(authnTimestamp){
        action.goTo("redirect").putSessionProperty("AuthenticationTime",authnTimestamp)
    }
    else{
        action.goTo("redirect")
    }
    
}


/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


if(nodeState.get("outcome") != null){
    if (nodeState.get("outcome") == "mail"){
        nodeState.putShared("outcome",null)
        logger.debug("InsideMailInlogin")
        action.goTo("mail")
    }
    // else if (nodeState.get("outcome") == "phone"){
    //     nodeState.putShared("outcome",null)
    //    action.goTo("phone")
    // }
    }
    else{
        logger.debug("InsideErrorInlogin")
         action.goTo("error")
    }
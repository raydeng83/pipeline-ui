/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


   var isJitneeded = nodeState.get("isJitRequired");
    // var isJitneeded = null;
    if(isJitneeded)
    {
        nodeState.putShared("isJitRequired", null);
        action.goTo("true");
    }
    else{
        action.goTo("false");
    }

 



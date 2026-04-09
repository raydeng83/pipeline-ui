/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

//nodeState.putShared("needkogvisit","yes");

if(nodeState.get("applicationType")){
    var appType = nodeState.get("applicationType");
    var needkogvisit = nodeState.get("needkogvisit").toLowerCase();  
    if ( appType = "oidc" && needkogvisit.localeCompare("yes")==0 ) {
    action.goTo("oidcneedkogvisit");
} else {
    action.goTo("others");
}
} else {
    action.goTo("others");
}



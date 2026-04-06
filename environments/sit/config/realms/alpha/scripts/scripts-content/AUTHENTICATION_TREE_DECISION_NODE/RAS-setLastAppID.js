/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

try{
    var lastAppId = nodeState.get("spEntityID").get(0).toString();
    action.goTo("success").putSessionProperty("lastAppId", lastAppId);
} catch(e) {
    action.goTo("error");
}


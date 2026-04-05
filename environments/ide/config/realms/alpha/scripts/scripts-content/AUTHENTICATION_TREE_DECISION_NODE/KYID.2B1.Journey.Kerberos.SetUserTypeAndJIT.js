/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

nodeState.putShared("userType","Internal");
if(systemEnv.getProperty("esv.isjitrequiredflag").toLowerCase().localeCompare("true")===0) {
    nodeState.putShared("isJitRequired", "true");
} else {
    nodeState.putShared("isJitRequired", "false");
}
//outcome="true";
if(nodeState.get("windowsAccName")){
    var windowsaccountname = nodeState.get("windowsAccName") || null
action.goTo("true").putSessionProperty('windowsaccountname', windowsaccountname);
} else {
action.goTo("true")
}
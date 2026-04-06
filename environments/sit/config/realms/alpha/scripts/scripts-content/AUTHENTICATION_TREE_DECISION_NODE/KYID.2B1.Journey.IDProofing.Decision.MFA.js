/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.debug("userPrereqStatus is :: "+ nodeState.get("userPrereqStatus"))
logger.debug("journeyName :: => "+ nodeState.get("journeyName"))
if(nodeState.get("userPrereqStatus")==="REVERIFY" || nodeState.get("userPrereqStatus")==="PENDING" || nodeState.get("prereqStatus")==="REVERIFY" || nodeState.get("prereqStatus")==="PENDING") {
    outcome ="FARS"
}
else if(nodeState.get("journeyName")==="firsttimelogin"|| nodeState.get("journeyName")==="forgotPassword" ||nodeState.get("context") ==="appEnroll"|| nodeState.get("journeyName")==="accountRecovery"){
    outcome = "create";
}else if(nodeState.get("journeyName")==="updateprofile" || nodeState.get("journeyName"==="MFARecovery")){
    outcome = "update";
}else if(nodeState.get("firsttimeloginjourney") == "true" && nodeState.get("journeyName")==="createAccount" ){
    outcome = "create";
}else if(nodeState.get("journeyName")==="organdonor" || nodeState.get("journeyName")==="createAccount"){
    outcome = "organ";
}else{
    outcome = "continue"
}



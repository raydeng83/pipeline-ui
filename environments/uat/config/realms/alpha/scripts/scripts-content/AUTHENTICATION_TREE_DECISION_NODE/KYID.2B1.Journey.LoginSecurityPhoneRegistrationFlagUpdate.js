/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(nodeState.get("journeyName") !== "MFARecovery" && nodeState.get("journeyName") !== "RIDP_LoginMain"){
    var ridpJourneyName = nodeState.get("journeyName") || null;
    nodeState.putShared("ridpJourneyName",ridpJourneyName);
    nodeState.putShared("journeyName","loginSecurity");
    
}
nodeState.putShared("verification","phone")
nodeState.putShared("flowName","SetupMFA")
outcome = "true";

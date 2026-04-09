/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

// Node outcomes
var nodeOutcome = {
    VERIFIEDPREREQ: "verified",
    ENROLLPREREQ: "enroll"
};
 // nodeState.putShared("journeyName", "loginPrerequisite");
 if(((nodeState.get("viewPreqData")!==null && nodeState.get("viewPreqData")) || nodeState.get("journeyName")==="loginPrerequisite")){
     action.goTo(nodeOutcome.VERIFIEDPREREQ);
 }else{
      action.goTo(nodeOutcome.ENROLLPREREQ);
 }

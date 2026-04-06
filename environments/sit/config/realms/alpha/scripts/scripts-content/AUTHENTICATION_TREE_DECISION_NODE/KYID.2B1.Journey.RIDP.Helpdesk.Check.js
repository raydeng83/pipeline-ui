/*
 * Copyright 2024-2025 Ping Identity Corporation. All Rights Reserved
 *
 * This code is to be used exclusively in connection with Ping Identity
 * Corporation software or services. Ping Identity Corporation only offers
 * such software or services to legal entities who have entered into a
 * binding license agreement with Ping Identity Corporation.
 */
/*
  - Data made available by nodes that have already executed is available in the nodeState variable.
  - Use the action object to set the outcome of the node.
 */
if(nodeState.get("journeyName") === "updateprofile"){
    nodeState.putShared("context","manageprofile")
    action.goTo("updateprofile");
}else if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "forgotpassword" && nodeState.get("Context") === "id_verification"){
    action.goTo("id_verification");
}else if(nodeState.get("appEnrollRIDPMethod") === "LexisNexis"){
    action.goTo("appEnroll");
}else if(nodeState.get("flowName") === "standaloneRIDP"){
     action.goTo("standaloneRIDP");
}else{
    action.goTo("true");
}

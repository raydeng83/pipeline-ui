/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


if(nodeState.get("Journey_Phone_Verification"))
{
    nodeState.putShared("Journey_Phone_Verification", null);
    outcome = "true";
}

else if(nodeState.get("Retry_another_method")){
    if(nodeState.get("gobackcount")!=null){
        nodeState.putShared("gobackcount", null);
    }
    nodeState.putShared("Retry_another_method", null);
    outcome = "true";
}
else if(nodeState.get("Try_different_verification_method")){
    if(nodeState.get("gobackcount")!=null){
        nodeState.putShared("gobackcount", null);
    }
    nodeState.putShared("Try_different_verification_method", null);
    outcome = "true";
}


else if(nodeState.get("Back")){
    nodeState.putShared("Back", null);
    outcome = "true";
}

else if(nodeState.get("skipPhone")){
    nodeState.putShared("skipPhone", null);
    outcome = "true";
}
else if(nodeState.get("maxlimitforback")){
    nodeState.putShared("maxlimitforback", "false");
}
else{
     outcome = "false";
}



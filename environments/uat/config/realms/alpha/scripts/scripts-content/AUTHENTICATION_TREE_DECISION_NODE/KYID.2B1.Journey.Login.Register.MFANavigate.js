
if(nodeState.get("symantecBack") === "true"){
    nodeState.putShared("symantecBack",null);
    outcome = "back";
}
else if(nodeState.get("BackTOTP")== "true"){
    nodeState.putShared("BackTOTP",null);
    outcome = "back";
    
}
else if(nodeState.get("BackPUSH")== "true"){
    nodeState.putShared("BackPUSH",null);
    outcome = "FRback";
    
}
else if(nodeState.get("phoneBack") == "true" || (nodeState.get("firsttimeloginjourney") === "true" && nodeState.get("Journey_Phone_Verification") === "back")){
    nodeState.putShared("phoneBack",null);
    nodeState.putShared("Journey_Phone_Verification",null)
    outcome = "phoneBack";
} 
else if(nodeState.get("backfrommail") == "true"){
    nodeState.putShared("backfrommail",null);
    outcome = "altMailBack";
}
    
else{
    outcome = "next";
}


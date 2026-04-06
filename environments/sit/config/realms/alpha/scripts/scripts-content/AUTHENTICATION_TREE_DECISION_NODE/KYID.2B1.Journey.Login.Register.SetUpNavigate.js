if(nodeState.get("SelectPhonAuthNode") === "back"){
    nodeState.putShared("SelectPhonAuthNode",null);
    outcome = "back";
}
else if(nodeState.get("Go_back")=="true"){
    nodeState.putShared("Go_back", null);
    outcome = "back";
}
// else if(nodeState.get("BackTOTP")== "true"){
//     nodeState.putShared("BackTOTP",null);
//     outcome = "back";
    
// }
// else if(nodeState.get("BackPUSH")== "true"){
//     nodeState.putShared("BackPUSH",null);
//     outcome = "FRback";
    
// }
// else if(nodeState.get("phoneBack") == "true"){
//     nodeState.putShared("phoneBack",null);
//     outcome = "phoneBack";
// }

else{
    logger.error("Delete Profile Completed")
    outcome = "next";
}


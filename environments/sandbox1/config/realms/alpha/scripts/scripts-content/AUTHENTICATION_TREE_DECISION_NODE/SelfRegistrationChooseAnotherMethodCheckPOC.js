
if(nodeState.get("anotherFactor") !==null){
    var anotherFactor =nodeState.get("anotherFactor")
    if (anotherFactor === "anotherFactor"){
        logger.error("Naren Logs AnotherFacttor")
        nodeState.putShared("anotherFactor", null)
        outcome = "true";
        
    }
    else{
        logger.error("Naren Logs False")
        outcome = "false";
    }
     
}
else{
    outcome = "false";
}


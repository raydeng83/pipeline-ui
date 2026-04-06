logger.debug("checking if alternate email present");



logger.debug("forgotpasswordjourney : "+nodeState.get("isForgotPasswordJourney"));
if(nodeState.get("isForgotPasswordJourney") == true){
    logger.debug("forgot password journey true");
    if(nodeState.get("primary_secondary_email") == true){
        logger.debug("primary secondary mail true");
        //var alternateEmail = nodeState.get("alternatemail");
        logger.debug("alternateEmail from forgot pw: "+nodeState.get("alternatemail"));
        nodeState.putShared("alternateEmail",nodeState.get("alternatemail"));
        outcome = "true";
    }
}else{
    logger.debug("forgot password journey false");
    outcome = "false";
}
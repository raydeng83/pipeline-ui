/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if(nodeState.get("primaryemail")){
    var oldprimaryemail = nodeState.get("primaryemail")
    logger.error("oldprimaryemail" + oldprimaryemail);
    if(nodeState.get("mail")){
        var newprimaryemail = nodeState.get("mail");
        logger.error("newprimaryemail" + newprimaryemail);
    }
    if(newprimaryemail === oldprimaryemail ){
        outcome = "true"
    } else {
        outcome = "false"
    }
} else {
    outcome = "false"
}

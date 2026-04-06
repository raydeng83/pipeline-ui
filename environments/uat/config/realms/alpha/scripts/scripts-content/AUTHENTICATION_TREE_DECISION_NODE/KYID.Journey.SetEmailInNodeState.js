/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if( nodeState.get("mail") &&  nodeState.get("mail") !=null){
    var email = nodeState.get("mail");
    logger.error("Printing the username from the shared state::::::"+nodeState.get("username"));
    logger.error("Printing the email of the user to put in node state  :::::::::; " + email);
    nodeState.putShared("username", email);
    outcome = "True";
}

/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

if( nodeState.get("KOGID") &&  nodeState.get("KOGID") !=null){
    var KOGID = nodeState.get("KOGID")
    logger.error("Printing the KOGID of the user to put in node state  :::::::::; " + KOGID)
    nodeState.putShared("username", KOGID)
    outcome = "True";
}

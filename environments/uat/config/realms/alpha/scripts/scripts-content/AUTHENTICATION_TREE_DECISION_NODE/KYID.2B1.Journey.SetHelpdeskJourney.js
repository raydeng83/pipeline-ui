/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

nodeState.putShared("helpdeskjourney","true")
nodeState.putShared("isHelpDeskUser", "true");
if(nodeState.get("KOGID")){
    logger.error("the KOGID in KYID.2B1.Journey.SetHelpdeskJourney: "+nodeState.get("KOGID"))
var KOGID = nodeState.get("KOGID")
    nodeState.putShared("objectAttributes", { "userName": KOGID });
}

outcome = "true";

if(nodeState.get("mail")){
    var KOGID = nodeState.get("KOGID")
    logger.debug("the KOGID is: "+KOGID)
    var mail = nodeState.get("mail")

    //check if the request is coming from helpdesk journey
    if (nodeState.get("helpdeskjourney") === "true" && requestParameters.get("_id")){
        logger.debug("the KOGID of enduser for helpdesk: "+nodeState.get("usrKOGID"))
    nodeState.putShared("objectAttributes", {"userName": nodeState.get("usrKOGID")}); 
        } else {
            // logger.debug("PlaceholderKOGID")
            nodeState.putShared("objectAttributes", {"userName": nodeState.get("KOGID")}); 
       // nodeState.putShared("objectAttributes", {"mail": nodeState.get("mail")});
            //nodeState.putShared("objectAttributes", {"userName": nodeState.get("KOGID"),"givenName":nodeState.get("givenName"),"sn":nodeState.sn}); 
        }
    
   // nodeState.putShared("objectAttributes", {"userName": nodeState.get("KOGID")}); 
    logger.debug("in FP login Flow")
    } 
// else {
//         nodeState.putShared("KOGID","test-priya@mailinator.com")
//     nodeState.putShared("_id","2cac8cf7-c334-483c-a6c6-51cf6800a1e8")
//     nodeState.putShared("objectAttributes", {"userName": "test-priya@mailinator.com"}); 
//     logger.debug("TBD11")
//     }


outcome = "true";

/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
// nodeState.putShared("KOGID","test-priya@mailinator.com")
// nodeState.putShared("_id","2cac8cf7-c334-483c-a6c6-51cf6800a1e8")
// nodeState.putShared("objectAttributes", {"userName": "test-priya@mailinator.com"}); 
// logger.debug("TBD11")
// outcome = "true";

// if(nodeState.get("KOGID")){
// var KOGID = nodeState.get("KOGID")
// var mail = nodeState.get("mail")
// nodeState.putShared("objectAttributes", {"userName": nodeState.get("userName")}); 
// } else {
//     nodeState.putShared("KOGID","test-priya@mailinator.com")
// nodeState.putShared("_id","2cac8cf7-c334-483c-a6c6-51cf6800a1e8")
// nodeState.putShared("objectAttributes", {"userName": "test-priya@mailinator.com"}); 
// logger.debug("TBD11")
// }

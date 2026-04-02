var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
    
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "KYID.2B1.Journey.RemoveRoles",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RemoveRoles",
    timestamp: dateTime,
    end: "Node Execution Completed"
};
    
var NodeOutcome = {
    TRUE: "true",
    FALSE: "false"
};

/**
    * Logging function
    * @type {Function}
*/
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
        debug: function (message) {
        logger.debug(message);
},
    // Logs Error that can impact Application functionality
        error: function (message) {
        logger.error(message);
},
       info: function (message) {
        logger.info(message);
}
};

   
try{
        
    var userId = nodeState.get("_id");
    var roleIds=[];
    //var userId="6d037ebf-358f-4822-a332-e01dc3b94bb3";
    var userRoleList = openidm.query("managed/alpha_user/" + userId + "/roles", {
        "_queryFilter": "true"
    }, ["_refResourceId"]);

    //logger.debug("userRoleList:"+JSON.stringify(userRoleList));

    if (!userRoleList) {
        logger.debug("No roles found for user");
        action.goTo(NodeOutcome.TRUE);
    } else {
        logger.debug("Total roles found for user: " + userRoleList.result.length);

        for (var i = 0; i < userRoleList.result.length; i++) {
            var roleEntry = userRoleList.result[i];
            //logger.debug("roleEntry"+userRoleList.result[i]);
            var refId = roleEntry._refResourceId;
            var membershipId = roleEntry._id;
            roleIds.push(refId);
            //logger.debug("membershipId:"+membershipId)
            //logger.debug("refId"+refId)
            //openidm.delete("managed/alpha_user/" + userId + "/roles/" + membershipId, null);
            }
        
        }
    logger.debug("ListOfroleIds:"+JSON.stringify(roleIds));
    nodeState.putShared("roleIds",roleIds);
    action.goTo(NodeOutcome.TRUE);
    }
catch(e){
    logger.error("Error in remove roles:"+e.message);
    action.goTo(NodeOutcome.TRUE);
}
    

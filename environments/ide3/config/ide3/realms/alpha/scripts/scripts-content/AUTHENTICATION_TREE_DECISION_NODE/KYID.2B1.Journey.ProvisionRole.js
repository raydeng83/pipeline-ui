/**
* Script: KYID.2B1.Journey.ProvisionRole
* Description: This script is used to provision role to user.
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "Provision Role",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ProvisionRole",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     TRUE: "True",
     FALSE: "False",
     ERROR: "Error"
 };


 function main(){

    //Function Name
    nodeConfig.functionName = "main()";

     //Local Variables
    var requestId = null;
    var response = null;

    try {
    
        if(nodeState.get("roleRequestId")!=null && nodeState.get("roleRequestId")){
            requestId = nodeState.get("roleRequestId");
        } else {
            action.goTo(nodeOutcome.ERROR);
        }
        
        response = openidm.action('endpoint/addRemoveRoleMembers', 'POST', { action: "add", requestId: requestId });
        logger.debug("response role provisioning - "+response);
        logger.debug("response code role provisioning - "+response.code);
        
        if(response.code === 1){
            logger.debug("Role is provisioned. Sending access grantvsuccess email...");
            nodeState.putShared("sendAccessGrant","success");
            action.goTo(nodeOutcome.TRUE);
        
        } else{
             logger.debug("Role is not provisioned. Sending access grant failure email...");
             nodeState.putShared("sendAccessGrant","failure");
             action.goTo(nodeOutcome.FALSE);    
        }
        
    } catch (error) {
        logger.error("Error Occurred - "+ error)
        action.goTo(nodeOutcome.ERROR);
    }
 }


//Invoke Main Function
main();


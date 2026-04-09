/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

function getPolicyManagedObject() {

    var policyObject = openidm.read('managed/' + objectType + '/' + objectId);
    
    try { 
        var olicyRecords = openidm.query("managed/Alpha_Kyid_Policy");
        logger.error("Successfully received Policy Records");
    } catch(error) {
        logger.error("Inside getPolicyManagedObject() exception");
        outcome = "false";
    }
    
    return policyRecords;

}

function main(){
    getPolicyManagedObject();
    outcome = "true";
}

//Execute Main Function
main();


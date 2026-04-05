function scanViolation (policyId) {
    try {

 var body = {}
 // var Response = openidm.action("iga/governance/policy/"+policyId+"/scan?simulate=false&waitForCompletion=true", "POST", body,{simulate:false,waitForCompletion:true});
       var Response = openidm.action("iga/governance/policy/0447186b-dc32-4dd3-a4a2-259be8b721bd/scan", "POST", body,{simulate:false,waitForCompletion:true});

 logger.debug("Violation Scan Response from Journey is ::" + Response)
 logger.debug("Violation Scan Response from Journey is ::" + Response.results.length)
   logger.debug("Violation Scan Response from Journey is ::" + Response.results[0]) 

            
    } catch (error) {
        logger.error("Error Occured ::" + error)
        outcome="error"
    }
return (Response.results[0].numViolations)

}

//Main Execution.
var policyId= "0447186b-dc32-4dd3-a4a2-259be8b721bd"
var violationCount = scanViolation(policyId);
if (violationCount){
if (violationCount>0){
    nodeState.putShared("violationCount",violationCount)
  outcome="true"  
}
else{
    nodeState.putShared("violationCount",violationCount)
    outcome="false"
}
}
else{
    logger.error("Error Occured while fetching the resonse.")
    outcome="error"
}
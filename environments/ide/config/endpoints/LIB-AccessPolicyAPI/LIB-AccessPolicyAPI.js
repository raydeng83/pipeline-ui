  (function () {
    if (request.method === 'create') {
      // POST
       var response = {}
       var payload = request.content.payload;
       var policyId = payload.policyId
       var action = request.content.action
       if(action === 0){
        response = getPolicyDetails(action,policyId);
      }
       
      
      return response;
    } else if (request.method === 'read') {
      // GET
      return {};
    } else if (request.method === 'update') {
      // PUT
      return {};
    } else if (request.method === 'patch') {
      return {};
    } else if (request.method === 'delete') {
      return {};
    }
    throw { code: 500, message: 'Unknown error' };
  }());




function getPolicyDetails(action,policyId) {
  try {
    logger.error("getPolicyDetails --> " )
    if(action == 0){
      const response = openidm.query("managed/alpha_kyid_enrollment_access_policy/", { "_queryFilter": '/_id/ eq "' + policyId + '"'+' AND recordState eq "'+"ACTIVE"+'"'},
                                   ["preRequisites/*","mutuallyExclusiveRole/*","dependentRole/*","*"]);
     
      logger.error("getPolicyDetails --> response " +response)
      if(response && response !== null){
        return response
      }
      else{
        return {
          "isPolicyPresent" : false
        }
        // throw { code: 400, message: 'Policy not found' };
      }
    }
    
  } catch (error) {
    throw { code: 500, message: 'Unknown error' };
  }
  
}



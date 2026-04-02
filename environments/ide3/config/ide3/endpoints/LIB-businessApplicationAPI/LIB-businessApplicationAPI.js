  (function () {
    if (request.method === 'create') {
      // POST
       var response = {}
       var payload = request.content.payload;
       var businessApplicationId = payload.businessApplicationId
       var action = request.content.action
       if(action === 0){
        response = getBusinessAppDetails(businessApplicationId);
         if(response){
           return response 
         }
         else{
            return {};
         }
      }

     
    } else if (request.method === 'read') {
      // GET
        let response = {}
      //   var roleId = request.additionalParameters.roleId;
      //   logger.error("endpoint/LIB-businessApplicationAPI  Role Id is --> "+roleId);
      //   if(roleId){
      //     response = getBusinessAppDetails(roleId);
      //     if(response){
      //       return response
      //     }
      //   }
      // else{
      //   return null;
      // }
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




function getBusinessAppDetails(businessApplicationId) {
  try {
    logger.error("getBusinessAppDetails businessApplicationId is --> "+ businessApplicationId)
      const response = openidm.query("managed/alpha_kyid_businessapplication/", { "_queryFilter": '/_id/ eq "' + businessApplicationId + '"'},["*"]);
      logger.error("getBusinessAppDetails response is --> "+ response)
      if(response && response !== null){
        logger.error("response.resultCount -> " + response.resultCount);
        if(response.resultCount>0){
          return response
        }
        else{
          return null
        }
        
      }
      
      else{
        return null;
      }
    
    
  } catch (error) {
    logger.error("Error Occurred while getBusinessAppDetails -- > "+ error)
    throw { code: 500, message: 'Unknown error' + error};
  }
  
}



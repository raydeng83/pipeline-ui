  (function () {
    if (request.method === 'create') {
      // POST
       var response = {}
       var payload = request.content.payload;
       var prereqId = payload.prereqId
       var action = request.content.action
      if(action == 2){
        logger.error("prereqId -- > "+ prereqId)
        let resonse = getPrerequisite(prereqId)
        return resonse
      }
      else{
        return {}
      }
      
     
    } else if (request.method === 'read') {
      // GET
      let prereqId = request.additionalParameters._id
      if(prereqId){
        let resonse = getPrerequisite(prereqId)
        if(resonse){
          return resonse
        }
        else{
          return {}
          
        }
      }
      else{
        throw { code: 400, message: 'Invalid Input Params' };
      }
      
      
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

function getPrerequisite(prereqId) {
  try {
    logger.error("getPrerequisite -- > "+ getPrerequisite)
    const response = openidm.query("managed/alpha_kyid_enrollment_prerequisite/", { "_queryFilter": '/_id/ eq "' + prereqId + '"'+' AND recordState eq "'+"ACTIVE"+'"'},
                                   ["prereqTypeId/*","*"]);
    if(response){
      logger.error("getPrerequisite response is --> "+ getPrerequisite)
      return response
    }
    else{
      return null
    }

  } catch (error) {
    logger.error("Error occurred while getting getPrerequisite "+error)
  }
  
}
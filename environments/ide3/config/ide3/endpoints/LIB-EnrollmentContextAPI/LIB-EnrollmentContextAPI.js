const currentTimeinEpoch = Date.now();

var _ = require('lib/lodash');
var isEndpointExecutionAllowed = identityServer.getProperty("esv.journey.execution.flag");

function getException(e) {
  if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
    return e.javaException.cause.localizedMessage || e.javaException.cause.message;
  } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
    return e.messageDetail.message;
  } else if (_.has(e, 'message')) {
    return e.message;
  } else {
    return e;
  }
}

(function () {
    if (request.method === 'create') {
      // POST
      var response = "";
      var contextId = request.content.payload.contextId;
      var action = request.content.action;
      if(action !== null && action && action === 2){
        response = enrollmentContext(contextId);
      }
      return response ;
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

function enrollmentContext(contextId) {
  try {
    var outcome = {
      'contextID':contextId,
      applicationRoles:null,
      requestedUserAccountId:null,
      requesterUserAccountId:null
    };
      logger.error("enrollmentContext -- > contextId is --> " +contextId )
      var query = ` _id eq '${contextId}' AND (recordState eq '0' OR recordState eq 'ACTIVE' AND status eq '0' ) `
      // var response = openidm.query("managed/alpha_kyid_enrollment_contextId/", { "_queryFilter": '/_id/ eq "' + contextId + '"'+' AND recordState eq "'+"0"+'"'+' AND status eq "'+"0"+'"' }, []);
      var response = openidm.query("managed/alpha_kyid_enrollment_contextId/", { "_queryFilter": query }, []);
    // var response = openidm.query("managed/alpha_kyid_enrollment_contextId/", { "_queryFilter": '/_id/ eq "' + contextId + '"'}, []);
      logger.error("enrollmentContext -- > response is --> " +response )
         if(response){
           // response = JSON.parse(response);
           
          // if(response.result[0].expiryDateEpoch && response.result[0].expiryDateEpoch > currentTimeinEpoch){
          //   logger.error("Context ID is within Expiry")
          //   logger.error("Expiry Date in Epoch "+ response.result[0].expiryDateEpoch);
          //   logger.error("currentTimeinEpoch "+ currentTimeinEpoch)
          //   if(response.result[0].applicationRoles){
          //     outcome.applicationRoles = response.result[0].applicationRoles;
          //     if(response.result[0].requesterUserAccountId){
          //       outcome.requesterUserAccountId = response.result[0].requesterUserAccountId;
          //     }
          //     if(response.result[0].requestedUserAccountId){
          //       outcome.requestedUserAccountId = response.result[0].requestedUserAccountId;
          //     }
          //   }
          // }
          //  else{
          //    throw { code: 404, message: 'Enrollment Context is Expired '+contextId };
          //  }
             return response;
      }
      else{
        return { code: 404, message: 'Record not found with context ID'+contextId };
      }
    

  
    
  } catch (error) {
    logger.error("Error Occurred while getting context ID "+ enrollmentContext)
   
  }
}

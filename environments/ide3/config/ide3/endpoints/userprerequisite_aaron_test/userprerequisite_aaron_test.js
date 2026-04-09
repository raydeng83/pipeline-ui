
const requestDetail = ()=>{
  let detail = {}
  detail.timestamp = context.requestAudit.receivedTime 
  detail.transactionId = context.transactionId.id
  detail.endpoint = context.parent.matchedUri
  return detail
}

(function () {
    logger.error("AARON_DEBUG: *** userprerequisite_aaron_test ENDPOINT ENTRY ***");
    logger.error("AARON_DEBUG: Method: " + request.method);
    logger.error("AARON_DEBUG: Raw request content: " + JSON.stringify(request.content));
    
    const authenticatedUserId = context.current.parent.parent.parent.parent.parent.rawInfo.sub
    const authorizedRole = context.current.parent.parent.parent.parent.authorization.roles
    const payload = request.content.payload
    const action = request.content.action
    var status = payload.status;
    var returnParams = payload.returnParams;
    var requestedUserAccountId = payload.requestedUserAccountId
    
    logger.error("AARON_DEBUG: authenticatedUserId=" + authenticatedUserId);
    logger.error("AARON_DEBUG: action=" + action);
    logger.error("AARON_DEBUG: status=" + status);
    logger.error("AARON_DEBUG: requestedUserAccountId=" + requestedUserAccountId);
  
    if (request.method === 'create') {
        // POST
        // if ((authenticatedUserId !== requestedUserAccountId)) {
        //     throw { code: 403, message: 'You are not authorized' }
        // }
      
      if(request.content){
        if (action === 4) {
          if (requestedUserAccountId && status) {
            return getUserRequestByRequestedUserAccountIdAndStatus(requestedUserAccountId, status, returnParams);
          } else {
            throw {
              code: 400,
              message: 'No matching condition found for search'
            };
          }
        
        } else if (action === 2) {
              //Only Authenticated user or Tenant Admin is allowed to access the endpoint
            if (authenticatedUserId !== requestedUserAccountId && !authorizedRole.includes("tenant-admins")){
                throw { code: 401, message: 'Unauthorized' }
            }

            try{
              return patchUserPrerequisite(payload)
            } catch(error){
              logger.error("Exception is - "+getException(error))
              throw error
            }
            
        } else {
          throw { code: 500, message: 'Unknown_Action' }
        }

      } else{
         throw { code: 400, message: 'Request Body not present' };
      }
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


/**
* @name <getUserRequestByRequestedUserAccountIdAndStatus>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserRequestByRequestedUserAccountIdAndStatus (requestedUserAccountId, status, returnParams) {
    logger.error("AARON_DEBUG: getUserRequestByRequestedUserAccountIdAndStatus ENTRY");
    logger.error("AARON_DEBUG: requestedUserAccountId=" + requestedUserAccountId);
    logger.error("AARON_DEBUG: status=" + status);
    logger.error("AARON_DEBUG: returnParams=" + JSON.stringify(returnParams));
    
    try {
      var queryFilter = "";
      var queryParams = {};
      
      if (status == "*" || status == null) {
        logger.error("AARON_DEBUG: Querying with wildcard/null status");
        queryFilter = '/requestedUserAccountId/ eq "' + requestedUserAccountId + '"';
      } else {
        logger.error("AARON_DEBUG: Querying with specific status: " + status);
        queryFilter = '/requestedUserAccountId/ eq "' + requestedUserAccountId + '"' + ' AND status eq "' + status + '"';
      }
      
      logger.error("AARON_DEBUG: Final queryFilter constructed: " + queryFilter);
      logger.error("AARON_DEBUG: returnParams: " + JSON.stringify(returnParams));
      logger.error("AARON_DEBUG: About to execute query on managed/alpha_kyid_enrollment_user_prerequisites/");
      
      queryParams["_queryFilter"] = queryFilter;
      
      // Merge returnParams into queryParams - this is the correct signature
      if (returnParams && typeof returnParams === 'object') {
          for (var key in returnParams) {
              queryParams[key] = returnParams[key];
          }
      }
      
      logger.error("AARON_DEBUG: Final queryParams object (with returnParams merged): " + JSON.stringify(queryParams));
      
      var response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", queryParams);

      logger.error("AARON_DEBUG: Query response resultCount=" + response.resultCount);
      
        if (response.resultCount > 0) {
          logger.error("AARON_DEBUG: Processing " + response.resultCount + " results");
          var userPrereqList = response.result;
          
          for (var i = 0; i < userPrereqList.length; i++) {
            logger.error("AARON_DEBUG: Processing item " + i + "/" + userPrereqList.length);
            var preRequisiteId = userPrereqList[i].preRequisiteId._refResourceId;
            logger.error("AARON_DEBUG: Looking up preRequisiteId=" + preRequisiteId);

            var preRequisiteResponse = openidm.read("managed/alpha_kyid_enrollment_prerequisite/" + preRequisiteId);
            if (!preRequisiteResponse) {
              logger.error("AARON_DEBUG: ERROR - Prerequisite not found for id: " + preRequisiteId);
              logger.error("Prerequisite not found for id: " + preRequisiteId);
              return {error: "Prerequisite not found for id: " + preRequisiteId};
            } else {
              logger.error("AARON_DEBUG: Successfully retrieved prerequisite for id: " + preRequisiteId);
              userPrereqList[i].preRequisiteId = preRequisiteResponse;
            }
          }

          logger.error("AARON_DEBUG: About to return response - validating JSON structure");
          logger.error("AARON_DEBUG: Final response stringified: " + JSON.stringify(response));
          return response
        } else {
            logger.error("AARON_DEBUG: No results found, returning false");
            return false
        }
    } catch (error) {
        logger.error("AARON_DEBUG: EXCEPTION caught in getUserRequestByRequestedUserAccountIdAndStatus");
        logger.error("AARON_DEBUG: Exception type: " + typeof error);
        logger.error("AARON_DEBUG: Exception stringified: " + JSON.stringify(error));
        logger.error("AARON_DEBUG: Exception message: " + (error.message || 'No message'));
        logger.error("AARON_DEBUG: Exception stack: " + (error.stack || 'No stack'));
        
        if (error.javaException) {
            logger.error("AARON_DEBUG: Java exception found");
            logger.error("AARON_DEBUG: Java exception type: " + error.javaException.class);
            logger.error("AARON_DEBUG: Java exception message: " + error.javaException.message);
            if (error.javaException.cause) {
                logger.error("AARON_DEBUG: Java exception cause: " + error.javaException.cause.message);
                logger.error("AARON_DEBUG: Java exception cause localized: " + error.javaException.cause.localizedMessage);
            }
        }
        
        throw { code: 500, message: "Query failed: " + (error.message || JSON.stringify(error)) };
    }
}


/**
* @name <patchUserPrerequisite>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function patchUserPrerequisite(apiRequestPayload) {
  logger.error("Inside patchUserPrerequisite")
  let funcName = "patchUserPrerequisite"
  currentTimeinEpoch = Date.now();
  const currentDate = new Date().toISOString();
  logger.error("Current time in Epoch - "+ currentTimeinEpoch)
  logger.error("Current Date - "+ currentDate)
  let jsonArray = []
  let jsonObj = null
  let values = null

  try {
          
        jsonObj = {
          "operation":"replace",
          "field":"status",
          "value":"COMPLETED"
        }
        jsonArray.push(jsonObj)
    
         jsonObj = {
          "operation":"replace",
          "field":"updateDateEpoch",
          "value":Number(Date.now())
        }
         jsonArray.push(jsonObj)
    
         jsonObj = {
          "operation":"replace",
          "field":"updateDate",
          "value": new Date().toISOString()
        }
        jsonArray.push(jsonObj)
    
        jsonObj = {
          "operation":"replace",
          "field":"completionDateEpoch",
          "value":Number(Date.now())
        }
         jsonArray.push(jsonObj)
    
         jsonObj = {
          "operation":"replace",
          "field":"completionDate",
          "value": new Date().toISOString()
        }
        jsonArray.push(jsonObj)
    
        jsonObj = {
          "operation":"replace",
          "field":"updatedBy",
          "value": apiRequestPayload.requestedUserAccountId //**Pending: Compute Logic based human readable format later from alpha_user
        }
        jsonArray.push(jsonObj)
    
        /*jsonObj = {
          "operation":"replace",
          "field":"expiryDate",
          "value": expiryDate.expiryDate
        }
         jsonArray.push(jsonObj)
    
         jsonObj = {
          "operation":"replace",
          "field":"expiryDateEpoch",
          "value": Number(expiryDate.expiryEpoch)
        }
         jsonArray.push(jsonObj)*/
    
        logger.error("UserPrerequisite jsonArray to patch - "+ JSON.stringify(jsonArray))
    
        openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + apiRequestPayload.userPrereqId, null, jsonArray);
    
        return {
          "status":"success",
          "message":"success"
        }
  
    } catch (error) {
      //Return error response
        logger.error("Exception in "+funcName+" is - " + getException(error))
        let detail = requestDetail()
        detail.functionName = funcName
        detail.exception = getException(error)
        throw { code: 500, message: 'Exception in '+funcName, detail: detail}
    } 
}


/**
* @name <getException>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getException(e) {
  let _ = require('lib/lodash');
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



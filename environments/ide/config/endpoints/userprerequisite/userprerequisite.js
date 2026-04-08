
const requestDetail = () => {
  let detail = {}
  detail.timestamp = context.requestAudit.receivedTime
  detail.transactionId = context.transactionId.id
  detail.endpoint = context.parent.matchedUri
  return detail
}

(function () {

  const validateEndptRequestBody = {
      "payload": context,
      "action": 0
  }

  try {
      let res = openidm.create("endpoint/validate-endpt-access", null, validateEndptRequestBody)
      logger.error("Validate endpoint authorization response => "+JSON.stringify(res))
      if(res.status === 200){
        logger.error("Continue executing endpoint...")
      } else {
        return res
      }
  } catch (error) {
      logger.error("Exception caught => " + getException(error))
      return {"status":500, "message":error}
  }
  
  const authenticatedUserId = context.current.parent.parent.parent.parent.parent.rawInfo.sub
  const authorizedRole = context.current.parent.parent.parent.parent.authorization.roles
  const payload = request.content.payload
  const action = request.content.action
  var status = payload.status;
  var returnParams = payload.returnParams;
  var requestedUserAccountId = payload.requestedUserAccountId

  if (request.method === 'create') {
    // POST
    // if ((authenticatedUserId !== requestedUserAccountId)) {
    //     throw { code: 403, message: 'You are not authorized' }
    // }

    if (request.content) {
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
        if (authenticatedUserId !== requestedUserAccountId && !authorizedRole.includes("tenant-admins")) {
          throw { code: 401, message: 'Unauthorized' }
        }

        try {
          return patchUserPrerequisite(payload)
        } catch (error) {
          logger.error("Exception is - " + getException(error))
          throw error
        }

      } else {
        throw { code: 500, message: 'Unknown_Action' }
      }

    } else {
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
function getUserRequestByRequestedUserAccountIdAndStatus(requestedUserAccountId, status, returnParams) {
  
  var resp = null
  try {
   if (status == "*" || status == null) {
      var response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", 
                                  { "_queryFilter": '/requestedUserAccountId/ eq "' + requestedUserAccountId + 
                                  '" AND (status eq "COMPLETED" or status eq "EXPIRED" or status eq "2" or status eq "3") AND (recordState eq "ACTIVE" or recordState eq "0") ' }, 
                                  returnParams);
    } else {
      var response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/",
                                  { "_queryFilter": '/requestedUserAccountId/ eq "' + requestedUserAccountId + '"' + 
                                  ' AND status eq "' + status + '" AND (recordState eq "ACTIVE" or recordState eq "0")' }, returnParams);
    }
    resp = response
    logger.error("alpha_kyid_enrollment_user_prerequisites response is - " + JSON.stringify(response))
    
    if (response.resultCount > 0) {
      logger.error("alpha_kyid_enrollment_user_prerequisites response 2 is - " + JSON.stringify(response))
      var userPrereqList = response.result;
      var prereqIDs = []
      var usrPrereqRecord = []
      var finalResult = []
      
      for (var i = 0; i < userPrereqList.length; i++) {
           
       //Fix 201545# To display unique user prerequisite records only - Rajat 11/11 ---Start
        // Checking if PrereqID and PrereqType Present -- Narendra 1/9/2025 - Defect No:- 210676
       if(userPrereqList[i].preRequisiteId){
         if(!prereqIDs.includes(userPrereqList[i].preRequisiteId._refResourceId)){
           prereqIDs.push(userPrereqList[i].preRequisiteId._refResourceId)
           usrPrereqRecord.push(userPrereqList[i])
         }
          //---End

       }
        else{
         usrPrereqRecord.push(userPrereqList[i])
        }

        /*if(userPrereqList[i].preRequisiteId && userPrereqList[i].preRequisiteTypeId){
           logger.error("PreRequisiteId and PrereqTypeId found =>"+userPrereqList[i])
           finalResult.push(userPrereqList[i])
         } else {
           logger.error("PreRequisiteId and PrereqTypeId notfound")
         }*/


        logger.error("alpha_kyid_enrollment_user_prerequisites userPrereqList" + JSON.stringify(userPrereqList[i]));

        if (userPrereqList[i].preRequisiteId != null) {

          var preRequisiteId = userPrereqList[i].preRequisiteId._refResourceId;

          var preRequisiteResponse = openidm.read("managed/alpha_kyid_enrollment_prerequisite/" + preRequisiteId);
          logger.error("alpha_kyid_enrollment_prerequisite response is - " + JSON.stringify(preRequisiteResponse))
          if (!preRequisiteResponse) {
            logger.error("Prerequisite not found for id: " + preRequisiteId);
            return { error: "Prerequisite not found for id: " + preRequisiteId };
          } else {
            userPrereqList[i].preRequisiteId = preRequisiteResponse;
            logger.error("response after updating userPrereqList is - " + JSON.stringify(userPrereqList))
          }
        }else {
          
           logger.error("Prerequisite ID was null");
           userPrereqList[i].preRequisiteId =  {
            "_refResourceId" : "",
            "_id" :"",
            "displayDescription": {
                    "en": "",
                    "es": ""
                },
            "displayName": {
                    "en": "",
                    "es": ""
                }

           }
           userPrereqList[i].preRequisiteTypeId =  {
            "_refResourceId" : ""
           }
        }
      }

      logger.error("getUserRequestByRequestedUserAccountIdAndStatus response is - " + JSON.stringify(response))
       //Fix 201545# To display unique user prerequisite records only - Rajat 11/11 ---Start
      if(usrPrereqRecord.length>0){
        resp.result = usrPrereqRecord
        //resp.result = finalResult
      }
      return resp
      // ---End
      
     // return response
    } else {
      // return false
      return {
        "_id": "",
        "pagedResultsCookie": null,
        "totalPagedResultsPolicy": "NONE",
        "totalPagedResults": -1,
        "resultCount": 0,
        "result": [
        ]
      };
    }
  } catch (error) {
    logger.error("getUserRequestByRequestedUserAccountIdAndStatus error is - " + JSON.stringify(error))
    throw { code: 500, message: error };
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
  logger.error("Current time in Epoch - " + currentTimeinEpoch)
  logger.error("Current Date - " + currentDate)
  let jsonArray = []
  let jsonObj = null
  let values = null

  try {

    jsonObj = {
      "operation": "replace",
      "field": "status",
      "value": "COMPLETED"
    }
    jsonArray.push(jsonObj)

    jsonObj = {
      "operation": "replace",
      "field": "updateDateEpoch",
      "value": Number(Date.now())
    }
    jsonArray.push(jsonObj)

    jsonObj = {
      "operation": "replace",
      "field": "updateDate",
      "value": new Date().toISOString()
    }
    jsonArray.push(jsonObj)

    jsonObj = {
      "operation": "replace",
      "field": "completionDateEpoch",
      "value": Number(Date.now())
    }
    jsonArray.push(jsonObj)

    jsonObj = {
      "operation": "replace",
      "field": "completionDate",
      "value": new Date().toISOString()
    }
    jsonArray.push(jsonObj)

    jsonObj = {
      "operation": "replace",
      "field": "updatedBy",
      "value": "KYID-System" //**Pending: Compute Logic based human readable format later from alpha_user
    }
    jsonArray.push(jsonObj)

    jsonObj = {
            "operation": "replace",
            "field": "updatedByID",
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

    logger.error("UserPrerequisite jsonArray to patch - " + JSON.stringify(jsonArray))

    openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + apiRequestPayload.userPrereqId, null, jsonArray);

    return {
      "status": "success",
      "message": "success"
    }

  } catch (error) {
    //Return error response
    logger.error("Exception in " + funcName + " is - " + getException(error))
    let detail = requestDetail()
    detail.functionName = funcName
    detail.exception = getException(error)
    throw { code: 500, message: 'Exception in ' + funcName, detail: detail }
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

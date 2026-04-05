  (function () {
    if (request.method === 'create') {
      // POST
      return {};
    } else if (request.method === 'read') {
      // GET
      const response = proccessPendingEnrollments()
      logger.error("*** Endpoint Name: provisionPendingEnrollments Pending Enrollment Batch Report --> *** "+ JSON.stringify(response))
      return response
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

function searchMO(MO_NAME, queryFilter, requiredProperties) {
    try {

        const searchResponse = openidm.query("managed/"+MO_NAME,queryFilter, requiredProperties);
        if (searchResponse && searchResponse.resultCount > 0) {
            return searchResponse.result
        }
        else {
            return null
        }

    } catch (error) {
        throw error
    }

}

function getRecordCount(MOName,query) {
  try {
    const response = openidm.query("managed/"+MOName, {
      
        "_queryFilter": query,"_countOnly":true,"totalPagedResultsPolicy":"EXACT"
    }, ["*"])

    if(response && response.resultCount){
      return response.resultCount
      
      
    }

  } catch (error) {
    logger.error("Endpoint Name: provisionPendingEnrollments : Exception Occurred in getRecordCount Function "+error)
    throw error
  }
  
}

function invokeRoleAccess(invitedUserId, requestId) {
    try {
        const requestBody = {
            "payload": {
                "requestedUserAccountId": invitedUserId,
                "enrollmentRequestId": requestId
            },
            "action": "1"
        };
 
        logger.error(" Endpoint Name: provisionPendingEnrollments invokeRoleAccess request body: " + JSON.stringify(requestBody));
 
        //const response = openidm.create("endpoint/access_v2B", null, requestBody);
        const response = openidm.create("endpoint/access", null, requestBody);
        logger.error("Endpoint Name: provisionPendingEnrollments invokeRoleAccess raw response: " + JSON.stringify(response));
 
       if (response && response.status) {
            if (response.status === "success") {
                logger.error("Endpoint Name: provisionPendingEnrollments invokeRoleAccess SUCCESS: " + JSON.stringify(response));
              return response;
            } else {
                logger.error("Endpoint Name: provisionPendingEnrollments invokeRoleAccess FAILED: " + JSON.stringify(response));
              return { status: "failed", rawResponse: response };
            }
        } else {
            logger.error("Endpoint Name: provisionPendingEnrollments invokeRoleAccess EMPTY or invalid response.");
         return { status: "error", rawResponse: response };
        }
 
        // Always return response, even if it's empty or failed
        //return response || {};
    } catch (error) {
        logger.error("Endpoint Name: provisionPendingEnrollments invokeRoleAccess ERROR: " + JSON.stringify(error));
        // just return error object
        //return { error: error };
      return { status: "error", error: error };
    }
}

function proccessPendingEnrollments(){
    try {
      const enrollmentMoName = "alpha_kyid_enrollment_request"
      const userPrereqMOName = "alpha_kyid_enrollment_user_prerequisites"
      const enrollmentCountQuery = ` (status eq 'IN_PROGRESS') AND (recordState eq '0' or recordState eq 'ACTIVE')`
      const enrollmentRecordCount = getRecordCount(enrollmentMoName,enrollmentCountQuery)
      let enrollmentResponseQuery = null
      let userPrereqQuery = null
      let proccessedEnrollmentId = []
      let eligibleEnrollmentPrereq = []
      let provisionRoleResponse = null
      let pendingEnrollmentRequest = []
      let userPrereqResponse = []
      let enrollmentRequest = []
      let unProccessedEnrollmentIds = []
      const pageSize = 50 // need to add this in ESV
      let pageNumber = 0
      let interrationCount = 0
      let totalIterration = Math.ceil(enrollmentRecordCount/pageSize)
      // let totalIterration = 1
      if(enrollmentRecordCount && enrollmentRecordCount > 0){
      for (let i = 0; i < totalIterration; i++) {
        interrationCount ++
        pagedResultsOffset = i * pageSize
        // enrollmentResponseQuery = {"_queryFilter":`(status eq 'IN_PROGRESS') AND (recordState eq '0' or recordState eq 'ACTIVE')`,"_pageSize":pageSize,"pagedResultsOffset":pagedResultsOffset,"_totalPagedResultsPolicy":"EXACT","_sortKeys":"pingRequestId"}
        enrollmentResponseQuery = {
          "_queryFilter": '/status/ eq "IN_PROGRESS"  AND (recordState eq "ACTIVE" OR recordState eq "0")',
          // "_queryFilter": '/status/ eq "IN_PROGRESS" AND _id eq "b4ae6e91-5602-4533-bf24-96bd68a819fe" AND (recordState eq "ACTIVE" OR recordState eq "0")',
          "_pageSize": pageSize,
          "_totalPagedResultsPolicy": "EXACT",
          "_pagedResultsOffset": pagedResultsOffset
        }
        enrollmentRequest = searchMO(enrollmentMoName, enrollmentResponseQuery, ["*"])
        if(enrollmentRequest){
        
          enrollmentRequest.forEach(value=>{
            
            if(value._id && value.requestedUserId){
              // userPrereqQuery = {"_queryFilter":`enrollmentRequestId eq '${value._id}' AND !(status eq 'COMPLETED' OR status eq '2') AND (recordState eq '0' or recordState eq 'ACTIVE')`}
              userPrereqQuery = {"_queryFilter":`enrollmentRequestId eq '${value._id}' AND !(status eq 'COMPLETED' OR status eq '2' OR status eq 'ALREADY_COMPLETED' OR status eq '2') `}
              userPrereqResponse = searchMO(userPrereqMOName, userPrereqQuery, ["preRequisiteTypeId/*","preRequisiteId/*","*"])
              // return userPrereqResponse
              if(userPrereqResponse == null){
                eligibleEnrollmentPrereq.push(value._id)
                provisionRoleResponse = invokeRoleAccess(value.requestedUserId, value._id)
                if((provisionRoleResponse && provisionRoleResponse.status && provisionRoleResponse.status === "success")){
                  proccessedEnrollmentId.push(value._id)
                }
                else{
                    unProccessedEnrollmentIds.push(value._id)
                }
              }
              else{
                // Date: 11/12/2025 :Narendra :- Added this logic to mark Prereq as completed for the reuse condtion 
                let userPrereqCompletedIds = []
                userPrereqResponse.forEach(val => {
                  if ((val && val.preRequisiteId && val.preRequisiteTypeId && val.preRequisiteTypeId._id && val.preRequisiteId.enrollmentActionSettings && val.preRequisiteId.enrollmentActionSettings.allowReuse === true) && (val.recordState === "ACTIVE" || val.recordState === "0")) {
                    let completedUserPrereq = getCompletedPrereq(val.requestedUserAccountId, val.preRequisiteId._id, val.preRequisiteTypeId._id)
                    if(completedUserPrereq){
                      let expiryDateEpoch = completedUserPrereq.expiryDateEpoch || null
                      let expiryDate = completedUserPrereq.expiryDate || null
                      let completionDateEpoch = completedUserPrereq.completionDateEpoch || null
                      let completionDate = completedUserPrereq.completionDate 
                      let allowReuseIfDaysOld = val.preRequisiteId.enrollmentActionSettings.allowReuseIfDaysOld || "0"
                      let prereqReuse = isPrereqReusable(allowReuseIfDaysOld, completionDateEpoch)
                        if (prereqReuse === true) {
                          let patchResponse = patchUserPrerequisites(val._id, "ALREADY_COMPLETED",completionDateEpoch,completionDate,expiryDateEpoch,expiryDate)
                          if (patchResponse) {
                            userPrereqCompletedIds.push(patchResponse._id)
                            }
                          }
                      
                    }

                      }
                    })
                logger.error("userPrereqResponse Count --> "+ userPrereqResponse.length)
                logger.error("userPrereqCompletedIds Count --> "+ userPrereqCompletedIds.length)
                
                if (userPrereqResponse.length === userPrereqCompletedIds.length) {
                  eligibleEnrollmentPrereq.push(value._id)
                  provisionRoleResponse = invokeRoleAccess(value.requestedUserId, value._id)
                  if((provisionRoleResponse && provisionRoleResponse.status && provisionRoleResponse.status === "success")){
                    proccessedEnrollmentId.push(value._id)
                  }
                  else{
                      unProccessedEnrollmentIds.push(value._id)
                  }
                  
                }
                else{
                  pendingEnrollmentRequest.push(value._id)
                }
                
                
                
              }
              
            }
            else{
              logger.error("Endpoint Name: provisionPendingEnrollments requestedUserId Not Present for Enrollmentrequest Id: "+ value._id)
              unProccessedEnrollmentIds.push(value._id)
            }
          })
        }
               
      }
        
        
      }
     const outcome = {
       "result":{
       "interrationCount":interrationCount,
       "eligibleEnrollmentRequest":eligibleEnrollmentPrereq.length,
       "eligibleEnrollmentRequestIds":eligibleEnrollmentPrereq,
       "enrollmentRequestWithActivePrereq":pendingEnrollmentRequest.length,
       "enrollmentRequestWithActivePrereqIds":pendingEnrollmentRequest,
       "processedEnrollmentRequest":proccessedEnrollmentId.length,
       "processedEnrollmentRequestIds":proccessedEnrollmentId,
       "unProceesedEnrollmentRequest":unProccessedEnrollmentIds.length,
       "unProceesedEnrollmentRequestIds":unProccessedEnrollmentIds, 
       "totalEnrollmentRequest":enrollmentRecordCount
       }
         }

     return outcome
        
    } catch (error) {
      logger.error("Endpoint Name: provisionPendingEnrollments Error Occurred while Excuting proccessPendingEnrollments -> "+ error)
      throw error
       
    }
    
}

function patchUserPrerequisites(id, status,completionDateEpoch,completionDate,expiryDate,expiryDateEpoch) {

    try {
        const MO_NAME = "alpha_kyid_enrollment_user_prerequisites"
        const jsonArray = [{
            "operation": "replace",
            "field": "status",
            "value": status

        },
        {
            "operation": "replace",
            "field": "completionDate",
            "value": completionDate || new Date().toISOString()

        },
        {
            "operation": "replace",
            "field": "completionDateEpoch",
            "value": completionDateEpoch || Date.now()

        },
        {
            "operation": "replace",
            "field": "updateDate",
            "value": new Date().toISOString()

        },
        {
            "operation": "replace",
            "field": "updateDateEpoch",
            "value": Date.now()

        },
        {
            "operation": "replace",
            "field": "updatedBy",
            "value": "KYID-System"

        },
        {
            "operation": "replace",
            "field": "updatedByID",
            "value": "KYID-System"

        }
        ]
        if(expiryDateEpoch){
          jsonArray.push({"operation":"replace","field":"expiryDate","value":expiryDate})
        }
        if(expiryDate){
          jsonArray.push({"operation":"replace","field":"expiryDateEpoch","value":v})
        }
        var startTime = new Date();
        const response = openidm.patch("managed/" + MO_NAME + "/" + id, null, jsonArray)
        var endTime = new Date();
        var duration = endTime - startTime;
        var durationInSeconds = duration / 1000;
        logger.error("Endpoint Name: provisionPendingEnrollments Performance time patchUserPrerequisites: " + durationInSeconds);
        if (response) {
            return response
        }
      else{
        return null
      }




    } catch (error) {
        logger.error("Endpoint Name: provisionPendingEnrollments Error Occurred While Patching User Prerequisite" + error)
      return null

    }

}

function getCompletedPrereq(userId, prereqId, prereqTypeId) {
    try {
        logger.error("Endpoint Name: provisionPendingEnrollments Inside getCompletedPrereq ")
        if (prereqId) {
            let reqestBody = {
                "payload": {
                    "userId": userId,
                    "prereqId": prereqId,
                    "prereqTypeId": prereqTypeId,
                },
                "action": 2
            }
            var startTime = new Date();
            const response = openidm.create("endpoint/UserPrerequisiteAPI", null, reqestBody);
            var endTime = new Date();
            var duration = endTime - startTime;
            var durationInSeconds = duration / 1000;
            logger.error("Performance time enrollment: " + durationInSeconds);
            if (response && response !== null && response.resultCount > 0) {
                logger.error("Endpoint Name: provisionPendingEnrollments getCompletedPrereq -- response  is" + JSON.stringify(response))
              var result = response.result.reduce((latest, item) => {
                  const epoch = Number(item.completionDateEpoch) || 0;
                  const latestEpoch = Number(latest.completionDateEpoch) || 0;
                  return epoch > latestEpoch ? item : latest;
              });
              if(result){
                return result
              }
              else{
                return null
              }
                  // Date 11/12/2025- Narendra :- END
              
                // return response // Commented Previous Code
            }
            else {
                return null
            }
        }
    } catch (error) {
        logger.error("Endpoint Name: provisionPendingEnrollments Error Occurred while getCompletedPrereq " + error)
        return null

    }

}

function isPrereqReusable(allowReuseIfDaysOld, completionDateEpoch) {
    try {
      if(allowReuseIfDaysOld && Number(allowReuseIfDaysOld) > 0){
          const addedTimeinSec = Number(allowReuseIfDaysOld) * 24 * 60 * 60 * 1000
          const finalDateEpoch = completionDateEpoch + addedTimeinSec
          const currentTimeinEpoch = Date.now()
          if (currentTimeinEpoch > finalDateEpoch) {
              return false
          }
          else {
              return true
          }
        
      }
      else{
        return false
      }



    } catch (error) {
        logger.error("Endpoint Name: provisionPendingEnrollments Error Occurred isPrereqReusable function " + error)
        return false

    }
}
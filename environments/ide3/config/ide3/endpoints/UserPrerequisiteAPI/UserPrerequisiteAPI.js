/**
 * @name [@endpointname]
 * @description [@description]
 *
 * @param {request} request - This is the request object contains the following
 * resourceName - The name of the resource, without the endpoint/ prefix.
 * newResourceId - The identifier of the new object, available as the results of a create request.
 * revision - The revision of the object.
 * parameters - Any additional parameters provided in the request. 
 * content - Content based on the latest revision of the object, using getobject.
 * context - The context of the request, including headers and security. For more information, refer to Request context chain.
 * Paging parameters - The pagedResultsCookie, pagedResultsOffset, and pageSize parameters are specific to query methods. 
 * Query parameters - The queryId and queryFilter parameters are specific to query methods. 
 *
 * @date [@date]
 * @author {<authorname>@deloitte.com}
 */

const currentTimeinEpoch = Date.now();
const currentDate = new Date().toISOString();
const isEndpointExecutionAllowed = identityServer.getProperty("esv.journey.execution.flag")
const requestDetail = ()=>{
  let detail = {
    timestamp:"",
    transactionId:"",
    endpoint: ""
  }
  if(context!=null){
    if(context.requestAudit.receivedTime && context.requestAudit.receivedTime!=null){
      detail.timestamp = context.requestAudit.receivedTime 
    } 
    if(context.transactionId.id && context.transactionId.id!=null){
      detail.transactionId = context.transactionId.id
    } 
    if(context.parent.matchedUri && context.parent.matchedUri!=null){
      detail.endpoint = context.parent.matchedUri
    } 
  }
  
  return detail
}


function logErrorDetails(code, message, detail) {

    let errorJSONResponse = {}
    errorJSONResponse["code"] = code
    errorJSONResponse["message"] = message
    errorJSONResponse["detail"] = detail

    return errorJSONResponse
}


(function() {

    if (isEndpointExecutionAllowed === "true") {
        if (request.method === 'create') {

            // POST
            let response = {}
            let payload = request.content.payload;
            let enrollmentRequestId = payload.enrollmentRequestId
            let action = request.content.action
            if (action === 0) {
                response = getUserPrereqUsingEnrollmentRequest(action, enrollmentRequestId);
            } else if (action === 2) { //Get
                if (request.content.payload.id) {
                    response = getUserPrereqById(request.content.payload.id);
                } else if (request.content.payload.userId && request.content.payload.prereqId && request.content.payload.prereqTypeId) {
                    response = getActivePrerequiste(payload)
                } else {
                    response = getUserPrereq(payload)
                    if (!response && response == null) {
                        throw {
                            code: 404,
                            message: 'Prerequisite Not found'
                        };
                    }

                }
            } else if (action === 1) {
                payload = request.content.payload.userPrereqPayload
                response = createUserPrerequisite(payload)
            } else if (action === 3) {
                // let payload = request.content.payload;
                logger.error("Request Content is --> " + JSON.stringify(request.content));
                let status = request.content.payload.status;
                let userId = request.content.payload.userId;
                let enrollmentReqId = request.content.payload.enrollmentRequestId;
                // let action = request.content.action;      
                logger.error("status: " + status + "" + "userId:" + userId + "enrollmentReqId:" + enrollmentReqId)
                let response = cancelUserPrerequisite(status, userId, enrollmentReqId)
                if (response) {
                    return response
                } else {
                    throw {
                        code: 500,
                        message: 'Unknown error'
                    }
                }
            } else if (action === 4) {

                let status = null
                let response = {
                  result:null
                }
                let resultCount = 0
                let pageSize = 50
                let tot_Iteration = 0
                let pagedResultsOffset = null
                let resultUsrPrereqRecord = {}
                let resultProcessUsrPrereqRecord = {}
                let resultUsrPrereqArr = []
                let responseUsrPrereq = null
                let payload = request.content.payload
                logger.error("payload  - "+JSON.stringify(payload))
                if(payload.status && payload.status!=null){
                  status = payload.status
                }
                logger.error("status  - "+status)

                if(status==null){
                   try {
                     //To return the exact total count without sending the actual objects in the response
                     responseUsrPrereq = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", 
                                                  {"_queryFilter": '/status/ eq "COMPLETED" AND expiryDateEpoch pr AND (recordState eq "ACTIVE" OR recordState eq "0")',
                                                   "_countOnly":true},["*"])
                     logger.error("responseUsrPrereq value - "+JSON.stringify(responseUsrPrereq))
                     logger.error("Total UserPrerequsites Record: "+responseUsrPrereq.resultCount)
                     resultCount = responseUsrPrereq.resultCount

                   } catch (error) {
                      logger.error("Error Occurred while querying UserPrerequsites Record: " + error);
                      return {
                          code: 400,
                          message: "Error Occurred while querying UserPrerequsites Record: " + error
                      }
                   }

                  if(resultCount>0) {
                    tot_Iteration = resultCount/pageSize
                    
                    for(let index=0;index<=tot_Iteration;index++){
                      resultUsrPrereqRecord = {}
                      resultProcessUsrPrereqRecord = {}
                      resultUsrPrereqRecord = getUsrPrereqRecordInBatch(index,pageSize)
                      if(resultUsrPrereqRecord!=null){
                        if(!(resultUsrPrereqRecord.code && resultUsrPrereqRecord.code == 400)){
                           resultProcessUsrPrereqRecord = processUsrPrereqRecord(resultUsrPrereqRecord)
                           if(!(resultProcessUsrPrereqRecord.code && resultProcessUsrPrereqRecord.code == 400)){
                              logger.error("Adding processed UserPrereqRecord - "+JSON.stringify(resultProcessUsrPrereqRecord))
                              resultUsrPrereqArr.push(resultProcessUsrPrereqRecord)
                            } else {
                              throw resultProcessUsrPrereqRecord
                            }
                        } else {
                          throw resultUsrPrereqRecord
                        }
                      } 
                    }
                    
                  } else {
                    logger.error("No Records found in system for UserPrerequsites")
                  }

                  logger.error("resultUsrPrereqArr value - "+JSON.stringify(resultUsrPrereqArr))
                  response.result = JSON.stringify(resultUsrPrereqArr)
                  return response
                  
                } else {
                    //let status = request.content.payload.status
                  
                    try {
                      responseUsrPrereq = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                          "_queryFilter": '/status/ eq "' + status + '"'},["*"])
                    } catch (error) {
                        logger.error("Error Occurred while Search User Prerequsites by status: " + error);
                        return {
                            code: 400,
                            message: " Error Occurred while Search User Prerequsites by status: " + error
                        }
                    }
    
                    if (responseUsrPrereq.resultCount>0) {
                        return responseUsrPrereq
                    } else {
                        throw {
                            code: 500,
                            message: 'Unknown error'
                        }
                    }
                }                          
            }

            return response
          
        } else if (request.method === 'read') {
            // GET
            let params = request.additionalParameters;
            let paramKeys = Object.keys(params);
            let allowedParamsGetPrereqSummary = ["requestedUserAccountId", "enrollmentRequestId", "id"];
            let userId = request.additionalParameters.requestedUserAccountId;
            let enrollmentReqId = request.additionalParameters.enrollmentRequestId;
            let userPrerequisiteId = request.additionalParameters.id;
            

            if (userPrerequisiteId != null) {
                let response = getUserPrereqById(userPrerequisiteId);

                if (response.resultCount > 0) {
                    return response
                } else {
                    return false
                }

            } else if (allowedParamsGetPrereqSummary.sort().toString() === paramKeys.sort().toString()) {
                if (!(userId !== null && userId !== "")) {
                    throw {
                        code: 400,
                        message: 'UserID cannot be blank or null'
                    }
                } else if (!(enrollmentReqId !== null && enrollmentReqId !== "")) {
                    throw {
                        code: 400,
                        message: 'enrollmentRequestId ID cannot be blank or null'
                    }
                } else {
                    let apiRequestPayload = {
                        requestedUserAccountId: userId,
                        enrollmentRequestId: enrollmentReqId,
                        preReqId: null
                    }
                    response = getUserPrereq(apiRequestPayload)
                    if (response) {
                        return response
                    } else {
                        throw {
                            code: 404,
                            message: 'Prerequisite Not found '
                        };
                    }

                }
            } else {
                throw {
                    code: 400,
                    message: 'invalid params'
                }
            }


        } else if (request.method === 'update') {
            // PUT
            return {};
        } else if (request.method === 'patch') {

            let payload = request.content.payload;
            let status = request.content.status;
            let userId = request.content.userId;
            let enrollmentReqId = request.content.enrollmentRequestId;
            let action = request.content.action;
            let response = cancelUserPrerequisite(status, userId, enrollmentReqId)
            if (response) {
                return response
            } else {
                throw {
                    code: 500,
                    message: 'Unknown error'
                }
            }

        } else if (request.method === 'delete') {
            return {};
        }
        throw {
            code: 500,
            message: 'Unknown error'
        }

    } else {
        logger.error("Endpoint UserPrerequisiteAPI execution is not allowed")
        return logErrorDetails(-1, 'Endpoint_Execution_Not_Allowed', '')
    }
}());


/**
* @name <getUsrPrereqRecordInBatch>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUsrPrereqRecordInBatch(index,pageSize){

  let responseUsrPrereq = null
  let pagedResultsOffset = pageSize*index
  logger.error("pagedResultsOffset value - "+pagedResultsOffset)
  
  try {
     //Get all 'ACTIVE' userprerequisite records with expiry date set and 'COMPLETED' status as per defined page size and offset in a batch
      responseUsrPrereq = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", 
                                        {"_queryFilter": '/status/ eq "COMPLETED" AND expiryDateEpoch pr AND (recordState eq "ACTIVE" OR recordState eq "0")',
                                        "_pageSize": pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": pagedResultsOffset},["*","preRequisiteId/*"])
    
      logger.error("UserPrerequisite record for batch "+index+" is - "+JSON.stringify(responseUsrPrereq))
    
      if(responseUsrPrereq.resultCount>0){
        return responseUsrPrereq
      } else {
        logger.error("No UserPrerequsites Record found in system for batch - "+index) 
        return null
      }
    
    } catch (error) {
      logger.error("Error Occurred while querying UserPrerequsites Record: " + error);
      return {
          code: 400,
          message: " Error Occurred while querying UserPrerequsites Record: " + error
      }
   }   
}


/**
* @name <processUsrPrereqRecord>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function processUsrPrereqRecord(record){

   if(record.resultCount>0) {
       try {
         logger.error("record to process value =>"+JSON.stringify(record))
         return evalRecord(record.result)
        } catch (error) {
          logger.error("Error Occurred while processing UserPrerequsites Record: " + error);
          return {
              code: 400,
              message: " Error Occurred while processing UserPrerequsites Record: " + error
          }
       }
    }     
}


/**
* @name <evalRecord>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function evalRecord(responseUsrPrereq){
  logger.error("Inside evalRecord")
  let notifyTimeframeInDays = 15
  let currentTimeinEpoch = Date.now();
  let recordExpiryDateInEpoch = null
  let userProfileResponse = null
  let email = null
  let usrList = []
  let expList = []
  let activeList = []
  let sendReminderSuccess = []
  let sendReminderFail = []
  let sendReminderJSON = {
    "email":null
    //"error":null
  }
  let accessRemovalSuccess= []
  let accessRemovalFail= []
  let accessRemovalJSON = {
    "email":null
    //"error":null
  }
  let result = {}
  let accessReqPayload = {
    "payload": {
        "queryFilter": null,
        "id":null,
        "confirmation":{
            "reason":"Remove role access",
            "comment":"This access is deleted as user prerequisite is expired."
        }
    },
    "action": 3
  }
  let expiryDate = ""
  let currentDate = null
  let expireDate = null
  let timeDiff = null
  let daysDiff = null

  if(identityServer.getProperty("esv.prereq.expiry.notify")!=null && identityServer.getProperty("esv.prereq.expiry.notify")){
    notifyTimeframeInDays = identityServer.getProperty("esv.prereq.expiry.notify")
    logger.error("notifyTimeframeInDays => "+notifyTimeframeInDays)
  }
  
  responseUsrPrereq.forEach(usrPrereqRecord =>{
    currentDate = null
    expireDate = null
    timeDiff = null
    daysDiff = null
    recordExpiryDateInEpoch = null
    recordExpiryDateInEpoch = usrPrereqRecord.expiryDateEpoch
    logger.error("recordExpiryDateInEpoch - "+String(recordExpiryDateInEpoch))
    currentDate = new Date(currentTimeinEpoch)
    expireDate = new Date(recordExpiryDateInEpoch)
    timeDiff = expireDate.getTime() - currentDate.getTime()
    daysDiff = Math.floor(Math.abs(timeDiff) / (1000 * 60 * 60 * 24))
    logger.error("daysDiff - "+daysDiff);
    if(expireDate!=null && expireDate){
      logger.error("Prerequisite Expire Date Present")
      expiryDate = addDays(daysDiff)
      logger.error("Expiry Date value for Email => "+expiryDate)
    }
    userProfileResponse = getUserProfile(usrPrereqRecord.requestedUserAccountId)
      
    if(timeDiff>0 && daysDiff>0 && daysDiff<=notifyTimeframeInDays){  //Current record is within the timeframe of notification
        logger.error("Record is within timeframe")        
        usrList.push(usrPrereqRecord._id) 
        sendReminderJSON = {
          "email":null
        }
        if(userProfileResponse.code != 400){
          //Find user's email address
          email = userProfileResponse.mail
          let sendMailStatus = sendEmail(userProfileResponse,usrPrereqRecord,expiryDate)
          logger.error("sendMailStatus value - "+JSON.stringify(sendMailStatus))         
          if(sendMailStatus != null && sendMailStatus){
            if (sendMailStatus.code != 400){
                logger.error("Successfully sent email to user - "+usrPrereqRecord.requestedUserAccountId)
                sendReminderJSON.email = email
                if(!sendReminderSuccess.includes(sendReminderJSON))
                  sendReminderSuccess.push(sendReminderJSON)
            } else {
                logger.error("Failed to send email to user - "+usrPrereqRecord.requestedUserAccountId)
                sendReminderJSON.email = email
                //sendReminderJSON.error = sendMailStatus.message
                if(!sendReminderFail.includes(sendReminderJSON))
                  sendReminderFail.push(sendReminderJSON)
            }  
          }
        } else {
            sendReminderJSON.email = "NotFound"
            //sendReminderJSON.error = userProfileResponse.message
            if(!sendReminderFail.includes(sendReminderJSON))
              sendReminderFail.push(sendReminderJSON)
        }
      
       } else if(timeDiff<0) { //Check whether current record expiry date is less than today i.e. Expired record
           logger.error("Expired Record "+usrPrereqRecord)
           expList.push(usrPrereqRecord._id) 
           accessRemovalJSON = {
              "email":null
            }
      
           if(userProfileResponse.code != 400 && usrPrereqRecord.enrollmentRequestId!=null){
             //Find user's email address
             email = userProfileResponse.mail
             accessReqPayload.payload.queryFilter = "enrollmentRequestId in '[\""+usrPrereqRecord.enrollmentRequestId+"\"]' AND (recordState eq \"0\" or recordState eq 'ACTIVE')"
             accessReqPayload.payload.id = usrPrereqRecord.requesterUserAccountId
             logger.error("Role Removal Access Request Payload - "+JSON.stringify(accessReqPayload))
             
             //Invoke Role Removal Service
             let respDeleteOp = deleteAccess(accessReqPayload) 
             logger.error("respDeleteOp value - "+JSON.stringify(respDeleteOp))

             //If Role Removal Service errors out, log it & continue processing the records
             if(respDeleteOp.code == 400 || respDeleteOp.message.code != "KYID-SUS"){
                 logger.error("Failed to remove role access of user - "+usrPrereqRecord.requestedUserAccountId)
                 accessRemovalJSON.email = email
                 //accessRemovalJSON.error = respDeleteOp.message
                if(!accessRemovalFail.includes(accessRemovalJSON))
                   accessRemovalFail.push(accessRemovalJSON)
               
             } else {
               logger.error("Successfully removed role access of user - "+usrPrereqRecord.requestedUserAccountId)
               accessRemovalJSON.email = email
               if(!accessRemovalSuccess.includes(accessRemovalJSON))
                 accessRemovalSuccess.push(accessRemovalJSON)
               
               //If Role Removal service is successful, update userPrerequisite record as EXPIRED
               try {
                 logger.error("Patching record as EXPIRED - "+usrPrereqRecord._id)
                 patchUserPrerequisiteAsExpired(usrPrereqRecord._id)
               } catch(error){
                 logger.error("Exception encountered while updating prerequisite - " + getException(error))
                 throw logDebug("patchUserPrerequisiteAsExpired",null,error)
               }
             }
             
           } else {
             accessRemovalJSON.email = "NotFound"
             //accessRemovalJSON.error = userProfileResponse.message
             if(!accessRemovalFail.includes(accessRemovalJSON))
               accessRemovalFail.push(accessRemovalJSON)
           }
  
       } else {
          logger.error("Active Record "+usrPrereqRecord)
          activeList.push(usrPrereqRecord._id) 
       }
  
  })

    result.activeUserPrerequisite = activeList.length 
    result.expiredUserPrerequisite = expList.length
    result.aboutToExpireUserPrerequisite = usrList.length
    result.aboutToExpirePrerequisite_NotifyViaEmail_Success = {
      users: sendReminderSuccess,
      totalCount: sendReminderSuccess.length
    }
    result.aboutToExpirePrerequisite_NotifyViaEmail_Fail = {
      users: sendReminderFail,
      totalCount: sendReminderFail.length
    }
    result.expiredUserPrerequisite_AccessRemovalSuccess = {
      users: accessRemovalSuccess,
      totalCount: accessRemovalSuccess.length
    }
    result.expiredUserPrerequisite_AccessRemovalFail = {
      users: accessRemovalFail,
      totalCount: accessRemovalFail.length
    }
    logger.error("UserPrerequisiteAPI endpoint response after processing the records - "+JSON.stringify(result))
    return result
     
}


/**
* @name <addDays>
* @description <It adds number of days to current date to returns new date>

* @param (JSON} paramJSON
* @returns {JSON} Response Date.
*/
function addDays(days) {
    // Get the current date
    const todayDate = new Date();
    const newDate = new Date(todayDate);
    newDate.setDate(todayDate.getDate() + days);
    logger.error("New Date value - "+newDate)
    return getFormmatedDate(newDate)
}


/**
* @name <getFormmatedDate>
* @description <It returns date in dd/mm/yyyy format>

* @param (JSON} paramJSON
* @returns {JSON} Response String.
*/
function getFormmatedDate(newDate){
  // Extract day, month, and year
  let day = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  
  // Add leading zero to day and month if needed
  day = day < 10 ? '0' + day : day;
  month = month < 10 ? '0' + month : month;
  
  // Format the date as dd/mm/yyyy
  const formattedDate = `${day}/${month}/${year}`;
  return formattedDate
}



/**
* @name <getUserProfile>
* @description <It returns the ACTIVE user profile from the system>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserProfile(userID){

  let apiRequestPayload = {
    "requestedUserAccountId": null
  }
  let requestBody = {
    "payload":null,
    "action":2
  }
  
  if(userID!=null && userID){
      apiRequestPayload.requestedUserAccountId = userID
      requestBody.payload = apiRequestPayload
      
      try {
          return getUserAccount(requestBody) //Getting Requestee Profile Info
        
      } catch(error){
          logger.error("Exception in getUserProfile is encountered while retrieving user account details - " + getException(error))
          return {code: 400, message: error}
      }
   } else {
     return {code: 400, message: 'Account_NotExist'}
   }
}


/**
* @name <getUserAccount>
* @description <It returns the ACTIVE user profile from the system>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserAccount(requestBody){
  logger.error("Inside getUserAccount")
  let funcName = "getUserAccount"
  let userProfileResponse = null
  
  try{
    userProfileResponse = openidm.create("endpoint/LIB-UserProfileAPI", null, requestBody)
    
    if(userProfileResponse.user!=null && userProfileResponse){
      //logger.error("userProfileResponse in getUserAccount is - "+JSON.stringify(userProfileResponse))
      userProfileResponse = userProfileResponse.user.result[0]
      return userProfileResponse
      
    } else {
      logger.error("Account_InActive")
      return {code: 400, message: 'Account_InActive'}
    }
    
  } catch(error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      return {code: 400, message: error}
  }
}


/**
* @name <deleteAccess>
* @description <It is used to remove the access of the user whose prerequisite is expired>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function deleteAccess(requestBody){
  logger.error("Inside deleteAccess")
  let funcName = "deleteAccess"
  
  try{
     return openidm.create("endpoint/access_v2B", null, requestBody)
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    return logDebug(funcName,error,error)
  }
}


function getLangCode(code,languageMap) {
    var languageMap = JSON.parse(languageMap);
    return languageMap[code] || "en"
}

/**
* @name <sendEmail>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function sendEmail(userProfileResponse,usrPrereqRecord,expiryDate){
  let funcName = "sendEmail"
  let mail = userProfileResponse.mail
  let givenName = userProfileResponse.givenName
  let sn = userProfileResponse.sn
  let easternTimeStamp = isoToEastern()
  let prereqName = ""
  let appName = "KYID Helpdesk"
  let prereqApp = ""
  let prereqRole = ""
  let prereqDescription = ""
  let phoneContact = ""
  let emailContact = ""
  let prereqReverify = ""
  let getHelpdeskDetails = null;
  var locale = "en"
  var languageMap = identityServer.getProperty("esv.language.preference");

  try{ 
       if(usrPrereqRecord.preRequisiteId.displayName.en!=null && usrPrereqRecord.preRequisiteId.displayName.en){
         logger.error("Name of prerequisite is => "+usrPrereqRecord.preRequisiteId.displayName.en)
         prereqName = usrPrereqRecord.preRequisiteId.displayName.en
       } 

       if(usrPrereqRecord.preRequisiteId.displayDescription.en!=null && usrPrereqRecord.preRequisiteId.displayDescription.en){
         logger.error("Description of prerequisite is => "+usrPrereqRecord.preRequisiteId.displayDescription.en)
         prereqDescription = usrPrereqRecord.preRequisiteId.displayDescription.en
       }  
       getHelpdeskDetails = openidm.query("managed/alpha_kyid_helpdeskcontact",{_queryFilter: 'name eq "' + appName + '"'},["phoneContact", "emailContact"])
    
       if(getHelpdeskDetails!=null && getHelpdeskDetails){
         if(getHelpdeskDetails.result[0].phoneContact[0].phoneNumber!=null){
           phoneContact = getHelpdeskDetails.result[0].phoneContact[0].phoneNumber
           logger.error("Helpdesk phone contact is => " +phoneContact)
         }
         if(getHelpdeskDetails.result[0].emailContact[0].emailAddress!=null){
           emailContact = getHelpdeskDetails.result[0].emailContact[0].emailAddress
           logger.error("Helpdesk email address is => " +emailContact)
         }
       }
       
    } catch(error){
        logger.error("Error in getting helpdesk details from alpha_kyid_helpdeskcontact => "+ error)
    } 

    if(usrPrereqRecord.roleContext!=null && usrPrereqRecord.roleContext){
      logger.error("RoleContext Present")
      if(usrPrereqRecord.roleContext[0].applicationId!=null && usrPrereqRecord.roleContext[0].applicationId){
        logger.error("App ID value => "+usrPrereqRecord.roleContext[0].applicationId)
        prereqApp =  getBusinessApp(usrPrereqRecord.roleContext[0].applicationId)
        logger.error("Application name => "+prereqApp)
      }
      
      if(usrPrereqRecord.roleContext[0].roleId!=null && usrPrereqRecord.roleContext[0].roleId){
        logger.error("Role ID value => "+usrPrereqRecord.roleContext[0].roleId)
        prereqRole =  getBusinessRole(usrPrereqRecord.roleContext[0].roleId)
        logger.error("Role name => "+prereqRole)
      }
    }
  
  try {
      if(identityServer.getProperty("esv.portal.url")!=null && identityServer.getProperty("esv.portal.url")){
         prereqReverify = identityServer.getProperty("esv.portal.url")+"/MyAccount/VerifyPreReq"
      }   

      if(userProfileResponse && userProfileResponse.custom_languagePreference && userProfileResponse.custom_languagePreference!= null){
        if(languageMap && languageMap!=null){
          locale = getLangCode(userProfileResponse.custom_languagePreference,languageMap);
        }
      }  

      let body = {
        subject: "KYID Account Notification: Upcoming Expiration Prerequisite" ,
        to: mail,
        _locale: locale || "en",
        templateName: "kyid2B1UsrprereqExpiryNotification",
        object: {
          "givenName": givenName,
          "sn" : sn,
          "prereqName" : prereqName,
          "prereqApp": prereqApp,
          "prereqRole": prereqRole,
          "prereqExpiryDate": expiryDate,
          "prereqDesc": prereqDescription,
          "phoneContact": phoneContact,
          "prereqReverify":prereqReverify
        }
      }
      logger.error("Objects configured for mail template "+JSON.stringify(body))
      logger.error("Sending email to "+mail)
      openidm.action("external/email", "sendTemplate", body)
      logger.error("Email successfully get delivered to "+ mail)
      return {
        "code":200,
        "status":"success"
      }
    }
    catch (error) {
      logger.error("Email failed to get delivered to "+mail+" | Exception: "+error);
      return logDebug(funcName,"Email failed to get delivered to "+mail+" | Exception: "+error,error)
    }
  }


/**
 * @name {getBusinessApp}
 * @description <It returns Business application>
 * 
 * @returns appName
 */
function getBusinessApp(id){
  try {
        const response = openidm.read("managed/alpha_kyid_businessapplication/"+id,null, ["name"]);

        logger.error("getBusinessApp Response --> " + response)
        if (response!=null && response) {
            return response.name
        } else {
            return ""
        }
    } catch (error) {
        logger.error("Error Occurred in getBusinessApp request" + error)
        return {
            code: 400,
            message: "Error Occurred in getBusinessApp request" + error
        }
    }
}


/**
 * @name {getBusinessRole}
 * @description <It returns Business role>
 * 
 * @returns roleName
 */
function getBusinessRole(id){
  try {
        const response = openidm.read("managed/alpha_role/"+id,null, ["name"]);

        logger.error("getBusinessRole Response --> " + response)
         if (response!=null && response) {
            return response.name
        } else {
            return ""
        }
    } catch (error) {
        logger.error("Error Occurred in getBusinessRole request" + error)
        return {
            code: 400,
            message: "Error Occurred in getBusinessRole request" + error
        }
    }
}


/**
 * @name {isoToEastern}
 * @description <It returns current date in EST format>
 * 
 * @returns Date
 */

function isoToEastern() {
    var date = new Date();

    var year = date.getUTCFullYear();

    // DST calculation
    var march = new Date(Date.UTC(year, 2, 1));
    var marchDay = (7 - march.getUTCDay() + 7) % 7 + 7; // 2nd Sunday
    var dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0)); // 2am EST == 7am UTC

    var november = new Date(Date.UTC(year, 10, 1));
    var novDay = (7 - november.getUTCDay()) % 7; // 1st Sunday
    var dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0)); // 2am EDT == 6am UTC

    var isDST = (date >= dstStart && date < dstEnd);
    var offset = isDST ? -4 : -5;
    var tzAbbr = isDST ? "EST" : "EST"; //Earlier was EDT:EST

    var local = new Date(date.getTime() + offset * 60 * 60 * 1000);

    // Month names
    var months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Day suffix
    function getOrdinalSuffix(d) {
        if (d >= 11 && d <= 13) return d + "th";
        switch (d % 10) {
            case 1: return d + "st";
            case 2: return d + "nd";
            case 3: return d + "rd";
            default: return d + "th";
        }
    }

    // Format time
    var hours = local.getUTCHours();
    var minutes = local.getUTCMinutes();
    var seconds = local.getUTCSeconds();

    var ampm = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;

    function pad(n) { return n < 10 ? '0' + n : n; }

    var month = months[local.getUTCMonth()];
    var day = getOrdinalSuffix(local.getUTCDate());
    var time = hour12 + ":" + pad(minutes) + ":" + pad(seconds);

    return month + ", " + day + " " + local.getUTCFullYear() + " - " + time + " " + ampm + " " + tzAbbr;
  
}


function patchUserPrerequisiteAsExpired(recordID) {
  logger.error("recordID in patchUserPrerequisiteAsExpired => "+recordID)
  logger.error("Inside patchUserPrerequisiteAsExpired")
  let funcName = "patchUserPrerequisiteAsExpired"
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
          "value":"EXPIRED" //"2"
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
          "value": "KYID-System"
        }
        jsonArray.push(jsonObj)

        logger.error("UserPrerequisite jsonArray to patch - "+ JSON.stringify(jsonArray))
    
        openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + recordID, null, jsonArray);
    
        return {
          "status":"success",
          "message":"success"
        }
  
    } catch (error) {
        //Return error response
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw logDebug(funcName,null,error)
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



/**
* @name <logDebug>
* @description <This function logs information>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function logDebug(funcName,msg,error){

  let detail = requestDetail()
  detail.functionName = funcName
  detail.exception = getException(error)
  if(msg!=null){
    return { code:400, message:msg, detail:JSON.stringify(detail.exception) }
  } else {
    return { code:400, message:'An unexpected error occurred when submitting the request. Please try again later.', detail:JSON.stringify(detail.exception) }
  }
  
}


function getUserPrereqUsingEnrollmentRequest(action, enrollmentRequestId) {
    try {
        if (action == 0) {
            const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                    "_queryFilter": '/enrollmentRequestId/ eq "' + enrollmentRequestId + '"' 
                      + ' AND (recordState eq "ACTIVE" OR recordState eq "0")'
                      //+ ' AND recordState eq "' + "ACTIVE" + '"'
                },
                ["*"])
            logger.error("User Prereq Response is ")
            if (response && response !== null && response.resultCount > 0) {
                return {
                    "isPrereqPresent": true
                }
            } else {
                return {
                    "isPrereqPresent": false
                }
                // throw { code: 400, message: 'Policy not found' }
            }
        }

    } catch (error) {
        throw {
            code: 500,
            message: 'Unknown error'
        }
    }

}


function getUserPrereq(apiRequestPayload) {

    let resp = null
    let found = false
    let userPrerequisiteResponse = null
    let status = null
    let missingRequiredParams = []
    const recordStatus = "ACTIVE"
    const usrPrereqStatus = "NOT_STARTED"

    try {
        /**
          status(User Pre-requisite Request Status) | NOT_STARTED, PENDING_APPROVAL, COMPLETED, REJECTED, ALREADY_COMPLETED, EXPIRED, CANCELLED
          recordState(State of Record) | ACTIVE, DELETED
        */
        if (apiRequestPayload.preReqId && apiRequestPayload.preReqId !== null) {
            logger.error("apiRequestPayload in getUserPrereq is - " + JSON.stringify(apiRequestPayload))

            userPrerequisiteResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                "_queryFilter": '_id/ eq "' + apiRequestPayload.userPrereqId + '"' 
                  +' AND requestedUserAccountId eq "' + apiRequestPayload.requestedUserAccountId + '"' 
                  +' AND (recordState eq "' + recordStatus + '" OR recordState eq "0")'}, ["*"])

             if (userPrerequisiteResponse && userPrerequisiteResponse !== null && userPrerequisiteResponse.resultCount > 0) {
                 logger.error("User Prereq Response in getUserPrereq is - " + JSON.stringify(userPrerequisiteResponse))
                 logger.error("userPrerequisiteResponse.result.length is - " + userPrerequisiteResponse.result.length)
               
                 if(userPrerequisiteResponse.result.length==1){

                   if(userPrerequisiteResponse.result[0].status == "0" || userPrerequisiteResponse.result[0].status == "NOT_STARTED" ||
                       userPrerequisiteResponse.result[0].status == "1" || userPrerequisiteResponse.result[0].status == "PENDING_APPROVAL" || 
                        userPrerequisiteResponse.result[0].status == "PENDING" ||
                         userPrerequisiteResponse.result[0].status == "2" || userPrerequisiteResponse.result[0].status == "COMPLETED") {
                          logger.error("User prerequisite record Found")
                           return {
                              "status": "Found",
                              "result": userPrerequisiteResponse.result[0]
                           } 
                     
                    } else {
                       logger.error("UserPrerequisites Record Is Inactive")
                       return { code: "ERR-BUS-SER-VAL-001", message: "An unexpected error has occurred", detail: "UserPrerequisites Record Is Inactive"}
                    }
                   
                 } else {
                   logger.error("Multiple UserPrerequisite Records Found")
                   return { code: "ERR-BUS-SER-VAL-001", message: "An unexpected error has occurred", detail: "Multiple UserPrerequisite Records Found"}
                 }
                 
             } else {
               logger.error("UserPrerequisites Record Not Found")
               return { code: "ERR-BUS-SER-VAL-001", message: "An unexpected error has occurred", detail: "UserPrerequisites Record Not Found"}
             }

        } else {
            logger.error("Inside Else Get Prereq Part")
            logger.error("apiRequestPayload.requestedUserAccountId --> " + apiRequestPayload.requestedUserAccountId)
            logger.error("apiRequestPayload.enrollmentRequestId -->" + apiRequestPayload.enrollmentRequestId)
            let userPrereqTemplate = {}
            let userPrereqSummary = {
                rolePreReq: []
            }

            const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                    "_queryFilter": '/enrollmentRequestId/ eq "' + apiRequestPayload.enrollmentRequestId + '"' 
                      + ' AND (recordState eq "ACTIVE" OR recordState eq "0")' + ' AND requestedUserAccountId eq "' + apiRequestPayload.requestedUserAccountId + '"'},
                     // + ' AND recordState eq "' + "ACTIVE" + '"' + ' AND requestedUserAccountId eq "' + apiRequestPayload.requestedUserAccountId + '"'},
                ["status", "displayOrder", "preRequisiteType", "preRequisiteTypeId/_id", "preRequisiteTypeId/name", "preRequisiteId/displayName", "preRequisiteId/displayDescription"]);

            logger.error("Get Prereq Summary Response is --> " + response)
            if (response !== null && response.resultCount > 0) {

                for (let i = 0; i < response.resultCount; i++) {
                    userPrereqTemplate = {
                        Id: null,
                        typeId: null,
                        typeName: null,
                        name: null,
                        description: null,
                        status: null,
                        displayOrder: null

                    }
                    userPrereqTemplate.Id = response.result[i].preRequisiteId._id
                    userPrereqTemplate.typeId = response.result[i].preRequisiteTypeId._id
                    userPrereqTemplate.typeName = response.result[i].preRequisiteTypeId.name
                    userPrereqTemplate.name = response.result[i].preRequisiteId.displayName
                    userPrereqTemplate.description = response.result[i].preRequisiteId.displayDescription
                    userPrereqTemplate.status = response.result[i].status
                    userPrereqTemplate.displayOrder = response.result[i].displayOrder
                    userPrereqSummary.rolePreReq.push(userPrereqTemplate)
                }


                return userPrereqSummary
            } else {
                return null
            }
        }

    } catch (error) {
        return logErrorDetails(500, 'Unknown_Exception_Occurred', error)
    }

}


function createUserPrerequisite(payload) {
    try {
        const response = openidm.create("managed/alpha_kyid_enrollment_user_prerequisites", null, payload);

        if (response && response !== null) {
            logger.error("User Prerequisite created successfully" + response)
            return response
        } else {
            return null
        }


    } catch (error) {
        logger.error("Error Occurred while createUserPrerequisite " + error)
        return logErrorDetails(500, 'Unknown_Exception_Occurred', error)
    }

}

function getActivePrerequiste(payload) {

    let userPrerequisiteResponse = null;
    let userId = payload.userId
    let prereqId = payload.prereqId
    let prereqTypeId = payload.prereqTypeId
    let pendingUserPrerequisiteResponse = null
    const recordStatus = "ACTIVE"
    try {
        /**
          status(User Pre-requisite Request Status) | NOT_STARTED, PENDING_APPROVAL, COMPLETED, REJECTED, ALREADY_COMPLETED, EXPIRED, CANCELLED
          recordState(State of Record) | ACTIVE, DELETED
        */
        logger.error("payload - "+JSON.stringify(payload))
        const baseMOUrl = 'managed/alpha_kyid_enrollment_user_prerequisites/';
        const queryFilter = `/requesterUserAccountId eq "${userId}" and status eq "COMPLETED" and (recordState eq "${recordStatus}" or recordState eq "0")`;
        logger.error("Query Filter - "+JSON.stringify({"_queryFilter":queryFilter}))
        userPrerequisiteResponse = openidm.query(baseMOUrl, {"_queryFilter": queryFilter}, ["*"])       
        if (userPrerequisiteResponse && userPrerequisiteResponse != null && userPrerequisiteResponse.resultCount > 0) {
            logger.error("User Prereq Response in getActivePrerequiste is - " + JSON.stringify(userPrerequisiteResponse))
            logger.error("userPrerequisiteResponse.result.length is - " + userPrerequisiteResponse.result.length)
            var filteredResults = userPrerequisiteResponse.result.filter(function(item) {
                return item && item.preRequisiteId && typeof item.preRequisiteId._refResourceId === 'string' &&
                item.preRequisiteId._refResourceId === prereqId && item.preRequisiteTypeId &&
                typeof item.preRequisiteTypeId._refResourceId === 'string' && item.preRequisiteTypeId._refResourceId === prereqTypeId})  
            logger.error("User Prereq filtered Response in getActivePrerequiste is - " + JSON.stringify(filteredResults)) 
            userPrerequisiteResponse.result = filteredResults
            userPrerequisiteResponse.resultCount = userPrerequisiteResponse.result.length
            logger.error("User Prereq final Response in getActivePrerequiste is - " + JSON.stringify(userPrerequisiteResponse)) 
            return userPrerequisiteResponse        
        } else {
            return userPrerequisiteResponse
        }
    } catch (error) {
        return logErrorDetails(500, 'Unknown_Exception_Occurred', error)
    }

}

function cancelUserPrerequisite(status, userId, enrollmentRequestId) {
    try {
        let userPrereqIds = [];
        logger.error("cancelUserPrerequisite status is --> " + status)
        logger.error("cancelUserPrerequisite enrollmentRequestId is --> " + enrollmentRequestId)
        logger.error("cancelUserPrerequisite userId is --> " + userId)
        const getUserPrereqResponse = getPendingUserPrereq(enrollmentRequestId)
        logger.error("cancelUserPrerequisite func getUserPrereqResponse -->  " + getUserPrereqResponse)
        if (getUserPrereqResponse && getUserPrereqResponse !== null) {
            logger.error("cancelUserPrerequisite func getUserPrereqResponse Count -->  " + getUserPrereqResponse.resultCount)
            if (getUserPrereqResponse.resultCount > 0) {
                for (let i = 0; i < getUserPrereqResponse.resultCount; i++) {
                    userPrereqIds.push(getUserPrereqResponse.result[i]._id)
                }
                logger.error("userPrereqIds are --> " + userPrereqIds)


            } else {
                return getUserPrereqResponse
            }
        } else {
            return null
        }

        logger.error("userId --> " + userId)
        logger.error("updateDateEpoch --> " + currentTimeinEpoch)
        logger.error("updateDate --> " + currentDate)
        let jsonArray = []
        let jsonObj = {
            "operation": "replace",
            "field": "status",
            "value": "CANCELLED"
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "updateDateEpoch",
            "value": currentTimeinEpoch
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "updateDate",
            "value": currentDate
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "updatedBy",
            "value": userId
        }
        jsonArray.push(jsonObj)

        logger.error("endpoint/UserPrerequisiteAPI jsonArray --> " + jsonArray)

        if (userPrereqIds && userPrereqIds.length > 0) {
            for (let j = 0; j < userPrereqIds.length; j++) {
                const response = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + userPrereqIds[j], null, jsonArray);
                logger.error("cancelUserPrerequisite -- response --> " + JSON.stringify(response))
                if (!response) {
                    return {
                        code: 400,
                        message: " Error Occurred while Canclleing userPrereq"
                    }
                }

            }

        }



    } catch (error) {
        logger.error("Error Occurred while Cancelling User Prerequsites" + error)
        return {
            code: 400,
            message: " Error Occurred while Canclleing userPrereq" + error
        }
    }

}

function getPendingUserPrereq(enrollmentId) {
    try {
        logger.error("getPendingUserPrereq enrollmentId is --> " + enrollmentId)
        const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
            "_queryFilter": '/enrollmentRequestId/ eq "' + enrollmentId + '"' 
              + ' AND (recordState eq "ACTIVE" OR recordState eq "0")'
              //+ ' AND recordState eq "' + "ACTIVE" + '"' 
              //+ ' AND status eq "' + "NOT_STARTED" + '"' + ' OR status eq "' + "PENDING_APPROVAL" + '"'
              + ' AND (status eq "NOT_STARTED" OR status eq "PENDING_APPROVAL")'
        }, ["*"])

        logger.error("getPendingUserPrereq Response --> " + response)
        if (response.resultCount > 0) {
            return response
        } else {
            return null
        }
    } catch (error) {
        logger.error("Error Occurred while getPendingUserPrereq request" + error)
        return {
            code: 400,
            message: "Error Occurred while getPendingUserPrereq request" + error
        }
    }

}

function getUserPrereqById(id) {
    try {
        const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisite/", { "_queryFilter": '/_id/ eq "' + value + '"'}, []);

        logger.error("getUserPrereqById Response --> " + response)
        if (response.resultCount > 0) {
            return response
        } else {
            return null
        }
    } catch (error) {
        logger.error("Error Occurred while getPendingUserPrereq request" + error)
        return {
            code: 400,
            message: "Error Occurred while getPendingUserPrereq request" + error
        }
    }
}
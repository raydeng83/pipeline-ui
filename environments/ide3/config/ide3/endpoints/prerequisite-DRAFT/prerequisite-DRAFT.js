/**
* @name [@endpointname=prerequisite]
* @description [@description]=This endpoint returns the requested prerequisite page for enrollment and processes the submitted form page data for validation and storage (verified data)
*
* @param {request} request - This is the request object contains the following
* resourceName - The name of the resource, without the endpoint/ prefix.
* newResourceId - The identifier of the new object, available as the results of a create request.
* revision - The revision of the object.
* parameters - Any additional parameters provided in the request. 
* content - Content based on the latest revision of the object, using getobject.
* context - The context of the request, including headers and security. 
* Paging parameters - The pagedResultsCookie, pagedResultsOffset, and pageSize parameters are specific to query methods. 
* Query parameters - The queryId and queryFilter parameters are specific to query methods. 
*
* @date [@date]
* @author {<authorname>@deloitte.com}
*/

/**
API-
Method: POST 
SIH: /enrollment/getprerequisitepage
Ping: /openidm/endpoint/prerequisite
{
  "payload":{
            "requestedUserAccountId":"",
            "enrollmentRequestId":"",
            "userPrereqId":"",
            "preReqId":"",
            "preReqTypeId":"",
            "pageNumber":""
  },
  "action":4 // 1|create(POST), 2|update (PATCH), 3|delete (DELETE), 4|search (POST), x|<customAction 
}
*/

/**
API-
SIH:/enrollment/submitprequisitepage
Ping: /openidm/endpoint/prerequisite
Method: POST
{
    "payload":{
        "requestedUserAccountId":"",
        "enrollmentRequestId":"",
        "userPreReqId":"",
        "preReqId":"",
        "preReqTypeId":"",
        "pageNumber":"",
        "pageElements":[
            {
                "name":"",
                "type":"",
                "value":[""]
            }
        ]
    },
    "action":1  // 1|create(POST), 2|update (PATCH), 3|delete (DELETE), 4|search (POST), x|<customAction 
}
*/

const transactionId = ()=>{
  return context.transactionId.id 
}

const requestDetail = ()=>{
  let detail = {}
  detail.timestamp = context.requestAudit.receivedTime 
  detail.transactionId = context.transactionId.id
  detail.endpoint = context.parent.matchedUri
  return detail
}


(function () {

  const isEndpointExecutionAllowed = identityServer.getProperty("esv.journey.execution.flag")
  const authenticatedUserId = context.current.parent.parent.parent.parent.parent.rawInfo.sub
  const authorizedRole = context.current.parent.parent.parent.parent.authorization.roles
  logger.error("authorizedRole is - "+authorizedRole.includes("tenant-admins"))
  
  if(isEndpointExecutionAllowed === "true"){
    if (request.method === 'create') {
      // POST
      const apiRequestPayload = request.content.payload
      const apiRequestAction = request.content.action
      let apiResponse = null
      logger.error("apiRequestPayload is - "+JSON.stringify(apiRequestPayload))
      logger.error("apiRequestAction is - "+apiRequestAction)

      //Only Authenticated user or Tenant Admin is allowed to access the endpoint
      if (authenticatedUserId !== apiRequestPayload.requestedUserAccountId && !authorizedRole.includes("tenant-admins")){
          throw { code: 401, message: 'Unauthorized' }
      }

      let standardRequest = {
        context:{
          requestedUser:{
            userName:apiRequestPayload.requestedUserAccountId
          },
          requestorUser:{
            userName:authenticatedUserId
          },
          transactionId:context.transactionId.id.split('/')[0]
        },
        payload:{}
      }

      if(apiRequestAction === 1){
        
        try{
          return processPageDetails(apiRequestPayload,standardRequest)
        } catch(error){
          logger.error("Exception in endpoint/prerequisite is - "+getException(error))
          throw error
        }
        
      } else if(apiRequestAction === 4){
          
        try{
          return getPageDetails(apiRequestPayload,standardRequest)
        } catch(error){
          logger.error("Exception in endpoint/prerequisite is - "+getException(error))
          throw error
        }
        
      } else {
        throw { code: 500, message: 'Unknown_Action' }
      }
      
    } else if (request.method === 'read') {
      // GET
      //return {};
      //Throw unsupported operation error.
      throw { code : 500, message : "Unsupported operation: " + request.method };
    } else if (request.method === 'update') {
      // PUT
      //return {};
      //Throw unsupported operation error.
      throw { code : 500, message : "Unsupported operation: " + request.method };
    } else if (request.method === 'patch') {
      //return {};
      //Throw unsupported operation error.
      throw { code : 500, message : "Unsupported operation: " + request.method };
    } else if (request.method === 'delete') {
      //return {};
      //Throw unsupported operation error.
      throw { code : 500, message : "Unsupported operation: " + request.method };
    }
    throw { code: 500, message: 'Unknown_Exception_Occurred' }
  
  } else {
    logger.error("Endpoint prerequisite execution is not allowed",'')
    throw { code: 400, message: 'Endpoint_Execution_Not_Allowed' }
  }
}());


/**
* @name <isMandatoryInputPresent>
* @description <It checks whether all the required input params are present. If not, returns them.>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function isMandatoryInputPresent(paramJSON,apiName){

  let missingRequiredInput = []
  const requestedUserAccountId = paramJSON.requestedUserAccountId
  const enrollmentRequestId = paramJSON.enrollmentRequestId
  const userPrereqId = paramJSON.userPrereqId
  const preReqId = paramJSON.preReqId
  const preReqTypeId = paramJSON.preReqTypeId
  const pageNumber = paramJSON.pageNumber
  
  if(apiName==="submitPageAPI"){
    logger.error("apiName is - "+apiName)
    const pageElements = paramJSON.pageElements 
    if(!(pageElements!=null && pageElements)){
      missingRequiredInput.push("pageElements")
    }
  }
   
  if(!(requestedUserAccountId!=null && requestedUserAccountId)){
    missingRequiredInput.push("requestedUserAccountId")
  }

  if(!(enrollmentRequestId!=null && enrollmentRequestId)){
    missingRequiredInput.push("enrollmentRequestId")
  }

  if(!(userPrereqId!=null && userPrereqId)){
    missingRequiredInput.push("userPrereqId")
  }

  if(!(preReqId!=null && preReqId)){
    missingRequiredInput.push("preReqId")
  }

  if(!(preReqTypeId!=null && preReqTypeId)){
    missingRequiredInput.push("preReqTypeId")
  }

  if(!(pageNumber!=null && pageNumber)){
    missingRequiredInput.push("pageNumber")
  }
  
  return missingRequiredInput
  
}


/**
* @name <getPageDetails>
* @description <It returns the requested prerequisite page based on the pageNumber>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPageDetails(apiRequestPayload,standardRequest){
  logger.error("Inside getPageDetails")
  let funcName = "getPageDetails"
  let apiName = "getPageAPI"
  let prereqValues = null
  let userProfileResponse = null
  let requestorProfileResponse = null
  let prereqTypeResponse = {}
  let pageResponse = {}
  let pageArray = []
  let userPrerequisiteResponse = null
  let requestorPayload = {}
  const requestBody = {
      "payload": apiRequestPayload,
      "action": 2 //Get
  }
  
  logger.error("standardRequest before update is - "+JSON.stringify(standardRequest))
  try{
  //Validates whether all the Mandatory Input Parameters are present or not
    if(isMandatoryInputPresent(apiRequestPayload,apiName).length>0){
      return { code: 400, message: 'Missing_Mandatory_Input_Parameters - '+isMandatoryInputPresent(apiRequestPayload,apiName) }
      //return logErrorDetails(-2,"Missing_Mandatory_Input_Parameters",createlogDetailsJSON(funcName,isMandatoryInputPresent(apiRequestPayload,apiName),240))
   
    } else {
        //Validate If required input parameters are ACTIVE in system
        userProfileResponse = getUserAccount(requestBody) //Getting Requestee Profile Info
        if(userProfileResponse.code != 400){
            //Check if prerequisite is in NOT_STARTED (0) state or not in User Prerequisite
            userPrerequisiteResponse = getUserPrerequisite(requestBody)
  
            standardRequest.context.requestedUser.userName = userProfileResponse.userName
            logger.error("userPrerequisiteResponse.result.requesterUserAccountId - "+userPrerequisiteResponse.result.requesterUserAccountId)
            logger.error("standardRequest.context.requestorUser.userName - "+standardRequest.context.requestorUser.userName )
            //Getting Requestor Profile Info
            if(userPrerequisiteResponse.result.requesterUserAccountId!=null){
              requestorPayload.requestedUserAccountId = userPrerequisiteResponse.result.requesterUserAccountId
            } else {
              requestorPayload.requestedUserAccountId = standardRequest.context.requestorUser.userName 
            }
            
            requestBody.payload = requestorPayload
            logger.error("Payload for Requestor is - "+JSON.stringify(requestorPayload))
            requestorProfileResponse = getUserAccount(requestBody)
            if(requestorProfileResponse.code != 400){
              logger.error("Response for Requestor is - "+JSON.stringify(getUserAccount(requestBody)))
              standardRequest.context.requestorUser.userName = requestorProfileResponse.userName
            } else {
              standardRequest.context.requestorUser.userName = userProfileResponse.userName
              /*logger.error("Requestor_Not_Active_In_System") 
              return { code: 400, message: 'Requestor_Not_Active_In_System' }*/
            }  
            
            if(userPrerequisiteResponse["status"] === "Found"){  
              if(userPrerequisiteResponse.result.prerequisiteValues!=null && userPrerequisiteResponse.result.prerequisiteValues){
                prereqValues = userPrerequisiteResponse.result.prerequisiteValues
                logger.error("prereqValues in userPrerequisite are - "+JSON.stringify(prereqValues))
              }
           
              //Get the page associated with prerequisite type
              prereqTypeResponse = getPrerequisitePage(apiRequestPayload)
              
              if(prereqTypeResponse.code != 400){             
                if(prereqTypeResponse.fields!=null && prereqTypeResponse.fields && prereqTypeResponse.fields.length>0){
                  logger.error("Fields array length - "+prereqTypeResponse.fields.length)
                  //Prepopulate Reference Property Data
                  prereqTypeResponse = getPageWithPopulatedData(apiRequestPayload,prereqTypeResponse,userProfileResponse,
                                                                prereqValues,userPrerequisiteResponse,standardRequest,
                                                                requestorProfileResponse)
                   logger.error("prereqTypeResponse value is - "+JSON.stringify(prereqTypeResponse))
                  if(prereqTypeResponse.ResponseStatus || prereqTypeResponse.code){
                    if(prereqTypeResponse.ResponseStatus!=0 ||prereqTypeResponse.code == 400){
                      throw prereqTypeResponse
                    }
                  
                  } else if(prereqTypeResponse.status){  
                      if(prereqTypeResponse.status=="success"){
                        return prereqTypeResponse
                      }   
                  }
                  
                  logger.error("pageResponse in getPrerequisitePageAPI after update - "+JSON.stringify(prereqTypeResponse))
                }
                pageArray.push(prereqTypeResponse)
                pageResponse["pages"] = pageArray
                return pageResponse

              } else {
                throw prereqTypeResponse
              }
              
            } else {
              throw userPrerequisiteResponse
            }
          
         } else {
            throw userProfileResponse
         }
        
      }
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
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
      logger.error("userProfileResponse in getUserAccount is - "+JSON.stringify(userProfileResponse))
      userProfileResponse = userProfileResponse.user.result[0]
      return userProfileResponse
      
    } else {
      logger.error("User account is inActive in the system")
      return { code: 400, message: 'Account_InActive_In_System' }
    }
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <getUserPrerequisite>
* @description <It returns the ACTIVE user prerequisite record with NOT_STARTED status>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserPrerequisite(requestBody){
  logger.error("Inside getUserPrerequisite")
  let funcName = "getUserPrerequisite"
  let userProfileResponse = null
  
  try{
     return openidm.create("endpoint/UserPrerequisiteAPI", null, requestBody)
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <getPrerequisitePage>
* @description <It returns the requested page details along with all the associated page elements and their properties>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPrerequisitePage(requestBody){
  logger.error("Inside getPrerequisitePage")
  let funcName = "getPrerequisitePage"
  let prereqTypeResponse = null
  
  try{
    prereqTypeResponse = getPrerequisiteType(requestBody)
    
    if(prereqTypeResponse && prereqTypeResponse !== null  && prereqTypeResponse.code != 400){
      logger.error("pageResponse in getPrerequisitePage - "+JSON.stringify(prereqTypeResponse))
      return prereqTypeResponse.response
      
    } else {
      logger.error("Page not found")
      return prereqTypeResponse
    }
    
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <getPrerequisiteType>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPrerequisiteType(requestBody) {
  logger.error("Inside getPrerequisiteType")
  let funcName = "getPrerequisiteType"
  let prereqTypeResponse = null
  let pagesArray = null
  let response = null
  let result = {
    nextPageNumber:null,
    response:null
  }
  let found = false
  const status = "ACTIVE"
  
  try {
      /**
        status(User Pre-requisite Request Status) | NOT_STARTED, PENDING_APPROVAL, COMPLETED, REJECTED, ALREADY_COMPLETED, EXPIRED, CANCELLED
        recordState(State of Record) | ACTIVE, DELETED
      */
      prereqTypeResponse = openidm.query("managed/alpha_kyid_enrollment_prerequisite_type/", { "_queryFilter": '/_id/ eq "' + requestBody.preReqTypeId + '"'
        + ' AND (recordState eq "' + status + '" OR recordState eq "0")'}, ["*"])
      logger.error("Prereq Type Response is - "+JSON.stringify(prereqTypeResponse))
    
      if(prereqTypeResponse && prereqTypeResponse !== null  && prereqTypeResponse.resultCount>0){
          logger.error("prereqTypeResponse.result.length is - "+prereqTypeResponse.result.length)
          logger.error("prereqTypeResponse.result is - "+prereqTypeResponse.result[0])
          pagesArray = prereqTypeResponse.result[0].pages
          logger.error("pagesArray length is - "+pagesArray.length)
        
          for(let i=0; i<pagesArray.length; i++){
            response = null
            response = pagesArray[i]
            logger.error("page "+(i+1)+ " is - "+JSON.stringify(response))
            logger.error("response.pageNumber  "+i+ " is - "+response.pageNumber)
            
            if(response.pageNumber == Number(requestBody.pageNumber)){
              logger.error("Found page")
              found = true
              break
            }           
          }  
      }
        
      if(found === true)  {
        if(response.pageNumber<pagesArray.length){
          result.nextPageNumber = (response.pageNumber+1)
          result.response = response
        } else {
          result.response = response
        }
        
        return result
      } else {
        return { code: 400, message: 'Page_Not_Found' }
      }

  } catch (error) {
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
  
}


/**
* @name <getPageWithPopulatedData>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPageWithPopulatedData(apiRequestPayload,prereqTypeResponse,userProfileResponse,
                                  prereqValues,userPrerequisiteResponse,standardRequest,
                                  requestorProfileResponse){
  logger.error("Inside getPageWithPopulatedData")
  let funcName = "getPageWithPopulatedData"
  let field = null
  let value = null
  let fieldsArray = null
  let referenceObj = null
  let referenceObjProperty = null
  let requestParamsJSON = {}
  let requestParams = []
  let responseParamsJSON = {}
  let responseParams = []
  let serviceEndptRequestObj = null
  let serviceEndptResponse = null
  let agreementEndptResponse = null
  let trainingEndptResponse = null
  let workflowInputJSON = {}
  let workflowResponse = null
  let prereqName = null
  let prerequisiteResponse = null
  let apiResponse = {
     "status":null,
     "message":null
  }
  
  try{
    fieldsArray = prereqTypeResponse.fields
    for(let i=0; i<fieldsArray.length; i++){
      logger.error("Field "+ (i+1)+" is -"+fieldsArray[i])
      value = null
      field = fieldsArray[i]
      requestParamsJSON = {}
      responseParamsJSON = {}

      //Check whether prereqValues present and valid. If yes, populate data for respective field.
      if(prereqValues!=null && prereqValues){
        for(let j=0;j<prereqValues.length;j++){
          logger.error("Field onsubmitRequestServiceParameterName value is - "+field.onsubmitRequestServiceParameterName)
          logger.error("prereqValues is - "+JSON.stringify(prereqValues[j]))
          logger.error("prereqValues field Name is - "+JSON.stringify(prereqValues[j].fieldName))
          if(field.onsubmitRequestServiceParameterName==prereqValues[j].fieldName){
            logger.error("prereqValues field Value is - "+JSON.stringify(prereqValues[j].fieldValue))
            prereqTypeResponse.fields[i].value = prereqValues[j].fieldValue
          }
        }
      }
      
      //Check whether referenceobjectproperty present and valid. If yes, populate data for respective field.
      if(field.referenceobjectproperty!=null && field.referenceobjectproperty){
        logger.error("referenceobjectproperty Present")
        referenceObj = (field.referenceobjectproperty).split(".")[0]
        logger.error("referenceObj is - "+referenceObj)
        referenceObjProperty = (field.referenceobjectproperty).split(".")[1]
        logger.error("referenceObjProperty value is - "+referenceObjProperty)
  
        if(referenceObj!=null && referenceObj && referenceObjProperty!=null && referenceObjProperty){
          switch(referenceObj) {
            case "user":
              logger.error("Inside user and property value is - "+referenceObjProperty)    
              if(referenceObjProperty=="cn"){
                value = userProfileResponse["givenName"]+" "+userProfileResponse["sn"]
              } else {
                value = userProfileResponse[referenceObjProperty]
              }    
              break
            default:
              return { code: 400, message: 'Reference_Property_Value_NotFound' }
              break
          }
          logger.error("Value from userProfileResponse is - "+value)
          prereqTypeResponse.fields[i].value = value
        }
      }

     //Create onLoad Request Params
      if(field.onloadRequestServiceParameterName!=null && field.onloadRequestServiceParameterName ){
          requestParamsJSON["fieldName"] = field.name
          requestParamsJSON["serviceParamName"] = field.onloadRequestServiceParameterName
        
          if(value!=null){  //reference object property value
            requestParamsJSON["value"] = value
            standardRequest.payload[field.onloadRequestServiceParameterName] = value
          
          } else if(field.value!=null){  //default value
              let totValues = field.value.split(",")
              logger.error("Total values present for field in default is - "+totValues)
              if(totValues.length>1){
                  let arrayVals = []
                  for(let k=0;k<totValues.length;k++){
                    arrayVals.push(totValues[k])
                  }      
                  requestParamsJSON["value"] = arrayVals
                  standardRequest.payload[field.onloadRequestServiceParameterName] = arrayVals
              } else {
                  requestParamsJSON["value"] = field.value
                  standardRequest.payload[field.onloadRequestServiceParameterName] = field.value
              }   
            
          } else {
             return { code: 400, message: 'Missing_onloadRequestServiceParameter_Value_for_'+ field.name}
          }
          
          
          requestParams.push(requestParamsJSON)
          logger.error("requestParams in JSON is -"+JSON.stringify(requestParams))
      }   

      //Create onLoad Response Params
      if(field.onloadResponseServiceParameterName!=null && field.onloadResponseServiceParameterName){
        responseParamsJSON["fieldName"] = field.name
        responseParamsJSON["serviceParamName"] = field.onloadResponseServiceParameterName
        responseParams.push(responseParamsJSON)
        logger.error("responseParams in JSON is -"+JSON.stringify(responseParams))
      } 
      
    }//End For Loop

    //Check if onLoad Endpoint Present. If yes, create onLoad Endpoint Request
    if(prereqTypeResponse.onLoadServiceEndpoint.endpointName!=null && prereqTypeResponse.onLoadServiceEndpoint.endpointName){
      logger.error("onLoad Endpoint name - "+prereqTypeResponse.onLoadServiceEndpoint.endpointName)
      //Creates Request for Endpoint
      serviceEndptRequestObj = createOnLoadEndptRequest(requestParams,responseParams,prereqTypeResponse.onLoadServiceEndpoint.endpointName)

      if(serviceEndptRequestObj!=null){

        if(serviceEndptRequestObj.endpoint.requestTransformationMethod!=null) {
            logger.error("Request Transformation Method is - "+serviceEndptRequestObj.endpoint.requestTransformationMethod)
            logger.error("standardRequest payload after update is - "+JSON.stringify(standardRequest))
            switch(serviceEndptRequestObj.endpoint.requestTransformationMethod){
              case 'triggerAgreement':
                    agreementEndptResponse = invokeAgreementEndpt(standardRequest,serviceEndptRequestObj,apiRequestPayload)
                    if(agreementEndptResponse.ResponseStatus!=0){
                       return agreementEndptResponse
                    } else {
                       for(let l=0;l<fieldsArray.length;l++){ 
                         if(fieldsArray[l].name=="Message"){
                           prereqTypeResponse.fields[l].value = agreementEndptResponse.message
                         }
                       }
                    }  
                    break;
              case 'triggerTraining':
                    trainingEndptResponse = invokeTrainingEndpt(standardRequest,serviceEndptRequestObj,apiRequestPayload)
                    if(trainingEndptResponse.ResponseStatus!=0){
                       return trainingEndptResponse
                    } else {
                       for(let l=0;l<fieldsArray.length;l++){ 
                         if(fieldsArray[l].name=="Message"){
                           prereqTypeResponse.fields[l].value = trainingEndptResponse.message
                         }
                       } 
                    }
                    break;
              case 'triggerWorkflow':
                    prerequisiteResponse = getPrerequisite(apiRequestPayload.preReqId)
                    if(prerequisiteResponse.code != -15){
          						prereqName = prerequisiteResponse.result[0].name
                    }
                    workflowInputJSON["pageNumber"] = apiRequestPayload.pageNumber
                    workflowInputJSON["endpointRequest"] = serviceEndptRequestObj
                    workflowInputJSON["userPrerequisiteId"] = apiRequestPayload.userPrereqId
                    workflowResponse = invokeGenericWorkflow(workflowInputJSON,userProfileResponse,
                                                             requestorProfileResponse,userPrerequisiteResponse.result,
                                                             prereqName,serviceEndptRequestObj,null)
                    if(workflowResponse.code==201){
                      for(let l=0;l<fieldsArray.length;l++){ 
                        if(fieldsArray[l].name=="Message"){
                          prereqTypeResponse.fields[l].value = "<p>You're request has been submitted for approval and you'll be notified by email. Please click continue to proceed with the request.</p>"
                        }
                      }
                    } 
                    break;
              default:
        			return 'No Matching Function'
            }
         
         } else {
            //requestTransformationMethod not present, call default invokeOnLoadEndpt method
            /*serviceEndptResponse = invokeOnLoadEndpt(standardRequest,serviceEndptRequestObj)
            
            if(serviceEndptResponse!=null){        
              if(serviceEndptResponse.code==200){
                logger.error("onLoad Endpoint Response is Success")
                
                if(serviceEndptResponse.result!=null){
                  let resultParams = Object.keys(serviceEndptResponse.result);
                  logger.error("resultParams from service endpt response are - "+resultParams)
                  //Check if endpoint response parameter present in onload service endpoint response
                  prereqTypeResponse = isResponseParamPresent(resultParams,prereqTypeResponse,serviceEndptResponse.result)
                }   
              } else {
                logger.error("onLoad Endpoint Response has Error. Message - "+serviceEndptResponse.message)
              }
            }  */
         }    
       }   
    }
    
    return prereqTypeResponse
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <createOnLoadEndptRequest>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createOnLoadEndptRequest(requestParams,responseParams,endptName){
  logger.error("Inside createOnLoadEndptRequest")
  let funcName = "createOnLoadEndptRequest"
  const status = "ACTIVE"
  let serviceEndptResponse = null
  let serviceEndptRequestObj = {}

  try{
    serviceEndptResponse = openidm.query("managed/alpha_kyid_enrollment_service_endpoint/", { "_queryFilter": '/name/ eq "' + endptName + '"'
        + ' AND (recordState eq "' + status + '" OR recordState eq "0")'}, ["*"])
    logger.error("Service Endpoint Response is - "+JSON.stringify(serviceEndptResponse))
    
    if(serviceEndptResponse.resultCount>0){
      serviceEndptResponse = serviceEndptResponse.result[0]
      serviceEndptRequestObj["endpoint"] = serviceEndptResponse
      serviceEndptRequestObj["requestParams"] = requestParams
      serviceEndptRequestObj["responseParams"] = responseParams
  
      logger.error("Service Endpoint Request Object is - "+JSON.stringify(serviceEndptRequestObj))
      return serviceEndptRequestObj
    
    } else {
      return logErrorDetails(-9,'Service_Endpoint_Configuration_Not_Found',createlogDetailsJSON(funcName,null,601))
    }
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <invokeAgreementEndpt>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeAgreementEndpt(standardRequest,serviceEndptRequestObj,apiRequestPayload){
  logger.error("Inside invokeAgreementEndpt")
  let funcName = "invokeAgreementEndpt"

  let responseAgreementEndptAPI = null
  let url = null
  let payload = {
  	KOGID: null,
  	AgreementNames: null
  }
  let requestBody = {
    url:null,
    scope:identityServer.getProperty("esv.useragreementssignedcheck.api.scope"),
    method:"POST",
    payload:null
  }
  let apiResult = {
    code:400,
    ResponseStatus:-1,
    message:null
  }
  
  try{
      if(serviceEndptRequestObj.endpoint.url!=null && serviceEndptRequestObj.endpoint.url){
        requestBody.url = serviceEndptRequestObj.endpoint.url

        //Create Payload for KOG Agreement Endpoint
        payload.KOGID = standardRequest.context.requestedUser.userName
        logger.error("Value of KOGID - "+payload.KOGID)
        if(standardRequest.payload.AgreementNames!=null){
          logger.error("Value of AgreementNames - "+standardRequest.payload.AgreementNames)
          payload.AgreementNames = [standardRequest.payload.AgreementNames]
        }

        if(payload.KOGID==null){
          logger.error("User_KOGID_Not_Found for invokeAgreementEndpt")
          apiResult.message = "UserID_Not_Found"
          return apiResult
        }

        if(payload.AgreementNames==null){
          logger.error("Agreement_Details_Not_Configured for invokeAgreementEndpt")
          apiResult.message = "Agreement_Details_Not_Configured"
          return apiResult
        }
        
        requestBody.payload = payload
        logger.error("Request Body for invokeAgreementEndptAPI - "+JSON.stringify(requestBody))
        responseAgreementEndptAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("responseAgreementEndptAPI in invokeAgreementEndptAPI - "+JSON.stringify(responseAgreementEndptAPI))

        if(responseAgreementEndptAPI!=null && responseAgreementEndptAPI){
          
          if(responseAgreementEndptAPI.response.ResponseStatus==0){
            apiResult.ResponseStatus = responseAgreementEndptAPI.response.ResponseStatus
            apiResult.code = responseAgreementEndptAPI.status
            
            if(responseAgreementEndptAPI.response.AgreementsSignedStatus!=null){
              let validateStatus = responseAgreementEndptAPI.response.AgreementsSignedStatus
              let listAgreements = payload.AgreementNames
              let pendingCompletion = []
              
              for(let j=0;j<validateStatus.length;j++){
                if(listAgreements.includes(validateStatus[j].AgreementName)){
                  logger.error("Agreement Found")
                  if(!validateStatus[j].IsUserAgreementCompleted){
                    pendingCompletion.push(validateStatus[j].AgreementName)
                  }
                }
              }

              if(pendingCompletion.length==0){
                /*
                  apiResult.message = "You've signed the required agreements. Please click continue to proceed with the request."
                  //patch user prerequisite status
                  patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"COMPLETED")     
                */
                apiResult.message = "<p>You've signed the required agreements. Please click continue to proceed with the request.</p>"
                //patch user prerequisite status as "COMPLETED"
                patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"COMPLETED")
              
              } else {           
                /*
                  apiResult.message = "You need to sign the below agreements to get the required access - "+pendingCompletion
                  //patch user prerequisite status as "PENDING"
                  patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"PENDING")
                */

                apiResult.message = "<p>You need to sign the below agreements to get the required access - </p>"
                let url = "https://"+identityServer.getProperty('esv.envtype')+".kog.ky.gov/account/SignAgreement2.aspx?AgreementName="
                pendingCompletion.forEach(pendingItem =>{
                   //apiResult.message =  apiResult.message + "<a target='_blank' href='https://ide3.kog.ky.gov/account/SignAgreement2.aspx?AgreementName="+encodeURI(pendingItem)+"'>"+pendingItem+"</a>"
                  apiResult.message =  apiResult.message + "<a target='_blank' href="+url+encodeURI(pendingItem)+">"+pendingItem+"</a>"
                })
                apiResult.message =  apiResult.message
                //patch user prerequisite status as "PENDING"
                patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"PENDING")
              }

              logger.error("apiResult in invokeAgreementEndptAPI - "+JSON.stringify(apiResult))
              return apiResult
              
            } else {
               logger.error("AgreementsSignedStatus_Key_Missing in invokeAgreementEndptAPI Response")
               apiResult.message = "AgreementsSignedStatus_Key_Missing"
               return apiResult
            }
            
          } else {
            apiResult.ResponseStatus = responseAgreementEndptAPI.response.ResponseStatus
            apiResult.message = responseAgreementEndptAPI.response.MessageResponses
            apiResult.code = responseAgreementEndptAPI.status
            return apiResult
          }
        }
        
      } else {
         logger.error("Agreement_Endpoint_Url_Not_Configured for invokeAgreementEndpt")
         apiResult.message = "Agreement_Endpoint_Url_Not_Configured"
         return apiResult
      }
      
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <invokeGenericWorkflow>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeGenericWorkflow(payload,userProfileResponse,
                               requestorProfileResponse,userPrerequisiteResponse,
                               prereqName,serviceEndptRequestObj,expiryDate){
   logger.error("Inside invokeGenericWorkflow")
   //logger.error("invokeGenericWorkflow input payload is - "+JSON.stringify(payload))
   //logger.error("userProfileResponse is - "+JSON.stringify(userProfileResponse))
   //logger.error("userPrerequisiteResponse is - "+JSON.stringify(userPrerequisiteResponse))
   let funcName = "invokeGenericWorkflow"
   let workflowResponse = null
   let customJSONObj = {
     userPrerequisiteId:null
   }
   let reqParams = {}
   let valuesJSON = null
  
   let requesterUserObj = {
			requesterUserGivenName: null,
			requesterUserId: null,
			requesterUserMail: null,
			requesterUserSn: null,
			requesterUserUsername: null
		}
  
   let requestedUserObj = {
      requestedUserGivenName: null,
			requestedUserId: null,
			requestedUserMail: null,
			requestedUserSn: null,
			requestedUserUsername: null
   } 

   let page = {
			pageNumber: null,
			fields: {},
			values: []
	 }

  try{
     customJSONObj.userPrerequisiteId = payload.userPrerequisiteId
    
     requestedUserObj.requestedUserGivenName = userProfileResponse.givenName
     requestedUserObj.requestedUserId = userProfileResponse._id
     requestedUserObj.requestedUserMail = userProfileResponse.mail
     requestedUserObj.requestedUserSn = userProfileResponse.sn
     requestedUserObj.requestedUserUsername = userProfileResponse.userName
     customJSONObj.requestedUser = requestedUserObj
    
     if(requestorProfileResponse!=null && requestorProfileResponse){
       requesterUserObj.requesterUserGivenName = requestorProfileResponse.givenName
       requesterUserObj.requesterUserId = requestorProfileResponse._id
       requesterUserObj.requesterUserMail = requestorProfileResponse.mail
       requesterUserObj.requesterUserSn = requestorProfileResponse.sn
       requesterUserObj.requesterUserUsername = requestorProfileResponse.userName
      }   
       customJSONObj.requesterUser = requesterUserObj
  
       page.pageNumber = Number(payload.pageNumber)
       for(let i=0;i<payload.endpointRequest.requestParams.length;i++){
         valuesJSON = {
           fieldName: null,
           fieldValue: null
         }
         reqParams = payload.endpointRequest.requestParams[i]
         page.fields[reqParams.serviceParamName] = reqParams.value.toString()
         valuesJSON.fieldName = reqParams.serviceParamName
         valuesJSON.fieldValue = reqParams.value.toString()
         page.values.push(valuesJSON)
       }

       customJSONObj.page = page
      
       const body = {
          custom: customJSONObj,
          common: {
              expiryDate:identityServer.getProperty("esv.workflow.expirydate")
          }
        }

        logger.error("Generic Workflow Body is "+ JSON.stringify(body));
        workflowResponse = openidm.action(payload.endpointRequest.endpoint.url, "POST", body,{});
        logger.error("Generic Workflow Response is "+ JSON.stringify(workflowResponse));

        //return workflowResponse
        
        return {
          "code":201,
          "status":"success",
          "message":"success"
        }
      
    } catch(error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
    }
}


/**
* @name <invokeTrainingEndpt>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeTrainingEndpt(standardRequest,serviceEndptRequestObj,apiRequestPayload){
  logger.error("Inside invokeTrainingEndpt")
  let funcName = "invokeTrainingEndpt"
  let responseTrainingEndptAPI = null
  let url = null
  let payload = {
  	KOGID: null,
  	TrainingModuleNames: null
  }
  let requestBody = {
    url:null,
    scope:identityServer.getProperty("esv.usertrainingscompletioncheck.api.scope"),
    method:"POST",
    payload:null
  }
  let apiResult = {
    code:400,
    ResponseStatus:null,
    message:null
  }
  
  try{
      if(serviceEndptRequestObj.endpoint.url!=null && serviceEndptRequestObj.endpoint.url){
        requestBody.url = serviceEndptRequestObj.endpoint.url

        //Create Payload for KOG Training Endpoint
        payload.KOGID = standardRequest.context.requestedUser.userName
        logger.error("Value of KOGID - "+payload.KOGID)
        if(standardRequest.payload.TrainingModuleNames!=null){
          logger.error("Value of TrainingModuleNames - "+standardRequest.payload.TrainingModuleNames)
          payload.TrainingModuleNames = [standardRequest.payload.TrainingModuleNames]
        }

        if(payload.KOGID==null){
          logger.error("UserID_Not_Found for invokeTrainingEndpt")
          apiResult.message = "UserID_Not_Found"
          return apiResult
        }

        if(payload.TrainingModuleNames==null){
          logger.error("Training_Modules_Not_Configured for invokeTrainingEndpt")
          apiResult.message = "Training_Modules_Not_Configured"
          return apiResult
        }
        
        requestBody.payload = payload
        logger.error("Request Body for invokeTrainingEndpt is - "+JSON.stringify(requestBody))
        responseTrainingEndptAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("responseTrainingEndptAPI in invokeTrainingEndpt is - "+JSON.stringify(responseTrainingEndptAPI))

        if(responseTrainingEndptAPI!=null && responseTrainingEndptAPI){
          
          if(responseTrainingEndptAPI.response.ResponseStatus==0){
            apiResult.ResponseStatus = responseTrainingEndptAPI.response.ResponseStatus
            apiResult.code = responseTrainingEndptAPI.status

            if(responseTrainingEndptAPI.response.UserTrainingsStatus!=null){
              let validateStatus = responseTrainingEndptAPI.response.UserTrainingsStatus
              let listTrainings = payload.TrainingModuleNames
              let pendingCompletion = []
              
              for(let j=0;j<validateStatus.length;j++){
                if(listTrainings.includes(validateStatus[j].TrainingModuleName)){
                  logger.error("Training Found")
                  if(!validateStatus[j].IsTrainingCompleted){
                    pendingCompletion.push(validateStatus[j].TrainingModuleName)
                  }
                }
              }
              
              if(pendingCompletion.length==0){
                /*
                  apiResult.message = "You've completed the required trainings. Please click continue to proceed with the request."
                  //patch user prerequisite status as "COMPLETED"
                  patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"COMPLETED")
                 */ 
                apiResult.message = "<p>You've completed the required trainings. Please click continue to proceed with the request.</p>"
                //patch user prerequisite status as "COMPLETED"
                patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"COMPLETED")
                
              } else {
                /*
                  apiResult.message = "You need to complete the below trainings to get the required access - "+pendingCompletion
                  //patch user prerequisite status as "PENDING"
                  patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"PENDING")
                */
                apiResult.message = "<p>You need to complete the below trainings to get the required access - </p>"
                let url = "https://"+identityServer.getProperty('esv.envtype')+".kog.ky.gov/account/UserTraining2.aspx?TrainingModule="
                pendingCompletion.forEach(pendingItem =>{
                   //apiResult.message =  apiResult.message + "<a target='_blank' href='https://'+identityServer.getProperty('esv.envtype')+'.kog.ky.gov/account/UserTraining2.aspx?TrainingModule="+encodeURI(pendingItem)+"'>"+pendingItem+"</a>"
                     apiResult.message =  apiResult.message + "<a target='_blank' href="+url+encodeURI(pendingItem)+">"+pendingItem+"</a>"
                })
                apiResult.message =  apiResult.message
                //patch user prerequisite status as "PENDING"
                patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"PENDING")
              }

              logger.error("apiResult in invokeTrainingEndptAPI - "+JSON.stringify(apiResult))
              return apiResult
              
            } else {
               logger.error("UserTrainingsStatus_Key_Missing in invokeTrainingEndptAPI Response")
               apiResult.message = "UserTrainingsStatus_Key_Missing"
               return apiResult
            }
            
          } else {
            apiResult.ResponseStatus = responseTrainingEndptAPI.response.ResponseStatus
            apiResult.message = responseTrainingEndptAPI.response.MessageResponses
            apiResult.code = responseTrainingEndptAPI.status
            return apiResult
          }
        }

      } else {
        logger.error("Training_Endpoint_Url_Not_Configured for invokeTrainingEndpt")
        apiResult.message = "Training_Endpoint_Url_Not_Configured"
        return apiResult
      }
      
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <isResponseParamPresent>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function isResponseParamPresent(resultParams,prereqTypeResponse,result){
  logger.error("Inside isResponseParamPresent")
  let funcName = "isResponseParamPresent"
  let response = null
  let field = null
  let value = null
  let paramName = null
  let fieldsArray = null
  
  try{
    fieldsArray = prereqTypeResponse.fields
    for(let i=0; i<fieldsArray.length; i++){
    //logger.error("Field "+ (i+1)+" is -"+fieldsArray[i])
      value = null
      field = fieldsArray[i]
      if(field.onloadResponseServiceParameterName!=null && field.onloadResponseServiceParameterName){
        paramName = field.onloadResponseServiceParameterName
        if(resultParams.includes(paramName)){
          logger.error("Field response parameter found in endpoint result - "+paramName)
          for(let j=0;j<fieldsArray.length;j++){
            if(fieldsArray[j].name==paramName){
              prereqTypeResponse.fields[j].value=result[paramName]
            }
          }
        }
      }   
    }

    return prereqTypeResponse
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


//************* Process Submitted Page **************//


/**
* @name <processPageDetails>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function processPageDetails(apiRequestPayload,standardRequest){
  logger.error("Inside processPageDetails")
  let apiName = "submitPageAPI"
  let funcName = "processPageDetails"
  let submitEndpoint = null
  let pageResponse = null
  let userProfileResponse = null
  let requestorProfileResponse = null
  let prerequisiteResponse = null
  let userPrerequisiteResponse = null
  let patchUserPrereqResponse = null
  let serviceEndptRequestObj = null
  let serviceEndptConfig = null
  let serviceEndptResponse = null
  let workflowInputJSON = {}
  let saveInput = true
  let expiryDate = null
  let apiResponse = {
     "status":null,
     "message":null
  }
  let prereqName = null
  let workflowResponse = null
  let payloadKOGCredentialsAPI = null
  let payloadUserOnboardingAPI = null
  let responseKOGCredentialsAPI = null
  let responseUserOnboardingAPI = null
  let requestorPayload = {}
  const requestBody = {
            "payload": apiRequestPayload,
            "action": 2 //Get
        }
  
  try{
  //Validates whether all the Mandatory Input Parameters are present or not
    if(isMandatoryInputPresent(apiRequestPayload, apiName).length>0){ 
      return { code: 400, message: 'Missing_Mandatory_Input_Parameters - '+isMandatoryInputPresent(apiRequestPayload,apiName) }
      //return logErrorDetails(-2,"Missing_Mandatory_Input_Parameters",createlogDetailsJSON(funcName,isMandatoryInputPresent(apiRequestPayload,apiName),732))
   
    } else {
        //Validate If required input parameters are ACTIVE in system
        userProfileResponse = getUserAccount(requestBody)
        if(userProfileResponse.code != 400){
          //Check if prerequisite is in NOT_STARTED (0) state or not in User Prerequisite
          userPrerequisiteResponse = getUserPrerequisite(requestBody)

          standardRequest.context.requestedUser.userName = userProfileResponse.userName
          logger.error("userPrerequisiteResponse.result.requesterUserAccountId in processPageDetails- "+userPrerequisiteResponse.result.requesterUserAccountId)
          logger.error("standardRequest.context.requestorUser.userName in processPageDetails- "+standardRequest.context.requestorUser.userName )
          //Getting Requestor Profile Info
          if(userPrerequisiteResponse.result.requesterUserAccountId!=null){
            requestorPayload.requestedUserAccountId = userPrerequisiteResponse.result.requesterUserAccountId
          } else {
            requestorPayload.requestedUserAccountId = standardRequest.context.requestorUser.userName 
          }
          
          requestBody.payload = requestorPayload
          logger.error("Payload for Requestor in processPageDetails is - "+JSON.stringify(requestorPayload))
          requestorProfileResponse = getUserAccount(requestBody)
          if(requestorProfileResponse.code != 400){
            logger.error("Response for Requestor in processPageDetails is - "+JSON.stringify(getUserAccount(requestBody)))
            standardRequest.context.requestorUser.userName = requestorProfileResponse.userName
          } else {
            standardRequest.context.requestorUser.userName = userProfileResponse.userName
            /*logger.error("Requestor_Not_Active_In_System") 
            return { code: 400, message: 'Requestor_Not_Active_In_System' }*/
          }  
          
          if(userPrerequisiteResponse["status"] === "Found"){       
            //Get the configured page settings associated with prerequisite type
            pageResponse = getPrerequisitePage(apiRequestPayload)

            if(pageResponse.code != 400){
            //Read the data provided by the user for the dynamic page
             //isPageElementsValidationSuccess(apiRequestPayload.pageElements,pageResponse.fields,userProfileResponse)
              
              //Checks if onSubmit Endpoint is Present. 
              if(pageResponse.onSubmitServiceEndpoint.endpointName!=null && pageResponse.onSubmitServiceEndpoint.endpointName){
                onSubmitEndpoint = pageResponse.onSubmitServiceEndpoint.endpointName
                logger.error("onSubmit Endpoint is - "+onSubmitEndpoint)
                logger.error("Fields array length - "+pageResponse.fields.length)   
                
                if(pageResponse.fields!=null && pageResponse.fields && pageResponse.fields.length>0){
                  //Validate if onSubmit service endpoint is configured
                  serviceEndptConfig = getSubmitEndpoint(onSubmitEndpoint)
                  
                  if(serviceEndptConfig.code != -9 || serviceEndptConfig.code != 400){
                    //Creates Request for Endpoint
                    logger.error("pageResponse.response - "+JSON.stringify(pageResponse))
                    serviceEndptRequestObj = createOnSubmitEndptRequest(pageResponse,apiRequestPayload.pageElements,serviceEndptConfig)    
                    
                     if(serviceEndptRequestObj!=null){
                        /* Get value of enrollmentActionSettings.saveInput flag from Prerequisite. This flag determines if 
                         the verified inputs of the pre-requisite should be saved within the platform */
                         prerequisiteResponse = getPrerequisite(apiRequestPayload.preReqId)
                             
                         if(prerequisiteResponse.code != -15){
                           if(prerequisiteResponse.result[0].expiry.dueDateType!=null){
                              expiryDate = getExpiryDate(prerequisiteResponse.result[0].expiry.dueDateType, prerequisiteResponse.result[0].expiry.dueDateValue)
                              logger.error("expiry DateType in processPageDetails - "+prerequisiteResponse.result[0].expiry.dueDateType)
                            } 
                            prereqName = prerequisiteResponse.result[0].name

                            //Is Configured endpoint of workflow type
                            if(serviceEndptConfig.isWorkflow){
                                logger.error("Execute Workflow")
                                workflowInputJSON["pageNumber"] = pageResponse.pageNumber
                                workflowInputJSON["endpointRequest"] = serviceEndptRequestObj
                                workflowInputJSON["userPrerequisiteId"] = userPrerequisiteResponse.result._id
                                workflowResponse = invokeWorkflow(workflowInputJSON,userProfileResponse,requestorProfileResponse,
                                                                  userPrerequisiteResponse.result,prereqName,serviceEndptRequestObj,
                                                                  expiryDate,standardRequest)
                                apiResponse.status = workflowResponse.status
                                apiResponse.message = workflowResponse.message
                                
                                return apiResponse
                              
                             } else {
                                 logger.error("Not a Workflow")
                                 if(pageResponse.onSubmitServiceEndpoint.successResponseParameterVaues!=null 
                                    && pageResponse.onSubmitServiceEndpoint.successResponseParameterVaues){
                                 logger.error("Endpoint success Response Params are - "+JSON.stringify(pageResponse.onSubmitServiceEndpoint))
                                 //Invoke 3rd Party service endpoint
                                 serviceEndptResponse = invokeServiceEndpoint(serviceEndptRequestObj,pageResponse.onSubmitServiceEndpoint.successResponseParameterVaues,
                                                                              serviceEndptConfig,apiRequestPayload,userProfileResponse,userPrerequisiteResponse.result,
                                                                              standardRequest)
     
                                 if(serviceEndptResponse.code == 200 ){                  
                                    if(serviceEndptResponse.ResponseStatus == 200 || serviceEndptResponse.ResponseStatus == 0){
        
                                         if(serviceEndptConfig.isOrgType){
                                             //Patch UserPrerequisite Record with "COMPLETED" status
                                              patchUserPrereqResponse = patchUserPrerequisite(apiRequestPayload,userPrerequisiteResponse.result._id,
                                                                                              null,expiryDate,"COMPLETED")
                                              apiResponse.status = patchUserPrereqResponse.status
                                              apiResponse.message = patchUserPrereqResponse.message
                                              if(pageResponse.nextPageNumber!=null)
                                              {
                                                apiResponse.preReqNextPage.pageNumber = pageResponse.nextPageNumber
                                                apiResponse.preReqNextPage.enrollmentRequestId=apiRequestPayload.enrollmentRequestId
                                                apiResponse.preReqNextPage.userPrereqId=apiRequestPayload.userPrereqId
                                                apiResponse.preReqNextPage.preReqId=apiRequestPayload.preReqId
                                                apiResponse.preReqNextPage.preReqTypeId=apiRequestPayload.preReqTypeId
                                              }
                                            
                                              return apiResponse 
                                          
                                           } else {
                                               saveInput = prerequisiteResponse.result[0].enrollmentActionSettings.saveInput 
                                               logger.error("prerequisiteResponse in processPageDetails - "+prerequisiteResponse.result[0].enrollmentActionSettings.saveInput)
                                               
                                               if(saveInput){ //saveInput=true                               
                                                  payloadKOGCredentialsAPI = getPayloadKOGCredentialsAPI(prereqName,userPrerequisiteResponse.result,serviceEndptRequestObj,
                                                                                                         expiryDate,standardRequest)
                                                  if(payloadKOGCredentialsAPI != null){
                                                     //Call KOG credentials api
                                                     responseKOGCredentialsAPI = invokeKOGCredentialsAPI(payloadKOGCredentialsAPI)                               
                                                     if(responseKOGCredentialsAPI.code == 200){    //API status for success     
                                                       
                                                        if(responseKOGCredentialsAPI.ResponseStatus == 0){
                                                          
                                                          logger.error("Patch UserPrerequisite")
                                                           //Patch UserPrerequisite Record with "COMPLETED" status
                                                            patchUserPrereqResponse = patchUserPrerequisite(apiRequestPayload,userPrerequisiteResponse.result._id,
                                                                                                            serviceEndptRequestObj,expiryDate,"COMPLETED")
                                                            apiResponse.status = patchUserPrereqResponse.status
                                                            apiResponse.message = patchUserPrereqResponse.message
                                                            if(pageResponse.nextPageNumber!=null)
                                                            {
                                                              apiResponse.preReqNextPage.pageNumber = pageResponse.nextPageNumber
                                                              apiResponse.preReqNextPage.enrollmentRequestId=apiRequestPayload.enrollmentRequestId
                                                              apiResponse.preReqNextPage.userPrereqId=apiRequestPayload.userPrereqId
                                                              apiResponse.preReqNextPage.preReqId=apiRequestPayload.preReqId
                                                              apiResponse.preReqNextPage.preReqTypeId=apiRequestPayload.preReqTypeId
                                                            }
                                                            
                                                            return apiResponse                       
                                                          
                                                         } else {                                                
                                                              throw responseKOGCredentialsAPI
                                                        }
                                                      
                                                      } else{
                                                          throw responseKOGCredentialsAPI
                                                     }  
                                                    
                                                  } else {
                                                      logger.error("Error getting Credentials API payload")
                                                      throw { code: 400, message: 'ERROR_GETTING_CREDENTIALS_API_PAYLOAD' }  
                                                  }
              
                                                } else { //saveInput=false
                                                   payloadUserOnboardingAPI = getPayloadUserOnboardingAPI(prereqName,standardRequest)
                                                 
                                                   if(payloadUserOnboardingAPI != null){
                                                       //Call user onboarding api
                                                       responseUserOnboardingAPI = invokeUserOnboardingAPI(payloadUserOnboardingAPI)
                                                     
                                                       if(responseUserOnboardingAPI.code == 200){ //API status for success    
                                                         
                                                          if(responseUserOnboardingAPI.ResponseStatus == 0){
                                                             //Patch UserPrerequisite Record with "COMPLETED" status
                                                              patchUserPrereqResponse = patchUserPrerequisite(apiRequestPayload,userPrerequisiteResponse.result._id,
                                                                                                              null,expiryDate,"COMPLETED")
                                                              apiResponse.status = patchUserPrereqResponse.status
                                                              apiResponse.message = patchUserPrereqResponse.message
                                                              if(pageResponse.nextPageNumber!=null)
                                                              {
                                                                apiResponse.preReqNextPage.pageNumber = pageResponse.nextPageNumber
                                                                apiResponse.preReqNextPage.enrollmentRequestId=apiRequestPayload.enrollmentRequestId
                                                                apiResponse.preReqNextPage.userPrereqId=apiRequestPayload.userPrereqId
                                                                apiResponse.preReqNextPage.preReqId=apiRequestPayload.preReqId
                                                                apiResponse.preReqNextPage.preReqTypeId=apiRequestPayload.preReqTypeId
                                                              }
                                                            
                                                              return apiResponse                       
                
                                                           } else {
                                                              throw responseUserOnboardingAPI
                                                          }
                                                         
                                                        } else{
                                                           throw responseUserOnboardingAPI
                                                       }
                                                     
                                                    } else {
                                                        logger.error("Error getting UserOnboarding API payload")
                                                        throw { code: 400, message: 'ERROR_GETTING_USER_ONBOARDING_API_PAYLOAD' } 
                                                  }
                                                }
                                           
                                           }                                           
      
                                        } else {
                                           throw serviceEndptResponse
                                       }
      
                                    } else {
                                     throw serviceEndptResponse
                                   }

                               } else {
                                  logger.error("No value present for successResponseParameterVaues")
                                  throw { code: 400, message: 'MisConfiguration_onSubmitServiceEndpoint_SuccessResponseParameterVaues' } 
                              }
                              
                           }  //END OF ELSE
                                     
                        } else {
                           throw prerequisiteResponse
                       }

                     } else {
                         logger.error("No request available to invoke service endpoint for Submit action")
                         throw { code: 400, message: 'Submit_Endpoint_Request_Not_Available' } 
                    }
                      
                   } else {
                      throw serviceEndptConfig
                  }

                 } else {
                    logger.error("Configured page has no fields")
                    throw { code: 400, message: 'MisConfiguration_Page_Has_No_Fields' } 
                }
              
               } else {
                  logger.error("No submit Endpoint present")
                  throw { code: 400, message: 'MisConfiguration_Submit_Endpoint_Name' } 
              }         
          
             } else {
              throw pageResponse
            }
            
           } else {
            throw userPrerequisiteResponse
          }  

        } else {
          throw userProfileResponse
       }
        
    }
      
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <isPageElementsValidationSuccess>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function isPageElementsValidationSuccess(pageElements,pageConfig,userProfileResponse){
  logger.error("Inside readPageElements")
  let funcName = "isPageElementsValidationSuccess"
  let pageElementsJSON = null
  let pageSubmitElementMap = new Map()
  let pageConfigElementMap = new Map()
  let pageSubmitElementValueJSON = {}
  let pageConfigElementValueJSON = {}
  let key = null
  let value = null
  let result = {
    "status":false,
    "error":null
  }
  let logDetailJSON = {}

  try{
     logger.error("Length of pageElements array is -"+pageElements.length)
     if(pageElements.length>0){
        if(pageElements.length==pageConfig.length){
           for(let i=0;i<pageElements.length;i++){
             key = pageElements[i].name
             value = pageElements[i]
             pageSubmitElementMap.set(key,value)
             logger.error("pageSubmitElementMap value is - "+JSON.stringify(pageSubmitElementMap.get(key)))
             key = pageConfig[i].name
             value = pageConfig[i]
             pageConfigElementMap.set(key,value)
             logger.error("pageConfigElementMap value is - "+JSON.stringify(pageConfigElementMap.get(key)))
           }
           for (let key of pageSubmitElementMap.keys()) {
             if (!pageConfigElementMap.has(key)) {
               //Key from pageSubmitElementMap not found in pageConfigElementMap
               logger.error("pageElement in Input Request not found in the configured page")
               result.error = logErrorDetails(-13,'Mismatch_Page_Elements',createlogDetailsJSON(funcName,null,977))
               return result
              } else {
                 pageSubmitElementValueJSON = pageSubmitElementMap.get(key)
                 pageConfigElementValueJSON = pageConfigElementMap.get(key)
                 //Compare Input Element Type with Configured Page Type
                 if(pageSubmitElementValueJSON.type===pageConfigElementValueJSON.type){
                    validateElement(key,pageSubmitElementValueJSON,pageConfigElementValueJSON,userProfileResponse)
                   
                 } else {
                   logger.error("pageElement type in Input Request doesn't match with configured page element type")
                   result.error = logErrorDetails(-14,'Mismatch_Page_Element_Type',createlogDetailsJSON(funcName,null,988))
                   return result
                 }
              }
           }
             
        } else {
          logger.error("Total pageElements in Input Request must match with configured page elements")
          result.error = logErrorDetails(-12,'Invalid_TOT_Page_Elements',createlogDetailsJSON(funcName,null,996))
          return result
        }
     } else {
        logger.error("pageElements in Input Request must have atleast 1 field")
        result.error = logErrorDetails(-10,'Page_Has_No_Fields',createlogDetailsJSON(funcName,null,1001))
        return result
     }
     
    logger.error("Result of isPageElementsValidationSuccess is - "+JSON.stringify(result))

  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <validateElement>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function validateElement(element,pageElementJSON,pageConfigJSON,userProfileResponse){
  logger.error("Inside validateElement")
  let funcName = "validateElement"
  let type = null
  let elementType = null
  let elementValue = null
  let configValidationArray = null
  let configOptionsArray = null
  let validationResult = []
  let validationResultJSON = {
    "element":null,
    "error":null
  }
  
  try{
    elementType = pageElementJSON.type
    elementValue =  pageElementJSON.value
    configValidationArray = pageConfigJSON.validation
    configOptionsArray = pageConfigJSON.options
    
    if(elementType === "text" || elementType === "textarea"){
        type = "text";
    } else if(elementType === "select"|| elementType === "radio"){
        type = "select";
    } else{
        type = elementType
    }
    
    switch(type) {
          case "text":
              logger.error("Required Validation Check")
              result = validateText(element,elementValue,configValidationArray,userProfileResponse)
            break
          case "select":
            break
          case "checkbox":
            break
          case "date":
            break
          case "phoneNumber":
            break
          case "address":
            break
          default:
            return logErrorDetails(-6,'Reference_Property_Value_NotFound',createlogDetailsJSON(funcName,null,1065))
            break
        }
    return validationResult
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <validateText>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function validateText(element,elementValue,configValidationArray,userProfileResponse){
  logger.error("Inside validateText")
  let funcName = "validateText"
  let validationJSONObj = null
  
  try{
    if(elementValue.length==1 & elementValue[0]!=null){
      let value = elementValue[0]
      for(let i=0;i<configValidationArray.length;i++){
        
      }
      
    } else {
      //validation fail
    }
    for(let i=0;i<configValidationArray.length;i++){

        
    }
    
  } catch (error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
} 


/**
* @name <getSubmitEndpoint>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getSubmitEndpoint(endptName){
  logger.error("Inside onSubmitEndpoint")
  let funcName = "validateText"
  const status = "ACTIVE"
  let serviceEndptConfig = null
  
  try{
      serviceEndptConfig = openidm.query("managed/alpha_kyid_enrollment_service_endpoint/", { "_queryFilter": '/name/ eq "' + endptName + '"'
        + ' AND (recordState eq "' + status + '" OR recordState eq "0")'}, ["*"])
      logger.error("Service Endpoint Configuration is - "+JSON.stringify(serviceEndptConfig))
      
      if(serviceEndptConfig.resultCount>0){
        serviceEndptConfig = serviceEndptConfig.result[0]
        if(!(serviceEndptConfig.url && serviceEndptConfig.url!=null)){
          return { code: 400, message: 'Endpoint_Url_Missing' }
        } else {
          return serviceEndptConfig
        }        
        
      } else {
          return logErrorDetails(-9,'Service_Endpoint_Configuration_Not_Found',createlogDetailsJSON(funcName,null,1134)) 
      }

    } catch(error){
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw createException(funcName,error)
    }
  
}


/**
* @name <createOnSubmitEndptRequest>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createOnSubmitEndptRequest(pageResponse,pageElements,serviceEndptConfig){
  logger.error("Inside createOnSubmitEndptRequest")
  let funcName = "createOnSubmitEndptRequest"
  let field = null
  let value = null
  let foundObject = null
  let fieldsArray = null
  let pageElementsJSON = null
  let requestParamsJSON = {}
  let requestParams = []
  let responseParamsJSON = {}
  let responseParams = []
  let serviceEndptRequestObj = {}

  try{
      fieldsArray = pageResponse.fields
      //Loop Begin
      for(let i=0; i<fieldsArray.length; i++){ 
      //logger.error("Field "+ (i+1)+" is -"+fieldsArray[i])
        field = null
        foundObject = null
        requestParamsJSON = {}
        responseParamsJSON = {}
        field = fieldsArray[i]
        //Create onSubmit Request Params
        if(field.onsubmitRequestServiceParameterName!=null && field.onsubmitRequestServiceParameterName){
          requestParamsJSON["fieldName"] = field.name
          requestParamsJSON["serviceParamName"] = field.onsubmitRequestServiceParameterName
          if(field.name!="Username" && field.name!="Password"){
            foundObject = pageElements.find(item => item.name === field.name)
            //logger.error("foundObject - "+JSON.stringify(foundObject))
            requestParamsJSON["value"] = foundObject.value.toString()         
          } else {
            requestParamsJSON["value"] = field.value
          }
          requestParams.push(requestParamsJSON)        
        }   
  
        //Create onSubmit Response Params
        if(field.onsubmitResponseServiceParameterName!=null && field.onsubmitResponseServiceParameterName){
          responseParamsJSON["fieldName"] = field.name
          responseParamsJSON["serviceParamName"] = field.onsubmitResponseServiceParameterName
          responseParams.push(responseParamsJSON)
        }  
        
      } //Loop End
  
      logger.error("requestParams in JSON is -"+JSON.stringify(requestParams))
      logger.error("responseParams in JSON is -"+JSON.stringify(responseParams))
      
      serviceEndptRequestObj["endpoint"] = serviceEndptConfig
      serviceEndptRequestObj["requestParams"] = requestParams
      serviceEndptRequestObj["responseParams"] = responseParams
  
      logger.error("Service Endpoint Request Object is - "+JSON.stringify(serviceEndptRequestObj))
      return serviceEndptRequestObj
    
  } catch(error){
     logger.error("Exception in "+funcName+" is - " + getException(error))
     throw createException(funcName,error)
  }
}


/**
* @name <invokeServiceEndpoint>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeServiceEndpoint(serviceEndptRequestObj,endptSuccessRespParams,serviceEndptConfig,
                               apiRequestPayload,userProfileResponse,userPrerequisiteResponse,
                               standardRequest){
  logger.error("Inside invokeServiceEndpoint")
  let funcName = "invokeServiceEndpoint"
  let payload = {}
  let ResponseCode = null
  let ResponseStatus = null
  let responseServiceEndpointAPI = null
  let validateResponseArray = null
  let serviceOutcome = false

   try{
     //Check if endpoint service type is WCF(1), REST(2) or SOAP(3)
    if(serviceEndptRequestObj.endpoint.protocol==1 || serviceEndptRequestObj.endpoint.protocol==3){
      payload = createSOAPWCFRequestPayload(serviceEndptRequestObj)
      
      if(payload!=null && endptSuccessRespParams!=null && payload && endptSuccessRespParams){
        responseServiceEndpointAPI = invokeSOAPWCFServiceEndpoint(payload,endptSuccessRespParams,serviceEndptRequestObj)
        logger.error("responseServiceEndpointAPI in invokeServiceEndpoint is - "+JSON.stringify(responseServiceEndpointAPI))
        
        if(responseServiceEndpointAPI!=null && responseServiceEndpointAPI){
          
            if(responseServiceEndpointAPI.serviceOutcome){ //If TRUE
               logger.error("serviceOutcome value in invokeServiceEndpoint is - "+responseServiceEndpointAPI.serviceOutcome) 
               ResponseCode = null
               if(responseServiceEndpointAPI.endptResponse.response.ResponseCode!=null && responseServiceEndpointAPI.endptResponse.response.ResponseCode.length>0){
                 ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseCode
               } else {
                 ResponseCode = 200
               }
               logger.error("ResponseCode in invokeServiceEndpoint is - "+ResponseCode)
               return {
                  "ResponseStatus":ResponseCode, 
                  "code":responseServiceEndpointAPI.endptResponse.status, 
                  "message":null
                }
              
            } else {
                validateResponseArray = Object.keys(responseServiceEndpointAPI.endptResponse)
                logger.error("validateResponseArray in invokeServiceEndpoint is - "+validateResponseArray)
                logger.error("responseServiceEndpointAPI in invokeServiceEndpoint contains Fault - "+validateResponseArray.includes("Fault"))
    
                if(!(validateResponseArray.includes("Fault"))){
                   ResponseCode = null
                   if(responseServiceEndpointAPI.endptResponse.response.ResponseCode!=null && responseServiceEndpointAPI.endptResponse.response.ResponseCode.length>0){
                     ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseCode
                   } else {
                     ResponseCode = 400
                   }
                  logger.error("ResponseCode in invokeServiceEndpoint is - "+ResponseCode)
                  return {
                    "ResponseStatus":ResponseCode,
                    "code":responseServiceEndpointAPI.endptResponse.status, 
                    "message":responseServiceEndpointAPI.endptResponse.response.ResponseMessage
                  }
                } else {
                   ResponseCode = null
                   if(responseServiceEndpointAPI.endptResponse.response.ResponseCode!=null && responseServiceEndpointAPI.endptResponse.response.ResponseCode.length>0){
                     ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseCode
                   } else {
                     ResponseCode = 400
                   }
                  logger.error("ResponseCode in invokeServiceEndpoint is - "+ResponseCode)
                  return {
                    "ResponseStatus":ResponseCode,
                    "code":responseServiceEndpointAPI.endptResponse.status,
                    "message":responseServiceEndpointAPI.endptResponse.response.Fault.Reason.Text
                  }
                }
              }
          } else {
              return {
                  "ResponseStatus":"failed",
                  "code":404, 
                  "message":"Service_Endpoint_API_InValid_Response"
              }
           }
       } 
      
    } else if(serviceEndptRequestObj.endpoint.protocol==2){

      if(serviceEndptRequestObj.endpoint.requestTransformationMethod!=null) {
        logger.error("Request Transformation Method is - "+serviceEndptRequestObj.endpoint.requestTransformationMethod)
        logger.error("standardRequest payload after update is - "+JSON.stringify(standardRequest))
        
        switch(serviceEndptRequestObj.endpoint.requestTransformationMethod){
          case 'triggerOrgType':
                logger.error("Execute OrgType Endpoint")
                payload = createOrgTypeRequestPayload(serviceEndptRequestObj,apiRequestPayload,
                                                      userPrerequisiteResponse,standardRequest)     
                if(payload!=null && payload){
                   responseServiceEndpointAPI = invokeOrgTypeServiceEndpoint(payload,endptSuccessRespParams,serviceEndptRequestObj)
                   logger.error("responseServiceEndpointAPI in invokeServiceEndpoint is - "+JSON.stringify(responseServiceEndpointAPI))
      
                   if(responseServiceEndpointAPI!=null && responseServiceEndpointAPI){
                      if(responseServiceEndpointAPI.serviceOutcome){ //If TRUE
                           logger.error("serviceOutcome value in invokeServiceEndpoint is - "+responseServiceEndpointAPI.serviceOutcome) 
                           ResponseCode = null
                           if(responseServiceEndpointAPI.endptResponse.response.ResponseStatus!=null && responseServiceEndpointAPI.endptResponse.response.ResponseStatus.length>0){
                             ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseStatus
                           } else {
                             return {
                                "ResponseStatus":"failed",
                                "code":404, 
                                "message":"Service_Endpoint_API_InValid_Response"
                              }
                           }
                        
                           return {
                              "ResponseStatus":ResponseCode, 
                              "code":responseServiceEndpointAPI.endptResponse.status, 
                              "message":null
                            }
                        
                        } else {
                            return {
                              "ResponseStatus":responseServiceEndpointAPI.endptResponse.response.ResponseStatus,
                              "code":responseServiceEndpointAPI.endptResponse.status, 
                              "message":responseServiceEndpointAPI.endptResponse.response.MessageResponses
                            }
                        }
                     } else {
                        return {
                            "ResponseStatus":"failed",
                            "code":404, 
                            "message":"Service_Endpoint_API_InValid_Response"
                          }
                      } 
                }
                break;
        default:
                return 'No Matching Function'
         }
        
      } else {
          payload = createRESTRequestPayload(serviceEndptRequestObj)
      
          if(payload!=null && payload){
            responseServiceEndpointAPI = invokeRESTServiceEndpoint(payload,endptSuccessRespParams,serviceEndptRequestObj)
            logger.error("responseServiceEndpointAPI in invokeServiceEndpoint is - "+JSON.stringify(responseServiceEndpointAPI))
            
            if(responseServiceEndpointAPI!=null && responseServiceEndpointAPI){
                if(responseServiceEndpointAPI.serviceOutcome){ //If TRUE
                     logger.error("serviceOutcome value in invokeServiceEndpoint is - "+responseServiceEndpointAPI.serviceOutcome) 
                     let ResponseCode = null
                     if(responseServiceEndpointAPI.endptResponse.response.ResponseCode!=null && responseServiceEndpointAPI.endptResponse.response.ResponseCode.length>0){
                       ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseCode
                     } else {
                       ResponseCode = 200
                     }
                  
                     return {
                        "ResponseStatus":ResponseCode, 
                        "code":responseServiceEndpointAPI.endptResponse.status, 
                        "message":null
                      }
                  
                } else {
                    return {
                      "ResponseStatus":responseServiceEndpointAPI.endptResponse.response.ResponseCode,
                      "code":responseServiceEndpointAPI.endptResponse.status, 
                      "message":responseServiceEndpointAPI.endptResponse.response.ResponseMessage
                    }
                }
             } else {
                return {
                    "ResponseStatus":"failed",
                    "code":404, 
                    "message":"Service_Endpoint_API_InValid_Response"
                }
              }       
            } 
         }
      
     } else {
         logger.error("Invalid Service Endpoint Protocol")
         return logErrorDetails(-21,'InValid_Service_Endpoint_Protocol',createlogDetailsJSON(funcName,null,1254))
    }

  } catch(error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
  }
}


/**
* @name <createOrgTypeRequestPayload>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createOrgTypeRequestPayload(serviceEndptRequestObj,apiRequestPayload,
                                     userPrerequisiteResponse,standardRequest){
   logger.error("Inside createOrgTypeRequestPayload")
   let funcName = "createOrgTypeRequestPayload"
   const currentTimeinEpoch = Date.now();
   const currentDate = new Date().toISOString();
   let requestorProfileResponse = null
   let enrolmentRequestResponse = null
   let roleContext = null
   let values = null

    try{
      let payload = {
          KOGID: null,
          KOGOrgID:null,
          TransactionID: null,
          RequestorKOGID: null,
          ApplicationName: null,
          RoleName: null,
          KOGOrgUserQA:[]
      } 

       if(getEnrollmentRequest(apiRequestPayload)!=null){
         enrolmentRequestResponse = getEnrollmentRequest(apiRequestPayload)
         if(enrolmentRequestResponse.roleContext!=null && enrolmentRequestResponse.roleContext.length>0){
            roleContext = enrolmentRequestResponse.roleContext[0] //Current only 0th value is been taken as KOG API expects on one value not array of values
            logger.error("Value of roleContext is - "+JSON.stringify(roleContext))
           
         } else {
            return { code: 400, message: 'Misconfigured_RoleContext' }
         } 
       }
  
       if(serviceEndptRequestObj!=null && serviceEndptRequestObj){
         if(values!=null){
            values = getprerequisiteValuesForOrgTypeAPI(serviceEndptRequestObj)
         
         } else {
            return { code: 400, message: 'InValid_Payload_OrgType' }
         }
        
       }
  
       payload.KOGID = standardRequest.context.requestedUser.userName
       payload.KOGOrgID = roleContext.orgId
       payload.TransactionID = standardRequest.context.transactionId
       payload.RequestorKOGID = standardRequest.context.requestorUser.userName
       payload.ApplicationName = roleContext.appName
       payload.RoleName = roleContext.roleName
       payload.KOGOrgUserQA = values
       logger.error("getPayloadOrgTypeAPI is - "+JSON.stringify(payload))

       return payload
    
   } catch(error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
   }

}


/**
* @name <getEnrollmentRequest>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getEnrollmentRequest(apiRequestPayload){
   logger.error("Inside getEnrollmentRequest")
   let funcName = "getEnrollmentRequest"
   try {
        var response = openidm.query("managed/alpha_kyid_enrollment_request/", { "_queryFilter": '/_id/ eq "' + apiRequestPayload.enrollmentRequestId + '"' 
          +' AND status eq "0" OR status eq "IN_PROGRESS"' 
          +' AND (recordState eq "ACTIVE" OR recordState eq "0")'}, ["*"]);

        if (response.resultCount > 0) {
            return response
        } else {
            return null
        }
    } catch (error) {
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw createException(funcName,error)
    }
}


/**
* @name <getprerequisiteValuesForOrgTypeAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getprerequisiteValuesForOrgTypeAPI(serviceEndptRequestObj){
  logger.error("Inside getprerequisiteValuesForOrgTypeAPI - "+JSON.stringify(serviceEndptRequestObj))
  let funcName = "getprerequisiteValuesForOrgTypeAPI"
  let valuesJSON = null
  let values = []

  try{
      if(serviceEndptRequestObj!=null && serviceEndptRequestObj){
        for(let i=0;i<serviceEndptRequestObj.requestParams.length;i++){
          valuesJSON = {
           "Question": null,
           "Answers": null
           }
         
         reqParams = serviceEndptRequestObj.requestParams[i]
         valuesJSON.Question = reqParams.serviceParamName
         valuesJSON.Answers = [reqParams.value.toString()]
         values.push(valuesJSON)
       }
        logger.error("getprerequisiteValuesForOrgTypeAPI response is - "+JSON.stringify(values))
        if(values!=null){
          return values
        } else {
          return null
        }
        
      } else {
          return logErrorDetails(-18,'SERVICE_ENDPOINT_REQUEST_OBJECT_EMPTY',createlogDetailsJSON(funcName,null,1937))
      }
    
   } catch (error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
   }
}


/**
* @name <invokeOrgTypeServiceEndpoint>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeOrgTypeServiceEndpoint(payload,endptSuccessRespParams,serviceEndptRequestObj){
  logger.error("Inside invokeOrgTypeServiceEndpoint")
  let funcName = "invokeOrgTypeServiceEndpoint"
  let responseOrgTypeAPI = null
  let validateResponseArray = null
  let requestBody = {
    url:identityServer.getProperty("esv.addupdateorguserqas.api"),
    scope:identityServer.getProperty("esv.addupdateorguserqas.api.scope"),
    method:"POST",
    payload:payload
  }
  let result = {
     serviceOutcome: false,
     endptResponse: {}
   }
  
  try{
    logger.error("Request Body for invokeOrgTypeServiceEndpoint is - "+JSON.stringify(requestBody))
    responseOrgTypeAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
    logger.error("responseOrgTypeAPI in invokeOrgTypeServiceEndpoint is - "+JSON.stringify(responseOrgTypeAPI))
    if(responseOrgTypeAPI!=null && responseKOGCredentialresponseOrgTypeAPIsAPI){
      validateResponseArray = Object.keys(responseOrgTypeAPI.response)
      logger.error("validateResponseArray - "+validateResponseArray)
      
      for(let i=0;i<endptSuccessRespParams.length;i++){
          let paramName = endptSuccessRespParams[i].paramName
          logger.error("endptSuccessRespParams paramName - "+i+" is - "+paramName)
          let paramValue = endptSuccessRespParams[i].paramValue        
          logger.error("endptSuccessRespParams paramValue - "+i+" is - "+paramValue)
          if(validateResponseArray.includes(paramName)){
              logger.error("Name in response from API matches with config - "+paramName)
              let respParamValue =  responseServiceEndpointAPI.response[paramName].toString()
              if(paramValue == respParamValue){
                logger.error("Value in response from API matches with config - "+respParamValue)
                result.serviceOutcome = true
              } else{
                logger.error("Value in response from API doesn't match with config - "+paramValue)
                result.serviceOutcome = false                 
                break
              }     
           }
        } //END FOR LOOP
      
    }
    logger.error("serviceOutcome value in invokeOrgTypeServiceEndpoint is - "+result.serviceOutcome)
    result.endptResponse = responseServiceEndpointAPI
    return result
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <createSOAPWCFRequestPayload>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createSOAPWCFRequestPayload(serviceEndptRequestObj){
   logger.error("Inside createSOAPWCFRequestPayload")
   let funcName = "createSOAPWCFRequestPayload"
   let reqParams = {}
   let serviceParamsSOAP = {}
   
   try{
      for(let i=0;i<serviceEndptRequestObj.requestParams.length;i++){
        reqParams = serviceEndptRequestObj.requestParams[i]
        serviceParamsSOAP[reqParams.serviceParamName] = reqParams.value.toString()
     }
     logger.error("SOAP/WCF serviceParamsSOAP is - "+JSON.stringify(serviceParamsSOAP))
     return serviceParamsSOAP
    
   } catch(error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
   }

}


/**
* @name <createRESTRequestPayload>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createRESTRequestPayload(serviceEndptRequestObj){
   logger.error("Inside createRESTRequestPayload")
   let funcName = "createRESTRequestPayload"
   let reqParams = {}
   let serviceParamsREST = {}
   
   try{
     for(let i=0;i<serviceEndptRequestObj.requestParams.length;i++){
        reqParams = serviceEndptRequestObj.requestParams[i]
        serviceParamsREST[reqParams.serviceParamName] = reqParams.value.toString()
     }
     logger.error("serviceParamsREST is - "+JSON.stringify(serviceParamsREST))
     return serviceParamsREST
    
   } catch(error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
   }

}


/**
* @name <createRESTRequestPayload>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeSOAPWCFServiceEndpoint(payload,endptSuccessRespParams,serviceEndptRequestObj){
   logger.error("Inside invokeSOAPWCFServiceEndpoint")
   let funcName = "invokeSOAPWCFServiceEndpoint"
   let responseServiceEndpointAPI = null
   let validateResponseArray = null
   let result = {
     serviceOutcome: false,
     endptResponse: {}
   }
   let requestBody = {
        url:null,
        method:"POST",
        payload:null
    }

   try{
     
      if(serviceEndptRequestObj.endpoint!=null && serviceEndptRequestObj.endpoint){
        requestBody.url = serviceEndptRequestObj.endpoint.url
      }
      requestBody.payload = payload
    
      logger.error("requestBody in invokeSOAPWCFServiceEndpoint is - "+JSON.stringify(requestBody)) 
      responseServiceEndpointAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
      logger.error("responseServiceEndpointAPI in invokeSOAPWCFServiceEndpoint is - "+JSON.stringify(responseServiceEndpointAPI))
      
      if(responseServiceEndpointAPI!=null && responseServiceEndpointAPI){  
           validateResponseArray = Object.keys(responseServiceEndpointAPI.response)
           logger.error("validateResponseArray - "+validateResponseArray)
           logger.error("responseServiceEndpointAPI in invokeSOAPWCFServiceEndpoint contains Fault - "+validateResponseArray.includes("Fault"))

           if(!(validateResponseArray.includes("Fault"))){
             logger.error("endptSuccessRespParams in invokeSOAPWCFServiceEndpoint - "+endptSuccessRespParams)
             for(let i=0;i<endptSuccessRespParams.length;i++){
                let paramName = endptSuccessRespParams[i].paramName
                logger.error("endptSuccessRespParams paramName - "+i+" is - "+paramName)
                let paramValue = endptSuccessRespParams[i].paramValue        
                logger.error("endptSuccessRespParams paramValue - "+i+" is - "+paramValue)
                if(validateResponseArray.includes(paramName)){
                    logger.error("Name in response from API matches with config - "+paramName)
                    let respParamValue =  responseServiceEndpointAPI.response[paramName].toString()
                    if(paramValue == respParamValue){
                      logger.error("Value in response from API matches with config - "+respParamValue)
                      result.serviceOutcome = true
                    } else{
                      logger.error("Value in response from API doesn't match with config - "+paramValue)
                      result.serviceOutcome = false                 
                      break
                    }     
                 }
              }   
           }
        }
      logger.error("serviceOutcome value in invokeSOAPWCFServiceEndpoint is - "+result.serviceOutcome)
      result.endptResponse = responseServiceEndpointAPI
      return result
     
    } catch(error){
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw createException(funcName,error)
   }

}


/**
* @name <invokeRESTServiceEndpoint>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeRESTServiceEndpoint(payload,endptSuccessRespParams,serviceEndptRequestObj){
   logger.error("Inside invokeRESTServiceEndpoint")
   let funcName = "invokeRESTServiceEndpoint"
   let responseServiceEndpointAPI = null
   let validateResponseArray = null
   let result = {
     serviceOutcome: false,
     endptResponse: {}
   }
  
   let requestBody = {
      url:null,
      method:"POST",
      requestType: "REST",
      //protectionType: "basic",
      authType:"None",
      headers: {
         "Content-Type": "application/json"
       },
      credentials: {
         username: null,
         password: null
       },
      body: null
    }

    try{
      if(serviceEndptRequestObj.endpoint!=null && serviceEndptRequestObj.endpoint){
        requestBody.url = serviceEndptRequestObj.endpoint.url
        
        if(serviceEndptRequestObj.endpoint.username!=null && serviceEndptRequestObj.endpoint.password){
          requestBody.credentials.username = serviceEndptRequestObj.endpoint.username
          requestBody.credentials.password = serviceEndptRequestObj.endpoint.password
          requestBody.authType = "basic"
        }
        
        requestBody.body = payload  
        logger.error("API Request Body in invokeRESTServiceEndpoint is - "+JSON.stringify(requestBody))
        responseServiceEndpointAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("responseServiceEndpointAPI in invokeRESTServiceEndpoint is - "+JSON.stringify(responseServiceEndpointAPI))
        
        if(responseServiceEndpointAPI!=null && responseServiceEndpointAPI){          
          validateResponseArray = Object.keys(responseServiceEndpointAPI.response)
          logger.error("validateResponseArray - "+validateResponseArray)

          for(let i=0;i<endptSuccessRespParams.length;i++){
                let paramName = endptSuccessRespParams[i].paramName
                logger.error("endptSuccessRespParams paramName - "+i+" is - "+paramName)
                let paramValue = endptSuccessRespParams[i].paramValue        
                logger.error("endptSuccessRespParams paramValue - "+i+" is - "+paramValue)
                if(validateResponseArray.includes(paramName)){
                    logger.error("Name in response from API matches with config - "+paramName)
                    let respParamValue =  responseServiceEndpointAPI.response[paramName].toString()
                    if(paramValue == respParamValue){
                      logger.error("Value in response from API matches with config - "+respParamValue)
                      result.serviceOutcome = true
                    } else{
                      logger.error("Value in response from API doesn't match with config - "+paramValue)
                      result.serviceOutcome = false                 
                      break
                    }     
                 }
            } 
            result.endptResponse = responseServiceEndpointAPI
            return result
        }
      }      
      
    } catch(error){
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw createException(funcName,error)
    }  
}
  

/**
* @name <invokeWorkflow>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeWorkflow(payload,userProfileResponse,requestorProfileResponse,
                        userPrerequisiteResponse,prereqName,serviceEndptRequestObj,
                        expiryDate,standardRequest){
   logger.error("Inside invokeWorkflow")
   //logger.error("invokeWorkflow input payload is - "+JSON.stringify(payload))
   //logger.error("userProfileResponse is - "+JSON.stringify(userProfileResponse))
   //logger.error("userPrerequisiteResponse is - "+JSON.stringify(userPrerequisiteResponse))
   let funcName = "invokeWorkflow"
   let workflowResponse = null
   let customJSONObj = {
     userPrerequisiteId:null
   }
   let reqParams = {}
   let valuesJSON = null
  
   let requesterUserObj = {
			requesterUserGivenName: null,
			requesterUserId: null,
			requesterUserMail: null,
			requesterUserSn: null,
			requesterUserUsername: null
		}
  
   let requestedUserObj = {
      requestedUserGivenName: null,
			requestedUserId: null,
			requestedUserMail: null,
			requestedUserSn: null,
			requestedUserUsername: null
   } 
  
   let page = {
			pageNumber: null,
			fields: {},
			values: []
	 }

  try{
    
     customJSONObj.userPrerequisiteId = payload.userPrerequisiteId

     requestedUserObj.requestedUserGivenName = userProfileResponse.givenName
     requestedUserObj.requestedUserId = userProfileResponse._id
     requestedUserObj.requestedUserMail = userProfileResponse.mail
     requestedUserObj.requestedUserSn = userProfileResponse.sn
     requestedUserObj.requestedUserUsername = userProfileResponse.userName
     customJSONObj.requestedUser = requestedUserObj
    
     if(requestorProfileResponse!=null && requestorProfileResponse){
       requesterUserObj.requesterUserGivenName = requestorProfileResponse.givenName
       requesterUserObj.requesterUserId = requestorProfileResponse._id
       requesterUserObj.requesterUserMail = requestorProfileResponse.mail
       requesterUserObj.requesterUserSn = requestorProfileResponse.sn
       requesterUserObj.requesterUserUsername = requestorProfileResponse.userName
     }   
       customJSONObj.requesterUser = requesterUserObj
  
       page.pageNumber = Number(payload.pageNumber)
       for(let i=0;i<payload.endpointRequest.requestParams.length;i++){
         valuesJSON = {
           fieldName: null,
           fieldValue: null
         }
         reqParams = payload.endpointRequest.requestParams[i]
         page.fields[reqParams.serviceParamName] = reqParams.value.toString()
         valuesJSON.fieldName = reqParams.serviceParamName
         valuesJSON.fieldValue = reqParams.value.toString()
         page.values.push(valuesJSON)
       }

       if(getPayloadKOGCredentialsAPI(prereqName,userPrerequisiteResponse,serviceEndptRequestObj,expiryDate,standardRequest)!=null ){
         customJSONObj.payload = getPayloadKOGCredentialsAPI(prereqName,userPrerequisiteResponse,serviceEndptRequestObj,expiryDate,standardRequest)
       }   
       customJSONObj.page = page
      
       const body = {
          custom: customJSONObj,
          common: {
              expiryDate:identityServer.getProperty("esv.workflow.expirydate")
          }
        }

        logger.error("Workflow Body is "+ JSON.stringify(body));
        workflowResponse = openidm.action(payload.endpointRequest.endpoint.url, "POST", body,{});
        logger.error("Workflow Response is "+ JSON.stringify(workflowResponse));

        //return workflowResponse
        
        return {
          "code":201,
          "status":"success",
          "message":"success"
        }
      
    } catch(error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
    }
}


/**
* @name <getPrerequisite>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPrerequisite(preReqId){
  logger.error("Inside getPrerequisite")
  let funcName = "getPrerequisite"
  let response = null
  let status = "ACTIVE"
  
  try {
    response = openidm.query("managed/alpha_kyid_enrollment_prerequisite/", { "_queryFilter": '/_id/ eq "' + preReqId + '"'
      + ' AND (recordState eq "' + status + '" OR recordState eq "0")'}, ["prereqTypeId/*","*"])
    if(response!=null && response.resultCount>0){
      logger.error("getPrerequisite response is - "+ JSON.stringify(response))
      return response
    }
    else{
      return logErrorDetails(-15,'Prerequisite_Configuration_Not_Found',createlogDetailsJSON(funcName,null,1449)) 
    }

  } catch (error) {
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <patchUserPrerequisite>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function patchUserPrerequisite(apiRequestPayload,recordID,serviceEndptRequestObj,expiryDate,status) {
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
       if(serviceEndptRequestObj!=null && serviceEndptRequestObj && (status!=null && status && status=="COMPLETED")){
           values = getprerequisiteValuesForUsrPrereq(serviceEndptRequestObj)
           jsonObj = {
              "operation":"replace",
              "field":"prerequisiteValues",
              "value":values
           }
          jsonArray.push(jsonObj)         
        }
          
        jsonObj = {
          "operation":"replace",
          "field":"status",
          "value":status //"2"
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

        if(expiryDate!=null && expiryDate){
          jsonObj = {
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
           jsonArray.push(jsonObj)
        }
          
        logger.error("UserPrerequisite jsonArray to patch - "+ JSON.stringify(jsonArray))
    
        openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + recordID, null, jsonArray);
    
        return {
          "status":"success",
          "message":"success"
        }
  
    } catch (error) {
      //Return error response
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw createException(funcName,error)
    } 
}



/**
* @name <invokeKOGCredentialsAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeKOGCredentialsAPI(payload){
  logger.error("Inside invokeKOGCredentialsAPI")
  let funcName = "invokeKOGCredentialsAPI"
  let responseKOGCredentialsAPI = null
  let requestBody = {
    url:identityServer.getProperty("esv.addremoveusercredential.api"),
    scope:identityServer.getProperty("esv.addremoveusercredential.api.scope"),
    method:"POST",
    payload:payload
  }
  let apiResult = {
    code:null,
    ResponseStatus:null,
    message:null
  }
  
  try{
    logger.error("Request Body for invokeKOGCredentialsAPI is - "+JSON.stringify(requestBody))
    responseKOGCredentialsAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
    logger.error("responseKOGCredentialsAPI in invokeKOGCredentialsAPI is - "+JSON.stringify(responseKOGCredentialsAPI))
    if(responseKOGCredentialsAPI!=null && responseKOGCredentialsAPI){
      if(responseKOGCredentialsAPI.response.ResponseStatus==0){
        apiResult.ResponseStatus = responseKOGCredentialsAPI.response.ResponseStatus
        apiResult.code = responseKOGCredentialsAPI.status
      } else {
        apiResult.ResponseStatus = responseKOGCredentialsAPI.response.ResponseStatus
        apiResult.message = responseKOGCredentialsAPI.response.MessageResponses
        apiResult.code = responseKOGCredentialsAPI.status
      }
    }
    logger.error("apiResult in invokeKOGCredentialsAPI is - "+JSON.stringify(apiResult))
    return apiResult
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <invokeUserOnboardingAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeUserOnboardingAPI(payload){
  logger.error("Inside invokeUserOnboardingAPI")
  let funcName = "invokeUserOnboardingAPI"
  let responseUserOnboardingAPI = null
  let requestBody = {
    url:identityServer.getProperty("esv.addremoveuseronboarding.api"),
    scope:identityServer.getProperty("esv.addremoveuseronboarding.api.scope"),
    method:"POST",
    payload:payload
  }
  let apiResult = {
    code:null,
    ResponseStatus:null,
    message:null
  }

  try{
    logger.error("Request Body for invokeUserOnboardingAPI is - "+JSON.stringify(requestBody))
    responseUserOnboardingAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
    logger.error("responseUserOnboardingAPI in invokeUserOnboardingAPI is - "+JSON.stringify(responseUserOnboardingAPI))
    if(responseUserOnboardingAPI!=null && responseUserOnboardingAPI){
      if(responseUserOnboardingAPI.response.ResponseStatus==0){
        apiResult.ResponseStatus = responseUserOnboardingAPI.response.ResponseStatus
        apiResult.code = responseUserOnboardingAPI.status
      } else {
        apiResult.ResponseStatus = responseUserOnboardingAPI.response.ResponseStatus
        apiResult.message = responseUserOnboardingAPI.response.MessageResponses
        apiResult.code = responseUserOnboardingAPI.status
      }
    }
      logger.error("apiResult in invokeUserOnboardingAPI is - "+JSON.stringify(apiResult))
    return apiResult
    
  } catch(error){
    logger.error("Exception in "+funcName+" is - " + getException(error))
    throw createException(funcName,error)
  }
}


/**
* @name <generateGUID>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function generateGUID(){
  logger.error("Inside generateGUID")
  let funcName = "generateGUID"
   try{
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
     
   } catch (error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
   }
}


/**
* @name <getprerequisiteValuesForUsrPrereq>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getprerequisiteValuesForUsrPrereq(serviceEndptRequestObj){
  logger.error("Inside getprerequisiteValuesForUsrPrereq")
  let funcName = "getprerequisiteValuesForUsrPrereq"
  let valuesJSON = null
  let values = []

  try{
      if(serviceEndptRequestObj!=null && serviceEndptRequestObj){
          for(let i=0;i<serviceEndptRequestObj.requestParams.length;i++){
              valuesJSON = {
               "fieldName": null,
               "fieldValue": null
             }
             reqParams = serviceEndptRequestObj.requestParams[i]
             if(reqParams.serviceParamName!="Username" && reqParams.serviceParamName!="Password"){
               valuesJSON.fieldName = reqParams.serviceParamName
               valuesJSON.fieldValue = reqParams.value.toString()
               values.push(valuesJSON)
             }
          }
        
         return values
      } else {
        return logErrorDetails(-18,'SERVICE_ENDPOINT_REQUEST_OBJECT_EMPTY',createlogDetailsJSON(funcName,null,1900))
      }
   } catch (error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
   }
}


/**
* @name <getprerequisiteValuesForCredentialsAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getprerequisiteValuesForCredentialsAPI(serviceEndptRequestObj){
  logger.error("Inside getprerequisiteValuesForCredentialsAPI - "+JSON.stringify(serviceEndptRequestObj))
  let funcName = "getprerequisiteValuesForCredentialsAPI"
  let valuesJSON = null
  let values = []

  try{
      if(serviceEndptRequestObj!=null && serviceEndptRequestObj){
        for(let i=0;i<serviceEndptRequestObj.requestParams.length;i++){
          valuesJSON = {
           "CredentialDetailName": null,
           "CredentialDetailValues": null
           }
         
         reqParams = serviceEndptRequestObj.requestParams[i]
           logger.error("****reqParams value is - "+JSON.stringify(reqParams))
         if(reqParams.serviceParamName!="Password" && reqParams.serviceParamName!="Username" && reqParams.serviceParamName!="Surname") {
           if(reqParams.serviceParamName=="Last_4_SSN"){
             valuesJSON.CredentialDetailName = "SSN"
           } else {
             valuesJSON.CredentialDetailName = reqParams.serviceParamName
           }          
           valuesJSON.CredentialDetailValues = [reqParams.value.toString()]
           values.push(valuesJSON)
         }
       }
        logger.error("getprerequisiteValuesForCredentialsAPI response is - "+JSON.stringify(values))
        return values
      } else {
        return logErrorDetails(-18,'SERVICE_ENDPOINT_REQUEST_OBJECT_EMPTY',createlogDetailsJSON(funcName,null,1937))
      }
   } catch (error){
      logger.error("Exception in "+funcName+" is - " + getException(error))
      throw createException(funcName,error)
   }
}


/**
* @name <getPayloadKOGCredentialsAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPayloadKOGCredentialsAPI(prereqName,userPrerequisiteResponse,serviceEndptRequestObj,
                                     expiryDate,standardRequest){
  
    logger.error("Inside getPayloadKOGCredentialsAPI")
    let funcName = "getPayloadKOGCredentialsAPI"
    const currentTimeinEpoch = Date.now();
    const currentDate = new Date().toISOString();
    let values = null
  
   try{
        let payload = {
            KOGID: null,
            ActionFlag: identityServer.getProperty("esv.addremoveusercredential.api.action"), //1 = ADD and 2 = REMOVE
            TransactionID: null,
            RequestorKOGID: null,
            KOGUserCredential: 
              {
                CredentialTypeName: null,
                SubmissionDate: currentDate,
                VerifiedDate: currentDate,
                ExpirationDate: null,
                CredentialDetails: null
              }
         }

         values = getprerequisiteValuesForCredentialsAPI(serviceEndptRequestObj)
         payload.KOGID = standardRequest.context.requestedUser.userName
         payload.TransactionID = standardRequest.context.transactionId
         payload.RequestorKOGID = standardRequest.context.requestorUser.userName
         payload.KOGUserCredential.CredentialTypeName = prereqName
         payload.KOGUserCredential.CredentialDetails = values
     
         if(expiryDate!=null){
           payload.KOGUserCredential.ExpirationDate = expiryDate.expiryDate
         } else {
           payload.KOGUserCredential.ExpirationDate = userPrerequisiteResponse.expiryDate
         }
         
         logger.error("getPayloadKOGCredentialsAPI is - "+JSON.stringify(payload))

         return payload
      
     } catch (error){
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw createException(funcName,error)
     }
}


/**
* @name <getPayloadUserOnboardingAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPayloadUserOnboardingAPI(prereqName,standardRequest){
  
    logger.error("Inside getPayloadUserOnboardingAPI")
    let funcName = "getPayloadUserOnboardingAPI"
    const currentTimeinEpoch = Date.now();
    const currentDate = new Date().toISOString();

    try{
         let payload = {
              KOGID: null,
              ActionFlag: identityServer.getProperty("esv.addremoveuseronboarding.api.action"), //1 = ADD and 2 = REMOVE
              TransactionID: null,
              RequestorKOGID: null,
              KOGUserOnboarding: 
              	{
              		UserOnboardingName: null,
              		CompletionDate:currentDate
              	}
          } 
      
         payload.KOGID = standardRequest.context.requestedUser.userName
         payload.TransactionID = standardRequest.context.transactionId
         payload.RequestorKOGID = standardRequest.context.requestorUser.userName
         payload.KOGUserOnboarding.UserOnboardingName = prereqName  
         logger.error("getPayloadUserOnboardingAPI is - "+JSON.stringify(payload))

         return payload
      
     } catch (error){
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw createException(funcName,error)
     }
}  


/**
* @name <getExpiryDate>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getExpiryDate(option, value) {
  logger.error("Inside getExpiryDate")
  let funcName = "getExpiryDate"
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now();  // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString();  // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate);  // Convert the ISO string into a Date object

        let expiryDate;

        switch (option) {
            case 0:  // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000);  // Add one day (24 hours) to the current time
                break;
            case 1:  // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000);  // Add one week (7 days)
                break;
            case 2:  // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1)  // Add one month to the current date
                break;
            case 3:  // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3);  // Add 3 months to the current date
                break;
            case 4:  // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6);  // Add 6 months to the current date
                break;
            case 5:  // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1);  // Add 1 year to the current date
                break;
            case 6:  // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day);  // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1);  // If the date is already passed this year, set it to the next year
                }
                break;
            case 7:  // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000);  // Add 'value' days in milliseconds
                break;
            case 8:  // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value);  // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return logErrorDetails(400,'Invalid_Input',createlogDetailsJSON(funcName,null,2011))
        }

        const expiryEpochMillis = new Date(expiryDate).getTime();  // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return { 
                expiryEpoch: expiryEpochMillis, 
                expiryDate: expiryDate 
              };

    } catch (error) {
        logger.error("Exception in "+funcName+" is - " + getException(error))
        throw createException(funcName,error)
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
* @name <createException>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createException(funcName,error){

  let detail = requestDetail()
  detail.functionName = funcName
  detail.exception = getException(error)
  return { code: 400, message: 'Exception in '+funcName, detail: detail}
}


/**
* @name <logErrorDetails>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function logErrorDetails(code,message,detail){

  if(code!=null && message!=null){
    return  { code : code, message : message, detail : detail }   
    
  } else {
    return  { code : 400, message : "Missing_Error_Code_OR_Message"}
  }
}


/**
* @name <createlogDetailsJSON>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createlogDetailsJSON(funcName,params,line){

  let logDetailJSON = {}
  logDetailJSON.params = params
  logDetailJSON.function = funcName
  logDetailJSON.lineNumber = null
  //logDetailJSON.lineNumber = Number(line)

  return logDetailJSON
}




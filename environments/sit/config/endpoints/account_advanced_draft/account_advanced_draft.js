(function(){

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
 
    const REQUEST_CREATE = "create"
    const REQUEST_UPDATE = "patch"
    const REQUEST_GET = "read"
    const REQUEST_DELETE = "delete"
   
    const EXCEPTION_UNSUPPORTED_OPERATION = "Unsupported operation {0}"
    const ACCOUNT_ENDPOINT_NAME = "endpoint/account_draft"
    logger.error ("Entering custom Endpoint account_draft");
    var input = {
        //"transactionId":request.content.transactionId,
        "transactionId":"1",
        "endPoint":ACCOUNT_ENDPOINT_NAME,
        "object":"managed/alpha_user/",
        "payload":{},
        "isAdvanced": request.content.isAdvanced?request.content.isAdvanced:false,
        "isTerminated": request.content.isTerminated?request.content.isTerminated:false,
        "isDeactivated": request.content.isDeactivated?request.content.isDeactivated:false
         
    }

  const ACCOUNT_PROPERTIES = [
        "givenName",
        "sn"
    ]

    logger.error("Printing request method" + request.method);
    /* Check request method */
    switch (request.method) {
        
        
        case REQUEST_CREATE:
            const ACTION_CREATE = "1"
            const ACTION_SEARCH = "4"
            const action = request.content.action
   
        /* Get request content */
        const requestContent = getRequestContent(ACCOUNT_ENDPOINT_NAME,request,context)
   
            try{
           
                if(action === ACTION_CREATE){

                  logger.error("From custom endpoint account_draft: inside condition action_create")
                    /* Throw unsupported exception. */
                    const unsupportedException = {
                        "code":400,
                        "level":"ERROR",
                        "errorCode":"",
                        "errorMessage":EXCEPTION_UNSUPPORTED_OPERATION,
                        "params":[request.method],
                        "transactionId":input.transactionId,
                        "logger":`${input.endPoint}`,
                        "timestamp":new Date().toISOString()
                    }
                 //   logException(unsupportedException)
                    throw {
                 // return{   
                        "code":400,
                    //    "errorCode":unsupportedException.errorCode,
                        //"errorMessage":unsupportedException.errorMessage,
                      "message":"Custom Exception in throw"
                      //  "params":unsupportedException.params
                      
                    }
                  
                } else if(action === ACTION_SEARCH){
                  logger.error("Custom endpoint searchAccount 7");
                    input.payload.returnProperties = request.content.returnParams?request.content.returnParams:ACCOUNT_PROPERTIES
                    input.payload.queryFilter = {
                        "andConditions":request.content.payload.searchParameters
                    }
                  if(request.content.isAdvanced)
                    return searchAccountAdvanced(input)
                  else
                    return searchAccount(input)
                }
 
                break
 
            }catch(error){
                logException(error)
                throw {
                    "errorCode":error.errorCode,
                    "errorMessage":error.errorMessage,
                    "params":error.params
                }
            }
           
        case REQUEST_UPDATE:
            try{

              logger.error("Entering custom endpoint update method 1")
                 const authenticatedUserId = context.current.parent.parent.parent.parent.parent.rawInfo.sub
                const patchOperations = request.patchOperations
                const id = request.additionalParameters.id
                input.payload = {
                    "id":id,
                    "requesterDisplayId":authenticatedUserId,
                    "updateFields":patchOperations,
                    "returnProperties":ACCOUNT_PROPERTIES
                }
  
              
              
                /* Update account */
                return updateAccount(input)
                break
            }catch(error){
                logException(error)
                throw {
                    "errorCode":error.errorCode,
                    "errorMessage":error.errorMessage,
                    "params":error.params
                }
            }
        case REQUEST_GET:
            try{
                const queryParameters = request.additionalParameters
                input.payload.id = queryParameters.id
                input.payload.returnProperties = ACCOUNT_PROPERTIES
                /* Get account */
                return getAccount(input)
            }catch(error){
                logException(error)
                throw {
                    "errorCode":error.errorCode,
                    "errorMessage":error.errorMessage,
                    "params":error.params
                }
            }
        case REQUEST_DELETE:

          logger.error("Custom Endpoint account_draft : Entered method delete ");
            try{
                 //queryParameters = request.additionalParameters
              logger.error("Printing queryParameters from delete account....." + request.additionalParameters.id);
                //input.payload.id = queryParameters.id
              input.payload.id = request.additionalParameters.id
            
              input.payload.returnProperties = ACCOUNT_PROPERTIES
              logger.error("Custom Endpoint account_draft : Payload is  " + input.payload.id + input.payload.returnProperties);
                return deleteAccount(input)
            }catch(error){
                logException(error)
                throw {
                    "errorCode":error.errorCode,
                    "errorMessage":error.errorMessage,
                    "params":error.params
                }
            }
        default:
          logger.error("Printing request method custom endpoint" + request.method);
        /* Throw unsupported exception. */
             unsupportedException = {
                "code":400,
                "level":"ERROR",
                "type":"",
                "message":EXCEPTION_UNSUPPORTED_OPERATION,
                "params":[request.method],
                "transactionId":input.transactionId,
                "logger":`${input.endPoint}`,
                "timestamp":new Date().toISOString()
            }
            logException(unsupportedException)
            throw {
                "errorCode":unsupportedException.errorCode,
                "errorMessage":unsupportedException.errorMessage,
                "params":unsupportedException.params
            }
    }
   
})()
/**
 * @name getRequestContent
 * @description Method returns request content.
 *
 * @param {string} endpoint
 * @param {string} request
 * @returns {JSON} request content
 * @throws Exception
 */
function getRequestContent(endpoint,request,context){
   
    logDebug(context.transactionId,endpoint,"getRequestContent",`Input parameter: ${request.content}`)
 
    const EXCEPTION_INVALID_REQUEST = "Invalid request. The request does not contain the required parameters. Missing parameter(s): {0}"
   
    if(request.content){
        if(!request.content.payload){
            /* Throw invalid request exception. */
            const invalidRequestException = {
                "code":400,
                "level":"ERROR",
                "type":"",
                "message":EXCEPTION_INVALID_REQUEST,
                "params":["request.content.payload"],
                "transactionId":context.transactionId,
                "logger":`${endpoint}`,
                "timestamp":new Date().toISOString()
            }
            throw invalidRequestException
        }
        if(!request.content.action){
            /* Throw invalid request exception. */
             invalidRequestException = {
                "code":400,
                "level":"ERROR",
                "type":"",
                "message":EXCEPTION_INVALID_REQUEST,
                "params":["request.content.action"],
                "transactionId":context.transactionId,
                "logger":`${endpoint}`,
                "timestamp":new Date().toISOString()
            }
            throw invalidRequestException
        }
        logDebug(context.transactionId,endpoint,"getRequestContent",`Response: ${request.content}`)
 
        return request.content
    }else{
        /* Throw invalid request exception. */
         invalidRequestException = {
            "code":400,
            "level":"ERROR",
            "type":"",
            "message":EXCEPTION_INVALID_REQUEST,
            "params":["request.content"],
            "transactionId":context.transactionId,
            "logger":`${endpoint}`,
            "timestamp":new Date().toISOString()
        }
        throw invalidRequestException
    }
}

function exception(){
    return {
        "UNEXPECTED_ERROR":{
            "code":400,
            "level":"ERROR",
            "errorCode":"",
            "errorMessage":"An unexpected error occured during the operation {0}. Error: {1)"
        }
    }
}

/**
 * @name createAccount
 * @description Creates account within the Ping AIC
 *
 * @param {JSON} input parameter
 * @throws {JSON} Exception
 */
function createAccount(input){
    try{
        /* Create account logic. */
    }catch(error){
        /* Throw unexpected exception. */
        const unexpectedException = {
            "code":400,
            "level":"ERROR",
            "type":"",
            "message":EXCEPTION_UNEXPECTED_ERROR,
            "params":[`createAccount`,getException(error)],
            "transactionId":input.transactionId,
            "logger":`${input.endPoint}/createAccount`,
            "timestamp":new Date().toISOString()
        }
        throw unexpectedException
    }
}
 

/**
 * @name updateAccount
 * @description Update account object
 *
 * @param {JSON} input parameter
 * - id : Account Identifier (_id)
 * - requesterDisplayId : Requester display id
 * - updateFields : Update fields array of object
 *    - name : Field name
 *    - value: Field value            
 * @returns {JSON} patched object
 */
function updateAccount(input){
   
  const EXCEPTION_UNEXPECTED_ERROR = "An unexpected error occured during the operation {0}. Error: {1)"
    const EXCEPTION_NO_RECORD_TO_UPDATE = "No fields provided to update the record for record {0}"
 
    const MO_ALPHA_USER = input.object
       
    try{
        logDebug(input.transactionId,input.endPoint,"updateAccount",`Input parameter: ${JSON.stringify(input.payload)}`)
   
        const id = input.payload.id
        const requesterDisplayId = input.payload.requesterDisplayId
        const updateFields = input.payload.updateFields
       const returnProperties = input.payload.returnProperties
 
        const currentTimeinEpoch = Date.now()
        const currentDate = new Date().toISOString()
        const recordAudit = [
            {
                "operation": "replace",
                "field": "updateDate",
                "value": currentDate
            },
            {
                "operation": "replace",
                "field": "updateDateEpoch",
                "value": currentTimeinEpoch
            },
            {
                "operation": "replace",
                "field": "updatedBy",
                "value": requesterDisplayId
            }
        ]
        recordAudit.push(updateFields)
       
        /* check if input has fields to update */
        /*if(input.payload.updateFields){
            input.payload.updateFields.forEach(field => {
                updateFields.push({
                    "operation": "replace",
                    "field": field.name,
                    "value": field.value
                })
            })
            /* Upend audit record for the update. */
            //updateFields.push(recordAudit)
 
        //}else{
            /* Throw unexpected exception. */
        /*    const unexpectedException = {
                "code":400,
                "level":"ERROR",
                "errorCode":"",
                "errorMessage":EXCEPTION_NO_RECORD_TO_UPDATE,
                "params":[id],
                "transactionId":input.transactionId,
                "logger":`${input.endPoint}/updateAccount`,
                "timestamp":new Date().toISOString()
            }
            throw unexpectedException
        }*/
        /* patch object */
        logger.error("Inside updateAccount: Before openidm patch")
        const patchResponse = openidm.patch(`${MO_ALPHA_USER}` + id, null, updateFields,null,returnProperties);
      logger.error("Inside updateAccount: After openidm patch")
        if (patchResponse) {
 
            logDebug(input.transactionId,input.endPoint,"updateAccount",`Successful update on ${MO_ALPHA_USER} for record id ${id} for fields ${updateFields}`)
           
            return patchResponse
       
        }else {
            /* Throw unexpected exception. */
            const unexpectedException = {
                "code":400,
                "level":"ERROR",
                "errorCode":"",
                "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
                "params":[`createAccount`,getException(error)],
                "transactionId":input.transactionId,
                "logger":`${input.endPoint}/updateAccount`,
                "timestamp":new Date().toISOString()
            }
            throw unexpectedException
        }
    }catch(error){
        /* Throw unexpected exception. */
         unexpectedException = {
            "code":400,
            "level":"ERROR",
            "errorCode":"",
            "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
            "params":[`updateAccount`,getException(error)],
            "transactionId":input.transactionId,
            "logger":`${input.endPoint}/updateAccount`,
            "timestamp":new Date().toISOString()
        }
        throw unexpectedException
    }
				
        
     
}
/**
 * @name getAccount
 * @description Get account details
 *
 * @param {JSON} input parameters
 * @returns {JSON} account details
 */
function getAccount(input){
   
    const EXCEPTION_UNEXPECTED_ERROR = "An unexpected error occured during the operation {0}. Error: {1)"
    const EXCEPTION_INVALID_INPUT = "Invalid input parameter. Missing payload content for id {0}."
    const MO_ALPHA_USER = input.object
    
 
    try{
        logDebug(input.transactionId,input.endPoint,"getAccount",`Input parameter: ${JSON.stringify(input.payload)}`)
 
        const STATUS_ACTIVE = "ACTIVE"
        /* Check if input contains payload  */
        if(input.payload){
            const id = input.payload.id
            const returnProperties = input.payload.returnProperties
            const getResponse = openidm.query(`${MO_ALPHA_USER}`,
                {  
               ///     "_queryFilter": '/_id/ eq "' + id + '"' + ' AND recordState eq "' + STATUS_ACTIVE + '"'
                   "_queryFilter": '/_id/ eq "' + id + '"' 
                },
                returnProperties
            )
            if(getResponse){
                logDebug(input.transactionId,input.endPoint,"getAccount",`Response: ${JSON.stringify(getResponse)}`)
                return getResponse
            }else{
                return null
            }
        }else{
            /* Throw invalid input exception. */
            const invalidInputException = {
                "code":400,
                "level":"ERROR",
                "errorCode":"",
                "errorMessage":EXCEPTION_INVALID_INPUT,
                "params":[],
                "transactionId":input.transactionId,
                "logger":`${input.endPoint}/getAccount`,
                "timestamp":new Date().toISOString()
            }
            throw invalidInputException
        }
    }catch(error){
        /* Throw unexpected exception. */
        const unexpectedException = {
            "code":400,
            "level":"ERROR",
            "errorCode":"",
            "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
            "params":[`createAccount`,getException(error)],
            "transactionId":input.transactionId,
            "logger":`${input.endPoint}/getAccount`,
            "timestamp":new Date().toISOString()
        }
        throw unexpectedException
    }
   
}
 
/**
 * @name searchAccount
 * @description Search account details
 *
 * @param {JSON} input parameters
 * @returns {JSON} account details
 */
function searchAccount(input){
   
    const EXCEPTION_UNEXPECTED_ERROR = "An unexpected error occured during the operation {0}. Error: {1}"
    const EXCEPTION_INVALID_INPUT = "Invalid input parameter. Missing payload content for id {0}."
 
    const MO_ALPHA_USER = input.object
    try{
        logDebug(input.transactionId,input.endPoint,"searchAccount",`Input parameter: ${JSON.stringify(input.payload)}`)
 
      //  const STATUS_ACTIVE = "active"
      // const STATUS_ACTIVE = "TestUserMar1803@mailinator.com"
      
        /* Check if  */
        if(input.payload){
            const id = input.payload.id
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter
            let filterCondition ="("
          logger.error("Custom endpoint searchAccount 2");
            if(queryFilter){
                if(queryFilter.andConditions){
                    queryFilter.andConditions.forEach(condition => {
                        if(filterCondition !== "(") {
                            filterCondition += ' OR ';
                        }
                        filterCondition += `/${condition.name}/ eq "${condition.value}"`
                    })
                  filterCondition += ")";
                  filterCondition += " AND /accountStatus eq \"active\"";

                  logger.error("Custom endpoint searchAccount 1" + filterCondition);
                }

                logDebug(input.transactionId,input.endPoint,"searchAccount",`Search filter: ${filterCondition}`)
 
                const searchResponse = openidm.query(`${MO_ALPHA_USER}`,
                    {
                       "_queryFilter": filterCondition,
                        "_pageSize": 200
                    },
                    returnProperties                    
                )

                  var responseArray = [];

                for (var j = 0; j < searchResponse.result.length; j++) {
                var item = searchResponse.result[j];                
                responseArray.push({
                    firstName: item.givenName,
                    lastName: item.sn,
                    email: item.mail,
                    logon: item.cutsom_logon,
                    upn: item.frIndexedString1,
                    userType: {
                      "en" :item.custom_userType,
                      "es" :item.custom_userType
                    },
                    id: item._id,
                    status:{
                      "en" :item.accountStatus,
                      "es" :item.accountStatus
                    },
                    gender: item.custom_gender
                  });
                }


                if(responseArray){
                    let returnPayload = {
                        "responseCode":0,
                        "transactionId":input.transactionId,
                        "message":"Success",
                        "payload":{
                            "data": responseArray
                        }
                    }
                  logger.error("Custom endpoint searchAccountAdvanced 4");
                    logDebug(input.transactionId,input.endPoint,"searchResponse",`Response: ${JSON.stringify(responseArray)}`)
                    //return searchResponse
                    return returnPayload;
                }else{
                    let returnPayload = {
                        "responseCode":1,
                        "transactionId":input.transactionId,
                        "message":"Error"                       
                    }
                  logger.error("Custom endpoint searchAccountAdvanced 4");
                    logDebug(input.transactionId,input.endPoint,"searchResponse error ",`Response: ${JSON.stringify(responseArray)}`)
                    //return searchResponse
                    return returnPayload;
                }
            }else{
                /* Throw invalid input exception. */
                const invalidInputException = {
                    "code":400,
                    "level":"ERROR",
                    "errorCode":"",
                    "errorMessage":EXCEPTION_INVALID_INPUT,
                    "params":[],
                    "transactionId":input.transactionId,
                    "logger":`${input.endPoint}/searchAccount`,
                    "timestamp":new Date().toISOString()
                }
                throw invalidInputException
            }
           
        }else{
            /* Throw invalid input exception. */
            const invalidInputException1 = {
                "code":400,
                "level":"ERROR",
                "errorCode":"",
                "errorMessage":EXCEPTION_INVALID_INPUT,
                "params":[],
                "transactionId":input.transactionId,
                "logger":`${input.endPoint}/searchAccount`,
                "timestamp":new Date().toISOString()
            }
            throw invalidInputException1
        }
    }catch(error){
        /* Throw unexpected exception. */
        const unexpectedException2 = {
            "code":400,
            "level":"ERROR",
            "errorCode":"",
            "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
            "params":[`createAccount`,getException(error)],
            "transactionId":input.transactionId,
            "logger":`${input.endPoint}/searchAccount`,
            "timestamp":new Date().toISOString()
        }
        throw unexpectedException2
    }
   
}
/**
 * @name searchAccountAdvanced
 * @description Search account details
 *
 * @param {JSON} input parameters
 * @returns {JSON} account details
 */
function searchAccountAdvanced(input){
   
    const EXCEPTION_UNEXPECTED_ERROR = "An unexpected error occured during the operation {0}. Error: {1}"
    const EXCEPTION_INVALID_INPUT = "Invalid input parameter. Missing payload content for id {0}."
 
    const MO_ALPHA_USER = input.object
    try{
        logDebug(input.transactionId,input.endPoint,"searchAccountAdvanced",`Input parameter: ${JSON.stringify(input.payload)}`)
 
        const STATUS_ACTIVE = "ACTIVE"
      
        /* Check if  */
        if(input.payload){
            const id = input.payload.id
            const returnProperties = input.payload.returnProperties
            var queryFilter = input.payload.queryFilter
            let filterCondition ='(/accountStatus eq "active"'

            if(input.isTerminated) {
                filterCondition += ' or /accountStatus eq "terminated"'
            }
            if(input.isDeactivated) {
                filterCondition += ' or /accountStatus eq "inactive"'
            }

            filterCondition += ')';

            let telephoneSearchParam = '';

            //if phone number in queryFilter, remove from queryFilter, query 
            // const index = queryFilter.findIndex(obj => obj.name === "telephoneNumber");
            // if (index !== -1) {
            //     telephoneSearchParam = queryFilter[index].value;
            //     queryFilter.splice(index, 1);
            //     logger.error("Custom endpoint searchAccountAdvanced phone search: " + telephoneSearchParam);
            // }

          logger.error("Custom endpoint searchAccountAdvanced 2");
            if(queryFilter){
                if(queryFilter.andConditions){
                    queryFilter.andConditions.forEach(condition => {
                        if(condition.name === "mobileNumber") {
                            telephoneSearchParam = condition.value;
                        }
                        else {
                            if(filterCondition !== "") {
                                filterCondition += ' AND ';
                            }
                            filterCondition += `/${condition.name}/ eq "${condition.value}"`
                        }
                    })

                  logger.error("Custom endpoint searchAccountAdvanced 1" + filterCondition);
                }

                if(telephoneSearchParam !== "") {
                    let mfaResponse = openidm.query("managed/alpha_kyid_mfa_methods", {"_queryFilter": "/MFAMethod eq \"SMSVOICE\" and MFAValue eq \"" + telephoneSearchParam + "\""}).result;

                    if(mfaResponse && mfaResponse.length > 0) {
                        filterCondition += " AND (";
                        mfaResponse.forEach(mfaObject => {
                            if(filterCondition.slice(-1) !== "(") {
                                filterCondition += " OR ";
                            }
                            filterCondition += "userName eq \"";
                            filterCondition += mfaObject.KOGId
                            filterCondition += "\""
                        });
                        filterCondition += ")";
                    }
                }

                logDebug(input.transactionId,input.endPoint,"searchAccountAdvanced",`Search filter: ${filterCondition}`)
 
                const searchResponse = openidm.query(`${MO_ALPHA_USER}`,
                    {
                       "_queryFilter": filterCondition,
                       "_pageSize": 200
                    },
                    returnProperties                                                     
                )

                var responseArray = [];

                for (var j = 0; j < searchResponse.result.length; j++) {
                var item = searchResponse.result[j];                
                responseArray.push({
                    firstName: item.givenName,
                    lastName: item.sn,
                    email: item.mail,
                    logon: item.cutsom_logon,
                    upn: item.frIndexedString1,
                    userType: item.custom_userType,
                    id: item._id,
                    status: item.accountStatus,
                    gender: item.custom_gender
                  });
                }


                if(responseArray){
                    let returnPayload = {
                        "responseCode":0,
                        "transactionId":input.transactionId,
                        "message":"Success",
                        "payload":{
                            "data": responseArray
                        }
                    }
                  logger.error("Custom endpoint searchAccountAdvanced 4");
                    logDebug(input.transactionId,input.endPoint,"searchResponse",`Response: ${JSON.stringify(responseArray)}`)
                    //return searchResponse
                    return returnPayload;
                }else{
                    let returnPayload = {
                        "responseCode":1,
                        "transactionId":input.transactionId,
                        "message":"Error"                       
                    }
                  logger.error("Custom endpoint searchAccountAdvanced 4");
                    logDebug(input.transactionId,input.endPoint,"searchResponse error ",`Response: ${JSON.stringify(responseArray)}`)
                    //return searchResponse
                    return returnPayload;
                }
            }else{
                /* Throw invalid input exception. */
                const invalidInputException = {
                    "code":400,
                    "level":"ERROR",
                    "errorCode":"",
                    "errorMessage":EXCEPTION_INVALID_INPUT,
                    "params":[],
                    "transactionId":input.transactionId,
                    "logger":`${input.endPoint}/searchAccountAdvanced`,
                    "timestamp":new Date().toISOString()
                }
                throw invalidInputException
            }
           
        }else{
            /* Throw invalid input exception. */
            const invalidInputException1 = {
                "code":400,
                "level":"ERROR",
                "errorCode":"",
                "errorMessage":EXCEPTION_INVALID_INPUT,
                "params":[],
                "transactionId":input.transactionId,
                "logger":`${input.endPoint}/searchAccountAdvanced`,
                "timestamp":new Date().toISOString()
            }
            throw invalidInputException1
        }
    }catch(error){
        /* Throw unexpected exception. */
        const unexpectedException2 = {
            "code":400,
            "level":"ERROR",
            "errorCode":"",
            "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
            "params":[`createAccount`,getException(error)],
            "transactionId":input.transactionId,
            "logger":`${input.endPoint}/searchAccountAdvanced`,
            "timestamp":new Date().toISOString()
        }
        throw unexpectedException2
    }
   
}
/**
 * @name deleteAccount
 * @description Delete account
 *
 * @param {JSON} input parameters
 */
function deleteAccount(input){
   logger.error("Entered deleteAccount....  "+ input.transactionId + input.endPoint)
    const EXCEPTION_UNEXPECTED_ERROR = "An unexpected error occured during the operation {0}. Error: {1}"
    const EXCEPTION_INVALID_INPUT = "Invalid input parameter. Missing payload content for id {0}."
 
    try{
        logDebug(input.transactionId,input.endPoint,"deleteAccount",`Input parameter: ${JSON.stringify(input.payload)}`)
 
        const RECORDSTATE_DELETED = "tempEmailID@yopmail.com"
        /* Check if input contains payload  */
        if(input.payload){
            const id = input.payload.id
            input.payload = {
                "id":input.payload.id,
                "requesterDisplayId":input.payload.requesterDisplayId,
                "requestedProperties":input.payload.returnProperties,
                "updateFields":[{
                 //   "name":"recordState",
                                  
                   "operation": "replace",
                  "field": "/mail",
                 "value": RECORDSTATE_DELETED
       
                }]
            
            }
               let EXCEPTION = exception()
              
              
              EXCEPTION.UNEXPECTED_ERROR.transactionId = `${input.endPoint}/deleteAccount`
              EXCEPTION.UNEXPECTED_ERROR.logger = `${input.endPoint}/deleteAccount`
              EXCEPTION.UNEXPECTED_ERROR.timestamp = new Date().toISOString()
              logger.error("In delete account printing exception.....  " + JSON.stringify(EXCEPTION.UNEXPECTED_ERROR));
              throw {"ERROR": "Unexpected exception"} //EXCEPTION.UNEXPECTED_ERROR  
                 
            /* Update the record state of to 'DELETED' */
            const updateResponse = updateAccount(input)
            if(updateResponse){
                logDebug(input.transactionId,input.endPoint,"deleteAccount",`Account '${id}' has been deleted successfully.`)
               
                return updateResponse
            }else{
                
              logger.error("Inside deleteAccount: Update failed")
              /* Throw unexpected exception. 

                
                const unexpectedException = {
                    "code":400,
                    "level":"ERROR",
                    "errorCode":"",
                    "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
                    "params":[`createAccount`,getException(error)],
                    "transactionId":input.transactionId,
                    "logger":`${input.endPoint}/deleteAccount`,
                    "timestamp":new Date().toISOString()
                }
                throw unexpectedException*/
           
              
            }
        }else{
            /* Throw invalid input exception. */
            const invalidInputException = {
                "code":400,
                "level":"ERROR",
                "errorCode":"",
                "errorMessage":EXCEPTION_INVALID_INPUT,
                "params":[],
                "transactionId":input.transactionId,
                "logger":`${input.endPoint}/deleteAccount`,
                "timestamp":new Date().toISOString()
            }
            throw invalidInputException
        }
    }catch(error){
        /* Throw unexpected exception. */
       /*  unexpectedException = {
            "code":400,
            "level":"ERROR",
            "errorCode":"",
            "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
            "params":[`createAccount`,getException(error)],
            "transactionId":input.transactionId,
            "logger":`${input.endPoint}/deleteAccount`,
            "timestamp":new Date().toISOString()
        }*/
        //throw unexpectedException
          throw error
    }
   
}
 

/**
 * @name logDebug
 * This function logs information.
 *
 * @param {string} transactionId
 * @param {string} endpointName
 * @param {string} functionName
 * @param {JSON} exception
 */
function logDebug(transactionId,endpointName,functionName,message) {
    logger.error( JSON.stringify({"transactionId":transactionId,
        "endpointName":endpointName,
        "functionName":functionName,
        "message":message})
)}
 
/**
 * @name logException
 * This function logs exception.
 *
 * @param {JSON} exception
 */
function logException(exception) {
    logger.error(exception)
}
/**
* @name getException
* @description Get exception details
*
* @param {JSON} exception
* @returns {JSON} exception.
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
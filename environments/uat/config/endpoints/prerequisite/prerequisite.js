
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
let filteredFields = null
const transactionId = () => {
    return context.transactionId.id
}

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
    
    logger.error("endpoint - prerequisite Execution Start"+new Date().toISOString());

    const isEndpointExecutionAllowed = identityServer.getProperty("esv.journey.execution.flag")

    if (context.current.parent.parent.parent.parent.parent.rawInfo) {
        const authenticatedUserId = context.current.parent.parent.parent.parent.parent.rawInfo.sub
    }

    if (context.current.parent.parent.parent.parent.authorization) {
        const authorizedRole = context.current.parent.parent.parent.parent.authorization.roles
        logger.error("authorizedRole is - " + authorizedRole.includes("tenant-admins"))
    }


    if (isEndpointExecutionAllowed === "true") {
        if (request.method === 'create') {
            // POST
            const apiRequestPayload = request.content.payload
            const apiRequestAction = request.content.action
            let apiResponse = null
            logger.error("apiRequestPayload is - " + JSON.stringify(apiRequestPayload))
            logger.error("apiRequestAction is - " + apiRequestAction)
            if (apiRequestAction === 1) {

                //Only Authenticated user or Tenant Admin is allowed to access the endpoint
                if (authenticatedUserId !== apiRequestPayload.requestedUserAccountId && !authorizedRole.includes("tenant-admins")) {
                    throw { code: 401, message: 'Unauthorized' }
                }

                try {
                    logger.error("endpoint/prerequisite - Action 1 processPageDetails Start"+new Date().toISOString());
                    apiResponse = processPageDetails(apiRequestPayload)
                    logger.error("Submit Prerequisites Page Endpoint Response - " + JSON.stringify(apiResponse))

                    //Defensive check to ensure we always show a message on the screen
                    if (apiResponse && typeof apiResponse === "object" && (apiResponse.ResponseStatus === "ERR-BUS-SER-VAL-001" || apiResponse.code === "ERR-BUS-SER-VAL-001")) {
                        const msg = apiResponse.message && typeof apiResponse.message === "string" ? apiResponse.message.trim() : "";
                        if (!msg) {
                            apiResponse.message = "An unexpected error occurred when submitting the request. Please try again later.  REF-099";
                        }
                    }

                    logger.error("Submit Prerequisites Page Endpoint Final Response - " + JSON.stringify(apiResponse))
                    logger.error("endpoint/prerequisite - Action 1 processPageDetails End"+new Date().toISOString());
                    return apiResponse
                } catch (error) {
                    logger.error("Exception in processPageDetails function is - " + getException(error))
                    return error
                }

            } else if (apiRequestAction === 4) {

                //Only Authenticated user or Tenant Admin is allowed to access the endpoint
                if (authenticatedUserId !== apiRequestPayload.requestedUserAccountId && !authorizedRole.includes("tenant-admins")) {
                    throw { code: 401, message: 'Unauthorized' }
                }

                try {
                  logger.error("endpoint/prerequisite - Action 4 getPageDetails Start"+new Date().toISOString());
                    return getPageDetails(apiRequestPayload)
                } catch (error) {
                    logger.error("Exception in getPageDetails function is - " + getException(error))
                    return error
                }

            } else if (apiRequestAction === 5) {

                try {
                    logger.error("endpoint/prerequisite - Action 5 getAllCustomPrereqTypes Start"+new Date().toISOString());
                    return getAllCustomPrereqTypes()
                } catch (error) {
                    logger.error("Exception in getAllCustomPrereqTypes function is - " + getException(error))
                    return error
                }

            } else if (apiRequestAction === 6) {

                try {
                    logger.error("endpoint/prerequisite - Action 6 getPrereqTypeElements Start"+new Date().toISOString());
                    return getPrereqTypeElements(apiRequestPayload)
                } catch (error) {
                    logger.error("Exception in getPrereqTypeElements function is - " + getException(error))
                    return error
                }

            } else if (apiRequestAction === 7) {

                try {
                    logger.error("endpoint/prerequisite - Action 7 getUsersForVerifiedPrereqType Start"+new Date().toISOString());
                    return getUsersForVerifiedPrereqType(apiRequestPayload)
                } catch (error) {
                    logger.error("Exception in getUsersForVerifiedPrereqType function is - " + getException(error))
                    return error
                }

            } else if (apiRequestAction === 8) {

                try {
                    logger.error("endpoint/prerequisite - Action 8 getRoleAndApplicationDetails Start"+new Date().toISOString());
                    return getRoleAndApplicationDetails(apiRequestPayload.enrollmentRequestId, apiRequestPayload.requestedUserAccountId)
                } catch (error) {
                    logger.error("Exception in getRoleAndApplicationDetails function is - " + getException(error))
                    return error
                }

            } else {
                throw { code: 500, message: 'Unknown_Action' }
            }

        } else if (request.method === 'read') {
            // GET
            //return {};
            //Throw unsupported operation error.
            throw { code: 500, message: "Unsupported operation: " + request.method };
        } else if (request.method === 'update') {
            // PUT
            //return {};
            //Throw unsupported operation error.
            throw { code: 500, message: "Unsupported operation: " + request.method };
        } else if (request.method === 'patch') {
            //return {};
            //Throw unsupported operation error.
            throw { code: 500, message: "Unsupported operation: " + request.method };
        } else if (request.method === 'delete') {
            //return {};
            //Throw unsupported operation error.
            throw { code: 500, message: "Unsupported operation: " + request.method };
        }
        throw { code: 500, message: 'Unknown_Exception_Occurred' }

    } else {
        logger.error("Endpoint prerequisite execution is not allowed", '')
        throw { code: 500, message: 'Endpoint_Execution_Not_Allowed' }
    }
}());


/**
* @name <getAllCustomPrereqTypes>
* @description <It returns all the custom type of prerequisites>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getAllCustomPrereqTypes() {

    let prereqTypeResponse = null
    //let pagesArray = null
    //let isTrainingAgreementType = false
    let prereqTypeJSON = {}
    let result = {
        prereqTypeList: []
    }

    try {
        prereqTypeResponse = openidm.query("managed/alpha_kyid_enrollment_prerequisite_type/", { "_queryFilter": '(recordState eq "ACTIVE" OR recordState eq "0") AND (typeName eq "Custom" OR typeName eq "6") AND (prerequisiteSourceName eq "Credential Prerequisite")' }, ["*"])
        logger.error("Prereq Type Response is - " + JSON.stringify(prereqTypeResponse))

        if (prereqTypeResponse && prereqTypeResponse !== null && prereqTypeResponse.resultCount > 0) {
            prereqTypeResponse.result.forEach(prereqType => {
                prereqTypeJSON = {
                    id: null,
                    name: null
                }
                if (prereqType.name && prereqType.name != null) {
                    prereqTypeJSON.id = prereqType._id
                    prereqTypeJSON.name = prereqType.name
                    result.prereqTypeList.push(prereqTypeJSON)
                }
            })
            result.TotalCount = prereqTypeResponse.resultCount
            logger.error("endpoint/prerequisite - Action 5 getAllCustomPrereqTypes End"+new Date().toISOString());
            return result

        } else {
            result.TotalCount = 0
            logger.error("endpoint/prerequisite - Action 5 getAllCustomPrereqTypes End"+new Date().toISOString());
            return result
        }

    } catch (error) {
        logger.error("Exception in getAllCustomPrereqTypes() is - " + getException(error))
        throw logDebug("getAllCustomPrereqTypes", null, error, "REF-065")
    }
}


/**
* @name <getPrereqTypeElements>
* @description <It returns all the page elements of custom credential prerequisite type>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPrereqTypeElements(payload) {

    let funcName = "getPrereqTypeElements"
    let prereqTypeResponse = null
    let pagesArray = null
    let elementsArray = null
    let prereqTypeJSON = {}
    let result = {
        prereqTypeElements: []
    }

    try {
        if (payload.id && payload.id != null) {
            prereqTypeResponse = openidm.query("managed/alpha_kyid_enrollment_prerequisite_type/", {
                "_queryFilter": '/_id/ eq "' + payload.id + '"'
                    + ' AND (recordState eq "ACTIVE" OR recordState eq "0") AND (typeName eq "Custom" OR typeName eq "6")'
            }, ["*"])
            logger.error("Prereq Type Response is - " + JSON.stringify(prereqTypeResponse))

            if (prereqTypeResponse && prereqTypeResponse !== null && prereqTypeResponse.resultCount > 0) {
                prereqTypeResponse.result.forEach(prereqType => {
                    if (prereqType.pages && prereqType.pages.length > 0) {
                        logger.error("Total Pages: " + prereqType.pages.length)
                        pagesArray = prereqType.pages
                        pagesArray.forEach(page => {
                            if (page.fields && page.fields.length > 0) {
                                logger.error("Total Page Fields: " + page.fields.length)
                                elementsArray = page.fields
                                elementsArray.forEach(field => {
                                    if (field.name && field.name != null) {
                                        if (setCredentialField(field.name)) {
                                            result.prereqTypeElements.push(field)
                                        }
                                    }
                                })
                            }
                        })
                    }
                })
                logger.error("endpoint/prerequisite - Action 6 getPrereqTypeElements End"+new Date().toISOString());
                return result

            } else {
                logger.error("endpoint/prerequisite - Action 6 getPrereqTypeElements End"+new Date().toISOString());
                return result
            }

        } else {
            logger.error("endpoint/prerequisite - Action 6 getPrereqTypeElements End"+new Date().toISOString());
            return logDebug(funcName, null, 'Missing_Mandatory_Input_Parameters - id', "REF-066")
        }

    } catch (error) {
        logger.error("Exception in getPrereqTypeElements() is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-067")
    }
}


/**
* @name <getUsersForVerifiedPrereqType>
* @description <It returns the list of userIDs for verified custom credential prerequisite type>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUsersForVerifiedPrereqType(payload) {

    let _ = require('lib/lodash');
    let query = ''
    let funcName = "getUsersForVerifiedPrereqType"
    let missingMandatoryParams = null
    let usrPrereqResponse = null
    let listOfUsrIds = []
    let result = {
        userDetails: []
    }

    try {
        missingMandatoryParams = isMandatoryInputPresentForVerifiedPrereqType(payload)
        if (missingMandatoryParams.length > 0) {
            return logDebug(funcName, null, 'Missing_Mandatory_Input_Parameters - ' + isMandatoryInputPresentForVerifiedPrereqType(payload), "REF-068")

        } else {
            query = createDynamicCredSearchQuery(payload.searchParameters)
            if (payload.isExpiredCredentials) {
                logger.error("Include EXPIRED UserPrerequisite Record")
                usrPrereqResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                    "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + payload.id + '"'
                        + ' AND (recordState eq "ACTIVE" OR recordState eq "0")'
                        + ' AND ' + query
                }, ["*"])
            } else {
                logger.error("Exclude EXPIRED UserPrerequisite Record")
                usrPrereqResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                    "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + payload.id + '"'
                        + ' AND (recordState eq "ACTIVE" OR recordState eq "0") AND (!(status eq "EXPIRED"))'
                        + ' AND ' + query
                }, ["*"])
            }

            logger.error("User Prerequisite Type Response is - " + JSON.stringify(usrPrereqResponse))
            logger.error("User Prerequisite Type Total Count is - " + usrPrereqResponse.resultCount)

            if (usrPrereqResponse && usrPrereqResponse !== null && usrPrereqResponse.resultCount > 0) {
                usrPrereqResponse.result.forEach(usrPrereqRecord => {
                    if (usrPrereqRecord.prerequisiteValues && usrPrereqRecord.prerequisiteValues.length > 0) {
                        logger.error("Total prerequisiteValues: " + usrPrereqRecord.prerequisiteValues.length)
                        //logger.error("usrPrereqRecord.prerequisiteValues - "+JSON.stringify(usrPrereqRecord.prerequisiteValues))
                        //logger.error("usrPrereqRecord.searchParameters - "+JSON.stringify(payload.searchParameters))
                        //logger.error("result compare - "+_.isEqual(JSON.stringify(usrPrereqRecord.prerequisiteValues),JSON.stringify(payload.searchParameters)))
                        //Compare verified prerequisiteValues with payload searchParameters
                        /*if (_.isEqual(JSON.stringify(usrPrereqRecord.prerequisiteValues), JSON.stringify(payload.searchParameters))) {
                            logger.error("Verified prerequisiteValues matches with payload searchParameters")*/
                        if (usrPrereqRecord.requestedUserAccountId && usrPrereqRecord.requestedUserAccountId != null) {
                            //result.userDetails.push(usrPrereqRecord.requestedUserAccountId)
                            //Add only unique userID in a List
                            if (!(listOfUsrIds.includes(usrPrereqRecord.requestedUserAccountId))) {
                                listOfUsrIds.push(usrPrereqRecord.requestedUserAccountId)
                            }
                        }
                        /*} else {
                            logger.error("Verified prerequisiteValues doesn't match with payload searchParameters")
                        }*/
                    }
                })

                if (listOfUsrIds.length > 0) {
                    result.userDetails = getUserDetailsFromAccount(listOfUsrIds, payload.returnParams)
                    logger.error("endpoint/prerequisite - Action 7 getUsersForVerifiedPrereqType End"+new Date().toISOString());
                    return result
                } else {
                    logger.error("endpoint/prerequisite - Action 7 getUsersForVerifiedPrereqType End"+new Date().toISOString());
                    return result
                }

            } else {
                logger.error("endpoint/prerequisite - Action 7 getUsersForVerifiedPrereqType End"+new Date().toISOString());
                return result
            }

        }

    } catch (error) {
        logger.error("Exception in getUsersForVerifiedPrereqType() is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-069")
    }
}


/**
* @name <createDynamicCredSearchQuery>
* @description <It constructs the query dynamically with the verified credentials and returns it.>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createDynamicCredSearchQuery(searchParameters) {

    let query = ''
    logger.error("Inside createDynamicCredSearchQuery")
    for (let i = 0; i < searchParameters.length; i++) {
        if (i == 0) {
            query += '('
        }
        query += '(prerequisiteValues[fieldName eq "' + searchParameters[i].fieldName + '"] AND prerequisiteValues[fieldValue eq "' + searchParameters[i].fieldValue + '"])'
        if (i < (searchParameters.length - 1)) {
            query += ' OR '
        }
    }
    query += ')'


    logger.error("Dynamic Query value is - " + query)
    return query

}


/**
* @name <isMandatoryInputPresentForVerifiedPrereqType>
* @description <It checks whether all the required input params are present. If not, returns missing params.>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function isMandatoryInputPresentForVerifiedPrereqType(paramJSON) {

    let missingRequiredInput = []
    const requestedUserAccountId = paramJSON.id
    const searchParameters = paramJSON.searchParameters
    const returnParams = paramJSON.returnParams
    const isExpiredCredentials = paramJSON.isExpiredCredentials

    if (!(requestedUserAccountId != null && requestedUserAccountId)) {
        missingRequiredInput.push("requestedUserAccountId")
    }

    if (!(searchParameters != null && searchParameters)) {
        missingRequiredInput.push("searchParameters")
    }

    if (!(returnParams != null && returnParams)) {
        missingRequiredInput.push("returnParams")
    }

    if (!(typeof isExpiredCredentials == "boolean")) {
        missingRequiredInput.push("isExpiredCredentials")
    }

    return missingRequiredInput

}


/**
* @name <getUserDetailsFromAccount>
* @description <function description>
 
* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserDetailsFromAccount(userAccountIds, returnParams) {
    logger.error("Inside getUserDetailsFromAccount")
    let funcName = "getUserDetailsFromAccount"
    let finalResponse = []


    try {
        userAccountIds.forEach(function (userAccountId) {
            var response = openidm.query("managed/alpha_user", { "_queryFilter": '/_id eq "' + userAccountId + '"' }, returnParams)
            logger.error("UserDetails are - " + JSON.stringify(response))

            /*let userIdentityResponses = {
                "userAccountId": userAccountId,
                "response":response
            }
            finalResponse.push(userIdentityResponses)*/
            finalResponse.push(response)

        })
        return finalResponse

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-070")
    }

}


/**
* @name <isMandatoryInputPresent>
* @description <It checks whether all the required input params are present. If not, returns missing params.>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function isMandatoryInputPresent(paramJSON, apiName) {

    let missingRequiredInput = []
    const requestedUserAccountId = paramJSON.requestedUserAccountId
    //const enrollmentRequestId = paramJSON.enrollmentRequestId
    const userPrereqId = paramJSON.userPrereqId
    const preReqId = paramJSON.preReqId
    const preReqTypeId = paramJSON.preReqTypeId
    const pageNumber = paramJSON.pageNumber

    if (apiName === "submitPageAPI") {
        logger.error("apiName is - " + apiName)
        const pageElements = paramJSON.pageElements
        if (!(pageElements != null && pageElements && pageElements.length > 0)) {
            missingRequiredInput.push("pageElements")
        }
    }

    if (!(requestedUserAccountId != null && requestedUserAccountId)) {
        missingRequiredInput.push("requestedUserAccountId")
    }

    /*if(!(enrollmentRequestId!=null && enrollmentRequestId)){
      missingRequiredInput.push("enrollmentRequestId")
    }*/

    if (!(userPrereqId != null && userPrereqId)) {
        missingRequiredInput.push("userPrereqId")
    }

    if (!(preReqId != null && preReqId)) {
        missingRequiredInput.push("preReqId")
    }

    if (!(preReqTypeId != null && preReqTypeId)) {
        missingRequiredInput.push("preReqTypeId")
    }

    if (!(pageNumber != null && pageNumber)) {
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
function getPageDetails(apiRequestPayload) {
    logger.error("Inside getPageDetails")
    let funcName = "getPageDetails"
    let apiName = "getPageAPI"
    let prereqValues = null
    let userProfileResponse = null
    let prereqTypeResponse = {}
    let pageResponse = {}
    let pageArray = []
    let userPrerequisiteResponse = null
    const requestBody = {
        "payload": apiRequestPayload,
        "action": 2 //Get
    }

    try {
        //Validates whether all the Mandatory Input Parameters are present or not
        if (isMandatoryInputPresent(apiRequestPayload, apiName).length > 0) {
            return logDebug(funcName, null, 'Missing_Mandatory_Input_Parameters - ' + isMandatoryInputPresent(apiRequestPayload, apiName), "REF-001")

        } else {
            //Validate If required input parameters are ACTIVE in system
            userProfileResponse = getUserAccount(requestBody)
            if (userProfileResponse.code != "ERR-BUS-SER-VAL-001") {
                //Check if prerequisite is in NOT_STARTED (0) state or not in User Prerequisite
                userPrerequisiteResponse = getUserPrerequisite(requestBody)

                if (userPrerequisiteResponse["status"] === "Found") {
                    if (userPrerequisiteResponse.result.prerequisiteValues != null && userPrerequisiteResponse.result.prerequisiteValues) {
                        prereqValues = userPrerequisiteResponse.result.prerequisiteValues
                        logger.error("prereqValues in userPrerequisite are - " + JSON.stringify(prereqValues))
                    }

                    //Get the page associated with prerequisite type
                    prereqTypeResponse = getPrerequisitePage(apiRequestPayload)

                    if (prereqTypeResponse.code != "ERR-BUS-SER-VAL-001") {       //TO-DO       
                        if (prereqTypeResponse.response.fields != null && prereqTypeResponse.response.fields && prereqTypeResponse.response.fields.length > 0) {
                            logger.error("Fields array length - " + prereqTypeResponse.response.fields.length)
                            //Prepopulate Reference Property Data
                            prereqTypeResponse = getPageWithPopulatedData(apiRequestPayload, prereqTypeResponse.response, userProfileResponse,
                                prereqValues, userPrerequisiteResponse)
                            logger.error("prereqTypeResponse value is - " + JSON.stringify(prereqTypeResponse))
                            if (prereqTypeResponse.ResponseStatus || prereqTypeResponse.code) {
                                if (prereqTypeResponse.ResponseStatus != 0 || prereqTypeResponse.code == "ERR-BUS-SER-VAL-001") {
                                    throw prereqTypeResponse
                                }

                            } else if (prereqTypeResponse.status) {
                                if (prereqTypeResponse.status == "success") {
                                  logger.error("endpoint/prerequisite - Action 4 getPageDetails End"+new Date().toISOString());
                                    return prereqTypeResponse
                                }
                            }

                            logger.error("pageResponse in getPrerequisitePageAPI after update - " + JSON.stringify(prereqTypeResponse))
                        }
                        pageArray.push(prereqTypeResponse)
                        pageResponse["pages"] = pageArray
                        logger.error("endpoint/prerequisite - Action 4 getPageDetails End"+new Date().toISOString());
                        return pageResponse

                    } else {
                        logger.error("endpoint/prerequisite - Action 4 getPageDetails End"+new Date().toISOString());
                        return prereqTypeResponse
                    }

                } else {
                    logger.error("endpoint/prerequisite - Action 4 getPageDetails End"+new Date().toISOString());
                    return userPrerequisiteResponse
                }

            } else {
                logger.error("endpoint/prerequisite - Action 4 getPageDetails End"+new Date().toISOString());
                return userProfileResponse
            }

        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-002")
    }
}


/**
* @name <getUserAccount>
* @description <It returns the ACTIVE user profile from the system>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserAccount(requestBody) {
    logger.error("Inside getUserAccount")
    let funcName = "getUserAccount"
    let userProfileResponse = null

    try {
        userProfileResponse = openidm.create("endpoint/LIB-UserProfileAPI", null, requestBody)

        if (userProfileResponse.user != null && userProfileResponse) {
            logger.error("userProfileResponse in getUserAccount is - " + JSON.stringify(userProfileResponse))
            userProfileResponse = userProfileResponse.user.result[0]
            return userProfileResponse

        } else {
            logger.error("User account is inActive in the system")
            return logDebug(funcName, null, 'Account_InActive_In_System', "REF-003")
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-004")
    }
}


/**
* @name <getUserPrerequisite>
* @description <It returns the ACTIVE user prerequisite record with NOT_STARTED status>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getUserPrerequisite(requestBody) {
    logger.error("Inside getUserPrerequisite")
    let funcName = "getUserPrerequisite"
    let userProfileResponse = null

    try {
        return openidm.create("endpoint/UserPrerequisiteAPI", null, requestBody)

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-005")
    }
}


/**
* @name <getPrerequisitePage>
* @description <It returns the requested page details along with all the associated page elements and their properties>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPrerequisitePage(requestBody) {
    logger.error("Inside getPrerequisitePage")
    let funcName = "getPrerequisitePage"
    let prereqTypeResponse = null

    try {
        prereqTypeResponse = getPrerequisiteType(requestBody)

        if (prereqTypeResponse && prereqTypeResponse !== null && prereqTypeResponse.code != "ERR-BUS-SER-VAL-001") {
            logger.error("pageResponse in getPrerequisitePage - " + JSON.stringify(prereqTypeResponse))
            return prereqTypeResponse

        } else {
            logger.error("Page not found")
            return prereqTypeResponse
        }


    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-006")
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
        nextPageNumber: null,
        response: null
    }
    let found = false
    const status = "ACTIVE"

    try {
        /**
          status(User Pre-requisite Request Status) | NOT_STARTED, PENDING_APPROVAL, COMPLETED, REJECTED, ALREADY_COMPLETED, EXPIRED, CANCELLED
          recordState(State of Record) | ACTIVE, DELETED
        */
        prereqTypeResponse = openidm.query("managed/alpha_kyid_enrollment_prerequisite_type/", {
            "_queryFilter": '/_id/ eq "' + requestBody.preReqTypeId + '"'
                + ' AND (recordState eq "' + status + '" OR recordState eq "0")'
        }, ["*"])
        logger.error("Prereq Type Response is - " + JSON.stringify(prereqTypeResponse))

        if (prereqTypeResponse && prereqTypeResponse !== null && prereqTypeResponse.resultCount > 0) {
            logger.error("prereqTypeResponse.result.length is - " + prereqTypeResponse.result.length)
            logger.error("prereqTypeResponse.result is - " + prereqTypeResponse.result[0])
            pagesArray = prereqTypeResponse.result[0].pages
            logger.error("pagesArray length is - " + pagesArray.length)

            for (let i = 0; i < pagesArray.length; i++) {
                response = null
                response = pagesArray[i]
                logger.error("page " + (i + 1) + " is - " + JSON.stringify(response))
                logger.error("response.pageNumber  " + i + " is - " + response.pageNumber)

                if (response.pageNumber == Number(requestBody.pageNumber)) {
                    logger.error("Found page")
                    found = true
                    break
                }
            }
        }

        if (found === true) {
            if (Number(requestBody.pageNumber) < pagesArray.length) {
                logger.error("Next Page is - " + (Number(requestBody.pageNumber) + 1))
                result.nextPageNumber = Number(requestBody.pageNumber) + 1
                result.response = response
            } else {
                result.response = response
            }

            return result
        } else {
            return logDebug(funcName, null, 'Page_Not_Found', "REF-007")
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-008")
    }

}


/**
* @name <getPageWithPopulatedData>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPageWithPopulatedData(apiRequestPayload, prereqTypeResponse, userProfileResponse,
    prereqValues, userPrerequisiteResponse) {
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
        "status": null,
        "message": null
    }

    try {
        fieldsArray = prereqTypeResponse.fields
        prereqTypeResponse.invokeSecondaryCall = false;

        for (let i = 0; i < fieldsArray.length; i++) {
            logger.error("Field " + (i + 1) + " is -" + fieldsArray[i])
            value = null
            field = fieldsArray[i]
            requestParamsJSON = {}
            responseParamsJSON = {}

            //Check whether prereqValues present and valid. If yes, populate data for respective field.
            if (prereqValues != null && prereqValues) {
                for (let j = 0; j < prereqValues.length; j++) {
                    logger.error("Field onsubmitRequestServiceParameterName value is - " + field.onsubmitRequestServiceParameterName)
                    logger.error("prereqValues is - " + JSON.stringify(prereqValues[j]))
                    logger.error("prereqValues field Name is - " + JSON.stringify(prereqValues[j].fieldName))
                    if (field.onsubmitRequestServiceParameterName == prereqValues[j].fieldName) {
                        logger.error("prereqValues field Value is - " + JSON.stringify(prereqValues[j].fieldValue))
                        prereqTypeResponse.fields[i].value = prereqValues[j].fieldValue
                    }
                }
            }

            //Check whether referenceobjectproperty present and valid. If yes, populate data for respective field.
            if (field.referenceobjectproperty != null && field.referenceobjectproperty) {
                logger.error("referenceobjectproperty Present")
                referenceObj = (field.referenceobjectproperty).split(".")[0]
                logger.error("referenceObj is - " + referenceObj)
                referenceObjProperty = (field.referenceobjectproperty).split(".")[1]
                logger.error("referenceObjProperty value is - " + referenceObjProperty)

                if (referenceObj != null && referenceObj && referenceObjProperty != null && referenceObjProperty) {
                    switch (referenceObj) {
                        case "user":
                            logger.error("Inside user and property value is - " + referenceObjProperty)
                            if (referenceObjProperty == "cn") {
                                value = userProfileResponse["givenName"] + " " + userProfileResponse["sn"]
                            } else {
                                value = userProfileResponse[referenceObjProperty]
                            }
                            break
                        default:
                            return logDebug(funcName, null, 'Reference_Property_Value_NotFound', "REF-009")
                            break
                    }
                    logger.error("Value from userProfileResponse is - " + value)
                    prereqTypeResponse.fields[i].value = value
                }
            }

            //Create onLoad Request Params
            if (field.onloadRequestServiceParameterName != null && field.onloadRequestServiceParameterName) {
                requestParamsJSON["fieldName"] = field.name
                requestParamsJSON["serviceParamName"] = field.onloadRequestServiceParameterName

                if (value != null) {  //reference object property value
                    requestParamsJSON["value"] = value

                } else if (field.value != null) {  //default value
                    let totValues = field.value.split(",")
                    logger.error("Total values present for field in default is - " + totValues)
                    if (totValues.length > 1) {
                        let arrayVals = []
                        for (let k = 0; k < totValues.length; k++) {
                            arrayVals.push(totValues[k])
                        }
                        requestParamsJSON["value"] = arrayVals
                    } else {
                        requestParamsJSON["value"] = field.value
                    }

                } else {
                    return logDebug(funcName, null, 'Missing_onloadRequestServiceParameter_Value_for_' + field.name, "REF-010")
                }
                requestParams.push(requestParamsJSON)
                logger.error("requestParams in JSON is -" + JSON.stringify(requestParams))
            }

            //Create onLoad Response Params
            if (field.onloadResponseServiceParameterName != null && field.onloadResponseServiceParameterName) {
                responseParamsJSON["fieldName"] = field.name
                responseParamsJSON["serviceParamName"] = field.onloadResponseServiceParameterName
                responseParams.push(responseParamsJSON)
                logger.error("responseParams in JSON is -" + JSON.stringify(responseParams))
            }

        }//End For Loop

        //Check if onLoad Endpoint Present. If yes, create onLoad Endpoint Request
        if (prereqTypeResponse.onLoadServiceEndpoint.endpointName != null && prereqTypeResponse.onLoadServiceEndpoint.endpointName) {
            logger.error("onLoad Endpoint name - " + prereqTypeResponse.onLoadServiceEndpoint.endpointName)
            //Creates Request for Endpoint
            serviceEndptRequestObj = createOnLoadEndptRequest(requestParams, responseParams, prereqTypeResponse.onLoadServiceEndpoint.endpointName)

            if (serviceEndptRequestObj != null && serviceEndptRequestObj.code != "ERR-BUS-SER-VAL-001") {

                //Check whether configured endpoint is of Workflow Type
                if (serviceEndptRequestObj.endpoint.isWorkflow) {
                    logger.error("Execute Workflow OnLoad")
                    prerequisiteResponse = getPrerequisite(apiRequestPayload.preReqId)
                    if (prerequisiteResponse.code != "ERR-BUS-SER-VAL-001") {
                        prereqName = prerequisiteResponse.result[0].name
                    } else {
                        return prerequisiteResponse
                    }
                    workflowInputJSON["pageNumber"] = apiRequestPayload.pageNumber
                    workflowInputJSON["endpointRequest"] = serviceEndptRequestObj
                    workflowInputJSON["userPrerequisiteId"] = apiRequestPayload.userPrereqId
                    workflowResponse = invokeGenericWorkflow(workflowInputJSON, userProfileResponse, userPrerequisiteResponse.result,
                        prereqName, serviceEndptRequestObj, null)
                    if (workflowResponse.code == 201) {
                        for (let l = 0; l < fieldsArray.length; l++) {
                            if (fieldsArray[l].name == "Message") {
                                prereqTypeResponse.fields[l].value = "Your request has been submitted for approval and you will be notified via email. Please click continue to proceed with this request."
                            }
                        }
                    }

                    //Check whether configured endpoint is of Agreement Type 
                } else if (serviceEndptRequestObj.endpoint.isAgreement) {
                    logger.error("Execute Agreement")

                    prereqTypeResponse.invokeSecondaryCall = true; // need second call from frontend

                    agreementEndptResponse = invokeAgreementEndpt(serviceEndptRequestObj, apiRequestPayload)
                    if (agreementEndptResponse.ResponseStatus != 0) {
                        //return agreementEndptResponse
                        return logDebug(funcName, null, agreementEndptResponse.message, "REF-011")
                    } else {
                        for (let l = 0; l < fieldsArray.length; l++) {
                            if (fieldsArray[l].name == "Message") {
                                prereqTypeResponse.fields[l].value = agreementEndptResponse.message
                            }
                        }
                    }

                    //Check whether configured endpoint is of Training Type 
                } else if (serviceEndptRequestObj.endpoint.isTraining) {
                    logger.error("Execute Training")
                    //patch user prerequisite status
                    /*let patchResponse = patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null) //Remove this hard-coded patch ops
                    if(patchResponse.status=="success"){
                      prereqTypeResponse.onLoadServiceEndpoint.successResponseParameterVaues[0].paramValue = "No Pending Training modules to complete"
                    }*/
                   prereqTypeResponse.invokeSecondaryCall = true; // NR: Date 1/5/2026 - Added to Call from Frontend

                    trainingEndptResponse = invokeTrainingEndpt(serviceEndptRequestObj, apiRequestPayload)
                    if (trainingEndptResponse.ResponseStatus != 0) {
                        //return trainingEndptResponse
                        return logDebug(funcName, null, trainingEndptResponse.message, "REF-012")
                    } else {
                        for (let l = 0; l < fieldsArray.length; l++) {
                            if (fieldsArray[l].name == "Message") {
                                prereqTypeResponse.fields[l].value = trainingEndptResponse.message
                            }
                        }
                    }
                }

                //Invokes Endpoint
                /*serviceEndptResponse = invokeOnLoadEndpt(serviceEndptRequestObj)
                
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

            } else {
                return prerequisiteResponse
            }

        }

        return prereqTypeResponse

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-013")
    }
}


/**
* @name <createOnLoadEndptRequest>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createOnLoadEndptRequest(requestParams, responseParams, endptName) {
    logger.error("Inside createOnLoadEndptRequest")
    let funcName = "createOnLoadEndptRequest"
    const status = "ACTIVE"
    let serviceEndptResponse = null
    let serviceEndptRequestObj = {}

    try {
        serviceEndptResponse = openidm.query("managed/alpha_kyid_enrollment_service_endpoint/", {
            "_queryFilter": '/name/ eq "' + endptName + '"'
                + ' AND (recordState eq "' + status + '" OR recordState eq "0")'
        }, ["*"])
        logger.error("Service Endpoint Response is - " + JSON.stringify(serviceEndptResponse))

        if (serviceEndptResponse.resultCount > 0) {
            serviceEndptResponse = serviceEndptResponse.result[0]
            serviceEndptRequestObj["endpoint"] = serviceEndptResponse
            serviceEndptRequestObj["requestParams"] = requestParams
            serviceEndptRequestObj["responseParams"] = responseParams

            logger.error("Service Endpoint Request Object is - " + JSON.stringify(serviceEndptRequestObj))
            return serviceEndptRequestObj

        } else {
            return logDebug(funcName, null, 'Service_Endpoint_Configuration_Not_Found', "REF-014")
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-015")
    }
}


/**
* @name <invokeGenericWorkflow>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeGenericWorkflow(payload, userProfileResponse, userPrerequisiteResponse,
    prereqName, serviceEndptRequestObj, expiryDate) {
    logger.error("endpoint/prerequisite - invokeGenericWorkflow Function Start"+new Date().toISOString());
    logger.error("Inside invokeGenericWorkflow")
    //logger.error("invokeGenericWorkflow input payload is - "+JSON.stringify(payload))
    //logger.error("userProfileResponse is - "+JSON.stringify(userProfileResponse))
    //logger.error("userPrerequisiteResponse is - "+JSON.stringify(userPrerequisiteResponse))
    let funcName = "invokeGenericWorkflow"
    let workflowResponse = null
    let requestorProfileResponse = null
    let customJSONObj = {
        userPrerequisiteId: null
    }
    let reqParams = {}
    let valuesJSON = null

    let requesterUserObj = {
        requesterUserGivenName: null,
        requesterUserId: null,
        requesterUserMail: null,
        requesterUserSn: null,
        requesterUserUsername: null,
        applicationName: null,
        roleName: null
    }

    let requestedUserObj = {
        requestedUserGivenName: null,
        requestedUserId: null,
        requestedUserMail: null,
        requestedUserSn: null,
        requestedUserUsername: null,
        applicationName: null,
        roleName: null
    }

    let requestPayload = {
        requestedUserAccountId: null
    }

    let page = {
        pageNumber: null,
        fields: {},
        values: []
    }

    try {
        if (userPrerequisiteResponse.requestedUserAccountId != null) {
            //logger.error("userPrerequisiteResponse.requestedUserAccountId is - "+userPrerequisiteResponse.requestedUserAccountId)
            requestPayload.requestedUserAccountId = userPrerequisiteResponse.requestedUserAccountId
        }
        var roleApplicationResponse = getRoleAndApplicationDetails(userPrerequisiteResponse.enrollmentRequestId, requestPayload.requestedUserAccountId)

        const requestBody = {
            payload: requestPayload,
            action: 2 //Get
        }

        customJSONObj.userPrerequisiteId = payload.userPrerequisiteId

        /*if(transactionId()!=null && transactionId()){
          customJSONObj["transactionId"] = transactionId()
        } else {
          customJSONObj["transactionId"] = generateGUID()
        }*/

        requestedUserObj.requestedUserGivenName = userProfileResponse.givenName
        requestedUserObj.requestedUserId = userProfileResponse._id
        requestedUserObj.requestedUserMail = userProfileResponse.mail
        requestedUserObj.requestedUserSn = userProfileResponse.sn
        requestedUserObj.requestedUserUsername = userProfileResponse.userName
        if (roleApplicationResponse != null) {
            requestedUserObj.applicationName = roleApplicationResponse.applicationName
            requestedUserObj.roleName = roleApplicationResponse.roleName
        }
        customJSONObj.requestedUser = requestedUserObj


        if (getUserAccount(requestBody) != null && getUserAccount(requestBody)) {
            //logger.error("requestorProfileResponse is - "+getUserAccount(requestBody))
            requestorProfileResponse = getUserAccount(requestBody)
            requesterUserObj.requesterUserGivenName = requestorProfileResponse.givenName
            requesterUserObj.requesterUserId = requestorProfileResponse._id
            requesterUserObj.requesterUserMail = requestorProfileResponse.mail
            requesterUserObj.requesterUserSn = requestorProfileResponse.sn
            requesterUserObj.requesterUserUsername = requestorProfileResponse.userName
            if (roleApplicationResponse != null) {
                requesterUserObj.applicationName = roleApplicationResponse.applicationName
                requesterUserObj.roleName = roleApplicationResponse.roleName
            }
        }
        customJSONObj.requesterUser = requesterUserObj

        page.pageNumber = Number(payload.pageNumber)
        for (let i = 0; i < payload.endpointRequest.requestParams.length; i++) {
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
                // expiryDate: identityServer.getProperty("esv.workflow.expirydate")
            }
        }

        logger.error("Generic Workflow Body is " + JSON.stringify(body));
        workflowResponse = openidm.action(payload.endpointRequest.endpoint.url, "POST", body, {});
        logger.error("Generic Workflow Response is " + JSON.stringify(workflowResponse));

        //return workflowResponse
        logger.error("endpoint/prerequisite - invokeGenericWorkflow Function End"+new Date().toISOString());

        return {
            "code": 201,
            "status": "success",
            "message": "success"
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + error.message)
        throw logDebug(funcName, null, error, "REF-016")
    }
}


/**
* @name <invokeAgreementEndpt>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeAgreementEndpt(serviceEndptRequestObj, apiRequestPayload) {
    logger.error("endpoint/prerequisite - invokeAgreementEndpt Function Start"+new Date().toISOString());
    logger.error("Inside invokeAgreementEndpt")
    let funcName = "invokeAgreementEndpt"
    let responseAgreementEndptAPI = null
    let url = null
    let retryCountForAgreement = 0
    let shouldRetryForAgreement = true
    let payload = {
        KOGID: null,
        AgreementNames: null
    }
    let requestBody = {
        url: null,
        scope: identityServer.getProperty("esv.useragreementssignedcheck.api.scope"),
        method: "POST",
        payload: null
    }
    let apiResult = {
        code: "ERR-BUS-SER-VAL-001",
        ResponseStatus: -1,
        message: null
    }

    try {
        if (serviceEndptRequestObj.endpoint.url != null && serviceEndptRequestObj.endpoint.url) {
            requestBody.url = serviceEndptRequestObj.endpoint.url
            //requestBody.url = identityServer.getProperty(serviceEndptRequestObj.endpoint.url)

            //Create Payload for KOG Agreement Endpoint
            for (let i = 0; i < serviceEndptRequestObj.requestParams.length; i++) {
                if (serviceEndptRequestObj.requestParams[i].fieldName == "KOGID") {
                    logger.error("Value of KOGID is - " + serviceEndptRequestObj.requestParams[i].value)
                    payload.KOGID = serviceEndptRequestObj.requestParams[i].value
                }

                if (serviceEndptRequestObj.requestParams[i].fieldName == "AgreementNames") {
                    logger.error("Value of AgreementNames is - " + serviceEndptRequestObj.requestParams[i].value)
                    payload.AgreementNames = [serviceEndptRequestObj.requestParams[i].value]
                }
            }

            if (payload.KOGID == null) {
                logger.error("User_KOGID_Not_Found for invokeAgreementEndpt")
                apiResult.message = "UserID_Not_Found"
                logger.error("endpoint/prerequisite - invokeAgreementEndpt Function End"+new Date().toISOString());
                return apiResult
            }

            if (payload.AgreementNames == null) {
                logger.error("Agreement_Details_Not_Configured for invokeAgreementEndpt")
                apiResult.message = "Agreement_Details_Not_Configured"
                logger.error("endpoint/prerequisite - invokeAgreementEndpt Function End"+new Date().toISOString());
                return apiResult
            }

            requestBody.payload = payload
            logger.error("Request Body for invokeAgreementEndptAPI is - " + JSON.stringify(requestBody))

            let pendingCompletion = []

            while (shouldRetryForAgreement && retryCountForAgreement < 3) {
                try {
                    responseAgreementEndptAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                    logger.error("endpoint/prerequisite - invokeAgreementEndpt API End"+new Date().toISOString());
                    shouldRetryForAgreement = false
                }
                catch (error) {
                    logger.error("Exception in " + funcName + " is - " + getException(error))
                    logger.error("responseAgreementEndptAPI from service - " + JSON.stringify(responseAgreementEndptAPI))
                    retryCountForAgreement++;
                    logger.error("Retry count of invokeAgreementEndptAPI is: " + retryCountForAgreement);
                    if (retryCountForAgreement == 3) {
                        //this means that the KOG Agreement Service failed more than 3 times, by default all agreements will be shown as pending here.
                        if (!responseAgreementEndptAPI) {
                            responseAgreementEndptAPI = {}
                            responseAgreementEndptAPI.response = {}
                            responseAgreementEndptAPI.response.ResponseCode = 0
                            responseAgreementEndptAPI.response.AgreementsSignedStatus = []
                            pendingCompletion = payload.AgreementNames //assume that all agreements are still pending
                        }
                    }
                }
            }


            logger.error("responseAgreementEndptAPI in invokeAgreementEndptAPI is - " + JSON.stringify(responseAgreementEndptAPI))

            if (responseAgreementEndptAPI != null && responseAgreementEndptAPI) {

                if (responseAgreementEndptAPI.response.ResponseStatus == 0) {
                    apiResult.ResponseStatus = responseAgreementEndptAPI.response.ResponseStatus
                    apiResult.code = responseAgreementEndptAPI.status

                    if (responseAgreementEndptAPI.response.AgreementsSignedStatus != null) {
                        let validateStatus = responseAgreementEndptAPI.response.AgreementsSignedStatus
                        let listAgreements = payload.AgreementNames
                        //let pendingCompletion = []

                        for (let j = 0; j < validateStatus.length; j++) {
                            if (listAgreements.includes(validateStatus[j].AgreementName)) {
                                logger.error("Agreement Found")
                                if (!validateStatus[j].IsUserAgreementCompleted) {
                                    pendingCompletion.push(validateStatus[j].AgreementName)
                                }
                            }
                        }

                        if (pendingCompletion.length == 0) {
                            /*
                              apiResult.message = "You've signed the required agreements. Please click continue to proceed with the request."
                              //patch user prerequisite status
                              patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"COMPLETED")     
                            */
                            apiResult.message = "<p>You've signed the required agreements. Please click continue to proceed with the request.</p>"
                            //patch user prerequisite status as "COMPLETED"
                            patchUserPrerequisite(apiRequestPayload, apiRequestPayload.userPrereqId, serviceEndptRequestObj, null, "COMPLETED")
                            // userPrereqId -> PrereqID, PrereqName, roleName, appliCationName, EnrollmentContxt

                           
                            completePendingUserPrereq(apiRequestPayload, serviceEndptRequestObj, null)

                        } else {
                            /*
                              apiResult.message = "You need to sign the below agreements to get the required access - "+pendingCompletion
                              //patch user prerequisite status as "PENDING"
                              patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"PENDING")
                            */

                            apiResult.message = "<p>You need to sign the below agreements to get the required access - </p>"

                            let url = identityServer.getProperty('esv.useragreementssignedredirect.api')
                            pendingCompletion.forEach(pendingItem => {
                                //apiResult.message =  apiResult.message + "<a target='_blank' href='https://ide3.kog.ky.gov/account/SignAgreement2.aspx?AgreementName="+encodeURI(pendingItem)+"'>"+pendingItem+"</a>"
                                apiResult.message = apiResult.message + "<a target='_blank' href=" + url + encodeURI(pendingItem) + ">" + pendingItem + "</a>"
                            })
                            apiResult.message = apiResult.message
                            //patch user prerequisite status as "PENDING"
                            patchUserPrerequisite(apiRequestPayload, apiRequestPayload.userPrereqId, serviceEndptRequestObj, null, "PENDING")
                        }

                        logger.error("apiResult in invokeAgreementEndptAPI are - " + JSON.stringify(apiResult))
                        logger.error("endpoint/prerequisite - invokeAgreementEndpt Function End"+new Date().toISOString());
                        return apiResult

                    } else {
                        logger.error("AgreementsSignedStatus_Not_Present_In_Response for invokeAgreementEndpt")
                        apiResult.message = "AgreementsSignedStatus_Not_Present_In_Response"
                        logger.error("endpoint/prerequisite - invokeAgreementEndpt Function End"+new Date().toISOString());
                        return apiResult
                    }

                } else {
                    apiResult.ResponseStatus = responseAgreementEndptAPI.response.ResponseStatus
                    apiResult.message = responseAgreementEndptAPI.response.MessageResponses
                    //apiResult.code = responseAgreementEndptAPI.status
                    logger.error("endpoint/prerequisite - invokeAgreementEndpt Function End"+new Date().toISOString());
                    return apiResult
                }
            }

        } else {
            logger.error("Agreement_Endpoint_Url_Not_Configured for invokeAgreementEndpt")
            apiResult.message = "Agreement_Endpoint_Url_Not_Configured"
            logger.error("endpoint/prerequisite - invokeAgreementEndpt Function End"+new Date().toISOString());
            return apiResult
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-017")
    }
}

function getUserPrerequisites(userId, prereqId) {
    try {
        logger.error("Executing getUserPrerequisites Function")
        var userPrereqIds = []
        var query = `requestedUserAccountId eq '${userId}' AND preRequisiteId/_refResourceId eq '${prereqId}' AND (status eq '0' OR status eq 'NOT_STARTED' OR status eq '1' OR status eq 'PENDING_APPROVAL' OR status eq 'REVERIFY' OR status eq '8' OR status eq '7' OR status eq 'PENDING') AND (recordState eq '0' OR recordState eq 'ACTIVE')`
        var userQueryResult = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites", {
            _queryFilter: query
        }, ["*"]);
        if (userQueryResult && userQueryResult.resultCount > 0) {
            logger.error("getUserPrerequisites :  Found User Prereq ")
            userQueryResult.result.forEach(userPrereq => {
                if (userPrereq._id) {
                    userPrereqIds.push(userPrereq._id)
                }
            })
        }
        return userPrereqIds
    } catch (error) {
        logger.error("getUserPrerequisites :  Error Occurred While Getting User Prerequisites" + error)
        return []
    }

}

function completePendingUserPrereq(apiRequestPayload, serviceEndptRequestObj, expiryDate) {
    try {
        let prereqResponse = getPrerequisite(apiRequestPayload.preReqId)
        if ((prereqResponse && prereqResponse.resultCount && prereqResponse.resultCount > 0 && prereqResponse.result[0].enrollmentActionSettings && prereqResponse.result[0].enrollmentActionSettings.allowReuse === true) &&
            ((prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld) && (prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld == "0" || prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld == "-1"))) {
            let pendingUserPrereqIds = getUserPrerequisites(apiRequestPayload.requestedUserAccountId, apiRequestPayload.preReqId)
            pendingUserPrereqIds.forEach(userPrereqId => {
                patchUserPrerequisite(apiRequestPayload, userPrereqId, serviceEndptRequestObj, expiryDate, "ALREADY_COMPLETED")
            })
        }
    } catch (error) {
        logger.error("Error Occurred in endpoint/prerequisite for Function completePendingUserPrereq" + error)
        return null
    }
}


/**
* @name <invokeTrainingEndpt>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
  {
    "UserTrainingsStatus": [
        {
            "IsTrainingCompleted": false,
            "TrainingModuleName": "FS-2 Optical Character Recognition Training Video"
        }
    ],
    "ResponseStatus": 0,
    "MessageResponses": null
  }
*/
function invokeTrainingEndpt(serviceEndptRequestObj, apiRequestPayload) {
    logger.error("endpoint/prerequisite - invokeTrainingEndpt Function Start"+new Date().toISOString());
    logger.error("Inside invokeTrainingEndpt")
    let funcName = "invokeTrainingEndpt"
    let responseTrainingEndptAPI = null
    let retryCountForTraining = 0
    let shouldRetryForTraining = true
    let url = null
    let payload = {
        KOGID: null,
        TrainingModuleNames: null
    }
    let requestBody = {
        url: null,
        scope: identityServer.getProperty("esv.usertrainingscompletioncheck.api.scope"),
        method: "POST",
        payload: null
    }
    let apiResult = {
        code: "ERR-BUS-SER-VAL-001",
        ResponseStatus: null,
        message: null
    }

    try {
        if (serviceEndptRequestObj.endpoint.url != null && serviceEndptRequestObj.endpoint.url) {
            requestBody.url = serviceEndptRequestObj.endpoint.url
            //requestBody.url = identityServer.getProperty(serviceEndptRequestObj.endpoint.url)

            //Create Payload for KOG Training Endpoint
            for (let i = 0; i < serviceEndptRequestObj.requestParams.length; i++) {
                if (serviceEndptRequestObj.requestParams[i].fieldName == "KOGID") {
                    logger.error("Value of KOGID is - " + serviceEndptRequestObj.requestParams[i].value)
                    payload.KOGID = serviceEndptRequestObj.requestParams[i].value
                }

                if (serviceEndptRequestObj.requestParams[i].fieldName == "TrainingModuleNames") {
                    logger.error("Value of TrainingModuleNames are - " + serviceEndptRequestObj.requestParams[i].value)
                    payload.TrainingModuleNames = [serviceEndptRequestObj.requestParams[i].value]
                }
            }

            if (payload.KOGID == null) {
                logger.error("UserID_Not_Found for invokeTrainingEndpt")
                apiResult.message = "UserID_Not_Found"
                logger.error("endpoint/prerequisite - invokeTrainingEndpt Function End"+new Date().toISOString());
                return apiResult
            }

            if (payload.TrainingModuleNames == null) {
                logger.error("Training_Modules_Not_Configured for invokeTrainingEndpt")
                apiResult.message = "Training_Modules_Not_Configured"
                logger.error("endpoint/prerequisite - invokeTrainingEndpt Function End"+new Date().toISOString());
                return apiResult
            }

            requestBody.payload = payload
            logger.error("Request Body for invokeTrainingEndpt is - " + JSON.stringify(requestBody))

            while (shouldRetryForTraining && retryCountForTraining < 3) {
                try {
                    responseTrainingEndptAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                    logger.error("endpoint/prerequisite - invokeTrainingEndpt API End"+new Date().toISOString());
                    shouldRetryForTraining = false
                }
                catch (error) {
                    logger.error("Exception in " + funcName + " is - " + getException(error))
                    retryCountForTraining++;
                    logger.error("Retry count of invokeTrainingEndpt is: " + retryCountForTraining);
                    if (retryCountForTraining == 3) {
                        throw logDebug(funcName, null, error, "REF-073")
                    }
                }
            }

            //responseTrainingEndptAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
            logger.error("responseTrainingEndptAPI in invokeTrainingEndpt is - " + JSON.stringify(responseTrainingEndptAPI))

            if (responseTrainingEndptAPI != null && responseTrainingEndptAPI) {

                if (responseTrainingEndptAPI.response.ResponseStatus == 0) {
                    apiResult.ResponseStatus = responseTrainingEndptAPI.response.ResponseStatus
                    apiResult.code = responseTrainingEndptAPI.status

                    if (responseTrainingEndptAPI.response.UserTrainingsStatus != null) {
                        let validateStatus = responseTrainingEndptAPI.response.UserTrainingsStatus
                        let listTrainings = payload.TrainingModuleNames
                        let pendingCompletion = []

                        for (let j = 0; j < validateStatus.length; j++) {
                            if (listTrainings.includes(validateStatus[j].TrainingModuleName)) {
                                logger.error("Training Found")
                                if (!validateStatus[j].IsTrainingCompleted) {
                                    pendingCompletion.push(validateStatus[j].TrainingModuleName)
                                }
                            }
                        }
                        // pendingCompletion = []
                        if (pendingCompletion.length == 0) {
                            apiResult.message = "You've completed the required trainings. Please click continue to proceed with the request."
                            //patch user prerequisite status as "COMPLETED"
                            patchUserPrerequisite(apiRequestPayload, apiRequestPayload.userPrereqId, serviceEndptRequestObj, null, "COMPLETED")

                            // Narendra: To Patch Reuse Prerequisite
                            completePendingUserPrereq(apiRequestPayload, serviceEndptRequestObj, null)

                            // Narendra: End
                            // let prereqResponse = getPrerequisite(apiRequestPayload.preReqId)
                            // if(prereqResponse && prereqResponse.resultCount && prereqResponse.resultCount>0 && prereqResponse.result[0].enrollmentActionSettings.allowReuse === true && 
                            //    (prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld && Number(prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld)) > 0){
                            //   let pendingUserPrereqIds = getUserPrerequisites(apiRequestPayload.requestedUserAccountId,apiRequestPayload.preReqId)
                            //   pendingUserPrereqIds.forEach(userPrereqId=>{
                            //     patchUserPrerequisite(apiRequestPayload,userPrereqId, serviceEndptRequestObj, null, "COMPLETED")
                            //   })
                            // }
                        
                        } else {
                            /*
                              apiResult.message = "You need to complete the below trainings to get the required access - "+pendingCompletion
                              //patch user prerequisite status as "PENDING"
                              patchUserPrerequisite(apiRequestPayload,apiRequestPayload.userPrereqId,serviceEndptRequestObj,null,"PENDING")
                            */
                            apiResult.message = "<p>You need to complete the below trainings to get the required access - </p>"
                            let url = identityServer.getProperty('esv.usertrainingscompletionredirect.api')
                            pendingCompletion.forEach(pendingItem => {
                                apiResult.message = apiResult.message + "<a target='_blank' href=" + url + encodeURI(pendingItem) + ">" + pendingItem + "</a>"
                            })
                            apiResult.message = apiResult.message
                            //patch user prerequisite status as "PENDING"
                            patchUserPrerequisite(apiRequestPayload, apiRequestPayload.userPrereqId, serviceEndptRequestObj, null, "PENDING")
                        }

                        logger.error("apiResult in invokeTrainingEndpt is - " + JSON.stringify(apiResult))
                        logger.error("endpoint/prerequisite - invokeTrainingEndpt Function End"+new Date().toISOString());
                        return apiResult

                    } else {
                        logger.error("UserTrainingsStatus_Not_Present_In_Response for invokeTrainingEndpt")
                        apiResult.message = "UserTrainingsStatus_Not_Present_In_Response"
                        logger.error("endpoint/prerequisite - invokeTrainingEndpt Function End"+new Date().toISOString());
                        return apiResult
                    }

                } else {
                    apiResult.ResponseStatus = responseTrainingEndptAPI.response.ResponseStatus
                    apiResult.message = responseTrainingEndptAPI.response.MessageResponses
                    //apiResult.code = responseTrainingEndptAPI.status
                    logger.error("endpoint/prerequisite - invokeTrainingEndpt Function End"+new Date().toISOString());
                    return apiResult
                }
            }

        } else {
            logger.error("Training_Endpoint_Url_Not_Configured for invokeTrainingEndpt")
            apiResult.message = "Training_Endpoint_Url_Not_Configured"
            logger.error("endpoint/prerequisite - invokeTrainingEndpt Function End"+new Date().toISOString());
            return apiResult
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-018")
    }
}


/**
* @name <isResponseParamPresent>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function isResponseParamPresent(resultParams, prereqTypeResponse, result) {
    logger.error("endpoint/prerequisite - isResponseParamPresent Function Start"+new Date().toISOString());
    logger.error("Inside isResponseParamPresent")
    let funcName = "isResponseParamPresent"
    let response = null
    let field = null
    let value = null
    let paramName = null
    let fieldsArray = null

    try {
        fieldsArray = prereqTypeResponse.fields
        for (let i = 0; i < fieldsArray.length; i++) {
            //logger.error("Field "+ (i+1)+" is -"+fieldsArray[i])
            value = null
            field = fieldsArray[i]
            if (field.onloadResponseServiceParameterName != null && field.onloadResponseServiceParameterName) {
                paramName = field.onloadResponseServiceParameterName
                if (resultParams.includes(paramName)) {
                    logger.error("Field response parameter found in endpoint result - " + paramName)
                    for (let j = 0; j < fieldsArray.length; j++) {
                        if (fieldsArray[j].name == paramName) {
                            prereqTypeResponse.fields[j].value = result[paramName]
                        }
                    }
                }
            }
        }
      logger.error("endpoint/prerequisite - isResponseParamPresent Function End"+new Date().toISOString());

        return prereqTypeResponse
    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-019")
    }
}


//************* Process Submitted Page **************//


/**
* @name <processPageDetails>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function processPageDetails(apiRequestPayload) {
    logger.error("endpoint/prerequisite - processPageDetails Function Start"+new Date().toISOString());
    logger.error("Inside processPageDetails")
    let apiName = "submitPageAPI"
    let funcName = "processPageDetails"
    let submitEndpoint = null
    let pageResponse = null
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
        "status": null,
        "message": null
    }
    let preReqNextPage = {
        "enrollmentRequestId": "",
        "userPrereqId": "",
        "preReqId": "",
        "preReqTypeId": "",
        "pageNumber": ""
    }
    let prereqName = null
    let workflowResponse = null
    let payloadKOGCredentialsAPI = null
    let payloadUserOnboardingAPI = null
    let responseKOGCredentialsAPI = null
    let responseUserOnboardingAPI = null


    const requestBody = {
        "payload": apiRequestPayload,
        "action": 2 //Get
    }

    try {
        //Validates whether all the Mandatory Input Parameters are present or not
        if (isMandatoryInputPresent(apiRequestPayload, apiName).length > 0) {
            return logDebug(funcName, null, 'Missing_Mandatory_Input_Parameters - ' + isMandatoryInputPresent(apiRequestPayload, apiName), "REF-020")

        } else {
            //Validate If required input parameters are ACTIVE in system
            userProfileResponse = getUserAccount(requestBody)

            logger.error("userProfileResponse- " + JSON.stringify(userProfileResponse))

            if (userProfileResponse.code != "ERR-BUS-SER-VAL-001") {
                //Check if prerequisite is in NOT_STARTED or PENDING_APPROVAL or PENDING or COMPLETED state in User Prerequisite
                userPrerequisiteResponse = getUserPrerequisite(requestBody)
                logger.error("userPrerequisiteResponse- " + JSON.stringify(userPrerequisiteResponse))


                if (userPrerequisiteResponse["status"] === "Found") {
                    //Get the configured page settings associated with prerequisite type
                    pageResponse = getPrerequisitePage(apiRequestPayload)
                    logger.error("pageResponse- " + JSON.stringify(pageResponse))


                    if (pageResponse.code != "ERR-BUS-SER-VAL-001") {
                        //Read the data provided by the user for the dynamic page
                        //isPageElementsValidationSuccess(apiRequestPayload.pageElements,pageResponse.fields,userProfileResponse)

                        //Checks if onSubmit Endpoint is Present. 
                        if (pageResponse.response.onSubmitServiceEndpoint.endpointName != null && pageResponse.response.onSubmitServiceEndpoint.endpointName) {
                            onSubmitEndpoint = pageResponse.response.onSubmitServiceEndpoint.endpointName
                            logger.error("onSubmit Endpoint is - " + onSubmitEndpoint)
                            logger.error("Fields array length - " + pageResponse.response.fields.length)

                            if (pageResponse.response.fields != null && pageResponse.response.fields && pageResponse.response.fields.length > 0) {
                                //Validate if onSubmit service endpoint is configured
                                serviceEndptConfig = getSubmitEndpoint(onSubmitEndpoint)

                                if (serviceEndptConfig.code != "ERR-BUS-SER-VAL-001") {
                                    //Creates Request for Endpoint
                                    logger.error("pageResponse.response - " + JSON.stringify(pageResponse.response))
                                    serviceEndptRequestObj = createOnSubmitEndptRequest(pageResponse.response, apiRequestPayload.pageElements, serviceEndptConfig)

                                    if (serviceEndptRequestObj != null) {
                                        /* Get value of enrollmentActionSettings.saveInput flag from Prerequisite. This flag determines if 
                                         the verified inputs of the pre-requisite should be saved within the platform */
                                        prerequisiteResponse = getPrerequisite(apiRequestPayload.preReqId)
                                        logger.error("prerequisiteResponse- " + JSON.stringify(pageResponse))

                                        if (prerequisiteResponse.code != "ERR-BUS-SER-VAL-001") {
                                            if (prerequisiteResponse.result[0].expiry.dueDateType != null) {
                                                expiryDate = getExpiryDate(prerequisiteResponse.result[0].expiry.dueDateType, prerequisiteResponse.result[0].expiry.dueDateValue)
                                                logger.error("expiry DateType in processPageDetails - " + prerequisiteResponse.result[0].expiry.dueDateType)
                                            }
                                            prereqName = prerequisiteResponse.result[0].name

                                            //Is Configured endpoint of workflow type
                                            if (serviceEndptConfig.isWorkflow) {
                                                logger.error("Execute Workflow")
                                                workflowInputJSON["pageNumber"] = pageResponse.response.pageNumber
                                                workflowInputJSON["endpointRequest"] = serviceEndptRequestObj
                                                workflowInputJSON["userPrerequisiteId"] = userPrerequisiteResponse.result._id
                                                workflowResponse = invokeWorkflow(workflowInputJSON, userProfileResponse, userPrerequisiteResponse.result,
                                                    prereqName, serviceEndptRequestObj, expiryDate)
                                                apiResponse.status = workflowResponse.status
                                                apiResponse.message = workflowResponse.message

                                                logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
    
                                                return apiResponse

                                            } else {
                                                logger.error("Not a Workflow")
                                                if (pageResponse.response.onSubmitServiceEndpoint.successResponseParameterVaues != null
                                                    && pageResponse.response.onSubmitServiceEndpoint.successResponseParameterVaues) {
                                                    logger.error("Endpoint success Response Params are - " + JSON.stringify(pageResponse.response.onSubmitServiceEndpoint))
                                                    //Invoke 3rd Party service endpoint
                                                    serviceEndptResponse = invokeServiceEndpoint(serviceEndptRequestObj, pageResponse.response.onSubmitServiceEndpoint.successResponseParameterVaues,
                                                        serviceEndptConfig, apiRequestPayload, userProfileResponse, userPrerequisiteResponse.result)

                                                    if (serviceEndptResponse.code == 200) {
                                                        if (serviceEndptResponse.ResponseStatus == 200 || serviceEndptResponse.ResponseStatus == 0) {

                                                            if (pageResponse.nextPageNumber != null && Number(pageResponse.nextPageNumber) > 1) {
                                                                apiResponse.code = "SUC-BUS-SER-SUB-001"
                                                                apiResponse.status = "success"
                                                                if (serviceEndptResponse.message != null && serviceEndptResponse.message) {
                                                                    apiResponse.message = serviceEndptResponse.message
                                                                } else {
                                                                    apiResponse.message = "success"
                                                                }
                                                                preReqNextPage.pageNumber = pageResponse.nextPageNumber //TO-DO
                                                                preReqNextPage.enrollmentRequestId = apiRequestPayload.enrollmentRequestId
                                                                preReqNextPage.userPrereqId = apiRequestPayload.userPrereqId
                                                                preReqNextPage.preReqId = apiRequestPayload.preReqId
                                                                preReqNextPage.preReqTypeId = apiRequestPayload.preReqTypeId
                                                                apiResponse.preReqNextPage = preReqNextPage
                                                                logger.error("nextpage details in prereq object in processPageDetails - " + JSON.stringify(apiResponse))
                                                                logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                return apiResponse

                                                            } else {

                                                                if (serviceEndptConfig.isOrgType) {
                                                                    //Patch UserPrerequisite Record with "COMPLETED" status
                                                                    patchUserPrereqResponse = patchUserPrerequisite(apiRequestPayload, userPrerequisiteResponse.result._id, null, expiryDate, "COMPLETED")

                                                                    completePendingUserPrereq(apiRequestPayload, null, expiryDate)
                                                                    // let prereqResponse = getPrerequisite(apiRequestPayload.preReqId)
                                                                    // if(prereqResponse && prereqResponse.resultCount && prereqResponse.resultCount>0 && prereqResponse.result[0].enrollmentActionSettings.allowReuse === true && 
                                                                    //    (prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld && Number(prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld)) > 0){
                                                                    //   let pendingUserPrereqIds = getUserPrerequisites(apiRequestPayload.requestedUserAccountId,apiRequestPayload.preReqId)
                                                                    //   pendingUserPrereqIds.forEach(userPrereqId=>{
                                                                    //     patchUserPrerequisite(apiRequestPayload,userPrereqId, null, expiryDate, "COMPLETED")
                                                                    //   })
                                                                    // }

                                                                  

                                                                    apiResponse.status = patchUserPrereqResponse.status
                                                                    apiResponse.message = patchUserPrereqResponse.message
                                                                    if (pageResponse.nextPageNumber != null) //TO-DO
                                                                    {
                                                                        preReqNextPage.pageNumber = pageResponse.nextPageNumber //TO-DO
                                                                        preReqNextPage.enrollmentRequestId = apiRequestPayload.enrollmentRequestId
                                                                        preReqNextPage.userPrereqId = apiRequestPayload.userPrereqId
                                                                        preReqNextPage.preReqId = apiRequestPayload.preReqId
                                                                        preReqNextPage.preReqTypeId = apiRequestPayload.preReqTypeId
                                                                        apiResponse.preReqNextPage = preReqNextPage
                                                                        logger.error("nextpage details in prereq object in processPageDetails - " + JSON.stringify(apiResponse))
                                                                    }

                                                                    logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());

                                                                    return apiResponse

                                                                } else {
                                                                    saveInput = prerequisiteResponse.result[0].enrollmentActionSettings.saveInput
                                                                    logger.error("prerequisiteResponse in processPageDetails - " + prerequisiteResponse.result[0].enrollmentActionSettings.saveInput)

                                                                    if (saveInput) { //saveInput=true                                
                                                                        //Check if there are any unique field requirements
                                                                        logger.error("Fields requiring Unique Check 1- " + JSON.stringify(filteredFields))
                                                                        if (filteredFields && filteredFields.length > 0 && apiRequestPayload && apiRequestPayload.preReqTypeId && apiRequestPayload.requestedUserAccountId) {
                                                                            logger.error("Fields requiring Unique Check 2- " + JSON.stringify(filteredFields))
                                                                            var isNotUniqueValue = checkForDuplicateValues(apiRequestPayload.preReqTypeId, apiRequestPayload.requestedUserAccountId)
                                                                            logger.error("Duplicate values exists - " + isNotUniqueValue)
                                                                            if (isNotUniqueValue) {
                                                                                logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                                return logDebug(funcName, "These credentials are already linked to another account. Please use different credentials or contact your application's Help Desk for assistance.", null, null)
                                                                            }
                                                                        }
                                                                        payloadKOGCredentialsAPI = getPayloadKOGCredentialsAPI(userProfileResponse, prereqName, userPrerequisiteResponse.result,
                                                                            serviceEndptRequestObj, expiryDate)
                                                                        if (payloadKOGCredentialsAPI != null && payloadKOGCredentialsAPI.code != "ERR-BUS-SER-VAL-001") {
                                                                            //Call KOG credentials api                                                    
                                                                            responseKOGCredentialsAPI = invokeKOGCredentialsAPI(payloadKOGCredentialsAPI)
                                                                            logger.error("responseKOGCredentialsAPI: " + JSON.stringify(responseKOGCredentialsAPI));
                                                                            if (responseKOGCredentialsAPI.code == 200) {    //API status for success     
                                                                                if (responseKOGCredentialsAPI.ResponseStatus == 0) {
                                                                                    logger.error("Patch UserPrerequisite")
                                                                                    //Patch UserPrerequisite Record with "COMPLETED" status
                                                                                    patchUserPrereqResponse = patchUserPrerequisite(apiRequestPayload, userPrerequisiteResponse.result._id, serviceEndptRequestObj, expiryDate, "COMPLETED")
                                                                                    // let prereqResponse = getPrerequisite(apiRequestPayload.preReqId)
                                                                                    // if(prereqResponse && prereqResponse.resultCount && prereqResponse.resultCount>0 && prereqResponse.result[0].enrollmentActionSettings.allowReuse === true && 
                                                                                    //      (prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld && Number(prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld)) > 0){
                                                                                    //     let pendingUserPrereqIds = getUserPrerequisites(apiRequestPayload.requestedUserAccountId,apiRequestPayload.preReqId)
                                                                                    //     pendingUserPrereqIds.forEach(userPrereqId=>{
                                                                                    //       patchUserPrerequisite(apiRequestPayload,userPrereqId, serviceEndptRequestObj, expiryDate, "COMPLETED")
                                                                                    //     })
                                                                                    // }
                                                                                    completePendingUserPrereq(apiRequestPayload, serviceEndptRequestObj, expiryDate)

                                                                                   

                                                                                    apiResponse.status = patchUserPrereqResponse.status
                                                                                    apiResponse.message = patchUserPrereqResponse.message
                                                                                    if (pageResponse.nextPageNumber != null) //TO-DO
                                                                                    {
                                                                                        preReqNextPage.pageNumber = pageResponse.nextPageNumber //TO-DO
                                                                                        preReqNextPage.enrollmentRequestId = apiRequestPayload.enrollmentRequestId
                                                                                        preReqNextPage.userPrereqId = apiRequestPayload.userPrereqId
                                                                                        preReqNextPage.preReqId = apiRequestPayload.preReqId
                                                                                        preReqNextPage.preReqTypeId = apiRequestPayload.preReqTypeId
                                                                                        apiResponse.preReqNextPage = preReqNextPage
                                                                                        logger.error("nextpage details in prereq object in processPageDetails - " + JSON.stringify(apiResponse))
                                                                                    }
                                                                                    logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                                    return apiResponse
                                                                                } else {
                                                                                    logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                                    return responseKOGCredentialsAPI
                                                                                }

                                                                            } else {
                                                                                logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                                return responseKOGCredentialsAPI
                                                                            }

                                                                        } else {
                                                                            logger.error("Error in payloadKOGCredentialsAPI()")
                                                                            logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                            return payloadKOGCredentialsAPI
                                                                        }

                                                                    } else { //saveInput=false
                                                                        payloadUserOnboardingAPI = getPayloadUserOnboardingAPI(userProfileResponse, apiRequestPayload, prereqName, userPrerequisiteResponse.result)

                                                                        if (payloadUserOnboardingAPI != null) {
                                                                            //Call user onboarding api
                                                                            responseUserOnboardingAPI = invokeUserOnboardingAPI(payloadUserOnboardingAPI)
                                                                            logger.error("responseUserOnboardingAPI: " + JSON.stringify(responseUserOnboardingAPI));
                                                                            if (responseUserOnboardingAPI.code == 200) { //API status for success    

                                                                                if (responseUserOnboardingAPI.ResponseStatus == 0) {
                                                                                    //Patch UserPrerequisite Record with "COMPLETED" status
                                                                                    patchUserPrereqResponse = patchUserPrerequisite(apiRequestPayload, userPrerequisiteResponse.result._id, null, expiryDate, "COMPLETED")

                                                                                    // let prereqResponse = getPrerequisite(apiRequestPayload.preReqId)
                                                                                    // if(prereqResponse && prereqResponse.resultCount && prereqResponse.resultCount>0 && prereqResponse.result[0].enrollmentActionSettings.allowReuse === true && 
                                                                                    //    (prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld && Number(prereqResponse.result[0].enrollmentActionSettings.allowReuseIfDaysOld)) > 0){
                                                                                    //   let pendingUserPrereqIds = getUserPrerequisites(apiRequestPayload.requestedUserAccountId,apiRequestPayload.preReqId)
                                                                                    //   pendingUserPrereqIds.forEach(userPrereqId=>{
                                                                                    //     patchUserPrerequisite(apiRequestPayload,userPrereqId, null, expiryDate, "COMPLETED")
                                                                                    //   })
                                                                                    // }
                                                                                    completePendingUserPrereq(apiRequestPayload, null, expiryDate)

                                                                                    apiResponse.status = patchUserPrereqResponse.status
                                                                                    apiResponse.message = patchUserPrereqResponse.message
                                                                                    if (pageResponse.nextPageNumber != null) {
                                                                                        preReqNextPage.pageNumber = pageResponse.nextPageNumber //TO-DO
                                                                                        preReqNextPage.enrollmentRequestId = apiRequestPayload.enrollmentRequestId
                                                                                        preReqNextPage.userPrereqId = apiRequestPayload.userPrereqId
                                                                                        preReqNextPage.preReqId = apiRequestPayload.preReqId
                                                                                        preReqNextPage.preReqTypeId = apiRequestPayload.preReqTypeId
                                                                                        apiResponse.preReqNextPage = preReqNextPage
                                                                                        logger.error("nextpage details in prereq object in processPageDetails - " + JSON.stringify(apiResponse))
                                                                                    }

                                                                                    logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
  
                                                                                    return apiResponse

                                                                                } else {
                                                                                    logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                                    return responseUserOnboardingAPI
                                                                                }

                                                                            } else {
                                                                                logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                                return responseUserOnboardingAPI
                                                                            }

                                                                        } else {
                                                                            logger.error("ERROR_GETTING_USER_ONBOARDING_API_PAYLOAD")
                                                                            logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                                            return logDebug(funcName, null, 'ERROR_GETTING_USER_ONBOARDING_API_PAYLOAD', "REF-021")
                                                                        }
                                                                    }

                                                                }
                                                            }

                                                        } else {
                                                            logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                            return serviceEndptResponse
                                                        }

                                                    } else {
                                                        logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                        return serviceEndptResponse
                                                    }

                                                }

                                                else {
                                                    logger.error("No value present for successResponseParameterVaues")
                                                    logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                                    return logDebug(funcName, null, 'MisConfiguration_onSubmitServiceEndpoint_SuccessResponseParameterVaues', "REF-022")
                                                }

                                            }  //END OF ELSE
                                            //}
                                        } else {
                                            logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                            return prerequisiteResponse
                                        }

                                    } else {
                                        logger.error("No request available to invoke service endpoint for Submit action")
                                        logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                        return logDebug(funcName, null, 'Submit_Endpoint_Request_Not_Available', "REF-023")
                                    }

                                } else {
                                    return serviceEndptConfig
                                }

                            } else {
                                logger.error("Configured page has no fields")
                                logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                                return logDebug(funcName, null, 'MisConfiguration_Page_Has_No_Fields', "REF-024")
                            }

                        } else {
                            logger.error("No submit Endpoint present")
                            logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                            return logDebug(funcName, null, 'MisConfiguration_Submit_Endpoint_Name', "REF-025")
                        }

                    } else {
                        logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                        return pageResponse
                    }

                } else {
                    logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                    return userPrerequisiteResponse
                }

            } else {
                logger.error("endpoint/prerequisite - processPageDetails Function End"+new Date().toISOString());
                return userProfileResponse
            }

        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-026")
    }
}


/**
* @name <isPageElementsValidationSuccess>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function isPageElementsValidationSuccess(pageElements, pageConfig, userProfileResponse) {
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
        "status": false,
        "error": null
    }
    let logDetailJSON = {}

    try {
        logger.error("Length of pageElements array is -" + pageElements.length)
        if (pageElements.length > 0) {
            if (pageElements.length == pageConfig.length) {
                for (let i = 0; i < pageElements.length; i++) {
                    key = pageElements[i].name
                    value = pageElements[i]
                    pageSubmitElementMap.set(key, value)
                    logger.error("pageSubmitElementMap value is - " + JSON.stringify(pageSubmitElementMap.get(key)))
                    key = pageConfig[i].name
                    value = pageConfig[i]
                    pageConfigElementMap.set(key, value)
                    logger.error("pageConfigElementMap value is - " + JSON.stringify(pageConfigElementMap.get(key)))
                }
                for (let key of pageSubmitElementMap.keys()) {
                    if (!pageConfigElementMap.has(key)) {
                        //Key from pageSubmitElementMap not found in pageConfigElementMap
                        logger.error("pageElement in Input Request not found in the configured page")
                        result.error = logDebug(funcName, null, 'Mismatch_Page_Elements', "REF-027")
                        return result
                    } else {
                        pageSubmitElementValueJSON = pageSubmitElementMap.get(key)
                        pageConfigElementValueJSON = pageConfigElementMap.get(key)
                        //Compare Input Element Type with Configured Page Type
                        if (pageSubmitElementValueJSON.type === pageConfigElementValueJSON.type) {
                            validateElement(key, pageSubmitElementValueJSON, pageConfigElementValueJSON, userProfileResponse)

                        } else {
                            logger.error("pageElement type in Input Request doesn't match with configured page element type")
                            result.error = logDebug(funcName, null, 'Mismatch_Page_Element_Type', "REF-028")
                            return result
                        }
                    }
                }

            } else {
                logger.error("Total pageElements in Input Request must match with configured page elements")
                result.error = logDebug(funcName, null, 'Invalid_TOT_Page_Elements', "REF-029")
                return result
            }
        } else {
            logger.error("pageElements in Input Request must have atleast 1 field")
            result.error = logDebug(funcName, null, 'Page_Has_No_Fields', "REF-030")
            return result
        }

        logger.error("Result of isPageElementsValidationSuccess is - " + JSON.stringify(result))

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-031")
    }
}


/**
* @name <validateElement>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function validateElement(element, pageElementJSON, pageConfigJSON, userProfileResponse) {
    logger.error("Inside validateElement")
    let funcName = "validateElement"
    let type = null
    let elementType = null
    let elementValue = null
    let configValidationArray = null
    let configOptionsArray = null
    let validationResult = []
    let validationResultJSON = {
        "element": null,
        "error": null
    }

    try {
        elementType = pageElementJSON.type
        elementValue = pageElementJSON.value
        configValidationArray = pageConfigJSON.validation
        configOptionsArray = pageConfigJSON.options

        if (elementType === "text" || elementType === "textarea") {
            type = "text";
        } else if (elementType === "select" || elementType === "radio") {
            type = "select";
        } else {
            type = elementType
        }

        switch (type) {
            case "text":
                logger.error("Required Validation Check")
                result = validateText(element, elementValue, configValidationArray, userProfileResponse)
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
                return logDebug(funcName, null, 'Reference_Property_Value_NotFound', "REF-032")
                break
        }
        return validationResult

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-033")
    }
}


/**
* @name <validateText>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function validateText(element, elementValue, configValidationArray, userProfileResponse) {
    logger.error("Inside validateText")
    let funcName = "validateText"
    let validationJSONObj = null

    try {
        if (elementValue.length == 1 & elementValue[0] != null) {
            let value = elementValue[0]
            for (let i = 0; i < configValidationArray.length; i++) {

            }

        } else {
            //validation fail
        }
        for (let i = 0; i < configValidationArray.length; i++) {


        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-034")
    }
}


/**
* @name <getSubmitEndpoint>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getSubmitEndpoint(endptName) {
    logger.error("Inside onSubmitEndpoint")
    let funcName = "validateText"
    const status = "ACTIVE"
    let serviceEndptConfig = null

    try {
        serviceEndptConfig = openidm.query("managed/alpha_kyid_enrollment_service_endpoint/", {
            "_queryFilter": '/name/ eq "' + endptName + '"'
                + ' AND (recordState eq "' + status + '" OR recordState eq "0")'
        }, ["*"])
        logger.error("Service Endpoint Configuration is - " + JSON.stringify(serviceEndptConfig))

        if (serviceEndptConfig.resultCount > 0) {
            serviceEndptConfig = serviceEndptConfig.result[0]
            if (!(serviceEndptConfig.url && serviceEndptConfig.url != null)) {
                logger.error("Endpoint_Url_Missing")
                return logDebug(funcName, null, 'Endpoint_Url_Missing', "REF-035")
            } else {
                return serviceEndptConfig
            }

        } else {
            logger.error("Service_Endpoint_Configuration_Not_Found")
            return logDebug(funcName, null, 'Service_Endpoint_Configuration_Not_Found', "REF-036")
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-037")
    }

}

//dharjani 08/20 - adding function to fix Credential API call issues
function setCredentialField(fieldName) {
    // If fieldName is not present or contains 'DONOTSENDTOKOG_', set false; otherwise true
    //TODO: Change later to a new property - needForKOGCredential within the prerequisites_type MO
    if (!fieldName || typeof fieldName !== 'string' || fieldName.includes('DONOTSENDTOKOG_')) {
        return false;
    }
    return true;
}


function setKOGAPIParams(field, pageElements) {

    let kogParamsJSON = {}
    let foundObject = null

    kogParamsJSON["fieldName"] = field.name
    kogParamsJSON["sendFieldOnCredentialsAPI"] = setCredentialField(field.name) //dharjani 08/20 - adding function to fix Credential API call issues
    kogParamsJSON["fieldType"] = field.type

    if (field.name != "Username" && field.name != "Password") {
        foundObject = pageElements.find(item => item.name === field.name)
        logger.error("foundObject for kogParams - " + JSON.stringify(foundObject))
        kogParamsJSON["value"] = foundObject.value.toString()
    } else {
        kogParamsJSON["value"] = field.value
    }
    logger.error("kogParamsJSON value to push - " + JSON.stringify(kogParamsJSON))

    return kogParamsJSON
}


/**
* @name <createOnSubmitEndptRequest>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createOnSubmitEndptRequest(pageResponse, pageElements, serviceEndptConfig) {
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
    let kogParams = []
    let serviceEndptRequestObj = {}

    try {
        fieldsArray = pageResponse.fields
        //Loop Begin
        for (let i = 0; i < fieldsArray.length; i++) {
            logger.error("Field " + (i + 1) + " is -" + fieldsArray[i])
            field = null
            requestParamsJSON = {}
            responseParamsJSON = {}
            field = fieldsArray[i]

            //Create KOG API Request Params
            kogParams.push(setKOGAPIParams(field, pageElements))

            //Create onSubmit Request Params
            if (field.onsubmitRequestServiceParameterName != null && field.onsubmitRequestServiceParameterName) {
                foundObject = null
                requestParamsJSON["fieldName"] = field.name
                requestParamsJSON["serviceParamName"] = field.onsubmitRequestServiceParameterName
                requestParamsJSON["sendFieldOnCredentialsAPI"] = setCredentialField(field.name) //dharjani 08/20 - adding function to fix Credential API call issues
                requestParamsJSON["fieldType"] = field.type
                requestParamsJSON["IsUniqueElement"] = field.isunique

                if (field.name != "Username" && field.name != "Password") {
                    foundObject = pageElements.find(item => item.name === field.name)
                    //logger.error("foundObject - "+JSON.stringify(foundObject))
                    requestParamsJSON["value"] = foundObject.value.toString()
                } else {
                    requestParamsJSON["value"] = field.value
                }
                requestParams.push(requestParamsJSON)
            }

            //Create onSubmit Response Params
            if (field.onsubmitResponseServiceParameterName != null && field.onsubmitResponseServiceParameterName) {
                responseParamsJSON["fieldName"] = field.name
                responseParamsJSON["serviceParamName"] = field.onsubmitResponseServiceParameterName
                responseParams.push(responseParamsJSON)
            }

        } //Loop End

        logger.error("requestParams in JSON is -" + JSON.stringify(requestParams))
        logger.error("responseParams in JSON is -" + JSON.stringify(responseParams))
        filteredFields = requestParams
            .filter(field => field.sendFieldOnCredentialsAPI === true && field.IsUniqueElement === true)
            .map(field => ({
                fieldName: field.fieldName,
                value: field.value
            }));
        logger.error("filtered fields from requestParams in JSON is -" + JSON.stringify(filteredFields))
        serviceEndptRequestObj["endpoint"] = serviceEndptConfig
        serviceEndptRequestObj["requestParams"] = requestParams
        serviceEndptRequestObj["responseParams"] = responseParams
        serviceEndptRequestObj["kogParams"] = kogParams

        logger.error("Service Endpoint Request Object is - " + JSON.stringify(serviceEndptRequestObj))
        return serviceEndptRequestObj

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-038")
    }
}


/**
* @name <invokeServiceEndpoint>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeServiceEndpoint(serviceEndptRequestObj, endptSuccessRespParams, serviceEndptConfig,
    apiRequestPayload, userProfileResponse, userPrerequisiteResponse) {
    logger.error("Inside invokeServiceEndpoint")
    let funcName = "invokeServiceEndpoint"
    let payload = {}
    let responseServiceEndpointAPI = undefined
    let validateResponseArray = null
    let serviceOutcome = false
    let businessExceptionErr = "ERR-BUS-SER-VAL-001"
    let genericExceptionErr = "ERR-RES-UNEX-001"

    try {
        //Check if endpoint service type is WCF(1), REST(2) or SOAP(3)
        if (serviceEndptRequestObj.endpoint.protocol == 1 || serviceEndptRequestObj.endpoint.protocol == 3) {
            payload = createSOAPWCFRequestPayload(serviceEndptRequestObj)

            if (payload != null && endptSuccessRespParams != null && payload && endptSuccessRespParams) {

                logger.error("payload from createSOAP service is:" + JSON.stringify(payload))

                responseServiceEndpointAPI = invokeSOAPWCFServiceEndpoint(payload, endptSuccessRespParams, serviceEndptRequestObj)
                logger.error("responseServiceEndpointAPI in invokeServiceEndpoint is - " + JSON.stringify(responseServiceEndpointAPI))

                if (responseServiceEndpointAPI != null && responseServiceEndpointAPI) {

                    if (responseServiceEndpointAPI.serviceOutcome) { //If TRUE
                        logger.error("serviceOutcome value in invokeServiceEndpoint is - " + responseServiceEndpointAPI.serviceOutcome)
                        let ResponseCode = 200
                        logger.error("ResponseCode in invokeServiceEndpoint is - " + ResponseCode)
                        if (responseServiceEndpointAPI.endptResponse.response != null && responseServiceEndpointAPI.endptResponse.response) {
                            if (responseServiceEndpointAPI.endptResponse.response.ResponseMessage != null && responseServiceEndpointAPI.endptResponse.response.ResponseMessage) {
                                return {
                                    "ResponseStatus": ResponseCode,
                                    "code": responseServiceEndpointAPI.endptResponse.status,
                                    "message": responseServiceEndpointAPI.endptResponse.response.ResponseMessage
                                }
                            } else {
                                return {
                                    "ResponseStatus": ResponseCode,
                                    "code": responseServiceEndpointAPI.endptResponse.status,
                                    "message": null
                                }
                            }
                        } else {
                            return {
                                "ResponseStatus": ResponseCode,
                                "code": responseServiceEndpointAPI.endptResponse.status,
                                "message": null
                            }
                        }

                    } else {
                        validateResponseArray = Object.keys(responseServiceEndpointAPI.endptResponse)
                        logger.error("validateResponseArray in invokeServiceEndpoint is - " + validateResponseArray)
                        logger.error("responseServiceEndpointAPI in invokeServiceEndpoint contains Fault - " + validateResponseArray.includes("Fault"))

                        if (!(validateResponseArray.includes("Fault"))) {
                            let ResponseCode = null
                            if (responseServiceEndpointAPI.endptResponse.response.ResponseCode != null && responseServiceEndpointAPI.endptResponse.response.ResponseCode.length > 0) {
                                ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseCode
                            } else {
                                ResponseCode = businessExceptionErr
                            }
                            logger.error("ResponseCode in invokeServiceEndpoint is - " + ResponseCode)
                            return {
                                "ResponseStatus": ResponseCode,
                                "code": businessExceptionErr,
                                //"code":responseServiceEndpointAPI.endptResponse.status, 
                                "message": responseServiceEndpointAPI.endptResponse.response.ResponseMessage
                            }
                        } else {
                            let ResponseCode = null
                            if (responseServiceEndpointAPI.endptResponse.response.ResponseCode != null && responseServiceEndpointAPI.endptResponse.response.ResponseCode.length > 0) {
                                ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseCode
                            } else {
                                ResponseCode = businessExceptionErr
                            }
                            logger.error("ResponseCode in invokeServiceEndpoint is - " + ResponseCode)
                            return {
                                "ResponseStatus": ResponseCode,
                                "code": businessExceptionErr,
                                //"code":responseServiceEndpointAPI.endptResponse.status,
                                "message": "An unexpected error occurred when submitting the request. Please try again later. REF-0823"
                                //"message":responseServiceEndpointAPI.endptResponse.response.Fault.Reason.Text
                            }
                        }
                    }
                } else {
                    logger.error("Empty Response from Service Endpoint")
                    return {
                        "ResponseStatus": businessExceptionErr,
                        "code": businessExceptionErr,
                        "message": "An unexpected error occurred when submitting the request. Please try again later. REF-084"
                    }
                }
            }

        } else if (serviceEndptRequestObj.endpoint.protocol == 2) {

            //Is Configured endpoint of Org type
            if (serviceEndptConfig.isOrgType) {
                logger.error("Execute OrgType Endpoint")
                payload = createOrgTypeRequestPayload(serviceEndptRequestObj, apiRequestPayload, userProfileResponse, userPrerequisiteResponse)
                if (payload != null && payload && payload.code != "ERR-BUS-SER-VAL-001") {

                    responseServiceEndpointAPI = invokeOrgTypeServiceEndpoint(payload, endptSuccessRespParams, serviceEndptRequestObj)
                    logger.error("responseServiceEndpointAPI in invokeServiceEndpoint is - " + JSON.stringify(responseServiceEndpointAPI))

                    if (responseServiceEndpointAPI != null && responseServiceEndpointAPI) {
                        if (responseServiceEndpointAPI.serviceOutcome) { //If TRUE
                            logger.error("serviceOutcome value in invokeServiceEndpoint is - " + responseServiceEndpointAPI.serviceOutcome)
                            logger.error("Response for OrgUserQA invokeServiceEndpoint is - " + JSON.stringify(responseServiceEndpointAPI))
                            let ResponseStatus = null
                            //if(responseServiceEndpointAPI.endptResponse.response.ResponseStatus!=null && responseServiceEndpointAPI.endptResponse.response.ResponseStatus.length>0){
                            if (responseServiceEndpointAPI.endptResponse.response.ResponseStatus != null && responseServiceEndpointAPI.endptResponse.response.ResponseStatus === 0) {
                                //if(responseServiceEndpointAPI.endptResponse.response.ResponseStatus!=null && responseServiceEndpointAPI.endptResponse.response.ResponseStatus >= 0){
                                //ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseStatus
                                ResponseCode = 0 //responseServiceEndpointAPI.endptResponse.response.ResponseStatus
                            } else {
                                logger.error("Empty ResponseStatus from Service Endpoint")
                                return {
                                    "ResponseStatus": businessExceptionErr,
                                    "code": businessExceptionErr,
                                    "message": "An unexpected error occurred when submitting the request. Please try again later. REF-085"
                                }
                            }

                            return {
                                "ResponseStatus": ResponseCode,
                                "code": responseServiceEndpointAPI.endptResponse.status,
                                "message": null
                            }

                        } else {
                            return {
                                //"ResponseStatus":responseServiceEndpointAPI.endptResponse.response.ResponseStatus,
                                "ResponseStatus": businessExceptionErr,
                                //"code":responseServiceEndpointAPI.endptResponse.status, 
                                "code": businessExceptionErr,
                                "message": responseServiceEndpointAPI.endptResponse.response.MessageResponses.toString()
                            }
                        }
                    } else {
                        logger.error("Empty Response from Service Endpoint")
                        return {
                            "ResponseStatus": businessExceptionErr,
                            "code": businessExceptionErr,
                            "message": "An unexpected error occurred when submitting the request. Please try again later. REF-086"
                        }
                    }
                } else {
                    return payload
                }

            } else {
                payload = createRESTRequestPayload(serviceEndptRequestObj)

                if (payload != null && payload) {

                    responseServiceEndpointAPI = invokeRESTServiceEndpoint(payload, endptSuccessRespParams, serviceEndptRequestObj)
                    logger.error("responseServiceEndpointAPI in invokeServiceEndpoint is - " + JSON.stringify(responseServiceEndpointAPI))

                    if (responseServiceEndpointAPI != null && responseServiceEndpointAPI) {
                        if (responseServiceEndpointAPI.serviceOutcome) { //If TRUE
                            logger.error("serviceOutcome value in invokeServiceEndpoint is - " + responseServiceEndpointAPI.serviceOutcome)
                            let ResponseCode = null
                            if (responseServiceEndpointAPI.endptResponse.response.ResponseCode != null && responseServiceEndpointAPI.endptResponse.response.ResponseCode.length > 0) {
                                ResponseCode = responseServiceEndpointAPI.endptResponse.response.ResponseCode
                            } else {
                                ResponseCode = 200
                            }

                            return {
                                "ResponseStatus": ResponseCode,
                                "code": responseServiceEndpointAPI.endptResponse.status,
                                "message": null
                            }

                        } else {
                            return {
                                //"ResponseStatus":responseServiceEndpointAPI.endptResponse.response.ResponseCode,
                                "ResponseStatus": businessExceptionErr,
                                //"code":responseServiceEndpointAPI.endptResponse.status, 
                                "code": businessExceptionErr,
                                "message": responseServiceEndpointAPI.endptResponse.response.ResponseMessage
                            }
                        }
                    } else {
                        logger.error("Empty Response from Service Endpoint")
                        return {
                            "ResponseStatus": businessExceptionErr,
                            "code": businessExceptionErr,
                            "message": "An unexpected error occurred when submitting the request. Please try again later. REF-081"
                        }
                    }
                }
            }

        } else {
            logger.error("Invalid Service Endpoint Protocol")
            return {
                "ResponseStatus": businessExceptionErr,
                "code": businessExceptionErr,
                "message": "An unexpected error occurred when submitting the request. Please try again later. REF-082"
            }
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-039")
    }
}


/**
* @name <createOrgTypeRequestPayload>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createOrgTypeRequestPayload(serviceEndptRequestObj, apiRequestPayload, userProfileResponse, userPrerequisiteResponse) {
    logger.error("Inside createOrgTypeRequestPayload")
    let funcName = "createOrgTypeRequestPayload"
    const currentTimeinEpoch = Date.now();
    const currentDate = new Date().toISOString();
    let requestorProfileResponse = null
    let enrolmentRequestResponse = null
    let roleContext = null
    let values = null
    let requestPayload = {
        "requestedUserAccountId": null
    }

    try {
        if (userPrerequisiteResponse.requestedUserAccountId != null) {
            //logger.error("userPrerequisiteResponse.requestedUserAccountId is - "+userPrerequisiteResponse.requestedUserAccountId)
            requestPayload.requestedUserAccountId = userPrerequisiteResponse.requestedUserAccountId
        }

        let requestBody = {
            "payload": requestPayload,
            "action": 2 //Get
        }

        let payload = {
            KOGID: null,
            KOGOrgID: null,
            TransactionID: null,
            RequestorKOGID: null,
            ApplicationName: null,
            RoleName: null,
            KOGOrgUserQA: []
        }

        if (getUserAccount(requestBody) != null && getUserAccount(requestBody)) {
            logger.error("requestorProfileResponse is - " + getUserAccount(requestBody))
            requestorProfileResponse = getUserAccount(requestBody)
        }

        if (userPrerequisiteResponse.enrollmentRequestId != null) {
            logger.error("EnrollmentRequestId value is - " + userPrerequisiteResponse.enrollmentRequestId)
            enrolmentRequestResponse = getEnrollmentRequest(userPrerequisiteResponse.enrollmentRequestId)
            if (enrolmentRequestResponse.roleContext != null && enrolmentRequestResponse.roleContext.length > 0) {
                roleContext = enrolmentRequestResponse.roleContext[0] //Current only 0th value is been taken as KOG API expects on one value not array of values
                logger.error("Value of roleContext is - " + JSON.stringify(roleContext))

            } else {
                return logDebug(funcName, null, 'Misconfigured_RoleContext', "REF-040")
            }
        }

        /*if(getEnrollmentRequest(apiRequestPayload)!=null){
          enrolmentRequestResponse = getEnrollmentRequest(apiRequestPayload)
          if(enrolmentRequestResponse.roleContext!=null && enrolmentRequestResponse.roleContext.length>0){
             roleContext = enrolmentRequestResponse.roleContext[0] 
             logger.error("Value of roleContext is - "+JSON.stringify(roleContext))
            
          } else {
             return { code: 400, message: 'Misconfigured_RoleContext' }
          } 
        }*/

        //dharjani BEGIN - refactoring code
        //  if(serviceEndptRequestObj!=null && serviceEndptRequestObj){
        //    if(getprerequisiteValuesForOrgTypeAPI(serviceEndptRequestObj)!=null){
        //        if(getprerequisiteValuesForOrgTypeAPI(serviceEndptRequestObj).code!="ERR-BUS-SER-VAL-001"){
        //          values = getprerequisiteValuesForOrgTypeAPI(serviceEndptRequestObj)  
        //         } else {
        //             return getprerequisiteValuesForOrgTypeAPI(serviceEndptRequestObj)
        //         }

        //     } else {
        //       return logDebug(funcName,null,'InValid_Payload_OrgType',"REF-041")
        //     }
        //  }

        if (serviceEndptRequestObj != null && serviceEndptRequestObj) {
            var prereqValues = getprerequisiteValuesForOrgTypeAPI(serviceEndptRequestObj);

            if (prereqValues != null) {
                if (prereqValues.code !== "ERR-BUS-SER-VAL-001") {
                    values = prereqValues;
                } else {
                    return prereqValues;
                }
            } else {
                return logDebug(funcName, null, 'InValid_Payload_OrgType', "REF-041");
            }
        }
        //dharjani END

        payload.KOGID = userProfileResponse.userName
        payload.KOGOrgID = roleContext.orgId
        payload.TransactionID = generateGUID()
        payload.RequestorKOGID = requestorProfileResponse.userName
        payload.ApplicationName = roleContext.appName
        payload.RoleName = roleContext.roleName
        payload.KOGOrgUserQA = values
        logger.error("getPayloadOrgTypeAPI is - " + JSON.stringify(payload))

        return payload

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-042")
    }

}


/**
* @name <invokeOrgTypeServiceEndpoint>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeOrgTypeServiceEndpoint(payload, endptSuccessRespParams, serviceEndptRequestObj) {
    logger.error("Inside invokeOrgTypeServiceEndpoint")
    let funcName = "invokeOrgTypeServiceEndpoint"
    let responseOrgTypeAPI = null
    let validateResponseArray = null
    let retryCountForOrgTypeService = 0
    let shouldRetryForOrgTypeService = true
    let requestBody = {
        url: identityServer.getProperty("esv.addupdateorguserqas.api"),
        scope: identityServer.getProperty("esv.addupdateorguserqas.api.scope"),
        method: "POST",
        payload: payload
    }
    let result = {
        serviceOutcome: false,
        endptResponse: {}
    }

    try {
        logger.error("Request Body for invokeOrgTypeServiceEndpoint is - " + JSON.stringify(requestBody))
        while (shouldRetryForOrgTypeService && retryCountForOrgTypeService < 3) {
            try {
                responseOrgTypeAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                shouldRetryForOrgTypeService = false
            }
            catch (error) {
                logger.error("Exception in " + funcName + " is - " + getException(error))
                retryCountForOrgTypeService++;
                logger.error("Retry count of invokeOrgTypeServiceEndpoint is: " + retryCountForOrgTypeService);
                if (retryCountForOrgTypeService == 3) {
                    throw logDebug(funcName, null, error, "REF-074")
                }
            }
        }

        //responseOrgTypeAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("responseOrgTypeAPI in invokeOrgTypeServiceEndpoint is - " + JSON.stringify(responseOrgTypeAPI))
        if (responseOrgTypeAPI != null && responseOrgTypeAPI) {
            /*if(responseOrgTypeAPI.response.ResponseStatus==0){
              apiResult.ResponseStatus = responseOrgTypeAPI.response.ResponseStatus
              apiResult.code = responseOrgTypeAPI.status
            } else {
              apiResult.ResponseStatus = responseOrgTypeAPI.response.ResponseStatus
              apiResult.message = responseOrgTypeAPI.response.MessageResponses
              apiResult.code = responseOrgTypeAPI.status
            }*/

            validateResponseArray = Object.keys(responseOrgTypeAPI.response)
            logger.error("validateResponseArray - " + validateResponseArray)

            for (let i = 0; i < endptSuccessRespParams.length; i++) {
                let paramName = endptSuccessRespParams[i].paramName
                logger.error("endptSuccessRespParams paramName - " + i + " is - " + paramName)
                let paramValue = endptSuccessRespParams[i].paramValue
                logger.error("endptSuccessRespParams paramValue - " + i + " is - " + paramValue)
                if (validateResponseArray.includes(paramName)) {
                    logger.error("Name in response from API matches with config - " + paramName)
                    let respParamValue = responseOrgTypeAPI.response[paramName].toString()
                    if (paramValue == respParamValue) {
                        logger.error("Value in response from API matches with config - " + respParamValue)
                        result.serviceOutcome = true
                    } else {
                        logger.error("Value in response from API doesn't match with config - " + paramValue)
                        logger.error("Value in response from API doesn't match with config - " + paramValue)
                        result.serviceOutcome = false  //dharjani: 08/22: Updating to true only to test. Please reach out to me in case of any issues. Will revert later.                 
                        break
                    }
                }
            } //END FOR LOOP

        }
        logger.error("serviceOutcome value in invokeOrgTypeServiceEndpoint is - " + result.serviceOutcome)
        result.endptResponse = responseOrgTypeAPI
        return result

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-043")
    }
}


/**
* @name <getEnrollmentRequest>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getEnrollmentRequest(enrollmentRequestId) {
    logger.error("Inside getEnrollmentRequest")
    let funcName = "getEnrollmentRequest"
    try {
        var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": '/_id/ eq "' + enrollmentRequestId + '"'
                + ' AND (status eq "0" OR status eq "IN_PROGRESS")'
                + ' AND (recordState eq "ACTIVE" OR recordState eq "0")'
        }, ["*"]);
        logger.error("EnrollmentRequest response - " + JSON.stringify(response))

        if (response.resultCount == 1) {
            logger.error("EnrollmentRequest result - " + JSON.stringify(response.result[0]))
            return response.result[0]
        } else {
            return null
        }
    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-044")
    }
}

/**
* @name <getCancelledEnrollmentRequest>
* @description <function description>
 
* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getCancelledEnrollmentRequest(enrollmentRequestId) {
    logger.error("Inside getCancelledEnrollmentRequest")
    let funcName = "getCancelledEnrollmentRequest"
    try {
        var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": '/_id/ eq "' + enrollmentRequestId + '"'
                + ' AND (status eq "0" OR status eq "CANCELLED")'
                + ' AND (recordState eq "ACTIVE" OR recordState eq "0")'
        }, ["*"]);
        logger.error("Cancelled enrollmentRequest response - " + JSON.stringify(response))

        if (response.resultCount == 1) {
            logger.error("Cancelled enrollmentRequest result - " + JSON.stringify(response.result[0]))
            return response.result[0]
        } else {
            return null
        }
    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-044")
    }
}


/**
* @name <getprerequisiteValuesForOrgTypeAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getprerequisiteValuesForOrgTypeAPI(serviceEndptRequestObj) {
    logger.error("Inside getprerequisiteValuesForOrgTypeAPI - " + JSON.stringify(serviceEndptRequestObj))
    let funcName = "getprerequisiteValuesForOrgTypeAPI"
    let valuesJSON = null
    let values = []

    try {
        if (serviceEndptRequestObj != null && serviceEndptRequestObj) {
            logger.error("SERVICE_ENDPOINT_REQUEST_OBJECT: " + JSON.stringify(serviceEndptRequestObj))
            for (let i = 0; i < serviceEndptRequestObj.requestParams.length; i++) {
                valuesJSON = {
                    "Question": null,
                    "Answers": null
                }

                reqParams = serviceEndptRequestObj.requestParams[i]
                valuesJSON.Question = reqParams.serviceParamName
                //valuesJSON.Answers = [reqParams.value.toString()]

                var answersArray;
                if (reqParams.fieldType === "multicheckbox" && typeof reqParams.value === "string") {
                    // Split the CSV string, trim whitespace, and filter out empty strings
                    answersArray = reqParams.value.split(',')
                        .map(function (item) { return item.trim(); })
                        .filter(function (item) { return item !== ""; });
                } else if (Array.isArray(reqParams.value)) {
                    answersArray = reqParams.value.map(function (v) { return v != null ? v.toString() : ''; });
                } else {
                    answersArray = [reqParams.value != null ? reqParams.value.toString() : ''];
                }

                if (Array.isArray(answersArray) && answersArray.some(function (ans) { return typeof ans === 'string' && ans.trim() !== ''; })) {
                    valuesJSON.Answers = answersArray;
                    values.push(valuesJSON);
                }

                // valuesJSON.Answers = Array.isArray(reqParams.value)
                //     ? reqParams.value.map(v => v != null ? v.toString() : '').filter(v => typeof v === 'string' && v.trim() !== '')
                //     : [reqParams.value != null ? reqParams.value.toString() : ''];

                // if (Array.isArray(valuesJSON.Answers) && valuesJSON.Answers.some(ans => typeof ans === 'string' && ans.trim() !== '')) {
                //     values.push(valuesJSON);
                // }
            }
            logger.error("getprerequisiteValuesForOrgTypeAPI response is - " + JSON.stringify(values))
            if (values != null) {
                return values
            } else {
                return null
            }

        } else {
            logger.error("SERVICE_ENDPOINT_REQUEST_OBJECT_EMPTY in " + funcName)
            return logDebug(funcName, null, 'SERVICE_ENDPOINT_REQUEST_OBJECT_EMPTY', "REF-045")
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-046")
    }
}


/**
* @name <createSOAPWCFRequestPayload>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createSOAPWCFRequestPayload(serviceEndptRequestObj) {
    logger.error("Inside createSOAPWCFRequestPayload")
    let funcName = "createSOAPWCFRequestPayload"
    let reqParams = {}
    //let payload = {}
    let serviceParamsSOAP = {}
    //let methodName = null 

    try {
        logger.error("methodName in createSOAPWCFRequestPayload is - " + serviceEndptRequestObj.endpoint.methodName)
        //methodName = serviceEndptRequestObj.endpoint.methodName
        //logger.error("serviceEndptRequestObj.requestParams - "+JSON.stringify(serviceEndptRequestObj.requestParams))
        for (let i = 0; i < serviceEndptRequestObj.requestParams.length; i++) {
            reqParams = serviceEndptRequestObj.requestParams[i]
            serviceParamsSOAP[reqParams.serviceParamName] = reqParams.value.toString()
        }
        logger.error("SOAP/WCF serviceParamsSOAP is - " + JSON.stringify(serviceParamsSOAP))
        //payload[methodName]=serviceParamsSOAP
        // logger.error("SOAP/WCF Payload is - "+JSON.stringify(payload))
        return serviceParamsSOAP

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-047")
    }

}


/**
* @name <createRESTRequestPayload>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function createRESTRequestPayload(serviceEndptRequestObj) {
    logger.error("Inside createRESTRequestPayload")
    let funcName = "createRESTRequestPayload"
    let reqParams = {}
    //let payload = {}
    let serviceParamsREST = {}
    //let methodName = null 

    try {
        logger.error("methodName in createRESTRequestPayload is - " + serviceEndptRequestObj.endpoint.methodName)
        //methodName = serviceEndptRequestObj.endpoint.methodName
        //logger.error("serviceEndptRequestObj.requestParams - "+JSON.stringify(serviceEndptRequestObj.requestParams))
        for (let i = 0; i < serviceEndptRequestObj.requestParams.length; i++) {
            reqParams = serviceEndptRequestObj.requestParams[i]
            serviceParamsREST[reqParams.serviceParamName] = reqParams.value.toString()
        }
        logger.error("serviceParamsREST is - " + JSON.stringify(serviceParamsREST))
        //payload[methodName]=serviceParamsREST
        //logger.error("REST Payload is - "+JSON.stringify(payload))
        return serviceParamsREST

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-048")
    }

}


/**
* @name <createRESTRequestPayload>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeSOAPWCFServiceEndpoint(payload, endptSuccessRespParams, serviceEndptRequestObj) {
    logger.error("Inside invokeSOAPWCFServiceEndpoint")
    let funcName = "invokeSOAPWCFServiceEndpoint"
    let responseServiceEndpointAPI = null
    let validateResponseArray = null
    let retryCountForSOAPWCFService = 0
    let shouldRetryForSOAPWCFService = true

    let result = {
        serviceOutcome: false,
        endptResponse: {}
    }
    let requestBody = {
        url: null,
        method: "POST",
        payload: null
    }

    try {

        if (serviceEndptRequestObj.endpoint != null && serviceEndptRequestObj.endpoint) {
            requestBody.url = serviceEndptRequestObj.endpoint.url
        }

        requestBody.payload = payload

        logger.error("requestBody in invokeSOAPWCFServiceEndpoint is - " + JSON.stringify(requestBody))


        while (shouldRetryForSOAPWCFService && retryCountForSOAPWCFService < 3) {
            try {
                responseServiceEndpointAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                shouldRetryForSOAPWCFService = false
            }
            catch (error) {
                logger.error("Exception in " + funcName + " is - " + getException(error))
                retryCountForSOAPWCFService++;
                logger.error("Retry count of invokeSOAPWCFServiceEndpoint is: " + retryCountForSOAPWCFService);
                if (retryCountForSOAPWCFService == 3) {
                    throw logDebug(funcName, "An unexpected error occurred when validating this request. Please try again later.", error, "REF-075")
                }
            }
        }


        logger.error("responseServiceEndpointAPI in invokeSOAPWCFServiceEndpoint is - " + JSON.stringify(responseServiceEndpointAPI))

        if (responseServiceEndpointAPI != null && responseServiceEndpointAPI) {
            validateResponseArray = Object.keys(responseServiceEndpointAPI.response)
            logger.error("validateResponseArray - " + validateResponseArray)
            logger.error("responseServiceEndpointAPI in invokeSOAPWCFServiceEndpoint contains Fault - " + validateResponseArray.includes("Fault"))

            if (!(validateResponseArray.includes("Fault"))) {
                logger.error("endptSuccessRespParams in invokeSOAPWCFServiceEndpoint - " + endptSuccessRespParams)
                for (let i = 0; i < endptSuccessRespParams.length; i++) {
                    let paramName = endptSuccessRespParams[i].paramName
                    logger.error("endptSuccessRespParams paramName - " + i + " is - " + paramName)
                    let paramValue = endptSuccessRespParams[i].paramValue
                    logger.error("endptSuccessRespParams paramValue - " + i + " is - " + paramValue)
                    if (validateResponseArray.includes(paramName)) {
                        logger.error("Name in response from API matches with config - " + paramName)
                        let respParamValue = responseServiceEndpointAPI.response[paramName].toString()
                        if (paramValue == respParamValue) {
                            logger.error("Value in response from API matches with config - " + respParamValue)
                            result.serviceOutcome = true
                        } else {
                            logger.error("Value in response from API doesn't match with config - " + paramValue)
                            logger.error("Value in response from API doesn't match with config - " + paramValue)
                            result.serviceOutcome = false  //dharjani: 08/22: Updating to true only to test. Please reach out to me in case of any issues. Will revert later.                 
                            break
                        }
                    }
                }
            }
        }
        logger.error("serviceOutcome value in invokeSOAPWCFServiceEndpoint is - " + result.serviceOutcome)
        result.endptResponse = responseServiceEndpointAPI
        return result

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-049")

    }

}


/**
* @name <invokeRESTServiceEndpoint>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeRESTServiceEndpoint(payload, endptSuccessRespParams, serviceEndptRequestObj) {
    logger.error("Inside invokeRESTServiceEndpoint")
    let funcName = "invokeRESTServiceEndpoint"
    let responseServiceEndpointAPI = null
    let validateResponseArray = null
    let retryCountForRESTService = 0
    let shouldRetryForRESTService = true
    let result = {
        serviceOutcome: false,
        endptResponse: {}
    }

    let requestBody = {
        url: null,
        method: "POST",
        requestType: "REST",
        //protectionType: "basic",
        authType: "None",
        headers: {
            "Content-Type": "application/json"
        },
        credentials: {
            username: null,
            password: undefined
        },
        body: null
    }

    try {
        if (serviceEndptRequestObj.endpoint != null && serviceEndptRequestObj.endpoint) {
            requestBody.url = serviceEndptRequestObj.endpoint.url

            if (serviceEndptRequestObj.endpoint.username != null && serviceEndptRequestObj.endpoint.password) {
                requestBody.credentials.username = serviceEndptRequestObj.endpoint.username
                requestBody.credentials.password = serviceEndptRequestObj.endpoint.password
                requestBody.authType = "basic"
            }

            requestBody.body = payload
            logger.error("API Request Body in invokeRESTServiceEndpoint is - " + JSON.stringify(requestBody))

            while (shouldRetryForRESTService && retryCountForRESTService < 3) {
                try {
                    responseServiceEndpointAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                    shouldRetryForRESTService = false
                }
                catch (error) {
                    logger.error("Exception in " + funcName + " is - " + getException(error))
                    retryCountForRESTService++;
                    logger.error("Retry count of invokeRESTServiceEndpoint is: " + retryCountForRESTService);
                    if (retryCountForRESTService == 3) {
                        throw logDebug(funcName, null, error, "REF-076")
                    }
                }
            }

            logger.error("responseServiceEndpointAPI in invokeRESTServiceEndpoint is - " + JSON.stringify(responseServiceEndpointAPI))

            if (responseServiceEndpointAPI != null && responseServiceEndpointAPI) {
                validateResponseArray = Object.keys(responseServiceEndpointAPI.response)
                logger.error("validateResponseArray - " + validateResponseArray)

                for (let i = 0; i < endptSuccessRespParams.length; i++) {
                    let paramName = endptSuccessRespParams[i].paramName
                    logger.error("endptSuccessRespParams paramName - " + i + " is - " + paramName)
                    let paramValue = endptSuccessRespParams[i].paramValue
                    logger.error("endptSuccessRespParams paramValue - " + i + " is - " + paramValue)
                    if (validateResponseArray.includes(paramName)) {
                        logger.error("Name in response from API matches with config - " + paramName)
                        let respParamValue = responseServiceEndpointAPI.response[paramName].toString()
                        if (paramValue == respParamValue) {
                            logger.error("Value in response from API matches with config - " + respParamValue)
                            result.serviceOutcome = true
                        } else {
                            logger.error("Value in response from API doesn't match with config - " + paramValue)
                            result.serviceOutcome = false
                            break
                        }
                    }
                }
                result.endptResponse = responseServiceEndpointAPI
                return result
            }
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-050")
    }
}


/**
* @name <invokeWorkflow>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeWorkflow(payload, userProfileResponse, userPrerequisiteResponse,
    prereqName, serviceEndptRequestObj, expiryDate) {
    logger.error("Inside invokeWorkflow")
    //logger.error("invokeWorkflow input payload is - "+JSON.stringify(payload))
    //logger.error("userProfileResponse is - "+JSON.stringify(userProfileResponse))
    //logger.error("userPrerequisiteResponse is - "+JSON.stringify(userPrerequisiteResponse))
    let funcName = "invokeWorkflow"
    let workflowResponse = null
    let requestorProfileResponse = null
    let customJSONObj = {
        userPrerequisiteId: null
    }
    let reqParams = {}
    let valuesJSON = null
    let respGetUserAccount = null
    let respGetPayloadKOGCredentialsAPI = null
    let requesterUserObj = {
        requesterUserGivenName: null,
        requesterUserId: null,
        requesterUserMail: null,
        requesterUserSn: null,
        requesterUserUsername: null,
        applicationName: null,
        roleName: null
    }

    let requestedUserObj = {
        requestedUserGivenName: null,
        requestedUserId: null,
        requestedUserMail: null,
        requestedUserSn: null,
        requestedUserUsername: null,
        applicationName: null,
        roleName: null
    }

    let requestPayload = {
        requestedUserAccountId: null
    }

    let page = {
        pageNumber: null,
        fields: {},
        values: []
    }

    try {
        if (userPrerequisiteResponse.requestedUserAccountId != null) {
            //logger.error("userPrerequisiteResponse.requestedUserAccountId is - "+userPrerequisiteResponse.requestedUserAccountId)
            requestPayload.requestedUserAccountId = userPrerequisiteResponse.requestedUserAccountId
        }

        const requestBody = {
            payload: requestPayload,
            action: 2 //Get
        }

        customJSONObj.userPrerequisiteId = payload.userPrerequisiteId
        var roleApplicationResponse = getRoleAndApplicationDetails(userPrerequisiteResponse.enrollmentRequestId, requestPayload.requestedUserAccountId)
        logger.error("Value of roleApplicationResponse is - " + JSON.stringify(roleApplicationResponse))
        requestedUserObj.requestedUserGivenName = userProfileResponse.givenName
        requestedUserObj.requestedUserId = userProfileResponse._id
        requestedUserObj.requestedUserMail = userProfileResponse.mail
        requestedUserObj.requestedUserSn = userProfileResponse.sn
        requestedUserObj.requestedUserUsername = userProfileResponse.userName
        if (roleApplicationResponse != null) {
            requestedUserObj.applicationName = roleApplicationResponse.applicationName
            requestedUserObj.roleName = roleApplicationResponse.roleName
        }

        customJSONObj.requestedUser = requestedUserObj

        respGetUserAccount = getUserAccount(requestBody)
        if (respGetUserAccount != null && respGetUserAccount) {
            requestorProfileResponse = respGetUserAccount
            requesterUserObj.requesterUserGivenName = requestorProfileResponse.givenName
            requesterUserObj.requesterUserId = requestorProfileResponse._id
            requesterUserObj.requesterUserMail = requestorProfileResponse.mail
            requesterUserObj.requesterUserSn = requestorProfileResponse.sn
            requesterUserObj.requesterUserUsername = requestorProfileResponse.userName
        }
        if (roleApplicationResponse != null) {
            requesterUserObj.applicationName = roleApplicationResponse.applicationName
            requesterUserObj.roleName = roleApplicationResponse.roleName
        }
        customJSONObj.requesterUser = requesterUserObj

        page.pageNumber = Number(payload.pageNumber)
        for (let i = 0; i < payload.endpointRequest.requestParams.length; i++) {
            valuesJSON = {
                fieldName: null,
                fieldValue: null
            }
            reqParams = payload.endpointRequest.requestParams[i]
            page.fields[reqParams.serviceParamName.replace(/\s+/g, '-')] = reqParams.value.toString()
            valuesJSON.fieldName = reqParams.serviceParamName.replace(/\s+/g, '-')
            valuesJSON.fieldValue = reqParams.value.toString()
            page.values.push(valuesJSON)
        }

        respGetPayloadKOGCredentialsAPI = getPayloadKOGCredentialsAPI(userProfileResponse, prereqName, userPrerequisiteResponse, serviceEndptRequestObj, expiryDate)
        if (respGetPayloadKOGCredentialsAPI != null) {
            customJSONObj.payload = respGetPayloadKOGCredentialsAPI
        }
        customJSONObj.page = page

        const body = {
            custom: customJSONObj,
            common: {
                // expiryDate: identityServer.getProperty("esv.workflow.expirydate")
            }
        }

        logger.error("Workflow Body is " + JSON.stringify(body));
        workflowResponse = openidm.action(payload.endpointRequest.endpoint.url, "POST", body, {});
        logger.error("Workflow Response is " + JSON.stringify(workflowResponse));

        //return workflowResponse

        return {
            "code": 201,
            "status": "success",
            "message": "success"
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-051")
    }
}


/**
* @name <getPrerequisite>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPrerequisite(preReqId) {
    logger.error("Inside getPrerequisite")
    let funcName = "getPrerequisite"
    let response = null
    let status = "ACTIVE"

    try {
        response = openidm.query("managed/alpha_kyid_enrollment_prerequisite/", {
            "_queryFilter": '/_id/ eq "' + preReqId + '"'
                + ' AND (recordState eq "' + status + '" OR recordState eq "0")'
        }, ["prereqTypeId/*", "*"])
        if (response != null && response.resultCount > 0) {
            logger.error("getPrerequisite response is - " + JSON.stringify(response))
            return response
        }
        else {
            return logDebug(funcName, null, 'Prerequisite_Configuration_Not_Found', "REF-052")
        }

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-053")
    }
}


/**
* @name <patchUserPrerequisite>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function patchUserPrerequisite(apiRequestPayload, recordID, serviceEndptRequestObj, expiryDate, status) {
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
        if (serviceEndptRequestObj != null && serviceEndptRequestObj && (status != null && status && status == "COMPLETED")) {
            values = getprerequisiteValuesForUsrPrereq(serviceEndptRequestObj)
            jsonObj = {
                "operation": "replace",
                "field": "prerequisiteValues",
                "value": values
            }
            jsonArray.push(jsonObj)
        }

        jsonObj = {
            "operation": "replace",
            "field": "status",
            "value": status //"2"
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

        if (expiryDate != null && expiryDate) {
            jsonObj = {
                "operation": "replace",
                "field": "expiryDate",
                "value": expiryDate.expiryDate
            }
            jsonArray.push(jsonObj)
            jsonObj = {
                "operation": "replace",
                "field": "expiryDateEpoch",
                "value": Number(expiryDate.expiryEpoch)
            }
            jsonArray.push(jsonObj)
        }

        logger.error("UserPrerequisite jsonArray to patch - " + JSON.stringify(jsonArray))

        var userPrereqResponse = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + recordID, null, jsonArray);

        //dharjani BEGIN - Invoking Common Endpoint for User Activity Logging
        try {

            var eventCode = "PRE004"
            let userActivityPayload = {
                eventCode: eventCode,
                eventName: "Completed Prerequisite",
                eventDetails: { prerequisiteTypeId: recordID,roleName:"", prerequisiteName:"",applicationName:"",enrollmentContextID:""},
                applicationName:"",
                requesterUserId: apiRequestPayload.requestedUserAccountId,
                requestedUserId: apiRequestPayload.requestedUserAccountId
            }
            if (apiRequestPayload.preReqId) {
              let prereqResponse = getPrerequisite(apiRequestPayload.preReqId)
                if(prereqResponse && prereqResponse.resultCount>0 && prereqResponse.result[0].displayName && prereqResponse.result[0].displayName.en){
                  userActivityPayload.eventDetails.prerequisiteName = prereqResponse.result[0].displayName.en
                }
              }
          if(apiRequestPayload.requestedUserAccountId){
            let userResponse = openidm.read("managed/alpha_user/" + apiRequestPayload.requestedUserAccountId, null, ["*"]);
            if(userResponse && userResponse.mail){
              userActivityPayload.emailId = userResponse.mail || ""
            }
          }

          
          if(userPrereqResponse.enrollmentRequestId){
            userActivityPayload.eventDetails.enrollmentContextID = userPrereqResponse.enrollmentRequestId || ""
          }

          if (userPrereqResponse.roleContext && userPrereqResponse.roleContext[0].roleId) {
            roleResponse = openidm.read("managed/alpha_role/" + userPrereqResponse.roleContext[0].roleId, null, ["*"]);
              if (roleResponse && roleResponse.content && roleResponse.content[0].name && roleResponse.content[0].name.en) {
                userActivityPayload.eventDetails.roleName = roleResponse.content[0].name.en || ""
                }
            }

          if (userPrereqResponse.roleContext && userPrereqResponse.roleContext[0].applicationId) {
            appResponse = openidm.read("managed/alpha_kyid_businessapplication/" + userPrereqResponse.roleContext[0].applicationId, null, ["*"]);
              if (appResponse && appResponse.content && appResponse.content[0].title && appResponse.content[0].title.en) {
                userActivityPayload.eventDetails.applicationName = appResponse.content[0].title.en || ""
                userActivityPayload.applicationID = appResponse.content[0].title.en || ""
                }
              }
           

            let userActivityRequestBody = {
                action: 1,
                payload: userActivityPayload
            }
            logger.error("Creating audit log for " + eventCode + ":" + JSON.stringify(userActivityRequestBody))
            var userActivityLoggingResponse = openidm.create("endpoint/useractivity", null, userActivityRequestBody)
            logger.error("Creating audit log for " + eventCode + " successful. Response = " + JSON.stringify(userActivityLoggingResponse))
        } catch (error) {
            logger.error("Exception creating audit log for " + eventCode + " : " + error)
        }
        //dharjani END

        return {
            "status": "success",
            "message": "success"
        }

    } catch (error) {
        //Return error response
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-054")
    }
}


/**
* @name <invokeKOGCredentialsAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeKOGCredentialsAPI(payload) {
    logger.error("Inside invokeKOGCredentialsAPI")
    let funcName = "invokeKOGCredentialsAPI"
    let responseKOGCredentialsAPI = null
    let retryCountForKOG = 0
    let shouldRetryForKOG = true
    let requestBody = {
        url: identityServer.getProperty("esv.addremoveusercredential.api"),
        scope: identityServer.getProperty("esv.addremoveusercredential.api.scope"),
        method: "POST",
        payload: payload
    }
    let apiResult = {
        code: null,
        ResponseStatus: null,
        message: null
    }

    try {
        logger.error("Request Body for invokeKOGCredentialsAPI is - " + JSON.stringify(requestBody))

        while (shouldRetryForKOG && retryCountForKOG < 3) {
            try {
                responseKOGCredentialsAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                shouldRetryForKOG = false
            }
            catch (error) {
                logger.error("Exception in " + funcName + " is - " + getException(error))
                retryCountForKOG++;
                logger.error("Retry count of invokeKOGCredentialsAPI is: " + retryCountForKOG);
                if (retryCountForKOG == 3) {
                    throw logDebug(funcName, null, error, "REF-077")
                }
            }
        }
        //responseKOGCredentialsAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("responseKOGCredentialsAPI in invokeKOGCredentialsAPI is - " + JSON.stringify(responseKOGCredentialsAPI))
        if (responseKOGCredentialsAPI != null && responseKOGCredentialsAPI) {
            if (responseKOGCredentialsAPI.response.ResponseStatus == 0) {
                apiResult.ResponseStatus = responseKOGCredentialsAPI.response.ResponseStatus
                apiResult.code = responseKOGCredentialsAPI.status
            } else {
                apiResult.ResponseStatus = responseKOGCredentialsAPI.response.ResponseStatus
                apiResult.message = responseKOGCredentialsAPI.response.MessageResponses
                //apiResult.code = responseKOGCredentialsAPI.status
               
                apiResult.code = "ERR-BUS-SER-VAL-001"

                if (apiResult.ResponseStatus == 1 && apiResult.message[0].MessageCode == "-125") {
                    throw logDebug(funcName, "These credentials are already linked to another account. Please use different credentials or contact your application's Help Desk for assistance.", null, null)
                }
            }
        }
        logger.error("apiResult in invokeKOGCredentialsAPI is - " + JSON.stringify(apiResult))
        return apiResult

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-055")
    }
}


/**
* @name <invokeUserOnboardingAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function invokeUserOnboardingAPI(payload) {
    logger.error("Inside invokeUserOnboardingAPI")
    let funcName = "invokeUserOnboardingAPI"
    let responseUserOnboardingAPI = null
    let retryCountForOnboarding = 0
    let shouldRetryForOnboarding = true
    let requestBody = {
        url: identityServer.getProperty("esv.addremoveuseronboarding.api"),
        scope: identityServer.getProperty("esv.addremoveuseronboarding.api.scope"),
        method: "POST",
        payload: payload
    }
    let apiResult = {
        code: null,
        ResponseStatus: null,
        message: null
    }

    try {
        logger.error("Request Body for invokeUserOnboardingAPI is - " + JSON.stringify(requestBody))

        while (shouldRetryForOnboarding && retryCountForOnboarding < 3) {
            try {
                responseUserOnboardingAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
                shouldRetryForOnboarding = false
            }
            catch (error) {
                logger.error("Exception in " + funcName + " is - " + getException(error))
                retryCountForOnboarding++;
                logger.error("Retry count of invokeKOGCredentialsAPI is: " + retryCountForOnboarding);
                if (retryCountForOnboarding == 3) {
                    throw logDebug(funcName, null, error, "REF-071")
                }
            }
        }

        //responseUserOnboardingAPI = openidm.create("endpoint/invokeCertAPI", null, requestBody)
        logger.error("responseUserOnboardingAPI in invokeUserOnboardingAPI is - " + JSON.stringify(responseUserOnboardingAPI))
        if (responseUserOnboardingAPI != null && responseUserOnboardingAPI) {
            if (responseUserOnboardingAPI.response.ResponseStatus == 0) {
                apiResult.ResponseStatus = responseUserOnboardingAPI.response.ResponseStatus
                apiResult.code = responseUserOnboardingAPI.status
            } else {
                apiResult.ResponseStatus = responseUserOnboardingAPI.response.ResponseStatus
                apiResult.message = responseUserOnboardingAPI.response.MessageResponses
                //apiResult.code = responseUserOnboardingAPI.status
                apiResult.code = "ERR-BUS-SER-VAL-001"
            }
        }
        logger.error("apiResult in invokeUserOnboardingAPI is - " + JSON.stringify(apiResult))
        return apiResult

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-056")
    }
}


/**
* @name <generateGUID>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function generateGUID() {
    logger.error("Inside generateGUID")
    let funcName = "generateGUID"
    try {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-057")
    }
}


/**
* @name <getprerequisiteValuesForUsrPrereq>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getprerequisiteValuesForUsrPrereq(serviceEndptRequestObj) {
    logger.error("Inside getprerequisiteValuesForUsrPrereq")
    let funcName = "getprerequisiteValuesForUsrPrereq"
    let valuesJSON = null
    let values = []
    let reqParams = {}

    try {
        if (serviceEndptRequestObj != null && serviceEndptRequestObj) {
            for (let i = 0; i < serviceEndptRequestObj.requestParams.length; i++) {
                reqParams = {}
                valuesJSON = {
                    "fieldName": null,
                    "fieldValue": null
                }
                reqParams = serviceEndptRequestObj.requestParams[i]
                if (setCredentialField(reqParams.fieldName)) {
                    valuesJSON.fieldName = reqParams.fieldName
                    valuesJSON.fieldValue = reqParams.value.toString()
                    values.push(valuesJSON)
                }
            }

            return values
        } else {
            logger.error("SERVICE_ENDPOINT_REQUEST_OBJECT_EMPTY in getprerequisiteValuesForUsrPrereq()")
        }
    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-058")
    }
}


/**
* @name <getprerequisiteValuesForCredentialsAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getprerequisiteValuesForCredentialsAPI(serviceEndptRequestObj) {
    logger.error("Inside getprerequisiteValuesForCredentialsAPI - " + JSON.stringify(serviceEndptRequestObj))
    let funcName = "getprerequisiteValuesForCredentialsAPI"
    let valuesJSON = null
    let values = []
    let uniqueKeyElementList = []
    let kogField = {}

    try {
        if (serviceEndptRequestObj != null && serviceEndptRequestObj) {
            logger.error("kogParams length - " + serviceEndptRequestObj.kogParams.length)

            for (let i = 0; i < serviceEndptRequestObj.kogParams.length; i++) {
                kogField = {}
                valuesJSON = {
                    "CredentialDetailName": null,
                    "CredentialDetailValues": null
                }

                kogField = serviceEndptRequestObj.kogParams[i]
                logger.error("****kogField value is - " + JSON.stringify(kogField))


                //dharjani 08/20 - updating code to fix Credential API call issues

                //  if(reqParams.serviceParamName!="Password" && reqParams.serviceParamName!="Username" && reqParams.serviceParamName!="Surname") {
                //    if(reqParams.serviceParamName=="Last_4_SSN"){
                //      valuesJSON.CredentialDetailName = "SSN"
                //    } else {
                //      valuesJSON.CredentialDetailName = reqParams.fieldName
                //    }         

                if (kogField && kogField.sendFieldOnCredentialsAPI === true) {
                    valuesJSON.CredentialDetailName = kogField.fieldName
                    valuesJSON.CredentialDetailValues = [kogField.value.toString()]
                    values.push(valuesJSON)
                }
            }
            logger.error("getprerequisiteValuesForCredentialsAPI response is - " + JSON.stringify(values))
            return values

        } else {
            logger.error("SERVICE_ENDPOINT_REQUEST_OBJECT_EMPTY in " + funcName)
            return logDebug(funcName, null, 'SERVICE_ENDPOINT_REQUEST_OBJECT_EMPTY', "REF-059")
        }
    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-060")
    }
}


/**
* @name <getPayloadKOGCredentialsAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPayloadKOGCredentialsAPI(userProfileResponse, prereqName, userPrerequisiteResponse,
    serviceEndptRequestObj, expiryDate) {
    logger.error("Inside getPayloadKOGCredentialsAPI")
    let funcName = "getPayloadKOGCredentialsAPI"
    const currentTimeinEpoch = Date.now();
    const currentDate = new Date().toISOString();
    let values = null
    let requestorProfileResponse = null
    let requestPayload = {
        "requestedUserAccountId": null
    }
    let respGetUserAccount = null
    let respValuesForCredentialsAPI = null

    try {
        if (userPrerequisiteResponse.requestedUserAccountId != null) {
            //logger.error("userPrerequisiteResponse.requestedUserAccountId is - "+userPrerequisiteResponse.requestedUserAccountId)
            requestPayload.requestedUserAccountId = userPrerequisiteResponse.requestedUserAccountId
        }

        let requestBody = {
            "payload": requestPayload,
            "action": 2 //Get
        }

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

        respGetUserAccount = getUserAccount(requestBody)
        if (respGetUserAccount != null && respGetUserAccount) {
            logger.error("requestorProfileResponse is - " + respGetUserAccount)
            requestorProfileResponse = respGetUserAccount
        }

        respValuesForCredentialsAPI = getprerequisiteValuesForCredentialsAPI(serviceEndptRequestObj)
        if (respValuesForCredentialsAPI.code != "ERR-BUS-SER-VAL-001") {
            values = respValuesForCredentialsAPI
            payload.KOGID = userProfileResponse.userName
            /*if(transactionId()!=null && transactionId()){
              payload.TransactionID = transactionId()*/
            payload.TransactionID = generateGUID()
            payload.RequestorKOGID = requestorProfileResponse.userName
            payload.KOGUserCredential.CredentialTypeName = prereqName
            payload.KOGUserCredential.CredentialDetails = values

            if (expiryDate != null) {
                payload.KOGUserCredential.ExpirationDate = expiryDate.expiryDate
            } else {
                payload.KOGUserCredential.ExpirationDate = userPrerequisiteResponse.expiryDate
            }

            logger.error("getPayloadKOGCredentialsAPI is - " + JSON.stringify(payload))

            return payload

        } else {
            return getprerequisiteValuesForCredentialsAPI(serviceEndptRequestObj)
        }


    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-061")
    }
}


/**
* @name <getPayloadUserOnboardingAPI>
* @description <function description>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getPayloadUserOnboardingAPI(userProfileResponse, apiRequestPayload, prereqName, userPrerequisiteResponse) {
    logger.error("Inside getPayloadUserOnboardingAPI")
    let funcName = "getPayloadUserOnboardingAPI"
    const currentTimeinEpoch = Date.now();
    const currentDate = new Date().toISOString();
    let requestorProfileResponse = null
    let requestPayload = {
        "requestedUserAccountId": null
    }
    let respGetUserAccount = null

    try {
        if (userPrerequisiteResponse.requestedUserAccountId != null) {
            //logger.error("userPrerequisiteResponse.requestedUserAccountId is - "+userPrerequisiteResponse.requestedUserAccountId)
            requestPayload.requestedUserAccountId = userPrerequisiteResponse.requestedUserAccountId
        }

        let requestBody = {
            "payload": requestPayload,
            "action": 2 //Get
        }

        let payload = {
            KOGID: null,
            ActionFlag: identityServer.getProperty("esv.addremoveuseronboarding.api.action"), //1 = ADD and 2 = REMOVE
            TransactionID: null,
            RequestorKOGID: null,
            KOGUserOnboarding:
            {
                UserOnboardingName: null,
                CompletionDate: currentDate
            }
        }

        respGetUserAccount = getUserAccount(requestBody)
        if (respGetUserAccount != null && respGetUserAccount) {
            logger.error("requestorProfileResponse is - " + respGetUserAccount)
            requestorProfileResponse = respGetUserAccount
        }

        payload.KOGID = userProfileResponse.userName
        payload.TransactionID = generateGUID()
        payload.RequestorKOGID = requestorProfileResponse.userName
        payload.KOGUserOnboarding.UserOnboardingName = prereqName
        logger.error("getPayloadUserOnboardingAPI is - " + JSON.stringify(payload))

        return payload

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-062")
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
                return logDebug(funcName, null, 'Invalid_ExpiryDate_Option', "REF-063")
        }

        const expiryEpochMillis = new Date(expiryDate).getTime();  // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return {
            expiryEpoch: expiryEpochMillis,
            expiryDate: expiryDate
        };

    } catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-064")
    }

}

function matchFilteredFields(filteredFields, userPrereqDetails) {
    try {
        let prereqValues = [];
        if (
            userPrereqDetails &&
            Array.isArray(userPrereqDetails.result)
        ) {
            userPrereqDetails.result.forEach(record => {
                if (Array.isArray(record.prerequisiteValues)) {
                    prereqValues = prereqValues.concat(record.prerequisiteValues);
                }
            });
        }
        logger.error("Prereq Values for matching- " + JSON.stringify(filteredFields))
        logger.error("Prereq Values matching against- " + JSON.stringify(prereqValues))
        prereqValues = prereqValues || [];
        for (let field of filteredFields || []) {
            for (let prereq of prereqValues) {
                if (
                    prereq &&
                    prereq.fieldName === field.fieldName &&
                    prereq.fieldValue === field.value
                ) {
                    return true;
                }
            }
        }
        return false;
    }
    catch (error) {
        logger.error("Exception in " + funcName + " is - " + getException(error))
        throw logDebug(funcName, null, error, "REF-078")
    }

}

function checkForDuplicateValues(preReqTypeId, requestedUserAccountId) {
    try {
        var userPrereqDetails = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
            "_queryFilter": '/preRequisiteTypeId/_refResourceId eq "' + preReqTypeId + '"'
                + ' AND (recordState eq "ACTIVE" OR recordState eq "0")'
        }, ["*"])
        logger.error("Prereq Type details- " + JSON.stringify(userPrereqDetails))
        if (userPrereqDetails && userPrereqDetails !== null && userPrereqDetails.resultCount > 0) {
            var filteredRecords = userPrereqDetails.result.filter(
                record => record.status === "COMPLETED" && record.requestedUserAccountId !== requestedUserAccountId
            );
            userPrereqDetails.result = filteredRecords
            userPrereqDetails.resultCount = filteredRecords.length
        }
        logger.error("Prereq Type filtered details- " + JSON.stringify(userPrereqDetails))
        logger.error("Matching Prerequisite Request Details " + JSON.stringify(filteredFields))
        var isDuplicate = matchFilteredFields(filteredFields, userPrereqDetails)
        return isDuplicate
    }
    catch (error) {
        logger.error("REF-079: Exception in " + funcName + " is - " + getException(error))
        //throw logDebug(funcName, null, error, "REF-079")
        return false
    }
}

/**
* @name <getRoleAndApplicationDetails>
* @description <Function written to retreive application name and the role name to display in the email notification when workflow is invoked>

* @param (JSON} paramJSON
* @returns {JSON} Response JSON.
*/
function getRoleAndApplicationDetails(enrollmentRequestId, requestedUserAccountId) {
    logger.error("Inside getRoleAndApplicationDetails")
    logger.error("enrollmentRequestId" + enrollmentRequestId)
    let funcName = "getRoleAndApplicationDetails"
    let response = {
        "applicationName": null,
        "roleName": null
    }
    let businessApplicationRequestBody = {
        "payload": {
            "businessApplicationId": null
        },
        "action": 0
    };
    let roleRequestBody = {
        "payload": {
            "roleId": null,
            "userId": null,
            "appId": null
        },
        "action": "4"
    };
    let roleContextDetails = null
    let enrollmentResponse = null
    try {


        enrollmentResponse = getEnrollmentRequest(enrollmentRequestId)

        if (enrollmentResponse == null) {
            enrollmentResponse = getCancelledEnrollmentRequest(enrollmentRequestId)
        }

        if (enrollmentResponse.roleContext != null && enrollmentResponse.roleContext.length > 0) {
            roleContextDetails = enrollmentResponse.roleContext[0]
            logger.error("Value of roleContext is - " + JSON.stringify(roleContextDetails))
            if (roleContextDetails != null) {
                businessApplicationRequestBody.payload.businessApplicationId = roleContextDetails.applicationId
                logger.error("Value of businessApplicationRequestBody - " + JSON.stringify(businessApplicationRequestBody))
                var appResponse = openidm.create("endpoint/LIB-businessApplicationAPI", null, businessApplicationRequestBody)
                logger.error("Value of app response is - " + JSON.stringify(appResponse))
                if (appResponse != null) {
                    if (appResponse.result[0].content.length > 1) {
                        response.applicationName = appResponse.result[0].content[1].title.en
                    }
                    else {
                        response.applicationName = appResponse.result[0].content[0].title.en
                    }
                }
                logger.error("Value of application response is - " + JSON.stringify(appResponse))
                roleRequestBody.payload.roleId = roleContextDetails.roleId,
                    roleRequestBody.payload.userId = requestedUserAccountId,
                    roleRequestBody.payload.appId = roleContextDetails.applicationId
                var roleResponse = openidm.create("endpoint/LIB-RoleAPI", null, roleRequestBody)
                logger.error("Value of role response is - " + JSON.stringify(roleResponse))
                if (roleResponse != null) {
                    response.roleName = roleResponse.result[0].description
                    if (roleResponse.result[0].content.length > 1) {
                        response.roleName = roleResponse.result[0].content[0].name.en
                    }
                    else {
                        response.roleName = roleResponse.result[0].content[0].name.en
                    }
                }
                logger.error("Value of response is - " + JSON.stringify(response))

            }
        }
        logger.error("endpoint/prerequisite - Action 8 getRoleAndApplicationDetails End"+new Date().toISOString());
        return response
    }
    catch (error) {
        logger.error("endpoint/prerequisite - Action 8 getRoleAndApplicationDetails End"+new Date().toISOString());
        logger.error("REF-080: Exception in " + funcName + " is - " + JSON.stringify(error))
        return false
    }
}

// Audit Function

function auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId) {
    try {
        logger.error("KYID.2B1.Library.AuditLogger -- Inside Audit Logger")
        const createdDate = new Date().toISOString();
        const currentTimeinEpoch = Date.now();
        let userAgent = context.http && context.http.headers && context.http.headers['User-Agent'] ? context.http.headers['User-Agent'] : "";
        let Ipaddress = context.http && context.http.headers && context.http.headers['x-real-ip'] ? context.http.headers['x-real-ip'] : "";
        let os = context.http && context.http.headers && context.http.headers['sec-ch-ua-platform'] ? context.http.headers['sec-ch-ua-platform'] : "";
        os = os ? os.replace(/^"|"$/g, '').replace(/\\"/g, '') : "";
        if (eventDetails) {
            if (!eventDetails.browser) {
                eventDetails.browser = typeof userAgent !== "undefined" ? userAgent : "";
            }
            if (!eventDetails.os) {
                eventDetails.os = typeof os !== "undefined" ? os : "";
            }
            if (!eventDetails.IP) {
                eventDetails.IP = typeof Ipaddress !== "undefined" ? Ipaddress : "";
            }
        }

      //Fetch the requesterEmail ID
        var requesteremailID ="";
        if(requesterUserId && requesterUserId !== ""){
          var userQueryFilter = '(_id eq "' + requesterUserId + '")';
          var requesterUserObj = openidm.query('managed/alpha_user', { _queryFilter: userQueryFilter}, ["mail"]); 
          if(requesterUserObj && requesterUserObj.result && requesterUserObj.result.length > 0 && requesterUserObj.result[0].mail){
            requesteremailID = requesterUserObj.result[0].mail;
          }
        }

        //Defect Fix# 211192 (Unknown Location) - 03/12  ----BEGIN
        sessionRefId = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
              ? context.oauth2.rawInfo.sessionRefId
              : "";
         sessionRefId = deepParse(sessionRefId)
         logger.error("In endpoint/prerequisite:: Typeof sessionRefId - "+typeof sessionRefId +" and value is - "+JSON.stringify(sessionRefId))
      
           var city = sessionRefId.city || "";
            var state = sessionRefId.state || "";
            var country = sessionRefId.country || "";
              
            var placeParts = [];
            if (city && city !== undefined && city !== "undefined") {
              placeParts.push(city);
            }
            if (state && state !== undefined && state !== "undefined") {
              placeParts.push(state);
            }
            if (country && country !== undefined && country !== "undefined" && (country.toUpperCase() !== "US" || country.toUpperCase() !== "UNITED STATES" )) {
              placeParts.push(country);
            }
        
            logger.error("***placeParts in endpoint/prerequisite => "+placeParts)
            var place = "";
             if(!city){
                 logger.error("city empty in event details")
                 place = "Unknown Location"
             } else{
                 logger.error("placeParts")
              place = placeParts.join(", ");
             }
         //Defect Fix# 211192 (Unknown Location) - 03/12 ----END
      
        var logPayload = {
            eventCode: eventCode,
            eventName: eventName,
            eventDetails: JSON.stringify(eventDetails),
            requesterUserId: requesterUserId,
            requestedUserId: requestedUserId,
            transactionId: transactionId,
            sessionDetails: sessionDetails ? JSON.stringify(sessionDetails) : null,
            createdDate: createdDate,
            createdTimeinEpoch: currentTimeinEpoch,
            emailId: emailId || "",
            applicationName: applicationName || "",
            sessionId: sessionRefId.sessionRefId || "",      //Defect Fix# 211192 (Unknown Location) - 03/12
            //sessionId: sessionRefId || "",
            requesterUseremailID: requesteremailID,
            requestedUseremailID: emailId || "",
            place: place || ""   //Defect Fix# 211192 (Unknown Location) - 03/12
        };
        logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
        var sendLogstoDBandMO = identityServer.getProperty("esv.sendauditlogs.db.mo");
      if(sendLogstoDBandMO === "true"|| sendLogstoDBandMO === true){
       const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
        logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
      }

      //23-Feb PA for sending logs to DB
      try{
       const sendlogstoDB = openidm.create("endpoint/sendAuditLogstoDB", null, logPayload);
       logger.error("Response from sendAuditLogstoDB is - "+JSON.stringify(sendlogstoDB))
       } catch(error){
    	logger.error("Exception from sendAuditLogstoDB is -"+error)
       }
      
        return true
    } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
        logger.error("KYIDAuditLogger ::error" + error);
        return true
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
function logDebug(funcName, msg, error, referenceCode) {

    let detail = requestDetail()
    detail.functionName = funcName
    detail.exception = getException(error)
    let response = {
        code: "ERR-BUS-SER-VAL-001",
        message: msg != null
            ? msg
            : "An unexpected error occurred when submitting the request. Please try again later. " + referenceCode,
        detail: JSON.stringify(detail.exception)
    };
    return response
    // if(msg!=null){
    //   return { code:"ERR-BUS-SER-VAL-001", message:msg, detail:JSON.stringify(detail.exception) }
    // } else {
    //   return { code:"ERR-BUS-SER-VAL-001", message:'An unexpected error has occurred', detail:JSON.stringify(detail.exception) }
    // }

}


function deepParse(data) {
  // If it's not a string, we can't parse it further
  if (typeof data !== 'string') {
    return data;
  }

  try {
    const parsed = JSON.parse(data);
    // If the parsed result is still a string, keep parsing
    return deepParse(parsed);
  } catch (e) {
    // If JSON.parse fails, it's a regular string, so return it
    return data;
  }
}

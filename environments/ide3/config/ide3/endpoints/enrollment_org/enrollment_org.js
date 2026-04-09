

// var isEndpointExecutionAllowed = identityServer.getProperty("esv.journey.execution.flag")
// const currentTimeinEpoch = Date.now()
// const currentDate = new Date().toISOString()



(function () {
    const authenticatedUserId = context.current.parent.parent.parent.parent.parent.rawInfo.sub
    const authorizedRole = context.current.parent.parent.parent.parent.authorization.roles
    logger.error("authorizedRole are --> " + authorizedRole)
    var currentTimeinEpoch = Date.now()
    var currentDate = new Date().toISOString()



    if (request.method === 'create') {
        // POST
        const payload = request.content.payload
        const action = request.content.action
        let getEnrollmentResponse = null
        let createEnrollmentResponse = null

        const requestedUserAccountId = payload.requestedUserAccountId;
        const appSystemName = payload.appSystemName;
        const enrollmentContextId = payload.enrollmentContextId
        logger.error("le-test-log: " + authenticatedUserId + " : " + requestedUserAccountId);
      /*  if ((authenticatedUserId !== requestedUserAccountId)) {
            throw { code: 403, message: 'You are not authorized' }
        } */


        if (action === 1) {
            if (getActiveEnrollmentRequest(enrollmentContextId, requestedUserAccountId)) {
                getEnrollmentResponse = getActiveEnrollmentRequest(enrollmentContextId, requestedUserAccountId)
                if (getEnrollmentResponse) {
                    logger.error("enrollmentRequest is --> " + getEnrollmentResponse)
                    if (getEnrollmentResponse.message) {
                        logger.error("getEnrollmentResponse.message" + getEnrollmentResponse.message)
                        throw { code: getEnrollmentResponse.code, message: getEnrollmentResponse.message }
                    }
                    else {
                        return getEnrollmentResponse

                    }


                }
                else {
                    throw { code: 500, message: 'Unknown error' }
                }

            }
            else {
                createEnrollmentResponse = enrollmentRequest(action, enrollmentContextId, requestedUserAccountId)
                if (createEnrollmentResponse) {
                    logger.error("enrollmentRequest is *** --> " + JSON.stringify(createEnrollmentResponse));
                    if (createEnrollmentResponse.message) {
                        logger.error("createEnrollmentResponse.message" + createEnrollmentResponse.message)
                        throw { code: createEnrollmentResponse.code, message: createEnrollmentResponse.message }

                    }
                    else {
                        return createEnrollmentResponse

                    }


                }
                else {
                    throw { code: 500, message: 'Unknown error' }
                }


            }


        }
        else if (action === 2) {
            logger.error("Inside Action 2")

            const CancelEnrollmentResponse = CancelEnrollment(payload.enrollmentRequestId,requestedUserAccountId)
            logger.error("CancelEnrollmentResponse is " + CancelEnrollmentResponse)
            if (CancelEnrollmentResponse && CancelEnrollmentResponse !== null) {
                if (CancelEnrollmentResponse.message && CancelEnrollmentResponse.status) {
                    return CancelEnrollmentResponse
                }
                else {
                    throw { code: 400, message: CancelEnrollmentResponse.message }
                }
            }
            else {
                throw { code: 500, message: "Unexpected Error Occurred" }
            }
        }
        if (action === 4) {
            var status = request.content.payload.status;
            var returnParams = request.content.payload.returnParams;

            if (requestedUserAccountId && status) {
                return getUserRequestByRequestedUserIdAndStatus(requestedUserAccountId, status, returnParams);
            } else if ((appSystemName && status)) {
                return getUserRequestByappSystemNameAndStatus(appSystemName, status, returnParams);
            } else {
                throw {
                    code: 400,
                    message: 'No matching condition found for search'
                };
            }
        }


    } else if (request.method === 'read') {
        // GET
        var params = request.additionalParameters
        var response = null
        var paramKeys = Object.keys(params)
        var allowedParamsGetPrereqSummary = ["requestedUserAccountId", "enrollmentRequestId"];
        var userId = request.additionalParameters.requestedUserAccountId
        var enrollmentReqId = request.additionalParameters.enrollmentRequestId
        if (authenticatedUserId !== userId) {
            throw { code: 403, message: 'You are not authorized' }
        }

        if (allowedParamsGetPrereqSummary.sort().toString() === paramKeys.sort().toString()) {
            if (!(userId !== null && userId !== "")) {
                throw { code: 400, message: 'UserID cannot be blank or null' }
            }
            else if (!(enrollmentReqId !== null && enrollmentReqId !== "")) {
                throw { code: 400, message: 'enrollmentRequestId ID cannot be blank or null' }
            }
            else {
                let apiRequestPayload = {
                    requestedUserAccountId: userId,
                    enrollmentRequestId: enrollmentReqId,
                    preReqId: null
                }
                response = getPrerequisites(apiRequestPayload)
                logger.error("User Prereq Summary is --> " + JSON.stringify(response))
                if (response && response.message) {
                    throw { code: 400, message: response.message };
                }
                else if (response !== null) {
                    return response
                }
                else {
                    throw { code: 404, message: 'Prerequisite Not found ' };
                }

            }
        }
        else {
            throw { code: 400, message: 'invalid params' }
        }


        return {};
    } else if (request.method === 'update') {
        // PUT
        return {};
    } else if (request.method === 'patch') {
        var patchOperations = request.patchOperations
        var enrollmentRequestId = request.additionalParameters.enrollmentRequestId
        var userId = request.additionalParameters.requestedUserAccountId
        if (authenticatedUserId !== userId) {
            throw { code: 403, message: 'You are not authorized' }
        }
        var patchResponse = CancelEnrollment(enrollmentRequestId, userId)

        return patchResponse



    } else if (request.method === 'delete') {
        return {};
    }
    throw { code: 500, message: 'Unknown error' }
}());

function enrollmentRequest(action, enrollmentContextId, requestedUserAccountId) {
    try {
        if (requestedUserAccountId !== null && getUserDetails(requestedUserAccountId)) {
            let requestedUser = requestedUserAccountId
            let requestedUserDetails = getUserDetails(requestedUserAccountId)
            let outcome = {}
            var enrollmentReqTemplateArray = []
            if (action == 1) {
                let enrollmentContextResponse = getEnrollmentContextDetails(enrollmentContextId);
                logger.error("enrollmentContextResponse is --> " + JSON.stringify(enrollmentContextResponse));
                if (enrollmentContextResponse !== null && enrollmentContextResponse && enrollmentContextResponse.code !== 1 && enrollmentContextResponse.code !== 500 && enrollmentContextResponse.code !== 2) {
                    if (enrollmentContextResponse.requestedUserAccountId !== null && enrollmentContextResponse.requestedUserAccountId
                        && enrollmentContextResponse.requesterUserAccountId) {
                        logger.error("Dummy log --> ");
                        if (requestedUserAccountId === enrollmentContextResponse.requestedUserAccountId) {// validating if requested user is same as loggedin User
                            // requestedUser = enrollmentContextResponse.requestedUserAccountId
                            requesterUser = enrollmentContextResponse.requesterUserAccountId;
                            logger.error("Dummy log2 --> ");
                            if (getUserDetails(requesterUser)) {

                                requesterUserDetails = getUserDetails(requesterUser)
                            }
                            logger.error("Dummy log3 --> ");
                            if (requesterUserDetails && requestedUserDetails) {
                                logger.error("Dummy log4 --> ");
                                outcome = enrollmentReqLogic(enrollmentContextId, requesterUser, requesterUserDetails, enrollmentContextResponse, requestedUserDetails, requestedUser)
                                logger.error("Dummy log5 --> " + JSON.stringify(outcome));
                            }

                            else {
                                return {
                                    code: 400,
                                    message: 'User is Inactive'
                                }
                                // throw { code: 400, message: 'User is Inactive' };
                            }

                        }
                        else {
                            return { code: 400, message: 'Invalid User' }
                        }


                    }

                    else {
                        outcome = enrollmentReqLogic(enrollmentContextId, null, null, enrollmentContextResponse, requestedUserDetails, requestedUser)

                    }

                }
                else if (enrollmentContextResponse.code === 2) {
                    outcome = createStaticEnrollmentRequest(enrollmentContextId, requestedUserDetails, requestedUser)
                }
                else {
                    let msg = enrollmentContextResponse.message
                    return { code: 400, message: msg }
                }
                return outcome;
            }

        }
        else {
            logger.error("User ID not found")
            return {
                code: 400, message: 'UserId is null'
            }
        }
    } catch (error) {
        logger.error("Error Occurred while enrollmentRequest" + error)
        return { code: 500, message: 'Unknown error' + error }
    }

}

function getEnrollmentContextDetails(enrollmentContextId) {
    try {
        var currentTimeinEpoch = Date.now()
        var currentDate = new Date().toISOString()
        let requestBody = {
            payload: {
                "contextId": enrollmentContextId
            },
            action: 2
        }
        var response = openidm.create("endpoint/LIB-EnrollmentContextAPI", null, requestBody)
        logger.error("getEnrollmentContextDetails  --> " + response)

        if (response && response.resultCount > 0) {

            if (response.result[0].expiryDateEpoch && response.result[0].expiryDateEpoch > currentTimeinEpoch) {

                logger.error("Context ID is within Expiry")
                logger.error("Expiry Date in Epoch " + response.result[0].expiryDateEpoch);
                logger.error("currentTimeinEpoch " + currentTimeinEpoch)

                return response.result[0]
            }
            else if (response.result[0].expiryDateEpoch === null || !(response.result[0].expiryDateEpoch)) {
                return response.result[0]
            }
            else {
                return { code: 1, message: "Context Id is expired" }
            }
        }
        else {
            return { code: 2, message: "Enrollment request not found with this Context ID" }
        }


    } catch (error) {
        logger.error("Error Occurred while getEnrollmentContextDetails" + error)
        return { code: 500, message: 'Unknown error' + error }
    }

}



function getUserDetails(userId) {
    try {
        let requestBody = {
            payload: {
                requestedUserAccountId: userId
            },
            action: 2
        }

        // var response = openidm.query("managed/alpha_user/", { "_queryFilter": '/_id/ eq "' + userId + '"' + ' AND accountStatus eq "' + "active" + '"' }, []);
        var response = openidm.create("endpoint/LIB-UserProfileAPI", null, requestBody)
        logger.error("user response is --> " + response)

        if (response && response.user !== null) {
            return response
        }

        else {
            logger.error("Inside else condition")
            return false
        }


    } catch (error) {
        logger.error("Error Occurred while getUserDetails" + error)
        return null;
    }

}


function getRoleDetails(action, roleId, userId, appId) {
    try {
        var reqBody = {
            "payload": {
                "roleId": roleId,
                "userId": userId,
                "appId": appId
            },
            "action": action


        };
        var response = openidm.create("endpoint/LIB-RoleAPI", null, reqBody)
        logger.error("getRoleDetails is --> " + response)
        if (response) {
            return response
        }
        else {
            return { code: 500, message: 'Unknown error' + error }
        }
    } catch (error) {
        throw { code: 500, message: 'Unknown error' + error }
    }
}

function getPolicyDetails(policyId, action) {
    try {
        logger.error("Inside getPolicyDetails Function")
        let requestBody = {
            payload: {
                "policyId": policyId,
            },


            "action": action
        };

        const response = openidm.create("endpoint/LIB-AccessPolicyAPI", null, requestBody);
        logger.error("getPolicyDetails --> " + response)
        if (response) {
            return response
        }
        else {

        }


    } catch (error) {
        logger.error("Error Occurred getPolicyDetails roles " + error)
    }
}

function getUsersRoles(requestedUserDetails) {
    try {
        let userRoles = [];
        // const response = openidm.query("managed/alpha_user/", { "_queryFilter": '/_id/ eq "' + userId + '"' + ' AND accountStatus eq "' + "active" + '"' }, []);
        if (requestedUserDetails !== null && requestedUserDetails.user.resultCount > 0) {
            logger.error("requestedUserDetails Roles" + requestedUserDetails.user.result[0].effectiveRoles)
            if (requestedUserDetails.user.result[0].effectiveRoles !== null && requestedUserDetails.user.result[0].effectiveRoles.length > 0) {
                for (let i = 0; i < requestedUserDetails.user.result[0].effectiveRoles.length; i++) {
                    userRoles.push(requestedUserDetails.user.result[0].effectiveRoles[i]._refResourceId)
                }

            }
        }
        logger.error("userRoles are -- > " + userRoles)
        return userRoles;
    } catch (error) {
        logger.error("Error Occurred while getting user roles")
    }


}

function getBusinessAppDetails(action, appId) {
    try {
        let requestBody = {
            "payload": {
                "businessApplicationId": appId,
            },


            "action": action
        };

        const response = openidm.create("endpoint/LIB-businessApplicationAPI", null, requestBody)
        logger.error("LIB-businessApplicationAPI Response is --> " + response)
        if (response) {
            return response
        }
        else {

        }


    } catch (error) {

    }

}

function isUserPrerequsitePresent(action, enrollmentRequestId) {
    try {
        let requestBody = {
            "payload": {
                "enrollmentRequestId": enrollmentRequestId,
            },


            "action": action
        };

        const response = openidm.create("endpoint/UserPrerequisiteAPI", null, requestBody)

        logger.error("LIB-businessApplicationAPI Response is --> " + response)
        if (response) {
            return response
        }
        else {

        }


    } catch (error) {

    }

}

function createEnrollmentRequest(enrollmentReqTemplate) {
    try {
        let requestBody = {
            "payload": enrollmentReqTemplate
        }

        logger.error("Inside createEnrollmentRequest function")
        if (enrollmentReqTemplate !== null && enrollmentReqTemplate) {
            logger.error("Inside createEnrollmentRequest function -- > ")
            // const response = openidm.create("managed/alpha_kyid_enrollment_request", null, enrollmentReqTemplate);
            // const response = openidm.create("endpoint/LIB-EnrollmentRequestAPI", null, requestBody);
            const response = openidm.create("managed/alpha_kyid_enrollment_request", null, enrollmentReqTemplate)
        }
        if (response) {
            logger.error("createEnrollmentRequest response is -- > " + createEnrollmentRequest)
            return response
        }


    } catch (error) {
        logger.error("Error Occurred while createEnrollmentRequest " + error)

    }
}


// Function to get active enrollment requests based on context and user IDs
function getActiveEnrollmentRequest(contextId, userId) {
    try {
        // Initialize required variables
        let userDetails = null
        if (getUserDetails(userId)) {
            userDetails = getUserDetails(userId)
            if (userDetails !== null && userDetails !== false) {

                let roleId = null
                let userPrereqResponse = null
                let businessAppResponse = null
                let activeEnrollmentsWithoutPreReq = {} // Object to store enrollments without prerequisites
                let activeEnrollmentsWithPreReq = []    // Array to store enrollments with prerequisites
                let prereqRecord = {
                    id: null,                // ID of the Enrollment
                    helpdeskContactId: null,
                    appLogo: null,           // Logo of the business app
                    roleDisplayName: null,   // Display name of the role
                    appDisplayName: null,    // Display name of the app
                    appId: null              // ID of the app
                };
                let outcome = {
                    "activeEnrollmentsWithoutPreReq": activeEnrollmentsWithoutPreReq,
                    "activeEnrollmentsWithPreReq": activeEnrollmentsWithPreReq
                };


                logger.error("Inside createEnrollmentRequest function")


                // let requestBody = {
                //     "payload": {
                //         "userId": userId,
                //         "contextId": contextId
                //     },
                //     "action": 9 // Action code for getting active enrollments
                // };

                // Make the API call to retrieve active enrollment data
                // const response = openidm.create("endpoint/LIB-EnrollmentRequestAPI", null, requestBody);
                const response = openidm.query("managed/alpha_kyid_enrollment_request/", {
                    "_queryFilter": '/requestedUserId/ eq "' + userId + '"'
                        + ' AND status eq "' + "IN_PROGRESS" + '"' + ' AND recordState eq "' + "ACTIVE" + '"' + ' AND (enrollmentContextId eq "' + contextId + '" OR roleIds/_refResourceId eq "' + contextId + '")'
                }, ["roleIds/*", ["*"]])


                logger.error("custom endpoint logs: getActiveEnrollmentRequest --> " + response)

                // Check if there are any results in the response
                if (response.resultCount > 0) {
                    // Loop through each result in the response
                    for (let i = 0; i < response.result.length; i++) {
                        // Check if prerequisites are present for the user

                        prereqRecord = {
                            id: null,                // ID of the Enrollment
                            helpdeskContactId: null,
                            appLogo: null,           // Logo of the business app
                            roleDisplayName: null,   // Display name of the role
                            appDisplayName: null,    // Display name of the app
                            appId: null              // ID of the app
                        }
                        userPrereqResponse = isUserPrerequsitePresent(0, response.result[i]._id);
                        logger.error("userPrereqResponse is --> " + userPrereqResponse)

                        // If prerequisites are present
                        if (userPrereqResponse && userPrereqResponse.isPrereqPresent === true) {
                            // Check if the result contains role IDs and if there is exactly one
                            if (response.result[i].roleIds.length > 0 && response.result[i].roleIds.length === 1) {
                                roleId = response.result[i].roleIds[0]._id

                                // Extract role display name from the response
                                if (response.result[i].roleIds[0].content[0].name) {
                                    prereqRecord.roleDisplayName = response.result[i].roleIds[0].content[0].name
                                }

                                prereqRecord.id = response.result[i]._id

                                roleResponse = getRoleDetails("4", roleId, userId, null)
                                // Fetch business app details using the role ID
                                if (!roleResponse) {

                                    return { code: 400, message: "Role not Found with the request" }
                                }
                                businessAppResponse = getBusinessAppDetails(0, roleResponse.result[0].businessAppId._refResourceId)
                                // businessAppResponse = getBusinessAppDetails(0, roleId);
                                logger.error("businessAppResponse is --> " + businessAppResponse)

                                // If business app details are found, fill the prereqRecord
                                if (businessAppResponse !== null && businessAppResponse) {
                                    prereqRecord.appId = businessAppResponse.result[0]._id

                                    // Set app logo if available
                                    if (businessAppResponse.result[0].applicationURL) {
                                        prereqRecord.appLogo = businessAppResponse.result[0].applicationURL
                                    }

                                    // Set app display name if available
                                    if (businessAppResponse.result[0].content[0].title) {
                                        prereqRecord.appDisplayName = businessAppResponse.result[0].content[0].title
                                    }
                                    if (businessAppResponse.result[0].applicationHelpdeskContact) {
                                        prereqRecord.helpdeskContactId = businessAppResponse.result[0].applicationHelpdeskContact._refResourceId
                                    }
                                }

                                // Add the populated prereqRecord to the array of enrollments with prerequisites
                                activeEnrollmentsWithPreReq.push(prereqRecord)
                            }
                        } else {
                            // If no prerequisites are present, log the event and add to enrollments without prerequisites
                            if (response.result[i].roleIds.length === 1) {
                                activeEnrollmentsWithoutPreReq["id"] = response.result[i]._id;
                                roleResponse = getRoleDetails("4", response.result[i].roleIds[0]._refResourceId, userId, null);
                                businessAppResponse = getBusinessAppDetails(0, roleResponse.result[0].businessAppId._refResourceId)
                                let activeEnrollmentsWithoutPreReqAppJSON = {
                                    appId: null,
                                    helpdeskContactId: null,
                                    appLogo: null,
                                    appDisplayName: null
                                }


                                if (businessAppResponse.result[0]._id) {
                                    activeEnrollmentsWithoutPreReqAppJSON.appId = businessAppResponse.result[0]._id
                                }
                                if (businessAppResponse.result[0].applicationHelpdeskContact) {
                                    activeEnrollmentsWithoutPreReqAppJSON.helpdeskContactId = businessAppResponse.result[0].applicationHelpdeskContact._refResourceId
                                }
                                logger.error("Business APP Logo UTL is -->businessAppResponse.result[0].logoURL  " + businessAppResponse.result[0].logoURL)
                                if (businessAppResponse.result[0].logoURL) {
                                    activeEnrollmentsWithoutPreReqAppJSON.appLogo = businessAppResponse.result[0].logoURL
                                }
                                if (businessAppResponse.result[0].content[0].title) {
                                    activeEnrollmentsWithoutPreReqAppJSON.appDisplayName = businessAppResponse.result[0].content[0].title
                                }
                                activeEnrollmentsWithoutPreReq["associatedAppInfo"] = activeEnrollmentsWithoutPreReqAppJSON
                                // activeEnrollmentsWithoutPreReq["id"] = enrollmentReqId._id

                            }
                            else {
                                logger.error("custom endpoint logs : Inside Else Block");
                                activeEnrollmentsWithoutPreReq["id"] = response.result[i]._id
                                activeEnrollmentsWithoutPreReq["platformInfo"] = {
                                    "helpdeskContactId": "72ed3dfc-9e6e-4583-b910-3b8498381201"
                                }

                            }

                        }
                    }

                    // Return the outcome object with both types of enrollments (with prereq and without prereq)
                    return outcome
                } else {
                    // Return false if no results were found
                    return false
                }
            }
            else {
                return { code: 400, message: "User is not valid" }
            }
        }
        else {
            return { code: 400, message: "User is not valid" }
        }
    } catch (error) {
        logger.error("Error Occurred while getActiveEnrollmentRequest: " + error);
        return { code: 400, message: "Error Occurred while getActiveEnrollmentRequest:" + error }
    }
}

function isPrereqRequired(prereqDetails,requiredMFA) {
    try {
        logger.error("Executing isPrereqRequired Function")
        let prereqRequired = null;
        let withPrereqCounter = 0
        let prerequisiteTypeResponse = null
        if(requiredMFA){
          requiredMFA=requiredMFA
        }
      else{
        requiredMFA ="0"
      }
        if (prereqDetails !== null && prereqDetails.length > 0) {
            logger.error("isPrereqRequired -- prereqDetails are --> " + prereqDetails)
            for (let i = 0; i < prereqDetails.length; i++) {
                // prereqId = prereqDetails[i]._id
                logger.error("Looping For Loop Count "+ i)
                 logger.error(" isPrereqRequired prereqDetails prereqDetails  " + prereqDetails[i])
                logger.error(" isPrereqRequired prereqDetails prereqDetails.length " + prereqDetails.length)
                if (prereqDetails[i].enrollmentActionSettings.triggerAlways === true) {
                   prerequisiteTypeResponse = getPrerequisiteType(prereqDetails[i]._id, 1)
                  if(prerequisiteTypeResponse){
                    if(prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && (requiredMFA === "0" )){
                      logger.error(" isPrereqRequired Skipping prereq as MFA Code is 0 or null ")
                    }
                  else{
                    withPrereqCounter ++
                  }
                    
                  }

                   
                   

                }
              else{
                 logger.error("isPrereqRequired Trigger Always Flag is False")
              }
            }
              logger.error("withPrereqCounter Count is -- "+ withPrereqCounter)

                if(withPrereqCounter >0 ){
                    return true
                }
                else{
                    return false
                }


            

 


        }
        else {
            logger.error("isPrereqRequired Prerequsite Details is Null or Length is 0"  )
            return false
        }



    } catch (error) {
        logger.error("Error Occurred evaluateUserPrereq Function " + error)
        return { code: 400, message: "Error Occurred evaluateUserPrereq function" + error }
    }

}


// createUserPrereqRespons = evaluateUserPrereq(requestedUserDetails,enrollmentReqId._id, requestedUser, requesterUser, roleResponse.result[0]._id, policyResponse.result[0].preRequisites,roleResponse.result[0].requiredMFAMethod)
function evaluateUserPrereq(requestedUserDetails, enrollmentRequestId, userId, requesterId, roleId, prereqDetails, requiredMFACode,appRoleContext) {
    try {
        logger.error("Inside evaluateUserPrereq ")
        let currentTimeinEpoch = Date.now()
        let currentDate = new Date().toISOString()
        let expiryDate = null
        let foundMFA = false
        let isUserPrereq = false
        let prerequisiteTypeResponse = null
        let userPrereqResponse = null
        let prereqExpiryDate = null
        let userPrereqPayload = {
            preRequisiteType: null,
            enrollmentRequestId: enrollmentRequestId,
            associatedRoleIds: roleId,
            createDate: currentDate,
            completionDate: null,
            expiryDate: null,
            expiryDateEpoch: null,
            status: null,
            updateDate: currentDate,
            updateDateEpoch: currentTimeinEpoch,
            createdBy: "KYID-System",
            updatedBy: "KYID-System",
            allowReuseIfDaysOld: null,
            completionDateEpoch: null,
            createDateEpoch: currentTimeinEpoch,
            displayOrder: null,
            pingApprovalWorkflowId: null,
            recordSource: "KYID",
            recordState: "ACTIVE",
            requestedUserAccountId: userId,
            requesterUserAccountId: null,
            preRequisiteTypeId: {},
            preRequisiteId: {},
            displayName: {},
            roleContext:[]
        }
        let roleContext ={
          applicationId:null,
          roleId:null,
          originalDelegatorUserAccountId:null,
          currentDelegatorUserAccountId:null,
          orgId:null,
          orgType:null,
          orgName:null,
          orgSourceUniqueId:null,
          businessKeyTypeName:null,
          businessKeyId:null,
          businessKeyName:null,
          businessKeyDescription:null,
          kogOrgBusinessKeyId:null,
          isForwardDelegable:false,
          delegationEndDate:null,
          delegationEndDateEpoch:null
        }
        if (requesterId) {
            userPrereqPayload.requesterUserAccountId = requesterId
            userPrereqPayload.createdBy = requesterId
            userPrereqPayload.updatedBy = requesterId
        }
        else {
            userPrereqPayload.requesterUserAccountId = userId
            userPrereqPayload.createdBy = userId
            userPrereqPayload.updatedBy = userId
        }

        if (requestedUserDetails && requestedUserDetails.authenticators !== null) {
            var UserMFAResponse = requestedUserDetails.authenticators
            logger.error("UserMFAResponse is --> " + UserMFAResponse)
            logger.error("Required MFA is --> " + requiredMFACode)
            if(requiredMFACode == null || requiredMFACode == ""){
              requiredMFACode="0"
            }

            for (i = 0; i < UserMFAResponse.resultCount; i++) {
                if (requiredMFACode === "5" && (UserMFAResponse.result[i].MFAMethod === "TOTP" || UserMFAResponse.result[i].MFAMethod === "PUSH" || UserMFAResponse.result[i].MFAMethod === "FRPUSH" || UserMFAResponse.result[i].MFAMethod === "FRTOTP"|| UserMFAResponse.result[i].MFAMethod === "SYMANTEC")) {
                    foundMFA = true
                    break
                }
                else if (requiredMFACode === "4" && (UserMFAResponse.result[i].MFAMethod === "SMSVOICE" || UserMFAResponse.result[i].MFAMethod === "TOTP" || UserMFAResponse.result[i].MFAMethod === "PUSH" || UserMFAResponse.result[i].MFAMethod === "FRPUSH" || UserMFAResponse.result[i].MFAMethod === "FRTOTP"|| UserMFAResponse.result[i].MFAMethod === "SYMANTEC")) {
                    foundMFA = true
                    break

                }
                else if (requiredMFACode === "3" && (UserMFAResponse.result[i].MFAMethod === "EMAIL" || UserMFAResponse.result[i].MFAMethod === "SECONDARY_EMAIL" || UserMFAResponse.result[i].MFAMethod === "SMSVOICE" || UserMFAResponse.result[i].MFAMethod === "FRPUSH" || UserMFAResponse.result[i].MFAMethod === "FRTOTP" || UserMFAResponse.result[i].MFAMethod === "TOTP" || UserMFAResponse.result[i].MFAMethod === "PUSH" || UserMFAResponse.result[i].MFAMethod === "SYMANTEC")) {
                    foundMFA = true
                    break
                }
            }
        }

        if (prereqDetails !== null && prereqDetails.length > 0) {
            if(appRoleContext && appRoleContext !== null){
              roleContext.applicationId = appRoleContext.applicationId || null
              roleContext.roleId = appRoleContext.roleId || null
              roleContext.originalDelegatorUserAccountId = appRoleContext.originalDelegatorUserAccountId || null
              roleContext.currentDelegatorUserAccountId = appRoleContext.currentDelegatorUserAccountId || null
              roleContext.orgId = appRoleContext.orgId || null
              roleContext.orgType = appRoleContext.orgType || null
              roleContext.orgName = appRoleContext.orgName || null
              roleContext.orgSourceUniqueId = appRoleContext.orgSourceUniqueId || null
              roleContext.businessKeyTypeName = appRoleContext.businessKeyTypeName || null
              roleContext.businessKeyId = appRoleContext.businessKeyId || null
              roleContext.businessKeyName = appRoleContext.businessKeyName || null
              roleContext.businessKeyDescription = appRoleContext.businessKeyDescription || null
              roleContext.kogOrgBusinessKeyId = appRoleContext.kogOrgBusinessKeyId || null
              roleContext.isForwardDelegable = appRoleContext.isForwardDelegable || false
              roleContext.delegationEndDate = appRoleContext.delegationEndDate || null
              roleContext.delegationEndDateEpoch = appRoleContext.delegationEndDateEpoch || null
              userPrereqPayload.roleContext.push(roleContext)
            }
            logger.error("prereqDetails are --> " + prereqDetails)
            for (let i = 0; i < prereqDetails.length; i++) {
                // prereqId = prereqDetails[i]._id
                logger.error("prereqDetails prereqDetails  " + prereqDetails[i])
                logger.error("prereqDetails prereqDetails.length " + prereqDetails.length)
                if (prereqDetails[i].enrollmentActionSettings.triggerAlways === true) {

                    prerequisiteTypeResponse = getPrerequisiteType(prereqDetails[i]._id, 1)
                    logger.error("prerequisiteTypeResponse is --> " + prerequisiteTypeResponse)
                    if ((prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" || prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "4" )&& requiredMFACode === "0") { // Adding this condition if MFA is not required (MFA code as 0)
                        logger.error("endpoint/enrollment logs --> Skipping MFA MFA code is 0")
                    }
                    else {
                        userPrereqPayload.displayName = prereqDetails[i].displayName
                        userPrereqPayload.preRequisiteId = { "_ref": "managed/alpha_kyid_enrollment_prerequisite/" + prereqDetails[i]._id, "_refProperties": {} }

                        userPrereqPayload.displayOrder = i + 1

                        if (prerequisiteTypeResponse && prerequisiteTypeResponse.result[0]._id && prerequisiteTypeResponse.result[0].name) {

                            userPrereqPayload.preRequisiteType = prerequisiteTypeResponse.result[0].prereqTypeId.typeName
                            userPrereqPayload.preRequisiteTypeId = { "_ref": "managed/alpha_kyid_enrollment_prerequisite_type/" + prerequisiteTypeResponse.result[0].prereqTypeId._refResourceId, "_refProperties": {} }




                            if (prereqDetails[i].enrollmentActionSettings.allowReuse === false) {

                                logger.error("prerequisite Id --> " + prereqDetails[i]._id)

                                logger.error("PrereType Name is --> " + prerequisiteTypeResponse.result[0].prereqTypeId.typeName)
                                if ((prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA"||  prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "4") && foundMFA === true) {
                                    userPrereqPayload.completionDate = currentDate
                                    userPrereqPayload.completionDateEpoch = currentTimeinEpoch
                                    userPrereqPayload.status = "COMPLETED"
                                }
                                else {
                                    userPrereqPayload.status = "NOT_STARTED"
                                }


                            }
                            else {
                                logger.error("Inside allow reuse condition")



                                if (completedPrereqResponse = getCompletedPrereq(userId, prereqDetails[i]._id, prerequisiteTypeResponse.result[0].prereqTypeId._refResourceId)) {
                                    logger.error("completedPrereqResponse are --> " + completedPrereqResponse)
                                    logger.error("prereqDetails[i].enrollmentActionSettings.allowReuseIfDaysOld is -->" + prereqDetails[i].enrollmentActionSettings.allowReuseIfDaysOld)
                                    logger.error("completedPrereqResponse.result[0].completionDateEpoch -->" + completedPrereqResponse.result[0].completionDateEpoch)
                                    if (isPrereqReusable(prereqDetails[i].enrollmentActionSettings.allowReuseIfDaysOld, completedPrereqResponse.result[0].completionDateEpoch) === true) {
                                        logger.error("Inside Already Completed condition" + isPrereqReusable(prereqDetails[i].enrollmentActionSettings.allowReuseIfDaysOld, completedPrereqResponse.result[0].completionDateEpoch))

                                        if (prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA") {
                                            if (foundMFA === true) {
                                                userPrereqPayload.completionDate = completedPrereqResponse.result[0].completionDate
                                                userPrereqPayload.completionDateEpoch = completedPrereqResponse.result[0].completionDateEpoch
                                                userPrereqPayload.status = "ALREADY_COMPLETED"
                                            }
                                            else {
                                                userPrereqPayload.status = "NOT_STARTED"
                                            }

                                        }
                                        else {
                                            userPrereqPayload.completionDate = completedPrereqResponse.result[0].completionDate
                                            userPrereqPayload.completionDateEpoch = completedPrereqResponse.result[0].completionDateEpoch
                                            userPrereqPayload.status = "ALREADY_COMPLETED"
                                        }



                                    }
                                    else {
                                        logger.error("isPrereqReusable flag is false  ")
                                        if (prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && foundMFA === true) {
                                            userPrereqPayload.completionDate = currentDate
                                            userPrereqPayload.completionDateEpoch = currentTimeinEpoch
                                            userPrereqPayload.status = "ALREADY_COMPLETED"
                                        }
                                        else {
                                            userPrereqPayload.status = "NOT_STARTED"
                                        }


                                    }

                                }
                                else {
                                    if (prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && foundMFA === true) {
                                        userPrereqPayload.completionDate = currentDate
                                        userPrereqPayload.completionDateEpoch = currentTimeinEpoch
                                        userPrereqPayload.status = "COMPLETED"
                                    }
                                    else {
                                        logger.error("Completed prereq not present")
                                        userPrereqPayload.status = "NOT_STARTED"

                                    }


                                }

                            }
                        }
                        logger.error("userPrereqPayload is --> " + JSON.stringify(userPrereqPayload))
                        userPrereqResponse = createUserPrerequisite(1, userPrereqPayload)
                        if (userPrereqResponse) {
                            logger.error("userPrereqResponse is -->" + userPrereqResponse)
                            isUserPrereq = true
                        }
                        else {
                            isUserPrereq = false
                            return { code: 400, message: "Error Occurred while Creating UserPrerequsiistes" }
                        }

                    }


                }



            }
          
                return "success"
            
 


        }
        else {
            return { code: 400, message: "Prereq Not Found" }
        }



    } catch (error) {
        logger.error("Error Occurred evaluateUserPrereq Function " + error)
        return { code: 400, message: "Error Occurred evaluateUserPrereq function" + error }
    }

}

function isPrereqReusable(allowReuseIfDaysOld, completionDateEpoch) {
    try {
        const addedTimeinSec = allowReuseIfDaysOld * 24 * 60 * 60 * 1000
        const finalDateEpoch = completionDateEpoch + addedTimeinSec
        const currentTimeinEpoch = Date.now()
        if (currentTimeinEpoch > finalDateEpoch) {
            return false
        }
        else {
            return true
        }


    } catch (error) {
        logger.error("Error Occurred isPrereqReusable function " + error)
        throw { code: 400, message: "Error Occurred isPrereqReusable function" + error }

    }
}

function getCompletedPrereq(userId, prereqId, prereqTypeId) {
    try {
        logger.error("Inside getCompletedPrereq ")
        if (prereqId) {
            let reqestBody = {
                "payload": {
                    "userId": userId,
                    "prereqId": prereqId,
                    "prereqTypeId": prereqTypeId,
                },
                "action": 2
            }
            const response = openidm.create("endpoint/UserPrerequisiteAPI", null, reqestBody);
            if (response.resultCount > 0) {
                logger.error("getCompletedPrereq -- response  is" + response)
                return response
            }
            else {
                return null
            }
        }
    } catch (error) {
        logger.error("Error Occurred while getCompletedPrereq " + error)
        return { code: 400, message: "Error Occurred while getCompletedPrereq" + error }

    }

}



function createUserPrerequisite(action, userPrereqPayload) {
    try {
        logger.error("Inside createUserPrerequisite function")
        let requestBody = {
            "payload": {
                "userPrereqPayload": userPrereqPayload
            },
            "action": action
        }
        const response = openidm.create("endpoint/UserPrerequisiteAPI", null, requestBody);
        if (response) {
            logger.error("Inside createUserPrerequisite response --> " + response)
            return response
        }
        else {
            return null
        }

    } catch (error) {
        logger.error("error createUserPrerequisite function --> " + error)
        throw { code: 400, message: "Error createUserPrerequisite function" + error }
    }

}

function getPrerequisiteType(prereqId, action) {
    try {
        logger.error("Inside getPrerequisiteType ")
        if (prereqId) {
            let reqestBody = {
                "payload": {
                    "prereqId": prereqId
                },
                "action": 2
            }
            const response = openidm.create("endpoint/LIB-PrerequisiteAPI", null, reqestBody);
            if (response) {
                logger.error("getPrerequisiteType -- response  is" + response)
                return response
            }
            else {
                return null
            }
        }
    } catch (error) {
        logger.error("Error Occurred while getPrerequisiteType " + error)
        throw { code: 400, message: "Error Occurred while getPrerequisiteType" + error }

    }

}


function createStaticEnrollmentRequest(roleId, requestedUserDetails, requestedUser) {
    try {
        // let roleResponse = null
        // enrollmentContextId, requestedUserDetails, requestedUser
        let currentTimeinEpoch = Date.now()
        let currentDate = new Date().toISOString()
        logger.error("roleId is --> " + roleId + "requestedUserDetails is --> " + JSON.stringify(requestedUserDetails) + "requestedUser" + requestedUser)
        logger.error("Inside createStaticEnrollmentRequest function")
        let roleMembers = []
        let activeEnrollmentsWithoutPreReq = {}
        let activeEnrollmentsWithPreReq = []
        let defaultPrereqExpiryInDays = identityServer.getProperty("esv.enrollment.prereq.defaultexpiry")   //30 // need to create ESV for this
        let expiryDateEpoch = currentTimeinEpoch + defaultPrereqExpiryInDays * 24 * 60 * 60 * 1000
        let expiryDate = new Date(expiryDateEpoch).toISOString();
        // let businessAppResponse = null
        let requesterUser = requestedUser
        let outcome = {
            "activeEnrollmentsWithoutPreReq": activeEnrollmentsWithoutPreReq,
            "activeEnrollmentsWithPreReq": activeEnrollmentsWithPreReq
        }
        let enrollmentReqTemplate = {
            createDate: currentDate,
            createDateEpoch: currentTimeinEpoch,
            expiryDate: expiryDate, // if expiry not present in enrollment context how to get the expiry date
            expiryDateEpoch: expiryDateEpoch,
            status: "IN_PROGRESS",
            requestedUserId: requestedUser,
            requesterId: requestedUser,
            recordState: "ACTIVE",
            enrollmentContextId: null,
            updateDate: currentDate,
            updateDateEpoch: currentTimeinEpoch,
            createdBy: "KYID-System",
            updatedBy: "KYID-System",
            appSystemName: [],
            roleIds: [],
            roleContext: []

        }
        let businessKeysTemplate = {
            businessKeyName: null,
            businessKeyValue: null
        };

        let prereqRecord = {
            id: null,
            helpdeskContactId: null,
            appLogo: null,
            roleDisplayName: null,
            appDisplayName: null,
            appId: null
        }


        logger.error("Inside createStaticEnrollmentRequest")
        // logger.error("Inside checkRoleAndApplication applicationRoles are --> " + applicationRoles)
        let roleResponse = null
        let enrollmentReqId = null
        let userRoles = []
        let mutuallyExclusiveRole = []
        let businessAppResponse = null
        let policyResponse = null
        let withPrereqCount = 0
        let withoutPrereqCount = 0
        let withoutRoleCount = 0
        let roleAppId = null
        let approleNotMatching = false
        let businessAppId = null
        let businessAppList = []

        if (roleId !== null && roleId) {
            // for (let i = 0; i < applicationRoles.length; i++) {
            logger.error("Inside checkRoleAndApplication applicationRoles for loop --> ")
            logger.error("Role Id is --" + requestedUserDetails)
            // logger.error("application Id is --" + applicationRoles[i].applicationId)
            // roleAppId = applicationRoles[i].applicationId
            if (roleId) {
                logger.error("Role ID --> " + roleId)
                // logger.error("App ID -- " + applicationRoles[i].applicationId)
                if (getRoleDetails("4", roleId, requestedUser, null)) {
                    roleResponse = getRoleDetails("4", roleId, requestedUser, null)
                    logger.error("roleResponse is --> " + roleResponse)


                    if (roleResponse.result[0].members.length > 0) {
                        for (let k = 0; k < roleResponse.result[0].members.length > 0; k++) {
                            roleMembers.push(roleResponse.result[0].members[k]._id)

                        }
                        if (roleMembers.includes(requestedUser)) {
                            logger.error("Role is already assigned")
                            return { code: 400, message: "Role is already provisioned" }

                        }




                    }
                    logger.error("Inside checkRoleAndApplication roleResponse are --> " + roleResponse)
                    businessAppResponse = getBusinessAppDetails(0, roleResponse.result[0].businessAppId._refResourceId)
                    logger.error("BusinessApp Response is --> " + businessAppResponse)
                    logger.error("businessAppResponse.result.length is --> " + businessAppResponse.result.length)

                    logger.error("Inside checkRoleAndApplication businessAppResponse are --> " + businessAppResponse)
                    if (!(roleResponse.result[0].accessPolicy._refResourceId !== null && roleResponse.result[0].accessPolicy._refResourceId)) {
                        return {
                            code: 400,
                            message: "policy not present"
                        }
                    }
                    else {
                        if (getPolicyDetails(roleResponse.result[0].accessPolicy._refResourceId, 0)) {


                            policyResponse = getPolicyDetails(roleResponse.result[0].accessPolicy._refResourceId, 0)
                            logger.error("Policy Response is --> " + policyResponse)
                            if (policyResponse) {

                                if (policyResponse.result[0].mutuallyExclusiveRole !== null && policyResponse.result[0].mutuallyExclusiveRole.length > 0) {
                                    for (let j = 0; j < policyResponse.result[0].mutuallyExclusiveRole.length; j++) {
                                        mutuallyExclusiveRole.push(policyResponse.result[0].mutuallyExclusiveRole[j]._id)
                                        mutuallyExclusiveRole.push(roleId)
                                    }

                                    userRoles = getUsersRoles(requestedUserDetails);
                                    logger.error("custom endpoint logs: userRoles are --> " + userRoles)
                                    if (userRoles !== null && userRoles.length > 0) {
                                        let commonRoles = userRoles.filter(element => mutuallyExclusiveRole.includes(element))
                                        logger.error("Common Roles are " + commonRoles)
                                        if (mutuallyExclusiveRole.includes(roleId) && commonRoles.length > 0) { // evaluating mutually exclusive condtion
                                            return { code: 400, message: 'Mutually Exclusive Role Present' }
                                        }

                                    }
                                }
                                enrollmentReqTemplate.appSystemName.push(businessAppResponse.result[0].content[0].title)
                                enrollmentReqTemplate.roleIds.push({ "_ref": "managed/alpha_role/" + roleId, "_refProperties": {} })

                                if (businessAppResponse !== null && businessAppResponse) {
                                    prereqRecord.appId = businessAppResponse.result[0]._id
                                    if (businessAppResponse.result[0].logoURL) {
                                        prereqRecord.appLogo = businessAppResponse.result[0].logoURL
                                    }

                                    if (businessAppResponse.result[0].content[0].title) {
                                        prereqRecord.appDisplayName = businessAppResponse.result[0].content[0].title
                                    }
                                    if (businessAppResponse.result[0].applicationHelpdeskContact) {
                                        prereqRecord.helpdeskContactId = businessAppResponse.result[0].applicationHelpdeskContact._refResourceId
                                    }
                                    if (roleResponse.result[0].content !== null && roleResponse.result[0].content.length > 0 && roleResponse.result[0].content[0].name) {
                                        prereqRecord.roleDisplayName = roleResponse.result[0].content[0].name
                                    }
                                    logger.error("prereqRecord JOSN is ==> " + JSON.stringify(prereqRecord))
                                    logger.error("enrollmentReqTemplate JOSN is ==> " + JSON.stringify(enrollmentReqTemplate));


                                }

                                if (policyResponse.result[0].preRequisites !== null && policyResponse.result[0].preRequisites.length > 0 && isPrereqRequired(policyResponse.result[0].preRequisites,roleResponse.result[0].requiredMFAMethod) === true) {

                                    enrollmentReqId = createEnrollmentRequest(enrollmentReqTemplate)
                                    if (enrollmentReqId) {
                                        prereqRecord.id = enrollmentReqId._id
                                        // if (roleResponse.result[0].content !== null && roleResponse.result[0].content.length > 0 && roleResponse.result[0].content[0].name) {
                                        //     prereqRecord.roleDisplayName = roleResponse.result[0].content[0].name
                                        // }

                                        logger.error("prereqRecord JOSN is ==> " + JSON.stringify(prereqRecord));
                                        activeEnrollmentsWithPreReq.push(prereqRecord);
                                        createUserPrereqRespons = evaluateUserPrereq(requestedUserDetails, enrollmentReqId._id, requestedUser, requesterUser, roleResponse.result[0]._id, policyResponse.result[0].preRequisites, roleResponse.result[0].requiredMFAMethod)
                                        logger.error("createUserPrereqRespons ---> " + JSON.stringify(createUserPrereqRespons))

                                    }
                                    else {
                                        return { code: 400, message: "Error occurred while creating enrollment request" }
                                    }
                                }
                                else {
                                    // Without Prereq
                                    enrollmentReqId = createEnrollmentRequest(enrollmentReqTemplate)
                                    if (enrollmentReqId) {
                                        // prereqRecord.id = enrollmentReqId._id
                                        activeEnrollmentsWithoutPreReq["associatedAppInfo"] = prereqRecord
                                        activeEnrollmentsWithoutPreReq["id"] = enrollmentReqId._id

                                    }
                                    else {
                                        return { code: 400, message: "Error occurred while creating enrollment request" }
                                    }
                                    // withoutPrereqCount++
                                }

                            }

                        }
                        else {
                            return { code: 400, message: "Invalid Policy Configuration" }
                        }

                    }

                }
                else {
                    return { code: 400, message: "Business App or Role is not valid in Context" }
                }


            }
            else if (applicationRoles[i].applicationId !== null && applicationRoles[i].applicationId && applicationRoles[i].roleId === null && !applicationRoles[i].roleId) {
                if (getBusinessAppDetails(0, applicationRoles[i].applicationId)) {
                    withoutRoleCount++
                }
            }
            else {
                logger.error("APP ID isn not Present")
                return { code: 1, message: "App ID not present" }
            }
            // return {code:1, message: "Conflict : withPrereqCount  "+ withPrereqCount +"withoutPrereqCount "+ withoutPrereqCount+"App without Role "+ withoutRoleCount}



        }
        return outcome


    } catch (error) {
        logger.error("Error Occurred createStaticEnrollmentRequest Function -->" + error)
        return { code: 400, message: "Execption occurred " + error.message }

    }
}

function getUniqueRoleContexts(roleContextArray) {
    const compareKeys = [
        "applicationId",
        "roleId",
        // "originalDelegatorUserAccountId",
        // "currentDelegatorUserAccountId",
        "orgId",
        "orgType",
        "orgName",
        "orgSourceUniqueId",
        "businessKeyTypeName",
        "businessKeyId",
        "businessKeyName",
        "businessKeyDescription",
        "kogOrgBusinessKeyId",
        // "isForwardDelegable",
        // "delegationEndDate",
        // "delegationEndDateEpoch"
    ];

    const seen = new Set();
    return roleContextArray.filter(item => {
        // Create a unique string based on the selected keys
        const key = compareKeys.map(k => JSON.stringify(item[k])).join('|');
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}




/**
 * Function to process and handle enrollment requests.
 * This function evaluates user roles, checks for mutually exclusive roles, 
 * verifies prerequisites, and creates enrollment requests accordingly.
 * 
 * @param {string} enrollmentContextId - The enrollment context ID.
 * @param {object} requesterUserDetails - The details of the requester user.
 * @param {object} enrollmentContextResponse - The response containing enrollment context details.
 * @param {object} requestedUserDetails - The details of the user being requested for enrollment.
 * @param {string} requestedUser - The ID of the requested user.
 * @returns {object} outcome - Contains both active enrollments with and without prerequisites.
 */
function enrollmentReqLogic(enrollmentContextId, requesterUser, requesterUserDetails, enrollmentContextResponse, requestedUserDetails, requestedUser) {
    try {
        logger.error("requesterUserDetails --> " + requesterUserDetails)
        logger.error("enrollmentContextResponse --> " + enrollmentContextResponse)
        logger.error("requestedUserDetails --> " + requestedUserDetails)
        logger.error("requestedUser --> " + requestedUser)

        logger.error("Inside enrollmentReqLogic finction ")
        let currentTimeinEpoch = Date.now()
        let currentDate = new Date().toISOString()
        let appRolesContextwithoutPrereq = []
        let isOrgLevelRoleProvisionedResponse = false
        let enrollmentReqId = null;
        let defaultPrereqExpiryInDays = identityServer.getProperty("esv.enrollment.prereq.defaultexpiry")//30; // need to create ESV for this
        let createUserPrereqRespons = null;
        let activeEnrollmentsWithoutPreReq = {}
        let activeEnrollmentsWithPreReq = [];
        let expiryDateEpoch = currentTimeinEpoch + defaultPrereqExpiryInDays * 24 * 60 * 60 * 1000
        let expiryDate = new Date(expiryDateEpoch).toISOString();
        let prereqRecord = {
            id: null,
            helpdeskContactId: null,
            appLogo: null,
            roleDisplayName: null,
            appDisplayName: null,
            appId: null
        };
        let businessKeysTemplate = {
            businessKeyName: null,
            businessKeyValue: null
        };
        let roleContextTemplate = {
            roleId:null,
            applicationId:null,
            orgSourceUniqueId:null,
            businessKeyTypeName:null,
            businessKeyId:null,
            businessKeyName:null,
            businessKeyDescription:null,
            kogOrgBusinessKeyId:null,
            appName: null,
            businessKeys: [],
            currentDelegatorId: null,
            orgId: null,
            orgName: null,
            orgType: null,
            orginalDelegatorId: null,
            roleName: null,
            isForwardDelegable:false,
            delegationEndDate:null,
            delegationEndDateEpoch:null
        }

        let outcome = {
            "activeEnrollmentsWithoutPreReq": activeEnrollmentsWithoutPreReq,
            "activeEnrollmentsWithPreReq": activeEnrollmentsWithPreReq
        }
        let enrollmentRequestId = null;
        let applicationRoles = enrollmentContextResponse.applicationRoles
        logger.error("applicationRoles are -->" + applicationRoles)
        let businessAppResponse = null;
        let mutuallyExclusiveRole = [];
        let roleResponse = null;
        let roleIdsWithoutPreReq = []
        let enrollmentReqTemplate = {
            createDate: currentDate,
            createDateEpoch: currentTimeinEpoch,
            expiryDate: expiryDate, // if expiry not present in enrollment context how to get the expiry date
            expiryDateEpoch: expiryDateEpoch,
            status: "IN_PROGRESS",
            requestedUserId: null,
            requesterId: null,
            recordState: "ACTIVE",
            enrollmentContextId: enrollmentContextId,
            updateDate: currentDate,
            updateDateEpoch: currentTimeinEpoch,
            createdBy: "KYID-System",
            updatedBy: "KYID-System",
            appSystemName: [],
            roleIds: [],
            roleContext: []

        }
        // var isRoleAppValid= true
        var isRoleAppValid = checkRoleAndApplication(requestedUserDetails, applicationRoles, requestedUser);
        if (isRoleAppValid) {
            logger.error("isRoleAppValid" + JSON.stringify(isRoleAppValid))
            if (isRoleAppValid.code === 3) {
                // if (isRoleAppValid) {
                

                logger.error("applicationRoles.length is --> " + applicationRoles.length)
                for (let i = 0; i < applicationRoles.length; i++) {
                    enrollmentReqTemplate = {
                        createDate: currentDate,
                        createDateEpoch: currentTimeinEpoch,
                        expiryDate: expiryDate, // if expiry not present in enrollment context how to get the expiry date
                        expiryDateEpoch: expiryDateEpoch,
                        status: "IN_PROGRESS",
                        requestedUserId: null,
                        requesterId: null,
                        recordState: "ACTIVE",
                        enrollmentContextId: enrollmentContextId,
                        updateDate: currentDate,
                        updateDateEpoch: currentTimeinEpoch,
                        createdBy: "KYID-System",
                        updatedBy: "KYID-System",
                        appSystemName: [],
                        roleIds: [],
                        roleContext: []

                    }
                    prereqRecord = {
                        id: null,
                        helpdeskContactId: null,
                        appLogo: null,
                        roleDisplayName: null,
                        appDisplayName: null,
                        appId: null
                    }
                 applicationRoles = getUniqueRoleContexts(applicationRoles)

                    if ((applicationRoles[i].roleId && applicationRoles[i].roleId !== null) && (applicationRoles[i].applicationId && applicationRoles[i].applicationId !== null)) {
                        logger.error("Role id --> " + applicationRoles[i].roleId)
                        logger.error("AppId Id --> " + applicationRoles[i].applicationId)
                        roleResponse = getRoleDetails("4", applicationRoles[i].roleId, requestedUser, null);
                        logger.error("Custom Endpoint Logs Role Response is --> " + roleResponse)
                        let roleMembers = []
                        let isRoleAssigned = false
                        if (roleResponse.result[0].members.length > 0) {
                            for (let k = 0; k < roleResponse.result[0].members.length > 0; k++) {
                                roleMembers.push(roleResponse.result[0].members[k]._id)

                            }
                            if (roleMembers.includes(requestedUser)) {
                                logger.error("Role is already assigned")
                                isRoleAssigned = true

                            }
                            let isRoleProvisionedRequestBody = {
                                payload: {
                                    userId: requestedUser,
                                    roleId: applicationRoles[i].roleId,
                                    appId: applicationRoles[i].applicationId,
                                    currentDelegatorId: null,
                                    originalDelegatorId: null,
                                    orgType: null,
                                    orgId: null,
                                    businessKeyName: null
                                },
                                action: 4
                            }
                            if (applicationRoles[i].currentDelegatorUserAccountId) {
                                isRoleProvisionedRequestBody.payload.currentDelegatorId = applicationRoles[i].currentDelegatorUserAccountId
                            }
                            if (applicationRoles[i].originalDelegatorUserAccountId) {
                                isRoleProvisionedRequestBody.payload.originalDelegatorId = applicationRoles[i].originalDelegatorUserAccountId
                            }
                            if (applicationRoles[i].orgType) {
                                isRoleProvisionedRequestBody.payload.orgType = applicationRoles[i].orgType
                            }
                            if (applicationRoles[i].orgId) {
                                isRoleProvisionedRequestBody.payload.orgId = applicationRoles[i].orgId
                            }
                            if (applicationRoles[i].businessKeyId) {
                                isRoleProvisionedRequestBody.payload.businessKeyName = applicationRoles[i].businessKeyId
                            }
                            // isRoleProvisionedRequestBody[""]
                            logger.error("isRoleProvisionedRequestBody ---> " + JSON.stringify(isRoleProvisionedRequestBody))
                            if (isOrgLevelRoleProvisioned(isRoleProvisionedRequestBody)) {
                                isOrgLevelRoleProvisionedResponse = isOrgLevelRoleProvisioned(isRoleProvisionedRequestBody)
                            }



                        }
                        if (isRoleAssigned === false && isOrgLevelRoleProvisionedResponse === false) {

                            logger.error("custom endpoint logs: roleResponse.result[0].accessPolicy._refResourceId --> " + roleResponse.result[0].accessPolicy._refResourceId)
                            if (roleResponse.result[0].accessPolicy._refResourceId !== null && roleResponse.result[0].accessPolicy._refResourceId) {

                                policyResponse = getPolicyDetails(roleResponse.result[0].accessPolicy._refResourceId, 0)
                                logger.error("custom Endpoint policyResponse is -->  " + policyResponse);
                                if (policyResponse && policyResponse.isPolicyPresent !== false) {

                                    logger.error("custom endpoint logs: policyResponse.result[0].preRequisites  --> " + policyResponse.result[0].preRequisites)
                                  

                                    if (policyResponse.result[0].preRequisites !== null && policyResponse.result[0].preRequisites.length > 0 && isPrereqRequired(policyResponse.result[0].preRequisites,roleResponse.result[0].requiredMFAMethod) === true ) {
                                        // getting required attributes to create enrollment request ID
                                        enrollmentContextResponse.requesterId = [];
                                        businessAppResponse = getBusinessAppDetails(0, roleResponse.result[0].businessAppId._refResourceId)
                                        logger.error("custom endpoint logs: businessAppResponse -->  " + businessAppResponse)




                                        if (enrollmentContextResponse.requesterUserAccountId) {
                                            enrollmentReqTemplate.requesterId = enrollmentContextResponse.requesterUserAccountId
                                        }
                                        else {
                                            enrollmentReqTemplate.requesterId = requestedUser
                                        }
                                        if (enrollmentContextResponse.requestedUserAccountId) {
                                            enrollmentReqTemplate.requestedUserId = enrollmentContextResponse.requestedUserAccountId
                                        }
                                        else {
                                            enrollmentReqTemplate.requestedUserId = requestedUser
                                        }
                                        if (enrollmentContextResponse.requesterUserAccountId) {
                                            enrollmentReqTemplate.createdBy = enrollmentContextResponse.requesterUserAccountId  // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                                        }
                                        else {
                                            enrollmentReqTemplate.createdBy = requestedUser
                                        }
                                        if (enrollmentContextResponse.requesterUserAccountId) {
                                            enrollmentReqTemplate.updatedBy = enrollmentContextResponse.requesterUserAccountId  // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                                        }
                                        else {
                                            enrollmentReqTemplate.updatedBy = requestedUser
                                        }

                                        enrollmentReqTemplate.appSystemName.push(enrollmentContextResponse.applicationRoles[i].applicationName) // need to verify with amit regarding this is it required or not
                                        enrollmentReqTemplate.roleIds = [];
                                        enrollmentReqTemplate.roleIds.push({ "_ref": "managed/alpha_role/" + applicationRoles[i].roleId, "_refProperties": {} })
                                        // roleIds:[{"_ref":"managed/alpha_role/00246279-7bc5-4dee-a534-6951c8a36128","_refProperties":{}}]
                                        logger.error("custom endpoint logs: enrollmentReqTemplate JSON is " + JSON.stringify(enrollmentReqTemplate));
                                        // enrollmentReqTemplateArray.push(enrollmentReqTemplate)
                                        if (enrollmentContextResponse.applicationRoles[i].businessKeyId) {
                                            businessKeysTemplate.businessKeyName = enrollmentContextResponse.applicationRoles[i].businessKeyId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].businessKeyName) {
                                            businessKeysTemplate.businessKeyValue = enrollmentContextResponse.applicationRoles[i].businessKeyName
                                        }
                                        roleContextTemplate.businessKeys.push(businessKeysTemplate)
                                        if (enrollmentContextResponse.applicationRoles[i].currentDelegatorUserAccountId) {
                                            roleContextTemplate.currentDelegatorId = enrollmentContextResponse.applicationRoles[i].currentDelegatorUserAccountId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].originalDelegatorUserAccountId) {
                                            roleContextTemplate.orginalDelegatorId = enrollmentContextResponse.applicationRoles[i].originalDelegatorUserAccountId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].roleName) {
                                            roleContextTemplate.roleName = enrollmentContextResponse.applicationRoles[i].roleName
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].applicationName) {
                                            roleContextTemplate.appName = enrollmentContextResponse.applicationRoles[i].applicationName
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].orgId) {
                                            roleContextTemplate.orgId = enrollmentContextResponse.applicationRoles[i].orgId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].orgType) {
                                            roleContextTemplate.orgType = enrollmentContextResponse.applicationRoles[i].orgType
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].orgName) {
                                            roleContextTemplate.orgName = enrollmentContextResponse.applicationRoles[i].orgName
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].applicationId) {
                                            roleContextTemplate.applicationId = enrollmentContextResponse.applicationRoles[i].applicationId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].roleId) {
                                            roleContextTemplate.roleId = enrollmentContextResponse.applicationRoles[i].roleId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].orgSourceUniqueId) {
                                            roleContextTemplate.orgSourceUniqueId = enrollmentContextResponse.applicationRoles[i].orgSourceUniqueId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].businessKeyTypeName) {
                                            roleContextTemplate.businessKeyTypeName = enrollmentContextResponse.applicationRoles[i].businessKeyTypeName
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].businessKeyId) {
                                            roleContextTemplate.businessKeyId = enrollmentContextResponse.applicationRoles[i].businessKeyId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].businessKeyName) {
                                            roleContextTemplate.businessKeyName = enrollmentContextResponse.applicationRoles[i].businessKeyName
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].businessKeyDescription) {
                                            roleContextTemplate.businessKeyDescription = enrollmentContextResponse.applicationRoles[i].businessKeyDescription
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].kogOrgBusinessKeyId) {
                                            roleContextTemplate.kogOrgBusinessKeyId = enrollmentContextResponse.applicationRoles[i].kogOrgBusinessKeyId
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].isForwardDelegable) {
                                            roleContextTemplate.isForwardDelegable = enrollmentContextResponse.applicationRoles[i].isForwardDelegable
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].delegationEndDateEpoch) {
                                            roleContextTemplate.delegationEndDateEpoch = enrollmentContextResponse.applicationRoles[i].delegationEndDateEpoch
                                        }
                                        if (enrollmentContextResponse.applicationRoles[i].delegationEndDate) {
                                            roleContextTemplate.delegationEndDate = enrollmentContextResponse.applicationRoles[i].delegationEndDate
                                        }
                                        enrollmentReqTemplate.roleContext.push(roleContextTemplate)
                                        logger.error("roleContextTemplate is --> " + JSON.stringify(roleContextTemplate))
                                        logger.error("enrollmentReqTemplate is --> " + JSON.stringify(enrollmentReqTemplate))

                                        enrollmentReqId = createEnrollmentRequest(enrollmentReqTemplate)
                                        logger.error("custom endpoint logs: enrollmentReqId " + enrollmentReqId);


                                        if (enrollmentReqId !== null && enrollmentReqId) {
                                            prereqRecord.id = enrollmentReqId._id
                                            if (roleResponse.result[0].content !== null && roleResponse.result[0].content.length > 0 && roleResponse.result[0].content[0].name) {
                                                prereqRecord.roleDisplayName = roleResponse.result[0].content[0].name
                                            }
                                            if (businessAppResponse !== null && businessAppResponse) {
                                                prereqRecord.appId = businessAppResponse.result[0]._id
                                                if (businessAppResponse.result[0].logoURL) {
                                                    prereqRecord.appLogo = businessAppResponse.result[0].logoURL
                                                }

                                                if (businessAppResponse.result[0].content[0].title) {
                                                    prereqRecord.appDisplayName = businessAppResponse.result[0].content[0].title
                                                }
                                                if (businessAppResponse.result[0].applicationHelpdeskContact) {
                                                    prereqRecord.helpdeskContactId = businessAppResponse.result[0].applicationHelpdeskContact._refResourceId
                                                }

                                            }
                                            logger.error("prereqRecord JOSN is ==> " + JSON.stringify(prereqRecord));
                                            activeEnrollmentsWithPreReq.push(prereqRecord);
                                            createUserPrereqRespons = evaluateUserPrereq(requestedUserDetails, enrollmentReqId._id, requestedUser, requesterUser, roleResponse.result[0]._id, policyResponse.result[0].preRequisites, roleResponse.result[0].requiredMFAMethod,enrollmentContextResponse.applicationRoles[i])
                                            logger.error("createUserPrereqRespons ---> " + JSON.stringify(createUserPrereqRespons))
                                            // if(enrollmentReqId){
                                            //   var eventDetails = {
                                            //     enrollmentRequestId:enrollmentReqId._id,
                                            //     roleId:roleResponse.result[0]._id
                                            //   }
                                            //   auditLogger("PRE009","Enrollment Request Created", eventDetails, requesterUser, requestedUser, context.http.headers['x-forgerock-transactionid'] || "")

                                            //   // if(createUserPrereqRespons){
                                            //   // var eventDetails = {
                                            //   //   enrollmentRequestId:enrollmentReqId,
                                            //   //   roleId:roleResponse.result[0]._id
                                            //   // }
                                            //   // auditLogger("PRE010","Enrollment Request Created", eventDetails, requesterUser, requestedUser, context.http.headers['x-forgerock-transactionid'] || "")
                                                
                                            //   // }
                                            // }
                                          

                                        }

                                    }
                                    else {
                                        appRolesContextwithoutPrereq.push(applicationRoles[i])
                                        logger.error("roleIdsWithoutPreReq are --> " + applicationRoles[i].roleId);
                                        roleIdsWithoutPreReq.push(applicationRoles[i].roleId)
                                        enrollmentReqTemplate.appSystemName.push(enrollmentContextResponse.applicationRoles[i].applicationName)
                                        logger.error("roleIdsWithoutPreReq array values are --> " + roleIdsWithoutPreReq);
                                    }




                                }




                            }
                            else {
                                logger.error("Policy not found for role")
                                return { code: 400, message: 'Policy not found for role' };
                            }

                        }
                        else if (isOrgLevelRoleProvisionedResponse.message && isOrgLevelRoleProvisionedResponse.code) {
                            logger.error("Error Occurred while check is Role Provision " + isOrgLevelRoleProvisionedResponse.code + isOrgLevelRoleProvisionedResponse.message)
                            return { code: isOrgLevelRoleProvisionedResponse.code, message: "isOrgLevelRoleProvisionedResponse Error: " + isOrgLevelRoleProvisionedResponse.message }
                        }



                    }
                    else {
                        logger.error("Invalid configuration in context")
                        return { "code": 400, "message": "Invalid configuration in context" };
                    }


                }

                         enrollmentReqTemplate = {
                            createDate: currentDate,
                            createDateEpoch: currentTimeinEpoch,
                            expiryDate: expiryDate, // if expiry not present in enrollment context how to get the expiry date
                            expiryDateEpoch: expiryDateEpoch,
                            status: "IN_PROGRESS",
                            requestedUserId: null,
                            requesterId: null,
                            recordState: "ACTIVE",
                            enrollmentContextId: enrollmentContextId,
                            updateDate: currentDate,
                            updateDateEpoch: currentTimeinEpoch,
                            createdBy: "KYID-System",
                            updatedBy: "KYID-System",
                            appSystemName: [],
                            roleIds: [],
                            roleContext: []

                        }
                        if (enrollmentContextResponse.requesterUserAccountId) {
                            enrollmentReqTemplate.requesterId = enrollmentContextResponse.requesterUserAccountId
                        }
                        else {
                            enrollmentReqTemplate.requesterId = requestedUser
                        }
                        if (enrollmentContextResponse.requestedUserAccountId) {
                            enrollmentReqTemplate.requestedUserId = enrollmentContextResponse.requestedUserAccountId
                        }
                        else {
                            enrollmentReqTemplate.requestedUserId = requestedUser
                        }
                        if (enrollmentContextResponse.requesterUserAccountId) {
                            enrollmentReqTemplate.createdBy = enrollmentContextResponse.requesterUserAccountId  // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                        }
                        else {
                            enrollmentReqTemplate.createdBy = requestedUser
                        }
                        if (enrollmentContextResponse.requesterUserAccountId) {
                            enrollmentReqTemplate.updatedBy = enrollmentContextResponse.requesterUserAccountId  // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                        }
                        else {
                            enrollmentReqTemplate.updatedBy = requestedUser
                        }


                if (appRolesContextwithoutPrereq.length > 0) {
                    logger.error("Inside with appRolesContextwithoutPrereq --> " + appRolesContextwithoutPrereq.length)
                    for (let l = 0; l < appRolesContextwithoutPrereq.length; l++) {
                        logger.error("Inside with")
                      



                        // enrollmentReqTemplate = {
                        //     createDate: currentDate,
                        //     createDateEpoch: currentTimeinEpoch,
                        //     expiryDate: expiryDate, // if expiry not present in enrollment context how to get the expiry date
                        //     expiryDateEpoch: expiryDateEpoch,
                        //     status: "IN_PROGRESS",
                        //     requestedUserId: null,
                        //     requesterId: null,
                        //     recordState: "ACTIVE",
                        //     enrollmentContextId: enrollmentContextId,
                        //     updateDate: currentDate,
                        //     updateDateEpoch: currentTimeinEpoch,
                        //     createdBy: "KYID-System",
                        //     updatedBy: "KYID-System",
                        //     appSystemName: [],
                        //     roleIds: [],
                        //     roleContext: []

                        // }
                      

                        let businessKeysTemplate = {
                            businessKeyName: null,
                            businessKeyValue: null
                        };
                        let roleContextTemplate = {
                                roleId:null,
                                applicationId:null,
                                orgSourceUniqueId:null,
                                businessKeyTypeName:null,
                                businessKeyId:null,
                                businessKeyName:null,
                                businessKeyDescription:null,
                                kogOrgBusinessKeyId:null,
                                appName: null,
                                businessKeys: [],
                                currentDelegatorId: null,
                                orgId: null,
                                orgName: null,
                                orgType: null,
                                orginalDelegatorId: null,
                                roleName: null,
                                isForwardDelegable:false,
                                delegationEndDate:null,
                                delegationEndDateEpoch:null
                        }
                        logger.error("appRolesContextwithoutPrereq[i] is --> " + JSON.stringify(appRolesContextwithoutPrereq[l]))
                        enrollmentReqTemplate.roleIds.push({ "_ref": "managed/alpha_role/" + appRolesContextwithoutPrereq[l].roleId, "_refProperties": {} })
                        if (appRolesContextwithoutPrereq[l].businessKeyId) {
                            businessKeysTemplate.businessKeyName = appRolesContextwithoutPrereq[l].businessKeyId
                        }
                        if (appRolesContextwithoutPrereq[l].businessKeyName) {
                            businessKeysTemplate.businessKeyValue = appRolesContextwithoutPrereq[l].businessKeyName
                        }
                        roleContextTemplate.businessKeys.push(businessKeysTemplate)


                        if (appRolesContextwithoutPrereq[l].currentDelegatorUserAccountId) {
                            roleContextTemplate.currentDelegatorId = appRolesContextwithoutPrereq[l].currentDelegatorUserAccountId
                        }
                        if (appRolesContextwithoutPrereq[l].originalDelegatorUserAccountId) {
                            roleContextTemplate.orginalDelegatorId = appRolesContextwithoutPrereq[l].originalDelegatorUserAccountId
                        }
                        if (appRolesContextwithoutPrereq[l].roleName) {
                            roleContextTemplate.roleName = appRolesContextwithoutPrereq[l].roleName
                        }
                        if (appRolesContextwithoutPrereq[l].applicationName) {
                            roleContextTemplate.appName = appRolesContextwithoutPrereq[l].applicationName
                        }
                        if (appRolesContextwithoutPrereq[l].orgId) {
                            roleContextTemplate.orgId = appRolesContextwithoutPrereq[l].orgId
                        }
                        if (appRolesContextwithoutPrereq[l].orgType) {
                            roleContextTemplate.orgType = appRolesContextwithoutPrereq[l].orgType
                        }
                        if (appRolesContextwithoutPrereq[l].orgName) {
                            roleContextTemplate.orgName = appRolesContextwithoutPrereq[l].orgName
                        }
                        if (appRolesContextwithoutPrereq[l].roleId) {
                            roleContextTemplate.roleId = appRolesContextwithoutPrereq[l].roleId
                        }
                        if (appRolesContextwithoutPrereq[l].applicationId) {
                            roleContextTemplate.applicationId = appRolesContextwithoutPrereq[l].applicationId
                        }
                        if (appRolesContextwithoutPrereq[l].orgSourceUniqueId) {
                            roleContextTemplate.orgSourceUniqueId = appRolesContextwithoutPrereq[l].orgSourceUniqueId
                        }
                        if (appRolesContextwithoutPrereq[l].businessKeyTypeName) {
                            roleContextTemplate.businessKeyTypeName = appRolesContextwithoutPrereq[l].businessKeyTypeName
                        }
                        if (appRolesContextwithoutPrereq[l].businessKeyId) {
                            roleContextTemplate.businessKeyId = appRolesContextwithoutPrereq[l].businessKeyId
                        }
                        if (appRolesContextwithoutPrereq[l].businessKeyName) {
                            roleContextTemplate.businessKeyName = appRolesContextwithoutPrereq[l].businessKeyName
                        }
                        if (appRolesContextwithoutPrereq[l].businessKeyDescription) {
                            roleContextTemplate.businessKeyDescription = appRolesContextwithoutPrereq[l].businessKeyDescription
                        }
                        if (appRolesContextwithoutPrereq[l].kogOrgBusinessKeyId) {
                            roleContextTemplate.kogOrgBusinessKeyId = appRolesContextwithoutPrereq[l].kogOrgBusinessKeyId
                        }
                        if (appRolesContextwithoutPrereq[l].isForwardDelegable) {
                            roleContextTemplate.isForwardDelegable = appRolesContextwithoutPrereq[l].isForwardDelegable
                        }
                        if (appRolesContextwithoutPrereq[l].delegationEndDateEpoch) {
                            roleContextTemplate.delegationEndDateEpoch = appRolesContextwithoutPrereq[l].delegationEndDateEpoch
                        }
                        if (appRolesContextwithoutPrereq[l].delegationEndDate) {
                            roleContextTemplate.delegationEndDate = appRolesContextwithoutPrereq[l].delegationEndDate
                        }
                        enrollmentReqTemplate.roleContext.push(roleContextTemplate)
                        logger.error("roleContextTemplate is --> " + JSON.stringify(roleContextTemplate))


                        // if (enrollmentContextResponse.requesterUserAccountId) {
                        //     enrollmentReqTemplate.requesterId = enrollmentContextResponse.requesterUserAccountId
                        // }
                        // else {
                        //     enrollmentReqTemplate.requesterId = requestedUser
                        // }
                        // if (enrollmentContextResponse.requestedUserAccountId) {
                        //     enrollmentReqTemplate.requestedUserId = enrollmentContextResponse.requestedUserAccountId
                        // }
                        // else {
                        //     enrollmentReqTemplate.requestedUserId = requestedUser
                        // }
                        // if (enrollmentContextResponse.requesterUserAccountId) {
                        //     enrollmentReqTemplate.createdBy = enrollmentContextResponse.requesterUserAccountId  // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                        // }
                        // else {
                        //     enrollmentReqTemplate.createdBy = requestedUser
                        // }
                        // if (enrollmentContextResponse.requesterUserAccountId) {
                        //     enrollmentReqTemplate.updatedBy = enrollmentContextResponse.requesterUserAccountId  // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                        // }
                        // else {
                        //     enrollmentReqTemplate.updatedBy = requestedUser
                        // }
                    }


                        // enrollmentReqTemplate.appSystemName.push(enrollmentContextResponse.applicationRoles[i].applicationName) // need to verify with amit regarding this is it required or not

                        logger.error("roles without prereq are " + roleIdsWithoutPreReq)
                        // for (let j = 0; j < roleIdsWithoutPreReq.length; j++) {
                        //     enrollmentReqTemplate.roleIds.push({ "_ref": "managed/alpha_role/" + roleIdsWithoutPreReq[j], "_refProperties": {} })

                        // }

                        enrollmentReqId = createEnrollmentRequest(enrollmentReqTemplate)
                        if (enrollmentReqId) {
                            if (roleIdsWithoutPreReq.length === 1) {
                                activeEnrollmentsWithoutPreReq["id"] = enrollmentReqId._id
                                roleResponse = getRoleDetails("4", roleIdsWithoutPreReq[0], requestedUser, null);
                                businessAppResponse = getBusinessAppDetails(0, roleResponse.result[0].businessAppId._refResourceId)
                                let activeEnrollmentsWithoutPreReqAppJSON = {
                                    appId: null,
                                    helpdeskContactId: null,
                                    appLogo: null,
                                    appDisplayName: null
                                }


                                if (businessAppResponse.result[0]._id) {
                                    activeEnrollmentsWithoutPreReqAppJSON.appId = businessAppResponse.result[0]._id
                                }
                                if (businessAppResponse.result[0].applicationHelpdeskContact) {
                                    activeEnrollmentsWithoutPreReqAppJSON.helpdeskContactId = businessAppResponse.result[0].applicationHelpdeskContact._refResourceId
                                }
                                logger.error("Business APP Logo UTL is -->businessAppResponse.result[0].logoURL  " + businessAppResponse.result[0].logoURL)
                                if (businessAppResponse.result[0].logoURL) {
                                    activeEnrollmentsWithoutPreReqAppJSON.appLogo = businessAppResponse.result[0].logoURL
                                }
                                if (businessAppResponse.result[0].content[0].title) {
                                    activeEnrollmentsWithoutPreReqAppJSON.appDisplayName = businessAppResponse.result[0].content[0].title
                                }
                                activeEnrollmentsWithoutPreReq["associatedAppInfo"] = activeEnrollmentsWithoutPreReqAppJSON
                                activeEnrollmentsWithoutPreReq["id"] = enrollmentReqId._id

                            }
                            else {
                                activeEnrollmentsWithoutPreReq["id"] = enrollmentReqId._id
                                activeEnrollmentsWithoutPreReq["platformInfo"] = {
                                    "helpdeskContactId": "72ed3dfc-9e6e-4583-b910-3b8498381201"
                                }
                            }
                          var eventDetails = {
                            enrollmentRequestId:enrollmentReqId._id,
                            roleId:roleIdsWithoutPreReq
                            }
                            // auditLogger("PRE009","Enrollment Request Created", eventDetails, requesterUser, requestedUser, context.http.headers['x-forgerock-transactionid'] || "")


                        }
                    }
                
                return outcome
            }
            else {
                return { code: 400, message: isRoleAppValid.message }
            }
        }
        else {
            return { code: 500, message: 'Unknown error' }
        }


    } catch (error) {
        logger.error("Error Occurred in enrollmentReqLogic Function " + error)
        return { code: 500, message: JSON.stringify(error) }

    }
}


function checkRoleAndApplication(requestedUserDetails, applicationRoles, requestedUser) {
    try {
        logger.error("Inside checkRoleAndApplication")
        logger.error("Inside checkRoleAndApplication applicationRoles are --> " + applicationRoles)
        let roleResponse = null;
        let userRoles = [];
        let mutuallyExclusiveRole = []
        let businessAppResponse = null
        let policyResponse = null
        let withPrereqCount = 0
        let withoutPrereqCount = 0
        let withoutRoleCount = 0
        let roleAppId = null
        let approleNotMatching = false
        let businessAppId = null
        let businessAppList = []

        if (applicationRoles !== null && applicationRoles && applicationRoles.length > 0) {
            for (let i = 0; i < applicationRoles.length; i++) {
                logger.error("Inside checkRoleAndApplication applicationRoles for loop --> " + applicationRoles[i])
                logger.error("Role Id is --" + applicationRoles[i].roleId)
                logger.error("application Id is --" + applicationRoles[i].applicationId)
                roleAppId = applicationRoles[i].applicationId
                if ((applicationRoles[i].roleId !== null && applicationRoles[i].roleId) && (applicationRoles[i].applicationId !== null && applicationRoles[i].applicationId)) {
                    logger.error("Role ID --> " + applicationRoles[i].roleId)
                    logger.error("App ID -- " + applicationRoles[i].applicationId)
                    if (getRoleDetails("4", applicationRoles[i].roleId, requestedUser, null) && getBusinessAppDetails(0, applicationRoles[i].roleId)) {
                        roleResponse = getRoleDetails("4", applicationRoles[i].roleId, requestedUser, null)
                        logger.error("Inside checkRoleAndApplication roleResponse are --> " + roleResponse)
                        businessAppResponse = getBusinessAppDetails(0, roleResponse.result[0].businessAppId._refResourceId)
                        logger.error("BusinessApp Response is --> " + businessAppResponse)
                        logger.error("businessAppResponse.result.length is --> " + businessAppResponse.result.length)

                        if (roleResponse.result[0].businessAppId._refResourceId !== roleAppId) {
                            logger.error("Business App ID and Role Appid is not matching")
                            return { code: 1, message: "Business App ID and Role Appid is not matching" }
                        }

                        logger.error("Inside checkRoleAndApplication businessAppResponse are --> " + businessAppResponse)
                        logger.error("long if condition: " + !(roleResponse.result[0].accessPolicy._refResourceId !== null && roleResponse.result[0].accessPolicy._refResourceId));
                        if (!(roleResponse.result[0].accessPolicy._refResourceId !== null && roleResponse.result[0].accessPolicy._refResourceId)) {
                            return {
                                code: 1,
                                message: "policy not present"
                            }
                        }
                        else {
                            if (getPolicyDetails(roleResponse.result[0].accessPolicy._refResourceId, 0)) {


                                policyResponse = getPolicyDetails(roleResponse.result[0].accessPolicy._refResourceId, 0)
                                logger.error("policyResponse --> " + policyResponse);
                                if (policyResponse) {

                                    if (policyResponse.result[0].mutuallyExclusiveRole !== null && policyResponse.result[0].mutuallyExclusiveRole.length > 0) {
                                        for (let j = 0; j < policyResponse.result[0].mutuallyExclusiveRole.length; j++) {
                                            mutuallyExclusiveRole.push(policyResponse.result[0].mutuallyExclusiveRole[j]._id)
                                            mutuallyExclusiveRole.push(applicationRoles[i].roleId)
                                        }

                                        userRoles = getUsersRoles(requestedUserDetails);
                                        logger.error("custom endpoint logs: userRoles are --> " + userRoles);
                                        logger.error("custom endpoint logs: requestedUserDetails are --> " + JSON.stringify(requestedUserDetails));
                                        if (userRoles !== null && userRoles.length > 0) {
                                            let commonRoles = userRoles.filter(element => mutuallyExclusiveRole.includes(element))
                                            logger.error("Common Roles are " + commonRoles)
                                            if (mutuallyExclusiveRole.includes(applicationRoles[i].roleId) && commonRoles.length > 0) { // evaluating mutually exclusive condtion
                                                return { code: 400, message: 'Mutually Exclusive Role Present' };
                                            }

                                        }
                                    }


                                    if (policyResponse.result[0].preRequisites !== null && policyResponse.result[0].preRequisites.length > 0) {
                                        withPrereqCount++
                                    }
                                    else {
                                        withoutPrereqCount++
                                    }

                                }

                            }
                            else {
                                return { code: 1, message: "Invalid Policy Configuration" }
                            }

                        }

                    }
                    else {
                        return { code: 1, message: "Business App or Role is not valid in Context" }
                    }


                }
                else if (applicationRoles[i].applicationId !== null && applicationRoles[i].applicationId && applicationRoles[i].roleId === null && !applicationRoles[i].roleId) {
                    if (getBusinessAppDetails(0, applicationRoles[i].applicationId)) {
                        withoutRoleCount++
                    }
                }
                else {
                    logger.error("APP ID isn not Present")
                    return { code: 1, message: "App ID not present" }
                }
                // return {code:1, message: "Conflict : withPrereqCount  "+ withPrereqCount +"withoutPrereqCount "+ withoutPrereqCount+"App without Role "+ withoutRoleCount}
            }
            logger.error("Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount)
            if (withPrereqCount > 0 && withoutPrereqCount > 0 && withoutRoleCount > 0) {
                return { code: 1, message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount }
            }
            else if (withPrereqCount > 0 && withoutPrereqCount === 0 && withoutRoleCount > 0) {
                return { code: 1, message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount }
            }
            else if (withPrereqCount === 0 && withoutPrereqCount > 0 && withoutRoleCount > 0) {
                return { code: 0, message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount }
            }
            else if (withPrereqCount == 0 && withoutPrereqCount == 0 && withoutRoleCount > 0) {
                return { code: 2, message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount }
            }
            else if (withPrereqCount > 0 && withoutPrereqCount > 0 && withoutRoleCount === 0) {
                return { code: 3, message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount }
            }
            else {
                return { code: 3, message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount }
            }

        }

    } catch (error) {
        return { code: 1, message: "error " + error }
    }
}

function getExpiryDate(option, value) {
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now()  // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString()  // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate)  // Convert the ISO string into a Date object

        let expiryDate;

        switch (option) {
            case 0:  // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000)  // Add one day (24 hours) to the current time
                break;
            case 1:  // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000)  // Add one week (7 days)
                break;
            case 2:  // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1)  // Add one month to the current date
                break;
            case 3:  // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3)  // Add 3 months to the current date
                break;
            case 4:  // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6)  // Add 6 months to the current date
                break;
            case 5:  // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1)  // Add 1 year to the current date
                break;
            case 6:  // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day)  // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1)  // If the date is already passed this year, set it to the next year
                }
                break;
            case 7:  // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000)  // Add 'value' days in milliseconds
                break;
            case 8:  // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value);  // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return { code: 400, message: "Invalid Input" }
        }

        const expiryEpochMillis = new Date(expiryDate).getTime()  // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return { expiryEpochMillis, expiryDate };

    } catch (error) {
        return { code: 400, message: "Error Occurred While getExpiryDate " }
        logger.error("Error Occurred While getExpiryDate " + error)
    }

}

function isOrgLevelRoleProvisioned(payload) {
    try {
        logger.error("Inside checkIfRoleProvisioned ")
        if (payload) {

            const response = openidm.create("endpoint/access", null, payload)
            logger.error("isOrgLevelRoleProvisioned Response is --> " + response)
            if (response && response.resultCount > 0) {
                logger.error("getPrerequisiteType -- response  is" + response)
                return true
            }
            else if (response.code) {
                return { code: response.code, message: response.message }
            }
            else {
                return false
            }
        }

    } catch (error) {
        return { code: 400, message: "Error Occurred while checkIfRoleProvisioned " + error.message }

    }
}

// Get Prerequsites Summary 
function getPrerequisites(apiRequestPayload) {
    try {
        logger.error("apiRequestPayload.requestedUserAccountId --> " + apiRequestPayload.requestedUserAccountId)
        logger.error("apiRequestPayload.enrollmentRequestId -->" + apiRequestPayload.enrollmentRequestId)
        let userPrereqTemplate = {}
        let completedCounter = 0;
        let userPrereqSummary = {
            rolePreReq: [],
            isPendingPrereq: true
        }

        const response = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
            "_queryFilter": '/enrollmentRequestId/ eq "' +
                apiRequestPayload.enrollmentRequestId + '"' + ' AND recordState eq "' + "ACTIVE" + '"' + ' AND requestedUserAccountId eq "' + apiRequestPayload.requestedUserAccountId + '"'
        },
            ["status", "displayOrder", "preRequisiteType", "preRequisiteTypeId/_id", "preRequisiteTypeId/typeName", "preRequisiteId/displayName", "preRequisiteId/displayDescription"])

        logger.error("Get Prereq Summary Response is --> " + response)
        if (response !== null && response.resultCount > 0) {

            for (let i = 0; i < response.resultCount; i++) {
                userPrereqTemplate = {
                    id: null,
                    userPrereqId: null,
                    typeId: null,
                    typeName: null,
                    name: null,
                    description: null,
                    status: null,
                    displayOrder: null

                }
                userPrereqTemplate.id = response.result[i].preRequisiteId._id
                userPrereqTemplate.userPrereqId = response.result[i]._id
                userPrereqTemplate.typeId = response.result[i].preRequisiteTypeId._id
                userPrereqTemplate.typeName = response.result[i].preRequisiteTypeId.typeName
                userPrereqTemplate.name = response.result[i].preRequisiteId.displayName
                userPrereqTemplate.description = response.result[i].preRequisiteId.displayDescription
                userPrereqTemplate.status = response.result[i].status
                if (response.result[i].status === "COMPLETED" || response.result[i].status === "ALREADY_COMPLETED") {
                    completedCounter++
                }
                userPrereqTemplate.displayOrder = response.result[i].displayOrder
                userPrereqSummary.rolePreReq.push(userPrereqTemplate)
            }
            if (completedCounter === userPrereqSummary.rolePreReq.length) {
                userPrereqSummary.isPendingPrereq = false
            }



            return userPrereqSummary
        }
        else {
            logger.error("User Prereq Not Found")
            return null
        }
    }

    catch (error) {
        logger.error("Error Occurred While Getting Prerequsite Summary" + error)
        return { code: 400, message: "Error Occurred while Prereq Summary " + error.message }
    }

}





// Cancel Enrollemt Function

function CancelEnrollment(enrollmentRequestId, userId) {
    try {
        logger.error("Inside CancelEnrollment function")
        const getEnrollmentResponse = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": '/status eq "' + "IN_PROGRESS" + '"' + ' AND recordState eq "' + "ACTIVE" + '"' + ' AND requestedUserId eq "' + userId + '"'
                + ' AND _id eq "' + enrollmentRequestId + '"'
        }, ["*"])

        logger.error("Inside CancelEnrollment function --> getEnrollmentResponse" + getEnrollmentResponse)

        if (getEnrollmentResponse !== null && getEnrollmentResponse.resultCount > 0) {
            logger.error("Inside CancelEnrollment function --> getEnrollmentResponse User Id is " + getEnrollmentResponse.result[0].requestedUserId)

            const userPrereCancelResponse = cancelUserPrereq(enrollmentRequestId, getEnrollmentResponse.result[0].requestedUserId, "CANCELLED", 3)
            if (userPrereCancelResponse) {
                const cancelEnrollmetReqResponse = CancelEnrollmetRequest(enrollmentRequestId, getEnrollmentResponse.result[0].requestedUserId)
                if (cancelEnrollmetReqResponse && cancelEnrollmetReqResponse._id) {
                    cancelWorkflowRequest(enrollmentRequestId); // cancel AIC IGA workflow request
                    return {
                        "status": "success",
                        "payload": {
                            "id": cancelEnrollmetReqResponse._id
                        },
                        "message": "Enrollment request has been successfully cancelled"
                    }
                }
                else {
                    return { code: 400, message: "Error Occurred while CancelEnrollment" }
                }

            }
            else {
                return { code: 400, message: "Error Occurred while CancelUserPrereq" }
            }

        }
        else {
            return { code: 400, message: "EnrollmetRequest Not Found" }
        }

    } catch (error) {
        logger.error("Erorr Occurred while cancelleing the enrollment request " + error)
        return { code: 400, message: "EnrollmetRequest Not Found" }
    }

}

function CancelEnrollmetRequest(enrollmentRequestId, userId) {
    try {
        let currentTimeinEpoch = Date.now()
        let currentDate = new Date().toISOString()
        logger.error("UserId: --> " + userId + "currentTimeinEpoch: -- > " + currentTimeinEpoch + "currentDate--> " + currentDate)
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
        // jsonArray.push(jsonObj)
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

        const response = openidm.patch("managed/alpha_kyid_enrollment_request/" + enrollmentRequestId, null, jsonArray);
        if (response) {
            logger.error("CancelEnrollmetRequest Response is --> " + response)

            return response
        }
        else {
            return { code: 400, message: "Error while CancelEnrollmetRequest " }
        }




    } catch (error) {
        logger.error("Error Occurred while CancelEnrollmetRequest " + error)
        return { code: 400, message: "Error while CancelEnrollmetRequest " + error }
    }

}

function cancelUserPrereq(enrollmentRequestId, userId, status, action) {
    try {
        logger.error("Inside getCompletedPrereq ")
        logger.error("enrollmentRequestId,userId,status,action --> " + enrollmentRequestId + userId + status + action)
        if (enrollmentRequestId) {
            let reqestBody = {
                "payload": {
                    "enrollmentRequestId": enrollmentRequestId,
                    "userId": userId,
                    "status": status
                },
                "action": action
            }
            const response = openidm.create("endpoint/UserPrerequisiteAPI", null, reqestBody)
            if (response) {
                logger.error("getCompletedPrereq -- response  is" + response)
                return response
            }
            else {
                return { code: 400, message: "Error Occurred while getCompletedPrereq " }
            }
        }
    } catch (error) {
        logger.error("Error Occurred while getCompletedPrereq " + error)
        return { code: 400, message: "Error Occurred while getCompletedPrereq " + error }

    }

}

function getUserRequestByRequestedUserIdAndStatus(requestedUserId, status, returnParams) {
    try {
        var response = openidm.query("managed/alpha_kyid_enrollment_request/", { "_queryFilter": '/requestedUserId/ eq "' + requestedUserId + '"' + ' AND status eq "' + status + '"' }, returnParams);

        if (response.resultCount > 0) {
            return response
        } else {
            return false
        }
    } catch (error) {
        throw { code: 500, message: error };
    }
}

function getUserRequestByappSystemNameAndStatus(appSystemName, status, returnParams) {
    try {
        var response = openidm.query("managed/alpha_kyid_enrollment_request/", { "_queryFilter": '/appSystemName/ eq "' + appSystemName + '"' + ' AND status eq "' + status + '"' }, returnParams);

        if (response.resultCount > 0) {
            return response
        } else {
            return false
        }
    } catch (error) {
        throw { code: 500, message: error };
    }
}

function getInProgressApproval(workflowRequest) {
    var requestPhases = workflowRequest.decision.phases;
    logger.error("custom-endpoint userprerequisite_v2B getInProgressApproval requestPhases: " + requestPhases);
    var inProgressApproval;
    for (let i=0; i<requestPhases.length; i++) {
        if (requestPhases[i].status == "in-progress") {
            inProgressApproval = requestPhases[i];
            break;
        } else {
            continue;
        }
    }

    return inProgressApproval;
}

function getApproverMailsForInProgressApproval(approvalName, workflowRequest) {
    var actors = workflowRequest.decision.actors.active;
    var approverMails = [];

    if (actors && actors.length > 0) {
        for (let i=0; i<actors.length; i++) {
            if (actors[i].phase == approvalName) {
                logger.error("custom-endpoint userprerequisite_v2B getApproverMailsForInProgressApproval actor: " + actors[i]);
                approverMails.push(actors[i].mail);
            }
        }
    }

      logger.error("custom-endpoint userprerequisite_v2B getApproverMailsForInProgressApproval approverMails: " + approverMails);
    

    return approverMails;
}

function sendCancellationEmail(approverMails) {

    for (let i=0; i<approverMails.length; i++) {
        try {
            var body = {
                subject: "Request Cancelled" ,
                to: approverMails[i],
                templateName: "kyidRequestCancelled",
                object: {}
            };
        
            openidm.action("external/email", "sendTemplate", body);
        } catch (e) {
            logger.info("custom-endpoint userprerequisite_v2B sendCancellationEmail unable to send cancellation notification email: " + e);
        }
    }
}
  
function cancelWorkflowRequest(enrollmentRequestId) {
  try {
      logger.error("custom-endpoint userprerequisite_v2B cancelWorkflowRequest enrollmentRequestId: " + enrollmentRequestId);

      var userPrerequisite = openidm.query("managed/alpha_kyid_enrollment_user_prerequisite/", { "_queryFilter": '/enrollmentRequestId/ eq "' + enrollmentRequestId + '"'}, []);
      
      var requestId;
      if (userPrerequisite && userPrerequisite != null) {
        requestId = userPrerequisite.pingApprovalWorkflowId;

        if (requestId && requestId != null) {

            var workflowRequest = openidm.action("/iga/governance/requests/" + requestId, "GET", {});

            logger.error("custom-endpoint userprerequisite_v2B cancelWorkflowRequest workflowRequest: " + workflowRequest);

            if (workflowRequest && workflowRequest != null) {
                if (workflowRequest.decision.status.toLowerCase() != "completed") {
                    var inProgressApproval = getInProgressApproval(workflowRequest);
                    logger.error("custom-endpoint userprerequisite_v2B cancelWorkflowRequest inProgressApproval: " + inProgressApproval);


                    if (inProgressApproval && inProgressApproval != null) {
                        var cancelResponse = openidm.action("/iga/governance/requests/" + requestId, "POST", {"comments":"user has cancelled the request"}, {_action: "cancel", phaseName: inProgressApproval.name});

                        logger.error("kyid custom endpoint userPrerequisite_v2B cancelWorkflowRequest cancelResponse:" + cancelResponse);

                        if (cancelResponse.id != null) {
                            var approverMails = getApproverMailsForInProgressApproval(inProgressApproval.name, workflowRequest);
                            logger.error("kyid custom endpoint userPrerequisite_v2B cancelWorkflowRequest approverMails:" + approverMails);

                            if (approverMails && approverMails.length > 0) {
                                sendCancellationEmail(approverMails)
                            }
                        }

                        return cancelResponse;
                    } else {
                        let returnPayload = {
                            "responseCode": 1,
                            "transactionId": request.content.transactionId,
                            "message": {
                                "content": "No in-progress phase found for request with id " + requestId,
                                "code": "1"
                            }
                        }
                        return returnPayload;
                    }

                    
                } else {
                    let returnPayload = {
                        "responseCode": 1,
                        "transactionId": request.content.transactionId,
                        "message": {
                            "content": "Workflow request has already completed for id " + requestId,
                            "code": "1"
                        }
                    }
                    return returnPayload;
                }
            } else {
                let returnPayload = {
                    "responseCode": 1,
                    "transactionId": request.content.transactionId,
                    "message": {
                        "content": "Workflow request not found for id " + requestId,
                        "code": "1"
                    }
                }
                return returnPayload;
            }
        } else {
            let returnPayload = {
                "responseCode": 1,
                "transactionId": request.content.transactionId,
                "message": {
                    "content": "UserPrerequisite not found for pingApprovalWorkflowId " + enrollmentRequestId,
                    "code": "1"
                }
            }
            return returnPayload;
        }
    } else {
        let returnPayload = {
                "responseCode": 1,
                "transactionId": request.content.transactionId,
                "message": {
                    "content": "UserPrerequisite not found for enrollment id " + enrollmentRequestId,
                    "code": "1"
                }
            }
            return returnPayload;
    }

  } catch (error) {
    return {
      "error": error
    }
  }
}

function auditLogger(eventCode,eventName, eventDetails, requesterUserId, requestedUserId, transactionId) {
try{
    const createdDate = new Date().toISOString();
    const currentTimeinEpoch = Date.now();

    let logPayload = {
        eventCode:eventCode,
        eventName: eventName,
        eventDetails: JSON.stringify(eventDetails),
        requesterUserId: requesterUserId,
        requestedUserId: requestedUserId,
        transactionId: transactionId,
        createdDate: createdDate,
        createdTimeinEpoch: currentTimeinEpoch
    };
logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
     const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload, ["*"]);
    logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
   } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
    }
   
}

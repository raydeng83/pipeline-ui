// var isEndpointExecutionAllowed = identityServer.getProperty("esv.journey.execution.flag")
// const currentTimeinEpoch = Date.now()
// const currentDate = new Date().toISOString()

(function () {
    // Audit logger related variables
    const transactionIdauditLogger = context.transactionId && context.transactionId.transactionId && context.transactionId.transactionId.value ? context.transactionId.transactionId.value : ""
    const sessionRefIDauditLogger = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId ? context.oauth2.rawInfo.sessionRefId : ""
    const sessionDetailsauditLogger = sessionRefIDauditLogger ? {"sessionRefId": sessionRefIDauditLogger} : {}

    const authenticatedUserId = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sub ? context.oauth2.rawInfo.sub : ""
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
        const requesterUserAccountId = payload.requesterUserAccountId;
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
                        throw {
                            code: getEnrollmentResponse.code,
                            message: getEnrollmentResponse.message
                        }
                    } else {
                        return getEnrollmentResponse

                    }


                } else {
                    throw {
                        code: 500,
                        message: 'Unknown error'
                    }
                }

            } else {
                createEnrollmentResponse = enrollmentRequest(action, enrollmentContextId, requestedUserAccountId)
                if (createEnrollmentResponse) {
                    logger.error("enrollmentRequest is *** --> " + JSON.stringify(createEnrollmentResponse));
                    if (createEnrollmentResponse.message) {
                        logger.error("createEnrollmentResponse.message" + createEnrollmentResponse.message)
                        throw {
                            code: createEnrollmentResponse.code,
                            message: createEnrollmentResponse.message
                        }

                    } else {
                        return createEnrollmentResponse

                    }


                } else {
                    throw {
                        code: 500,
                        message: 'Unknown error'
                    }
                }


            }


        } else if (action === 2) {
            logger.error("Inside Action 2")

            CancelEnrollmentResponse = CancelEnrollment(payload.enrollmentRequestId, requestedUserAccountId)
            logger.error("CancelEnrollmentResponse is " + CancelEnrollmentResponse)
            if (CancelEnrollmentResponse && CancelEnrollmentResponse !== null) {
                if (CancelEnrollmentResponse.message && CancelEnrollmentResponse.status) {
                    return CancelEnrollmentResponse
                } else {
                    throw {
                        code: 400,
                        message: CancelEnrollmentResponse.message
                    }
                }
            } else {
                throw {
                    code: 500,
                    message: "Unexpected Error Occurred"
                }
            }
        }
        else if (action === 3) {
            logger.error("Inside Action 3")

            payload.auditLoggerObj = {
                transactionIdauditLogger: transactionIdauditLogger,
                sessionRefIDauditLogger: sessionRefIDauditLogger,
                sessionDetailsauditLogger: sessionDetailsauditLogger
            };
            CancelEnrollmentResponse = CancelEnrollmentWithComment(payload);
            logger.error("CancelEnrollmentResponse is " + CancelEnrollmentResponse)

            

        let returnPayload = {
            "responseCode": 0,
            "transactionId": "",
            "message": {
                "content": "Success",
                "code": "0"
            },
            "payload": {
                "data": CancelEnrollmentResponse
            }
        }
    
        return returnPayload;



            if (CancelEnrollmentResponse && CancelEnrollmentResponse !== null) {
                if (CancelEnrollmentResponse.message && CancelEnrollmentResponse.status) {
                    return CancelEnrollmentResponse
                } else {
                    throw {
                        code: 400,
                        message: CancelEnrollmentResponse.message
                    }
                }
            } else {
                throw {
                    code: 500,
                    message: "Unexpected Error Occurred"
                }
            }
        }
        if (action === 4) {
            var status = request.content.payload.status;
            var returnParams = request.content.payload.returnParams;
            var view = request.content.payload.view;
            if (view && view != null) {
                if (view == "ActiveEnrollmentByAppAndUser") {
                    return getActiveEnrollmentByAppAndUser(payload.queryFilter);
                } else if (view == "ActiveEnrollmentByUser") {
                    return getActiveEnrollmentByUser(payload.queryFilter);
                } else if (view.toLowerCase() == "delegationmanageenrollment") {
                    return getDelegatedEnrollments(payload.queryFilter);
                }
                else if (view == "ActiveEnrollmentByApp") {
                    return getActiveEnrollmentByApp(payload.queryFilter);
                }
            } else {
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
            throw {
                code: 403,
                message: 'You are not authorized'
            }
        }

        if (allowedParamsGetPrereqSummary.sort().toString() === paramKeys.sort().toString()) {
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
                response = getPrerequisites(apiRequestPayload)
                logger.error("User Prereq Summary is --> " + JSON.stringify(response))
                if (response && response.message) {
                    throw {
                        code: 400,
                        message: response.message
                    };
                } else if (response !== null) {
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


        return {};
    } else if (request.method === 'update') {
        // PUT
        return {};
    } else if (request.method === 'patch') {
        var patchOperations = request.patchOperations
        var enrollmentRequestId = request.additionalParameters.enrollmentRequestId
        var userId = request.additionalParameters.requestedUserAccountId
        if (authenticatedUserId !== userId) {
            throw {
                code: 403,
                message: 'You are not authorized'
            }
        }
        var patchResponse = CancelEnrollment(enrollmentRequestId, userId)

        return patchResponse



    } else if (request.method === 'delete') {
        return {};
    }
    throw {
        code: 500,
        message: 'Unknown error'
    }
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
                    if (enrollmentContextResponse.requestedUserAccountId !== null && enrollmentContextResponse.requestedUserAccountId &&
                        enrollmentContextResponse.requesterUserAccountId) {
                        logger.error("Dummy log --> ");
                        if (requestedUserAccountId === enrollmentContextResponse.requestedUserAccountId) { // validating if requested user is same as loggedin User
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
                            } else {
                                return {
                                    code: 400,
                                    message: 'User is Inactive'
                                }
                                // throw { code: 400, message: 'User is Inactive' };
                            }

                        } else {
                            return {
                                code: 400,
                                message: 'Invalid User'
                            }
                        }


                    } else {
                        outcome = enrollmentReqLogic(enrollmentContextId, null, null, enrollmentContextResponse, requestedUserDetails, requestedUser)

                    }

                } else if (enrollmentContextResponse.code === 2) {
                    outcome = createStaticEnrollmentRequest(enrollmentContextId, requestedUserDetails, requestedUser)
                } else {
                    let msg = enrollmentContextResponse.message
                    return {
                        code: 400,
                        message: msg
                    }
                }
                return outcome;
            }

        } else {
            logger.error("User ID not found")
            return {
                code: 400,
                message: 'UserId is null'
            }
        }
    } catch (error) {
        logger.error("Error Occurred while enrollmentRequest" + error)
        return {
            code: 500,
            message: 'Unknown error' + error
        }
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
            } else if (response.result[0].expiryDateEpoch === null || !(response.result[0].expiryDateEpoch)) {
                return response.result[0]
            } else {
                return {
                    code: 1,
                    message: "Context Id is expired"
                }
            }
        } else {
            return {
                code: 2,
                message: "Enrollment request not found with this Context ID"
            }
        }


    } catch (error) {
        logger.error("Error Occurred while getEnrollmentContextDetails" + error)
        return {
            code: 500,
            message: 'Unknown error' + error
        }
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

         var response =  openidm.read("managed/alpha_user/" + userId, null, ["*"]);
        //var response = openidm.create("endpoint/LIB-UserProfileAPI", null, requestBody)
        logger.error("user response is --> " + response)

        if (response && response.user !== null) {
            return response
        } else {
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
        } else {
            return {
                code: 500,
                message: 'Unknown error' + error
            }
        }
    } catch (error) {
        throw {
            code: 500,
            message: 'Unknown error' + error
        }
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
        } else {

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
        } else {

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
        } else {

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
                let activeEnrollmentsWithPreReq = [] // Array to store enrollments with prerequisites
                let prereqRecord = {
                    id: null, // ID of the Enrollment
                    helpdeskContactId: null,
                    appLogo: null, // Logo of the business app
                    roleDisplayName: null, // Display name of the role
                    appDisplayName: null, // Display name of the app
                    appId: null // ID of the app
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
                    "_queryFilter": '/requestedUserId/ eq "' + userId + '"' +
                        ' AND status eq "' + "IN_PROGRESS" + '"' + ' AND recordState eq "' + "ACTIVE" + '"' + ' AND (enrollmentContextId eq "' + contextId + '" OR roleIds/_refResourceId eq "' + contextId + '")'
                }, ["roleIds/*", ["*"]])


                logger.error("custom endpoint logs: getActiveEnrollmentRequest --> " + response)

                // Check if there are any results in the response
                if (response.resultCount > 0) {
                    // Loop through each result in the response
                    for (let i = 0; i < response.result.length; i++) {
                        // Check if prerequisites are present for the user

                        prereqRecord = {
                            id: null, // ID of the Enrollment
                            helpdeskContactId: null,
                            appLogo: null, // Logo of the business app
                            roleDisplayName: null, // Display name of the role
                            appDisplayName: null, // Display name of the app
                            appId: null // ID of the app
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

                                    return {
                                        code: 400,
                                        message: "Role not Found with the request"
                                    }
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

                            } else {
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
            } else {
                return {
                    code: 400,
                    message: "User is not valid"
                }
            }
        } else {
            return {
                code: 400,
                message: "User is not valid"
            }
        }
    } catch (error) {
        logger.error("Error Occurred while getActiveEnrollmentRequest: " + error);
        return {
            code: 400,
            message: "Error Occurred while getActiveEnrollmentRequest:" + error
        }
    }
}

function isPrereqRequired(prereqDetails, requiredMFA) {
    try {

        let prereqRequired = null;
        let withPrereqCounter = 0
        let prerequisiteTypeResponse = null
        if (requiredMFA) {
            requiredMFA = requiredMFA
        } else {
            requiredMFA = "0"
        }
        if (prereqDetails !== null && prereqDetails.length > 0) {
            logger.error("prereqDetails are --> " + prereqDetails)
            for (let i = 0; i < prereqDetails.length; i++) {
                // prereqId = prereqDetails[i]._id
                prerequisiteTypeResponse = getPrerequisiteType(prereqDetails[i]._id, 1)
                logger.error("prereqDetails prereqDetails  " + prereqDetails[i])
                logger.error("prereqDetails prereqDetails.length " + prereqDetails.length)
                if (prereqDetails[i].enrollmentActionSettings.triggerAlways === true) {
                    if (prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && (requiredMFA === "0")) {
                        logger.error("Skipping prereq as MFA Code is 0 or null ")
                    } else {
                        withPrereqCounter++
                    }



                }

                if (withPrereqCounter > 0) {
                    return true
                } else {
                    return false
                }


            }




        } else {
            return false
        }



    } catch (error) {
        logger.error("Error Occurred evaluateUserPrereq Function " + error)
        return {
            code: 400,
            message: "Error Occurred evaluateUserPrereq function" + error
        }
    }

}


// createUserPrereqRespons = evaluateUserPrereq(requestedUserDetails,enrollmentReqId._id, requestedUser, requesterUser, roleResponse.result[0]._id, policyResponse.result[0].preRequisites,roleResponse.result[0].requiredMFAMethod)
function evaluateUserPrereq(requestedUserDetails, enrollmentRequestId, userId, requesterId, roleId, prereqDetails, requiredMFACode) {
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
             createdByID: "KYID-System",
            updatedByID: "KYID-System",
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
            displayName: {}
        }
        if (requesterId) {
            userPrereqPayload.requesterUserAccountId = requesterId
            userPrereqPayload.createdByID = requesterId
            userPrereqPayload.updatedByID = requesterId
        } else {
            userPrereqPayload.requesterUserAccountId = userId
            userPrereqPayload.createdByID = userId
            userPrereqPayload.updatedByID = userId
        }

        if (requestedUserDetails && requestedUserDetails.authenticators !== null) {
            var UserMFAResponse = requestedUserDetails.authenticators
            logger.error("UserMFAResponse is --> " + UserMFAResponse)
            logger.error("Required MFA is --> " + requiredMFACode)
            if (requiredMFACode == null || requiredMFACode == "") {
                requiredMFACode = "0"
            }

            for (i = 0; i < UserMFAResponse.resultCount; i++) {
                if (requiredMFACode === "5" && (UserMFAResponse.result[i].MFAMethod === "TOTP" || UserMFAResponse.result[i].MFAMethod === "PUSH" || UserMFAResponse.result[i].MFAMethod === "FRPUSH" || UserMFAResponse.result[i].MFAMethod === "FRTOTP" || UserMFAResponse.result[i].MFAMethod === "SYMANTEC")) {
                    foundMFA = true
                    break
                } else if (requiredMFACode === "4" && (UserMFAResponse.result[i].MFAMethod === "SMSVOICE" || UserMFAResponse.result[i].MFAMethod === "TOTP" || UserMFAResponse.result[i].MFAMethod === "PUSH" || UserMFAResponse.result[i].MFAMethod === "FRPUSH" || UserMFAResponse.result[i].MFAMethod === "FRTOTP" || UserMFAResponse.result[i].MFAMethod === "SYMANTEC")) {
                    foundMFA = true
                    break

                } else if (requiredMFACode === "3" && (UserMFAResponse.result[i].MFAMethod === "EMAIL" || UserMFAResponse.result[i].MFAMethod === "SECONDARY_EMAIL" || UserMFAResponse.result[i].MFAMethod === "SMSVOICE" || UserMFAResponse.result[i].MFAMethod === "FRPUSH" || UserMFAResponse.result[i].MFAMethod === "FRTOTP" || UserMFAResponse.result[i].MFAMethod === "TOTP" || UserMFAResponse.result[i].MFAMethod === "PUSH" || UserMFAResponse.result[i].MFAMethod === "SYMANTEC")) {
                    foundMFA = true
                    break
                }
            }
        }

        if (prereqDetails !== null && prereqDetails.length > 0) {
            logger.error("prereqDetails are --> " + prereqDetails)
            for (let i = 0; i < prereqDetails.length; i++) {
                // prereqId = prereqDetails[i]._id
                logger.error("prereqDetails prereqDetails  " + prereqDetails[i])
                logger.error("prereqDetails prereqDetails.length " + prereqDetails.length)
                if (prereqDetails[i].enrollmentActionSettings.triggerAlways === true) {

                    prerequisiteTypeResponse = getPrerequisiteType(prereqDetails[i]._id, 1)
                    logger.error("prerequisiteTypeResponse is --> " + prerequisiteTypeResponse)
                    if (prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && requiredMFACode === "0") { // Adding this condition if MFA is not required (MFA code as 0)
                        logger.error("endpoint/enrollment logs --> Skipping MFA MFA code is 0")
                    } else {
                        userPrereqPayload.displayName = prereqDetails[i].displayName
                        userPrereqPayload.preRequisiteId = {
                            "_ref": "managed/alpha_kyid_enrollment_prerequisite/" + prereqDetails[i]._id,
                            "_refProperties": {}
                        }

                        userPrereqPayload.displayOrder = i + 1
                        // prerequisiteTypeResponse = getPrerequisiteType(prereqDetails[i]._id, 1)
                        // logger.error("prerequisiteTypeResponse is --> " + prerequisiteTypeResponse)
                        if (prerequisiteTypeResponse && prerequisiteTypeResponse.result[0]._id && prerequisiteTypeResponse.result[0].name) {
                            // if(prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && requiredMFACode === "0"){

                            // }
                            userPrereqPayload.preRequisiteType = prerequisiteTypeResponse.result[0].prereqTypeId.typeName
                            userPrereqPayload.preRequisiteTypeId = {
                                "_ref": "managed/alpha_kyid_enrollment_prerequisite_type/" + prerequisiteTypeResponse.result[0].prereqTypeId._refResourceId,
                                "_refProperties": {}
                            }


                            // if (prereqDetails[i].expiry && prereqDetails[i].expiry !== null) {
                            //     if (prereqDetails[i].expiry.dueDateType !== null && prereqDetails[i].expiry.dueDateType) {
                            //         logger.error("prereqDetails[i].enrollmentActionSettings.expiry.dueDateType" + prereqDetails[i].expiry.dueDateType);
                            //         logger.error("prereqDetails[i].enrollmentActionSettings.expiry.dueDateValue" + prereqDetails[i].expiry.dueDateValue);
                            //         prereqExpiryDate = getExpiryDate(prereqDetails[i].expiry.dueDateType, prereqDetails[i].expiry.dueDateValue)
                            //         logger.error("prereqExpiryDate is --> " + JSON.stringify(prereqExpiryDate));
                            //         if (prereqExpiryDate.expiryDate && prereqExpiryDate.expiryEpochMillis) {
                            //             userPrereqPayload.expiryDate = prereqExpiryDate.expiryDate
                            //             userPrereqPayload.expiryDateEpoch = prereqExpiryDate.expiryEpochMillis

                            //         }
                            //         else {
                            //             return { code: 1, message: prereqExpiryDate.message }
                            //         }

                            //     }



                            // }



                            if (prereqDetails[i].enrollmentActionSettings.allowReuse === false) {
                                // if (prereqDetails[i].enrollmentActionSettings.expiry.dueDateType !== null && prereqDetails[i].enrollmentActionSettings.expiry.dueDateType) {
                                //     // prereqExpiryDate = getExpiryDate (prereqDetails[i].enrollmentActionSettings.expiry.dueDateType,prereqDetails[i].enrollmentActionSettings.expiry.dueDateValue)


                                // }
                                logger.error("prerequisite Id --> " + prereqDetails[i]._id)
                                // prerequisiteTypeResponse = getPrerequisiteType(prereqDetails[i]._id,1)
                                // logger.error("prerequisiteTypeResponse is --> "+ prerequisiteTypeResponse)
                                // if(prerequisiteTypeResponse && prerequisiteTypeResponse.result[0]._id && prerequisiteTypeResponse.result[0].name ){
                                //   userPrereqPayload.preRequisiteType = prerequisiteTypeResponse.result[0].name
                                //   userPrereqPayload.preRequisiteTypeId =  { "_ref": "managed/alpha_kyid_enrollment_prerequisite_type/" + prerequisiteTypeResponse.result[0].prereqTypeId._refResourceId, "_refProperties": {} }
                                // }
                                logger.error("PrereType Name is --> " + prerequisiteTypeResponse.result[0].prereqTypeId.typeName)
                                if (prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && foundMFA === true) {
                                    userPrereqPayload.completionDate = currentDate
                                    userPrereqPayload.completionDateEpoch = currentTimeinEpoch
                                    userPrereqPayload.status = "COMPLETED"
                                } else {
                                    userPrereqPayload.status = "NOT_STARTED"
                                }


                            } else {
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
                                            } else {
                                                userPrereqPayload.status = "NOT_STARTED"
                                            }

                                        } else {
                                            userPrereqPayload.completionDate = completedPrereqResponse.result[0].completionDate
                                            userPrereqPayload.completionDateEpoch = completedPrereqResponse.result[0].completionDateEpoch
                                            userPrereqPayload.status = "ALREADY_COMPLETED"
                                        }



                                    } else {
                                        logger.error("isPrereqReusable flag is false  ")
                                        if (prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && foundMFA === true) {
                                            userPrereqPayload.completionDate = currentDate
                                            userPrereqPayload.completionDateEpoch = currentTimeinEpoch
                                            userPrereqPayload.status = "ALREADY_COMPLETED"
                                        } else {
                                            userPrereqPayload.status = "NOT_STARTED"
                                        }


                                    }

                                } else {
                                    if (prerequisiteTypeResponse.result[0].prereqTypeId.typeName === "MFA" && foundMFA === true) {
                                        userPrereqPayload.completionDate = currentDate
                                        userPrereqPayload.completionDateEpoch = currentTimeinEpoch
                                        userPrereqPayload.status = "COMPLETED"
                                    } else {
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
                        } else {
                            isUserPrereq = false
                            return {
                                code: 400,
                                message: "Error Occurred while Creating UserPrerequsiistes"
                            }
                        }

                    }


                }



            }

            return "success"




        } else {
            return {
                code: 400,
                message: "Prereq Not Found"
            }
        }



    } catch (error) {
        logger.error("Error Occurred evaluateUserPrereq Function " + error)
        return {
            code: 400,
            message: "Error Occurred evaluateUserPrereq function" + error
        }
    }

}

function isPrereqReusable(allowReuseIfDaysOld, completionDateEpoch) {
    try {
        const addedTimeinSec = allowReuseIfDaysOld * 24 * 60 * 60 * 1000
        const finalDateEpoch = completionDateEpoch + addedTimeinSec
        const currentTimeinEpoch = Date.now()
        if (currentTimeinEpoch > finalDateEpoch) {
            return false
        } else {
            return true
        }


    } catch (error) {
        logger.error("Error Occurred isPrereqReusable function " + error)
        throw {
            code: 400,
            message: "Error Occurred isPrereqReusable function" + error
        }

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
            } else {
                return null
            }
        }
    } catch (error) {
        logger.error("Error Occurred while getCompletedPrereq " + error)
        return {
            code: 400,
            message: "Error Occurred while getCompletedPrereq" + error
        }

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
        } else {
            return null
        }

    } catch (error) {
        logger.error("error createUserPrerequisite function --> " + error)
        throw {
            code: 400,
            message: "Error createUserPrerequisite function" + error
        }
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
            } else {
                return null
            }
        }
    } catch (error) {
        logger.error("Error Occurred while getPrerequisiteType " + error)
        throw {
            code: 400,
            message: "Error Occurred while getPrerequisiteType" + error
        }

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
        let defaultPrereqExpiryInDays = identityServer.getProperty("esv.enrollment.prereq.defaultexpiry") //30 // need to create ESV for this
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
             createdByID: "KYID-System",
            updatedByID: "KYID-System",
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
                            return {
                                code: 400,
                                message: "Role is already provisioned"
                            }

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
                    } else {
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
                                            return {
                                                code: 400,
                                                message: 'Mutually Exclusive Role Present'
                                            }
                                        }

                                    }
                                }
                                enrollmentReqTemplate.appSystemName.push(businessAppResponse.result[0].content[0].title)
                                enrollmentReqTemplate.roleIds.push({
                                    "_ref": "managed/alpha_role/" + roleId,
                                    "_refProperties": {}
                                })

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

                                if (policyResponse.result[0].preRequisites !== null && policyResponse.result[0].preRequisites.length > 0 && isPrereqRequired(policyResponse.result[0].preRequisites, roleResponse.result[0].requiredMFAMethod) === true) {

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

                                    } else {
                                        return {
                                            code: 400,
                                            message: "Error occurred while creating enrollment request"
                                        }
                                    }
                                } else {
                                    // Without Prereq
                                    enrollmentReqId = createEnrollmentRequest(enrollmentReqTemplate)
                                    if (enrollmentReqId) {
                                        // prereqRecord.id = enrollmentReqId._id
                                        activeEnrollmentsWithoutPreReq["associatedAppInfo"] = prereqRecord
                                        activeEnrollmentsWithoutPreReq["id"] = enrollmentReqId._id

                                    } else {
                                        return {
                                            code: 400,
                                            message: "Error occurred while creating enrollment request"
                                        }
                                    }
                                    // withoutPrereqCount++
                                }

                            }

                        } else {
                            return {
                                code: 400,
                                message: "Invalid Policy Configuration"
                            }
                        }

                    }

                } else {
                    return {
                        code: 400,
                        message: "Business App or Role is not valid in Context"
                    }
                }


            } else if (applicationRoles[i].applicationId !== null && applicationRoles[i].applicationId && applicationRoles[i].roleId === null && !applicationRoles[i].roleId) {
                if (getBusinessAppDetails(0, applicationRoles[i].applicationId)) {
                    withoutRoleCount++
                }
            } else {
                logger.error("APP ID isn not Present")
                return {
                    code: 1,
                    message: "App ID not present"
                }
            }
            // return {code:1, message: "Conflict : withPrereqCount  "+ withPrereqCount +"withoutPrereqCount "+ withoutPrereqCount+"App without Role "+ withoutRoleCount}



        }
        return outcome


    } catch (error) {
        logger.error("Error Occurred createStaticEnrollmentRequest Function -->" + error)
        return {
            code: 400,
            message: "Execption occurred " + error.message
        }

    }
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
        let defaultPrereqExpiryInDays = 30; // need to create ESV for this
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
            appName: null,
            businessKeys: [],
            currentDelegatorId: null,
            orgId: null,
            orgName: null,
            orgType: null,
            orginalDelegatorId: null,
            roleName: null
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
            createdByID: "KYID-System",
            updatedByID: "KYID-System",
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
                        createdByID: "KYID-System",
                        updatedByID: "KYID-System",
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
                            let isRoleProvisionedRequestBoady = {
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
                                isRoleProvisionedRequestBoady.payload.currentDelegatorId = applicationRoles[i].currentDelegatorUserAccountId
                            }
                            if (applicationRoles[i].originalDelegatorUserAccountId) {
                                isRoleProvisionedRequestBoady.payload.originalDelegatorId = applicationRoles[i].originalDelegatorUserAccountId
                            }
                            if (applicationRoles[i].orgType) {
                                isRoleProvisionedRequestBoady.payload.orgType = applicationRoles[i].orgType
                            }
                            if (applicationRoles[i].orgId) {
                                isRoleProvisionedRequestBoady.payload.orgId = applicationRoles[i].orgId
                            }
                            if (applicationRoles[i].businessKeyId) {
                                isRoleProvisionedRequestBoady.payload.businessKeyName = applicationRoles[i].businessKeyId
                            }
                            // isRoleProvisionedRequestBoady[""]
                            logger.error("isRoleProvisionedRequestBoady ---> " + JSON.stringify(isRoleProvisionedRequestBoady))
                            if (isOrgLevelRoleProvisioned(isRoleProvisionedRequestBoady)) {
                                isOrgLevelRoleProvisionedResponse = isOrgLevelRoleProvisioned(isRoleProvisionedRequestBoady)
                            }



                        }
                        if (isRoleAssigned === false && isOrgLevelRoleProvisionedResponse === false) {


                            // }
                            // else if()
                            // else {
                            logger.error("custom endpoint logs: roleResponse.result[0].accessPolicy._refResourceId --> " + roleResponse.result[0].accessPolicy._refResourceId)
                            if (roleResponse.result[0].accessPolicy._refResourceId !== null && roleResponse.result[0].accessPolicy._refResourceId) {

                                policyResponse = getPolicyDetails(roleResponse.result[0].accessPolicy._refResourceId, 0)
                                logger.error("custom Endpoint policyResponse is -->  " + policyResponse);
                                if (policyResponse && policyResponse.isPolicyPresent !== false) {

                                    logger.error("custom endpoint logs: policyResponse.result[0].preRequisites  --> " + policyResponse.result[0].preRequisites)


                                    if (policyResponse.result[0].preRequisites !== null && policyResponse.result[0].preRequisites.length > 0 && isPrereqRequired(policyResponse.result[0].preRequisites, roleResponse.result[0].requiredMFAMethod) === true) {
                                        // getting required attributes to create enrollment request ID
                                        enrollmentContextResponse.requesterId = [];
                                        businessAppResponse = getBusinessAppDetails(0, roleResponse.result[0].businessAppId._refResourceId)
                                        logger.error("custom endpoint logs: businessAppResponse -->  " + businessAppResponse)




                                        if (enrollmentContextResponse.requesterUserAccountId) {
                                            enrollmentReqTemplate.requesterId = enrollmentContextResponse.requesterUserAccountId
                                        } else {
                                            enrollmentReqTemplate.requesterId = requestedUser
                                        }
                                        if (enrollmentContextResponse.requestedUserAccountId) {
                                            enrollmentReqTemplate.requestedUserId = enrollmentContextResponse.requestedUserAccountId
                                        } else {
                                            enrollmentReqTemplate.requestedUserId = requestedUser
                                        }
                                        if (enrollmentContextResponse.requesterUserAccountId) {
                                            enrollmentReqTemplate.createdByID = enrollmentContextResponse.requesterUserAccountId // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                                        } else {
                                            enrollmentReqTemplate.createdByID = requestedUser
                                        }
                                        if (enrollmentContextResponse.requesterUserAccountId) {
                                            enrollmentReqTemplate.updatedByID = enrollmentContextResponse.requesterUserAccountId // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                                        } else {
                                            enrollmentReqTemplate.updatedByID = requestedUser
                                        }

                                        enrollmentReqTemplate.appSystemName.push(enrollmentContextResponse.applicationRoles[i].applicationName) // need to verify with amit regarding this is it required or not
                                        enrollmentReqTemplate.roleIds = [];
                                        enrollmentReqTemplate.roleIds.push({
                                            "_ref": "managed/alpha_role/" + applicationRoles[i].roleId,
                                            "_refProperties": {}
                                        })
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
                                            createUserPrereqRespons = evaluateUserPrereq(requestedUserDetails, enrollmentReqId._id, requestedUser, requesterUser, roleResponse.result[0]._id, policyResponse.result[0].preRequisites, roleResponse.result[0].requiredMFAMethod)
                                            logger.error("createUserPrereqRespons ---> " + JSON.stringify(createUserPrereqRespons))

                                        }

                                    } else {
                                        appRolesContextwithoutPrereq.push(applicationRoles[i])
                                        logger.error("roleIdsWithoutPreReq are --> " + applicationRoles[i].roleId);
                                        roleIdsWithoutPreReq.push(applicationRoles[i].roleId)
                                        enrollmentReqTemplate.appSystemName.push(enrollmentContextResponse.applicationRoles[i].applicationName)
                                        logger.error("roleIdsWithoutPreReq array values are --> " + roleIdsWithoutPreReq);
                                    }




                                }




                            } else {
                                logger.error("Policy not found for role")
                                return {
                                    code: 400,
                                    message: 'Policy not found for role'
                                };
                            }

                        } else if (isOrgLevelRoleProvisionedResponse.message && isOrgLevelRoleProvisionedResponse.code) {
                            logger.error("Error Occurred while check is Role Provision " + isOrgLevelRoleProvisionedResponse.code + isOrgLevelRoleProvisionedResponse.message)
                            return {
                                code: isOrgLevelRoleProvisionedResponse.code,
                                message: "isOrgLevelRoleProvisionedResponse Error: " + isOrgLevelRoleProvisionedResponse.message
                            }
                        }



                    } else {
                        logger.error("Invalid configuration in context")
                        return {
                            "code": 400,
                            "message": "Invalid configuration in context"
                        };
                    }


                }


                if (appRolesContextwithoutPrereq.length > 0) {
                    logger.error("Inside with appRolesContextwithoutPrereq --> " + appRolesContextwithoutPrereq.length)
                    for (let l = 0; l < appRolesContextwithoutPrereq.length; l++) {
                        logger.error("Inside with")



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
                            createdByID: "KYID-System",
                            updatedByID: "KYID-System",
                            appSystemName: [],
                            roleIds: [],
                            roleContext: []

                        }

                        let businessKeysTemplate = {
                            businessKeyName: null,
                            businessKeyValue: null
                        };
                        let roleContextTemplate = {
                            appName: null,
                            businessKeys: [],
                            currentDelegatorId: null,
                            orgId: null,
                            orgName: null,
                            orgType: null,
                            orginalDelegatorId: null,
                            roleName: null
                        }
                        logger.error("appRolesContextwithoutPrereq[i] is --> " + JSON.stringify(appRolesContextwithoutPrereq[l]))
                        enrollmentReqTemplate.roleIds.push({
                            "_ref": "managed/alpha_role/" + appRolesContextwithoutPrereq[l].roleId,
                            "_refProperties": {}
                        })
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
                        enrollmentReqTemplate.roleContext.push(roleContextTemplate)
                        logger.error("roleContextTemplate is --> " + JSON.stringify(roleContextTemplate))


                        if (enrollmentContextResponse.requesterUserAccountId) {
                            enrollmentReqTemplate.requesterId = enrollmentContextResponse.requesterUserAccountId
                        } else {
                            enrollmentReqTemplate.requesterId = requestedUser
                        }
                        if (enrollmentContextResponse.requestedUserAccountId) {
                            enrollmentReqTemplate.requestedUserId = enrollmentContextResponse.requestedUserAccountId
                        } else {
                            enrollmentReqTemplate.requestedUserId = requestedUser
                        }
                        if (enrollmentContextResponse.requesterUserAccountId) {
                            enrollmentReqTemplate.createdByID = enrollmentContextResponse.requesterUserAccountId // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                        } else {
                            enrollmentReqTemplate.createdByID = requestedUser
                        }
                        if (enrollmentContextResponse.requesterUserAccountId) {
                            enrollmentReqTemplate.updatedByID = enrollmentContextResponse.requesterUserAccountId // Need to get dynamic requester Name from Ping, If not present in ping send as ID
                        } else {
                            enrollmentReqTemplate.updatedByID = requestedUser
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

                            } else {
                                activeEnrollmentsWithoutPreReq["id"] = enrollmentReqId._id
                                activeEnrollmentsWithoutPreReq["platformInfo"] = {
                                    "helpdeskContactId": "72ed3dfc-9e6e-4583-b910-3b8498381201"
                                }
                            }

                        }
                    }
                }
                return outcome
            } else {
                return {
                    code: 400,
                    message: isRoleAppValid.message
                }
            }
        } else {
            return {
                code: 500,
                message: 'Unknown error'
            }
        }


    } catch (error) {
        logger.error("Error Occurred in enrollmentReqLogic Function " + error)
        return {
            code: 500,
            message: JSON.stringify(error)
        }

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
                            return {
                                code: 1,
                                message: "Business App ID and Role Appid is not matching"
                            }
                        }

                        logger.error("Inside checkRoleAndApplication businessAppResponse are --> " + businessAppResponse)
                        logger.error("long if condition: " + !(roleResponse.result[0].accessPolicy._refResourceId !== null && roleResponse.result[0].accessPolicy._refResourceId));
                        if (!(roleResponse.result[0].accessPolicy._refResourceId !== null && roleResponse.result[0].accessPolicy._refResourceId)) {
                            return {
                                code: 1,
                                message: "policy not present"
                            }
                        } else {
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
                                                return {
                                                    code: 400,
                                                    message: 'Mutually Exclusive Role Present'
                                                };
                                            }

                                        }
                                    }


                                    if (policyResponse.result[0].preRequisites !== null && policyResponse.result[0].preRequisites.length > 0) {
                                        withPrereqCount++
                                    } else {
                                        withoutPrereqCount++
                                    }

                                }

                            } else {
                                return {
                                    code: 1,
                                    message: "Invalid Policy Configuration"
                                }
                            }

                        }

                    } else {
                        return {
                            code: 1,
                            message: "Business App or Role is not valid in Context"
                        }
                    }


                } else if (applicationRoles[i].applicationId !== null && applicationRoles[i].applicationId && applicationRoles[i].roleId === null && !applicationRoles[i].roleId) {
                    if (getBusinessAppDetails(0, applicationRoles[i].applicationId)) {
                        withoutRoleCount++
                    }
                } else {
                    logger.error("APP ID isn not Present")
                    return {
                        code: 1,
                        message: "App ID not present"
                    }
                }
                // return {code:1, message: "Conflict : withPrereqCount  "+ withPrereqCount +"withoutPrereqCount "+ withoutPrereqCount+"App without Role "+ withoutRoleCount}
            }
            logger.error("Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount)
            if (withPrereqCount > 0 && withoutPrereqCount > 0 && withoutRoleCount > 0) {
                return {
                    code: 1,
                    message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount
                }
            } else if (withPrereqCount > 0 && withoutPrereqCount === 0 && withoutRoleCount > 0) {
                return {
                    code: 1,
                    message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount
                }
            } else if (withPrereqCount === 0 && withoutPrereqCount > 0 && withoutRoleCount > 0) {
                return {
                    code: 0,
                    message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount
                }
            } else if (withPrereqCount == 0 && withoutPrereqCount == 0 && withoutRoleCount > 0) {
                return {
                    code: 2,
                    message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount
                }
            } else if (withPrereqCount > 0 && withoutPrereqCount > 0 && withoutRoleCount === 0) {
                return {
                    code: 3,
                    message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount
                }
            } else {
                return {
                    code: 3,
                    message: "Conflict : withPrereqCount  " + withPrereqCount + "withoutPrereqCount " + withoutPrereqCount + "App without Role " + withoutRoleCount
                }
            }

        }

    } catch (error) {
        return {
            code: 1,
            message: "error " + error
        }
    }
}

function getExpiryDate(option, value) {
    try {
        option = Number(option)
        const currentTimeinEpoch = Date.now() // Current time in milliseconds (epoch)
        const currentDate = new Date().toISOString() // Current date in ISO format (e.g., "2025-07-15T15:12:34.567Z")
        const currentDateObject = new Date(currentDate) // Convert the ISO string into a Date object

        let expiryDate;

        switch (option) {
            case 0: // Daily
                // getExpiryDate(0, null);
                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000) // Add one day (24 hours) to the current time
                break;
            case 1: // Weekly
                // getExpiryDate(1, null);
                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000) // Add one week (7 days)
                break;
            case 2: // Monthly
                // getExpiryDate(2, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 1) // Add one month to the current date
                break;
            case 3: // Quarterly
                // getExpiryDate(3, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 3) // Add 3 months to the current date
                break;
            case 4: // Semi-Annually
                // getExpiryDate(4, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setMonth(currentDateObject.getMonth() + 6) // Add 6 months to the current date
                break;
            case 5: // Annually
                // getExpiryDate(5, null);
                expiryDate = new Date(currentDateObject);
                expiryDate.setFullYear(currentDateObject.getFullYear() + 1) // Add 1 year to the current date
                break;
            case 6: // On Specific Day and Month (not year)
                // getExpiryDate(6, "12-25");
                const [month, day] = value.split('-');
                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day) // Set to the specified day and month of the current year
                if (expiryDate < currentDateObject) {
                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1) // If the date is already passed this year, set it to the next year
                }
                break;
            case 7: // Number of Days
                // getExpiryDate(7, 10);
                value = Number(value)
                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000) // Add 'value' days in milliseconds
                break;
            case 8: // On Specific Due Date
                //getExpiryDate(8, "2025-12-31");
                expiryDate = new Date(value); // Assuming 'value' is a string in the format "YYYY-MM-DD"
                break;
            default:
                return {
                    code: 400, message: "Invalid Input"
                }
        }

        const expiryEpochMillis = new Date(expiryDate).getTime() // Convert expiry date to epoch milliseconds
        expiryDate = expiryDate.toISOString();
        return {
            expiryEpochMillis,
            expiryDate
        };

    } catch (error) {
        return {
            code: 400,
            message: "Error Occurred While getExpiryDate "
        }
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
            } else if (response.code) {
                return {
                    code: response.code,
                    message: response.message
                }
            } else {
                return false
            }
        }

    } catch (error) {
        return {
            code: 400,
            message: "Error Occurred while checkIfRoleProvisioned " + error.message
        }

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
        } else {
            logger.error("User Prereq Not Found")
            return null
        }
    } catch (error) {
        logger.error("Error Occurred While Getting Prerequsite Summary" + error)
        return {
            code: 400,
            message: "Error Occurred while Prereq Summary " + error.message
        }
    }

}




// Cancel Enrollemt Function

function CancelEnrollment(enrollmentRequestId, userId) {
    try {
        logger.error("Inside CancelEnrollment function")
        const getEnrollmentResponse = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": '/status eq "' + "IN_PROGRESS" + '"' + ' AND recordState eq "' + "ACTIVE" + '"' + ' AND requestedUserId eq "' + userId + '"' +
                ' AND _id eq "' + enrollmentRequestId + '"'
        }, ["*"])

        logger.error("Inside CancelEnrollment function --> getEnrollmentResponse" + getEnrollmentResponse)

        if (getEnrollmentResponse !== null && getEnrollmentResponse.resultCount > 0) {
            logger.error("Inside CancelEnrollment function --> getEnrollmentResponse User Id is " + getEnrollmentResponse.result[0].requestedUserId)

            const userPrereCancelResponse = cancelUserPrereq(enrollmentRequestId, getEnrollmentResponse.result[0].requestedUserId, "CANCELLED", 3)
            if (userPrereCancelResponse) {
                const cancelEnrollmetReqResponse = CancelEnrollmetRequest(enrollmentRequestId, getEnrollmentResponse.result[0].requestedUserId)
                if (cancelEnrollmetReqResponse && cancelEnrollmetReqResponse._id) {
                    // Get user details and app name for email
                    const userDetails = openidm.read("managed/alpha_user/" + getEnrollmentResponse.result[0].requestedUserId, null, ["mail"]);
                    const appName = getEnrollmentResponse.result[0].appSystemName[0];
                    
                    // Cancel workflow with basic email details (no reason provided in this function)
                    cancelWorkflowRequest(
                        enrollmentRequestId,
                        userDetails ? userDetails.mail : "",
                        appName,
                        "User cancelled the request"  // Default reason since this function doesn't have reason parameter
                    );

                    return {
                        "status": "success",
                        "payload": {
                            "id": cancelEnrollmetReqResponse._id
                        },
                        "message": "Enrollment request has been successfully cancelled"
                    }
                } else {
                    return {
                        code: 400,
                        message: "Error Occurred while CancelEnrollment"
                    }
                }

            } else {
                return {
                    code: 400,
                    message: "Error Occurred while CancelUserPrereq"
                }
            }

        } else {
            return {
                code: 400,
                message: "EnrollmetRequest Not Found"
            }
        }

    } catch (error) {
        logger.error("Erorr Occurred while cancelleing the enrollment request " + error)
        return {
            code: 400,
            message: "EnrollmetRequest Not Found"
        }
    }

}



// Cancel Enrollemt Function with comment and multiple inputs

function CancelEnrollmentWithComment(payload) {
        var eventCode = "ENM001" ;
        var eventDetails = {
                    "reason" : payload.confirmation.reason,
                    "comment" :payload.confirmation.comment
                }
        var eventName = "Enrollment Cancellation Success" ;
        var userDetails ;
        var appName ="";

    try {

        var comment = payload.confirmation.comment;
        var reason = payload.confirmation.reason;
        var requesterUserId = payload.requesterUserId;
       
        
        let patchResponse = {
            "status": "success",
            "message": "Enrollment request has been successfully cancelled"
        };

        var patchPayload = [];

        var enrollmentRequestIdArray = payload.enrollmentRequestIds;
        if (!enrollmentRequestIdArray || enrollmentRequestIdArray.length != 0) {

            enrollmentRequestIdArray.forEach(enrollmentRequestId => {

                logger.error("Inside CancelEnrollment function")
                const getEnrollmentResponse = openidm.query("managed/alpha_kyid_enrollment_request/", {
                    "_queryFilter": '(recordState eq "ACTIVE" or recordState eq "0")' +' AND _id eq "' + enrollmentRequestId + '"'
                }, ["*"])

                  logger.error("Inside CancelEnrollment function --> getEnrollmentResponse" + JSON.stringify(getEnrollmentResponse));

                if (getEnrollmentResponse !== null && getEnrollmentResponse.resultCount > 0) {
                    logger.error("Inside CancelEnrollment function --> getEnrollmentResponse User Id is " + getEnrollmentResponse.result[0].requestedUserId)

                    const userPrereCancelResponse = cancelUserPrereq(enrollmentRequestId, getEnrollmentResponse.result[0].requestedUserId, "CANCELLED", 3)

                    logger.error("Inside CancelEnrollmentwithComment function --> userPrereCancelResponse" + userPrereCancelResponse)

                    var userID = getEnrollmentResponse.result[0].requestedUserId;

                        // get details of user ot send email
                    logger.error(" Enrollment cancel request email : requester ID "+userID);
                    userDetails =  openidm.read("managed/alpha_user/" + userID, null, ["*"]);

                    if (userPrereCancelResponse) {
                        const cancelEnrollmetReqResponse = CancelEnrollmetRequestWithComment(enrollmentRequestId, requesterUserId, reason, comment);
                        if (cancelEnrollmetReqResponse && cancelEnrollmetReqResponse._id) {
                            patchPayload.push({
                                "id": cancelEnrollmetReqResponse._id,
                                status: "0"
                            })
                        } else {
                            patchPayload.push({
                                "id": cancelEnrollmetReqResponse._id,
                                status: "1"
                            })

                            // Add ENM002 audit log for CancelEnrollmetRequestWithComment failure
                            eventCode = "ENM002";
                            eventName = "Enrollment Cancellation Failure";
                            eventDetails = {
                                error: "Failed to update enrollment request with comment",
                                enrollmentRequestId: enrollmentRequestId,
                                userId: userID,
                                reason: reason,
                                comment: comment,
                                failurePoint: "CancelEnrollmetRequestWithComment returned invalid response",
                                response: JSON.stringify(cancelEnrollmetReqResponse)
                            };

                            appName = getEnrollmentResponse.result[0].appSystemName ? getEnrollmentResponse.result[0].appSystemName[0] : "";

                            auditLogger(eventCode, eventName, payload.auditLoggerObj.sessionDetailsauditLogger,
                                        eventDetails, requesterUserId, userDetails._id,
                                        payload.auditLoggerObj.transactionIdauditLogger, userDetails.mail,
                                        appName, payload.auditLoggerObj.sessionRefIDauditLogger);
                        }

            
           
                        //   Send email to end user
                      appName2 = getEnrollmentResponse.result[0].roleContext[0].appName;
                      logger.error("Test = "+getEnrollmentResponse.result[0].roleContext[0]);

                        logger.error(" Enrollment cancel request email : app name "+getEnrollmentResponse.result[0].appSystemName +" Date :"+new Date().toISOString()+" reason :"+payload.confirmation.reason+" givenName :"+userDetails.givenName+" sn :"+userDetails.sn+" mail :"+userDetails.mail);
logger.error(" Enrollment cancel request email : app name "+appName2 +" Date :"+new Date().toISOString()+" reason :"+payload.confirmation.reason+" givenName :"+userDetails.givenName+" sn :"+userDetails.sn+" mail :"+userDetails.mail);

                        appName = getEnrollmentResponse.result[0].appSystemName[0];
                      
                      var easternTimeStamp = isoToEastern();
       

                        sendEmail(appName2, easternTimeStamp, payload.confirmation.reason, userDetails.givenName, userDetails.sn, userDetails.mail) ;
                
                        // Cancel workflow and send emails to approvers with Helpdesk context
                        cancelWorkflowForHelpdesk(enrollmentRequestId, getEnrollmentResponse.result[0], requesterUserId, reason, comment);

               

                        auditLogger(eventCode, eventName, payload.auditLoggerObj.sessionDetailsauditLogger, eventDetails, requesterUserId, userDetails._id, payload.auditLoggerObj.transactionIdauditLogger, userDetails.mail, appName, payload.auditLoggerObj.sessionRefIDauditLogger);

                    } else {
                        // userPrereCancelResponse failed
                        patchPayload.push({
                            code: 400,
                            message: enrollmentRequestId+" : Error Occurred while CancelUserPrereq"
                        })

                        eventCode = "ENM002";
                        eventName = "Enrollment Cancellation Failure";
                        eventDetails = {
                            error: "Failed to cancel user prerequisites",
                            enrollmentRequestId: enrollmentRequestId,
                            userId: userID,
                            reason: reason,
                            comment: comment,
                            failurePoint: "cancelUserPrereq returned error"
                        };

                        auditLogger(eventCode, eventName, payload.auditLoggerObj.sessionDetailsauditLogger,
                                    eventDetails, requesterUserId, userID,
                                    payload.auditLoggerObj.transactionIdauditLogger, userDetails ? userDetails.mail : null,
                                    appName, payload.auditLoggerObj.sessionRefIDauditLogger);
                    }

                } else {
                    patchPayload.push({
                        code: 400,
                        message: enrollmentRequestId+" : EnrollmetRequest Not Found"
                    })

                    // Add ENM002 audit log for enrollment not found
                    eventCode = "ENM002";
                    eventName = "Enrollment Cancellation Failure";
                    eventDetails = {
                        error: "Enrollment request not found in batch cancellation",
                        enrollmentRequestId: enrollmentRequestId,
                        reason: payload.confirmation ? payload.confirmation.reason : "",
                        comment: payload.confirmation ? payload.confirmation.comment : "",
                        failurePoint: "Query returned no results in CancelEnrollmentWithComment"
                    };

                    auditLogger(eventCode, eventName, payload.auditLoggerObj.sessionDetailsauditLogger,
                                eventDetails, payload.requesterUserId, null,
                                payload.auditLoggerObj.transactionIdauditLogger, null, "",
                                payload.auditLoggerObj.sessionRefIDauditLogger);
                }

            });
        }
        return patchPayload;


    } catch (error) {
        logger.error("Erorr Occurred while cancelleing the enrollment request " + error)
          eventCode = "ENM002" ;
          eventName = "Enrollment Cancellation Failure" ;
        var eventDetails = {
                    "reason" : payload.confirmation.reason,
                    "comment" :payload.confirmation.comment,
                    "Error" : "Error in cancelling enrollment"
                }

        auditLogger(eventCode, eventName, payload.auditLoggerObj.sessionDetailsauditLogger, eventDetails, payload.requesterUserId, userDetails._id, payload.auditLoggerObj.transactionIdauditLogger, userDetails.mail, appName, payload.auditLoggerObj.sessionRefIDauditLogger);
        return {
            code: 400,
            message: "EnrollmetRequest Not Found"
        }
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
            "field": "updatedByID",
            "value": "KYID-System"
        }
        jsonArray.push(jsonObj)
        jsonObj = {
            "operation": "replace",
            "field": "updatedBy",
            "value": "KYID-System"
        }
        jsonArray.push(jsonObj)

        const response = openidm.patch("managed/alpha_kyid_enrollment_request/" + enrollmentRequestId, null, jsonArray);
        if (response) {
            logger.error("CancelEnrollmetRequest Response is --> " + response)

            return response
        } else {
            return {
                code: 400,
                message: "Error while CancelEnrollmetRequest "
            }
        }




    } catch (error) {
        logger.error("Error Occurred while CancelEnrollmetRequest " + error)
        return {
            code: 400,
            message: "Error while CancelEnrollmetRequest " + error
        }
    }

}


function CancelEnrollmetRequestWithComment(enrollmentRequestId, userId, reason, comment) {
    logger.error("inside CancelEnrollmetRequestWithComment ");
    try {

        let currentTimeinEpoch = Date.now()
        let currentDate = new Date().toISOString()
        logger.error("UserId: --> "  + "currentTimeinEpoch: -- > " + currentTimeinEpoch + "currentDate--> " + currentDate)
        let jsonArray = [];
       jsonArray = [
        {
            "operation": "replace",
            "field": "/status",
            "value": "CANCELLED"
        },
         {
            "operation": "replace",
            "field": "/recordState",
            "value": "1"
        },
        {
            operation: "replace",
            field: "/updateDateEpoch",
            value: currentTimeinEpoch
        },
        {
            operation: "replace",
            field: "/updateDate",
            value: currentDate
        },
        {
            operation: "replace",
            field: "/updatedByID",
            value: "KYID-System"
        },{
            operation: "replace",
            field: "/updatedBy",
            value: "KYID-System"
        },{
            operation: "add",
            field: "/audit/",
            value: {
                "action": "delete",
                "reason": reason,
                "comment": comment,
                "requesterUserId": userId
            }
            }];
        
        
     //   jsonArray.push(jsonObj)

        logger.error("CancelEnrollmetRequestwithComment Request jsonArray is --> " + JSON.stringify(jsonArray));

        logger.error("CancelEnrollmetRequestwithComment Request enrollmentRequestId is --> " + enrollmentRequestId)

        const response = openidm.patch("managed/alpha_kyid_enrollment_request/" + enrollmentRequestId, null, jsonArray);
        if (response) {
            logger.error("CancelEnrollmetRequest Response is --> " + response)

            return response
        } else {
            return {
                code: 400,
                message: "Error while CancelEnrollmetRequest "
            }
        }

    


    } catch (error) {
        logger.error("Error Occurred while CancelEnrollmetRequest " + error)
        return {
            code: 400,
            message: "Error while CancelEnrollmetRequest " + error
        }
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
            } else {
                return {
                    code: 400,
                    message: "Error Occurred while getCompletedPrereq "
                }
            }
        }
    } catch (error) {
        logger.error("Error Occurred while getCompletedPrereq " + error)
        return {
            code: 400,
            message: "Error Occurred while getCompletedPrereq " + error
        }

    }

}

function getUserRequestByRequestedUserIdAndStatus(requestedUserId, status, returnParams) {
    try {
        var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": '/requestedUserId/ eq "' + requestedUserId + '"' + ' AND status eq "' + status + '"'
        }, returnParams);

        if (response.resultCount > 0) {
            return response
        } else {
            return false
        }
    } catch (error) {
        throw {
            code: 500,
            message: error
        };
    }
}

function getUserRequestByappSystemNameAndStatus(appSystemName, status, returnParams) {
    try {
        var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": '/appSystemName/ eq "' + appSystemName + '"' + ' AND status eq "' + status + '"'
        }, returnParams);

        if (response.resultCount > 0) {
            return response
        } else {
            return false
        }
    } catch (error) {
        throw {
            code: 500,
            message: error
        };
    }
}


function getActiveEnrollmentByAppAndUser(queryFilter) {
    try {
        var dataArray = [];

        var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": '/requestedUserId/ eq "' + queryFilter.requestedUserAccountId + '"' + ' AND status eq "' + queryFilter.status + '"' + ' AND (recordState eq "ACTIVE" or recordState eq "0" ) '
        }, ["*", "*_ref/*"]);

        logger.error("kyid custom endpoint enrollment getActiveEnrollmentByAppAndUser response: " + response);


        for (let j = 0; j < response.result.length; j++) {
            var currentActiveEnrollment = response.result[j];

            var roleIds = currentActiveEnrollment.roleIds;


            var businessAppResponse = openidm.query("managed/alpha_kyid_businessapplication/", {
                "_queryFilter": 'roleAppId/_refResourceId eq "' + roleIds[0]._id + '"'
            }, ["*"]);

            logger.error("kyid enrollment getActiveEnrollmentByAppAndUser businessApp: " + businessAppResponse);

            // Get Business appResults
            if (!businessAppResponse || businessAppResponse.result.length === 0) {
                logger.error("No Business applications found for roleId: " + roleIds[0]._id);
                continue; // Skip if no apps found
            }

            var businessApp = businessAppResponse.result[0];

            if (businessApp._id != queryFilter.businessAppId) {
                continue;
            } else {
                logger.error("kyid custom endpoint enrollment getActiveEnrollmentByAppAndUser currentActiveEnrollment: " + currentActiveEnrollment);
                var userPrerequisiteListResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                    "_queryFilter": '/enrollmentRequestId/ eq "' + currentActiveEnrollment._id + '"'
                }, ["*", "*_ref/*"]);
                var userPrerequisiteList = userPrerequisiteListResponse.result;
                logger.error("kyid custom endpoint enrollment getActiveEnrollmentByAppAndUser userPrerequisiteList: " + userPrerequisiteList);
                var associatedPrerequisites = [];

                var helpDeskContactId = "";
                if (businessApp.applicationHelpdeskContact) {
                            helpDeskContactId = businessApp.applicationHelpdeskContact._refResourceId
                        }

                if (!userPrerequisiteList || userPrerequisiteList.length === 0) {
                    logger.error("No Pre-req : found ");
                    continue; // Skip if no apps found
                }

                for (let i = 0; i < userPrerequisiteList.length; i++) {
                    var prereq =  userPrerequisiteList[i].preRequisiteId.displayName;
                    associatedPrerequisites.push(prereq);
                }

                var roleIds = currentActiveEnrollment.roleIds;
                var dataEntry = {
                    "id": j + 1,
                    "roleDisplayName": {
                        "en": roleIds[0].content[0].name["en"],
                        "es": roleIds[0].content[0].name["en"]
                    },
                    "roleDisplayDescription": {
                        "en": roleIds[0].content[0].description.en,
                        "es": roleIds[0].content[0].description.en,
                    },
                    "enrollmentId": currentActiveEnrollment._id,
                    "creationDate": currentActiveEnrollment.createDate,
                    "expiryDate": currentActiveEnrollment.expiryDate,
                    "associatePrerequisites": associatedPrerequisites,
                    "helpDeskContactId": helpDeskContactId
                }

           //if there are no pre-req then send the details
              //  if (associatedPrerequisites.length > 0) {
                    dataArray.push(dataEntry);
               //}
            }


        }


        let returnPayload = {
            "responseCode": 0,
            "transactionId": request.content.transactionId,
            "message": {
                "content": "Success",
                "code": "0"
            },
            "payload": {
                "data": {
                    "data": dataArray
                }
            }
        }
        return returnPayload;
    } catch (error) {
        let returnPayload = {
            "responseCode": 2,
            "transactionId": request.content.transactionId,
            "message": {
                "content": error,
                "code": "2"
            }
        }
        return returnPayload;
    }
}

function getActiveEnrollmentByUser(queryFilter) {
    logger.error("kyid enrollment getActiveEnrollmentByUser");
    try {
        var dataArray = [];

        var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": '/requestedUserId/ eq "' + queryFilter.requestedUserAccountId + '"' + ' AND status eq "' + queryFilter.status + '"' + ' AND (recordState eq "ACTIVE" or recordState eq "0" )'
        }, ["*", "*_ref/*"]);

        logger.error("kyid enrollment getActiveEnrollmentByUser response: " + response);

        var currentActiveEnrollments = response.result;
        for (let i = 0; i < currentActiveEnrollments.length; i++) {
            var currentEnrollment = currentActiveEnrollments[i];
            logger.error("kyid enrollment getActiveEnrollmentByUser currentEnrollment: " + currentEnrollment);

            var roleIds = currentEnrollment.roleIds;


            var businessAppResponse = openidm.query("managed/alpha_kyid_businessapplication/", {
                "_queryFilter": 'roleAppId/_refResourceId eq "' + roleIds[0]._id + '"'
            }, ["*"]);

            if (!businessAppResponse || businessAppResponse.result.length === 0) {
                logger.error("No Business applications found for roleId: " + roleIds[0]._id);
                continue; // Skip if no apps found
            }

            var userDetails = getUserDetails(currentEnrollment.requestedUserId);
              
            var userPrerequisiteListResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                    "_queryFilter": '/enrollmentRequestId/ eq "' + currentEnrollment._id + '"'
                }, ["*", "*_ref/*"]);


            var associatedPrerequisites = [];
                if (userPrerequisiteListResponse && userPrerequisiteListResponse.result.length > 0) {
                    var userPrerequisiteList = userPrerequisiteListResponse.result;
                    logger.error("kyid custom endpoint enrollment getActiveEnrollmentByAppAndUser userPrerequisiteList: " + userPrerequisiteList);

                    for (let i = 0; i < userPrerequisiteList.length; i++) {
                        if (userPrerequisiteList[i].preRequisiteId != null) {
                            var prereq = userPrerequisiteList[i].preRequisiteId.displayName;
                            associatedPrerequisites.push(prereq);
                        }
                    }
                }

            logger.error("kyid enrollment getActiveEnrollmentByUser businessApp: " + businessAppResponse);

            var businessApp = businessAppResponse.result[0];

            var dataEntry = {
                "firstName": userDetails.givenName,
                "lastName": userDetails.sn,
                "email": userDetails.mail,
                "enrollmentId": currentEnrollment._id,
                "applicationId": businessApp._id,
                "applicationName": businessApp.name,
                "applicationLogo": businessApp.logoFileName,
                "roleName": {
                    "en": roleIds[0].content[0].name["en"],
                    "es": roleIds[0].content[0].name["en"]
                },
                "roleDescription": {
                        "en": roleIds[0].content[0].description.en,
                        "es": roleIds[0].content[0].description.en
                    },
                "creationDate": currentEnrollment.createDate,
                "expiryDate": currentEnrollment.expiryDate,
                "associatePrerequisites": associatedPrerequisites,
                "id": currentEnrollment._id
            }

            dataArray.push(dataEntry);



        }
        let returnPayload = {
            "responseCode": 0,
            "transactionId": request.content.transactionId,
            "message": {
                "content": "Success",
                "code": "0"
            },
            "payload": {
                "data": {
                    "activeEnrollments": dataArray
                }
            }
        }
        return returnPayload;
    } catch (error) {
        let returnPayload = {
            "responseCode": 2,
            "transactionId": request.content.transactionId,
            "message": {
                "content": error,
                "code": "2"
            }
        }
        return returnPayload;
    }
}

function getDelegatedEnrollments(queryFilter) {
    logger.error("kyid enrollment getActiveEnrollmentByUser");
    try {
        var dataArray = [];
        // Build base query with proper parentheses for correct precedence
        let query = `(roleContext[orginalDelegatorId eq '${queryFilter.requestedUserAccountId}'] OR roleContext[currentDelegatorId eq '${queryFilter.requestedUserAccountId}']) AND (recordState eq '0' OR recordState eq 'ACTIVE')`

        // Add status filter
        if (queryFilter.status !== null && queryFilter.status !== undefined) {
            // User specified a status, filter by it
            query += ` AND status eq '${queryFilter.status}'`;
        } else {
            // User didn't specify status, exclude CANCELLED by default using NOT operator
            query += ` AND !(status eq 'CANCELLED')`;
        }

        // Log the final query for debugging
        logger.error("DEBUG: getDelegatedEnrollments query: " + query);

        // var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
        //     "_queryFilter": '/originalDele/ eq "' + queryFilter.requestedUserAccountId + '"' + ' AND status eq "' + queryFilter.status + '"' + ' AND (recordState eq "ACTIVE" or recordState eq "0" )'
        // }, ["*", "*_ref/*"]);
        var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": query
        }, ["*", "*_ref/*"]);

        logger.error("kyid enrollment getActiveEnrollmentByUser response: " + response);

        var currentActiveEnrollments = response.result;
        for (let i = 0; i < currentActiveEnrollments.length; i++) {
            var currentEnrollment = currentActiveEnrollments[i];
            logger.error("kyid enrollment getActiveEnrollmentByUser currentEnrollment: " + currentEnrollment);

            var roleIds = currentEnrollment.roleIds;

            // Check if roleIds exists and has at least one element
            if (!roleIds || !Array.isArray(roleIds) || roleIds.length === 0 || !roleIds[0] || !roleIds[0]._id) {
                logger.error("DEBUG: Invalid or missing roleIds for enrollment: " + currentEnrollment._id);
                continue; // Skip this enrollment
            }

            var businessAppResponse = openidm.query("managed/alpha_kyid_businessapplication/", {
                "_queryFilter": 'roleAppId/_refResourceId eq "' + roleIds[0]._id + '"'
            }, ["*"]);

            if (!businessAppResponse || businessAppResponse.result.length === 0) {
                logger.error("No Business applications found for roleId: " + roleIds[0]._id);
                continue; // Skip if no apps found
            }

            var userDetails = getUserDetails(currentEnrollment.requestedUserId);
              
            var userPrerequisiteListResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                    "_queryFilter": '/enrollmentRequestId/ eq "' + currentEnrollment._id + '"'
                }, ["*", "*_ref/*"]);


            var associatedPrerequisites = [];
                if (userPrerequisiteListResponse && userPrerequisiteListResponse.result.length > 0) {
                    var userPrerequisiteList = userPrerequisiteListResponse.result;
                    logger.error("kyid custom endpoint enrollment getActiveEnrollmentByAppAndUser userPrerequisiteList: " + userPrerequisiteList);

                    for (let i = 0; i < userPrerequisiteList.length; i++) {
                        if (userPrerequisiteList[i].preRequisiteId != null) {
                            var prereq = userPrerequisiteList[i].preRequisiteId.displayName;
                            associatedPrerequisites.push(prereq);
                        }
                    }
                }

            logger.error("kyid enrollment getActiveEnrollmentByUser businessApp: " + businessAppResponse);

            var businessApp = businessAppResponse.result[0];

            var dataEntry = {
                "firstName": userDetails.givenName,
                "lastName": userDetails.sn,
                "email": userDetails.mail,
                "enrollmentId": currentEnrollment._id,
                "applicationId": businessApp._id,
                "applicationName": businessApp.name,
                "applicationLogo": businessApp.logoFileName,
                "roleName": {
                    "en": roleIds[0].content[0].name["en"],
                    "es": roleIds[0].content[0].name["en"]
                },
                "roleDescription": {
                        "en": roleIds[0].content[0].description.en,
                        "es": roleIds[0].content[0].description.en
                    },
                "creationDate": currentEnrollment.createDate,
                "expiryDate": currentEnrollment.expiryDate,
                "associatePrerequisites": associatedPrerequisites,
                "id": currentEnrollment._id
            }

            dataArray.push(dataEntry);



        }
        let returnPayload = {
            "responseCode": 0,
            "transactionId": request.content.transactionId,
            "message": {
                "content": "Success",
                "code": "0"
            },
            "payload": {
                "data": {
                    "activeEnrollments": dataArray
                }
            }
        }
        return returnPayload;
    } catch (error) {
        logger.error("DEBUG: getDelegatedEnrollments error: " + error);
        logger.error("DEBUG: Error stack: " + (error.stack || "No stack trace"));
        let returnPayload = {
            "responseCode": 2,
            "transactionId": request.content.transactionId,
            "message": {
                "content": error.toString(),
                "code": "2"
            }
        }
        return returnPayload;
    }
}




function getActiveEnrollmentByApp(queryFilter) {
    logger.error("kyid enrollment getActiveEnrollmentByApp");
    try {
        var dataArray = [];

        var response = openidm.query("managed/alpha_kyid_enrollment_request/", {
            "_queryFilter": 'appSystemName eq "' + queryFilter.appSystemName + '"' + ' AND status eq "' + queryFilter.status + '"' + ' AND  (recordState eq "ACTIVE" or recordState eq "0" ) '
        }, ["*", "*_ref/*"]);

        logger.error("kyid enrollment getActiveEnrollmentByApp response: " + response);

        if (response || response.result.length != 0) {

            var currentActiveEnrollments = response.result;
            for (let i = 0; i < currentActiveEnrollments.length; i++) {
                var currentEnrollment = currentActiveEnrollments[i];
                logger.error("kyid enrollment getActiveEnrollmentByUser currentEnrollment: " + currentEnrollment);

                var roleIds = currentEnrollment.roleIds;

                if (!roleIds || roleIds.length === 0) {
                    logger.error("No roles found for the enrollment ID " + currentEnrollment);
                    continue; // Skip if no apps found
                }

                var userDetails = getUserDetails(currentEnrollment.requestedUserId);

                var businessAppResponse = openidm.query("managed/alpha_kyid_businessapplication/", {
                    "_queryFilter": 'roleAppId/_refResourceId eq "' + roleIds[0]._id + '"'
                }, ["*"]);

                if (!businessAppResponse || businessAppResponse.result.length === 0) {
                    logger.error("No Business applications found for roleId: " + roleIds[0]._id);
                    continue; // Skip if no apps found
                }

                var userPrerequisiteListResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                    "_queryFilter": '/enrollmentRequestId/ eq "' + currentEnrollment._id + '"'
                }, ["*", "*_ref/*"]);

                var associatedPrerequisites = [];
                if (userPrerequisiteListResponse || userPrerequisiteListResponse.result.length > 0) {
                    var userPrerequisiteList = userPrerequisiteListResponse.result;
                    logger.error("kyid custom endpoint enrollment getActiveEnrollmentByAppAndUser userPrerequisiteList: " + userPrerequisiteList);

                    for (let i = 0; i < userPrerequisiteList.length; i++) {
                        if (userPrerequisiteList[i].preRequisiteId != null) {
                            var prereq = userPrerequisiteList[i].preRequisiteId.displayName;
                            associatedPrerequisites.push(prereq);
                        }
                    }
                }else{
                    // Skipping adding of enrollment if no Pre-req found
                    continue;
                }

              

                logger.error("kyid enrollment getActiveEnrollmentByUser businessApp: " + businessAppResponse);

                var businessApp = businessAppResponse.result[0];

                var dataEntry = {
                    "firstName": userDetails.givenName,
                    "lastName": userDetails.sn,
                    "email": userDetails.mail,
                    "enrollmentId": currentEnrollment._id,
                    "applicationId": businessApp._id,
                    "applicationName": businessApp.name,
                    "applicationLogo": businessApp.logoFileName,
                    "roleName": {
                        "en": roleIds[0].content[0].name["en"],
                        "es": roleIds[0].content[0].name["en"]
                    },
                    "roleDescription": {
                        "en": roleIds[0].content[0].description.en,
                        "es": roleIds[0].content[0].description.en
                    },
                    "creationDate": currentEnrollment.createDate,
                    "expiryDate": currentEnrollment.expiryDate,
                    "associatePrerequisites": associatedPrerequisites,
                    "id": currentEnrollment._id
                }

                dataArray.push(dataEntry);

            }

        }
        let returnPayload = {
            "responseCode": 0,
            "transactionId": request.content.transactionId,
            "message": {
                "content": "Success",
                "code": "0"
            },
            "payload": {
                "data": {
                    "data": dataArray
                }
            }
        }
        return returnPayload;
    } catch (error) {
        let returnPayload = {
            "responseCode": 2,
            "transactionId": request.content.transactionId,
            "message": {
                "content": error,
                "code": "2"
            }
        }
        return returnPayload;
    }
}

// Send Email
function sendEmail(applicationName,updatedTime,reason, givenName, sn, mail) {
    try {
        logger.error("applicationName is -->" + applicationName)
        var params = new Object();
        var phoneContact = null;
      var appName = "KYID Helpdesk";

        try{
            var userQueryResult2 = openidm.query("managed/alpha_kyid_helpdeskcontact",{_queryFilter: 'name eq "' + appName + '"'},["phoneContact", "emailContact"]); 
            phoneContact=userQueryResult2.result[0].phoneContact[0].phoneNumber;
        }      
        catch(error){
            logger.error("Error in catch of helpdesk retrieval :: => "+ error);
        }
        params.templateName = "kyid2B1EnrollmentCancelToEndUser";
        params.to = mail;
        params._locale = "en";
        params.object = {
            "applicationName": applicationName,
            "sn": sn,
            "givenName" : givenName,
            "updatedTime" : updatedTime,
            "reason"  : reason,
            "phoneContact": phoneContact
        };

     //   params.object.requestUri = "https://sso.dev2.kyid.ky.gov/am/XUI/?realm=alpha&authIndexType=service&authIndexValue=RIDP_kyid_2B1_MasterLogin&contextId=" + contextId

        logger.error("Enrollment cancellation Email Params: " + JSON.stringify(params));

        var response = openidm.action("external/email", "sendTemplate", params);
        logger.error("Enrollment cancellation Email Sent SuccessFully to: " + mail)
        if (response) {
            return response
        }
        else {
            // invalidRequestException.message.content = `Invalid request. The request does not contain the required parameters. Missing parameter(s): "request.content"`
            // invalidRequestException.timestamp = new Date().toISOString()

            throw "invalidRequestException"
        }

    }
    catch (error) {
        logger.error("Error Occurred while sending Email to ::" + mail + " error::" + error);
        /* Throw invalid request exception. */
        throw error

    }
}

function currentDate() {
    let currentDate = Date.now();
    return new Date(current).toISOString();

}

/**
 * @name {isoToEastern}
 * @description Method returns current date EST format
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

function getInProgressApproval(workflowRequest) {
    if (!workflowRequest || !workflowRequest.decision) {
        return null;
    }
    
    var requestPhases = workflowRequest.decision.phases;
    
    if (!requestPhases || requestPhases.length === 0) {
        return null;
    }
    
    var inProgressApproval;
    for (let i=0; i<requestPhases.length; i++) {
        // Check for various possible status values that indicate in-progress
        var phaseStatus = requestPhases[i].status ? requestPhases[i].status.toLowerCase() : "";
        if (phaseStatus == "in-progress" || phaseStatus == "in_progress" || phaseStatus == "active" || phaseStatus == "pending") {
            inProgressApproval = requestPhases[i];
            break;
        }
    }
    
    // If no in-progress phase found, but workflow is still in-progress, 
    // return the most recent completed phase (for notification purposes)
    if (!inProgressApproval && workflowRequest.decision.status === "in-progress" && requestPhases.length > 0) {
        logger.info("No active phase found but workflow is in-progress, using most recent phase: " + requestPhases[requestPhases.length - 1].name);
        inProgressApproval = requestPhases[requestPhases.length - 1];
    }
    
    if (inProgressApproval) {
        logger.info("Found approval phase: " + inProgressApproval.name + " with status: " + inProgressApproval.status);
    }

    return inProgressApproval;
}

function getApproverMailsForInProgressApproval(approvalName, workflowRequest) {
    var actors = workflowRequest.decision.actors.active;
    var approverMails = [];

    if (actors && actors.length > 0) {
        for (let i=0; i<actors.length; i++) {
            if (actors[i].phase == approvalName) {
                logger.error("custom-endpoint enrollment_v2B getApproverMailsForInProgressApproval actor: " + actors[i]);
                approverMails.push(actors[i].mail);
            }
        }
    }

      logger.error("custom-endpoint enrollment_v2B getApproverMailsForInProgressApproval approverMails: " + approverMails);
    

    return approverMails;
}

function getApproversForInProgressApproval(approvalName, workflowRequest) {
    if (!workflowRequest || !workflowRequest.decision || !workflowRequest.decision.actors) {
        logger.info("No actors found in workflow request for approval: " + approvalName);
        return [];
    }
    
    var approvers = [];
    
    // Check both active and inactive actors
    var actorLists = [
        { list: workflowRequest.decision.actors.active, type: "active" },
        { list: workflowRequest.decision.actors.inactive, type: "inactive" }
    ];
    
    for (var listIdx = 0; listIdx < actorLists.length; listIdx++) {
        var actorGroup = actorLists[listIdx];
        var actors = actorGroup.list;
        
        if (actors && actors.length > 0) {
            for (let i=0; i<actors.length; i++) {
                // Skip SYSTEM actor
                if (actors[i].id === "SYSTEM") {
                    continue;
                }
                
                if (actors[i].phase == approvalName) {
                    // Try to get user details if not present in actor object
                    var givenName = actors[i].givenName || "";
                    var sn = actors[i].sn || "";
                    var mail = actors[i].mail || "";
                    
                    // If any fields are missing and we have userId, try to fetch from user object
                    if ((!givenName || !sn || !mail) && actors[i].id && actors[i].id !== "SYSTEM") {
                        var userPath = actors[i].id;
                        try {
                            // Handle different ID formats:
                            // 1. "managed/user/xyz" -> convert to "managed/alpha_user/xyz"
                            // 2. "managed/alpha_user/xyz" -> use as is
                            // 3. Plain "xyz" -> add "managed/alpha_user/" prefix
                            
                            if (userPath.indexOf("managed/user/") === 0) {
                                // Convert "managed/user/" to "managed/alpha_user/"
                                userPath = userPath.replace("managed/user/", "managed/alpha_user/");
                            } else if (userPath.indexOf("managed/alpha_user/") === 0) {
                                // Already correct format, use as is
                            } else if (userPath.indexOf("managed/") !== 0) {
                                // Plain user ID without any managed/ prefix - add full path
                                userPath = "managed/alpha_user/" + userPath;
                            } else {
                                // Has "managed/" but not "managed/user/" or "managed/alpha_user/"
                                // This might be an error case or different object type - use as is
                            }
                            
                            var userDetails = openidm.read(userPath, null, ["givenName", "sn", "mail"]);
                            
                            if (userDetails) {
                                givenName = userDetails.givenName || givenName || "";
                                sn = userDetails.sn || sn || "";
                                // Update mail if it was missing
                                if (!mail && userDetails.mail) {
                                    mail = userDetails.mail;
                                }
                                logger.info("Retrieved user details for: " + userPath);
                            }
                        } catch (e) {
                            logger.warn("Failed to fetch user details for: " + userPath + ", error: " + e);
                        }
                    }
                    
                    // Skip if no email address after trying to fetch it
                    if (!mail) {
                        logger.warn("No email address available for actor: " + actors[i].id);
                        continue;
                    }
                    
                    var approverInfo = {
                        mail: mail,
                        givenName: givenName,
                        sn: sn,
                        displayName: actors[i].displayName || "",
                        status: actorGroup.type
                    };
                    approvers.push(approverInfo);
                }
            }
        }
    }

    logger.info("Found " + approvers.length + " approver(s) for phase: " + approvalName);
    return approvers;
}


function sendCancellationEmailToApprovers(approvers, emailDetail) {
    logger.info("Sending cancellation emails to " + approvers.length + " approver(s) for application: " + (emailDetail ? emailDetail.Application_name : "Unknown"));

    for (let i=0; i<approvers.length; i++) {
        try {
            // Build email object matching the template structure
            var emailObject = {
                givenName: approvers[i].givenName || "",
                sn: approvers[i].sn || "",
                request: {
                    custom: {
                        requesterUser: {
                            requesterUserMail: emailDetail.Requestor || "",
                            applicationName: emailDetail.Application_name || ""
                        }
                    }
                },
                timeStamp: emailDetail.Timestamp || new Date().toISOString(),
                reason: emailDetail.Reason || "User cancelled the request"
            };

            var body = {
                subject: "KYID Account Notification: Cancel Enrollment",
                to: approvers[i].mail,
                templateName: "kyidRequestCancelledApprover",
                object: emailObject
            };

            openidm.action("external/email", "sendTemplate", body);
            logger.info("Successfully sent cancellation email to approver: " + approvers[i].mail);
        } catch (e) {
            logger.error("Failed to send cancellation email to " + approvers[i].mail + ": " + e);
        }
    }
}
  
function cancelWorkflowRequest(enrollmentRequestId, requestorEmail, applicationName, reason) {
  try {
      logger.info("Cancelling workflow request for enrollment: " + enrollmentRequestId + ", application: " + applicationName);
      
      // Query userPrerequisite
      var userPrerequisite = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", { "_queryFilter": '/enrollmentRequestId/ eq "' + enrollmentRequestId + '"'}, []);
      
      var requestId;
      if (userPrerequisite && userPrerequisite != null && userPrerequisite.resultCount > 0) {
        requestId = userPrerequisite.result[0].pingApprovalWorkflowId;

        if (requestId && requestId != null) {
            var workflowRequest = openidm.action("/iga/governance/requests/" + requestId, "GET", {});

            if (workflowRequest && workflowRequest != null) {
                
                // Check if workflow is already completed or cancelled
                var workflowStatus = workflowRequest.decision ? workflowRequest.decision.status.toLowerCase() : "";
                if (workflowStatus != "complete" && workflowStatus != "completed" && workflowStatus != "cancelled") {
                    var inProgressApproval = getInProgressApproval(workflowRequest);


                    if (inProgressApproval && inProgressApproval != null) {
                        logger.info("Cancelling workflow phase: " + inProgressApproval.name + " for request: " + requestId);
                        var cancelResponse = openidm.action("/iga/governance/requests/" + requestId, "POST", {"comments":"user has cancelled the request"}, {_action: "cancel", phaseName: inProgressApproval.name});

                        if (cancelResponse && cancelResponse.id != null) {
                            logger.info("Workflow cancelled successfully for request: " + requestId);
                            // Get approvers with their details (mail, firstName, lastName)
                            var approvers = getApproversForInProgressApproval(inProgressApproval.name, workflowRequest);

                            if (approvers && approvers.length > 0) {
                                logger.info("Sending cancellation emails to " + approvers.length + " approver(s)");
                                const emailDetail = {
                                    "Requestor": requestorEmail,
                                    "Application_name": applicationName,
                                    "Timestamp": new Date().toISOString(),
                                    "Reason": reason || "User cancelled the request"
                                };
                                sendCancellationEmailToApprovers(approvers, emailDetail)
                            } else {
                                logger.info("No approvers found for phase: " + inProgressApproval.name);
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
                    logger.info("Workflow already " + workflowStatus + " for request: " + requestId);
                    let returnPayload = {
                        "responseCode": 1,
                        "transactionId": request.content.transactionId,
                        "message": {
                            "content": "Workflow request has already " + workflowStatus + " for id " + requestId,
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
    logger.error("Error in cancelWorkflowRequest for enrollment " + enrollmentRequestId + ": " + (error.message || error));
    return {
      "error": error
    }
  }
}






/**This is audit logger to capture user activity
 * 
 * @param eventCode
 * @param sessionDetails
 * @param eventName
 * @param eventDetails
 * @param requesterUserId
 * @param requestedUserId
 * @param transactionId
 * @param emailId
 * @param applicationName
 * @param sessionRefId
 */
function auditLogger(eventCode, eventName, sessionDetails, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationName, sessionRefId) {
try{
    logger.error("KYID.2B1.Library.AuditLogger -- Inside Audit Logger")
    const createdDate = new Date().toISOString();
    const currentTimeinEpoch = Date.now();

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
        sessionId: sessionRefId || ""
    };
    logger.error("KYIDAuditLogger :: logPayload :" + JSON.stringify(logPayload));
    const patchResponse = openidm.create("managed/alpha_kyid_audit_logger/", null, logPayload);
    logger.error("KYIDAuditLogger :: patchResponse :" + JSON.stringify(patchResponse));
   } catch (error) {
        logger.error("KYIDAuditLogger ::error" + JSON.stringify(error));
        logger.error("KYIDAuditLogger ::error" + error);
    }

}

/**
 * Cancel workflow and send enhanced emails when Helpdesk cancels on behalf of user
 * @param {String} enrollmentRequestId - ID of the enrollment request
 * @param {Object} enrollmentRequest - Full enrollment request object from database
 * @param {String} helpdeskOperatorId - ID of the Helpdesk operator performing the cancellation
 * @param {String} reason - Cancellation reason provided by Helpdesk
 * @param {String} comment - Additional comment explaining the cancellation
 */
function cancelWorkflowForHelpdesk(enrollmentRequestId, enrollmentRequest, helpdeskOperatorId, reason, comment) {
    try {
        logger.error("cancelWorkflowForHelpdesk: Processing enrollment " + enrollmentRequestId);
        
        // Extract application names
        var applicationName = "";
        if (enrollmentRequest.appSystemName && enrollmentRequest.appSystemName.length > 0) {
            applicationName = enrollmentRequest.appSystemName.join(", ");
        }
        
        // Get end user details
        var userID = enrollmentRequest.requestedUserId;
        var userDetails = openidm.read("managed/alpha_user/" + userID, null, ["mail", "givenName", "sn"]);
        var requestorEmail = userDetails ? userDetails.mail : "";
        
        // Get helpdesk operator details
        var operatorDetails = null;
        var operatorName = "Helpdesk";
        try {
            if (helpdeskOperatorId) {
                operatorDetails = openidm.read("managed/alpha_user/" + helpdeskOperatorId, null, ["givenName", "sn", "mail"]);
                if (operatorDetails) {
                    operatorName = (operatorDetails.givenName || "") + " " + (operatorDetails.sn || "") + " (Helpdesk)";
                }
            }
        } catch (e) {
            logger.error("Unable to get helpdesk operator details for ID " + helpdeskOperatorId + ": " + e);
        }
        
        // Build enhanced reason with helpdesk context
        var fullReason = "Cancelled by " + operatorName + ": " + (reason || "No reason provided");
        if (comment) {
            fullReason += " - Comment: " + comment;
        }
        
        // Call cancelWorkflowRequest to cancel IGA workflow and send emails to approvers
        cancelWorkflowRequest(enrollmentRequestId, requestorEmail, applicationName, fullReason);
        
        logger.error("cancelWorkflowForHelpdesk: Successfully processed enrollment " + enrollmentRequestId + " by operator: " + operatorName);
        
    } catch (e) {
        logger.error("cancelWorkflowForHelpdesk: Error processing enrollment " + enrollmentRequestId + ": " + e);
        // Don't throw - let the main process continue
    }
}

function decodeAccessToken(token) {
    try {
      logger.error("decodeAccessToken ::inside " );
      //get the payload and replace the invalid character for base64url
        let tokenPayload = token.split(".")[1]
        tokenPayload = tokenPayload.replace(/-/g, '+').replace(/_/g, '/')

        //padding with =
        let pad = tokenPayload.length % 4
        if (pad) {

            tokenPayload += new Array(5 - pad).join('=')
        }

        //Decode the String
        let decodedTokenPayload = java.lang.String(java.util.Base64.getDecoder().decode(tokenPayload), "UTF-8").toString()
 
      logger.error("decodeAccessToken ::inside "+JSON.parse(decodedTokenPayload).sessionRefId);    
        return JSON.parse(decodedTokenPayload).sessionRefId

    } catch (error) {
logger.error("decodeAccessToken ::inside "+error);   
        throw {
            code: 400,
            message: "Exception when decode access token"
        }
    }
}
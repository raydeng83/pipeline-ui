var UUID = java.util.UUID;

(function () {
    // Get audit logger context with client info
    const auditLoggerObj = getAuditLoggerContext();

    // Debug: Print auditLoggerObj
    try {
        logger.error("account_v2B :: auditLoggerObj = " + JSON.stringify(auditLoggerObj));
    } catch (e) {
        logger.error("account_v2B :: Error logging auditLoggerObj: " + e);
    }

    if (request.method === 'create') {
        // POST
        const payload = request.content.payload
        const action = request.content.action
        const view = payload.view;
        const queryFilter = payload.queryFilter;
        const ACCOUNT_PROPERTIES = [
            "givenName",
            "sn",
            "mail",
            "custom_logon",
            "frIndexedString1",
            "custom_userType"
        ]

        if (action === 4) {
            if (view && view != null) {
                if (view == "AccountInformation") {
                    return getViewAccountInformation(queryFilter);
                } else if (view == "UserPersonalInformation") {
                    return getViewUserPersonalInformation(queryFilter);
                } else if (view == "OrganizationInformation") {
                    return getViewOrganizationInformation(queryFilter);
                } else if (view == "InvitationSearch" || view == "EnrollmentSearch") {
                    try {
                        logger.error("EnrollmentSearch 1");
                        let input = {
                            //"transactionId":request.content.transactionId,
                            "transactionId": "1",
                            "endPoint": "account_v2b_draft",
                            "object": "managed/alpha_user/",
                            "payload": {},
                            "view": view,
                            "businessAppId": request.content.businessAppId ? request.content.businessAppId : null
                        }
                        input.payload.returnProperties = request.content.returnParams ? request.content.returnParams : ACCOUNT_PROPERTIES
                        input.payload.queryFilter = {
                            "conditions": request.content.payload.searchParameters
                        }
                        logger.error("EnrollmentSearch 2");
                        return enrollmentSearch(input);
                    } catch (error) {
                        throw error
                    }
                } else if (view == "AccountSearch") {
                    try {
                        logger.error("AccountSearch 1");
                        let input = {
                            //"transactionId":request.content.transactionId,
                            "transactionId": "1",
                            "endPoint": "account_v2b_draft",
                            "object": "managed/alpha_user/",
                            "payload": {},
                            "isAdvanced": request.content.isAdvanced ? request.content.isAdvanced : false,
                            "isTerminated": request.content.isTerminated ? request.content.isTerminated : false,
                            "isDeactivated": request.content.isDeactivated ? request.content.isDeactivated : false,
                            "businessAppId": request.content.businessAppId ? request.content.businessAppId : null
                        }
                        input.payload.returnProperties = request.content.returnParams ? request.content.returnParams : ACCOUNT_PROPERTIES
                        input.payload.queryFilter = {
                            "conditions": request.content.payload.searchParameters,
                            "userIdFromContext": context.oauth2.rawInfo.user_id
                        }
                        logger.error("AccountSearch 2");
                        return accountSearch(input);
                    } catch (error) {
                        throw error
                    }
                }
            }
        } else if (action === 3) {

            if (view && view != null) {
                // Create input object with payload and auditLogger
                let input = {
                    payload: payload,
                    auditLogger: auditLoggerObj
                };
                
                if (view == "AccountStatusUpdate") {
                    return updateAccountStatus(input);
                } else if (view == "UserIdentityUpdate") {
                    return updateUserIdentity(input);
                }
            }

        } else if (action == 5) {
            return updateUserProfile(payload)
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
    throw { code: 500, message: 'Unknown error' }
}());

function enrollmentSearch(input) {
    try {
        logger.error("AccountSearch 3");
        if (input.payload) {
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter
            let filterCondition = ""
            let resultSet = [];
            let returnPayload = {
                "transactionId": input.transactionId,
                "message": {
                    "code": "0",
                    "content": "Success"
                },
                "payload": {
                    "data": []
                }
            }

            if (queryFilter) {

                filterCondition = "("
                if (queryFilter.conditions) {
                    queryFilter.conditions.forEach(condition => {
                        if (filterCondition !== "(") {
                            filterCondition += ' OR ';
                        }
                        filterCondition += `/${condition.name}/ sw "${condition.value}"`
                    })
                    filterCondition += ")";
                    filterCondition += " AND /accountStatus eq \"active\"";
                }

                if (input.businessAppId) {
                    let contextResponse;
                    if (input.view === "InvitationSearch") {
                        let contextQuery = "/requestedUserAccountId pr AND /status eq \"0\" AND /applicationRoles[/applicationId eq \"" + input.businessAppId + "\"]"
                        contextResponse = openidm.query("managed/alpha_kyid_enrollment_contextId", { "_queryFilter": contextQuery, "_sortKeys": "-createDate", "_fields": "requestedUserAccountId" }).result;
                        logger.error("InvitationSearch: " + JSON.stringify(contextResponse));
                    } else if (input.view === "EnrollmentSearch") {
                        let contextQuery = "/requestedUserId pr AND (/recordState eq \"0\" OR /recordState eq \"ACTIVE\") AND /roleContext[/applicationId eq \"" + input.businessAppId + "\"]"
                        contextResponse = openidm.query("managed/alpha_kyid_enrollment_request", { "_queryFilter": contextQuery, "_sortKeys": "-createDate", "_fields": ["requestedUserId", "createDate", "expiryDate", "roleIds/*"] }).result;
                        logger.error("EnrollmentSearch: " + JSON.stringify(contextResponse));
                    }

                    if (contextResponse.length > 0) {
                        const pageSize = 50;
                        for (let i = 0; i < contextResponse.length; i += pageSize) {
                            const page = contextResponse.slice(i, i + pageSize);
                            let userFilter = "(";
                            page.forEach(context => {
                                if (userFilter !== "(") {
                                    userFilter += ' OR ';
                                }

                                if (input.view == "InvitationSearch") {
                                    userFilter += `/_id eq "${context.requestedUserAccountId}"`
                                }
                                else {
                                    userFilter += `/_id eq "${context.requestedUserId}"`
                                }
                            })
                            userFilter += ")";
                            let fullFilter = filterCondition + " AND " + userFilter;
                            logger.error("SearchFilter: " + fullFilter)
                            let userResponse = openidm.query("managed/alpha_user",
                                {
                                    "_queryFilter": fullFilter,
                                    "_pageSize": 200
                                },
                                returnProperties
                            ).result;
                            resultSet = resultSet.concat(userResponse);
                            if (resultSet.length >= 200) {
                                //returnPayload.payload.data = resultSet;
                                //return returnPayload;
                                break;
                            }
                        }

                        //returnPayload.payload.data = resultSet;
                        let finalResultSet = [];
                        let dataArray = [];
                        contextResponse = contextResponse.map(obj => {
                            return {
                                ER_id: obj._id,
                                requestedUserId: obj.requestedUserId,
                                createDate: obj.createDate,
                                expiryDate: obj.expiryDate,
                                roleIds: obj.roleIds
                            };
                        });
                        if (input.view == "InvitationSearch") {
                            returnPayload.payload.data = resultSet;
                            return returnPayload;
                        }
                        else {
                            finalResultSet = contextResponse
                                .filter(obj1 => resultSet.some(obj2 => obj1.requestedUserId === obj2._id))
                                .map(obj1 => {
                                    const obj2 = resultSet.find(obj2 => obj1.requestedUserId === obj2._id);
                                    return Object.assign({}, obj1, obj2); // Merge objects
                                });
                        }

                        finalResultSet.forEach(entry => {
                            let roleIds = entry.roleIds;
                            var skipEntry = false;

                            let businessAppResponse = openidm.query("managed/alpha_kyid_businessapplication/", {
                                "_queryFilter": 'roleAppId/_refResourceId eq "' + roleIds[0]._id + '"'
                            }, ["*"]);

                            var userPrerequisiteListResponse = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
                                "_queryFilter": '/enrollmentRequestId/ eq "' + entry.ER_id + '"'
                            }, ["*", "*_ref/*"]);

                            var associatedPrerequisites = [];
                            if (userPrerequisiteListResponse && userPrerequisiteListResponse.result.length > 0) {
                                var userPrerequisiteList = userPrerequisiteListResponse.result;

                                for (let i = 0; i < userPrerequisiteList.length; i++) {
                                    if (userPrerequisiteList[i].preRequisiteId != null) {
                                        var prereq = userPrerequisiteList[i].preRequisiteId.displayName;
                                        associatedPrerequisites.push(prereq);
                                    }
                                }
                            } else {
                                skipEntry = true;
                            }

                            let businessApp = businessAppResponse.result[0];

                            let dataEntry = {
                                "firstName": entry.givenName,
                                "lastName": entry.sn,
                                "email": entry.mail,
                                "enrollmentId": entry.ER_id,
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
                                "creationDate": entry.createDate,
                                "expiryDate": entry.expiryDate,
                                "associatePrerequisites": associatedPrerequisites,
                                "id": entry.ER_id
                            }
                            if (!skipEntry) {
                                dataArray.push(dataEntry);
                            }
                        })

                        returnPayload.payload.data = dataArray;
                        return returnPayload;
                    } else {
                        returnPayload.message.content = "No Context Response array"
                        return returnPayload
                    }
                } else {
                    returnPayload.message.content = "No businessAppId"
                    return returnPayload
                }
            } else {
                /* Throw invalid input exception. */
                // const invalidInputException = {
                //     "code":400,
                //     "level":"ERROR",
                //     "errorCode":"",
                //     "errorMessage":EXCEPTION_INVALID_INPUT,
                //     "params":[],
                //     "transactionId":input.transactionId,
                //     "logger":`${input.endPoint}/searchAccount`,
                //     "timestamp":new Date().toISOString()
                // }
                // throw invalidInputException
            }

        } else {
            /* Throw invalid input exception. */
            // const invalidInputException1 = {
            //     "code":400,
            //     "level":"ERROR",
            //     "errorCode":"",
            //     "errorMessage":EXCEPTION_INVALID_INPUT,
            //     "params":[],
            //     "transactionId":input.transactionId,
            //     "logger":`${input.endPoint}/searchAccount`,
            //     "timestamp":new Date().toISOString()
            // }
            // throw invalidInputException1
        }
    } catch (error) {
        /* Throw unexpected exception. */
        // const unexpectedException2 = {
        //     "code":400,
        //     "level":"ERROR",
        //     "errorCode":"",
        //     "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
        //     "params":[`createAccount`,getException(error)],
        //     "transactionId":input.transactionId,
        //     "logger":`${input.endPoint}/searchAccount`,
        //     "timestamp":new Date().toISOString()
        // }
        // throw unexpectedException2
        throw error
    }
}

function accountSearch(input) {
    try {
        const ACCOUNT_SEARCH_FILTER_ROLE = "KYID-App-Level1-HelpDesk";

        logger.error("AccountSearch 3");
        if (input.payload) {
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter
            let filterCondition = ""
            var alphaUserType = openidm.read("managed/alpha_user/" + queryFilter.userIdFromContext, null, ["*"]);

            if (queryFilter) {
                if (input.isAdvanced) {
                    logger.error("AccountSearch 4 advanced");
                    filterCondition = '(/accountStatus eq "active"'

                    if (input.isTerminated) {
                        filterCondition += ' or /accountStatus eq "terminated"'
                    }
                    if (input.isDeactivated) {
                        filterCondition += ' or /accountStatus eq "inactive"'
                    }
                    if (!input.businessAppId && alphaUserType && alphaUserType != null){
                        var hasTargetRole = false;
                        if (alphaUserType.effectiveRoles && alphaUserType.effectiveRoles.length > 0) {
                            for (var i = 0; i < alphaUserType.effectiveRoles.length; i++) {
                                var roleId = alphaUserType.effectiveRoles[i]._refResourceId;
                                var roleName = getRoleName(roleId);
                                if (roleName === ACCOUNT_SEARCH_FILTER_ROLE) {
                                    hasTargetRole = true;
                                    break;
                                }
                            }
                        }
                        if (hasTargetRole) {
                            filterCondition += ' AND '
                            filterCondition += '/custom_kyidAccountType eq "P"'
                        }
                    }
                    logger.error("AccountSearch 5: Printing filterCondition " + filterCondition);

                    filterCondition += ')';

                    let telephoneSearchParam = '';

                    if (queryFilter.conditions) {
                        queryFilter.conditions.forEach(condition => {
                            if (condition.name === "mobileNumber") {
                                telephoneSearchParam = condition.value;
                            }
                            else {
                                if (filterCondition !== "") {
                                    filterCondition += ' AND ';
                                }
                                filterCondition += `/${condition.name}/ eq "${condition.value}"`
                            }
                        })
                    }

                    if (telephoneSearchParam !== "") {
                        let mfaResponse = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": "/MFAMethod eq \"SMSVOICE\" and MFAValue eq \"" + telephoneSearchParam + "\"" }).result;

                        if (mfaResponse && mfaResponse.length > 0) {
                            filterCondition += " AND (";
                            mfaResponse.forEach(mfaObject => {
                                if (filterCondition.slice(-1) !== "(") {
                                    filterCondition += " OR ";
                                }
                                filterCondition += "userName eq \"";
                                filterCondition += mfaObject.KOGId
                                filterCondition += "\""
                            });
                            filterCondition += ")";
                        }
                    }
                }
                else {
                    logger.error("AccountSearch 4 basic");
                    if (queryFilter.conditions[0].name === "basic" || true) {
                        let searchParam = queryFilter.conditions[0].value.split(" ", 3);
                        filterCondition = "(";

                        searchParam.forEach(param => {
                            if (filterCondition !== "(") {
                                filterCondition += ' AND ('
                            }
                            filterCondition += `/givenName/ co "${param}" OR /sn/ co "${param}" OR /mail/ co "${param}")`
                        });
                        filterCondition += " AND /accountStatus eq \"active\"";

                        if (!input.businessAppId && alphaUserType && alphaUserType != null){
                            var hasTargetRole = false;
                            if (alphaUserType.effectiveRoles && alphaUserType.effectiveRoles.length > 0) {
                                for (var i = 0; i < alphaUserType.effectiveRoles.length; i++) {
                                    var roleId = alphaUserType.effectiveRoles[i]._refResourceId;
                                    var roleName = getRoleName(roleId);
                                    if (roleName === ACCOUNT_SEARCH_FILTER_ROLE) {
                                        hasTargetRole = true;
                                        break;
                                    }
                                }
                            }
                            if (hasTargetRole) {
                                filterCondition += ' AND '
                                filterCondition += '/custom_kyidAccountType eq "P"'
                            }
                        }

                    } else {
                        // throw error
                        let returnPayload = {
                            "responseCode": 0,
                            "payload": {
                                "data": []
                            },
                            "message": {
                                "content": "Search Parameters are missing: 'name': 'basic'.",
                                "code": "0"
                            }
                        }
                        return returnPayload;
                    }

                    // filterCondition = "("
                    // if (queryFilter.conditions) {
                    //     queryFilter.conditions.forEach(condition => {
                    //         if (filterCondition !== "(") {
                    //             filterCondition += ' OR ';
                    //         }
                    //         filterCondition += `/${condition.name}/ sw "${condition.value}"`
                    //     })
                    //     filterCondition += ")";
                    //     filterCondition += " AND /accountStatus eq \"active\"";
                    // }
                }

                let appSearch = false;
                let appSearchRoles = [];

                if (input.businessAppId && input.businessAppId !== null) {
                    let appResponse = openidm.read("managed/alpha_kyid_businessapplication/" + input.businessAppId, null, ["roleAppId/*"]);
                    if (appResponse && appResponse !== null && appResponse.roleAppId.length > 0) {
                        appSearchRoles = appResponse.roleAppId;
                    } else {
                        let returnPayload = {
                            "responseCode": 0,
                            "payload": {
                                "data": []
                            },
                            "message": {
                                "content": "Business Application not found, or no roles associated.",
                                "code": "0"
                            }
                        }
                        return returnPayload;
                    }
                    appSearch = true;
                }

                if (appSearch && appSearchRoles.length > 0) {
                    filterCondition += " AND (";
                    appSearchRoles.forEach(role => {
                        if (filterCondition.slice(-1) !== "(") {
                            filterCondition += " OR ";
                        }
                        filterCondition += "/effectiveRoles[/_ref eq \"";
                        filterCondition += role._ref
                        filterCondition += "\"]"
                    });
                    filterCondition += ")";
                }

                logger.error("AccountSearch filter " + filterCondition);
                const searchResponse = openidm.query("managed/alpha_user",
                    {
                        "_queryFilter": filterCondition,
                        "_pageSize": 200
                    },
                    returnProperties
                )
                logger.error("AccountSearch 6");
                if (searchResponse) {
                    let returnPayload = {
                        "transactionId": input.transactionId,
                        "message": {
                            "code": "0",
                            "content": "Success"
                        },
                        "payload": {
                            "data": searchResponse.result
                        }
                    }
                    return returnPayload;
                } else {
                    return null
                }

            } else {
                /* Throw invalid input exception. */
                // const invalidInputException = {
                //     "code":400,
                //     "level":"ERROR",
                //     "errorCode":"",
                //     "errorMessage":EXCEPTION_INVALID_INPUT,
                //     "params":[],
                //     "transactionId":input.transactionId,
                //     "logger":`${input.endPoint}/searchAccount`,
                //     "timestamp":new Date().toISOString()
                // }
                // throw invalidInputException
            }

        } else {
            /* Throw invalid input exception. */
            // const invalidInputException1 = {
            //     "code":400,
            //     "level":"ERROR",
            //     "errorCode":"",
            //     "errorMessage":EXCEPTION_INVALID_INPUT,
            //     "params":[],
            //     "transactionId":input.transactionId,
            //     "logger":`${input.endPoint}/searchAccount`,
            //     "timestamp":new Date().toISOString()
            // }
            // throw invalidInputException1
        }
    } catch (error) {
        /* Throw unexpected exception. */
        // const unexpectedException2 = {
        //     "code":400,
        //     "level":"ERROR",
        //     "errorCode":"",
        //     "errorMessage":EXCEPTION_UNEXPECTED_ERROR,
        //     "params":[`createAccount`,getException(error)],
        //     "transactionId":input.transactionId,
        //     "logger":`${input.endPoint}/searchAccount`,
        //     "timestamp":new Date().toISOString()
        // }
        // throw unexpectedException2
        throw error
    }
}

/* This method updates user status along with audit data
 * Execution order:
 * 1. Call KOG Email Update API (if needed for Terminate + reuseEmail)
 * 2. Call KOG User Status Update API
 * 3. Update Managed Object (only if KOG calls succeed)
 * 4. Remove User Roles (only if previous steps succeed)
 * 5. Audit Logger
 */
function updateAccountStatus(input) {
    var eventCode = ""
    var eventName = ""
    var eventDetails;
    var payload = input.payload;
    var comment = payload.comment;
    var action = payload.status;
    var reason = payload.reason;
    var requesterId = payload.requesterId;
    var status = "active";
    var emailAppend = Math.floor(Math.random() * 999) + 100;
    var email = payload.email;
    var emailNew = email; // Default to original email

    try {
        let returnPayload = [];

        let currentTimeinEpoch = Date.now()
        let currentDate = new Date().toISOString()


        if (action == "Terminate") {
            status = "Terminated";
            eventCode = "ACM001"
            eventName = "Account Termination Success";

        } else if (action == "Deactivate") {
            status = "inactive";
            eventCode = "ACM005"
            eventName = "Account Deactivation Success";

        } else if (action == "Activate") {
            status = "active";
            eventCode = "ACM003"
            eventName = "Account Activation Success";
        }

        // Step 1: Call KOG Email Update API first if needed (Terminate + reuseEmail)
        if (status == "Terminated" && payload.reuseEmail) {
            logger.error("bp-317 - backup_20260108_190002")
            emailNew = email.split("@")[0] + emailAppend + "@" + email.split("@")[1];

            var KOGEmailUpdateAPIResponse = invokeKOGEmailUpdateAPI(payload, emailNew);

            if (!KOGEmailUpdateAPIResponse || KOGEmailUpdateAPIResponse.ResponseStatus !== 0) {
                logger.error("[STATUS-UPDATE] KOG Email Update FAILED: " + JSON.stringify(KOGEmailUpdateAPIResponse));

                // Log failure audit
                eventDetails = {
                    "Error": "KOG Email Update API failed",
                    "KOGResponse": KOGEmailUpdateAPIResponse,
                    "reason": reason,
                    "comment": comment,
                    "IP": input.auditLogger.clientIP,
                    "Browser": input.auditLogger.clientBrowser
                };

                eventCode = "ACM002"
                eventName = "Account Termination Failure";

                auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, email, "", input.auditLogger.sessionRefIDauditLogger);

                return {
                    "responseCode": 2,
                    "transactionId": input.auditLogger.transactionIdauditLogger,
                    "message": {
                        "content": "An unexpected error occurred when updating the user status. Please try again later. REF-003",
                        "code": "2"
                    }
                };
            }
        }

        // Step 2: Call KOG User Status Update API
        var kogAPIResponse = invokeKOGAPI(payload);
       // var kogAPIResponse = false;   // added to test
        if (!kogAPIResponse || kogAPIResponse.ResponseStatus !== 0) {
            logger.error("[STATUS-UPDATE] KOG Status Update FAILED: " + JSON.stringify(kogAPIResponse));

            // Log failure audit
            eventDetails = {
                "Error": "KOG User Status Update API failed",
                "KOGResponse": kogAPIResponse,
                "reason": reason,
                "comment": comment,
                "IP": input.auditLogger.clientIP,
                "Browser": input.auditLogger.clientBrowser
            };

            // Determine failure event code based on action
            if (action == "Terminate") {
                eventCode = "ACM002"
                eventName = "Account Termination Failure";
            } else if (action == "Deactivate") {
                eventCode = "ACM006"
                eventName = "Account Deactivation Failure";
            } else if (action == "Activate") {
                eventCode = "ACM004"
                eventName = "Account Activation Failure";
            }

            auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, email, "", input.auditLogger.sessionRefIDauditLogger);

            // Return user-friendly error message with reference code
            let errorMessage = "";
            if (action == "Deactivate") {
                errorMessage = "An unexpected error occurred when updating the user status. Please try again later. REF-001";
            } else if (action == "Terminate") {
                errorMessage = "An unexpected error occurred when updating the user status. Please try again later. REF-004";
            } else if (action == "Activate") {
                errorMessage = "An unexpected error occurred when updating the user status. Please try again later. REF-006";
            } else {
                errorMessage = "An unexpected error occurred when updating the user status. Please try again later. REF-009";
            }

            return {
                "responseCode": 2,
                "transactionId": input.auditLogger.transactionIdauditLogger,
                "message": {
                    "content": errorMessage,
                    "code": "2"
                }
            };
        }
        // Step 3: Update Managed Object (only if KOG APIs succeeded)
        let jsonArray = [];
        jsonArray = [
            {
                "operation": "replace",
                "field": "/accountStatus",
                "value": status
            },
            {
                operation: "replace",
                field: "/custom_updatedDateEpoch",
                value: currentTimeinEpoch
            },
            {
                operation: "replace",
                field: "/custom_updatedDateISO",
                value: currentDate
            },
          {
                operation: "replace",
                field: "/custom_updatedBy",
                value: "KYID-System"
            },
          {
                operation: "replace",
                field: "/custom_updatedByID",
                value: payload.userAccountId
            },
            {
                operation: "add",
                field: "/custom_audit/",
                value: {
                    action: action,
                    reason: reason,
                    comment: comment,
                    requesterUserId: requesterId
                }
            }
        ];

        if (status == "Terminated") {
            jsonArray.push({
                operation: "replace",
                field: "/custom_terminationDate",
                value: formatDateEST()
            })
        }
      
        // Add email update to patch array if email was changed
        if (status == "Terminated" && payload.reuseEmail) {
            jsonArray.push({
                operation: "replace",
                field: "/mail",
                value: emailNew
            })
        }

        const updateAccountResponse = openidm.patch("managed/alpha_user/" + payload.userAccountId, null, jsonArray);

        // Step 4: Remove User Roles (only if all previous steps succeeded)
        var accessAPIResponse = removeUserRoles(payload.userAccountId, reason, comment, requesterId);
        if (accessAPIResponse && accessAPIResponse.responseCode !== 0) {
            logger.error("[STATUS-UPDATE] Remove roles WARNING: " + JSON.stringify(accessAPIResponse))
        }

        // Step 5: Success - prepare return payload
        returnPayload = {
            "responseCode": 0,
            "transactionId": input.auditLogger.transactionIdauditLogger,
            "message": {
                "content": "User status updated successfuly :" + payload.userAccountId,
                "code": "0"
            }
        }

        eventDetails = {
            "reason": reason,
            "comment": comment,
            "IP": input.auditLogger.clientIP,
            "Browser": input.auditLogger.clientBrowser
        };

        // Step 6: Audit Logger for success
        auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, updateAccountResponse.mail, "", input.auditLogger.sessionRefIDauditLogger);

        return returnPayload;
    } catch (error) {
        logger.error("[STATUS-UPDATE] ERROR: " + error);

        eventDetails = {
            "Error": "Error in updating user status",
            "Exception": String(error),
            "IP": input.auditLogger.clientIP,
            "Browser": input.auditLogger.clientBrowser
        }

        // Determine error message with reference code based on action
        let errorMessage = "";
        if (action == "Terminate") {
            status = "Terminated";
            eventCode = "ACM002"
            eventName = "Account Termination Failure";
            errorMessage = "An unexpected error occurred when updating the user status. Please try again later. REF-005";

        } else if (action == "Deactivate") {
            status = "inactive";
            eventCode = "ACM006"
            eventName = "Account Deactivation Failure";
            errorMessage = "An unexpected error occurred when updating the user status. Please try again later. REF-002";

        } else if (action == "Activate") {
            status = "active";
            eventCode = "ACM004"
            eventName = "Account Activation Failure";
            errorMessage = "An unexpected error occurred when updating the user status. Please try again later. REF-007";
        } else {
            errorMessage = "An unexpected error occurred when updating the user status. Please try again later. REF-008";
        }

        auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, email, "", input.auditLogger.sessionRefIDauditLogger);

        let returnPayload = {
            "responseCode": 2,
            "transactionId": input.auditLogger.transactionIdauditLogger,
            "message": {
                "content": errorMessage,
                "code": "2"
            }
        }

        return returnPayload;
    }

}

/**
 * Remove all roles for a user using only user RefResourceID .
 * This will patch all matching access records for the user enrollment
 */
function removeUserRoles(userId, reason, comment, requesterId) {
    var endpointPath = "endpoint/access_v2B";
    var payload = {
        "payload": {
            "queryFilter": "user/_refResourceId eq '" + userId + "'",
            "id": requesterId,
            "confirmation": {
                "reason": reason || "Role removal requested",
                "comment": comment || "Removed via user prerequisite"
            }
        },
        "action": "3"
    };

    // Call the endpoint
    var response = openidm.create(endpointPath, null, payload);
    // Optional: Log the result
    if (response && response.responseCode === "0") {
        logger.info("Role removal successful: " + JSON.stringify(response));
    } else {
        logger.error("Role removal failed: " + JSON.stringify(response));
    }

    return response;
}

function getKOGIDForUser(userAccountId) {
    var alphaUser = openidm.read("managed/alpha_user/" + userAccountId, null, ["*"]);
    var kogid = alphaUser && alphaUser != null ? alphaUser.userName : null;
    return kogid;
}

/**
 * Get role name by role ID
 */
function getRoleName(roleId) {
    try {
        var roleData = openidm.read("managed/alpha_role/" + roleId, null, ["name"]);
        return roleData && roleData.name ? roleData.name : null;
    } catch (e) {
        return null;
    }
}

/**
 * Call KOG API for updating user status
 */
function invokeKOGAPI(payload) {
    try {
        // Map payload.status to KOG UserStatus
        // 1 = Active, 2 = Suspended, 3 = Terminated
        var userStatus;
        var isSuspended = false;
        var terminationDate = null;
        var terminationReason = null;
        var suspendedReason = null;
        var enabledReason = null;

        if (payload.status == "Terminate") {
            userStatus = 3;  // Terminated
            isSuspended = false;
            terminationDate = formatCurrentUTCMinus5();
            terminationReason = payload.reason;
        } else if (payload.status == "Deactivate") {
            userStatus = 2;  // Suspended
            isSuspended = true;
            suspendedReason = payload.reason;
        } else if (payload.status == "Activate") {
            userStatus = 1;  // Active
            isSuspended = false;
            enabledReason = payload.reason;
        } else {
            logger.error("[KOG-STATUS-API] ERROR - Unknown status: " + payload.status)
            throw "Unknown status value: " + payload.status
        }

        var requestBody = {
            "url": identityServer.getProperty("esv.kyid.usr.updateuserstatus"),
            //  "url" : "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/updateuserstatus",
            //"scope": identityServer.getProperty("esv.kyid.kogapi.token.updateuserstatus"),
            "scope": "kogkyidapi.updateuserstatus",
            "method": "POST",
            "payload": {
                "KOGID": getKOGIDForUser(payload.userAccountId),
                "TransactionID": generateGUID(),
                "UserStatus": userStatus,
                "IsSuspended": isSuspended,
                "SuspendedReason": suspendedReason,
                "EnabledReason": enabledReason,
                "TerminationDate": terminationDate,
                "TerminationReason": terminationReason,
                "RequestorKOGID": getKOGIDForUser(payload.requesterId)
            }
        }

        var response = openidm.create("endpoint/invokeCertAPI", null, requestBody);

        if (response && response.status === "200") {
            if (response.response.ResponseStatus === 0) {
                logger.error("[KOG-STATUS-API] SUCCESS - UserStatus=" + userStatus + " for user " + payload.userAccountId)
                return response.response
            } else if (response.response.ResponseStatus === 1) {
                logger.error("[KOG-STATUS-API] FAILED - ResponseStatus=1, msg=" + (response.response.ResponseMessage || "") + ", request=" + JSON.stringify(requestBody))
                return null
            } else {
                logger.error("[KOG-STATUS-API] UNEXPECTED ResponseStatus=" + response.response.ResponseStatus + ", response=" + JSON.stringify(response))
                throw JSON.stringify(response)
            }
        } else {
            logger.error("[KOG-STATUS-API] HTTP ERROR - status=" + (response ? response.status : "NULL") + ", request=" + JSON.stringify(requestBody))
            return null
        }
    } catch (error) {
        logger.error("[KOG-STATUS-API] EXCEPTION: " + error)
        if (error && error.stack) {
            logger.error("[KOG-STATUS-API] Stack: " + error.stack)
        }
        throw JSON.stringify(error)
    }
}


function invokeKOGEmailUpdateAPI(payload,emailNew) {
    try {
        const requestBody = {
            "url": identityServer.getProperty("esv.kyid.kogapi.updateprimaryemail"),
            "scope": "kogkyidapi.updateprimaryemail",
            "method": "POST",
            "payload": {
                "KOGID": getKOGIDForUser(payload.userAccountId),
                "TransactionID": generateGUID(),
                "EmailAddress": emailNew,
                "RequestorKOGID": getKOGIDForUser(payload.requesterId)
            }
        }
        logger.error("requestBody in invokeKOGEmailUpdateAPI =>"+JSON.stringify(requestBody))
        const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
        logger.error("response in invokeKOGEmailUpdateAPI =>"+JSON.stringify(response))
        if (response && response.status === "200") {
            if (response.response.ResponseStatus === 0) {
                return response.response
            } else if (response.response.ResponseStatus === 1) {
                return null
            } else {
                throw JSON.stringify(response)
            }
        }
    } catch (error) {
        throw JSON.stringify(error)
    }
}


/**
 * Generate Unique GUID
 */
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}


// Format date for KOG API (ISO format without timezone label)
function formatCurrentUTCMinus5() {
    var now = new Date();
    var year = now.getUTCFullYear();

    // Calculate DST boundaries
    var march = new Date(Date.UTC(year, 2, 1));
    var marchDay = (7 - march.getUTCDay() + 7) % 7 + 7;
    var dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0));

    var november = new Date(Date.UTC(year, 10, 1));
    var novDay = (7 - november.getUTCDay()) % 7;
    var dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0));

    var isDST = (now >= dstStart && now < dstEnd);
    var offset = isDST ? -4 : -5;
    var eastern = new Date(now.getTime() + offset * 60 * 60 * 1000);

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    var year = eastern.getUTCFullYear();
    var month = pad(eastern.getUTCMonth() + 1);
    var day = pad(eastern.getUTCDate());
    var hours = pad(eastern.getUTCHours());
    var minutes = pad(eastern.getUTCMinutes());
    var seconds = pad(eastern.getUTCSeconds());
    var millis = (eastern.getUTCMilliseconds() + '000').substring(0, 3);

    // Format for API: YYYY-MM-DD HH:MM:SS.sss
    return year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds + "." + millis;
}

// Format date for display with EST label
function formatDateEST() {
    var now = new Date();
    var year = now.getUTCFullYear();

    // Calculate DST boundaries
    var march = new Date(Date.UTC(year, 2, 1));
    var marchDay = (7 - march.getUTCDay() + 7) % 7 + 7;
    var dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0));

    var november = new Date(Date.UTC(year, 10, 1));
    var novDay = (7 - november.getUTCDay()) % 7;
    var dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0));

    var isDST = (now >= dstStart && now < dstEnd);
    var offset = isDST ? -4 : -5;
    var eastern = new Date(now.getTime() + offset * 60 * 60 * 1000);

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    var month = eastern.getUTCMonth() + 1;
    var day = eastern.getUTCDate();
    var hours = eastern.getUTCHours();
    var minutes = pad(eastern.getUTCMinutes());
    var seconds = pad(eastern.getUTCSeconds());

    // Format for display: M/D/YYYY  H:MM:SS EST
    return month + "/" + day + "/" + eastern.getUTCFullYear() + "  " + hours + ":" + minutes + ":" + seconds + " EST";
}

/* This method updates user status along with audit data
*/
function updateUserIdentity(input) {
    var payload = input.payload;
    var eventCode = "";
    var eventName = "";
    var eventDetails = "";

    try {

        let returnPayload = [];
        let currentTimeinEpoch = Date.now()
        let currentDate = new Date().toISOString()
        logger.error("UserId: --> " + payload._id + "currentTimeinEpoch: -- > " + currentTimeinEpoch + "currentDate--> " + currentDate)
        let jsonArray = [];

        if (payload.updateParameters.some(obj => obj.name === "personalVerificationDetails")) {
            eventCode = "VER010";
            eventName = "In-person Verification Success";
        } else {
            eventCode = "VER08";
            eventName = "Remote Identity Verification Success";
        }

        logger.error("User Identity update : updateParameters :" + payload.updateParameters);

        payload.updateParameters.forEach(parameter => {
            if (parameter.name == "personalVerificationDetails") {
                parameter.value.forEach(item => {
                    jsonArray.push({
                        "operation": "add",
                        "field": "/personalVerificationDetails/-",
                        "value": item
                    });
                });
            } else {
                jsonArray.push({
                    "operation": "replace",
                    "field": "/" + parameter.name,
                    "value": parameter.value
                });
            }

        });

        jsonArray.push({
            "operation": "replace",
            "field": "/updatedBy",
            "value": payload.requesterId
        });

        logger.error("updateUserIdentity : --> update jsonArray :" + JSON.stringify(jsonArray));

        const updateIdentityResponse = openidm.patch("managed/alpha_kyid_user_identity/" + payload._id, null, jsonArray);


        if (updateIdentityResponse) {
            logger.error("Update User Identity Response is --> " + updateIdentityResponse);
        }

        returnPayload = {
            "responseCode": 0,
            "transactionId": request.content.transactionId,
            "message": {
                "content": "User Identity updated successfuly :" + updateIdentityResponse._id,
                "code": "0"
            }
        }

        eventDetails = {
            "updateParameters": payload.updateParameters,
            "IP": input.auditLogger.clientIP,
            "Browser": input.auditLogger.clientBrowser
        };

        auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, payload.requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, "", "", input.auditLogger.sessionRefIDauditLogger);
        return returnPayload;
    } catch (error) {
        logger.error("Error in updating the user identity " + error);
        let returnPayload = {
            "responseCode": 2,
            "transactionId": request.content.transactionId,
            "message": {
                "content": "error in updating user status :" + payload.userAccountId,
                "code": "2"
            }
        }
        if (payload.updateParameters.some(obj => obj.name === "personalVerificationDetails")) {
            eventCode = "VER011";
            eventName = "In-person Verification Failure";
        } else {
            eventCode = "VER09";
            eventName = "Remote Identity Verification Failure";
        }

        eventDetails = {
            "Error": "Error in updating user identity",
            "Exception": String(error),
            "IP": input.auditLogger.clientIP,
            "Browser": input.auditLogger.clientBrowser
        };

        auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, payload.requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, "", "", input.auditLogger.sessionRefIDauditLogger);
        return returnPayload;
    }

}


function getViewAccountInformation(queryFilter) {
    try {
        logger.error("kyid account endpoint getViewAccountInformation - userAccountId: " + queryFilter.userAccountId);
        var alphaUser = openidm.read("managed/alpha_user/" + queryFilter.userAccountId, null, ["*"]);

        if (alphaUser && alphaUser != null) {
            logger.error("kyid account endpoint getViewAccountInformation alphaUser: " + alphaUser);
            var kogid = alphaUser.userName;

            var mfaSearchResponse = openidm.query("managed/alpha_kyid_mfa_methods/", {
                "_queryFilter": '/KOGId/ eq "' + kogid + '"'
            }, ["*"]);

            logger.error("kyid account endpoint getViewAccountInformation mfaSearchResponse: " + mfaSearchResponse);

            var isEnrolledMFA = false;

            if (mfaSearchResponse.resultCount > 0) {
                isEnrolledMFA = true;
                var mfaMethods = mfaSearchResponse.result;
                var accountRecoveryAndMFA = [];
                var mfaMethodName = "";
                for (let i = 0; i < mfaMethods.length; i++) {
                    if (!(mfaMethods[i].MFAMethod.toUpperCase() == "EMAIL") && mfaMethods[i].MFAStatus.toLowerCase() == "active") {
                        let methodUsage = ["MFA"]
                        if (mfaMethods[i].isRecoveryOnly) {
                            methodUsage.push("Account recovery")
                        }
                        if (mfaMethods[i].MFAMethod === "SECONDARY_EMAIL") {
                            mfaMethodName = "Alternate email";
                        } else {
                            mfaMethodName = mfaMethods[i].MFAMethod;
                        }
                        var accountRecoveryAndMFAItem = {
                            "id": mfaMethods[i]._id,
                            "methodType": {
                                "es": "es_" + mfaMethodName,
                                "en": mfaMethodName
                            },
                            "methodDetails": mfaMethods[i].MFAValue,
                            "UsageContexts": methodUsage
                        }


                        accountRecoveryAndMFA.push(accountRecoveryAndMFAItem);
                    } else {
                        continue;
                    }

                }
            }

            var accountType = "";
            if (alphaUser.custom_kyidAccountType) {
                if (alphaUser.custom_kyidAccountType === 'P') {
                    accountType = "Personal";
                } else if (alphaUser.custom_kyidAccountType === 'C') {
                    accountType = "Commonwealth";
                } else if (alphaUser.custom_kyidAccountType === 'B') {
                    accountType = "Business Partner";
                }
            }

            //fix for ticket 203059 to get password expiration and modification date from connector 
            var passwordExpiration = ""
            var passwordLastChangedTime = ""
            var Logon = alphaUser.frIndexedString2
            //dharjani: TFS208614 - Adding defensive check in the case logon is not present
            logger.error("kyid account endpoint getViewAccountInformation connectorDomainCheckLogon: " + Logon);
            if(Logon && Logon.length > 0) {
                var domain = Logon.split("@")
                logger.error("kyid account endpoint getViewAccountInformation connectorDomainCheckDomain: " + JSON.stringify(domain));
                if(domain) {
                    var connector = checkConnector(domain[1])
                    logger.error("kyid account endpoint getViewAccountInformation connectorDomainCheckConnector: " + connector);
                    if (alphaUser.frIndexedString1) {
                        passwordExpiration = getPasswordExpiration(connector, "userPrincipalName", alphaUser.frIndexedString1)
                        logger.error("passwordExpiration is --> "+ passwordExpiration)
                        passwordLastChangedTime = getPasswordModified(connector, "userPrincipalName", alphaUser.frIndexedString1)
                        if(passwordLastChangedTime === "0" || passwordLastChangedTime === 0 ){
                          logger.error("kyid account endpoint getViewAccountInformation passwordLastChangedTime: " + passwordLastChangedTime) + "User Needs to change Password on Logon";
                          passwordLastChangedTime = ""
                        }
                      // NR: Adding Fix Defect 206209  Start
                      if(passwordLastChangedTime === "0" || passwordLastChangedTime === 0 ){
                          logger.error("kyid account endpoint getViewAccountInformation passwordLastChangedTime: " + passwordLastChangedTime) + "User Needs to change Password on Logon "+" User Email: " +alphaUser.mail ||"";
                          passwordLastChangedTime = ""
                        }
                      else if(passwordExpiration && passwordExpiration !=="" && passwordExpiration.includes("30828")){
                        logger.error("kyid account endpoint getViewAccountInformation passwordExpiration: " + passwordExpiration) + "User's Password will never expire" +" User Email: " + alphaUser.mail ||"" ;
                        passwordExpiration = ""
                      }
                      // NR: Adding Fix Defect 206209  End

                    }
                }
            }
            var accountDetails = {
                "kyidID": alphaUser._id,
                "kogID": kogid ? kogid : "",
                "upn": alphaUser.frIndexedString1 ? alphaUser.frIndexedString1 : "",
                "logon": alphaUser.frIndexedString2 ? alphaUser.frIndexedString2 : "",
                "accountType": accountType,
                "accountStatus": alphaUser.accountStatus ? alphaUser.accountStatus : ""
            }

            var accountDates = {
                // "accountCreationDate": alphaUser.custom_createDateISO ? alphaUser.custom_createDateISO : "",
                "accountCreationDate": alphaUser.custom_createDateISO || alphaUser.custom_createDate || "", // NR:  Adding Fix Defect 206209  Start
                "accountLastModifiedDate": alphaUser.custom_updatedDateISO ? alphaUser.custom_updatedDateISO : "",
                "lastLogonTimeStamp": alphaUser.custom_lastLogonDate ? alphaUser.custom_lastLogonDate : "",
                "passwordLastModified": passwordLastChangedTime,
                "passwordExpiration": passwordExpiration,
                "terminationDate": alphaUser.custom_terminationDate ? alphaUser.custom_terminationDate : ""
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
                        "id": alphaUser._id,
                        "primaryEmail": alphaUser.mail ? alphaUser.mail : "",
                        "isEnrolledInMFA": alphaUser.custom_selfEnrollMFA ? alphaUser.custom_selfEnrollMFA : false,
                        "accountRecoveryAndMFA": accountRecoveryAndMFA,
                        "accountDetails": accountDetails,
                        "accountDates": accountDates
                    }
                }
            }
            return returnPayload;
        } else {
            let returnPayload = {
                "responseCode": 0,
                "transactionId": request.content.transactionId,
                "message": {
                    "content": "Success",
                    "code": "0"
                },
                "payload": {
                    "data": {
                    }
                }
            }
            return returnPayload;
        }
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


function getViewUserPersonalInformation(queryFilter) {
    try {
        //var alphaUser = openidm.read("managed/alpha_user/" + queryFilter.userAccountId, null, ["*"]);
        logger.error("kyid account endpoint getViewUserPersonalInformation - START - queryFilter: " + JSON.stringify(queryFilter));
        logger.error("kyid account endpoint getViewUserPersonalInformation - userAccountId: " + queryFilter.userAccountId);

        var userIdentityResponse = openidm.query("managed/alpha_kyid_user_identity", {
            "_queryFilter": '/account/_refResourceId eq "' + queryFilter.userAccountId + '"'
        }, ["*"]);
        logger.error("kyid account endpoint getViewUserPersonalInformation userIdentityResponse: " + JSON.stringify(userIdentityResponse));
        logger.error("kyid account endpoint getViewUserPersonalInformation resultCount: " + userIdentityResponse.resultCount);

        //logger.error("kyid account endpoint getViewUserPersonalInformation userIdentityResponse: " + userIdentityResponse);

        var userIdentity = userIdentityResponse.result[0];

        if (userIdentity && userIdentity != null) {
            
            //dharjani: TFS208614 - Placing language preference code within defensive null check
            var langPref = "English";
            if (userIdentity.languagePreference && userIdentity.languagePreference == "1") {
                langPref = "English";
            } else if (userIdentity.languagePreference == "2") {
                langPref = "Spanish";
            }

            var gender = "";
            if (userIdentity.gender != null) {
                if (userIdentity.gender === "M" || userIdentity.gender === "Male") {
                    gender = "Male";
                } else if (userIdentity.gender === "F" || userIdentity.gender === "Female") {
                    gender = "Female";
                } else if (userIdentity.gender === "O") {
                    gender = "Other";
                }
            }

            var basicInformation = [{
                "label": {
                    "es": "es_GivenName",
                    "en": "GivenName"
                },
                "value": userIdentity.givenName ? userIdentity.givenName : ""
            },
            {
                "label": {
                    "es": "es_Middlename",
                    "en": "Middlename"
                },
                "value": userIdentity.middleName ? userIdentity.middleName : ""
            },
            {
                "label": {
                    "es": "es_LastName",
                    "en": "LastName"
                },
                "value": userIdentity.sn ? userIdentity.sn : ""
            },
            {
                "label": {
                    "es": "es_Suffix",
                    "en": "Suffix"
                },
                "value": userIdentity.suffix ? userIdentity.suffix : ""
            },
            {
                "label": {
                    "es": "es_Gender",
                    "en": "Gender"
                },
                "value": gender
            },
            {
                "label": {
                    "es": "es_DateOfBirth",
                    "en": "DateOfBirth"
                },
                "value": userIdentity.dob ? userIdentity.dob : ""
            },
            {
                "label": {
                    "es": "es_LanguagePreference",
                    "en": "LanguagePreference"
                },
                "value": langPref
            }
            ];

            var homeAddress = [{
                "label": {
                    "es": "es_Address1",
                    "en": "Address1"
                },
                "value": userIdentity.addressLine1 ? userIdentity.addressLine1 : ""
            },
            {
                "label": {
                    "es": "es_Address2",
                    "en": "Address2"
                },
                "value": userIdentity.addressLine2 ? userIdentity.addressLine2 : ""
            },
            {
                "label": {
                    "es": "es_City",
                    "en": "City"
                },
                "value": userIdentity.city ? userIdentity.city : ""
            },
            {
                "label": {
                    "es": "es_State",
                    "en": "State"
                },
                "value": userIdentity.stateCode ? userIdentity.stateCode : ""
            },
            {
                "label": {
                    "es": "es_Zipcode",
                    "en": "Zipcode"
                },
                "value": userIdentity.zip ? userIdentity.zip : ""
            },
            //fix for the ticket 202718 to add country code and adjust the order
            {
                "label": {
                    "es": "es_County",
                    "en": "County"
                },
                "value": userIdentity.countyCode ? userIdentity.countyCode : ""
            },
            {
                "label": {
                    "es": "es_Country",
                    "en": "Country"
                },
                "value": userIdentity.countryCode ? userIdentity.countryCode : ""
            }
            ]

            //fix for ticket 202718, verification status is missing, order is not correct
            
            var verificationMethod = "";
            var verificationStatus = "Not Verified"
            if(userIdentity.verificationStatus && userIdentity.verificationStatus === "verified"){ // This is added for new RIDP Implementation
              verificationStatus = "Verified"
            }
          else{
            verificationStatus = "Not Verified"
          }
            switch (userIdentity.proofingMethod) {
                case "-1":
                    verificationStatus = "Not Verified";
                    break;
                case "0":
                    // verificationStatus = "Verified"
                    verificationMethod = "Risk based";
                    break;
                case "1":
                    // verificationStatus = "Verified"
                    verificationMethod = "Lexis Nexis Verification";
                    break;
                case "4":
                    // verificationStatus = "Verified"
                    verificationMethod = "Lexis Nexis KBA";
                    break;
                case "2":
                    // verificationStatus = "Verified"
                    verificationMethod = "CMS KBA";
                    break;
                case "3":
                    // verificationStatus = "Verified"
                    verificationMethod = "In-Person";
            }


            var identityVerification = [
                {
                    "label": {
                        "es": "es_Verification Status",
                        "en": "Verification Status"
                    },
                    "value": verificationStatus
                },
                {
                    "label": {
                        "es": "es_Verification Method",
                        "en": "Verification Method"
                    },
                    "value": verificationMethod
                },
                {
                    "label": {
                        "es": "es_Lastsuccessfulverification",
                        "en": "Lastsuccessfulverification"
                    },
                    "value": userIdentity.lastVerificationDate ? userIdentity.lastVerificationDate : ""
                }
            ]

            var organDonar = "No";
            logger.error("Organ Donor Status for user " + userIdentity._id + ": " + userIdentity.organDonorRegistrationStatus);
            logger.error("Type of organDonorRegistrationStatus: " + typeof userIdentity.organDonorRegistrationStatus);
            if ((typeof userIdentity.organDonorRegistrationStatus === "boolean" && userIdentity.organDonorRegistrationStatus === true) ||
                (typeof userIdentity.organDonorRegistrationStatus === "string" && (userIdentity.organDonorRegistrationStatus.toLowerCase() === "yes" || userIdentity.organDonorRegistrationStatus.toLowerCase() === "true")))
            {
                organDonar = "Yes";
            }

            var organDonor = [{
                "label": {
                    "es": "es_RegisteredASADonor",
                    "en": "RegisteredASADonor"
                },
                "value": organDonar
            }]

            let returnPayload = {
                "responseCode": 0,
                "transactionId": request.content.transactionId,
                "message": {
                    "content": "Success",
                    "code": "0"
                },
                "payload": {
                    "data": {
                        "_Id": userIdentity._id,
                        "Basic Information": basicInformation,
                        "Home Address": homeAddress,
                        "Identity Verification": identityVerification,
                        "Organ Donor": organDonor
                    }
                }
            }

            return returnPayload;
        } else {
            let returnPayload = {
                "responseCode": 0,
                "transactionId": request.content.transactionId,
                "message": {
                    "content": "Success",
                    "code": "0"
                },
                "payload": {
                    "data": {
                    }
                }
            }
            return returnPayload;
        }

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

function getViewOrganizationInformation(queryFilter) {
    try {
        var alphaUser = openidm.read("managed/alpha_user/" + queryFilter.userAccountId, null, ["*"]);
        var orgInfo = []
        if (alphaUser && alphaUser != null) {
            if (alphaUser.frUnindexedString1 && alphaUser.frUnindexedString1 == "Internal") {
                orgInfo = [{
                    "label": {
                        "es": "es_Active domain directory",
                        "en": "Active domain directory"
                    },
                    "value": alphaUser.frUnindexedString2
                },
                {
                    "label": {
                        "es": "es_Job classification",
                        "en": "Job classification"
                    },
                    "value": alphaUser.custom_jobClassification
                },
                {
                    "label": {
                        "es": "es_Level 5 approval unit",
                        "en": "Level 5 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit5Code
                },
                {
                    "label": {
                        "es": "es_Level 4 approval unit",
                        "en": "Level 4 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit4Code
                },
                {
                    "label": {
                        "es": "es_Level 3 approval unit",
                        "en": "Level 3 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit3Code
                },
                {
                    "label": {
                        "es": "es_Level 2 approval unit",
                        "en": "Level 2 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit2Code
                },
                {
                    "label": {
                        "es": "es_Level 1 approval unit",
                        "en": "Level 1 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit1Code
                }
                ]
            } else {

                orgInfo = [{
                    "label": {
                        "es": "es_Active domain directory",
                        "en": "Active domain directory"
                    },
                    "value": alphaUser.frUnindexedString2
                },
                {
                    "label": {
                        "es": "es_Level 5 approval unit",
                        "en": "Level 5 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit5Code
                },
                {
                    "label": {
                        "es": "es_Level 4 approval unit",
                        "en": "Level 4 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit4Code
                },
                {
                    "label": {
                        "es": "es_Level 3 approval unit",
                        "en": "Level 3 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit3Code
                },
                {
                    "label": {
                        "es": "es_Level 2 approval unit",
                        "en": "Level 2 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit2Code
                },
                {
                    "label": {
                        "es": "es_Level 1 approval unit",
                        "en": "Level 1 approval unit"
                    },
                    "value": alphaUser.custom_approvalUnit1Code
                }
                ]
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
                        "data": orgInfo
                    }
                }
            }

            return returnPayload;
        } else {
            let returnPayload = {
                "responseCode": 0,
                "transactionId": request.content.transactionId,
                "message": {
                    "content": "Success",
                    "code": "0"
                },
                "payload": {
                    "data": []
                }
            }
            return returnPayload;
        }


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
        // Append browser and OS info to eventDetails
    let os = context.http && context.http.headers && context.http.headers['sec-ch-ua-platform'] ? context.http.headers['sec-ch-ua-platform'] : "";
    os = os ? os.replace(/^"|"$/g, '').replace(/\\"/g, '') : "";
    if (eventDetails) {
    eventDetails.os = typeof os !== "undefined" ? os : "";
    }
    var logPayload = {
        eventCode:eventCode,
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

function decodeAccessToken(token) {
    try {
        logger.error("decodeAccessToken ::inside ");
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

        logger.error("decodeAccessToken ::inside " + JSON.parse(decodedTokenPayload).sessionRefId);
        return JSON.parse(decodedTokenPayload).sessionRefId

    } catch (error) {
        logger.error("decodeAccessToken ::inside " + error);
        throw {
            code: 400,
            message: "Exception when decode access token"
        }
    }
}

function checkConnector(domain) {
    var extDomain = identityServer.getProperty("esv.kyid.ext.ad.domain")
    var connectorName = ""
    if (extDomain.localeCompare(domain) == 0) {

        if (identityServer.getProperty("esv.kyid.ext.connector") && identityServer.getProperty("esv.kyid.ext.connector") != null) {

            connectorName = identityServer.getProperty("esv.kyid.ext.connector").toLowerCase();
        }
    } else {
        if (domain && domain != null) {

            connectorName = domain.replace(/\./g, '');
            //connectorName= identityServer.getProperty("esv.kyid.internal.connector").toLowerCase(); 
            logger.error("NameOfInternalConnector:" + connectorName)
        }
    }

    return connectorName
}

function getPasswordExpiration(connectorName, UserNameAttribute, UserNameAttributeValue) {
    var query = { _queryFilter: UserNameAttribute + ` eq "` + UserNameAttributeValue + `"`, }
    logger.error("query filter created" + JSON.stringify(query));
    var passwordExpiration = ""
    try {

        var ldapUserQuery = openidm.query(`system/` + connectorName + `/User`, query);
        
        var ldapUser = ldapUserQuery.result[0];
        if (ldapUser["msDS-UserPasswordExpiryTimeComputed"]) {

            passwordExpiration = passwordExpirationConvert(ldapUser["msDS-UserPasswordExpiryTimeComputed"]).toISOString()
        }

        return passwordExpiration

    } catch (error) {
         logger.error("Exception when query passwordLastModified" + JSON.stringify(error));
        /*throw {
            code: 400,
            message: "Exception when query passwordExpiration"
        }*/
          return passwordExpiration 
    }

}

function getPasswordModified(connectorName, UserNameAttribute, UserNameAttributeValue) {
    var query = { _queryFilter: UserNameAttribute + ` eq "` + UserNameAttributeValue + `"`, }
    logger.error("query filter created" + JSON.stringify(query));
    var passwordLastModified = ""
    try {

        var ldapUserQuery = openidm.query(`system/` + connectorName + `/User`, query);
        var passwordLastModified = ""
        var ldapUser = ldapUserQuery.result[0];

        if (ldapUser["pwdLastSet"]) {

            passwordLastModified = ldapUser["pwdLastSet"]
        }

        return passwordLastModified

    } catch (error) {
         logger.error("Exception when query passwordLastModified" + JSON.stringify(error));
       /* throw {
            code: 400,
            message: "Exception when query passwordLastModified"
        } */
       return passwordLastModified
    }

}


function passwordExpirationConvert(filetimeValue) {

    // Epoch difference in milliseconds between 1601-01-01 and 1970-01-01
    // (11644473600000 milliseconds)
    const epochDiff = 11644473600000;

    // Convert 100-nanosecond intervals to milliseconds
    const milliseconds = filetimeValue / 10000;

    // Create a new Date object using the adjusted milliseconds
    const date = new Date(milliseconds - epochDiff);

    return date;
}

function updateUserProfile(userProfileInfo) {
    try {

        let requestedUser = userProfileInfo.requestedUser
        let userQueryFilter = `/${requestedUser.userIdAttributeName} eq "${requestedUser.userIdAttributeValue}"`
        logger.error("update user profile userQueryFilter: " + userQueryFilter)

        let userResponse = openidm.query("managed/alpha_user",
            {
                "_queryFilter": userQueryFilter
            },
            ["*"]
        ).result[0];

        logger.error("update user profile userReponse: " + userResponse)

        if (userResponse.length == 0) {
            throw {
                code: 400,
                message: `user with query condition / ${requestedUser.userIdAttributeName} eq "${requestedUser.userIdAttributeValue}" not found`
            }
        }


        let userAlpha = userProfileInfo.requests.alpha_user
        let userIdentityInfo = userProfileInfo.requests.user_identity
        let phoneNumber = userProfileInfo.requests.alpha_kyid_mfa_methods[0].propertyValue

        logger.error("update user profile userAlpha: " + userAlpha)
        logger.error("update user profile userIdentityInfo: " + userIdentityInfo)
        logger.error("update user profile phoneNumber: " + phoneNumber)


        let userPatchOperations = []

        if (userAlpha.length > 0) {
            userAlpha.forEach(item => {
                if (item && item.propertyValue) {
                    userPatchOperations.push({
                        "operation": "replace",
                        field: "/" + item.propertyName,
                        value: item.propertyValue
                    })
                }
            })
        }

        let userPatchResult = openidm.patch("managed/alpha_user/" + userResponse._id, null, userPatchOperations)
        // logger.error("update user profile userPatchResult: " + userPatchResult)



        let userIdentityPatchOperations = []

        if (userIdentityInfo.length > 0) {
            userIdentityInfo.forEach(item => {
                if (item && item.propertyValue) {

                    userIdentityPatchOperations.push({
                        operation: "replace",
                        field: "/" + item.propertyName,
                        value: item.propertyValue
                    })
                }
            })
        }



        let userIdentityPatchResult = openidm.patch("managed/alpha_kyid_user_identity/" + userResponse.custom_userIdentity._refResourceId, null, userIdentityPatchOperations);
        logger.error("update user profile userIdentityPatchResult: " + userIdentityPatchResult)



        let userSMSVoice = openidm.query("managed/alpha_kyid_mfa_methods",
            {
                "_queryFilter": `/KOGId eq "${userResponse.userName}" AND /MFAMethod eq "SMSVOICE" AND (/MFAStatus eq "ACTIVE" OR /MFAStatus eq "0")`,
            },
            ["*"]
        ).result;


        logger.error("update user profile userSMSVoice: " + userSMSVoice)


        let isPhoneNumberRegistered = false

        if (userSMSVoice && userSMSVoice.length > 0) {
            for (let i = 0; i < userSMSVoice.length; i++) {
                if (userSMSVoice[i].MFAValue == phoneNumber + "") {
                    isPhoneNumberRegistered = true
                    break
                }
            }
        }



        if (phoneNumber && !isPhoneNumberRegistered) {
            let userMFAMethod = {
                // "_id": UUID.randomUUID().toString(),
                "KOGId": userResponse.userName,
                "MFAMethod": "SMSVOICE",
                "MFAValue": phoneNumber,
                "MFAStatus": "ACTIVE",
                "isRecoveryOnly": true
            }


            let MFAUpdateResult = openidm.create("managed/alpha_kyid_mfa_methods/", null, userMFAMethod);
            logger.error("update user profile MFAUpdateResult: " + MFAUpdateResult)
        }

        let returnPayload = {
            "responseCode": 0,
            "transactionId": context.transactionId.transactionId.value,
            "message": {
                "content": "User profile updated successfuly. User _id: " + userResponse._id,
                "code": "0"
            }
        }

        return returnPayload
    } catch (error) {
        throw {
            code: 400,
            message: "Exception when update user profile"
        }
    }
}

/**
 * Get audit logger context including client IP and Browser
 * @returns {object} Audit logger context object
 */
function getAuditLoggerContext() {
    let transactionIdauditLogger = "";
    let sessionRefIDauditLogger = "";
    let sessionDetailsauditLogger = {};
    let clientIP = "Unknown";
    let clientBrowser = "Unknown";

    try {
        transactionIdauditLogger = context.transactionId && context.transactionId.transactionId && context.transactionId.transactionId.value
            ? context.transactionId.transactionId.value
            : "";
    } catch (e) {
        logger.error("Failed to get transactionId from context: " + e);
    }

    try {
        sessionRefIDauditLogger = context.oauth2 && context.oauth2.rawInfo && context.oauth2.rawInfo.sessionRefId
            ? context.oauth2.rawInfo.sessionRefId
            : "";
    } catch (e) {
        logger.error("Failed to get sessionRefId from context: " + e);
    }

    try {
        sessionDetailsauditLogger = sessionRefIDauditLogger
            ? {"sessionRefId": sessionRefIDauditLogger}
            : {};
    } catch (e) {
        logger.error("Failed to get sessionDetails from context: " + e);
    }

    // Get client IP and Browser
    try {
        // Try to get headers from both context and request
        var contextHeaders = context.http && context.http.headers ? context.http.headers : {};
        var requestHeaders = request.headers || {};

        // Debug: log request structure to see what's available
        logger.error("DEBUG getAuditLoggerContext :: request keys: " + JSON.stringify(Object.keys(request)));
        if (Object.keys(requestHeaders).length > 0) {
            logger.error("DEBUG getAuditLoggerContext :: request.headers: " + JSON.stringify(requestHeaders));
        }

        // Get IP from context.http.headers - priority: X-Real-IP > X-Trusted-Forwarded-For > X-Forwarded-For
        clientIP = contextHeaders["x-real-ip"] ||
                   (contextHeaders["x-trusted-forwarded-for"] ? contextHeaders["x-trusted-forwarded-for"].split(',')[0].trim() : null) ||
                   (contextHeaders["x-forwarded-for"] ? contextHeaders["x-forwarded-for"].split(',')[0].trim() : null) ||
                   "Unknown";

        // Try to get User-Agent from request.headers or context.http.headers
        clientBrowser = requestHeaders["user-agent"] || requestHeaders["User-Agent"] ||
                       contextHeaders["user-agent"] || contextHeaders["User-Agent"] || "Unknown";
    } catch (e) {
        logger.error("Failed to get client info from context: " + e);
    }

    return {
        transactionIdauditLogger: transactionIdauditLogger,
        sessionRefIDauditLogger: sessionRefIDauditLogger,
        sessionDetailsauditLogger: sessionDetailsauditLogger,
        clientIP: clientIP,
        clientBrowser: clientBrowser
    };
}

(function () {

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
                        var input = {
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
                        var input = {
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
                            "conditions": request.content.payload.searchParameters
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
                if (view == "AccountStatusUpdate") {
                    return updateAccountStatus(payload);
                } else if (view == "UserIdentityUpdate") {
                    return updateUserIdentity(payload);
                }
            }

        } else if (action == 5) {
            return updateUserProfile(payload.requests)
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
        logger.error("AccountSearch 3");
        if (input.payload) {
            const returnProperties = input.payload.returnProperties
            const queryFilter = input.payload.queryFilter
            let filterCondition = ""

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
*/
function updateAccountStatus(payload) {
    const transactionId = "";
    const sessionRefID = "";
    var eventCode = ""
    var eventName = ""
    var eventDetails;


    try {
        var comment = payload.comment;
        var action = payload.status;
        var reason = payload.reason;
        var requesterId = payload.requesterId;
        var status = "active";
        var emailAppend = Math.floor(Math.random() * 999) + 100;
        var email = payload.email;
        transactionId = context.parent.parent.parent.parent.parent.parent.transactionId.value;
        sessionRefID = decodeAccessToken(context.parent.parent.parent.parent.parent.token);


        let returnPayload = [];

        let currentTimeinEpoch = Date.now()
        let currentDate = new Date().toISOString()
        logger.error("UserId: --> " + "currentTimeinEpoch: -- > " + currentTimeinEpoch + "currentDate--> " + currentDate)


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
        if (status == "Terminated" && payload.reuseEmail) {
            var emailNew = email.split("@")[0] + "@" + emailAppend + email.split("@")[1];
            jsonArray.push({
                operation: "replace",
                field: "/mail",
                value: emailNew
            })
        }
        const updateAccountResponse = openidm.patch("managed/alpha_user/" + payload.userAccountId, null, jsonArray);



        if (updateAccountResponse) {
            logger.error("Update Account Response is --> " + updateAccountResponse)
        }
        var kogAPIResponse = invokeKOGAPI(payload);
        if (kogAPIResponse && kogAPIResponse.ResponseStatus !== 0) {
            logger.error("Update KOG API Response is --> " + kogAPIResponse)
        }

        var accessAPIResponse = removeUserRoles(payload.userAccountId, reason, comment, requesterId);
        if (accessAPIResponse && accessAPIResponse.responseCode !== 0) {
            logger.error("Remove roles Response is --> " + accessAPIResponse)
        }

        returnPayload = {
            "responseCode": 0,
            "transactionId": transactionId,
            "message": {
                "content": "User status updated successfuly :" + payload.userAccountId,
                "code": "0"
            }
        }

        eventDetails = {
            "reason": reason,
            "comment": comment
        };


        auditLogger(eventCode, "", eventName, eventDetails, requesterId, payload.userAccountId, transactionId, updateAccountResponse.mail, "", sessionRefID);


        return returnPayload;
    } catch (error) {
        logger.error("Error in updating the user " + error);
        let returnPayload = {
            "responseCode": 2,
            "transactionId": request.content.transactionId,
            "message": {
                "content": "error in updating user status :" + payload.userAccountId,
                "code": "2"
            }
        }

        eventDetails = {
            "Error": "Error in updating user status "
        }

        if (payload.status == "Terminate") {
            status = "Terminated";
            eventCode = "ACM002"
            eventName = "Account Termination Failure";

        } else if (payload.status == "Deactivate") {
            status = "inactive";
            eventCode = "ACM006"
            eventName = "Account Deactivation Failure";

        } else if (payload.status == "Activate") {
            status = "active";
            eventCode = "ACM004"
            eventName = "Account Activation Failure";
        }

        auditLogger(eventCode, "", eventName, eventDetails, payload.requesterId, payload.userAccountId, transactionId, "", "", sessionRefID);

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
 * Call KOG API for updating user status
 */
function invokeKOGAPI(payload) {
    try {
        const requestBody = {
            "url": identityServer.getProperty("esv.kyid.usr.updateuserstatus"),
            //  "url" : "https://dev.sih.ngateway.ky.gov/ide3/kyidapi/V1/updateuserstatus",
            //"scope": identityServer.getProperty("esv.kyid.kogapi.token.updateuserstatus"),
            "scope": "kogkyidapi.updateuserstatus",
            "method": "POST",
            "payload": {
                //"KOGID": userPrereqObj._id,
                "KOGID": getKOGIDForUser(payload.userAccountId),
                "TransactionID": request.content.transactionId,
                "UserStatus": 3,
                "IsSuspended": false,
                "SuspendedReason": null,
                "EnabledReason": null,
                "TerminationDate": formatCurrentUTCMinus5(),
                "TerminationReason": payload.reason,
                "RequestorKOGID": getKOGIDForUser(payload.requesterId)
            }
        }
        const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);
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

function formatCurrentUTCMinus5() {
    // Get current UTC time
    const now = new Date();

    // Calculate UTC-4 by subtracting 4 hours (in ms)
    const utcMinus4 = new Date(now.getTime() - 5 * 60 * 60 * 1000);

    // Helper to pad numbers
    const pad = (num, size) => num.toString().padStart(size, '0');

    // Extract components
    const year = utcMinus4.getUTCFullYear();
    const month = pad(utcMinus4.getUTCMonth() + 1, 2);
    const day = pad(utcMinus4.getUTCDate(), 2);
    const hour = pad(utcMinus4.getUTCHours(), 2);
    const minute = pad(utcMinus4.getUTCMinutes(), 2);
    const second = pad(utcMinus4.getUTCSeconds(), 2);
    const millis = pad(utcMinus4.getUTCMilliseconds(), 3);

    // Format as "YYYY-MM-DD HH:MM:SS.sss"
    return `${year}-${month}-${day} ${hour}:${minute}:${second}.${millis}`;
}

/* This method updates user status along with audit data
*/
function updateUserIdentity(payload) {
    var eventCode = "";
    var eventName = "";
    var eventDetails = "";
    var sessionRefID = "";
    var transactionId = "";

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

        transactionId = context.parent.parent.parent.parent.parent.parent.transactionId.value;
        sessionRefID = decodeAccessToken(context.parent.parent.parent.parent.parent.token);


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

        eventDetails = payload.updateParameters;

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

        auditLogger(eventCode, "", eventName, eventDetails, payload.requesterId, payload.userAccountId, transactionId, "", "", sessionRefID);
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
        auditLogger(eventCode, "", eventName, eventDetails, payload.requesterId, payload.userAccountId, transactionId, "", "", sessionRefID);
        return returnPayload;
    }

}


function getViewAccountInformation(queryFilter) {
    try {
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
            var domain = Logon.split("@")
            var connector = checkConnector(domain[1])
            if (alphaUser.frIndexedString1) {

                passwordExpiration = getPasswordExpiration(connector, "userPrincipalName", alphaUser.frIndexedString1)
                passwordLastChangedTime = getPasswordModified(connector, "userPrincipalName", alphaUser.frIndexedString1)

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
                "accountCreationDate": alphaUser.custom_createDateISO ? alphaUser.custom_createDateISO : "",
                "accountLastModifiedDate": alphaUser.custom_updatedDateISO ? alphaUser.custom_updatedDateISO : "",
                "lastLogonTimeStamp": alphaUser.custom_lastLogonDate ? alphaUser.custom_lastLogonDate : "",
                "passwordLastModified": passwordLastChangedTime,
                "passwordExpiration": passwordExpiration
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


        var userIdentityResponse = openidm.query("managed/alpha_kyid_user_identity", {
            "_queryFilter": '/account/_refResourceId eq "' + queryFilter.userAccountId + '"'
        }, ["*"]);
        logger.error("kyid account endpoint getViewUserPersonalInformation userIdentityResponse: " + userIdentityResponse);

        var userIdentity = userIdentityResponse.result[0];

        var langPref = "English";
        if (userIdentity.languagePreference && userIdentity.languagePreference == "1") {
            langPref = "English";
        } else if (userIdentity.languagePreference == "2") {
            langPref = "Spanish";
        }



        if (userIdentity && userIdentity != null) {

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
            switch (userIdentity.proofingMethod) {
                case "-1":
                    verificationStatus = "Not Verified";
                    break;
                case "0":
                    verificationStatus = "Verified"
                    verificationMethod = "Risk based";
                    break;
                case "1":
                    verificationStatus = "Verified"
                    verificationMethod = "Lexis Nexis KBA";
                    break;
                case "2":
                    verificationStatus = "Verified"
                    verificationMethod = "CMS KBA";
                    break;
                case "3":
                    verificationStatus = "Verified"
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
            if (userIdentity.organDonorRegistrationStatus) {
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
 * @param apllicationId 
 * @param sessionRefId 
 */
function auditLogger(eventCode, sessionDetails, eventName, eventDetails, requesterUserId, requestedUserId, transactionId, emailId, applicationID, sessionRefId) {
    try {
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
            applicationName: applicationID || "",
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

    try {

        var ldapUserQuery = openidm.query(`system/` + connectorName + `/User`, query);
        var passwordExpiration = ""
        var ldapUser = ldapUserQuery.result[0];
        if (ldapUser["msDS-UserPasswordExpiryTimeComputed"]) {

            passwordExpiration = passwordExpirationConvert(ldapUser["msDS-UserPasswordExpiryTimeComputed"]).toISOString()
        }

        return passwordExpiration

    } catch (error) {

        throw {
            code: 400,
            message: "Exception when query passwordExpiration"
        }
    }

}

function getPasswordModified(connectorName, UserNameAttribute, UserNameAttributeValue) {
    var query = { _queryFilter: UserNameAttribute + ` eq "` + UserNameAttributeValue + `"`, }
    logger.error("query filter created" + JSON.stringify(query));

    try {

        var ldapUserQuery = openidm.query(`system/` + connectorName + `/User`, query);
        var passwordLastModified = ""
        var ldapUser = ldapUserQuery.result[0];

        if (ldapUser["pwdLastSet"]) {

            passwordLastModified = ldapUser["pwdLastSet"]
        }

        return passwordLastModified

    } catch (error) {

        throw {
            code: 400,
            message: "Exception when query passwordLastModified"
        }
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

        let userResponse = openidm.query("managed/alpha_user",
            {
                "_queryFilter": `/${requestedUser.userIdAttributeName} eq "${requestedUser.userIdAttributeValue}"`,
            },
            ["*"]
        ).result;

        logger.error("update user profile userReponse: " + userResponse)

        if (userResponse.length == 0) {
            throw {
                code: 400,
                message: `user with query condition /${requestedUser.userIdAttributeName} eq "${requestedUser.userIdAttributeValue}" not found`
            }
        }


        let userAlpha = userProfileInfo.alpha_user
        let userIdentityInfo = userProfileInfo.user_identity
        let phoneNumber = userProfileInfo.alpha_kyid_mfa_methods

        logger.error("update user profile userAlpha: " + userAlpha)
        logger.error("update user profile userIdentityInfo: " + userIdentityInfo)
        logger.error("update user profile phoneNumber: " + phoneNumber)


        let userPatchOperations = []

        if (userAlpha.length > 0) {
            userAlpha.forEach(item => {
                userPatchOperations.push({
                    operation: "replace",
                    field: "/" + item.propertyName,
                    value: item.propertyValue
                })
            })
        }

        let userPatchResult = openidm.patch("managed/alpha_user/" + userResponse._id, null, userPatchOperations);
        logger.error("update user profile userPatchResult: " + userPatchResult)


        let userIdentityPatchOperations = []

        if (userIdentityInfo.length > 0) {
            userIdentityInfo.forEach(item => {
                userIdentityPatchOperations.push({
                    operation: "replace",
                    field: "/" + item.propertyName,
                    value: item.propertyValue
                })
            })
        }

        let userIdentityPatchResult = openidm.patch("managed/alpha_kyid_user_identity/" + userResponse.custom_userIdentity._id, null, userIdentityPatchOperations);
        logger.error("update user profile userIdentityPatchResult: " + userIdentityPatchResult)



        let userSMSVoice = openidm.query("managed/alpha_kyid_mfa_methods",
            {
                "_queryFilter": `/KOGId eq "${userResponse.userName}" AND /MFAMethod eq "SMSVOICE" AND /MFAStatus eq "ACTIVE" or "0" `,
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
                "_id": UUID.randomUUID().toString(),
                "KOGId": userResponse.userName,
                "MFAMethod": "SMSVOICE",
                "MFAValue": phoneNumber,
                "MFAStatus": "ACTIVE",
                "isRecoveryOnly": true
            }
            let MFAUpdateResult = openidm.create("managed/alpha_kyid_mfa_methods/", null, userMFAMethod);
            logger.error("update user profile MFAUpdateResult: " + MFAUpdateResult)
        }


    } catch (error) {
        throw {
            code: 400,
            message: "Exception when update user profile"
        }
    }
}
var UUID = java.util.UUID;

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
          // return res
        }
    } catch (error) {
        logger.error("Exception caught => " + getException(error))
        return {"status":500, "message":error}
    }
  
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
            "custom_userType",
            "corrected_givenName",
            "corrected_sn"
        ]
        logger.error("account_v2B :: Received action: " + action + " (type: " + typeof action + ")")

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
                            "businessAppId": request.content.businessAppId ? request.content.businessAppId : null,
                            "searchInKOG": request.content.searchInKOG ? request.content.searchInKOG : false
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

        } else if (action === 5) {
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

function diffInDays(lastVerificationDate) {
    var dateTime = new Date().toISOString();
    try {
      if(lastVerificationDate){

        // Convert to Date objects
        var date1 = new Date(lastVerificationDate);
        var date2 = new Date(dateTime);
        date1.setHours(0, 0, 0, 0);
        date2.setHours(0, 0, 0, 0);
        var diffInMs = date2 - date1;

        // Check if today is strictly after the last verification date's day
        var diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        return diffInDays;
      }
      else{
        return 1;
      }

    } catch (error) {
        logger.error("Error in checkDate function " + error);
        return 1;
    }
}

function isRidpRetryLimitReached(verificationAttempt,lastVerificationDate) {
    try {
        verificationAttempt = Number(verificationAttempt)
        const ridpFlag = identityServer.getProperty("esv.ridp.user.verification.version.flag") ? identityServer.getProperty("esv.ridp.user.verification.version.flag") : "v1"
        if (ridpFlag == "v2") {
            if (identityServer.getProperty("esv.user.verification.bsp.retry.limit")) {
                var retryLimit = Number(identityServer.getProperty("esv.user.verification.bsp.retry.limit"))
                logger.error("verificationAttempt is --> "+ verificationAttempt)
                logger.error("retryLimit is --> "+ retryLimit)
                if (verificationAttempt >= retryLimit) {
                    logger.error("lastVerificationDate --> "+lastVerificationDate)
                    diffInDays = diffInDays(lastVerificationDate);
                    logger.error("diffInDays is --> "+ diffInDays)
                    if (identityServer.getProperty("esv.user.verification.bsp.refresh.limit")) {
                        var refreshLimit = Number(identityServer.getProperty("esv.user.verification.bsp.refresh.limit"))
                        logger.error("refreshLimit in endpoint/account_v2B.Retry.isRidpRetryLimitReached . Check :: " + refreshLimit)

                        if (Number(diffInDays) < Number(refreshLimit)) {
                          logger.error("diffInDays < refreshLimit" + verificationAttempt);
                            return true

                        } else {
                            logger.error("Retry Attempt Allowed After Date Check. Current Attempt: " + verificationAttempt);
                            return false

                        }
                    }
                }
                else {
                    logger.error("verificationAttempt >= retryLimit Else Condtion");
                    return false
                }

            } else {
                logger.error("retryLimit Not Present");
                return false
            }
        }
        else {
            logger.error("ridpFlag is v1");
            return false
        }
    } catch (error) {
       logger.error("isRidpRetryLimitReached Function Error Occurrd "+error);
        return false

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
                if (input.searchInKOG) {
                    return kogSearch(input, queryFilter, returnProperties, alphaUserType, ACCOUNT_SEARCH_FILTER_ROLE);
                }

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
                    //LexIDSearch
                    let lexIdSearchParam = '';

                    if (queryFilter.conditions) {
                        queryFilter.conditions.forEach(condition => {
                            if (condition.name === "mobileNumber") {
                                telephoneSearchParam = condition.value;
                            //LexIDSearch
                            } else if (condition.name === "LexID" || condition.name === "lexid") {
                                lexIdSearchParam = condition.value;
                            } else {
                                if (filterCondition !== "") {
                                    filterCondition += ' AND ';
                                }
                                // For email: search exact match OR prefixed version with IA_ (only when terminated checkbox is checked)
                                if (condition.name === "mail") {
                                    if (input.isTerminated) {
                                        filterCondition += `(/mail eq "${condition.value}" or (/mail sw "IA_" and /mail co "${condition.value}"))`
                                    } else {
                                        filterCondition += `/mail eq "${condition.value}"`
                                    }
                                } else {
                                    filterCondition += `/${condition.name}/ eq "${condition.value}"`
                                }
                                //filterCondition += `/${condition.name}/ eq "${condition.value}"`
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
                    //Lexid Search
                    // LexID Search: searches by uuid field in alpha_kyid_user_identity table
                    if (lexIdSearchParam !== "") {
                        logger.error("LexID Search - Searching for uuid: " + lexIdSearchParam);
                        
                        let userIdentityResponse = openidm.query("managed/alpha_kyid_user_identity", {
                            "_queryFilter": '/uuid eq "' + lexIdSearchParam + '"'
                        }, ["*"]);
                        
                        logger.error("LexID Search - Response: " + JSON.stringify(userIdentityResponse));
                        logger.error("LexID Search - Result count: " + (userIdentityResponse.result ? userIdentityResponse.result.length : 0));

                        if (userIdentityResponse && userIdentityResponse.result && userIdentityResponse.result.length > 0) {
                            filterCondition += " AND (";
                            for (var i = 0; i < userIdentityResponse.result.length; i++) {
                                if (i > 0) {
                                    filterCondition += " OR ";
                                }
                                // account is an array, need to access account[0]._refResourceId
                                if (userIdentityResponse.result[i].account && userIdentityResponse.result[i].account.length > 0) {
                                    var accountId = userIdentityResponse.result[i].account[0]._refResourceId;
                                    logger.error("LexID Search - Found account ID: " + accountId);
                                    filterCondition += '_id eq "' + accountId + '"';
                                }
                            }
                            filterCondition += ")";
                        } else {
                            logger.error("LexID Search - No results found for uuid: " + lexIdSearchParam);
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

                // [OPTIMIZATION] Empty search + appSearch: use role membership query (indexed)
                // instead of effectiveRoles virtual field filter (full table scan).
                // Only for empty search (co ""); text search (co "Jerry") falls through to original code.
                // Returns early so original code below is untouched.
                var searchText = (queryFilter.conditions && queryFilter.conditions[0] && queryFilter.conditions[0].value) ? queryFilter.conditions[0].value.trim() : "";
                if (!input.isAdvanced && searchText === "" && input.businessAppId && input.businessAppId !== null) {
                    let appResponse = openidm.read("managed/alpha_kyid_businessapplication/" + input.businessAppId, null, ["roleAppId/*"]);
                    if (appResponse && appResponse !== null && appResponse.roleAppId.length > 0) {
                        logger.error("AccountSearch 5 - querying role members for " + appResponse.roleAppId.length + " roles");
                        var allResults = [];
                        var seenUserIds = {};
                        var BATCH_SIZE = 50;
                        var TARGET = 200;
                        var MEMBER_PAGE = TARGET;
                        var done = false;
                        for (var r = 0; r < appResponse.roleAppId.length && !done; r++) {
                            var roleId = appResponse.roleAppId[r]._refResourceId;
                            var membersResponse = openidm.query("managed/alpha_role/" + roleId + "/members", { "_queryFilter": "true", "_pageSize": MEMBER_PAGE }, []);
                            if (membersResponse && membersResponse.result) {
                                var newMemberIds = [];
                                for (var m = 0; m < membersResponse.result.length; m++) {
                                    var mid = membersResponse.result[m]._refResourceId;
                                    if (!seenUserIds[mid]) {
                                        seenUserIds[mid] = true;
                                        newMemberIds.push(mid);
                                    }
                                }
                                for (var i = 0; i < newMemberIds.length && !done; i += BATCH_SIZE) {
                                    var batch = newMemberIds.slice(i, i + BATCH_SIZE);
                                    var idFilter = "(" + batch.map(function(id) { return '_id eq "' + id + '"'; }).join(" OR ") + ")";
                                    var batchFilter = idFilter + ' AND /accountStatus eq "active"';
                                    var batchResponse = openidm.query("managed/alpha_user", { "_queryFilter": batchFilter, "_pageSize": BATCH_SIZE }, returnProperties);
                                    if (batchResponse && batchResponse.result) {
                                        allResults = allResults.concat(batchResponse.result);
                                    }
                                    if (allResults.length >= TARGET) {
                                        allResults = allResults.slice(0, TARGET);
                                        done = true;
                                    }
                                }
                            }
                        }
                        logger.error("AccountSearch 6 - results: " + allResults.length);
                        return {
                            "transactionId": input.transactionId,
                            "message": { "code": "0", "content": "Success" },
                            "payload": { "data": allResults }
                        };
                    }
                }

                // ---- Original code below (unchanged) ----
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
    var email = payload.email;
    var emailNew = email; // Default to original email
    var inactiveEmailCounter = 1; // Counter for INACTIVE prefix

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
        if (status == "Terminated" && payload.reuseEmail ) {
            // Get termination date in EST format: "M/D/YYYY H:MM:SS EST"
            var terminationDateEST = formatDateEST();
            
            // Extract date and time parts for format: YYMMDDHHMM
            var dateParts = terminationDateEST.split(/[\/\s:]+/); // Split by /, spaces, and colons
            var month = String(dateParts[0]).padStart(2, '0');
            var day = String(dateParts[1]).padStart(2, '0');
            var yearShort = dateParts[2].slice(-2);
            var hour = String(dateParts[3]).padStart(2, '0');
            var minute = String(dateParts[4]).padStart(2, '0');
            var timestampPrefix = yearShort + month + day + hour + minute;
            
            var baseEmail = email;
            emailNew = "IA_" + timestampPrefix + "_" + baseEmail;
            
            // Check if this email already exists in OpenIDM
            var queryFilter = 'mail eq "' + emailNew + '"';
            var queryParams = {
                "_queryFilter": queryFilter
            };
            var queryResult = openidm.query("managed/alpha_user", queryParams);
            
            if (queryResult.result.length > 0) {
                logger.error("[STATUS-UPDATE] Email conflict: " + emailNew + " already exists in OpenIDM");
                
                eventDetails = {
                    "Error": "Email conflict - IA email already exists",
                    "EmailAttempted": emailNew,
                    "reason": reason,
                    "comment": comment,
                    "IP": input.auditLogger.clientIP,
                    "Browser": input.auditLogger.clientBrowser
                };
                
                eventCode = "ACM002";
                eventName = "Account Termination Failure";
                
                auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, email, "", input.auditLogger.sessionRefIDauditLogger);
                
                return {
                    "responseCode": 2,
                    "transactionId": input.auditLogger.transactionIdauditLogger,
                    "message": {
                        "content": "Unable to terminate account - email conflict detected. Please contact support. REF-011",
                        "code": "2"
                    }
                };
            }
            
            // Update email in KOG first
            var kogEmailResponse = invokeKOGEmailUpdateAPI(payload, emailNew);
            if (!kogEmailResponse || kogEmailResponse.ResponseStatus !== 0) {
                logger.error("[STATUS-UPDATE] KOG Email Update FAILED: " + JSON.stringify(kogEmailResponse));
                
                eventDetails = {
                    "Error": "KOG Email Update API failed",
                    "KOGResponse": kogEmailResponse,
                    "reason": reason,
                    "comment": comment,
                    "IP": input.auditLogger.clientIP,
                    "Browser": input.auditLogger.clientBrowser
                };
                
                eventCode = "ACM002";
                eventName = "Account Termination Failure";
                
                auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, email, "", input.auditLogger.sessionRefIDauditLogger);
                
                return {
                    "responseCode": 2,
                    "transactionId": input.auditLogger.transactionIdauditLogger,
                    "message": {
                        "content": "An unexpected error occurred when updating the user email. Please try again later. REF-010",
                        "code": "2"
                    }
                };
            }
        }
        
        var kogAPIResponse = invokeKOGAPI(payload);
       // var kogAPIResponse = false;   // added to test
        if (!kogAPIResponse || kogAPIResponse.ResponseStatus !== 0) {
            logger.error("[STATUS-UPDATE] KOG Status Update FAILED: " + JSON.stringify(kogAPIResponse));

            eventDetails = {
                "Error": "KOG User Status Update API failed",
                "KOGResponse": kogAPIResponse,
                "reason": reason,
                "comment": comment,
                "IP": input.auditLogger.clientIP,
                "Browser": input.auditLogger.clientBrowser
            };

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
        if(payload.accountRisk){
          jsonArray.push({
                operation: "replace",
                field: "/custom_riskLevel",
                value: payload.accountRisk
          })
        }

        if (status == "Terminated") {
            var terminationDateFull = formatDateEST();
            jsonArray.push({
                operation: "replace",
                field: "/custom_terminationDate",
                value: terminationDateFull
            });
        }
        var isMFAHighRisk = false
        if(status == "active"){
          // var userKOGID = getKOGIDForUser(payload.userAccountId)
          //  isMFAHighRisk = isHighRiskMFAMethodPresent(userKOGID)
        }
        if(isMFAHighRisk ==false){
          const updateAccountResponse = openidm.patch("managed/alpha_user/" + payload.userAccountId, null, jsonArray);
        }else{
          logger.error("High Risk Present")
            return {
                "responseCode": 2,
                "transactionId": input.auditLogger.transactionIdauditLogger,
                "message": {
                    "content": "Unable to Active Due to High Risk .REF-009",
                    "code": "2"
                }
            };
        }
      
        // const updateAccountResponse = openidm.patch("managed/alpha_user/" + payload.userAccountId, null, jsonArray);

        //TFS-216690 Ben Park
        if(action && action.toLowerCase() === "terminate") {
          var accessAPIResponse = removeUserRoles(payload.userAccountId, reason, comment, requesterId);
          if (accessAPIResponse && accessAPIResponse.responseCode !== 0) {
              logger.error("Remove roles failed or returned non-zero response code: " + JSON.stringify(accessAPIResponse))
          }
        }

        //NOW update email to INACTIVE version after notifications are sent
        if (status == "Terminated" && payload.reuseEmail) {
            openidm.patch("managed/alpha_user/" + payload.userAccountId, null, [{
                operation: "replace",
                field: "/mail",
                value: emailNew
            }]);
        }
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

        auditLogger(eventCode, eventName, input.auditLogger.sessionDetailsauditLogger, eventDetails, requesterId, payload.userAccountId, input.auditLogger.transactionIdauditLogger, updateAccountResponse.mail, "KYID Business Support Portal", input.auditLogger.sessionRefIDauditLogger);

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
      "auditLogger":getAuditLoggerContext(),
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

// ============================================================================
// KOG Search + JIT Provisioning Functions
// ============================================================================

/**
 * KOG Search: Ping-first + KOG fallback + JIT provision flow.
 * Called from accountSearch when searchInKOG=true.
 *
 * @param {Object} input - The accountSearch input object
 * @param {Object} queryFilter - Search conditions from frontend
 * @param {Array} returnProperties - Properties to return in results
 * @param {Object} alphaUserType - Current user's profile (for role check)
 * @param {string} filterRole - The helpdesk role name to check against
 */
function kogSearch(input, queryFilter, returnProperties, alphaUserType, filterRole) {
    logger.debug("[KOG-SEARCH] searchInKOG=true — starting Ping-first + KOG search flow");

    // Debug: Print invokedBy context for JIT troubleshooting
    try {
        logger.debug("[KOG-SEARCH] invokedBy (subname) = " + context.oauth2.rawInfo.subname);
        logger.debug("[KOG-SEARCH] client_id = " + context.oauth2.rawInfo.client_id);
        logger.debug("[KOG-SEARCH] logon = " + context.oauth2.rawInfo.logon);
    } catch (e) {
        logger.debug("[KOG-SEARCH] Error reading oauth2 context: " + e);
    }

    var kogSearchResponse = function(data) {
        return {
            "transactionId": input.transactionId,
            "message": { "code": "0", "content": "Success" },
            "payload": { "data": data }
        };
    };

    // Extract email from searchParameters (mandatory when searchInKOG=true)
    var kogEmail = null;
    if (queryFilter.conditions) {
        for (var ci = 0; ci < queryFilter.conditions.length; ci++) {
            if (queryFilter.conditions[ci].name === "mail") {
                kogEmail = queryFilter.conditions[ci].value;
                break;
            }
        }
    }
    if (!kogEmail || kogEmail.trim() === "") {
        logger.error("[KOG-SEARCH] Email is mandatory when searchInKOG=true");
        return kogSearchResponse([]);
    }

    try {
        // STEP 1: Search Ping first (by email + any extra filters from search screen)
        var pingFilter = 'mail eq "' + kogEmail + '"';
        var conditions = queryFilter.conditions || [];
        for (var fi = 0; fi < conditions.length; fi++) {
            var cond = conditions[fi];
            if (cond.name === "mail") continue; // already in filter
            if (!cond.value || cond.value.trim() === "") continue; // empty value, skip
            // Map to Ping field name (most are the same, but use co for starts-with where appropriate)
            pingFilter += ' and ' + cond.name + ' eq "' + cond.value + '"';
        }
        logger.debug("[KOG-SEARCH] STEP 1: Searching Ping with filter: " + pingFilter);
        var pingResult = openidm.query("managed/alpha_user", {
            "_queryFilter": pingFilter,
            "_pageSize": 10
        }, returnProperties);

        if (pingResult && pingResult.resultCount > 0) {
            logger.debug("[KOG-SEARCH] STEP 1: User found in Ping — returning Ping data (count=" + pingResult.resultCount + ")");
            return kogSearchResponse(pingResult.result);
        }

        // STEP 2: Not found in Ping — search KOG
        logger.debug("[KOG-SEARCH] STEP 2: Not found in Ping, searching KOG");
        var kogResult = searchUserInKOG(kogEmail);
        if (!kogResult.found) {
            logger.error("[KOG-SEARCH] STEP 2: User not found in KOG" + (kogResult.error ? " — error: " + kogResult.error : ""));
            return kogSearchResponse([]);
        }

        // STEP 3: Secondary validation — exact match against screen filters
        var kogUser = kogResult.kogUser;
        logger.debug("[KOG-SEARCH] STEP 3: KOG user found — KOGID=" + kogUser.KOGID +
            ", Name=" + kogUser.FirstName + " " + kogUser.LastName +
            ", AccountTypeCode=" + kogUser.AccountTypeCode +
            ", UserStatus=" + kogUser.UserStatus);
        var validationResult = validateKOGUserAgainstFilters(kogUser, queryFilter.conditions || []);
        if (!validationResult.valid) {
            logger.error("[KOG-SEARCH] STEP 3: Filter mismatch — " + validationResult.reason);
            return kogSearchResponse([]);
        }

        // STEP 4: Access control — App-Level1-Helpdesk can only import external accounts
        var isAppLevel1Helpdesk = false;
        if (alphaUserType && alphaUserType.effectiveRoles && alphaUserType.effectiveRoles.length > 0) {
            for (var ri = 0; ri < alphaUserType.effectiveRoles.length; ri++) {
                var roleId = alphaUserType.effectiveRoles[ri]._refResourceId;
                var roleName = getRoleName(roleId);
                if (roleName === filterRole) {
                    isAppLevel1Helpdesk = true;
                    break;
                }
            }
        }
        logger.debug("[KOG-SEARCH] STEP 4: Access control check — isAppLevel1Helpdesk=" + isAppLevel1Helpdesk + ", AccountTypeCode=" + kogUser.AccountTypeCode);
        if (isAppLevel1Helpdesk && kogUser.AccountTypeCode !== "EC") {
            logger.error("[KOG-SEARCH] STEP 4: App-Level1-Helpdesk blocked — cannot import non-external account (AccountTypeCode=" + kogUser.AccountTypeCode + ")");
            return kogSearchResponse([]);
        }

        // STEP 5: JIT Provision — create user in PingAIC
        logger.debug("[KOG-SEARCH] STEP 5: JIT provisioning from KOG");
        var jitResult = jitProvisionFromKOG(kogUser, returnProperties);

        if (!jitResult.user) {
            logger.error("[KOG-SEARCH] STEP 5: JIT provision failed — status: " + jitResult.status);
            return kogSearchResponse([]);
        }

        // STEP 6: Return the user on User Search base screen
        logger.debug("[KOG-SEARCH] STEP 6: Returning JIT-provisioned user — status: " + jitResult.status);
        return kogSearchResponse([jitResult.user]);

    } catch (e) {
        logger.error("[KOG-SEARCH] Unexpected error: " + (e.message || e.detail || e) + " | full: " + JSON.stringify(e));
        return kogSearchResponse([]);
    }
}

/**
 * Search KOG for a user by email address via GetUserDetails API.
 * Returns { found: true, kogUser: <UserDetails> } on success,
 *         { found: false } if not found or on error.
 *
 * Ported from AM Journey: KYID.2B1.KOG.GetUserProfileAPI.WithEmailAndUPN.script.js
 * Key differences from AM Journey:
 *   - API call: AM uses httpClient.send() with manual token → here uses openidm.create("endpoint/invokeCertAPI")
 *   - Token mgmt: AM manually gets bearer token via Library.AccessToken → invokeCertAPI handles automatically
 *   - Certificate: AM specifies clientName:"sihcertforapi" → invokeCertAPI handles internally
 *   - Response parsing: AM uses JSON.parse(response.text()) → here apiResponse.response is already parsed
 *   - HTTP status type: AM response.status is number (200) → invokeCertAPI returns string ("200")
 *   - ESV: esv.kyid.kogapi.userprofile (sb3) / esv.kyid.usr.getuserdetails (other envs)
 */
function searchUserInKOG(email) {
    try {
        logger.debug("[KOG-SEARCH] Searching KOG for email: " + email);

        var apiUrl = identityServer.getProperty("esv.kyid.2b.kogapi.userprofile");
        if (!apiUrl) {
            logger.error("[KOG-SEARCH] ESV for KOG userprofile API not configured");
            return { found: false, error: "ESV not configured" };
        }

        var requestBody = {
            "url": apiUrl,
            "scope": "kogkyidapi.getuserdetails",
            "method": "POST",
            "payload": {
                "emailaddress": email
            }
        };

        // Retry logic for transient network failures
        logger.debug("[KOG-SEARCH] Request: url=" + apiUrl + ", email=" + email);
        var retryCount = 0;
        while (retryCount < 3) {
            try {
                logger.debug("[KOG-SEARCH] Attempt " + (retryCount + 1) + " - Calling endpoint/invokeCertAPI");
                var apiResponse = openidm.create("endpoint/invokeCertAPI", null, requestBody);
                logger.debug("[KOG-SEARCH] Raw response status: " + (apiResponse ? apiResponse.status : "null"));

                if (apiResponse && apiResponse.status === "200") {
                    logger.debug("[KOG-SEARCH] ResponseStatus: " + apiResponse.response.ResponseStatus +
                        ", hasUserDetails: " + !!(apiResponse.response.UserDetails));
                    if (apiResponse.response.ResponseStatus === 0 && apiResponse.response.UserDetails) {
                        logger.debug("[KOG-SEARCH] User found in KOG - KOGID: " + apiResponse.response.UserDetails.KOGID);
                        return { found: true, kogUser: apiResponse.response.UserDetails };
                    } else {
                        var msgDetail = apiResponse.response.ResponseMessage || "No details";
                        logger.debug("[KOG-SEARCH] User not found - ResponseStatus: " + apiResponse.response.ResponseStatus + ", msg: " + msgDetail);
                        return { found: false };
                    }
                } else {
                    logger.error("[KOG-SEARCH] Non-200 response: " + (apiResponse ? apiResponse.status : "null") + ", full response: " + JSON.stringify(apiResponse));
                    return { found: false };
                }
            } catch (error) {
                retryCount++;
                logger.error("[KOG-SEARCH] Exception on attempt " + retryCount + ": " + JSON.stringify(error));
                if (retryCount >= 3) {
                    logger.error("[KOG-SEARCH] MAX_RETRY_REACHED after 3 attempts");
                    return { found: false, error: String(error) };
                }
            }
        }
        return { found: false };
    } catch (error) {
        logger.error("[KOG-SEARCH] Outer exception: " + JSON.stringify(error));
        return { found: false, error: String(error) };
    }
}

/**
 * Validate KOG user record against screen search filters using exact match.
 * KOG GetUserDetails only searches by email; other filters (FN, LN, AU Level)
 * must be validated against the returned KOG record.
 *
 * @param {Object} kogUser - The UserDetails object from KOG response
 * @param {Array} searchParameters - Array of {name, value} from screen filters
 * @returns {{ valid: boolean, reason?: string }}
 */
function validateKOGUserAgainstFilters(kogUser, searchParameters) {
    logger.debug("[KOG-VALIDATE] Starting secondary validation — KOG user: " +
        kogUser.FirstName + " " + kogUser.LastName +
        ", filters count: " + searchParameters.length);

    // Map screen field names to KOG UserDetails field names
    var fieldMapping = {
        "givenName": "FirstName",
        "sn": "LastName",
        "custom_approvalUnit1Code": "AULevel1Name",
        "custom_approvalUnit2Code": "AULevel2Name",
        "custom_approvalUnit3Code": "AULevel3Code",
        "custom_approvalUnit4Code": "AULevel4Code",
        "custom_approvalUnit5Code": "AULevel5Code"
    };

    for (var i = 0; i < searchParameters.length; i++) {
        var param = searchParameters[i];
        if (param.name === "mail") continue; // already matched by KOG email search
        if (param.name === "mobileNumber") continue; // not a KOG field

        var kogField = fieldMapping[param.name];
        if (!kogField) continue; // no mapping for this field, skip

        var screenValue = param.value;
        if (!screenValue || screenValue.trim() === "") continue; // empty filter, skip

        var kogValue = kogUser[kogField];

        // Exact match (case-insensitive)
        if (!kogValue || kogValue.toString().toLowerCase() !== screenValue.toString().toLowerCase()) {
            logger.error("[KOG-VALIDATE] Filter mismatch on " + param.name + ": screen='" + screenValue + "' vs KOG." + kogField + "='" + kogValue + "'");
            return {
                valid: false,
                reason: "Mismatch on " + param.name + ": screen='" + screenValue + "' vs KOG='" + kogValue + "'"
            };
        }
        logger.debug("[KOG-VALIDATE] Filter passed: " + param.name + "='" + screenValue + "' matches KOG." + kogField + "='" + kogValue + "'");
    }
    logger.debug("[KOG-VALIDATE] All filters passed");
    return { valid: true };
}

/**
 * Create a user in PingAIC from KOG user profile data (JIT provisioning).
 * Maps KOG fields to PingAIC schema using the same mapping as the login JIT.
 *
 * Ported from AM Journey: KYID.2B1.Journey.JIT.CreateNewUserandMFAinPING.script.js
 * Key differences from AM Journey:
 *   - State access: AM uses nodeState.get("FirstName") → here uses kogUser.FirstName directly
 *   - State write: AM uses nodeState.putShared("key", value) → not needed, uses local variables
 *   - Flow control: AM uses action.goTo("True"/"False") → here uses return/throw
 *   - ESV access: AM uses systemEnv.getProperty() → here uses identityServer.getProperty()
 *   - Audit source: AM uses Library.AuditDetails with nodeState → here uses inline "ACCOUNT_2B_JIT"
 *   - windowsAccountName: AM parses from Logon in GetUserProfileAPI script → here inline (lines below)
 *
 * @param {Object} kogUser - The UserDetails object from KOG response
 * @returns {Object} The newly created alpha_user object
 */
function createUserInPing(kogUser) {
    // Determine user type by comparing Logon domain
    // Original JIT: Logon format is "user@domain.ky.gov"
    //   domain = Logon.split("@")[1]  → "domain.ky.gov"
    //   prefix = domain.split(".")[0] → "domain"
    //   windowsAccName = prefix + "\\" + Logon.split("@")[0]  → "domain\user"
    var logon = (kogUser.Logon || "").toLowerCase();
    var logonParts = logon.split("@");
    var domain = logonParts.length > 1 ? logonParts[1] : "";
    var extDomain = (identityServer.getProperty("esv.kyid.ext.ad.domain") || "").toLowerCase();
    var usrType = (domain === extDomain) ? "External" : "Internal";
    var connectorName = (usrType === "External")
        ? (identityServer.getProperty("esv.kyid.ext.connector") || "").toLowerCase()
        : (identityServer.getProperty("esv.kyid.internal.connector") || "").toLowerCase();

    // Build windowsAccName: "prefix\username" (same as original JIT GetUserProfile)
    var windowsAccName = "";
    if (domain && logonParts.length > 1) {
        var domainPrefix = domain.split(".")[0];
        windowsAccName = domainPrefix + "\\" + logonParts[0];
    }

    // Map AccountTypeCode → kyidAccountType
    var accountTypeCode = kogUser.AccountTypeCode || "";
    var kyidAccountType = "C"; // default
    if (accountTypeCode === "EC") kyidAccountType = "P";
    else if (accountTypeCode === "EBP" || accountTypeCode === "OU") kyidAccountType = "B";

    var userData = {};
    // Core fields
    userData.userName = kogUser.KOGID;
    userData.mail = kogUser.EmailAddress;
    userData.givenName = kogUser.FirstName;
    userData.sn = kogUser.LastName;
    userData.frIndexedString1 = (kogUser.UPN || "").toLowerCase();
    userData.frIndexedString2 = logon;
    userData.frUnindexedString1 = usrType;
    userData.frUnindexedString2 = connectorName;
    userData.accountStatus = "active";
    userData.custom_ADFlag = true;
    userData.custom_userReleaseStatus = "2A";

    // KOG-specific fields
    userData.custom_kogAccountType = accountTypeCode;
    userData.custom_kyidAccountType = kyidAccountType;
    userData.custom_base64KOGId = kogUser.Base64EncodedKOGID;
    if (windowsAccName) userData.custom_windowsAccountName = windowsAccName;
    userData.custom_approvalUnit1Code = kogUser.AULevel1Name;
    userData.custom_approvalUnit2Code = kogUser.AULevel2Name;
    userData.custom_approvalUnit3Code = kogUser.AULevel3Code;
    userData.custom_approvalUnit4Code = kogUser.AULevel4Code;
    userData.custom_approvalUnit5Code = kogUser.AULevel5Code;

    // Address & personal
    if (kogUser.Address1) userData.postalAddress = kogUser.Address1;
    if (kogUser.Address2) userData.custom_postalAddress2 = kogUser.Address2;
    if (kogUser.ZipCode) userData.postalCode = kogUser.ZipCode;
    if (kogUser.City) userData.city = kogUser.City;
    if (kogUser.State) userData.stateProvince = kogUser.State;
    if (kogUser.CountyName) userData.custom_county = kogUser.CountyName;
    if (kogUser.MiddleName) userData.custom_middleName = kogUser.MiddleName;
    if (kogUser.OrganDonorStatus) userData.custom_organdonor = kogUser.OrganDonorStatus;
    if (kogUser.CountryCode) userData.country = kogUser.CountryCode;

    // Language: KOG code 2 → "2" (Spanish), else → "1" (English)
    userData.frUnindexedString3 = (kogUser.LanguagePreference == 2) ? "2" : "1";

    // MFA-related
    if (kogUser.PhoneNumbers) {
        userData.frUnindexedMultivalued1 = kogUser.PhoneNumbers;
    }
    if (kogUser.SymantecVIPCredentialID) {
        userData.frIndexedString4 = kogUser.SymantecVIPCredentialID.toLowerCase();
    }
    if (kogUser.MIMSAMAccountName) {
        userData.frIndexedString3 = kogUser.MIMSAMAccountName.toLowerCase();
    }

    // Audit fields (matching original JIT: auditDetails.getAuditDetails("CREATE", nodeState))
    var now = new Date();
    userData.custom_createDate = now.toISOString();
    userData.custom_createDateEpoch = now.getTime();
    userData.custom_updatedDateISO = now.toISOString();
    userData.custom_updatedDateEpoch = now.getTime();
    userData.custom_createdBy = "ACCOUNT_2B_JIT";
    userData.custom_createdByID = "ACCOUNT_2B_JIT";
    userData.custom_updatedBy = "ACCOUNT_2B_JIT";
    userData.custom_updatedByID = "ACCOUNT_2B_JIT";
    userData.custom_lastLogonDate = now.toISOString();

    logger.debug("[KOG-JIT] Creating user in PingAIC - KOGID: " + kogUser.KOGID + ", email: " + kogUser.EmailAddress + ", type: " + usrType + ", kyidAccountType: " + kyidAccountType);
    var newUser = openidm.create("managed/alpha_user", null, userData);
    logger.debug("[KOG-JIT] User created successfully - _id: " + newUser._id);
    return newUser;
}

/**
 * Create MFA method records for a JIT-provisioned user.
 *
 * Ported from AM Journey: KYID.2B1.Journey.JIT.CreateNewUserandMFAinPING.script.js (MFA section)
 * Key differences from AM Journey:
 *   - AM creates MFA without dedup check → here uses getExistingMFAValues() to prevent duplicates
 *   - AM stores audit via Library.AuditDetails → here uses inline audit fields (8 fields per record)
 *   - AM MFA status from nodeState → here hardcoded "ACTIVE" (same default)
 *
 * @param {string} kogId - The KOGID (used as KOGId in MFA records)
 * @param {string} email - User's email address
 * @param {Array} phoneNumbers - Array of phone numbers (may be null)
 * @param {string} symantecId - Symantec VIP credential ID (may be null)
 */
function createMFAMethodsForJIT(kogId, email, phoneNumbers, symantecId) {
    logger.debug("[KOG-JIT-MFA] Creating MFA methods for KOGID: " + kogId);

    var existingMFAValues = getExistingMFAValues(kogId);

    var now = new Date();
    var mfaAudit = {
        createDate: now.toISOString(),
        createDateEpoch: now.getTime(),
        createdBy: "ACCOUNT_2B_JIT",
        createdByID: "ACCOUNT_2B_JIT",
        updateDate: now.toISOString(),
        updateDateEpoch: now.getTime(),
        updatedBy: "ACCOUNT_2B_JIT",
        updatedByID: "ACCOUNT_2B_JIT"
    };

    // EMAIL
    if (email) {
        if (!existingMFAValues[email]) {
            try {
                openidm.create("managed/alpha_kyid_mfa_methods", null, {
                    KOGId: kogId,
                    MFAMethod: "EMAIL",
                    MFAValue: email,
                    MFAStatus: "ACTIVE",
                    isRecoveryOnly: false,
                    createDate: mfaAudit.createDate,
                    createDateEpoch: mfaAudit.createDateEpoch,
                    createdBy: mfaAudit.createdBy,
                    createdByID: mfaAudit.createdByID,
                    updateDate: mfaAudit.updateDate,
                    updateDateEpoch: mfaAudit.updateDateEpoch,
                    updatedBy: mfaAudit.updatedBy,
                    updatedByID: mfaAudit.updatedByID
                });
                logger.debug("[KOG-JIT-MFA] EMAIL method created");
            } catch (e) {
                logger.error("[KOG-JIT-MFA] Failed to create EMAIL method: " + e);
            }
        } else {
            logger.debug("[KOG-JIT-MFA] EMAIL method already exists, skipping");
        }
    }

    // SMSVOICE — one per phone number
    if (phoneNumbers && phoneNumbers.length > 0) {
        for (var i = 0; i < phoneNumbers.length; i++) {
            if (!existingMFAValues[phoneNumbers[i]]) {
                try {
                    openidm.create("managed/alpha_kyid_mfa_methods", null, {
                        KOGId: kogId,
                        MFAMethod: "SMSVOICE",
                        MFAValue: phoneNumbers[i],
                        MFAStatus: "ACTIVE",
                        isRecoveryOnly: true,
                        createDate: mfaAudit.createDate,
                        createDateEpoch: mfaAudit.createDateEpoch,
                        createdBy: mfaAudit.createdBy,
                        createdByID: mfaAudit.createdByID,
                        updateDate: mfaAudit.updateDate,
                        updateDateEpoch: mfaAudit.updateDateEpoch,
                        updatedBy: mfaAudit.updatedBy,
                        updatedByID: mfaAudit.updatedByID
                    });
                    logger.debug("[KOG-JIT-MFA] SMSVOICE method created for: " + phoneNumbers[i]);
                } catch (e) {
                    logger.error("[KOG-JIT-MFA] Failed to create SMSVOICE method: " + e);
                }
            } else {
                logger.debug("[KOG-JIT-MFA] SMSVOICE method already exists for: " + phoneNumbers[i] + ", skipping");
            }
        }
    }

    // SYMANTEC VIP
    if (symantecId && typeof symantecId === "string" && symantecId.trim() !== "") {
        if (!existingMFAValues[symantecId]) {
            try {
                openidm.create("managed/alpha_kyid_mfa_methods", null, {
                    KOGId: kogId,
                    MFAMethod: "SYMANTEC",
                    MFAValue: symantecId,
                    MFAStatus: "ACTIVE",
                    isRecoveryOnly: true,
                    createDate: mfaAudit.createDate,
                    createDateEpoch: mfaAudit.createDateEpoch,
                    createdBy: mfaAudit.createdBy,
                    createdByID: mfaAudit.createdByID,
                    updateDate: mfaAudit.updateDate,
                    updateDateEpoch: mfaAudit.updateDateEpoch,
                    updatedBy: mfaAudit.updatedBy,
                    updatedByID: mfaAudit.updatedByID
                });
                logger.debug("[KOG-JIT-MFA] SYMANTEC method created");
            } catch (e) {
                logger.error("[KOG-JIT-MFA] Failed to create SYMANTEC method: " + e);
            }
        } else {
            logger.debug("[KOG-JIT-MFA] SYMANTEC method already exists, skipping");
        }
    }
}

/**
 * Query all ACTIVE MFA records for a KOGID and return a lookup map of existing values.
 * Ported from AM Journey: same lookup exists in JIT.CreateNewUserandMFAinPING
 * Key difference: AM uses httpClient to query → here uses openidm.query() directly
 *
 * @param {string} kogId - The KOG ID to look up
 * @returns {Object} map of MFAValue → true for all ACTIVE records
 */
function getExistingMFAValues(kogId) {
    var valueMap = {};
    try {
        var mfaResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": '/KOGId eq "' + kogId + '"'
        });
        if (mfaResponses && mfaResponses.result) {
            for (var i = 0; i < mfaResponses.result.length; i++) {
                var rec = mfaResponses.result[i];
                if (rec.MFAStatus === "ACTIVE") {
                    valueMap[rec.MFAValue] = true;
                }
            }
        }
    } catch (e) {
        logger.error("[KOG-JIT-MFA] getExistingMFAValues error: " + e);
    }
    return valueMap;
}

function isHighRiskMFAMethodPresent(kogId) {
    try {
        var mfaResponses = openidm.query("managed/alpha_kyid_mfa_methods", {
            "_queryFilter": '/KOGId eq "' + kogId + '" AND risk eq "HIGH" AND MFAStatus eq "ACTIVE"'
        });
        if (mfaResponses && mfaResponses.resultCount > 0) {
            return true;
        }
        else{
            return false
        }
    } catch (e) {
        logger.error("[Check MFA HIGH RISK] isHighRiskMFAMethodPresent error: " + e);
    }

}

/**
 * JIT provision orchestrator: check existing → create user → create MFA → sync roles.
 * Ported from AM Journey: combines 3 AM scripts into one function:
 *   1. KYID.2B1.KOG.GetUserProfileAPI (user lookup) — already done by searchUserInKOG()
 *   2. KYID.2B1.Journey.JIT.CreateNewUserandMFAinPING (create user + MFA) → createUserInPing() + createMFAMethodsForJIT()
 *   3. KYID.2B1.Journey.JITforUserAuthorization (role sync) → syncKOGAuthorizations()
 * Key difference: AM runs these as sequential Journey nodes with nodeState passing data between them
 *   → here runs as sequential function calls within a single endpoint invocation
 *
 * @param {Object} kogUser - The UserDetails object from KOG response
 * @param {Array} returnProperties - Properties to return in the result
 * @returns {Object} { status: "exists"|"created"|"invalid_status", user: <alpha_user object> }
 */
function jitProvisionFromKOG(kogUser, returnProperties) {
    var kogId = kogUser.KOGID;
    logger.debug("[KOG-JIT] Starting JIT provision for KOGID: " + kogId);

    // Step 1: Check if user already exists in PingAIC (by KOGID stored as userName)
    var existingUser = openidm.query("managed/alpha_user", {
        "_queryFilter": 'userName eq "' + kogId + '"',
        "_pageSize": 1
    }, returnProperties || ["*"]);

    if (existingUser && existingUser.resultCount > 0) {
        logger.debug("[KOG-JIT] User already exists in PingAIC - _id: " + existingUser.result[0]._id);
        return { status: "exists", user: existingUser.result[0] };
    }

    // Step 2: Check UserStatus — only provision Active users
    var userStatus = kogUser.UserStatus;
    if (userStatus !== 1 && userStatus !== "1") {
        logger.error("[KOG-JIT] Cannot provision user with UserStatus=" + userStatus + " (only Active=1 allowed)");
        return { status: "invalid_status", user: null };
    }

    // Step 3: Create user in PingAIC
    // NOTE: postCreate lifecycle (BirthRoleProvisioning) patches kyidPortal role for External users,
    // which triggers alpha_role onUpdate → updateAuditFields + updateTags → platform
    // updateRelationshipFields(/tags) throws InternalServerErrorException.
    // The user IS committed to DB before postCreate runs, so we always re-query to confirm.
    var createError = null;
    try {
        createUserInPing(kogUser);
    } catch (e) {
        createError = e.message || e.detail || String(e);
        logger.warn("[KOG-JIT] createUserInPing threw: " + createError + " — will re-query to check if user was committed");
    }

    // Always re-query by KOGID to get the user, regardless of whether create threw
    var newUser = null;
    try {
        var confirmQuery = openidm.query("managed/alpha_user", {
            "_queryFilter": 'userName eq "' + kogId + '"',
            "_pageSize": 1
        }, ["*"]);
        if (confirmQuery && confirmQuery.resultCount > 0) {
            newUser = confirmQuery.result[0];
            if (createError) {
                logger.warn("[KOG-JIT] User confirmed in DB despite create error — _id: " + newUser._id);
            } else {
                logger.debug("[KOG-JIT] User confirmed in DB — _id: " + newUser._id);
            }
        }
    } catch (queryErr) {
        logger.error("[KOG-JIT] Confirm query failed: " + (queryErr.message || queryErr));
    }

    if (!newUser) {
        logger.error("[KOG-JIT] User not found in DB after create — truly failed");
        return { status: "create_failed", user: null };
    }

    // Step 4: Create MFA methods
    try {
        createMFAMethodsForJIT(
            kogId,
            kogUser.EmailAddress,
            kogUser.PhoneNumbers || null,
            kogUser.SymantecVIPCredentialID || null
        );
        logger.debug("[KOG-JIT] MFA creation complete");
    } catch (e) {
        logger.warn("[KOG-JIT] MFA creation failed (non-fatal): " + (e.message || e.detail || e));
    }

    // Step 5: Sync KOG authorizations (roles + access records)
    try {
        syncKOGAuthorizations(newUser._id, kogId);
        logger.debug("[KOG-JIT] Role sync complete");
    } catch (e) {
        logger.warn("[KOG-JIT] Role sync failed (non-fatal): " + (e.message || e.detail || e));
    }

    // Step 6: Re-read the user with the requested return properties
    var createdUser;
    try {
        createdUser = openidm.read("managed/alpha_user/" + newUser._id, null, returnProperties || ["*"]);
        logger.debug("[KOG-JIT] Re-read successful for _id: " + newUser._id);
    } catch (e) {
        logger.warn("[KOG-JIT] Step 6 re-read failed: " + (e.message || e.detail || e) + " — falling back to query result");
        createdUser = newUser;
    }

    logger.debug("[KOG-JIT] JIT provision complete for KOGID: " + kogId + " — _id: " + (createdUser ? createdUser._id : "null"));
    return { status: "created", user: createdUser };
}

/**
 * Sync KOG user authorizations (roles + access records) into PingAIC.
 * Ported from AM Journey: KYID.2B1.Journey.JITforUserAuthorization.script.js
 * Key differences from AM Journey:
 *   - API call: AM uses httpClient.send() → here uses openidm.create("endpoint/invokeCertAPI")
 *   - Cache strategy: same 5-layer cache (app→role→access→org→delegator), implemented with local objects
 *   - Role assignment: AM uses nodeState to batch roles → here uses openidm.patch() directly
 *   - EDRS skip: same logic — skip applications starting with "EDRS"
 *   - HTTP status type: AM response.status is number → invokeCertAPI returns string
 *
 * @param {string} userId - PingAIC alpha_user _id
 * @param {string} kogId - The user's KOGID (also stored as userName)
 */
function syncKOGAuthorizations(userId, kogId) {
    logger.debug("[KOG-JIT-ROLES] Starting role sync for userId: " + userId + ", KOGID: " + kogId);

    // ===== Step 1: Call KOG GetUserAuthorizations API =====
    var apiUrl = identityServer.getProperty("esv.kyid.usr.authorization");
    if (!apiUrl) {
        logger.error("[KOG-JIT-ROLES] ESV 'esv.kyid.usr.authorization' not configured, skipping role sync");
        return;
    }

    var requestBody = {
        "url": apiUrl,
        "scope": "kogkyidapi.getuserauthorizations",
        "method": "POST",
        "payload": {
            "KOGID": kogId
        }
    };

    var kogResponse = null;
    var retryCount = 0;
    while (retryCount < 3) {
        try {
            logger.debug("[KOG-JIT-ROLES] Attempt " + (retryCount + 1) + " - Calling KOG UserAuthorizations API for KOGID: " + kogId);
            var apiResponse = openidm.create("endpoint/invokeCertAPI", null, requestBody);
            if (apiResponse && apiResponse.status === "200") {
                logger.debug("[KOG-JIT-ROLES] API call succeeded, ResponseStatus: " + apiResponse.response.ResponseStatus);
                kogResponse = apiResponse.response;
                break;
            } else {
                logger.error("[KOG-JIT-ROLES] Non-200 response: " + (apiResponse ? apiResponse.status : "null") + ", full response: " + JSON.stringify(apiResponse));
                return;
            }
        } catch (error) {
            retryCount++;
            logger.error("[KOG-JIT-ROLES] Exception on attempt " + retryCount + ": " + JSON.stringify(error));
            if (retryCount >= 3) {
                logger.error("[KOG-JIT-ROLES] MAX_RETRY_REACHED after 3 attempts - skipping role sync");
                return;
            }
        }
    }

    if (!kogResponse || kogResponse.ResponseStatus !== 0 || !kogResponse.UserAuthorizations) {
        logger.debug("[KOG-JIT-ROLES] No authorizations found for KOGID: " + kogId +
            " (ResponseStatus=" + (kogResponse ? kogResponse.ResponseStatus : "null") + ")");
        return;
    }

    var userAuths = kogResponse.UserAuthorizations;
    logger.debug("[KOG-JIT-ROLES] Found " + userAuths.length + " authorizations to process");

    // ===== Step 2: Collect unique identifiers from authorizations =====
    var appNames = [];
    var delegatorKOGIDs = [];

    for (var i = 0; i < userAuths.length; i++) {
        var auth = userAuths[i];
        if (!auth.ApplicationName || !auth.RoleName || auth.ApplicationName === "EDRS") {
            continue;
        }
        if (appNames.indexOf(auth.ApplicationName) === -1) {
            appNames.push(auth.ApplicationName);
        }
        if (auth.CurrentDelegatorKOGID && delegatorKOGIDs.indexOf(auth.CurrentDelegatorKOGID) === -1) {
            delegatorKOGIDs.push(auth.CurrentDelegatorKOGID);
        }
        if (auth.OriginalDelegatorKOGID && delegatorKOGIDs.indexOf(auth.OriginalDelegatorKOGID) === -1) {
            delegatorKOGIDs.push(auth.OriginalDelegatorKOGID);
        }
    }

    if (appNames.length === 0) {
        logger.debug("[KOG-JIT-ROLES] No valid (non-EDRS) authorizations to process, skipping");
        return;
    }
    logger.debug("[KOG-JIT-ROLES] Unique apps: " + appNames.length + " (" + appNames.join(", ") + "), delegators: " + delegatorKOGIDs.length);

    // ===== Step 3: Batch queries — load ALL data upfront =====

    // 3a. Batch query: All applications by name
    var appNameFilter = appNames.map(function(n) { return 'name eq "' + n + '"'; }).join(" or ");
    var appCache = {};
    if (appNameFilter) {
        var appResult = openidm.query("managed/alpha_kyid_businessapplication", {
            "_queryFilter": appNameFilter
        });
        if (appResult && appResult.result) {
            for (var ai = 0; ai < appResult.result.length; ai++) {
                appCache[appResult.result[ai].name] = appResult.result[ai]._id;
            }
        }
    }
    logger.debug("[KOG-JIT-ROLES] Cache loaded — apps: " + Object.keys(appCache).length);

    // 3b. Batch query: All roles for these apps
    var appIds = [];
    for (var appName in appCache) {
        appIds.push(appCache[appName]);
    }
    var roleCache = {};
    if (appIds.length > 0) {
        var roleFilter = appIds.map(function(id) {
            return 'businessAppId/_refResourceId eq "' + id + '"';
        }).join(" or ");
        var roleResult = openidm.query("managed/alpha_role", {
            "_queryFilter": roleFilter
        });
        if (roleResult && roleResult.result) {
            for (var ri = 0; ri < roleResult.result.length; ri++) {
                var role = roleResult.result[ri];
                var key = role.businessAppId._refResourceId + "::" + role.name;
                roleCache[key] = role._id;
            }
        }
    }
    logger.debug("[KOG-JIT-ROLES] Cache loaded — roles: " + Object.keys(roleCache).length);

    // 3c. Batch query: All delegators by KOGID
    var delegatorCache = {};
    if (delegatorKOGIDs.length > 0) {
        var kogFilter = delegatorKOGIDs.map(function(id) { return 'userName eq "' + id + '"'; }).join(" or ");
        var delegatorResult = openidm.query("managed/alpha_user", {
            "_queryFilter": kogFilter
        });
        if (delegatorResult && delegatorResult.result) {
            for (var di = 0; di < delegatorResult.result.length; di++) {
                delegatorCache[delegatorResult.result[di].userName] = delegatorResult.result[di]._id;
            }
        }
    }
    logger.debug("[KOG-JIT-ROLES] Cache loaded — delegators: " + Object.keys(delegatorCache).length);

    // 3d. Existing user roles
    var userObj = openidm.read("managed/alpha_user/" + userId, null, ["effectiveRoles"]);
    var userRoleIdMap = {};
    if (userObj && userObj.effectiveRoles) {
        for (var ei = 0; ei < userObj.effectiveRoles.length; ei++) {
            userRoleIdMap[userObj.effectiveRoles[ei]._refResourceId] = true;
        }
    }
    logger.debug("[KOG-JIT-ROLES] Cache loaded — existing user roles: " + Object.keys(userRoleIdMap).length);

    // 3e. Existing access records for this user
    var accessMap = {};
    var accessResult = openidm.query("managed/alpha_kyid_access", {
        "_queryFilter": 'userIdentifier eq "' + userId + '" and (recordState eq "0" or recordState eq "ACTIVE")'
    });
    if (accessResult && accessResult.result) {
        for (var xi = 0; xi < accessResult.result.length; xi++) {
            var acc = accessResult.result[xi];
            var accKey = acc.appIdentifier + "::" + acc.roleIdentifier + "::" +
                (acc.orgId || "") + "::" + (acc.businessKeyName || "");
            accessMap[accKey] = acc;
        }
    }
    logger.debug("[KOG-JIT-ROLES] Cache loaded — existing access records: " + Object.keys(accessMap).length);

    // ===== Step 4: Process authorizations =====
    var rolesToAdd = [];
    var accessToCreate = [];
    var skippedCount = 0;

    for (var pi = 0; pi < userAuths.length; pi++) {
        var pAuth = userAuths[pi];

        if (!pAuth.ApplicationName || !pAuth.RoleName || pAuth.ApplicationName === "EDRS") {
            continue;
        }

        var pAppId = appCache[pAuth.ApplicationName];
        if (!pAppId) {
            logger.debug("[KOG-JIT-ROLES] Skipping auth: app '" + pAuth.ApplicationName + "' not found in PingAIC");
            skippedCount++;
            continue;
        }

        var pRoleKey = pAppId + "::" + pAuth.RoleName;
        var pRoleId = roleCache[pRoleKey];
        if (!pRoleId) {
            logger.debug("[KOG-JIT-ROLES] Skipping auth: role '" + pAuth.RoleName + "' not found for app '" + pAuth.ApplicationName + "'");
            skippedCount++;
            continue;
        }

        // Check if access record already exists (prevent duplicates)
        var pAccessKey = pAppId + "::" + pRoleId + "::" +
            (pAuth.KOGOrgId ? pAuth.KOGOrgId.toString() : "") + "::" +
            (pAuth.BusinessKeyId || "");

        if (!accessMap[pAccessKey]) {
            accessToCreate.push({
                appId: pAppId,
                roleId: pRoleId,
                auth: pAuth
            });
            // Mark in accessMap to prevent duplicates within same batch
            accessMap[pAccessKey] = true;
        }

        // Collect roles to add (deduplicated)
        if (!userRoleIdMap[pRoleId]) {
            rolesToAdd.push(pRoleId);
            userRoleIdMap[pRoleId] = true;
        }
    }

    logger.debug("[KOG-JIT-ROLES] Processing result — access to create: " + accessToCreate.length +
        ", roles to add: " + rolesToAdd.length + ", skipped: " + skippedCount);

    // ===== Step 5: Bulk create access records =====
    if (accessToCreate.length > 0) {
        var now = new Date().toISOString();
        var nowEpoch = Date.now();
        var createdCount = 0;
        var failedCount = 0;

        for (var ci = 0; ci < accessToCreate.length; ci++) {
            var item = accessToCreate[ci];
            var itemAuth = item.auth;

            var accessData = {
                app: { "_ref": "managed/alpha_kyid_businessapplication/" + item.appId },
                user: { "_ref": "managed/alpha_user/" + userId },
                role: { "_ref": "managed/alpha_role/" + item.roleId },

                isForwardDelegable: false,
                assignmentDate: now,
                assignmentDateEpoch: nowEpoch,
                recordState: "0",
                recordSource: "1",

                createDate: now,
                createDateEpoch: nowEpoch,
                updateDate: now,
                updateDateEpoch: nowEpoch,

                createdBy: "ACCOUNT_2B_JIT",
                updatedBy: "ACCOUNT_2B_JIT",
                createdByID: userId,

                appIdentifier: item.appId,
                roleIdentifier: item.roleId,
                userIdentifier: userId
            };

            // Org attributes
            if (itemAuth.KOGOrgId && itemAuth.KOGOrgId !== 0) {
                accessData.orgId = itemAuth.KOGOrgId.toString();
            }
            if (itemAuth.OrgTypeName) {
                accessData.orgType = itemAuth.OrgTypeName;
            }
            if (itemAuth.OrgName) {
                accessData.OrgName = itemAuth.OrgName;
            }

            // Business key attributes
            if (itemAuth.BusinessKeyTypeName) {
                accessData.businessKeyTypeName = itemAuth.BusinessKeyTypeName;
            }
            if (itemAuth.BusinessKeyId) {
                accessData.businessKeyName = itemAuth.BusinessKeyId;
            }
            if (itemAuth.BusinessKeyValue) {
                accessData.businessKeyValue = itemAuth.BusinessKeyValue;
            }

            // Delegator references
            if (itemAuth.CurrentDelegatorKOGID && delegatorCache[itemAuth.CurrentDelegatorKOGID]) {
                var currDelegId = delegatorCache[itemAuth.CurrentDelegatorKOGID];
                accessData.currentDelegatorIdentifier = currDelegId;
                accessData.currentDelegator = { "_ref": "managed/alpha_user/" + currDelegId };
            }
            if (itemAuth.OriginalDelegatorKOGID && delegatorCache[itemAuth.OriginalDelegatorKOGID]) {
                var origDelegId = delegatorCache[itemAuth.OriginalDelegatorKOGID];
                accessData.originalDelegatorIdentifier = origDelegId;
                accessData.originalDelegator = { "_ref": "managed/alpha_user/" + origDelegId };
            }

            try {
                openidm.create("managed/alpha_kyid_access", null, accessData);
                createdCount++;
            } catch (e) {
                failedCount++;
                logger.error("[KOG-JIT-ROLES] Failed to create access record [" + (ci + 1) + "/" + accessToCreate.length +
                    "] app=" + itemAuth.ApplicationName + ", role=" + itemAuth.RoleName + ": " + e);
            }
        }
        logger.debug("[KOG-JIT-ROLES] Access records — created: " + createdCount + ", failed: " + failedCount);
    }

    // ===== Step 6: Bulk patch user roles =====
    if (rolesToAdd.length > 0) {
        try {
            var patchOps = [];
            for (var rpi = 0; rpi < rolesToAdd.length; rpi++) {
                patchOps.push({
                    operation: "add",
                    field: "/roles/-",
                    value: {
                        "_ref": "managed/alpha_role/" + rolesToAdd[rpi],
                        "_refResourceId": rolesToAdd[rpi],
                        "_refResourceCollection": "managed/alpha_role"
                    }
                });
            }

            // Audit fields
            var updateNow = new Date();
            patchOps.push(
                { operation: "replace", field: "/custom_updatedDateEpoch", value: updateNow.getTime() },
                { operation: "replace", field: "/custom_updatedDateISO", value: updateNow.toISOString() },
                { operation: "replace", field: "/custom_updatedBy", value: "ACCOUNT_2B_JIT" },
                { operation: "replace", field: "/custom_updatedByID", value: userId }
            );

            openidm.patch("managed/alpha_user/" + userId, null, patchOps);
            logger.debug("[KOG-JIT-ROLES] Bulk patched " + rolesToAdd.length + " roles to user");
        } catch (e) {
            logger.error("[KOG-JIT-ROLES] Bulk role patch failed: " + e + ", patchOps count: " + patchOps.length);
        }
    }

    logger.debug("[KOG-JIT-ROLES] Role sync complete for KOGID: " + kogId);
}

// ============================================================================
// End of KOG Search + JIT Provisioning Functions
// ============================================================================

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

        // Retry logic for transient network failures (e.g., Connection reset)
        // TODO: Consider extracting this retry pattern into a shared utility function
        // Reference: Similar pattern exists in access_v2B.js (invokeKOGAPIRoleRemoval, invokeKOGAPIUserAuthorizations)
        let shouldRetryForKOGAPI = true
        let retryCountForKOGAPI = 0

        while (retryCountForKOGAPI < 3) {
            try {
                logger.error("[KOG-STATUS-API] Attempt " + (retryCountForKOGAPI + 1) + " - Calling endpoint/invokeCertAPI for user " + payload.userAccountId)
                const response = openidm.create("endpoint/invokeCertAPI", null, requestBody);

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
                logger.error("[KOG-STATUS-API] EXCEPTION on attempt " + (retryCountForKOGAPI + 1) + ": " + JSON.stringify(error))
                if (error && error.stack) {
                    logger.error("[KOG-STATUS-API] Stack: " + error.stack)
                }
                if (shouldRetryForKOGAPI) {
                    retryCountForKOGAPI++
                    logger.error("[KOG-STATUS-API] Retry count: " + retryCountForKOGAPI)
                    if (retryCountForKOGAPI == 3) {
                        logger.error("[KOG-STATUS-API] MAX_RETRY_REACHED - Operation failed after 3 attempts for user " + payload.userAccountId)
                        throw JSON.stringify(error)
                    }
                } else {
                    throw JSON.stringify(error)
                }
            }
        }
    } catch (error) {
        logger.error("[KOG-STATUS-API] EXCEPTION: " + JSON.stringify(error))
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
            return response.response
        } else {
            return null
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
        var alphaUser = openidm.read("managed/alpha_user/" + queryFilter.userAccountId, null, ["*","custom_userIdentity/lastVerificationDate","custom_userIdentity/verificationAttemptHelpdesk"]);
        var isRetryLimitReached = false
        if (alphaUser && alphaUser != null) {
            logger.error("kyid account endpoint getViewAccountInformation alphaUser: " + alphaUser);
            if(alphaUser && alphaUser.custom_userIdentity){
              var verificationAttemptHelpdesk = alphaUser.custom_userIdentity.verificationAttemptHelpdesk || "0"
              var lastVerificationDate = alphaUser.custom_userIdentity.lastVerificationDate || null
              isRetryLimitReached = isRidpRetryLimitReached(verificationAttemptHelpdesk,lastVerificationDate)
            }
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
                        "accountDates": accountDates,
                        "ridpretryLimitReached": isRetryLimitReached
                        
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


// function getViewUserPersonalInformation(queryFilter) {
//     try {
//         //var alphaUser = openidm.read("managed/alpha_user/" + queryFilter.userAccountId, null, ["*"]);
//         logger.error("kyid account endpoint getViewUserPersonalInformation - START - queryFilter: " + JSON.stringify(queryFilter));
//         logger.error("kyid account endpoint getViewUserPersonalInformation - userAccountId: " + queryFilter.userAccountId);

//         var userIdentityResponse = openidm.query("managed/alpha_kyid_user_identity", {
//             "_queryFilter": '/account/_refResourceId eq "' + queryFilter.userAccountId + '"'
//         }, ["*"]);
//         logger.error("kyid account endpoint getViewUserPersonalInformation userIdentityResponse: " + JSON.stringify(userIdentityResponse));
//         logger.error("kyid account endpoint getViewUserPersonalInformation resultCount: " + userIdentityResponse.resultCount);

//         //logger.error("kyid account endpoint getViewUserPersonalInformation userIdentityResponse: " + userIdentityResponse);

//         var userIdentity = userIdentityResponse.result[0];

//         if (userIdentity && userIdentity != null) {
            
//             //dharjani: TFS208614 - Placing language preference code within defensive null check
//             var langPref = "English";
//             if (userIdentity.languagePreference && userIdentity.languagePreference == "1") {
//                 langPref = "English";
//             } else if (userIdentity.languagePreference == "2") {
//                 langPref = "Spanish";
//             }

//             var gender = "";
//             if (userIdentity.gender != null) {
//                 if (userIdentity.gender === "M" || userIdentity.gender === "Male") {
//                     gender = "Male";
//                 } else if (userIdentity.gender === "F" || userIdentity.gender === "Female") {
//                     gender = "Female";
//                 } else if (userIdentity.gender === "O") {
//                     gender = "Other";
//                 }
//             }

//             var basicInformation = [{
//                 "label": {
//                     "es": "es_GivenName",
//                     "en": "GivenName"
//                 },
//                 "value": userIdentity.givenName ? userIdentity.givenName : "",
//                 "correctedValue": userIdentity.corrected_givenName ? userIdentity.corrected_givenName : "",
//                 "verificationStatus": userIdentity.status_givenName ? userIdentity.status_givenName : "",
//             },
//             {
//                 "label": {
//                     "es": "es_Middlename",
//                     "en": "Middlename"
//                 },
//                 "value": userIdentity.middleName ? userIdentity.middleName : ""
//             },
//             {
//                 "label": {
//                     "es": "es_LastName",
//                     "en": "LastName"
//                 },
//                 "value": userIdentity.sn ? userIdentity.sn : ""
//             },
//             {
//                 "label": {
//                     "es": "es_Suffix",
//                     "en": "Suffix"
//                 },
//                 "value": userIdentity.suffix ? userIdentity.suffix : ""
//             },
//             {
//                 "label": {
//                     "es": "es_Gender",
//                     "en": "Gender"
//                 },
//                 "value": gender
//             },
//             {
//                 "label": {
//                     "es": "es_DateOfBirth",
//                     "en": "DateOfBirth"
//                 },
//                 "value": userIdentity.dob ? userIdentity.dob : ""
//             },
//             {
//                 "label": {
//                     "es": "es_LanguagePreference",
//                     "en": "LanguagePreference"
//                 },
//                 "value": langPref
//             }
//             ];

//             var homeAddress = [{
//                 "label": {
//                     "es": "es_Address1",
//                     "en": "Address1"
//                 },
//                 "value": userIdentity.addressLine1 ? userIdentity.addressLine1 : ""
//             },
//             {
//                 "label": {
//                     "es": "es_Address2",
//                     "en": "Address2"
//                 },
//                 "value": userIdentity.addressLine2 ? userIdentity.addressLine2 : ""
//             },
//             {
//                 "label": {
//                     "es": "es_City",
//                     "en": "City"
//                 },
//                 "value": userIdentity.city ? userIdentity.city : ""
//             },
//             {
//                 "label": {
//                     "es": "es_State",
//                     "en": "State"
//                 },
//                 "value": userIdentity.stateCode ? userIdentity.stateCode : ""
//             },
//             {
//                 "label": {
//                     "es": "es_Zipcode",
//                     "en": "Zipcode"
//                 },
//                 "value": userIdentity.zip ? userIdentity.zip : ""
//             },
//             //fix for the ticket 202718 to add country code and adjust the order
//             {
//                 "label": {
//                     "es": "es_County",
//                     "en": "County"
//                 },
//                 "value": userIdentity.countyCode ? userIdentity.countyCode : ""
//             },
//             {
//                 "label": {
//                     "es": "es_Country",
//                     "en": "Country"
//                 },
//                 "value": userIdentity.countryCode ? userIdentity.countryCode : ""
//             }
//             ]

//             //fix for ticket 202718, verification status is missing, order is not correct
            
//             var verificationMethod = "";
//             var verificationStatus = "Not Verified"
//             if(userIdentity.verificationStatus && userIdentity.verificationStatus.toLowerCase() === "verified"){ // This is added for new RIDP Implementation
//               verificationStatus = "Verified"
//             }
//             else if(userIdentity.verificationStatus && userIdentity.verificationStatus.toLowerCase() === "partiallyverified"){
//               verificationStatus = "Partially Verified"
//             }
//             else if(userIdentity.verificationStatus && userIdentity.verificationStatus.toLowerCase() === "fullyverified"){
//               verificationStatus = "Fully Verified"
//             }
//             else if(userIdentity.verificationStatus && userIdentity.verificationStatus.toLowerCase() === "notverified"){
//               verificationStatus = "Not Verified"
//             }
            
//           else{
//             verificationStatus = "Not Verified"
//           }
//             switch (userIdentity.proofingMethod) {
//                 case "-1":
//                     verificationStatus = "Not Verified";
//                     break;
//                 case "0":
//                     // verificationStatus = "Verified"
//                     verificationMethod = "Risk based";
//                     break;
//                 case "1":
//                     // verificationStatus = "Verified"
//                     verificationMethod = "Lexis Nexis Verification";
//                     break;
//                 case "4":
//                     // verificationStatus = "Verified"
//                     verificationMethod = "Lexis Nexis KBA";
//                     break;
//                 case "2":
//                     // verificationStatus = "Verified"
//                     verificationMethod = "CMS KBA";
//                     break;
//                 case "3":
//                     // verificationStatus = "Verified"
//                     verificationMethod = "In-Person";
//             }


//             var identityVerification = [
//                 {
//                     "label": {
//                         "es": "es_Verification Status",
//                         "en": "Verification Status"
//                     },
//                     "value": verificationStatus
//                 },
//                 {
//                     "label": {
//                         "es": "es_Verification Method",
//                         "en": "Verification Method"
//                     },
//                     "value": verificationMethod
//                 },
//                 {
//                     "label": {
//                         "es": "es_Lastsuccessfulverification",
//                         "en": "Lastsuccessfulverification"
//                     },
//                     "value": userIdentity.lastVerificationDate ? userIdentity.lastVerificationDate : ""
//                 }
//             ]

//             var organDonar = "No";
//             logger.error("Organ Donor Status for user " + userIdentity._id + ": " + userIdentity.organDonorRegistrationStatus);
//             logger.error("Type of organDonorRegistrationStatus: " + typeof userIdentity.organDonorRegistrationStatus);
//             if ((typeof userIdentity.organDonorRegistrationStatus === "boolean" && userIdentity.organDonorRegistrationStatus === true) ||
//                 (typeof userIdentity.organDonorRegistrationStatus === "string" && (userIdentity.organDonorRegistrationStatus.toLowerCase() === "yes" || userIdentity.organDonorRegistrationStatus.toLowerCase() === "true")))
//             {
//                 organDonar = "Yes";
//             }

//             var organDonor = [{
//                 "label": {
//                     "es": "es_RegisteredASADonor",
//                     "en": "RegisteredASADonor"
//                 },
//                 "value": organDonar
//             }]

//             let returnPayload = {
//                 "responseCode": 0,
//                 "transactionId": request.content.transactionId,
//                 "message": {
//                     "content": "Success",
//                     "code": "0"
//                 },
//                 "payload": {
//                     "data": {
//                         "_Id": userIdentity._id,
//                         "Basic Information": basicInformation,
//                         "Home Address": homeAddress,
//                         "Identity Verification": identityVerification,
//                         "Organ Donor": organDonor
//                     }
//                 }
//             }

//             return returnPayload;
//         } else {
//             let returnPayload = {
//                 "responseCode": 0,
//                 "transactionId": request.content.transactionId,
//                 "message": {
//                     "content": "Success",
//                     "code": "0"
//                 },
//                 "payload": {
//                     "data": {
//                     }
//                 }
//             }
//             return returnPayload;
//         }

//     } catch (error) {
//         let returnPayload = {
//             "responseCode": 2,
//             "transactionId": request.content.transactionId,
//             "message": {
//                 "content": error,
//                 "code": "2"
//             }
//         }
//         return returnPayload;
//     }
// }


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
                "value": userIdentity.givenName ? userIdentity.givenName : "",
                "correctedValue": userIdentity.corrected_givenName ? userIdentity.corrected_givenName : "",
                "verificationStatus": userIdentity.status_givenName ? userIdentity.status_givenName : ""
            },
            {
                "label": {
                    "es": "es_Middlename",
                    "en": "Middlename"
                },
                "value": userIdentity.middleName ? userIdentity.middleName : "",
                "correctedValue": userIdentity.corrected_middleName ? userIdentity.corrected_middleName : "",
                "verificationStatus": userIdentity.status_middleName ? userIdentity.status_middleName : ""
            
            },
            {
                "label": {
                    "es": "es_LastName",
                    "en": "LastName"
                },
                "value": userIdentity.sn ? userIdentity.sn : "",
                "correctedValue": userIdentity.corrected_sn ? userIdentity.corrected_sn : "",
                "verificationStatus": userIdentity.status_sn ? userIdentity.status_sn : ""
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
                "value": userIdentity.dob ? userIdentity.dob : "",
                "correctedValue": userIdentity.corrected_dob ? userIdentity.corrected_dob : "",
                "verificationStatus": userIdentity.status_dob ? userIdentity.status_dob : ""
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
                "value": userIdentity.addressLine1 ? userIdentity.addressLine1 : "",
                "correctedValue": userIdentity.corrected_addressLine1 ? userIdentity.corrected_addressLine1 : "",
                "verificationStatus": userIdentity.status_addressLine1 ? userIdentity.status_addressLine1 : ""
        
            },
            {
                "label": {
                    "es": "es_Address2",
                    "en": "Address2"
                },
                "value": userIdentity.addressLine2 ? userIdentity.addressLine2 : "",
                "correctedValue": userIdentity.corrected_addressLine2 ? userIdentity.corrected_addressLine2 : "",
                "verificationStatus": userIdentity.status_addressLine2 ? userIdentity.status_addressLine2 : ""
            },
            {
                "label": {
                    "es": "es_City",
                    "en": "City"
                },
                "value": userIdentity.city ? userIdentity.city : "",
                "correctedValue": userIdentity.corrected_city ? userIdentity.corrected_city : "",
                "verificationStatus": userIdentity.status_city ? userIdentity.status_city : ""
            },
            {
                "label": {
                    "es": "es_State",
                    "en": "State"
                },
                "value": userIdentity.stateCode ? userIdentity.stateCode : "",
                "correctedValue": userIdentity.corrected_stateCode ? userIdentity.corrected_stateCode : "",
                "verificationStatus": userIdentity.status_stateCode ? userIdentity.status_stateCode : ""
            },
            {
                "label": {
                    "es": "es_Zipcode",
                    "en": "Zipcode"
                },
                "value": userIdentity.zip ? userIdentity.zip : "",
                "correctedValue": userIdentity.corrected_zip ? userIdentity.corrected_zip : "",
                "verificationStatus": userIdentity.status_zip ? userIdentity.status_zip : ""
            },
            //fix for the ticket 202718 to add country code and adjust the order
            {
                "label": {
                    "es": "es_County",
                    "en": "County"
                },
                "value": userIdentity.countyCode ? userIdentity.countyCode : "",
                "correctedValue": userIdentity.corrected_countyCode ? userIdentity.corrected_countyCode : "",
                "verificationStatus": userIdentity.status_countyCode ? userIdentity.status_countyCode : ""
            },
            {
                "label": {
                    "es": "es_Country",
                    "en": "Country"
                },
                "value": userIdentity.countryCode ? userIdentity.countryCode : "",
                "correctedValue": userIdentity.corrected_countryCode ? userIdentity.corrected_countryCode : "",
                "verificationStatus": userIdentity.status_countryCode ? userIdentity.status_countryCode : ""
            }
            ]

            //fix for ticket 202718, verification status is missing, order is not correct
            
            var verificationMethod = "";
            var verificationStatus = "Not Verified"
            if(userIdentity.verificationStatus && userIdentity.verificationStatus.toLowerCase() === "verified"){ // This is added for new RIDP Implementation
              verificationStatus = "Verified"
            }
            else if(userIdentity.verificationStatus && userIdentity.verificationStatus.toLowerCase() === "partiallyverified"){
              verificationStatus = "Partially Verified"
            }
            else if(userIdentity.verificationStatus && userIdentity.verificationStatus.toLowerCase() === "fullyverified"){
              verificationStatus = "Fully Verified"
            }
            else if(userIdentity.verificationStatus && userIdentity.verificationStatus.toLowerCase() === "notverified"){
              verificationStatus = "Not Verified"
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
            var IsLNKbaRequired = false
            if(userIdentity && userIdentity.proofingMethod){
              var proofingMethod = userIdentity.proofingMethod
              if(proofingMethod == "2"){
                     proofingMethod = "4"
             }else if(proofingMethod !== "1" && proofingMethod !== "-1"){
                  proofingMethod = "4"
             }else if(proofingMethod == "-1"){
                  proofingMethod = "1"
             }
            if(proofingMethod && proofingMethod == "4" ){
                IsLNKbaRequired = true
            }else{
                IsLNKbaRequired = false
            }
              
            }


            var identityVerification = [
                {
                    "label": {
                        "es": "es_id(LexID)",
                        "en": "id(LexID)"
                    },
                    "value": userIdentity.uuid ? userIdentity.uuid : ""
                    
                },
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
                },
                // {
                //     "label": {
                //         "es": "es_id(LexID)",
                //         "en": "id(LexID)"
                //     },
                //     "value": userIdentity.uuid ? userIdentity.uuid : ""
                    
                // },
                {
                    "label": {
                        "es": "es_Verification risks",
                        "en": "Verification risks"
                    },
                    "value": userIdentity.riskIndicator ? (userIdentity.riskIndicator === "NORISK" ? "NO RISK" : userIdentity.riskIndicator) : ""
                    
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
             var ridpConfigResponse = null;
            var showNewDisplay = true;
            try{
                ridpConfigResponse = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
                logger.error("response from query :: " + JSON.stringify(ridpConfigResponse))
                if(ridpConfigResponse && ridpConfigResponse.resultCount > 0){
                  showNewDisplay = ridpConfigResponse.result[0].ridp_shownewdisplay_bsp
                }
                
            }
          catch(e){
            logger.error("Error while getting response for alpha_kyid_ridp_config " + e)
            showNewDisplay = true
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
                        "_Id": userIdentity._id,
                        "Basic Information": basicInformation,
                        "Home Address": homeAddress,
                        "Identity Verification": identityVerification,
                        "Organ Donor": organDonor,
                        "showNewDisplay": showNewDisplay,
                        "IsLNKbaRequired": IsLNKbaRequired
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
              var domain = null    //01/20: Fix for TFS#210738 ---> Start
              if(alphaUser.frIndexedString2){
                 domain = alphaUser.frIndexedString2.split("@")
                 logger.error("Domain in BSP => "+domain[1])
               }             //01/20: Fix for TFS#210738 ---> End
                orgInfo = [{
                    "label": {
                        "es": "es_Active domain directory",
                        "en": "Active domain directory"
                    },
                    "value": domain[1] //alphaUser.frUnindexedString2
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
       logger.error("In endpoint/account_v2B:: Typeof sessionRefId - "+typeof sessionRefId +" and value is - "+JSON.stringify(sessionRefId))

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
    
        logger.error("***placeParts in endpoint/account_v2B => "+placeParts)
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
            //sessionId: sessionRefId || "",
            sessionId: sessionRefId.sessionRefId || "",      //Defect Fix# 211192 (Unknown Location) - 03/12
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

        if (!userResponse) {
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
                // Support both formats: {field, value} and {propertyName, propertyValue}
                if (item && item.propertyValue) {
                    userPatchOperations.push({
                        "operation": "replace",
                        field: "/" + item.propertyName,
                        value: item.propertyValue
                    })
                }
            })
          /*
            userAlpha.forEach(item => {
                if (item && item.propertyValue) {
                    userPatchOperations.push({
                        "operation": "replace",
                        field: "/" + item.propertyName,
                        value: item.propertyValue
                    })
                }
            })
          */
        }

      

        let userPatchResult = openidm.patch("managed/alpha_user/" + userResponse._id, null, userPatchOperations)
        // logger.error("update user profile userPatchResult: " + userPatchResult)



        let userIdentityPatchOperations = []

        if (userIdentityInfo.length > 0) {
            userIdentityInfo.forEach(item => {
              if (item && item.propertyValue) {
                    userIdentityPatchOperations.push({
                        "operation": "replace",
                        field: "/" + item.propertyName,
                        value: item.propertyValue
                    })
              }
              /*
                if (item && item.propertyValue) {

                    userIdentityPatchOperations.push({
                        operation: "replace",
                        field: "/" + item.propertyName,
                        value: item.propertyValue
                    })
                }
            */
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
            message: "Exception when update user profile: " + (error.message || error)
        }
    }
}

/**
 * Get audit logger context including client IP and Browser
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

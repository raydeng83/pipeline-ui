/**
 * Script: KYID.Journey.ReadUserPreRequisites
 * Description: This script is used to invoke KOG user prerequisites API. It will give information about user prerequistes completed.
 * Date: 26th July 2025
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get KOG User prerequisites",
    script: "Script",
    scriptName: "KYID.2B1.Journey.JITUserPrequisites",
    timestamp: dateTime,
    missingInputParams: "Following mandatory input params are missing",
    missingEmail: "Missing email",
    emailInfoInSession: "emailaddress value in session",
    missingKogUsrProfileAPIInfo: "Missing KOG UserProfile API details",
    missingKogTokenAPIInfo: "Missing KOG Token API details",
    errorAPICall: "Cannot invoke profile api as required parameters are missing.",
    apiRequest_KOG_USR_PROFILE: "KOG_USR_PROFILE",
    apiRespParam_FirstName: "FirstName",
    apiRespParam_LastName: "LastName",
    apiRespParam_EmailAddress: "EmailAddress",
    apiRespParam_UPN: "UPN",
    apiRespParam_Logon: "Logon",
    apiRespParam_KOGID: "KOGID",
    apiRespParam_LanguagePreference: "LanguagePreference",
    apiRespParam_PhoneNumbers: "PhoneNumbers",
    apiRespParam_SymantecVIPCredentialID: "SymantecVIPCredentialID",
    apiRespParam_OktaVerify: "OktaVerify",
    apiRespParam_UserStatus: "UserStatus",
    apiResponse_KOG_TOKEN: "KOG_TOKEN_API_RESPONSE",
    apiResponse_KOG_USR_PROFILE: "KOG_USR_PROFILE_API_RESPONSE",
    apiResponseStatus: "Status",
    apiResponsePass: "API_RESULT_SUCCESS",
    apiResponseFail: "API_RESULT_FAILURE",
    apiRespFailMsgCode: "MessageCode",
    apiRespFailMsg_114: "-114",
    apiRespFailMsg_115: "-115",
    idmQueryFail: "IDM Query Operation Failed",
    usrRecord: "User Record",
    registeredMFAMethods: "Registered MFA methods",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "success",
    FAIL: "failure",
    MISSING_MANDATORY_CONFIG: "missingMandatoryConfig",
    NOPREREQ: "noprerequistesfound",
    ERROR: "error"
};

// Logging Function
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};

// Declare Global Variables
var missingInputs = [];
var mail = null;

if (typeof existingSession !== 'undefined') {
    mail = existingSession.get("emailaddress");
    nodeState.putShared("mail", mail);
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
        + "::" + nodeConfig.scriptName + "::" + nodeConfig.emailInfoInSession + "::" + mail);

} else {
    if (nodeState.get("mail")) {
        mail = nodeState.get("mail");
    } else if (nodeState.get("EmailAddress")) {
        mail = nodeState.get("EmailAddress");
    } else {
        missingInputs.push(nodeConfig.missingEmail);
    }
}


var kogTokenApi;
if (systemEnv.getProperty("esv.kyid.2b.kogapi.token") && systemEnv.getProperty("esv.kyid.2b.kogapi.token") != null) {
    kogTokenApi = systemEnv.getProperty("esv.kyid.2b.kogapi.token");
} else {
    missingInputs.push(nodeConfig.missingInputParams);
}

var kogUsrPrerequisitesApiURL;
if (systemEnv.getProperty("esv.kyid.usr.jitprerequisites") && systemEnv.getProperty("esv.kyid.usr.jitprerequisites") != null) {
    kogUsrPrerequisitesApiURL = systemEnv.getProperty("esv.kyid.usr.jitprerequisites");
} else {
    missingInputs.push("kogUsrPrerequisitesApiURL");
}

var sihcertforapi;
if (systemEnv.getProperty("esv.kyid.cert.client") && systemEnv.getProperty("esv.kyid.cert.client") != null) {
    sihcertforapi = systemEnv.getProperty("esv.kyid.cert.client");
} else {
    missingInputs.push(nodeConfig.missingInputParams);
}

var apiscope;
if (systemEnv.getProperty("esv.kyid.kogapi.token.getuserprerequisitescope") && systemEnv.getProperty("esv.kyid.kogapi.token.getuserprerequisitescope") != null) {
    apiscope = systemEnv.getProperty("esv.kyid.kogapi.token.getuserprerequisitescope");
} else {
    missingInputs.push("apiscope");
}


var userKOGID = nodeState.get("KOGID")

var userQueryResult = openidm.query("managed/alpha_user", {
    "_queryFilter": 'userName eq "KYIDSystemUser"'
}, ["_id"]);
if (userQueryResult.result.length === 1) {
    var kyidSystemUser = userQueryResult.result[0]._id
}
if (missingInputs.length > 0) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script
        + "::" + nodeConfig.scriptName + "::" + nodeConfig.missingInputParams + "::" + missingInputs);
    action.goTo(nodeOutcome.MISSING_MANDATORY_CONFIG);

} else {
    try {
        var apiTokenRequest = require('KYID.2B1.Library.AccessToken');
        var kogAPITokenResponse = apiTokenRequest.getKOGKYIDAccessToken(kogTokenApi, apiscope);
        nodeLogger.debug("kogAPITokenResponse" + JSON.stringify(kogAPITokenResponse));

        //If the Access token is 200
        if (kogAPITokenResponse.status === 200) {
            var bearerToken = kogAPITokenResponse.response;

            var payload = {
                KOGID: userKOGID
            }
            nodeLogger.debug("payload in ReadUserPrerequisites " + JSON.stringify(payload));
            var requestOptions = {
                "clientName": sihcertforapi,
                "method": "POST",
                "headers": {
                    "Content-Type": "application/json"
                },
                "token": bearerToken,
                "body": payload
            };

            var res = httpClient.send(kogUsrPrerequisitesApiURL, requestOptions).get();

            logger.debug("KOG API Status: " + res.status);
            action.withHeader(`Response code: ${res.status}`);

            if (res.status === 200) {
                var data = JSON.parse(res.text());
                logger.debug("KOG Response: " + JSON.stringify(data));

                if (data.ResponseStatus === 0) {

                    logger.debug("the responsestate in getuserprerequisites is 0")

                    var id = nodeState.get("usrcreatedId"); //_id of the user
                    var requestedUserId = id;
                    var requesterUserId = id;

                    var prereqData = [];

                    // Function to extract common data across types
                    function extractData(source, nameField, dateField, typeName) {
                        if (!Array.isArray(source)) {
                            logger.debug(typeName + " the response is null")
                            return;
                        }
                        source.forEach(function (entry) {
                            if (entry[nameField]) {
                                prereqData.push({
                                    name: entry[nameField],
                                    completionDate: entry[dateField],
                                    applicationName: entry.ApplicationName || (entry.UserRoles && entry.UserRoles[0] && entry.UserRoles[0].ApplicationName) || null,
                                    roleName: entry.RoleName || (entry.UserRoles && entry.UserRoles[0] && entry.UserRoles[0].RoleName) || null,
                                    type: typeName
                                });
                            }
                        });
                    }

                    // Extract entries by type
                    extractData(data.UserPrereqs, "PrereqName", "CompletionDate", "UserPrereqs");
                    extractData(data.UserOnboardings, "UserOnboardingName", "CompletionDate", "UserOnboardings");
                    extractData(data.UserTrainings, "TrainingModuleName", "CompletionDate", "UserTrainings");
                    extractData(data.UserAgreements, "AgreementName", "SignedDate", "UserAgreements");
                    extractData(data.UserCredentials, "CredentialTypeName", "VerifiedDate", "UserCredentials");

                    if (prereqData.length === 0) {
                        logger.debug("No valid prereq entries found in KOG API. Exiting.");
                        action.goTo(nodeOutcome.NOPREREQ);
                    } else {

                        // Resolve roleId using AppName and RoleName (handles duplicates)
                        function resolveRoleIdByAppAndRoleName(applicationName, roleName) {
                            if (!applicationName || !roleName) {
                                return null;
                            }

                            var appQuery = openidm.query("managed/alpha_kyid_businessapplication", {
                                "_queryFilter": 'name eq "' + applicationName + '"'
                            });

                            if (!(appQuery.result)) {
                                logger.debug("Application not found for name: " + applicationName);
                                return null;
                            }

                            var appId = appQuery.result[0]._id;

                            var roleQuery = openidm.query("managed/alpha_role", {
                                "_queryFilter": 'name eq "' + roleName + '" and businessAppId/_refResourceId eq "' + appId + '"'
                            });

                            if (!(roleQuery.result && roleQuery.result.length === 1)) {
                                logger.debug("Role not found or multiple found for RoleName: " + roleName + " under App: " + applicationName);
                                return null;
                            }

                            return roleQuery.result[0]._id;
                        }

                        prereqData.forEach(function (item) {
                            var roleId = item.roleName && item.applicationName
                                ? resolveRoleIdByAppAndRoleName(item.applicationName, item.roleName)
                                : null;

                            var prereqQuery = openidm.query("managed/alpha_kyid_enrollment_prerequisite", {
                                "_queryFilter": 'name eq "' + item.name + '"'
                            });

                            if (!(prereqQuery.result && prereqQuery.result.length > 0)) {
                                logger.debug("Prerequisite not found for name: " + item.name);
                                return;
                            }

                            var prereq = prereqQuery.result[0];
                            var prereqID = prereq._id;

                            if (prereq.prereqTypeId) {
                                var prereqTypeID = prereq.prereqTypeId && prereq.prereqTypeId._refResourceId;
                            } else {
                                logger.debug("Prerequisite type not found for name: " + item.name);
                                return;
                            }

                            // Check if this prerequisite already exists for this user-role
                            logger.debug("the item.name" + item.name)
                            var existingFilter = 'requestedUserAccountId eq "' + requestedUserId + '" and status eq "COMPLETED" and preRequisiteId/_refResourceId eq "' + prereqID + '" and recordState eq "ACTIVE"';
                            if (roleId) {
                                existingFilter += ' and associatedRoleIds eq "' + roleId + '"';
                            }

                            var existingQuery = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites", {
                                "_queryFilter": existingFilter
                            });

                            logger.debug("the existingQuery result" + existingQuery)
                            var alreadyExists = false;
                            if (existingQuery.result && existingQuery.result.length > 0) {
                                logger.debug("Prerequisites already there");
                                for (var i = 0; i < existingQuery.result.length; i++) {
                                    var entry = existingQuery.result[i];
                                    if (entry.preRequisiteId &&
                                        entry.preRequisiteId._ref === "managed/alpha_kyid_enrollment_prerequisite/" + prereqID) {
                                        alreadyExists = true;
                                        break; // no need to continue once found it already exists
                                    }
                                }
                            }

                            if (alreadyExists) {
                                logger.debug("Duplicate found. Skipping creation for " + item.name);
                                return;
                            }

                            /*
                             createDate: new Date().toISOString(),
                                createDateEpoch: Date.now(),
                                createdBy: kyidSystemUser || requesterUserId,
                                updatedBy: kyidSystemUser || requesterUserId,
                            */

                            var auditDetails = require("KYID.2B1.Library.AuditDetails")
                            var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
                            // Build the create object
                            var prereqObj = {
                                createDate: auditData.createdDate,
                                createdBy: auditData.createdBy,
                                createdByID: auditData.createdByID,
                                createDateEpoch: auditData.createdDateEpoch,
                                updateDate: auditData.updatedDate,
                                updateDateEpoch: auditData.updatedDateEpoch,
                                updatedBy: auditData.updatedBy,
                                updatedByID: auditData.updatedByID,
                                status: "COMPLETED",
                                requesterUserAccountId: requesterUserId,
                                recordState: "ACTIVE",
                                recordSource: "0",

                                requestedUserAccountId: requestedUserId,
                                completionDate: item.completionDate,
                                preRequisiteId: {
                                    "_ref": "managed/alpha_kyid_enrollment_prerequisite/" + prereqID,
                                    "_refProperties": {}
                                },
                                preRequisiteTypeId: {
                                    "_ref": "managed/alpha_kyid_enrollment_prerequisite_type/" + prereqTypeID,
                                    "_refProperties": {}
                                }
                            };

                            if (roleId) {
                                prereqObj.associatedRoleIds = roleId;
                            }

                            logger.debug("Creating prereqObj: " + JSON.stringify(prereqObj));
                            var prereqResult = openidm.create("managed/alpha_kyid_enrollment_user_prerequisites", null, prereqObj);
                            logger.debug("Created UserPrereq with _id: " + prereqResult._id);
                        });

                        logger.debug("Finished processing all entries. Going to SUCCESS");
                        action.goTo(nodeOutcome.SUCCESS);
                    }
                } else if (data.ResponseStatus === 1) {
                    logger.debug("KOGAPI failed for user prerequisited");
                    var msg = data.MessageResponses.map(m => `[${m.MessageCode}] ${m.MessageDescription}`).join(" | ");
                    logger.debug("KOG Error: " + msg);
                    nodeState.putShared("jituserprereqapierror", msg);
                    action.goTo(nodeOutcome.FAIL);
                }
            }
            else {
                logger.debug("KOG Response is not 200")
                action.goTo(nodeOutcome.FAIL);
            }
        } else {
            logger.debug("Access token is not 200")
            action.goTo(nodeOutcome.FAIL);
        }
    } catch (err) {
        logger.error("Exception in processing KOG API: " + err);
        action.goTo(nodeOutcome.FAIL);
    }
}

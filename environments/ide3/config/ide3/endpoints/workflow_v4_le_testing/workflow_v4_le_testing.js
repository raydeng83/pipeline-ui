var tenantBaseUrl = identityServer.getProperty("esv.kyid.tenant.fqdn");
var requestAction = request.content.action;
var payload = request.content.payload;
var prerequisiteTypeId = payload.prerequisiteTypeId;
var prerequisiteTypeName;
var accessToken = payload.accessToken;
var levelOneApproverList = payload.levelOneApprovers;
logger.error("custom-endpoint workflow level one approver payload: " + JSON.stringify(levelOneApproverList));
var levelOneBackupApproverList = payload.levelOneBackupApprovers;
var levelTwoApproverList = payload.levelTwoApprovers;
var levelTwoBackupApproverList = payload.levelTwoBackupApprovers;

var levelOneApprovalNodeID = "approvalTask-95a73e18cff6";
var levelOneBackupApprovalNodeID = "approvalTask-ca89c676a630";
var levelTwoApprovalNodeID = "approvalTask-27b7f3b9d10e";
var levelTwoBackupApprovalNodeID = "approvalTask-36de7246f5e0";

var publishWorkflow = payload.publishWorkflow;
var workflowName = payload.name;
var verbose = payload.verbose;

var prerequisiteType;
var newWorkflow;
var newRequestType;
var newForm;
var requestTypeObject;
var pages;
var fields;
var formObject;

var UUID = java.util.UUID;
var fieldObject;
var formPages = [];
var formfields = [];

var returnObject = {};

var isGenericWorkflow = false;

if (prerequisiteTypeId == null || prerequisiteTypeId == "") {
    isGenericWorkflow = true;
}

(function() {
    try {

        if (request.method == "create") {
            /* This is HTTP POST operation. */ // {requestedUserAccountId="", action="0-Search | X - customAction (e.g 9-getActiveEnrollments) "}
            if (requestAction == "1") {
                return createWorkflowBundle();

            } else if (requestAction == "2") {
                throw {
                    code: 500,
                    message: "Unsupported requestAction."
                };
            } else if (requestAction == "4") {
                throw {
                    code: 500,
                    message: "Unsupported requestAction."
                };
            } else {
                throw {
                    code: 500,
                    message: "Unsupported requestAction."
                };
            }

        } else if (request.method == "update") {
            /* This is HTTP PUT operation. */
            //Throw unsupported operation error.
            throw {
                code: 500,
                message: "Unsupported operation: " + request.method
            };
        } else if (request.method == "patch") {
            /* This is HTTP PATCH operation. */
            //Throw unsupported operation error.
            throw {
                code: 500,
                message: "Unsupported operation: " + request.method
            };
        } else if (request.method == "delete") {
            /* This is HTTP DELETE operation. */
            //Throw unsupported operation error.
            throw {
                code: 500,
                message: "Unsupported operation: " + request.method
            };
        } else if (request.method == "read") {
            /* This is HTTP GET operation. */
            //Throw unsupported operation error.
            throw {
                code: 500,
                message: "Unsupported operation: " + request.method
            };
        }

    } catch (error) {
        /* Returns error response. */
        // return {
        //     "code": "", 
        //     "message": "",
        //     "params" : [""]
        // }
        throw {
            code: 500,
            message: "custom-endpoint workflow error encountered: " + JSON.stringify(error)
        };
    }
})()

function httpCall(url, method, header, body) {
    try {
        var params = {
            url: url,
            method: method,
            headers: header,
            body: body
        }

        logger.error("custom-endpoint workflow Http REST call payload: " + JSON.stringify(params));

        var httpResult = openidm.action("/external/rest", "call", params);

        logger.error("custom-endpoint workflow Http REST call result: " + httpResult);

        return httpResult;
    } catch (error) {
        logger.error("custom-endpoint workflow Http REST call error: " + error);
        throw {
            "error": "custom-endpoint workflow Http REST call error: " + error
        };
    }

}

function getPrerequisiteTypeById(id) {
    try {
        logger.error("custom-endpoint workflow getPrerequisiteTypeById: " + id);
        var prerequisiteType = openidm.read("managed/alpha_kyid_enrollment_prerequisite_type/" + id, null, ["*"])
        logger.error("custom-endpoint workflow prerequisiteType: " + JSON.stringify(prerequisiteType));
        if (!prerequisiteType || prerequisiteType === null) {
            logger.error("prerequisiteType not found, id: " + prerequisiteType);
            throw {
                code: 400,
                message: "prerequisiteType not found, id: " + prerequisiteType
            };
        } else {
            return prerequisiteType;
        }
    } catch (error) {
        logger.error("custom-endpoint workflow search prerequisiteType error: " + JSON.stringify(error));
        throw {
            "error": "custom-endpoint workflow search prerequisiteType error: " + JSON.stringify(error)
        };
    }
}

function addApproversToApprovalNode(approverList, approvalNodeID, workflowPayloadObjectStepIndex) {
    var approverIDs = getApproverUserList(approverList);
    logger.error("custom-endpoint workflow with approval node " + approvalNodeID + " and approver lists are " + approverIDs);
    for (var i = 0; i < approverIDs.length; i++) {
      logger.error("custom-endpoint workflow with approval ID" + JSON.stringify(approverIDs[i]));
        if (approverIDs[i].type == "user")
            var actor = {
                "id": "managed/user/" + approverIDs[i].id,
                "permissions": {
                    "approve": true,
                    "reject": true,
                    "reassign": true,
                    "modify": true,
                    "comment": true
                }
            }
        else if (approverIDs[i].type == "role")
            var actor = {
                "id": "managed/role/" + approverIDs[i].id,
                "permissions": {
                    "approve": true,
                    "reject": true,
                    "reassign": true,
                    "modify": true,
                    "comment": true
                }
            };

        workflowPayloadObject.steps[workflowPayloadObjectStepIndex].approvalTask.actors.push(actor);
        logger.error("custom-endpoint workflow actors: " + workflowPayloadObject.steps[workflowPayloadObjectStepIndex].approvalTask.actors);
        if (approverIDs[i].type == "user") {
            var actorUI = {
                "id": {
                    "isExpression": false,
                    "value": "managed/user/" + approverIDs[i].id
                },
                "type": "user"
            }
        }
        else if (approverIDs[i].type == "role") {
            var actorUI = {
                "id": {
                    "isExpression": false,
                    "value": "managed/role/" + approverIDs[i].id
                },
                "type": "role"
            }
        }
        workflowPayloadObject.staticNodes.uiConfig[approvalNodeID].actors.push(actorUI);
        logger.error("custom-endpoint workflow actorsUI: " + workflowPayloadObject.staticNodes.uiConfig[approvalNodeID].actors);
    }
}


function createWorkflow(workflowName, prerequisiteType, levelOneApprovers, levelOneBackupAppovers, levelTwoApprovers, levelTwoBackupApprovers, publishWorkflow, accessToken) {
    try {
        logger.error("custom-endpoint workflow createWorkflow: " + prerequisiteType);
        
        if(isGenericWorkflow)
        {
            if (levelTwoApprovers && levelTwoApprovers != null) {
                var workflowPayloadJson = "{\"id\":\"templateWorkflow\",\"name\":\"templateWorkflow\",\"displayName\":\"templateWorkflow\",\"description\":\"templateWorkflow\",\"childType\":false,\"_rev\":0,\"steps\":[{\"name\":\"scriptTask-70b2da1a0483\",\"displayName\":\"Initialize\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-63953f0126f4\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar failureReason = null;\\nvar request = null;\\n\\nvar requestObj = null;\\nvar userPrerequisite = null\\nvar requestType = null;\\n\\nlogger.info(\\\"kyid-workflow starting workflow with request id: \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n    requestType = requestObj.requestType;\\n\\n    userPrerequisite = openidm.read('managed\/alpha_kyid_enrollment_user_prerequisites\/' + requestObj.request.custom.userPrerequisiteId, null, [ '*' ]);\\n    logger.info(\\\"kyid-workflow userPrerequisite: \\\" + userPrerequisite);\\n\\n} catch (e) {\\n    failureReason = \\\"kyid-workflow error: \\\" + e;\\n}\\n\\n\\n\\nif (userPrerequisite && requestType) {\\n    try {\\n        openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [\\n            {\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/status\\\",\\\"value\\\":\\\"PENDING_APPROVAL\\\"},{\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/pingApprovalWorkflowId\\\",\\\"value\\\":requestId}\\n        ]);\\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n    }\\n} else {\\n    failureReason = \\\"kyid-workflow error: User Prerequisite or Request Type not found\\\";\\n}\\n\\nexecution.setVariable(\\\"failureReason\\\", failureReason);\\n\"}},{\"name\":\"approvalTask-95a73e18cff6\",\"displayName\":\"Level 1 Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"approvalTask-27b7f3b9d10e\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-ba0f2a0ca56e\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"exclusiveGateway-63953f0126f4\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"approvalTask-95a73e18cff6\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"approvalTask-27b7f3b9d10e\",\"displayName\":\"Level 2 Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"scriptTask-05efed9a34f3\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-302a3b749c83\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"scriptTask-05efed9a34f3\",\"displayName\":\"Provisioning\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-7f1777e228ba\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\/\/logger.info(\\\"kyid-workflow provisioning for request with id: \\\" + requestId);\\nlogger.error(\\\"kyid-workflow provisioning for request with id: \\\" + requestId);\\nvar koCredsAPI = identityServer.getProperty(\\\"esv.addremoveusercredential.api\\\")\\nlogger.error(\\\"Value of creds url is - \\\"+ koCredsAPI)\\nvar kogCredsAPIScope = identityServer.getProperty(\\\"esv.addremoveusercredential.api.scope\\\")\\nlogger.error(\\\"Value of creds scope is - \\\"+ kogCredsAPIScope)\\nvar koOrgAPI = identityServer.getProperty(\\\"esv.addremoveuseronboarding.api\\\")\\nlogger.error(\\\"Value of org url is - \\\"+ koOrgAPI)\\nvar kogOrgAPIScope = identityServer.getProperty(\\\"esv.addremoveuseronboarding.api.scope\\\")\\nlogger.error(\\\"Value of org scope is - \\\"+ kogOrgAPIScope)\\n\\nvar failureReason = null;\\nvar requestObj = null;\\nvar shouldPatchUserPrerequisite = false;\\n\\nfunction getExpiryDate(option, value) {\\n    try {\\n        option = Number(option)\\n        const currentTimeinEpoch = Date.now(); \/\/ Current time in milliseconds (epoch)\\n        const currentDate = new Date().toISOString(); \/\/ Current date in ISO format (e.g., \\\"2025-07-15T15:12:34.567Z\\\")\\n        const currentDateObject = new Date(currentDate); \/\/ Convert the ISO string into a Date object\\n\\n        let expiryDate;\\n\\n        switch (option) {\\n            case 0: \/\/ Daily\\n                \/\/ getExpiryDate(0, null);\\n                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000); \/\/ Add one day (24 hours) to the current time\\n                break;\\n            case 1: \/\/ Weekly\\n                \/\/ getExpiryDate(1, null);\\n                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000); \/\/ Add one week (7 days)\\n                break;\\n            case 2: \/\/ Monthly\\n                \/\/ getExpiryDate(2, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 1) \/\/ Add one month to the current date\\n                break;\\n            case 3: \/\/ Quarterly\\n                \/\/ getExpiryDate(3, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 3); \/\/ Add 3 months to the current date\\n                break;\\n            case 4: \/\/ Semi-Annually\\n                \/\/ getExpiryDate(4, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 6); \/\/ Add 6 months to the current date\\n                break;\\n            case 5: \/\/ Annually\\n                \/\/ getExpiryDate(5, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setFullYear(currentDateObject.getFullYear() + 1); \/\/ Add 1 year to the current date\\n                break;\\n            case 6: \/\/ On Specific Day and Month (not year)\\n                \/\/ getExpiryDate(6, \\\"12-25\\\");\\n                const [month, day] = value.split('-');\\n                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day); \/\/ Set to the specified day and month of the current year\\n                if (expiryDate < currentDateObject) {\\n                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1); \/\/ If the date is already passed this year, set it to the next year\\n                }\\n                break;\\n            case 7: \/\/ Number of Days\\n                \/\/ getExpiryDate(7, 10);\\n                value = Number(value)\\n                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000); \/\/ Add 'value' days in milliseconds\\n                break;\\n            case 8: \/\/ On Specific Due Date\\n                \/\/getExpiryDate(8, \\\"2025-12-31\\\");\\n                expiryDate = new Date(value); \/\/ Assuming 'value' is a string in the format \\\"YYYY-MM-DD\\\"\\n                break;\\n            default:\\n                failureReason = \\\"kyid-workflow error encountered while getExpiryDate: \\\" + error;\\n\\n        }\\n\\n        const expiryEpochMillis = new Date(expiryDate).getTime(); \/\/ Convert expiry date to epoch milliseconds\\n        expiryDate = expiryDate.toISOString();\\n        return {\\n            expiryEpoch: expiryEpochMillis,\\n            expiryDate: expiryDate\\n        };\\n\\n    } catch (error) {\\n        logger.error(\\\"Error Occurred While getExpiryDate \\\" + error)\\n        failureReason = \\\"kyid-workflow error encountered while getExpiryDate: \\\" + error;\\n    }\\n\\n}\\n\\nfunction invokeKOGCredentialsAPI(payload) {\\n    logger.error(\\\"kyid-workflow Inside invokeKOGCredentialsAPI\\\")\\n    let funcName = \\\"invokeKOGCredentialsAPI\\\"\\n    let responseKOGCredentialsAPI = null\\n    let requestBody = {\\n        url: koCredsAPI,\\n        scope: kogCredsAPIScope,\\n        \/\/url: \\\"https:\/\/dev.sih.ngateway.ky.gov\/ide3\/kyidapi\/V1\/addremoveusercredential\\\",\\n        \/\/scope: \\\"kogkyidapi.addremoveusercredential\\\",\\n        method: \\\"POST\\\",\\n        payload: payload\\n    }\\n    let apiResult = {\\n        apiStatus: null,\\n        ResponseStatus: null,\\n        MessageResponses: null\\n    }\\n\\n    try {\\n        logger.error(\\\"kyid-workflow Request Body for invokeKOGCredentialsAPI is - \\\" + JSON.stringify(requestBody))\\n        responseKOGCredentialsAPI = openidm.create(\\\"endpoint\/invokeCertAPI\\\", null, requestBody)\\n        logger.error(\\\"kyid-workflow responseKOGCredentialsAPI in invokeKOGCredentialsAPI is - \\\" + JSON.stringify(responseKOGCredentialsAPI))\\n         if (responseKOGCredentialsAPI != null && responseKOGCredentialsAPI) {\\n             if (responseKOGCredentialsAPI.response.ResponseStatus==0) {\\n                 apiResult.ResponseStatus = 0\\n                 apiResult.apiStatus = 200\\n             } else {\\n                apiResult.ResponseStatus = responseKOGCredentialsAPI.response.ResponseStatus\\n                apiResult.MessageResponses = responseKOGCredentialsAPI.response.MessageResponses\\n                apiResult.apiStatus = 400\\n             }\\n         }\\n\\n        logger.error(\\\"apiResult in invokeKOGCredentialsAPI is - \\\"+JSON.stringify(apiResult))\\n        return apiResult\\n\\n    } catch (error) {\\n        \/\/Return error response\\n        logger.error(\\\"kyid-workflow Exception is - \\\" + error)\\n        failureReason = \\\"kyid-workflow error encountered while invokeKOGCredentialsAPI: \\\" + error;\\n        return undefined\\n    }\\n}\\n\\nfunction invokeUserOnboardingAPI(payload) {\\n    logger.error(\\\"kyid-workflow Inside invokeUserOnboardingAPI\\\");\\n    let funcName = \\\"invokeUserOnboardingAPI\\\";\\n    let responseUserOnboardingAPI = null;\\n    let requestBody = {\\n        url: koOrgAPI,\\n        scope: kogOrgAPIScope,\\n        method: \\\"POST\\\",\\n        payload: payload\\n    }\\n    let apiResult = {\\n        apiStatus: null,\\n        ResponseStatus: null,\\n        MessageResponses: null\\n    }\\n\\n    try {\\n        logger.error(\\\"kyid-workflow Request Body for invokeUserOnboardingAPI is - \\\" + JSON.stringify(requestBody))\\n        responseUserOnboardingAPI = openidm.create(\\\"endpoint\/invokeCertAPI\\\", null, requestBody)\\n        logger.error(\\\"kyid-workflow responseUserOnboardingAPI in invokeUserOnboardingAPI is - \\\" + JSON.stringify(responseUserOnboardingAPI))\\n        if (responseUserOnboardingAPI != null && responseUserOnboardingAPI) {\\n            if (responseUserOnboardingAPI.response.ResponseStatus == 0) {\\n                apiResult.ResponseStatus = 0\\n                apiResult.apiStatus = 200\\n            } else {\\n                apiResult.ResponseStatus = responseUserOnboardingAPI.response.ResponseStatus\\n                apiResult.MessageResponses = responseUserOnboardingAPI.response.MessageResponses\\n                apiResult.apiStatus = 400\\n            }\\n        }\\n        return apiResult\\n\\n    } catch (error) {\\n        \/\/Return error response\\n        logger.error(\\\"kyid-workflow Exception is - \\\" + error)\\n        failureReason = \\\"kyid-workflow error encountered while invokeUserOnboardingAPI: \\\" + error;\\n\\t\\treturn undefined\\n    }\\n}\\n\\n\\nfunction getPrerequisites(apiRequestPayload) {\\n    try {\\n        let isPendingPrereq = true;\\n        logger.error(\\\"apiRequestPayload.requestedUserAccountId --> \\\" + apiRequestPayload.requestedUserAccountId)\\n        logger.error(\\\"apiRequestPayload.enrollmentRequestId -->\\\" + apiRequestPayload.enrollmentRequestId)\\n        let completedCounter = 0;\\n        const response = openidm.query(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\", {\\n            \\\"_queryFilter\\\": '\/enrollmentRequestId\/ eq \\\"' +\\n                apiRequestPayload.enrollmentRequestId + '\\\"' +  ' AND (recordState eq \\\"ACTIVE\\\" OR recordState eq \\\"0\\\")' + ' AND requestedUserAccountId eq \\\"' + apiRequestPayload.requestedUserAccountId + '\\\"'\\n        }, [\\\"status\\\", \\\"displayOrder\\\", \\\"preRequisiteType\\\", \\\"preRequisiteTypeId\/_id\\\", \\\"preRequisiteTypeId\/typeName\\\", \\\"preRequisiteId\/displayName\\\", \\\"preRequisiteId\/displayDescription\\\"])\\n\\n        logger.error(\\\"Get Prereq Summary Response is --> \\\" + response)\\n        if (response != null && response.resultCount > 0) {\\n            for (let i = 0; i < response.resultCount; i++) {\\n                if (response.result[i].status === \\\"COMPLETED\\\" || response.result[i].status === \\\"ALREADY_COMPLETED\\\") {\\n                    completedCounter++\\n                }\\n            }\\n            if (completedCounter === response.resultCount) {\\n                isPendingPrereq = false\\n            }\\n            return isPendingPrereq\\n        }\\n        else {\\n            logger.error(\\\"User Prereq Not Found\\\")\\n            return null\\n        }\\n    }\\n    catch (error) {\\n        logger.error(\\\"Error Occurred while fetching pending prerequsites\\\" + error)\\n        return { code: 400, message: \\\"Error Occurred while Prereq Summary \\\" + error.message }\\n    }\\n\\n}\\n\\n\\nfunction saveUserPrerequisiteValues(requestObj) {\\n    var userPrerequisite = openidm.read('managed\/alpha_kyid_enrollment_user_prerequisites\/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);\\n    logger.error(\\\"userPrerequisite response - \\\"+JSON.stringify(userPrerequisite))\\n    var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;\\n    var enrollmentRequestId = userPrerequisite.enrollmentRequestId;\\n    var requestedUserAccountId = userPrerequisite.requestedUserAccountId;\\n    var prerequisite = openidm.read('managed\/alpha_kyid_enrollment_prerequisite\/' + prerequisiteId, null, ['*']);\\n    \/\/logger.info(\\\"kyid-workflow prerequisite: \\\" + prerequisite);\\n    logger.error(\\\"kyid-workflow prerequisite: \\\" + prerequisite);\\n\\n    var enrollmentActionSettings = prerequisite.enrollmentActionSettings;\\n    \/\/logger.info(\\\"kyid-workflow enrollmentActionSettings: \\\" + enrollmentActionSettings);\\n    logger.error(\\\"kyid-workflow enrollmentActionSettings: \\\" + enrollmentActionSettings);\\n\\n    var expiryDateObject = prerequisite.expiry;\\n    \/\/  logger.info(\\\"kyid-workflow expiryDateObject: \\\" + JSON.stringify(expiryDateObject));\\n    logger.error(\\\"kyid-workflow expiryDateObject: \\\" + JSON.stringify(expiryDateObject));\\n\\n    var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);\\n    \/\/logger.info(\\\"kyid-workflow calculated expiry: \\\" + JSON.stringify(calculatedExpiryDate));\\n    logger.error(\\\"kyid-workflow calculated expiry: \\\" + JSON.stringify(calculatedExpiryDate));   \\n    shouldPatchUserPrerequisite = true\\n\\n    if (shouldPatchUserPrerequisite) {\\n        openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [{\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/status\\\",\\n                \\\"value\\\": \\\"COMPLETED\\\"\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/expiryDate\\\",\\n                \\\"value\\\": calculatedExpiryDate.expiryDate\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/expiryDateEpoch\\\",\\n                \\\"value\\\": Number(calculatedExpiryDate.expiryEpoch)\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/completionDate\\\",\\n                \\\"value\\\": new Date().toISOString()\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/completionDateEpoch\\\",\\n                \\\"value\\\": Number(Date.now())\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/pingApprovalWorkflowId\\\",\\n                \\\"value\\\": requestId\\n            }\\n        ]);\\n    }\\n\\n    let apiRequestPayload = {\\n                    requestedUserAccountId: requestedUserAccountId,\\n                    enrollmentRequestId: enrollmentRequestId,\\n                    preReqId: null\\n                }\\n    logger.error(\\\"apiRequestPayload for getPrerequisites --> \\\" + JSON.stringify(apiRequestPayload))\\n    var isPendingPrereq = getPrerequisites(apiRequestPayload)\\n    logger.error(\\\"isPendingPrereq response --> \\\" + JSON.stringify(isPendingPrereq))\\n    if(isPendingPrereq == false)\\n    {\\n        let payload = {\\n            requestedUserAccountId: requestedUserAccountId,\\n            enrollmentRequestId: enrollmentRequestId\\n        }\\n        let requestBody = {\\n            action: \\\"1\\\",\\n            payload: payload\\n        }\\n        responseAccess = openidm.create(\\\"endpoint\/access\\\", null, requestBody)\\n        logger.error(\\\"provision access response  --> \\\" + JSON.stringify(responseAccess))\\n    } else {\\n        logger.error(\\\"No provision access  --> \\\")\\n        return null\\n    }\\n\\n}\\n\\n\\n\\n\\n\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n\/\/ Main\\n\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n} catch (e) {\\n    failureReason = \\\"kyid-workflow error: \\\" + e;\\n}\\n\\nif (requestObj && !failureReason) {\\n    logger.info(\\\"kyid-workflow inside requestObj\\\");\\n    try {\\n        \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n        \/\/ TBD, Logic to provisioning access to user \\n        \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n\\n    } catch (e) {\\n        var err = e.javaException;\\n        failureReason = \\\"kyid-workflow provisioning failed:  \\\" + e;\\n    }\\n\\n    var decision = {\\n        'status': 'complete',\\n        'decision': 'approved'\\n    };\\n\\n    if (failureReason) {\\n        decision.outcome = 'not provisioned';\\n        decision.comment = failureReason;\\n        decision.failure = true;\\n    } else {\\n        decision.outcome = 'provisioned';\\n\\n        saveUserPrerequisiteValues(requestObj);\\n    }\\n\\n    var queryParams = {\\n        '_action': 'update'\\n    };\\n    openidm.action('iga\/governance\/requests\/' + requestId, 'POST', decision, queryParams);\\n    logger.info(\\\"Request \\\" + requestId + \\\" completed.\\\");\\n}\\n\\n\\nexecution.setVariable(\\\"failureReason\\\", failureReason);\"}},{\"name\":\"scriptTask-a693f3a33d93\",\"displayName\":\"Reject Request\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-34047e616c13\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\nlogger.error(\\\"kyid-workflow rejection for request with id: \\\" + requestId);\\n\\nvar failureReason = null;\\nvar requestObj = null;\\n\\nfunction getExpiryDate(option, value) {\\n    try {\\n        option = Number(option)\\n        const currentTimeinEpoch = Date.now(); \/\/ Current time in milliseconds (epoch)\\n        const currentDate = new Date().toISOString(); \/\/ Current date in ISO format (e.g., \\\"2025-07-15T15:12:34.567Z\\\")\\n        const currentDateObject = new Date(currentDate); \/\/ Convert the ISO string into a Date object\\n\\n        let expiryDate;\\n\\n        switch (option) {\\n            case 0: \/\/ Daily\\n                \/\/ getExpiryDate(0, null);\\n                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000); \/\/ Add one day (24 hours) to the current time\\n                break;\\n            case 1: \/\/ Weekly\\n                \/\/ getExpiryDate(1, null);\\n                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000); \/\/ Add one week (7 days)\\n                break;\\n            case 2: \/\/ Monthly\\n                \/\/ getExpiryDate(2, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 1) \/\/ Add one month to the current date\\n                break;\\n            case 3: \/\/ Quarterly\\n                \/\/ getExpiryDate(3, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 3); \/\/ Add 3 months to the current date\\n                break;\\n            case 4: \/\/ Semi-Annually\\n                \/\/ getExpiryDate(4, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 6); \/\/ Add 6 months to the current date\\n                break;\\n            case 5: \/\/ Annually\\n                \/\/ getExpiryDate(5, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setFullYear(currentDateObject.getFullYear() + 1); \/\/ Add 1 year to the current date\\n                break;\\n            case 6: \/\/ On Specific Day and Month (not year)\\n                \/\/ getExpiryDate(6, \\\"12-25\\\");\\n                const [month, day] = value.split('-');\\n                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day); \/\/ Set to the specified day and month of the current year\\n                if (expiryDate < currentDateObject) {\\n                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1); \/\/ If the date is already passed this year, set it to the next year\\n                }\\n                break;\\n            case 7: \/\/ Number of Days\\n                \/\/ getExpiryDate(7, 10);\\n                value = Number(value)\\n                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000); \/\/ Add 'value' days in milliseconds\\n                break;\\n            case 8: \/\/ On Specific Due Date\\n                \/\/getExpiryDate(8, \\\"2025-12-31\\\");\\n                expiryDate = new Date(value); \/\/ Assuming 'value' is a string in the format \\\"YYYY-MM-DD\\\"\\n                break;\\n            default:\\n                return {\\n                    code: 400, message: \\\"Invalid Input\\\"\\n                }\\n        }\\n\\n        const expiryEpochMillis = new Date(expiryDate).getTime(); \/\/ Convert expiry date to epoch milliseconds\\n        expiryDate = expiryDate.toISOString();\\n        return {\\n            expiryEpoch: expiryEpochMillis,\\n            expiryDate: expiryDate\\n        };\\n\\n    } catch (error) {\\n        return {\\n            code: 400,\\n            message: \\\"Error Occurred While getExpiryDate \\\"\\n        }\\n        logger.error(\\\"Error Occurred While getExpiryDate \\\" + error)\\n    }\\n\\n}\\n\\n\\nfunction updatePrerequisite(requestObj) {\\n    var userPrerequisite = openidm.read('managed\/alpha_kyid_enrollment_user_prerequisites\/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);\\n\\n    var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;\\n    var prerequisite = openidm.read('managed\/alpha_kyid_enrollment_prerequisite\/' + prerequisiteId, null, [ '*' ]);\\n    logger.info(\\\"kyid-workflow prerequisite: \\\" + prerequisite);\\n\\n    var enrollmentRequestId = userPrerequisite.enrollmentRequestId;\\n    var enrollmentRequest = openidm.read('managed\/alpha_kyid_enrollment_request\/' + enrollmentRequestId, null, ['*']);\\n    logger.error(\\\"kyid-workflow enrollmentRequest: \\\" + enrollmentRequest);\\n\\n    var enrollmentRequestResult = openidm.patch(\\\"managed\/alpha_kyid_enrollment_request\/\\\" + enrollmentRequestId, null, [{\\n        \\\"operation\\\": \\\"replace\\\",\\n        \\\"field\\\": \\\"\/status\\\",\\n        \\\"value\\\": \\\"REJECTED\\\"\\n    }]);\\n    logger.error(\\\"kyid-workflow reject status update result: \\\" + enrollmentRequestResult);\\n\\n    \/\/ var enrollmentActionSettings = prerequisite.enrollmentActionSettings;\\n    \/\/ logger.info(\\\"kyid-workflow enrollmentActionSettings: \\\" + enrollmentActionSettings);\\n\\n    var expiryDateObject = prerequisite.expiry;\\n    logger.error(\\\"kyid-workflow expiryDateObject: \\\" + JSON.stringify(expiryDateObject));\\n\\n    var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);\\n    logger.error(\\\"kyid-workflow calculated expiry: \\\" + JSON.stringify(calculatedExpiryDate));\\n\\n    \/\/ var saveInput = enrollmentActionSettings.saveInput;\\n    \/\/ logger.info(\\\"kyid-workflow saveInput: \\\" + saveInput);\\n\\n    \/\/ if (saveInput) {\\n    \/\/     var fieldValuesJson = JSON.parse(requestObj.request.custom.page.values);\\n    \/\/     logger.info(\\\"kyid-workflow fieldValuesJson: \\\" + JSON.stringify(fieldValuesJson));\\n    \/\/     var result = openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [\\n    \/\/         {\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/prerequisiteValues\\\",\\\"value\\\":fieldValuesJson} \\n    \/\/     ]);\\n    \/\/     logger.info(\\\"kyid-workflow patch result: \\\" + result);\\n    \/\/ }\\n\\n    var userPrerequisiteResult = openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [{\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/status\\\",\\n            \\\"value\\\": \\\"REJECTED\\\"\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/expiryDate\\\",\\n            \\\"value\\\": calculatedExpiryDate.expiryDate\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/expiryDateEpoch\\\",\\n            \\\"value\\\": Number(calculatedExpiryDate.expiryEpoch)\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/completionDate\\\",\\n            \\\"value\\\": new Date().toISOString()\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/completionDateEpoch\\\",\\n            \\\"value\\\": Number(Date.now())\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/pingApprovalWorkflowId\\\",\\n            \\\"value\\\": requestId\\n        }\\n    ]);\\n\\n    logger.error(\\\"kyid-workflow userPrerequisite patch result: \\\" + userPrerequisiteResult);\\n}\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n} catch (e) {\\n    failureReason = \\\"kyid-workflow error: \\\" + e;\\n}\\n\\nif (requestObj && !failureReason) {\\n    try {\\n        \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n        \/\/ TBD, Logic to provisioning access to user \\n        \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n\\n    } catch (e) {\\n        var err = e.javaException;\\n        failureReason = \\\"kyid-workflow provisioning failed:  \\\" + e;\\n    }\\n\\n    var decision = {\\n        'status': 'complete',\\n        'decision': 'rejected'\\n    };\\n\\n    if (failureReason) {\\n        decision.outcome = 'not provisioned';\\n        decision.comment = failureReason;\\n        decision.failure = true;\\n    } else {\\n        decision.outcome = 'denied';\\n\\n\\n\\n        updatePrerequisite(requestObj);\\n    }\\n\\n    var queryParams = {\\n        '_action': 'update'\\n    };\\n    openidm.action('iga\/governance\/requests\/' + requestId, 'POST', decision, queryParams);\\n    logger.info(\\\"Request \\\" + requestId + \\\" completed.\\\");\\n}\"}},{\"name\":\"scriptTask-74c5710a88c8\",\"displayName\":\"Error Handle\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\nlogger.info(\\\"kyid-workflow error handling for request with id: \\\" + requestId);\\n\\nvar failureReason = \\\"Error encountered during workflow processing\\\";\\n\\nvar decision = {'outcome': 'cancelled', 'status': 'cancelled', 'comment': failureReason, 'failure': true, 'decision': 'rejected'};\\n\\nvar queryParams = {\\n    '_action': 'update'\\n};\\nvar result = openidm.action('iga\/governance\/requests\/' + requestId, 'POST', decision, queryParams);\\nlogger.info(\\\"kyid-workflow request error status update result: \\\" + result);\"}},{\"name\":\"exclusiveGateway-7f1777e228ba\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-ef98df825107\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"exclusiveGateway-34047e616c13\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-37be22411bf7\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"scriptTask-ef98df825107\",\"displayName\":\"Send Approval Notice Email\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"kyid-workflow send request approval email\\\");\\r\\n\\r\\nvar content = execution.getVariables();\\r\\nvar requestId = content.get('id');\\r\\n\\r\\n\/\/ Read event user information from request object\\r\\ntry {\\r\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\r\\n  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;\\r\\n  var  requestBody = {}\\r\\n  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName\\r\\n  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn\\r\\n  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName \\r\\n  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   \\r\\n  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail\\r\\n  const now = new Date();\\r\\n  const timestamp = epochToCustomDate(now)\\r\\n  requestBody.timeStamp = timestamp.replace(\\\" UTC\\\", \\\"\\\");\\r\\n  var body = {\\r\\n    subject: \\\"Request Approved\\\" ,\\r\\n    to: requesterEmail,\\r\\n    \/\/ body: \\\"Request with ID \\\" + requestId + \\\" has been approved.\\\",\\r\\n    templateName: \\\"kyidRequestApproved\\\",\\r\\n    object: requestBody\\r\\n  };\\r\\n  \/\/ \/\/ if (userObj && userObj.manager && userObj.manager.mail) {\\r\\n  \/\/ \/\/   body.cc = userObj.manager.mail\\r\\n  \/\/ \/\/ };\\r\\n  openidm.action(\\\"external\/email\\\", \\\"sendTemplate\\\", body);\\r\\n}\\r\\ncatch (e) {\\r\\n  logger.info(\\\"Unable to send approval notification email\\\");\\r\\n}\\r\\nfunction epochToCustomDate(epoch) {\\r\\n    let date = new Date(epoch);\\r\\n    return date.toLocaleString('en-US', {\\r\\n        year: 'numeric',\\r\\n        month: 'long',\\r\\n        day: 'numeric',\\r\\n        hour: '2-digit',\\r\\n        minute: '2-digit',\\r\\n        second: '2-digit'\\r\\n    });\\r\\n}\"}},{\"name\":\"scriptTask-37be22411bf7\",\"displayName\":\"Send Reject Notification Email\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"\\r\\n\\r\\nlogger.info(\\\"kyid-workflow send request rejection email\\\");\\r\\n\\r\\nvar content = execution.getVariables();\\r\\nvar requestId = content.get('id');\\r\\n\\r\\n\/\/ Read event user information from request object\\r\\ntry {\\r\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\r\\n  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;\\r\\n  var  requestBody = {}\\r\\n  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName\\r\\n  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn\\r\\n  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName \\r\\n  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   \\r\\n  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail\\r\\n  const now = new Date();\\r\\n  const timestamp = epochToCustomDate(now)\\r\\n  requestBody.timeStamp = timestamp.replace(\\\" UTC\\\", \\\"\\\");\\r\\n  var body = {\\r\\n    subject: \\\"Request Rejected\\\" ,\\r\\n    to: requesterEmail,\\r\\n    \/\/ body: \\\"Request with ID \\\" + requestId + \\\" has been rejected.\\\",\\r\\n    templateName: \\\"kyidRequestRejected\\\",\\r\\n    object: requestBody\\r\\n  };\\r\\n  openidm.action(\\\"external\/email\\\", \\\"sendTemplate\\\", body);\\r\\n}\\r\\ncatch (e) {\\r\\n  logger.info(\\\"Unable to send rejection notification email\\\");\\r\\n}\\r\\nfunction epochToCustomDate(epoch) {\\r\\n    let date = new Date(epoch);\\r\\n    return date.toLocaleString('en-US', {\\r\\n        year: 'numeric',\\r\\n        month: 'long',\\r\\n        day: 'numeric',\\r\\n        hour: '2-digit',\\r\\n        minute: '2-digit',\\r\\n        second: '2-digit'\\r\\n    });\\r\\n}\"}},{\"name\":\"scriptTask-ba0f2a0ca56e\",\"displayName\":\"Check Level 1 Expiration or Rejection\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-19779330b754\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar requestObj = null;\\n\\nlogger.info(\\\"kyid-workflow check level 1 expiration or rejection:  \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n\\n} catch (e) {\\n    logger.info(\\\"kyid-workflow check level 1 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\\nif (requestObj) {\\n    try {\\n        var id = requestObj.decision.phases[0].completedBy.id;\\n        logger.error(\\\"kyid-workflow completedBy id for level 1 approval is: \\\" + id);\\n\\n        if (id == \\\"SYSTEM\\\") {\\n            execution.setVariable(\\\"requestExpired\\\", true);\\n        } else {\\n            execution.setVariable(\\\"requestExpired\\\", false);\\n        }\\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n        execution.setVariable(\\\"requestExpired\\\", false);\\n    }\\n} else {\\n    logger.info(\\\"kyid-workflow check level 1 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\"}},{\"name\":\"exclusiveGateway-19779330b754\",\"displayName\":\"Check Expiration Condition\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"requestExpired == true\",\"outcome\":\"validationSuccess\",\"step\":\"approvalTask-ca89c676a630\"},{\"condition\":\"requestExpired == false\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-a693f3a33d93\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"approvalTask-ca89c676a630\",\"displayName\":\"Level 1 Backup Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"approvalTask-27b7f3b9d10e\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-a693f3a33d93\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"scriptTask-302a3b749c83\",\"displayName\":\"Check Level 2 Expiration or Rejection\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-514d593f4037\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar requestObj = null;\\n\\nlogger.info(\\\"kyid-workflow check level 2 expiration or rejection:  \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n\\n} catch (e) {\\n    logger.info(\\\"kyid-workflow check level 2 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\\nif (requestObj) {\\n    try {\\n        var id = requestObj.decision.phases[1].completedBy.id;\\n        logger.error(\\\"kyid-workflow completedBy id for level 2 approval is: \\\" + id);\\n\\n        if (id == \\\"SYSTEM\\\") {\\n            execution.setVariable(\\\"requestExpired\\\", true);\\n        } else {\\n            execution.setVariable(\\\"requestExpired\\\", false);\\n        }\\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n        execution.setVariable(\\\"requestExpired\\\", false);\\n    }\\n} else {\\n    logger.info(\\\"kyid-workflow check level 2 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\"}},{\"name\":\"exclusiveGateway-514d593f4037\",\"displayName\":\"Check Expiration Condition\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"requestExpired == true\",\"outcome\":\"validationSuccess\",\"step\":\"approvalTask-36de7246f5e0\"},{\"condition\":\"requestExpired == false\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-a693f3a33d93\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"approvalTask-36de7246f5e0\",\"displayName\":\"Level 2 Backup Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"scriptTask-05efed9a34f3\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-a693f3a33d93\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"}],\"staticNodes\":{\"endNode\":{\"x\":3990,\"y\":225.5,\"id\":\"endNode\",\"name\":\"End\",\"nodeType\":\"SingleInput\",\"displayType\":\"SingleInput\",\"isDroppable\":false,\"isDeleteable\":false,\"isEditable\":false,\"isHovered\":false,\"hasError\":false,\"displayDetails\":{\"icon\":\"checkmark\",\"variant\":\"success\",\"value\":\"Success\"},\"_outcomes\":[],\"template\":null,\"schema\":null,\"connections\":{}},\"startNode\":{\"x\":70,\"y\":225.5,\"id\":\"startNode\",\"name\":\"Start\",\"nodeType\":\"IconOutcomeNode\",\"displayType\":\"IconOutcomeNode\",\"isDroppable\":false,\"isDeleteable\":false,\"isEditable\":false,\"isHovered\":false,\"hasError\":false,\"displayDetails\":{\"icon\":\"play_arrow\",\"variant\":\"info\",\"value\":\"Start\"},\"_outcomes\":[{\"id\":\"start\",\"displayName\":\"start\"}],\"template\":null,\"schema\":null,\"connections\":{\"start\":\"scriptTask-70b2da1a0483\"}},\"uiConfig\":{\"scriptTask-70b2da1a0483\":{\"x\":210,\"y\":227},\"approvalTask-95a73e18cff6\":{\"x\":719,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\",\"escalationDate\":1}},\"exclusiveGateway-63953f0126f4\":{\"x\":440,\"y\":200.5},\"approvalTask-27b7f3b9d10e\":{\"x\":1931,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\",\"escalationDate\":1}},\"scriptTask-05efed9a34f3\":{\"x\":3143,\"y\":129},\"scriptTask-a693f3a33d93\":{\"x\":3143,\"y\":251.5},\"scriptTask-74c5710a88c8\":{\"x\":3670,\"y\":374},\"exclusiveGateway-7f1777e228ba\":{\"x\":3391,\"y\":93.66666666666667},\"exclusiveGateway-34047e616c13\":{\"x\":3391,\"y\":286.8333333333333},\"scriptTask-ef98df825107\":{\"x\":3670,\"y\":80},\"scriptTask-37be22411bf7\":{\"x\":3670,\"y\":227},\"scriptTask-ba0f2a0ca56e\":{\"x\":978,\"y\":227},\"exclusiveGateway-19779330b754\":{\"x\":1298,\"y\":200.5},\"approvalTask-ca89c676a630\":{\"x\":1618,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\"}},\"scriptTask-302a3b749c83\":{\"x\":2190,\"y\":227},\"exclusiveGateway-514d593f4037\":{\"x\":2510,\"y\":200.5},\"approvalTask-36de7246f5e0\":{\"x\":2830,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\"}}}},\"status\":\"draft\",\"mutable\":true}";
            }
            else {
                var workflowPayloadJson = "{\"id\":\"templateWorkflow\",\"name\":\"templateWorkflow\",\"displayName\":\"templateWorkflow\",\"description\":\"templateWorkflow\",\"childType\":false,\"_rev\":1,\"steps\":[{\"name\":\"scriptTask-70b2da1a0483\",\"displayName\":\"Initialize\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-63953f0126f4\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar failureReason = null;\\nvar request = null;\\n\\nvar requestObj = null;\\nvar userPrerequisite = null\\nvar requestType = null;\\n\\nlogger.info(\\\"kyid-workflow starting workflow with request id: \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n    requestType = requestObj.requestType;\\n\\n    userPrerequisite = openidm.read('managed\/alpha_kyid_enrollment_user_prerequisites\/' + requestObj.request.custom.userPrerequisiteId, null, [ '*' ]);\\n    logger.info(\\\"kyid-workflow userPrerequisite: \\\" + userPrerequisite);\\n\\n} catch (e) {\\n    failureReason = \\\"kyid-workflow error: \\\" + e;\\n}\\n\\n\\n\\nif (userPrerequisite && requestType) {\\n    try {\\n        openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [\\n            {\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/status\\\",\\\"value\\\":\\\"PENDING_APPROVAL\\\"},\\n            {\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/pingApprovalWorkflowId\\\",\\\"value\\\":requestId}\\n        ]);\\n\\n\\n                \/\/ *** ADDED: write initialization comment into the Request console ***\\n        logger.error(\\\"Q adding comments for initialize node \\\" + requestId);\\n\\n        try {\\n            openidm.action(\\n                'iga\/governance\/requests\/' + requestId,\\n                'POST',\\n                {\\n                    comment: 'Request received for approval.'\\n                },\\n                { _action: 'update' }\\n            );\\n            logger.info(\\\"kyid-workflow: initialization comment added for request \\\" + requestId);\\n        } catch (e) {\\n            logger.error(\\\"kyid-workflow: failed to add initialization comment for request \\\"\\n                + requestId + \\\" with error: \\\" + e);\\n        }\\n\\n\\n\\n\\n\\n\\n        \\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n    }\\n} else {\\n    failureReason = \\\"kyid-workflow error: User Prerequisite or Request Type not found\\\";\\n}\\n\\nexecution.setVariable(\\\"failureReason\\\", failureReason);\\n\"}},{\"name\":\"approvalTask-95a73e18cff6\",\"displayName\":\"Level 1 Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"scriptTask-f289b027502f\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-ba0f2a0ca56e\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"exclusiveGateway-63953f0126f4\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"approvalTask-95a73e18cff6\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"scriptTask-05efed9a34f3\",\"displayName\":\"Provisioning\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-7f1777e228ba\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\/\/logger.info(\\\"kyid-workflow provisioning for request with id: \\\" + requestId);\\nlogger.error(\\\"kyid-workflow provisioning for request with id: \\\" + requestId);\\nvar koCredsAPI = identityServer.getProperty(\\\"esv.addremoveusercredential.api\\\")\\nlogger.error(\\\"Value of creds url is - \\\" + koCredsAPI)\\nvar kogCredsAPIScope = identityServer.getProperty(\\\"esv.addremoveusercredential.api.scope\\\")\\nlogger.error(\\\"Value of creds scope is - \\\" + kogCredsAPIScope)\\nvar koOrgAPI = identityServer.getProperty(\\\"esv.addremoveuseronboarding.api\\\")\\nlogger.error(\\\"Value of org url is - \\\" + koOrgAPI)\\nvar kogOrgAPIScope = identityServer.getProperty(\\\"esv.addremoveuseronboarding.api.scope\\\")\\nlogger.error(\\\"Value of org scope is - \\\" + kogOrgAPIScope)\\n\\nvar failureReason = null;\\nvar requestObj = null;\\nvar shouldPatchUserPrerequisite = false;\\nvar provisionResult;\\n\\n\\nif (requestId && requestId != null) {\\n    var requestBody = {\\n        \\\"payload\\\": {\\n            \\\"requestId\\\": requestId\\n        },\\n        \\\"action\\\": 1\\n    }\\n\\n    try {\\n        provisionResult = openidm.create(\\\"endpoint\/LIB-WorkflowAPI\\\", null, requestBody)\\n        logger.error(\\\"kyid workflow provision result: \\\" + provisionResult)\\n    } catch (e) {\\n        failureReason = \\\"kyid-workflow error: \\\" + e;\\n    }\\n}\\n\\n\\nexecution.setVariable(\\\"failureReason\\\", failureReason);\"}},{\"name\":\"scriptTask-a693f3a33d93\",\"displayName\":\"Reject Request\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-34047e616c13\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\nlogger.error(\\\"kyid-workflow rejection for request with id: \\\" + requestId);\\n\\nvar failureReason = null;\\nvar requestObj = null;\\nvar rejectionResult;\\n\\n\\nif (requestId && requestId != null) {\\n    var requestBody = {\\n        \\\"payload\\\": {\\n            \\\"requestId\\\": requestId\\n        },\\n        \\\"action\\\": 2\\n    }\\n\\n    try {\\n        rejectionResult = openidm.create(\\\"endpoint\/LIB-WorkflowAPI\\\", null, requestBody)\\n        logger.error(\\\"kyid workflow rejection result: \\\" + rejectionResult)\\n    } catch (e) {\\n        failureReason = \\\"kyid-workflow error: \\\" + e;\\n    }\\n}\"}},{\"name\":\"scriptTask-74c5710a88c8\",\"displayName\":\"Error Handle\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\nlogger.info(\\\"kyid-workflow error handling for request with id: \\\" + requestId);\\n\\nvar failureReason = \\\"Error encountered during workflow processing\\\";\\n\\nvar decision = {'outcome': 'cancelled', 'status': 'cancelled', 'comment': failureReason, 'failure': true, 'decision': 'rejected'};\\n\\nvar queryParams = {\\n    '_action': 'update'\\n};\\nvar result = openidm.action('iga\/governance\/requests\/' + requestId, 'POST', decision, queryParams);\\nlogger.info(\\\"kyid-workflow request error status update result: \\\" + result);\"}},{\"name\":\"exclusiveGateway-7f1777e228ba\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-ef98df825107\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"exclusiveGateway-34047e616c13\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-37be22411bf7\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"scriptTask-ef98df825107\",\"displayName\":\"Send Approval Notice Email\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"kyid-workflow send request approval email\\\");\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\n\/\/ Read event user information from request object\\ntry {\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;\\n  var  requestBody = {}\\n  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName\\n  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn\\n  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName \\n  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   \\n  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail\\n  const now = new Date();\\n  const timestamp = epochToCustomDate(now)\\n  requestBody.timeStamp = timestamp.replace(\\\" UTC\\\", \\\"\\\");\\n  var body = {\\n    subject: \\\"Request Approved\\\" ,\\n    to: requesterEmail,\\n    \/\/ body: \\\"Request with ID \\\" + requestId + \\\" has been approved.\\\",\\n    templateName: \\\"kyidRequestApproved\\\",\\n    object: requestBody\\n  };\\n  \/\/ \/\/ if (userObj && userObj.manager && userObj.manager.mail) {\\n  \/\/ \/\/   body.cc = userObj.manager.mail\\n  \/\/ \/\/ };\\n  openidm.action(\\\"external\/email\\\", \\\"sendTemplate\\\", body);\\n}\\ncatch (e) {\\n  logger.info(\\\"Unable to send approval notification email\\\");\\n}\\nfunction epochToCustomDate(epoch) {\\n    let date = new Date(epoch);\\n    return date.toLocaleString('en-US', {\\n        year: 'numeric',\\n        month: 'long',\\n        day: 'numeric',\\n        hour: '2-digit',\\n        minute: '2-digit',\\n        second: '2-digit'\\n    });\\n}\"}},{\"name\":\"scriptTask-37be22411bf7\",\"displayName\":\"Send Reject Notification Email\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"kyid-workflow send request rejection email\\\");\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\n\/\/ Read event user information from request object\\ntry {\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;\\n  var  requestBody = {}\\n  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName\\n  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn\\n  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName \\n  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   \\n  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail\\n  const now = new Date();\\n  const timestamp = epochToCustomDate(now)\\n  requestBody.timeStamp = timestamp.replace(\\\" UTC\\\", \\\"\\\");\\n  var body = {\\n    subject: \\\"Request Rejected\\\" ,\\n    to: requesterEmail,\\n    \/\/ body: \\\"Request with ID \\\" + requestId + \\\" has been rejected.\\\",\\n    templateName: \\\"kyidRequestRejected\\\",\\n    object: requestBody\\n  };\\n  openidm.action(\\\"external\/email\\\", \\\"sendTemplate\\\", body);\\n}\\ncatch (e) {\\n  logger.info(\\\"Unable to send rejection notification email\\\");\\n}\\nfunction epochToCustomDate(epoch) {\\n    let date = new Date(epoch);\\n    return date.toLocaleString('en-US', {\\n        year: 'numeric',\\n        month: 'long',\\n        day: 'numeric',\\n        hour: '2-digit',\\n        minute: '2-digit',\\n        second: '2-digit'\\n    });\\n}\"}},{\"name\":\"scriptTask-ba0f2a0ca56e\",\"displayName\":\"Check Level 1 Expiration or Rejection\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-19779330b754\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar requestObj = null;\\n\\n\\nlogger.info(\\\"kyid-workflow check level 1 expiration or rejection:  \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n\\n} catch (e) {\\n    logger.info(\\\"kyid-workflow check level 1 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\\nif (requestObj) {\\n    try {\\n        var id = requestObj.decision.phases[0].completedBy.id;\\n        logger.error(\\\"kyid-workflow completedBy id for level 1 approval is: \\\" + id);\\n\\n        if (id == \\\"SYSTEM\\\"){\\n        \/\/if (id == \\\"managed\/user\/64173419-0d40-4ba5-b71d-b5c55dd2cb72\\\") {\\n            execution.setVariable(\\\"requestExpired\\\", true);\\n        } else {\\n            execution.setVariable(\\\"requestExpired\\\", false);\\n        }\\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n        execution.setVariable(\\\"requestExpired\\\", false);\\n    }\\n} else {\\n    logger.info(\\\"kyid-workflow check level 1 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\"}},{\"name\":\"exclusiveGateway-19779330b754\",\"displayName\":\"Check Expiration Condition\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"requestExpired == true\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-f8efad8a4d2e\"},{\"condition\":\"requestExpired == false\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-ab1048cb15af\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"approvalTask-ca89c676a630\",\"displayName\":\"Level 1 Backup Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"scriptTask-05efed9a34f3\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-a693f3a33d93\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"scriptTask-f289b027502f\",\"displayName\":\"Approval Comments\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"scriptTask-05efed9a34f3\"}],\"language\":\"javascript\",\"script\":\"\/*\\nScript nodes are used to invoke APIs or execute business logic.\\nYou can invoke governance APIs or IDM APIs.\\nSee https:\/\/backstage.forgerock.com\/docs\/idcloud\/latest\/identity-governance\/administration\/workflow-configure.html for more details.\\n\\nScript nodes should return a single value and should have the\\nlogic enclosed in a try-catch block.\\n\\nExample:\\ntry {\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n  applicationId = requestObj.application.id;\\n}\\ncatch (e) {\\n  failureReason = 'Validation failed: Error reading request with id ' + requestId;\\n}\\n*\/\\nlogger.error(\\\"Q adding approval msg before level 1 approval\\\");\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nlogger.info(\\\"Add Level 1 approval comment for request: \\\" + requestId);\\n\\nvar requestObj;\\n\\ntry {\\n    \/\/ Get the latest request object\\n    requestObj = openidm.action(\\n        'iga\/governance\/requests\/' + requestId,\\n        'GET',\\n        {},\\n        {}\\n    );\\n} catch (e) {\\n    logger.error(\\\"Failed to read request \\\" + requestId + \\\" for approval comment: \\\" + e);\\n    \\\"error\\\";\\n}\\n\\n\/\/ Basic safety checks\\nif (!requestObj || !requestObj.decision || !requestObj.decision.phases || !requestObj.decision.phases[0]) {\\n    logger.error(\\\"No decision phase found for request \\\" + requestId + \\\", no approval comment added.\\\");\\n    \\\"no-phase\\\";\\n}\\n\\n\/\/ Assume Level 1 Approval is phases[0]\\nvar phase = requestObj.decision.phases[0];\\n\\n\/\/ Only proceed if this phase is completed and has completedBy\\nif (phase.status !== \\\"complete\\\" || !phase.completedBy) {\\n    logger.error(\\\"Level 1 Approval not completed or no completedBy for request \\\" + requestId + \\\", no comment added.\\\");\\n    \\\"no-approver\\\";\\n}\\n\\nvar cb = phase.completedBy;\\n\\n\/\/ Build a simple display string\\nvar name;\\nif (cb.givenName && cb.sn) {\\n    name = cb.givenName + \\\" \\\" + cb.sn;\\n} else {\\n    name = cb.userName || cb.id || \\\"unknown\\\";\\n}\\n\\nvar email = cb.mail;\\nvar approverText = email ? (name + \\\" (\\\" + email + \\\")\\\") : name;\\n\\nvar commentText = \\\"Request approved by \\\" + approverText + \\\".\\\";\\n\\ntry {\\n    openidm.action(\\n        'iga\/governance\/requests\/' + requestId,\\n        'POST',\\n        { comment: commentText },\\n        { _action: 'update' }\\n    );\\n    logger.info(\\\"Approval comment added for request \\\" + requestId + \\\": \\\" + commentText);\\n    \\\"success\\\";\\n} catch (e) {\\n    logger.error(\\\"Failed to add approval comment for request \\\" + requestId + \\\": \\\" + e);\\n    \\\"error\\\";\\n}\\n\"}},{\"name\":\"scriptTask-f8efad8a4d2e\",\"displayName\":\"Expiration Comments\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"approvalTask-ca89c676a630\"}],\"language\":\"javascript\",\"script\":\"\/*\\nScript nodes are used to invoke APIs or execute business logic.\\nYou can invoke governance APIs or IDM APIs.\\nSee https:\/\/backstage.forgerock.com\/docs\/idcloud\/latest\/identity-governance\/administration\/workflow-configure.html for more details.\\n\\nScript nodes should return a single value and should have the\\nlogic enclosed in a try-catch block.\\n\\nExample:\\ntry {\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n  applicationId = requestObj.application.id;\\n}\\ncatch (e) {\\n  failureReason = 'Validation failed: Error reading request with id ' + requestId;\\n}\\n*\/\\nlogger.error(\\\"Q adding msg for expiration\\\");\\n\\n\/\/ Script: Expiration Comments\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nlogger.info(\\\"Add Expiration comment for request: \\\" + requestId);\\n\\nif (!requestId) {\\n    logger.error(\\\"No requestId found in execution variables. No expiration comment added.\\\");\\n} else {\\n    var commentText = \\\"This request is expired.\\\";\\n\\n    try {\\n        openidm.action(\\n            \\\"iga\/governance\/requests\/\\\" + requestId,\\n            \\\"POST\\\",\\n            { comment: commentText },\\n            { _action: \\\"update\\\" }\\n        );\\n        logger.info(\\\"Expiration comment added for request \\\" + requestId + \\\": \\\" + commentText);\\n    } catch (e) {\\n        logger.error(\\\"Failed to add expiration comment for request \\\" + requestId + \\\": \\\" + e);\\n    }\\n}\\n\\n\/\/ end\\n\"}},{\"name\":\"scriptTask-ab1048cb15af\",\"displayName\":\"Rejection Comments\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"scriptTask-a693f3a33d93\"}],\"language\":\"javascript\",\"script\":\"\/\/ Script: Add \\\"rejected by\\\" comment after Level 1 Approval (Reject path)\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nlogger.info(\\\"Add Level 1 Rejection comment for request: \\\" + requestId);\\n\\nvar requestObj;\\n\\ntry {\\n    requestObj = openidm.action(\\n        \\\"iga\/governance\/requests\/\\\" + requestId,\\n        \\\"GET\\\",\\n        {},\\n        {}\\n    );\\n} catch (e) {\\n    logger.error(\\\"Failed to read request \\\" + requestId + \\\" for rejection comment: \\\" + e);\\n}\\n\\n\/\/ If we couldn't load or don't have phases, stop quietly\\nif (!requestObj || !requestObj.decision || !requestObj.decision.phases) {\\n    logger.error(\\\"No decision phases found for request \\\" + requestId + \\\". No rejection comment added.\\\");\\n} else {\\n    var phases = requestObj.decision.phases;\\n    var phase = null;\\n    var cb = null;\\n\\n    \/\/ Find the Level 1 Approval phase that is completed with a reject decision\\n    for (var i = 0; i < phases.length; i++) {\\n        var p = phases[i];\\n\\n        var isLevel1 = (p.displayName === \\\"Level 1 Approval\\\");\\n\\n        if (isLevel1 &&\\n            p.status === \\\"complete\\\" &&\\n            (p.decision === \\\"reject\\\" || p.decision === \\\"rejected\\\" || p.decision === \\\"deny\\\") &&\\n            p.completedBy) {\\n\\n            phase = p;\\n            cb = p.completedBy;\\n            break;\\n        }\\n    }\\n\\n    if (cb) {\\n        \/\/ Build \\\"Name (email)\\\" same as approve node\\n        var name;\\n        if (cb.givenName && cb.sn) {\\n            name = cb.givenName + \\\" \\\" + cb.sn;\\n        } else {\\n            name = cb.userName || cb.id || \\\"unknown\\\";\\n        }\\n\\n        var email = cb.mail;\\n        var approverText = email ? (name + \\\" (\\\" + email + \\\")\\\") : name;\\n\\n        var commentText = \\\"Request rejected by \\\" + approverText + \\\".\\\";\\n\\n        try {\\n            openidm.action(\\n                \\\"iga\/governance\/requests\/\\\" + requestId,\\n                \\\"POST\\\",\\n                { comment: commentText },\\n                { _action: \\\"update\\\" }\\n            );\\n            logger.info(\\\"Rejection comment added for request \\\" + requestId + \\\": \\\" + commentText);\\n        } catch (e) {\\n            logger.error(\\\"Failed to add rejection comment for request \\\" + requestId + \\\": \\\" + e);\\n        }\\n    } else {\\n        logger.error(\\\"No completed Level 1 rejection phase \/ completedBy found for request \\\"\\n            + requestId + \\\". No rejection comment added.\\\");\\n    }\\n}\\n\\n\/\/ end of script\\n\"}}],\"staticNodes\":{\"endNode\":{\"x\":2778,\"y\":225.5,\"id\":\"endNode\",\"name\":\"End\",\"nodeType\":\"SingleInput\",\"displayType\":\"SingleInput\",\"isDroppable\":false,\"isDeleteable\":false,\"isEditable\":false,\"isHovered\":false,\"hasError\":false,\"displayDetails\":{\"icon\":\"checkmark\",\"variant\":\"success\",\"value\":\"Success\"},\"_outcomes\":[],\"template\":null,\"schema\":null,\"connections\":{}},\"startNode\":{\"x\":70,\"y\":225.5,\"id\":\"startNode\",\"name\":\"Start\",\"nodeType\":\"IconOutcomeNode\",\"displayType\":\"IconOutcomeNode\",\"isDroppable\":false,\"isDeleteable\":false,\"isEditable\":false,\"isHovered\":false,\"hasError\":false,\"displayDetails\":{\"icon\":\"play_arrow\",\"variant\":\"info\",\"value\":\"Start\"},\"_outcomes\":[{\"id\":\"start\",\"displayName\":\"start\"}],\"template\":null,\"schema\":null,\"connections\":{\"start\":\"scriptTask-70b2da1a0483\"}},\"uiConfig\":{\"scriptTask-70b2da1a0483\":{\"x\":210,\"y\":227},\"approvalTask-95a73e18cff6\":{\"x\":719,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\",\"escalationDate\":1}},\"exclusiveGateway-63953f0126f4\":{\"x\":440,\"y\":200.5},\"scriptTask-05efed9a34f3\":{\"x\":1932,\"y\":129},\"scriptTask-a693f3a33d93\":{\"x\":1775,\"y\":545.5},\"scriptTask-74c5710a88c8\":{\"x\":2458,\"y\":374},\"exclusiveGateway-7f1777e228ba\":{\"x\":2179,\"y\":93.66666666666667},\"exclusiveGateway-34047e616c13\":{\"x\":2179,\"y\":286.8333333333333},\"scriptTask-ef98df825107\":{\"x\":2458,\"y\":79},\"scriptTask-37be22411bf7\":{\"x\":2456,\"y\":227},\"scriptTask-ba0f2a0ca56e\":{\"x\":840,\"y\":449},\"exclusiveGateway-19779330b754\":{\"x\":1184,\"y\":196.5},\"approvalTask-ca89c676a630\":{\"x\":1596,\"y\":283.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\",\"escalationDate\":1}},\"scriptTask-f289b027502f\":{\"x\":943,\"y\":34.015625},\"scriptTask-f8efad8a4d2e\":{\"x\":1507,\"y\":188.015625},\"scriptTask-ab1048cb15af\":{\"x\":1273,\"y\":483.015625}}},\"status\":\"published\",\"mutable\":true}";
            }           
           
        }
        else{  
            if (levelTwoApprovers && levelTwoApprovers != null) {
                var workflowPayloadJson = "{\"id\":\"templateWorkflow\",\"name\":\"templateWorkflow\",\"displayName\":\"templateWorkflow\",\"description\":\"templateWorkflow\",\"childType\":false,\"_rev\":0,\"steps\":[{\"name\":\"scriptTask-70b2da1a0483\",\"displayName\":\"Initialize\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-63953f0126f4\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar failureReason = null;\\nvar request = null;\\n\\nvar requestObj = null;\\nvar userPrerequisite = null\\nvar requestType = null;\\n\\nlogger.info(\\\"kyid-workflow starting workflow with request id: \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n    requestType = requestObj.requestType;\\n\\n    userPrerequisite = openidm.read('managed\/alpha_kyid_enrollment_user_prerequisites\/' + requestObj.request.custom.userPrerequisiteId, null, [ '*' ]);\\n    logger.info(\\\"kyid-workflow userPrerequisite: \\\" + userPrerequisite);\\n\\n} catch (e) {\\n    failureReason = \\\"kyid-workflow error: \\\" + e;\\n}\\n\\n\\n\\nif (userPrerequisite && requestType) {\\n    try {\\n        openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [\\n            {\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/status\\\",\\\"value\\\":\\\"PENDING_APPROVAL\\\"},{\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/pingApprovalWorkflowId\\\",\\\"value\\\":requestId}\\n        ]);\\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n    }\\n} else {\\n    failureReason = \\\"kyid-workflow error: User Prerequisite or Request Type not found\\\";\\n}\\n\\nexecution.setVariable(\\\"failureReason\\\", failureReason);\\n\"}},{\"name\":\"approvalTask-95a73e18cff6\",\"displayName\":\"Level 1 Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"approvalTask-27b7f3b9d10e\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-ba0f2a0ca56e\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"exclusiveGateway-63953f0126f4\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"approvalTask-95a73e18cff6\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"approvalTask-27b7f3b9d10e\",\"displayName\":\"Level 2 Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"scriptTask-05efed9a34f3\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-302a3b749c83\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"scriptTask-05efed9a34f3\",\"displayName\":\"Provisioning\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-7f1777e228ba\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\/\/logger.info(\\\"kyid-workflow provisioning for request with id: \\\" + requestId);\\nlogger.error(\\\"kyid-workflow provisioning for request with id: \\\" + requestId);\\nvar koCredsAPI = identityServer.getProperty(\\\"esv.addremoveusercredential.api\\\")\\nlogger.error(\\\"Value of creds url is - \\\"+ koCredsAPI)\\nvar kogCredsAPIScope = identityServer.getProperty(\\\"esv.addremoveusercredential.api.scope\\\")\\nlogger.error(\\\"Value of creds scope is - \\\"+ kogCredsAPIScope)\\nvar koOrgAPI = identityServer.getProperty(\\\"esv.addremoveuseronboarding.api\\\")\\nlogger.error(\\\"Value of org url is - \\\"+ koOrgAPI)\\nvar kogOrgAPIScope = identityServer.getProperty(\\\"esv.addremoveuseronboarding.api.scope\\\")\\nlogger.error(\\\"Value of org scope is - \\\"+ kogOrgAPIScope)\\n\\nvar failureReason = null;\\nvar requestObj = null;\\nvar shouldPatchUserPrerequisite = false;\\n\\nfunction getExpiryDate(option, value) {\\n    try {\\n        option = Number(option)\\n        const currentTimeinEpoch = Date.now(); \/\/ Current time in milliseconds (epoch)\\n        const currentDate = new Date().toISOString(); \/\/ Current date in ISO format (e.g., \\\"2025-07-15T15:12:34.567Z\\\")\\n        const currentDateObject = new Date(currentDate); \/\/ Convert the ISO string into a Date object\\n\\n        let expiryDate;\\n\\n        switch (option) {\\n            case 0: \/\/ Daily\\n                \/\/ getExpiryDate(0, null);\\n                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000); \/\/ Add one day (24 hours) to the current time\\n                break;\\n            case 1: \/\/ Weekly\\n                \/\/ getExpiryDate(1, null);\\n                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000); \/\/ Add one week (7 days)\\n                break;\\n            case 2: \/\/ Monthly\\n                \/\/ getExpiryDate(2, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 1) \/\/ Add one month to the current date\\n                break;\\n            case 3: \/\/ Quarterly\\n                \/\/ getExpiryDate(3, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 3); \/\/ Add 3 months to the current date\\n                break;\\n            case 4: \/\/ Semi-Annually\\n                \/\/ getExpiryDate(4, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 6); \/\/ Add 6 months to the current date\\n                break;\\n            case 5: \/\/ Annually\\n                \/\/ getExpiryDate(5, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setFullYear(currentDateObject.getFullYear() + 1); \/\/ Add 1 year to the current date\\n                break;\\n            case 6: \/\/ On Specific Day and Month (not year)\\n                \/\/ getExpiryDate(6, \\\"12-25\\\");\\n                const [month, day] = value.split('-');\\n                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day); \/\/ Set to the specified day and month of the current year\\n                if (expiryDate < currentDateObject) {\\n                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1); \/\/ If the date is already passed this year, set it to the next year\\n                }\\n                break;\\n            case 7: \/\/ Number of Days\\n                \/\/ getExpiryDate(7, 10);\\n                value = Number(value)\\n                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000); \/\/ Add 'value' days in milliseconds\\n                break;\\n            case 8: \/\/ On Specific Due Date\\n                \/\/getExpiryDate(8, \\\"2025-12-31\\\");\\n                expiryDate = new Date(value); \/\/ Assuming 'value' is a string in the format \\\"YYYY-MM-DD\\\"\\n                break;\\n            default:\\n                failureReason = \\\"kyid-workflow error encountered while getExpiryDate: \\\" + error;\\n\\n        }\\n\\n        const expiryEpochMillis = new Date(expiryDate).getTime(); \/\/ Convert expiry date to epoch milliseconds\\n        expiryDate = expiryDate.toISOString();\\n        return {\\n            expiryEpoch: expiryEpochMillis,\\n            expiryDate: expiryDate\\n        };\\n\\n    } catch (error) {\\n        logger.error(\\\"Error Occurred While getExpiryDate \\\" + error)\\n        failureReason = \\\"kyid-workflow error encountered while getExpiryDate: \\\" + error;\\n    }\\n\\n}\\n\\nfunction invokeKOGCredentialsAPI(payload) {\\n    logger.error(\\\"kyid-workflow Inside invokeKOGCredentialsAPI\\\")\\n    let funcName = \\\"invokeKOGCredentialsAPI\\\"\\n    let responseKOGCredentialsAPI = null\\n    let retryCountForKOG = 0\\n    let shouldRetryForKOG = true\\n    let requestBody = {\\n        url: koCredsAPI,\\n        scope: kogCredsAPIScope,\\n        \/\/url: \\\"https:\/\/dev.sih.ngateway.ky.gov\/ide3\/kyidapi\/V1\/addremoveusercredential\\\",\\n        \/\/scope: \\\"kogkyidapi.addremoveusercredential\\\",\\n        method: \\\"POST\\\",\\n        payload: payload\\n    }\\n    let apiResult = {\\n        apiStatus: null,\\n        ResponseStatus: null,\\n        MessageResponses: null\\n    }\\n\\n    try {\\n        logger.error(\\\"kyid-workflow Request Body for invokeKOGCredentialsAPI is - \\\" + JSON.stringify(requestBody))\\n        while (shouldRetryForKOG && retryCountForKOG < 3) {\\n            try {\\n                responseKOGCredentialsAPI = openidm.create(\\\"endpoint\/invokeCertAPI\\\", null, requestBody)\\n                shouldRetryForKOG = false\\n            }\\n            catch (error) {\\n                logger.error(\\\"Exception in \\\" + funcName + \\\" is - \\\" + error)\\n                retryCountForKOG++;\\n                logger.error(\\\"Retry count of invokeKOGCredentialsAPI is: \\\" + retryCountForKOG);\\n                if (retryCountForKOG == 3) {    \\n                    logger.error(\\\"kyid-workflow Exception is - \\\" + error)\\n                    failureReason = \\\"kyid-workflow error encountered while invokeKOGCredentialsAPI: \\\" + error;\\n                }\\n            }\\n        }\\n        logger.error(\\\"kyid-workflow responseKOGCredentialsAPI in invokeKOGCredentialsAPI is - \\\" + JSON.stringify(responseKOGCredentialsAPI))\\n        if (responseKOGCredentialsAPI != null && responseKOGCredentialsAPI) {\\n            if (responseKOGCredentialsAPI.response.ResponseStatus==0) {\\n                apiResult.ResponseStatus = 0\\n                apiResult.apiStatus = 200\\n            } else {\\n            apiResult.ResponseStatus = responseKOGCredentialsAPI.response.ResponseStatus\\n            apiResult.MessageResponses = responseKOGCredentialsAPI.response.MessageResponses\\n            apiResult.apiStatus = 400\\n            }\\n        }\\n\\n        logger.error(\\\"apiResult in invokeKOGCredentialsAPI is - \\\"+JSON.stringify(apiResult))\\n        return apiResult\\n\\n    } catch (error) {\\n        \/\/Return error response\\n        logger.error(\\\"kyid-workflow Exception is - \\\" + error)\\n        failureReason = \\\"kyid-workflow error encountered while invokeKOGCredentialsAPI: \\\" + error;\\n    }\\n}\\n\\nfunction invokeUserOnboardingAPI(payload) {\\n    logger.error(\\\"kyid-workflow Inside invokeUserOnboardingAPI\\\");\\n    let funcName = \\\"invokeUserOnboardingAPI\\\";\\n    let responseUserOnboardingAPI = null;\\n    let retryCountForOnboarding = 0\\n    let shouldRetryForOnboarding = true\\n    let requestBody = {\\n        url: koOrgAPI,\\n        scope: kogOrgAPIScope,\\n        method: \\\"POST\\\",\\n        payload: payload\\n    }\\n    let apiResult = {\\n        apiStatus: null,\\n        ResponseStatus: null,\\n        MessageResponses: null\\n    }\\n\\n    try {\\n        logger.error(\\\"kyid-workflow Request Body for invokeUserOnboardingAPI is - \\\" + JSON.stringify(requestBody))\\n        while (shouldRetryForOnboarding && retryCountForOnboarding < 3) {\\n            try {\\n                responseUserOnboardingAPI = openidm.create(\\\"endpoint\/invokeCertAPI\\\", null, requestBody)\\n                shouldRetryForOnboarding = false\\n            }\\n            catch (error) {\\n                logger.error(\\\"Exception in \\\" + funcName + \\\" is - \\\" + error)\\n                retryCountForOnboarding++;\\n                logger.error(\\\"Retry count of invokeUserOnboardingAPI is: \\\" + retryCountForOnboarding);\\n                if (retryCountForOnboarding == 3) {\\n                    logger.error(\\\"kyid-workflow Exception is - \\\" + error)\\n                    failureReason = \\\"kyid-workflow error encountered while invokeUserOnboardingAPI: \\\" + error;\\n                }\\n            }\\n        }       \\n        logger.error(\\\"kyid-workflow responseUserOnboardingAPI in invokeUserOnboardingAPI is - \\\" + JSON.stringify(responseUserOnboardingAPI))\\n        if (responseUserOnboardingAPI != null && responseUserOnboardingAPI) {\\n            if (responseUserOnboardingAPI.response.ResponseStatus == 0) {\\n                apiResult.ResponseStatus = 0\\n                apiResult.apiStatus = 200\\n            } else {\\n                apiResult.ResponseStatus = responseUserOnboardingAPI.response.ResponseStatus\\n                apiResult.MessageResponses = responseUserOnboardingAPI.response.MessageResponses\\n                apiResult.apiStatus = 400\\n            }\\n        }\\n        return apiResult\\n\\n    } catch (error) {\\n        \/\/Return error response\\n        logger.error(\\\"kyid-workflow Exception is - \\\" + error)\\n        failureReason = \\\"kyid-workflow error encountered while invokeUserOnboardingAPI: \\\" + error;\\n    }\\n}\\n\\n\\nfunction getPrerequisites(apiRequestPayload) {\\n    try {\\n        let isPendingPrereq = true;\\n        logger.error(\\\"apiRequestPayload.requestedUserAccountId --> \\\" + apiRequestPayload.requestedUserAccountId)\\n        logger.error(\\\"apiRequestPayload.enrollmentRequestId -->\\\" + apiRequestPayload.enrollmentRequestId)\\n        let completedCounter = 0;\\n        const response = openidm.query(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\", {\\n            \\\"_queryFilter\\\": '\/enrollmentRequestId\/ eq \\\"' +\\n                apiRequestPayload.enrollmentRequestId + '\\\"' +  ' AND (recordState eq \\\"ACTIVE\\\" OR recordState eq \\\"0\\\")' + ' AND requestedUserAccountId eq \\\"' + apiRequestPayload.requestedUserAccountId + '\\\"'\\n        }, [\\\"status\\\", \\\"displayOrder\\\", \\\"preRequisiteType\\\", \\\"preRequisiteTypeId\/_id\\\", \\\"preRequisiteTypeId\/typeName\\\", \\\"preRequisiteId\/displayName\\\", \\\"preRequisiteId\/displayDescription\\\"])\\n\\n        logger.error(\\\"Get Prereq Summary Response is --> \\\" + response)\\n        if (response != null && response.resultCount > 0) {\\n            for (let i = 0; i < response.resultCount; i++) {\\n                if (response.result[i].status === \\\"COMPLETED\\\" || response.result[i].status === \\\"ALREADY_COMPLETED\\\") {\\n                    completedCounter++\\n                }\\n            }\\n            if (completedCounter === response.resultCount) {\\n                isPendingPrereq = false\\n            }\\n            return isPendingPrereq\\n        }\\n        else {\\n            logger.error(\\\"User Prereq Not Found\\\")\\n            return null\\n        }\\n    }\\n    catch (error) {\\n        logger.error(\\\"Error Occurred while fetching pending prerequsites\\\" + error)\\n        return { code: 400, message: \\\"Error Occurred while Prereq Summary \\\" + error.message }\\n    }\\n\\n}\\n\\n\\nfunction saveUserPrerequisiteValues(requestObj) {\\n    var userPrerequisite = openidm.read('managed\/alpha_kyid_enrollment_user_prerequisites\/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);\\n    logger.error(\\\"userPrerequisite response - \\\"+JSON.stringify(userPrerequisite))\\n    var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;\\n    var enrollmentRequestId = userPrerequisite.enrollmentRequestId;\\n    var requestedUserAccountId = userPrerequisite.requestedUserAccountId;\\n    var prerequisite = openidm.read('managed\/alpha_kyid_enrollment_prerequisite\/' + prerequisiteId, null, ['*']);\\n    \/\/logger.info(\\\"kyid-workflow prerequisite: \\\" + prerequisite);\\n    logger.error(\\\"kyid-workflow prerequisite: \\\" + prerequisite);\\n\\n    var enrollmentActionSettings = prerequisite.enrollmentActionSettings;\\n    \/\/logger.info(\\\"kyid-workflow enrollmentActionSettings: \\\" + enrollmentActionSettings);\\n    logger.error(\\\"kyid-workflow enrollmentActionSettings: \\\" + enrollmentActionSettings);\\n\\n    var expiryDateObject = prerequisite.expiry;\\n    \/\/  logger.info(\\\"kyid-workflow expiryDateObject: \\\" + JSON.stringify(expiryDateObject));\\n    logger.error(\\\"kyid-workflow expiryDateObject: \\\" + JSON.stringify(expiryDateObject));\\n\\n    var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);\\n    \/\/logger.info(\\\"kyid-workflow calculated expiry: \\\" + JSON.stringify(calculatedExpiryDate));\\n    logger.error(\\\"kyid-workflow calculated expiry: \\\" + JSON.stringify(calculatedExpiryDate));\\n\\n    var saveInput = enrollmentActionSettings.saveInput;\\n    \/\/logger.info(\\\"kyid-workflow saveInput: \\\" + saveInput);\\n    logger.error(\\\"kyid-workflow saveInput: \\\" + saveInput);\\n\\n    if (saveInput) \\n    {\\n        logger.error(\\\"kyid-workflow request custom propery - payload: \\\" + requestObj.request.custom.payload);\\n        var responseKOGCredentialsAPI = invokeKOGCredentialsAPI(requestObj.request.custom.payload);\\n        logger.error(\\\"kyid-workflow responseKOGCredentialsAPI: \\\" + JSON.stringify(responseKOGCredentialsAPI));\\n        if (responseKOGCredentialsAPI.apiStatus == 200) {\\n            if (responseKOGCredentialsAPI.ResponseStatus == 0) \\n            {\\n                try {\\n                    logger.error(\\\"kyid-workflow Patch UserPrerequisite\\\");\\n                    if (requestObj.request.custom.page.values && requestObj.request.custom.page.values != null){\\n                        var fieldValuesJson = JSON.parse(requestObj.request.custom.page.values);\\n                        logger.info(\\\"kyid-workflow fieldValuesJson: \\\" + JSON.stringify(fieldValuesJson));\\n\\n                        var result = openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [{\\n                            \\\"operation\\\": \\\"replace\\\",\\n                            \\\"field\\\": \\\"\/prerequisiteValues\\\",\\n                            \\\"value\\\": fieldValuesJson\\n                        }]);\\n                        logger.info(\\\"kyid-workflow patch result: \\\" + result);\\n                    }\\n\\n                    shouldPatchUserPrerequisite = true;\\n                    \\n\\n                } catch (error) {\\n                    logger.error(\\\"kyid-workflow error encountered during patching user prerequisite: \\\" + error);\\n                    failureReason = \\\"kyid-workflow error encountered during patching user prerequisite: \\\" + error;\\n                }\\n            } \\n            else \\n            {\\n                logger.error(\\\"kyid-workflow error encountered during patching user prerequisite: \\\" + responseKOGCredentialsAPI.MessageResponses);\\n                failureReason = \\\"kyid-workflow Error getting Credentials API payload\\\";\\n            }\\n        } \\n        else \\n        {\\n            logger.error(\\\"kyid-workflow Error getting Credentials API payload\\\");\\n            failureReason = \\\"kyid-workflow Error getting Credentials API payload\\\";\\n        }\\n\\n    }\\n     else {\\n        logger.error(\\\"kyid-workflow request custom propery - payload: \\\" + requestObj.request.custom.payload);\\n        var responseUserOnboardingAPI = invokeUserOnboardingAPI(requestObj.request.custom.payload);\\n        logger.error(\\\"kyid-workflow responseUserOnboardingAPI: \\\" + JSON.stringify(responseUserOnboardingAPI)); \\n        \\n        if (responseUserOnboardingAPI.apiStatus == 200) {\\n             if (responseUserOnboardingAPI.ResponseStatus == 0) {\\n                logger.error(\\\"kyid-workflow invokeUserOnboardingAPI is success\\\");\\n                shouldPatchUserPrerequisite = true;\\n             } else {\\n                logger.error(\\\"kyid-workflow error encountered during patching user prerequisite: \\\" + responseUserOnboardingAPI.MessageResponses);\\n                failureReason = \\\"kyid-workflow error encountered during patching user prerequisite: \\\" + responseUserOnboardingAPI.MessageResponses;\\n             }\\n\\n        } else {\\n            logger.error(\\\"kyid-workflow Error getting user onboarding API payload\\\");\\n            failureReason = \\\"kyid-workflow Error getting user onboarding API payload\\\";\\n        }\\n    }\\n\\n    if (shouldPatchUserPrerequisite) {\\n        openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [{\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/status\\\",\\n                \\\"value\\\": \\\"COMPLETED\\\"\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/expiryDate\\\",\\n                \\\"value\\\": calculatedExpiryDate.expiryDate\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/expiryDateEpoch\\\",\\n                \\\"value\\\": Number(calculatedExpiryDate.expiryEpoch)\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/completionDate\\\",\\n                \\\"value\\\": new Date().toISOString()\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/completionDateEpoch\\\",\\n                \\\"value\\\": Number(Date.now())\\n            },\\n            {\\n                \\\"operation\\\": \\\"replace\\\",\\n                \\\"field\\\": \\\"\/pingApprovalWorkflowId\\\",\\n                \\\"value\\\": requestId\\n            }\\n        ]);\\n    }\\n\\n\\n    let apiRequestPayload = {\\n                    requestedUserAccountId: requestedUserAccountId,\\n                    enrollmentRequestId: enrollmentRequestId,\\n                    preReqId: null\\n                }\\n    logger.error(\\\"apiRequestPayload for getPrerequisites --> \\\" + JSON.stringify(apiRequestPayload))\\n    var isPendingPrereq = getPrerequisites(apiRequestPayload)\\n    logger.error(\\\"isPendingPrereq response --> \\\" + JSON.stringify(isPendingPrereq))\\n    if(isPendingPrereq == false)\\n    {\\n        let payload = {\\n            requestedUserAccountId: requestedUserAccountId,\\n            enrollmentRequestId: enrollmentRequestId\\n        }\\n        let requestBody = {\\n            action: \\\"1\\\",\\n            payload: payload\\n        }\\n        responseAccess = openidm.create(\\\"endpoint\/access\\\", null, requestBody)\\n        logger.error(\\\"provision access response  --> \\\" + JSON.stringify(responseAccess))\\n    } else {\\n        logger.error(\\\"No provision access  --> \\\")\\n        return null\\n    }\\n\\n}\\n\\n\\n\\n\\n\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n\/\/ Main\\n\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n} catch (e) {\\n    failureReason = \\\"kyid-workflow error: \\\" + e;\\n}\\n\\nif (requestObj && !failureReason) {\\n    logger.info(\\\"kyid-workflow inside requestObj\\\");\\n    try {\\n        \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n        \/\/ TBD, Logic to provisioning access to user \\n        \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n\\n    } catch (e) {\\n        var err = e.javaException;\\n        failureReason = \\\"kyid-workflow provisioning failed:  \\\" + e;\\n    }\\n\\n    var decision = {\\n        'status': 'complete',\\n        'decision': 'approved'\\n    };\\n\\n    if (failureReason) {\\n        decision.outcome = 'not provisioned';\\n        decision.comment = failureReason;\\n        decision.failure = true;\\n    } else {\\n        decision.outcome = 'provisioned';\\n\\n        saveUserPrerequisiteValues(requestObj);\\n    }\\n\\n    var queryParams = {\\n        '_action': 'update'\\n    };\\n    openidm.action('iga\/governance\/requests\/' + requestId, 'POST', decision, queryParams);\\n    logger.info(\\\"Request \\\" + requestId + \\\" completed.\\\");\\n}\\n\\n\\nexecution.setVariable(\\\"failureReason\\\", failureReason);\"}},{\"name\":\"scriptTask-a693f3a33d93\",\"displayName\":\"Reject Request\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-34047e616c13\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\nlogger.error(\\\"kyid-workflow rejection for request with id: \\\" + requestId);\\n\\nvar failureReason = null;\\nvar requestObj = null;\\n\\nfunction getExpiryDate(option, value) {\\n    try {\\n        option = Number(option)\\n        const currentTimeinEpoch = Date.now(); \/\/ Current time in milliseconds (epoch)\\n        const currentDate = new Date().toISOString(); \/\/ Current date in ISO format (e.g., \\\"2025-07-15T15:12:34.567Z\\\")\\n        const currentDateObject = new Date(currentDate); \/\/ Convert the ISO string into a Date object\\n\\n        let expiryDate;\\n\\n        switch (option) {\\n            case 0: \/\/ Daily\\n                \/\/ getExpiryDate(0, null);\\n                expiryDate = new Date(currentTimeinEpoch + 24 * 60 * 60 * 1000); \/\/ Add one day (24 hours) to the current time\\n                break;\\n            case 1: \/\/ Weekly\\n                \/\/ getExpiryDate(1, null);\\n                expiryDate = new Date(currentTimeinEpoch + 7 * 24 * 60 * 60 * 1000); \/\/ Add one week (7 days)\\n                break;\\n            case 2: \/\/ Monthly\\n                \/\/ getExpiryDate(2, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 1) \/\/ Add one month to the current date\\n                break;\\n            case 3: \/\/ Quarterly\\n                \/\/ getExpiryDate(3, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 3); \/\/ Add 3 months to the current date\\n                break;\\n            case 4: \/\/ Semi-Annually\\n                \/\/ getExpiryDate(4, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setMonth(currentDateObject.getMonth() + 6); \/\/ Add 6 months to the current date\\n                break;\\n            case 5: \/\/ Annually\\n                \/\/ getExpiryDate(5, null);\\n                expiryDate = new Date(currentDateObject);\\n                expiryDate.setFullYear(currentDateObject.getFullYear() + 1); \/\/ Add 1 year to the current date\\n                break;\\n            case 6: \/\/ On Specific Day and Month (not year)\\n                \/\/ getExpiryDate(6, \\\"12-25\\\");\\n                const [month, day] = value.split('-');\\n                expiryDate = new Date(currentDateObject.getFullYear(), month - 1, day); \/\/ Set to the specified day and month of the current year\\n                if (expiryDate < currentDateObject) {\\n                    expiryDate.setFullYear(currentDateObject.getFullYear() + 1); \/\/ If the date is already passed this year, set it to the next year\\n                }\\n                break;\\n            case 7: \/\/ Number of Days\\n                \/\/ getExpiryDate(7, 10);\\n                value = Number(value)\\n                expiryDate = new Date(currentTimeinEpoch + value * 24 * 60 * 60 * 1000); \/\/ Add 'value' days in milliseconds\\n                break;\\n            case 8: \/\/ On Specific Due Date\\n                \/\/getExpiryDate(8, \\\"2025-12-31\\\");\\n                expiryDate = new Date(value); \/\/ Assuming 'value' is a string in the format \\\"YYYY-MM-DD\\\"\\n                break;\\n            default:\\n                return {\\n                    code: 400, message: \\\"Invalid Input\\\"\\n                }\\n        }\\n\\n        const expiryEpochMillis = new Date(expiryDate).getTime(); \/\/ Convert expiry date to epoch milliseconds\\n        expiryDate = expiryDate.toISOString();\\n        return {\\n            expiryEpoch: expiryEpochMillis,\\n            expiryDate: expiryDate\\n        };\\n\\n    } catch (error) {\\n        return {\\n            code: 400,\\n            message: \\\"Error Occurred While getExpiryDate \\\"\\n        }\\n        logger.error(\\\"Error Occurred While getExpiryDate \\\" + error)\\n    }\\n\\n}\\n\\n\\nfunction updatePrerequisite(requestObj) {\\n    var userPrerequisite = openidm.read('managed\/alpha_kyid_enrollment_user_prerequisites\/' + requestObj.request.custom.userPrerequisiteId, null, ['*']);\\n\\n    var prerequisiteId = userPrerequisite.preRequisiteId._refResourceId;\\n    var prerequisite = openidm.read('managed\/alpha_kyid_enrollment_prerequisite\/' + prerequisiteId, null, [ '*' ]);\\n    logger.info(\\\"kyid-workflow prerequisite: \\\" + prerequisite);\\n\\n    var enrollmentRequestId = userPrerequisite.enrollmentRequestId;\\n    var enrollmentRequest = openidm.read('managed\/alpha_kyid_enrollment_request\/' + enrollmentRequestId, null, ['*']);\\n    logger.error(\\\"kyid-workflow enrollmentRequest: \\\" + enrollmentRequest);\\n\\n    var enrollmentRequestResult = openidm.patch(\\\"managed\/alpha_kyid_enrollment_request\/\\\" + enrollmentRequestId, null, [{\\n        \\\"operation\\\": \\\"replace\\\",\\n        \\\"field\\\": \\\"\/status\\\",\\n        \\\"value\\\": \\\"REJECTED\\\"\\n    }]);\\n    logger.error(\\\"kyid-workflow reject status update result: \\\" + enrollmentRequestResult);\\n\\n    \/\/ var enrollmentActionSettings = prerequisite.enrollmentActionSettings;\\n    \/\/ logger.info(\\\"kyid-workflow enrollmentActionSettings: \\\" + enrollmentActionSettings);\\n\\n    var expiryDateObject = prerequisite.expiry;\\n    logger.error(\\\"kyid-workflow expiryDateObject: \\\" + JSON.stringify(expiryDateObject));\\n\\n    var calculatedExpiryDate = getExpiryDate(expiryDateObject.dueDateType, expiryDateObject.dueDateValue);\\n    logger.error(\\\"kyid-workflow calculated expiry: \\\" + JSON.stringify(calculatedExpiryDate));\\n\\n    \/\/ var saveInput = enrollmentActionSettings.saveInput;\\n    \/\/ logger.info(\\\"kyid-workflow saveInput: \\\" + saveInput);\\n\\n    \/\/ if (saveInput) {\\n    \/\/     var fieldValuesJson = JSON.parse(requestObj.request.custom.page.values);\\n    \/\/     logger.info(\\\"kyid-workflow fieldValuesJson: \\\" + JSON.stringify(fieldValuesJson));\\n    \/\/     var result = openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [\\n    \/\/         {\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/prerequisiteValues\\\",\\\"value\\\":fieldValuesJson} \\n    \/\/     ]);\\n    \/\/     logger.info(\\\"kyid-workflow patch result: \\\" + result);\\n    \/\/ }\\n\\n    var userPrerequisiteResult = openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [{\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/status\\\",\\n            \\\"value\\\": \\\"REJECTED\\\"\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/expiryDate\\\",\\n            \\\"value\\\": calculatedExpiryDate.expiryDate\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/expiryDateEpoch\\\",\\n            \\\"value\\\": Number(calculatedExpiryDate.expiryEpoch)\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/completionDate\\\",\\n            \\\"value\\\": new Date().toISOString()\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/completionDateEpoch\\\",\\n            \\\"value\\\": Number(Date.now())\\n        },\\n        {\\n            \\\"operation\\\": \\\"replace\\\",\\n            \\\"field\\\": \\\"\/pingApprovalWorkflowId\\\",\\n            \\\"value\\\": requestId\\n        }\\n    ]);\\n\\n    logger.error(\\\"kyid-workflow userPrerequisite patch result: \\\" + userPrerequisiteResult);\\n}\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n} catch (e) {\\n    failureReason = \\\"kyid-workflow error: \\\" + e;\\n}\\n\\nif (requestObj && !failureReason) {\\n    try {\\n        \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n        \/\/ TBD, Logic to provisioning access to user \\n        \/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\\n\\n    } catch (e) {\\n        var err = e.javaException;\\n        failureReason = \\\"kyid-workflow provisioning failed:  \\\" + e;\\n    }\\n\\n    var decision = {\\n        'status': 'complete',\\n        'decision': 'rejected'\\n    };\\n\\n    if (failureReason) {\\n        decision.outcome = 'not provisioned';\\n        decision.comment = failureReason;\\n        decision.failure = true;\\n    } else {\\n        decision.outcome = 'denied';\\n\\n\\n\\n        updatePrerequisite(requestObj);\\n    }\\n\\n    var queryParams = {\\n        '_action': 'update'\\n    };\\n    openidm.action('iga\/governance\/requests\/' + requestId, 'POST', decision, queryParams);\\n    logger.info(\\\"Request \\\" + requestId + \\\" completed.\\\");\\n}\"}},{\"name\":\"scriptTask-74c5710a88c8\",\"displayName\":\"Error Handle\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\nlogger.info(\\\"kyid-workflow error handling for request with id: \\\" + requestId);\\n\\nvar failureReason = \\\"Error encountered during workflow processing\\\";\\n\\nvar decision = {'outcome': 'cancelled', 'status': 'cancelled', 'comment': failureReason, 'failure': true, 'decision': 'rejected'};\\n\\nvar queryParams = {\\n    '_action': 'update'\\n};\\nvar result = openidm.action('iga\/governance\/requests\/' + requestId, 'POST', decision, queryParams);\\nlogger.info(\\\"kyid-workflow request error status update result: \\\" + result);\"}},{\"name\":\"exclusiveGateway-7f1777e228ba\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-ef98df825107\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"exclusiveGateway-34047e616c13\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-37be22411bf7\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"scriptTask-ef98df825107\",\"displayName\":\"Send Approval Notice Email\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"kyid-workflow send request approval email\\\");\\r\\n\\r\\nvar content = execution.getVariables();\\r\\nvar requestId = content.get('id');\\r\\n\\r\\n\/\/ Read event user information from request object\\r\\ntry {\\r\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\r\\n  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;\\r\\n  var  requestBody = {}\\r\\n  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName\\r\\n  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn\\r\\n  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName \\r\\n  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   \\r\\n  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail\\r\\n  const now = new Date();\\r\\n  const timestamp = epochToCustomDate(now)\\r\\n  requestBody.timeStamp = timestamp.replace(\\\" UTC\\\", \\\"\\\");\\r\\n  var body = {\\r\\n    subject: \\\"Request Approved\\\" ,\\r\\n    to: requesterEmail,\\r\\n    \/\/ body: \\\"Request with ID \\\" + requestId + \\\" has been approved.\\\",\\r\\n    templateName: \\\"kyidRequestApproved\\\",\\r\\n    object: requestBody\\r\\n  };\\r\\n  \/\/ \/\/ if (userObj && userObj.manager && userObj.manager.mail) {\\r\\n  \/\/ \/\/   body.cc = userObj.manager.mail\\r\\n  \/\/ \/\/ };\\r\\n  openidm.action(\\\"external\/email\\\", \\\"sendTemplate\\\", body);\\r\\n}\\r\\ncatch (e) {\\r\\n  logger.info(\\\"Unable to send approval notification email\\\");\\r\\n}\\r\\nfunction epochToCustomDate(epoch) {\\r\\n    let date = new Date(epoch);\\r\\n    return date.toLocaleString('en-US', {\\r\\n        year: 'numeric',\\r\\n        month: 'long',\\r\\n        day: 'numeric',\\r\\n        hour: '2-digit',\\r\\n        minute: '2-digit',\\r\\n        second: '2-digit'\\r\\n    });\\r\\n}\"}},{\"name\":\"scriptTask-37be22411bf7\",\"displayName\":\"Send Reject Notification Email\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"\\r\\n\\r\\nlogger.info(\\\"kyid-workflow send request rejection email\\\");\\r\\n\\r\\nvar content = execution.getVariables();\\r\\nvar requestId = content.get('id');\\r\\n\\r\\n\/\/ Read event user information from request object\\r\\ntry {\\r\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\r\\n  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;\\r\\n  var  requestBody = {}\\r\\n  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName\\r\\n  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn\\r\\n  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName \\r\\n  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   \\r\\n  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail\\r\\n  const now = new Date();\\r\\n  const timestamp = epochToCustomDate(now)\\r\\n  requestBody.timeStamp = timestamp.replace(\\\" UTC\\\", \\\"\\\");\\r\\n  var body = {\\r\\n    subject: \\\"Request Rejected\\\" ,\\r\\n    to: requesterEmail,\\r\\n    \/\/ body: \\\"Request with ID \\\" + requestId + \\\" has been rejected.\\\",\\r\\n    templateName: \\\"kyidRequestRejected\\\",\\r\\n    object: requestBody\\r\\n  };\\r\\n  openidm.action(\\\"external\/email\\\", \\\"sendTemplate\\\", body);\\r\\n}\\r\\ncatch (e) {\\r\\n  logger.info(\\\"Unable to send rejection notification email\\\");\\r\\n}\\r\\nfunction epochToCustomDate(epoch) {\\r\\n    let date = new Date(epoch);\\r\\n    return date.toLocaleString('en-US', {\\r\\n        year: 'numeric',\\r\\n        month: 'long',\\r\\n        day: 'numeric',\\r\\n        hour: '2-digit',\\r\\n        minute: '2-digit',\\r\\n        second: '2-digit'\\r\\n    });\\r\\n}\"}},{\"name\":\"scriptTask-ba0f2a0ca56e\",\"displayName\":\"Check Level 1 Expiration or Rejection\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-19779330b754\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar requestObj = null;\\n\\nlogger.info(\\\"kyid-workflow check level 1 expiration or rejection:  \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n\\n} catch (e) {\\n    logger.info(\\\"kyid-workflow check level 1 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\\nif (requestObj) {\\n    try {\\n        var id = requestObj.decision.phases[0].completedBy.id;\\n        logger.error(\\\"kyid-workflow completedBy id for level 1 approval is: \\\" + id);\\n\\n        if (id == \\\"SYSTEM\\\") {\\n            execution.setVariable(\\\"requestExpired\\\", true);\\n        } else {\\n            execution.setVariable(\\\"requestExpired\\\", false);\\n        }\\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n        execution.setVariable(\\\"requestExpired\\\", false);\\n    }\\n} else {\\n    logger.info(\\\"kyid-workflow check level 1 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\"}},{\"name\":\"exclusiveGateway-19779330b754\",\"displayName\":\"Check Expiration Condition\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"requestExpired == true\",\"outcome\":\"validationSuccess\",\"step\":\"approvalTask-ca89c676a630\"},{\"condition\":\"requestExpired == false\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-a693f3a33d93\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"approvalTask-ca89c676a630\",\"displayName\":\"Level 1 Backup Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"approvalTask-27b7f3b9d10e\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-a693f3a33d93\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"scriptTask-302a3b749c83\",\"displayName\":\"Check Level 2 Expiration or Rejection\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-514d593f4037\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar requestObj = null;\\n\\nlogger.info(\\\"kyid-workflow check level 2 expiration or rejection:  \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n\\n} catch (e) {\\n    logger.info(\\\"kyid-workflow check level 2 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\\nif (requestObj) {\\n    try {\\n        var id = requestObj.decision.phases[1].completedBy.id;\\n        logger.error(\\\"kyid-workflow completedBy id for level 2 approval is: \\\" + id);\\n\\n        if (id == \\\"SYSTEM\\\") {\\n            execution.setVariable(\\\"requestExpired\\\", true);\\n        } else {\\n            execution.setVariable(\\\"requestExpired\\\", false);\\n        }\\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n        execution.setVariable(\\\"requestExpired\\\", false);\\n    }\\n} else {\\n    logger.info(\\\"kyid-workflow check level 2 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\"}},{\"name\":\"exclusiveGateway-514d593f4037\",\"displayName\":\"Check Expiration Condition\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"requestExpired == true\",\"outcome\":\"validationSuccess\",\"step\":\"approvalTask-36de7246f5e0\"},{\"condition\":\"requestExpired == false\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-a693f3a33d93\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"approvalTask-36de7246f5e0\",\"displayName\":\"Level 2 Backup Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"scriptTask-05efed9a34f3\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-a693f3a33d93\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"}],\"staticNodes\":{\"endNode\":{\"x\":3990,\"y\":225.5,\"id\":\"endNode\",\"name\":\"End\",\"nodeType\":\"SingleInput\",\"displayType\":\"SingleInput\",\"isDroppable\":false,\"isDeleteable\":false,\"isEditable\":false,\"isHovered\":false,\"hasError\":false,\"displayDetails\":{\"icon\":\"checkmark\",\"variant\":\"success\",\"value\":\"Success\"},\"_outcomes\":[],\"template\":null,\"schema\":null,\"connections\":{}},\"startNode\":{\"x\":70,\"y\":225.5,\"id\":\"startNode\",\"name\":\"Start\",\"nodeType\":\"IconOutcomeNode\",\"displayType\":\"IconOutcomeNode\",\"isDroppable\":false,\"isDeleteable\":false,\"isEditable\":false,\"isHovered\":false,\"hasError\":false,\"displayDetails\":{\"icon\":\"play_arrow\",\"variant\":\"info\",\"value\":\"Start\"},\"_outcomes\":[{\"id\":\"start\",\"displayName\":\"start\"}],\"template\":null,\"schema\":null,\"connections\":{\"start\":\"scriptTask-70b2da1a0483\"}},\"uiConfig\":{\"scriptTask-70b2da1a0483\":{\"x\":210,\"y\":227},\"approvalTask-95a73e18cff6\":{\"x\":719,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\",\"escalationDate\":1}},\"exclusiveGateway-63953f0126f4\":{\"x\":440,\"y\":200.5},\"approvalTask-27b7f3b9d10e\":{\"x\":1931,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\",\"escalationDate\":1}},\"scriptTask-05efed9a34f3\":{\"x\":3143,\"y\":129},\"scriptTask-a693f3a33d93\":{\"x\":3143,\"y\":251.5},\"scriptTask-74c5710a88c8\":{\"x\":3670,\"y\":374},\"exclusiveGateway-7f1777e228ba\":{\"x\":3391,\"y\":93.66666666666667},\"exclusiveGateway-34047e616c13\":{\"x\":3391,\"y\":286.8333333333333},\"scriptTask-ef98df825107\":{\"x\":3670,\"y\":80},\"scriptTask-37be22411bf7\":{\"x\":3670,\"y\":227},\"scriptTask-ba0f2a0ca56e\":{\"x\":978,\"y\":227},\"exclusiveGateway-19779330b754\":{\"x\":1298,\"y\":200.5},\"approvalTask-ca89c676a630\":{\"x\":1618,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\"}},\"scriptTask-302a3b749c83\":{\"x\":2190,\"y\":227},\"exclusiveGateway-514d593f4037\":{\"x\":2510,\"y\":200.5},\"approvalTask-36de7246f5e0\":{\"x\":2830,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\"}}}},\"status\":\"draft\",\"mutable\":true}";
            } 
            else {
                var workflowPayloadJson = "{\"id\":\"templateWorkflow\",\"name\":\"templateWorkflow\",\"displayName\":\"templateWorkflow\",\"description\":\"templateWorkflow\",\"childType\":false,\"_rev\":1,\"steps\":[{\"name\":\"scriptTask-70b2da1a0483\",\"displayName\":\"Initialize\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-63953f0126f4\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar failureReason = null;\\nvar request = null;\\n\\nvar requestObj = null;\\nvar userPrerequisite = null\\nvar requestType = null;\\n\\nlogger.info(\\\"kyid-workflow starting workflow with request id: \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n    requestType = requestObj.requestType;\\n\\n    userPrerequisite = openidm.read('managed\/alpha_kyid_enrollment_user_prerequisites\/' + requestObj.request.custom.userPrerequisiteId, null, [ '*' ]);\\n    logger.info(\\\"kyid-workflow userPrerequisite: \\\" + userPrerequisite);\\n\\n} catch (e) {\\n    failureReason = \\\"kyid-workflow error: \\\" + e;\\n}\\n\\n\\n\\nif (userPrerequisite && requestType) {\\n    try {\\n        openidm.patch(\\\"managed\/alpha_kyid_enrollment_user_prerequisites\/\\\" + requestObj.request.custom.userPrerequisiteId, null, [\\n            {\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/status\\\",\\\"value\\\":\\\"PENDING_APPROVAL\\\"},\\n            {\\\"operation\\\":\\\"replace\\\",\\\"field\\\":\\\"\/pingApprovalWorkflowId\\\",\\\"value\\\":requestId}\\n        ]);\\n\\n\\n                \/\/ *** ADDED: write initialization comment into the Request console ***\\n        logger.error(\\\"Q adding comments for initialize node \\\" + requestId);\\n\\n        try {\\n            openidm.action(\\n                'iga\/governance\/requests\/' + requestId,\\n                'POST',\\n                {\\n                    comment: 'Request received for approval.'\\n                },\\n                { _action: 'update' }\\n            );\\n            logger.info(\\\"kyid-workflow: initialization comment added for request \\\" + requestId);\\n        } catch (e) {\\n            logger.error(\\\"kyid-workflow: failed to add initialization comment for request \\\"\\n                + requestId + \\\" with error: \\\" + e);\\n        }\\n\\n\\n\\n\\n\\n\\n        \\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n    }\\n} else {\\n    failureReason = \\\"kyid-workflow error: User Prerequisite or Request Type not found\\\";\\n}\\n\\nexecution.setVariable(\\\"failureReason\\\", failureReason);\\n\"}},{\"name\":\"approvalTask-95a73e18cff6\",\"displayName\":\"Level 1 Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"scriptTask-f289b027502f\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-ba0f2a0ca56e\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"exclusiveGateway-63953f0126f4\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"approvalTask-95a73e18cff6\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"scriptTask-05efed9a34f3\",\"displayName\":\"Provisioning\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-7f1777e228ba\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\/\/logger.info(\\\"kyid-workflow provisioning for request with id: \\\" + requestId);\\nlogger.error(\\\"kyid-workflow provisioning for request with id: \\\" + requestId);\\nvar koCredsAPI = identityServer.getProperty(\\\"esv.addremoveusercredential.api\\\")\\nlogger.error(\\\"Value of creds url is - \\\" + koCredsAPI)\\nvar kogCredsAPIScope = identityServer.getProperty(\\\"esv.addremoveusercredential.api.scope\\\")\\nlogger.error(\\\"Value of creds scope is - \\\" + kogCredsAPIScope)\\nvar koOrgAPI = identityServer.getProperty(\\\"esv.addremoveuseronboarding.api\\\")\\nlogger.error(\\\"Value of org url is - \\\" + koOrgAPI)\\nvar kogOrgAPIScope = identityServer.getProperty(\\\"esv.addremoveuseronboarding.api.scope\\\")\\nlogger.error(\\\"Value of org scope is - \\\" + kogOrgAPIScope)\\n\\nvar failureReason = null;\\nvar requestObj = null;\\nvar shouldPatchUserPrerequisite = false;\\nvar provisionResult;\\n\\n\\nif (requestId && requestId != null) {\\n    var requestBody = {\\n        \\\"payload\\\": {\\n            \\\"requestId\\\": requestId\\n        },\\n        \\\"action\\\": 1\\n    }\\n\\n    try {\\n        provisionResult = openidm.create(\\\"endpoint\/LIB-WorkflowAPI\\\", null, requestBody)\\n        logger.error(\\\"kyid workflow provision result: \\\" + provisionResult)\\n    } catch (e) {\\n        failureReason = \\\"kyid-workflow error: \\\" + e;\\n    }\\n}\\n\\n\\nexecution.setVariable(\\\"failureReason\\\", failureReason);\"}},{\"name\":\"scriptTask-a693f3a33d93\",\"displayName\":\"Reject Request\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-34047e616c13\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\nlogger.error(\\\"kyid-workflow rejection for request with id: \\\" + requestId);\\n\\nvar failureReason = null;\\nvar requestObj = null;\\nvar rejectionResult;\\n\\n\\nif (requestId && requestId != null) {\\n    var requestBody = {\\n        \\\"payload\\\": {\\n            \\\"requestId\\\": requestId\\n        },\\n        \\\"action\\\": 2\\n    }\\n\\n    try {\\n        rejectionResult = openidm.create(\\\"endpoint\/LIB-WorkflowAPI\\\", null, requestBody)\\n        logger.error(\\\"kyid workflow rejection result: \\\" + rejectionResult)\\n    } catch (e) {\\n        failureReason = \\\"kyid-workflow error: \\\" + e;\\n    }\\n}\"}},{\"name\":\"scriptTask-74c5710a88c8\",\"displayName\":\"Error Handle\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\nlogger.info(\\\"kyid-workflow error handling for request with id: \\\" + requestId);\\n\\nvar failureReason = \\\"Error encountered during workflow processing\\\";\\n\\nvar decision = {'outcome': 'cancelled', 'status': 'cancelled', 'comment': failureReason, 'failure': true, 'decision': 'rejected'};\\n\\nvar queryParams = {\\n    '_action': 'update'\\n};\\nvar result = openidm.action('iga\/governance\/requests\/' + requestId, 'POST', decision, queryParams);\\nlogger.info(\\\"kyid-workflow request error status update result: \\\" + result);\"}},{\"name\":\"exclusiveGateway-7f1777e228ba\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-ef98df825107\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"exclusiveGateway-34047e616c13\",\"displayName\":\"Validation Gateway\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"failureReason == null\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-37be22411bf7\"},{\"condition\":\"failureReason != null\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-74c5710a88c8\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"scriptTask-ef98df825107\",\"displayName\":\"Send Approval Notice Email\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"kyid-workflow send request approval email\\\");\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\n\/\/ Read event user information from request object\\ntry {\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;\\n  var  requestBody = {}\\n  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName\\n  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn\\n  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName \\n  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   \\n  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail\\n  const now = new Date();\\n  const timestamp = epochToCustomDate(now)\\n  requestBody.timeStamp = timestamp.replace(\\\" UTC\\\", \\\"\\\");\\n  var body = {\\n    subject: \\\"Request Approved\\\" ,\\n    to: requesterEmail,\\n    \/\/ body: \\\"Request with ID \\\" + requestId + \\\" has been approved.\\\",\\n    templateName: \\\"kyidRequestApproved\\\",\\n    object: requestBody\\n  };\\n  \/\/ \/\/ if (userObj && userObj.manager && userObj.manager.mail) {\\n  \/\/ \/\/   body.cc = userObj.manager.mail\\n  \/\/ \/\/ };\\n  openidm.action(\\\"external\/email\\\", \\\"sendTemplate\\\", body);\\n}\\ncatch (e) {\\n  logger.info(\\\"Unable to send approval notification email\\\");\\n}\\nfunction epochToCustomDate(epoch) {\\n    let date = new Date(epoch);\\n    return date.toLocaleString('en-US', {\\n        year: 'numeric',\\n        month: 'long',\\n        day: 'numeric',\\n        hour: '2-digit',\\n        minute: '2-digit',\\n        second: '2-digit'\\n    });\\n}\"}},{\"name\":\"scriptTask-37be22411bf7\",\"displayName\":\"Send Reject Notification Email\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":null}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"kyid-workflow send request rejection email\\\");\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\n\/\/ Read event user information from request object\\ntry {\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n  var requesterEmail = requestObj.request.custom.requesterUser.requesterUserMail;\\n  var  requestBody = {}\\n  requestBody.givenName = requestObj.request.custom.requesterUser.requesterUserGivenName\\n  requestBody.sn = requestObj.request.custom.requesterUser.requesterUserSn\\n  requestBody.applicationName = requestObj.request.custom.requesterUser.applicationName \\n  requestBody.roleName = requestObj.request.custom.requesterUser.roleName   \\n  requestBody.userEmail = requestObj.request.custom.requesterUser.requesterUserMail\\n  const now = new Date();\\n  const timestamp = epochToCustomDate(now)\\n  requestBody.timeStamp = timestamp.replace(\\\" UTC\\\", \\\"\\\");\\n  var body = {\\n    subject: \\\"Request Rejected\\\" ,\\n    to: requesterEmail,\\n    \/\/ body: \\\"Request with ID \\\" + requestId + \\\" has been rejected.\\\",\\n    templateName: \\\"kyidRequestRejected\\\",\\n    object: requestBody\\n  };\\n  openidm.action(\\\"external\/email\\\", \\\"sendTemplate\\\", body);\\n}\\ncatch (e) {\\n  logger.info(\\\"Unable to send rejection notification email\\\");\\n}\\nfunction epochToCustomDate(epoch) {\\n    let date = new Date(epoch);\\n    return date.toLocaleString('en-US', {\\n        year: 'numeric',\\n        month: 'long',\\n        day: 'numeric',\\n        hour: '2-digit',\\n        minute: '2-digit',\\n        second: '2-digit'\\n    });\\n}\"}},{\"name\":\"scriptTask-ba0f2a0ca56e\",\"displayName\":\"Check Level 1 Expiration or Rejection\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"exclusiveGateway-19779330b754\"}],\"language\":\"javascript\",\"script\":\"var content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nvar requestObj = null;\\n\\n\\nlogger.info(\\\"kyid-workflow check level 1 expiration or rejection:  \\\" + requestId);\\n\\ntry {\\n    requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n    logger.info(\\\"kyid-workflow requestObj: \\\" + requestObj);\\n\\n\\n} catch (e) {\\n    logger.info(\\\"kyid-workflow check level 1 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\\nif (requestObj) {\\n    try {\\n        var id = requestObj.decision.phases[0].completedBy.id;\\n        logger.error(\\\"kyid-workflow completedBy id for level 1 approval is: \\\" + id);\\n\\n        if (id == \\\"SYSTEM\\\"){\\n        \/\/if (id == \\\"managed\/user\/64173419-0d40-4ba5-b71d-b5c55dd2cb72\\\") {\\n            execution.setVariable(\\\"requestExpired\\\", true);\\n        } else {\\n            execution.setVariable(\\\"requestExpired\\\", false);\\n        }\\n    } catch (e) {\\n        logger.info(\\\"kyid-workflow init script failed with reason: \\\" + e);\\n        execution.setVariable(\\\"requestExpired\\\", false);\\n    }\\n} else {\\n    logger.info(\\\"kyid-workflow check level 1 expiration or rejection script failed with reason: \\\" + e);\\n    execution.setVariable(\\\"requestExpired\\\", false);\\n}\\n\"}},{\"name\":\"exclusiveGateway-19779330b754\",\"displayName\":\"Check Expiration Condition\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"requestExpired == true\",\"outcome\":\"validationSuccess\",\"step\":\"scriptTask-f8efad8a4d2e\"},{\"condition\":\"requestExpired == false\",\"outcome\":\"validationFailure\",\"step\":\"scriptTask-ab1048cb15af\"}],\"language\":\"javascript\",\"script\":\"logger.info(\\\"This is exclusive gateway\\\");\"}},{\"name\":\"approvalTask-ca89c676a630\",\"displayName\":\"Level 1 Backup Approval\",\"type\":\"approvalTask\",\"approvalTask\":{\"nextStep\":[{\"condition\":null,\"outcome\":\"APPROVE\",\"step\":\"scriptTask-05efed9a34f3\"},{\"condition\":null,\"outcome\":\"REJECT\",\"step\":\"scriptTask-a693f3a33d93\"}],\"approvalMode\":\"any\",\"actors\":[],\"events\":{\"assignment\":{\"notification\":\"kyidRequestAssigned\"},\"reminder\":{\"notification\":\"kyidRequestAssignedReminder\",\"frequency\":3,\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(3*24*60*60*1000))).toISOString()\"}},\"expiration\":{\"action\":\"reject\",\"notification\":\"kyidRequestAssignedExpiration\",\"actors\":[{\"id\":\"\"}],\"date\":{\"isExpression\":true,\"value\":\"(new Date(new Date().getTime()+(7*24*60*60*1000))).toISOString()\"},\"frequency\":7}}},\"approvalMode\":\"any\"},{\"name\":\"scriptTask-f289b027502f\",\"displayName\":\"Approval Comments\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"scriptTask-05efed9a34f3\"}],\"language\":\"javascript\",\"script\":\"\/*\\nScript nodes are used to invoke APIs or execute business logic.\\nYou can invoke governance APIs or IDM APIs.\\nSee https:\/\/backstage.forgerock.com\/docs\/idcloud\/latest\/identity-governance\/administration\/workflow-configure.html for more details.\\n\\nScript nodes should return a single value and should have the\\nlogic enclosed in a try-catch block.\\n\\nExample:\\ntry {\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n  applicationId = requestObj.application.id;\\n}\\ncatch (e) {\\n  failureReason = 'Validation failed: Error reading request with id ' + requestId;\\n}\\n*\/\\nlogger.error(\\\"Q adding approval msg before level 1 approval\\\");\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nlogger.info(\\\"Add Level 1 approval comment for request: \\\" + requestId);\\n\\nvar requestObj;\\n\\ntry {\\n    \/\/ Get the latest request object\\n    requestObj = openidm.action(\\n        'iga\/governance\/requests\/' + requestId,\\n        'GET',\\n        {},\\n        {}\\n    );\\n} catch (e) {\\n    logger.error(\\\"Failed to read request \\\" + requestId + \\\" for approval comment: \\\" + e);\\n    \\\"error\\\";\\n}\\n\\n\/\/ Basic safety checks\\nif (!requestObj || !requestObj.decision || !requestObj.decision.phases || !requestObj.decision.phases[0]) {\\n    logger.error(\\\"No decision phase found for request \\\" + requestId + \\\", no approval comment added.\\\");\\n    \\\"no-phase\\\";\\n}\\n\\n\/\/ Assume Level 1 Approval is phases[0]\\nvar phase = requestObj.decision.phases[0];\\n\\n\/\/ Only proceed if this phase is completed and has completedBy\\nif (phase.status !== \\\"complete\\\" || !phase.completedBy) {\\n    logger.error(\\\"Level 1 Approval not completed or no completedBy for request \\\" + requestId + \\\", no comment added.\\\");\\n    \\\"no-approver\\\";\\n}\\n\\nvar cb = phase.completedBy;\\n\\n\/\/ Build a simple display string\\nvar name;\\nif (cb.givenName && cb.sn) {\\n    name = cb.givenName + \\\" \\\" + cb.sn;\\n} else {\\n    name = cb.userName || cb.id || \\\"unknown\\\";\\n}\\n\\nvar email = cb.mail;\\nvar approverText = email ? (name + \\\" (\\\" + email + \\\")\\\") : name;\\n\\nvar commentText = \\\"Request approved by \\\" + approverText + \\\".\\\";\\n\\ntry {\\n    openidm.action(\\n        'iga\/governance\/requests\/' + requestId,\\n        'POST',\\n        { comment: commentText },\\n        { _action: 'update' }\\n    );\\n    logger.info(\\\"Approval comment added for request \\\" + requestId + \\\": \\\" + commentText);\\n    \\\"success\\\";\\n} catch (e) {\\n    logger.error(\\\"Failed to add approval comment for request \\\" + requestId + \\\": \\\" + e);\\n    \\\"error\\\";\\n}\\n\"}},{\"name\":\"scriptTask-f8efad8a4d2e\",\"displayName\":\"Expiration Comments\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"approvalTask-ca89c676a630\"}],\"language\":\"javascript\",\"script\":\"\/*\\nScript nodes are used to invoke APIs or execute business logic.\\nYou can invoke governance APIs or IDM APIs.\\nSee https:\/\/backstage.forgerock.com\/docs\/idcloud\/latest\/identity-governance\/administration\/workflow-configure.html for more details.\\n\\nScript nodes should return a single value and should have the\\nlogic enclosed in a try-catch block.\\n\\nExample:\\ntry {\\n  var requestObj = openidm.action('iga\/governance\/requests\/' + requestId, 'GET', {}, {});\\n  applicationId = requestObj.application.id;\\n}\\ncatch (e) {\\n  failureReason = 'Validation failed: Error reading request with id ' + requestId;\\n}\\n*\/\\nlogger.error(\\\"Q adding msg for expiration\\\");\\n\\n\/\/ Script: Expiration Comments\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nlogger.info(\\\"Add Expiration comment for request: \\\" + requestId);\\n\\nif (!requestId) {\\n    logger.error(\\\"No requestId found in execution variables. No expiration comment added.\\\");\\n} else {\\n    var commentText = \\\"This request is expired.\\\";\\n\\n    try {\\n        openidm.action(\\n            \\\"iga\/governance\/requests\/\\\" + requestId,\\n            \\\"POST\\\",\\n            { comment: commentText },\\n            { _action: \\\"update\\\" }\\n        );\\n        logger.info(\\\"Expiration comment added for request \\\" + requestId + \\\": \\\" + commentText);\\n    } catch (e) {\\n        logger.error(\\\"Failed to add expiration comment for request \\\" + requestId + \\\": \\\" + e);\\n    }\\n}\\n\\n\/\/ end\\n\"}},{\"name\":\"scriptTask-ab1048cb15af\",\"displayName\":\"Rejection Comments\",\"type\":\"scriptTask\",\"scriptTask\":{\"nextStep\":[{\"condition\":\"true\",\"outcome\":\"done\",\"step\":\"scriptTask-a693f3a33d93\"}],\"language\":\"javascript\",\"script\":\"\/\/ Script: Add \\\"rejected by\\\" comment after Level 1 Approval (Reject path)\\n\\nvar content = execution.getVariables();\\nvar requestId = content.get('id');\\n\\nlogger.info(\\\"Add Level 1 Rejection comment for request: \\\" + requestId);\\n\\nvar requestObj;\\n\\ntry {\\n    requestObj = openidm.action(\\n        \\\"iga\/governance\/requests\/\\\" + requestId,\\n        \\\"GET\\\",\\n        {},\\n        {}\\n    );\\n} catch (e) {\\n    logger.error(\\\"Failed to read request \\\" + requestId + \\\" for rejection comment: \\\" + e);\\n}\\n\\n\/\/ If we couldn't load or don't have phases, stop quietly\\nif (!requestObj || !requestObj.decision || !requestObj.decision.phases) {\\n    logger.error(\\\"No decision phases found for request \\\" + requestId + \\\". No rejection comment added.\\\");\\n} else {\\n    var phases = requestObj.decision.phases;\\n    var phase = null;\\n    var cb = null;\\n\\n    \/\/ Find the Level 1 Approval phase that is completed with a reject decision\\n    for (var i = 0; i < phases.length; i++) {\\n        var p = phases[i];\\n\\n        var isLevel1 = (p.displayName === \\\"Level 1 Approval\\\");\\n\\n        if (isLevel1 &&\\n            p.status === \\\"complete\\\" &&\\n            (p.decision === \\\"reject\\\" || p.decision === \\\"rejected\\\" || p.decision === \\\"deny\\\") &&\\n            p.completedBy) {\\n\\n            phase = p;\\n            cb = p.completedBy;\\n            break;\\n        }\\n    }\\n\\n    if (cb) {\\n        \/\/ Build \\\"Name (email)\\\" same as approve node\\n        var name;\\n        if (cb.givenName && cb.sn) {\\n            name = cb.givenName + \\\" \\\" + cb.sn;\\n        } else {\\n            name = cb.userName || cb.id || \\\"unknown\\\";\\n        }\\n\\n        var email = cb.mail;\\n        var approverText = email ? (name + \\\" (\\\" + email + \\\")\\\") : name;\\n\\n        var commentText = \\\"Request rejected by \\\" + approverText + \\\".\\\";\\n\\n        try {\\n            openidm.action(\\n                \\\"iga\/governance\/requests\/\\\" + requestId,\\n                \\\"POST\\\",\\n                { comment: commentText },\\n                { _action: \\\"update\\\" }\\n            );\\n            logger.info(\\\"Rejection comment added for request \\\" + requestId + \\\": \\\" + commentText);\\n        } catch (e) {\\n            logger.error(\\\"Failed to add rejection comment for request \\\" + requestId + \\\": \\\" + e);\\n        }\\n    } else {\\n        logger.error(\\\"No completed Level 1 rejection phase \/ completedBy found for request \\\"\\n            + requestId + \\\". No rejection comment added.\\\");\\n    }\\n}\\n\\n\/\/ end of script\\n\"}}],\"staticNodes\":{\"endNode\":{\"x\":2778,\"y\":225.5,\"id\":\"endNode\",\"name\":\"End\",\"nodeType\":\"SingleInput\",\"displayType\":\"SingleInput\",\"isDroppable\":false,\"isDeleteable\":false,\"isEditable\":false,\"isHovered\":false,\"hasError\":false,\"displayDetails\":{\"icon\":\"checkmark\",\"variant\":\"success\",\"value\":\"Success\"},\"_outcomes\":[],\"template\":null,\"schema\":null,\"connections\":{}},\"startNode\":{\"x\":70,\"y\":225.5,\"id\":\"startNode\",\"name\":\"Start\",\"nodeType\":\"IconOutcomeNode\",\"displayType\":\"IconOutcomeNode\",\"isDroppable\":false,\"isDeleteable\":false,\"isEditable\":false,\"isHovered\":false,\"hasError\":false,\"displayDetails\":{\"icon\":\"play_arrow\",\"variant\":\"info\",\"value\":\"Start\"},\"_outcomes\":[{\"id\":\"start\",\"displayName\":\"start\"}],\"template\":null,\"schema\":null,\"connections\":{\"start\":\"scriptTask-70b2da1a0483\"}},\"uiConfig\":{\"scriptTask-70b2da1a0483\":{\"x\":210,\"y\":227},\"approvalTask-95a73e18cff6\":{\"x\":719,\"y\":200.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\",\"escalationDate\":1}},\"exclusiveGateway-63953f0126f4\":{\"x\":440,\"y\":200.5},\"scriptTask-05efed9a34f3\":{\"x\":1932,\"y\":129},\"scriptTask-a693f3a33d93\":{\"x\":1775,\"y\":545.5},\"scriptTask-74c5710a88c8\":{\"x\":2458,\"y\":374},\"exclusiveGateway-7f1777e228ba\":{\"x\":2179,\"y\":93.66666666666667},\"exclusiveGateway-34047e616c13\":{\"x\":2179,\"y\":286.8333333333333},\"scriptTask-ef98df825107\":{\"x\":2458,\"y\":79},\"scriptTask-37be22411bf7\":{\"x\":2456,\"y\":227},\"scriptTask-ba0f2a0ca56e\":{\"x\":840,\"y\":449},\"exclusiveGateway-19779330b754\":{\"x\":1184,\"y\":196.5},\"approvalTask-ca89c676a630\":{\"x\":1596,\"y\":283.5,\"actors\":[],\"events\":{\"escalationType\":\"applicationOwner\",\"expirationDate\":7,\"expirationTimeSpan\":\"day(s)\",\"reminderDate\":3,\"reminderTimeSpan\":\"day(s)\",\"escalationDate\":1}},\"scriptTask-f289b027502f\":{\"x\":943,\"y\":34.015625},\"scriptTask-f8efad8a4d2e\":{\"x\":1507,\"y\":188.015625},\"scriptTask-ab1048cb15af\":{\"x\":1273,\"y\":483.015625}}},\"status\":\"published\",\"mutable\":true}";
            }
        }
        workflowPayloadObject = JSON.parse(workflowPayloadJson);
        logger.error("custom-endpoint workflow workflowPayloadObject: " + JSON.stringify(workflowPayloadObject));
        workflowPayloadObject._rev = 1;

        if (isGenericWorkflow) {
            workflowPayloadObject.id = workflowName.replace(/\s+/g, '-');
            workflowPayloadObject.name = workflowName.replace(/\s+/g, '-');
            workflowPayloadObject.displayName = workflowName + " Workflow";
            workflowPayloadObject.description = workflowName + " generic workflow";
        } else {
            workflowPayloadObject.id = workflowName.replace(/\s+/g, '-');
            workflowPayloadObject.name = workflowName.replace(/\s+/g, '-');
            workflowPayloadObject.displayName = workflowName + " Workflow";
            workflowPayloadObject.description = workflowName + "with '" + prerequisiteType.name + "' request type workflow";
        }

        // Add Level 1 Approvers
        addApproversToApprovalNode(levelOneApprovers, levelOneApprovalNodeID, 1);

        // Add Level 1 Backup Approvers
         if (levelOneBackupAppovers && levelOneBackupAppovers != null) {
            addApproversToApprovalNode(levelOneBackupAppovers, levelOneBackupApprovalNodeID, 13);
         }

        // Add Level 2 Approvers
        if (levelTwoApprovers && levelTwoApprovers != null) {
            addApproversToApprovalNode(levelTwoApprovers, levelTwoApprovalNodeID, 3);
        }

        // Add Level 2 Backup Approvers
        if (levelTwoBackupApprovers && levelTwoBackupApprovers != null) {
            addApproversToApprovalNode(levelTwoBackupApprovers, levelTwoBackupApprovalNodeID, 16);
        }


        var workflowAction;
        if (publishWorkflow) {
            workflowAction = "publish";
        } else {
            workflowAction = "create";
        }

        return httpCall(tenantBaseUrl + "/auto/orchestration/definition?_action=" + workflowAction, "POST", {
            "Authorization": "Bearer " + accessToken
        }, JSON.stringify(workflowPayloadObject));
    } catch (error) {
        logger.error("custom-endpoint workflow creation error: " + JSON.stringify(error));
        throw {
            "error": "custom-endpoint workflow creation error: " + JSON.stringify(error)
        };
    }
}

function createRequestType(workflowName, prerequisiteType, workflowId, accessToken) {
    try {
        logger.error("custom-endpoint createRequestType");

        requestTypeObject = {
           //"id": workflowName.replace(/\s+/g, '-'), //This has been commented to fix the issue of not allowing multiple request for the Request Type 08/17
            "id": UUID.randomUUID().toString(),
            "schemas": {
                "custom": [{
                    "_meta": {
                        "type": "system",
                        "displayName": "Prerequisite Approval2",
                        "properties": {},
                    },
                    "properties": {}
                }]
            },
            "workflow": {
                "id": workflowId
            },

            "custom": true,
            "displayName": workflowName,
            "uniqueKeys": [
                "custom.requestedUser.requestedUserId"
            ],
        }

        //Add required properties
        requestTypeObject.schemas.custom[0]._meta.properties = {
            "userPrerequisiteId": {
                "display": {
                    "name": "User Prerequisite ID",
                    "isVisible": true,
                    "order": 1
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "page": {
                "display": {
                    "name": "page",
                    "isVisible": true,
                    "order": 2
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requesterUser": {
                "display": {
                    "name": "Requester User",
                    "isVisible": true,
                    "order": 3
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requestedUser": {
                "display": {
                    "name": "Requested User",
                    "isVisible": true,
                    "order": 4
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requesterUserGivenName": {
                "display": {
                    "name": "Requester User Given Name",
                    "isVisible": true,
                    "order": 5
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requesterUserId": {
                "display": {
                    "name": "Requester User ID",
                    "isVisible": true,
                    "order": 6
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requesterUserMail": {
                "display": {
                    "name": "Requester User Mail",
                    "isVisible": true,
                    "order": 7
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requestedUserId": {
                "display": {
                    "name": "Requested User ID",
                    "isVisible": true,
                    "order": 8
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requestedUserMail": {
                "display": {
                    "name": "Requested User Mail",
                    "isVisible": true,
                    "order": 9
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requestedUserSn": {
                "display": {
                    "name": "Requested User SN",
                    "isVisible": true,
                    "order": 10
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "requestedUserUsername": {
                "display": {
                    "name": "Requested User Username",
                    "isVisible": true,
                    "order": 11
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            },
            "payload": {
                "display": {
                    "name": "payload",
                    "isVisible": true,
                    "order": 12
                },
                "isRequired": false,
                "isInternal": false,
                "isMultiValue": false
            }
        }

        requestTypeObject.schemas.custom[0].properties = {
            "userPrerequisiteId": {
                "type": "text"
            },
            "page": {
                "type": "object"
            },
            "requesterUser": {
                "type": "object"
            },
            "requestedUser": {
                "type": "object"
            },
            "requesterUserGivenName": {
                "type": "text"
            },
            "requesterUserId": {
                "type": "text"
            },
            "requesterUserMail": {
                "type": "text"
            },
            "requestedUserId": {
                "type": "text"
            },
            "requestedUserMail": {
                "type": "text"
            },
            "requestedUserSn": {
                "type": "text"
            },
            "requestedUserUsername": {
                "type": "text"
            },
            "payload": {
                "type": "object"
            }
        }


        //Add other properties from prerequisiteType MO if not generic workflow
        if (!isGenericWorkflow) {

            pages = prerequisiteType.pages;

            logger.error("custom-endpoint workflow pages: " + JSON.stringify(pages));


            for (var i = 0; i < pages.length; i++) {
                fields = pages[i].fields;
                logger.error("custom-endpoint workflow current page: " + JSON.stringify(pages[i]));

                for (var j = 0; j < fields.length; j++) {
                    logger.error("custom-endpoint workflow current field: " + JSON.stringify(fields[j]));

                    requestTypeObject.schemas.custom[0]._meta.properties[fields[j].name.replace(/\s+/g, '-')] = {
                        // "isRequired": fields[j].validation.length > 0 ? true : false,
                        "isRequired": false,
                        "isInternal": false,
                        "isMultiValue": false,
                        "display": {
                            "name": fields[j].name,
                            "isVisible": fields[j].isVisible,
                            "order": fields[j].sequence,
                            "description": fields[j].description
                        }
                    }

                    requestTypeObject.schemas.custom[0].properties[fields[j].name.replace(/\s+/g, '-')] = {
                        "type": "text"
                    }
                }
            }
        }

        logger.error("custom-endpoint workflow create Request Type: " + JSON.stringify(requestTypeObject));

        return httpCall(tenantBaseUrl + "/iga/governance/requestTypes", "POST", {
            "Authorization": "Bearer " + accessToken,
            "Content-Type": "application/json"
        }, JSON.stringify(requestTypeObject));

    } catch (error) {
        throw {
            "error": "custom-endpoint workflow creation error: " + error
        };
    }
}

function createForm(workflowName, prerequisiteType, accessToken) {
    logger.error("custom-endpoint workflow create form");
    formObject = {
        "id": workflowName.replace(/\s+/g, '-'),
        "name": workflowName.replace(/\s+/g, '-'),
        "type": "request",
        "description": "Request form for " + workflowName,
        "categories": {
            "applicationType": null,
            "objectType": null,
            "operation": "create"
        },
        "form": {

        }
    };

    // Add common  section for form
    formfields = [{
            "id": UUID.randomUUID().toString(),
            "fields": [{
                "id": UUID.randomUUID().toString(),
                "model": "custom.requesterUser.applicationName",
                "type": "string",
                "label": "Application Name",
                "validation": {
                    "required": false
                },
                "layout": {
                    "columns": 6,
                    "offset": 0
                },
                "readOnly": true,
                "customSlot": false
            },
            {
                "id": UUID.randomUUID().toString(),
                "model": "custom.requesterUser.roleName",
                "type": "string",
                "label": "Role Name",
                "validation": {
                    "required": false
                },
                "layout": {
                    "columns": 6,
                    "offset": 0
                },
                "readOnly": true,
                "customSlot": false
            }]
        },
        {
            "id": UUID.randomUUID().toString(),
            "fields": [{
                "id": UUID.randomUUID().toString(),
                "type": "formText",
                "validation": {},
                "layout": {
                    "columns": 12,
                    "offset": 0
                },
                "formText": "Requester User Info",
                "customSlot": "formText"
            }]
        },
        {
            "id": UUID.randomUUID().toString(),
            "fields": [{
                    "id": UUID.randomUUID().toString(),
                    "model": "custom.requesterUser.requesterUserGivenName",
                    "type": "string",
                    "label": "First Name",
                    "validation": {
                        "required": false
                    },
                    "layout": {
                        "columns": 6,
                        "offset": 0
                    },
                    "readOnly": true,
                    "customSlot": false
                },
                {
                    "id": UUID.randomUUID().toString(),
                    "model": "custom.requesterUser.requesterUserSn",
                    "type": "string",
                    "label": "Last Name",
                    "validation": {
                        "required": false
                    },
                    "layout": {
                        "columns": 6,
                        "offset": 0
                    },
                    "readOnly": true,
                    "customSlot": false
                }
            ]
        },
        {
            "id": UUID.randomUUID().toString(),
            "fields": [{
                    "id": UUID.randomUUID().toString(),
                    "model": "custom.requesterUser.requesterUserUsername",
                    "type": "string",
                    "label": "Username",
                    "validation": {
                        "required": true
                    },
                    "layout": {
                        "columns": 6,
                        "offset": 0
                    },
                    "readOnly": true,
                    "customSlot": false
                },
                {
                    "id": UUID.randomUUID().toString(),
                    "model": "custom.requesterUser.requesterUserMail",
                    "type": "string",
                    "label": "Email",
                    "validation": {
                        "required": false
                    },
                    "layout": {
                        "columns": 6,
                        "offset": 0
                    },
                    "readOnly": true,
                    "customSlot": false
                }
            ]
        },
        {
            "id": UUID.randomUUID().toString(),
            "fields": [{
                "id": UUID.randomUUID().toString(),
                "type": "formText",
                "validation": {},
                "layout": {
                    "columns": 12,
                    "offset": 0
                },
                "formText": "Requested User Info",
                "customSlot": "formText"
            }]
        },
        {
            "id": UUID.randomUUID().toString(),
            "fields": [{
                    "id": UUID.randomUUID().toString(),
                    "model": "custom.requestedUser.requestedUserGivenName",
                    "type": "string",
                    "label": "First Name",
                    "validation": {
                        "required": false
                    },
                    "layout": {
                        "columns": 6,
                        "offset": 0
                    },
                    "readOnly": true,
                    "customSlot": false
                },
                {
                    "id": UUID.randomUUID().toString(),
                    "model": "custom.requestedUser.requestedUserSn",
                    "type": "string",
                    "label": "Last Name",
                    "validation": {
                        "required": false
                    },
                    "layout": {
                        "columns": 6,
                        "offset": 0
                    },
                    "readOnly": true,
                    "customSlot": false
                }
            ]
        },
        {
            "id": UUID.randomUUID().toString(),
            "fields": [{
                    "id": UUID.randomUUID().toString(),
                    "model": "custom.requestedUser.requestedUserUsername",
                    "type": "string",
                    "label": "Username",
                    "validation": {
                        "required": true
                    },
                    "layout": {
                        "columns": 6,
                        "offset": 0
                    },
                    "readOnly": true,
                    "customSlot": false
                },
                {
                    "id": UUID.randomUUID().toString(),
                    "model": "custom.requestedUser.requestedUserMail",
                    "type": "string",
                    "label": "Email",
                    "validation": {
                        "required": false
                    },
                    "layout": {
                        "columns": 6,
                        "offset": 0
                    },
                    "readOnly": true,
                    "customSlot": false
                }
            ]
        }
    ]


    // add request type specific properties
    if (!isGenericWorkflow) {
        formfields.push({
            "id": UUID.randomUUID().toString(),
            "fields": [{
                "id": UUID.randomUUID().toString(),
                "type": "formText",
                "validation": {},
                "layout": {
                    "columns": 12,
                    "offset": 0
                },
                "formText": "Additional Request Info",
                "customSlot": "formText"
            }]
        })

        formPages = prerequisiteType.pages;

        logger.error("custom-endpoint workflow create form pages: " + JSON.stringify(formPages));

        for (var k = 0; k < formPages.length; k++) {
            var tempFields = formPages[k].fields;
            logger.error("custom-endpoint workflow create form  current page: " + JSON.stringify(formPages[k]));

            for (var l = 0; l < tempFields.length; l++) {
                logger.error("custom-endpoint workflow create form  current field: " + JSON.stringify(tempFields[l]));

                fieldObject = {
                    "id": UUID.randomUUID().toString(),
                    "fields": [{
                        "id": UUID.randomUUID().toString(),
                        "model": "custom.page.fields." + tempFields[l].onsubmitRequestServiceParameterName.replace(/\s+/g, '-'),
                        "type": "string",
                        "label": tempFields[l].name,
                        "validation": {
                            "required": false
                        },
                        "layout": {
                            "columns": 12,
                            "offset": 0
                        },
                        "readOnly": true,
                        "customSlot": false
                    }]
                }

                formfields.push(fieldObject);
                logger.error("custom-endpoint workflow formfields: " + formfields);
            }
        }
    }

    formObject.form.fields = formfields;

    logger.error("custom-endpoint workflow form object: " + JSON.stringify(formObject));

    return httpCall(tenantBaseUrl + "/iga/governance/requestForms", "POST", {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
    }, JSON.stringify(formObject));

}

function assignFormToWorkflow(formId, workflowId, approvalNodeId) {
    var body = {
        "formId": formId,
        "objectId": "workflow/" + workflowId + "/node/" + approvalNodeId
    }

    return httpCall(tenantBaseUrl + "/iga/governance/requestFormAssignments?_action=assign", "POST", {
        "Authorization": "Bearer " + accessToken,
        "Content-Type": "application/json"
    }, JSON.stringify(body));

}

function getApproverUserList(approvers) {
  logger.error("custom-endpoint workflow approvers: " + JSON.stringify(approvers));
    const validTypes = ["user", "role"];
    let approverList = [];
    for (let i = 0; i < approvers.length; i++) {
        logger.error("custom-endpoint workflow approver details: " + JSON.stringify(approvers[i]));
        if (approvers[i].type) {
            var approverType = approvers[i].type.toLowerCase();
            if (validTypes.includes(approverType)) {
                approverList.push({
                    id: approvers[i].id,
                    type: approverType
                });
            }
            else {
                throw {
                    code: 500,
                    message: "custom-endpoint getApproverUserList error, approver type not recognizable"
                }
            }
        } else {
            throw {
                code: 500,
                message: "custom-endpoint getApproverUserList error, no approver type available"
            }
        }
    }
    logger.error("custom-endpoint workflow form approverList: " + JSON.stringify(approverList));
    return approverList;
}

function createWorkflowBundle() {
    if (isGenericWorkflow) {
        if (levelTwoApproverList && levelTwoApproverList != null) {
            newWorkflow = createWorkflow(workflowName, null, levelOneApproverList, levelOneBackupApproverList, levelTwoApproverList, levelTwoBackupApproverList, publishWorkflow, accessToken);
        } else {
            newWorkflow = createWorkflow(workflowName, null, levelOneApproverList, levelOneBackupApproverList, null, null, publishWorkflow, accessToken);
        }

        if (newWorkflow) {
            returnObject.workflow = newWorkflow;
            newRequestType = createRequestType(workflowName, null, newWorkflow.id, accessToken);

        } else {
            throw {
                code: 500,
                message: "custom-endpoint workflow newWorkflow creation error"
            };
        }

        if (newRequestType) {
            returnObject.requestType = newRequestType;
            newForm = createForm(workflowName, null, accessToken);
        } else {
            throw {
                code: 500,
                message: "custom-endpoint workflow newRequestType creation error"
            }
        }
    } else {
        prerequisiteType = getPrerequisiteTypeById(prerequisiteTypeId);

        if (prerequisiteType) {
            returnObject.prerequisiteType = prerequisiteType;

            if (levelTwoApproverList && levelTwoApproverList != null) {
                newWorkflow = createWorkflow(workflowName, prerequisiteType, levelOneApproverList, levelOneBackupApproverList, levelTwoApproverList, levelTwoBackupApproverList, publishWorkflow, accessToken);
            } else {
                newWorkflow = createWorkflow(workflowName, prerequisiteType, levelOneApproverList, levelOneBackupApproverList, null, null, publishWorkflow, accessToken);
            }
        } else {
            throw {
                code: 500,
                message: "custom-endpoint workflow prerequisiteType not found, id: " + prerequisiteTypeId
            };
        }

        if (newWorkflow) {
            returnObject.workflow = newWorkflow;
            newRequestType = createRequestType(workflowName, prerequisiteType, newWorkflow.id, accessToken);

        } else {
            throw {
                code: 500,
                message: "custom-endpoint workflow newWorkflow creation error"
            };
        }

        if (newRequestType) {
            returnObject.requestType = newRequestType;
            newForm = createForm(workflowName, prerequisiteType, accessToken);
        } else {
            throw {
                code: 500,
                message: "custom-endpoint workflow newRequestType creation error"
            }
        }
    }

    if (newForm) {
        returnObject.form = newForm;
        var formAssignResult1 = assignFormToWorkflow(newForm.id, newWorkflow.id, levelOneApprovalNodeID) // assign form to Level 1 Approval Node
        logger.error("custom-endpoint workflow formAssignResult1: " + formAssignResult1.toString());

        if (levelOneBackupApproverList && levelOneBackupApproverList != null) {
            var formAssignResult2 = assignFormToWorkflow(newForm.id, newWorkflow.id, levelOneBackupApprovalNodeID) // assign form to Level 1 Backup Approval Node
            logger.error("custom-endpoint workflow formAssignResult2: " + formAssignResult2.toString());
        }

        if (levelTwoApproverList && levelTwoApproverList != null) {
            var formAssignResult3 = assignFormToWorkflow(newForm.id, newWorkflow.id, levelTwoApprovalNodeID) // assign form to Level 2 Approval Node
            logger.error("custom-endpoint workflow formAssignResult3: " + formAssignResult3.toString());
        }

        if (levelTwoBackupApproverList && levelTwoBackupApproverList != null) {
            var formAssignResult4 = assignFormToWorkflow(newForm.id, newWorkflow.id, levelTwoBackupApprovalNodeID) // assign form to Level 2 Backup Approval Node
            logger.error("custom-endpoint workflow formAssignResult4: " + formAssignResult4.toString());
        }

        if (formAssignResult1.formId == null 
            || (levelOneBackupApproverList && levelOneBackupApproverList != null && formAssignResult2.formId == null)
            || (levelTwoApproverList && levelTwoApproverList != null && formAssignResult3.formId == null)
            || (levelTwoBackupApproverList && levelTwoBackupApproverList != null && formAssignResult4.formId == null)
        ) {
            throw {
                code: 500,
                message: "custom-endpoint workflow newForm assignment error"
            }
        }
    } else {
        throw {
            code: 500,
            message: "custom-endpoint workflow newForm creation error"
        }
    }

    if (verbose) {
        returnObject["Workflow invoke URL"] = "/iga/governance/requests/" + newRequestType.id;
        return returnObject;
    } else {
        return {
            "Workflow invoke URL": "/iga/governance/requests/" + newRequestType.id
        };
    }
}
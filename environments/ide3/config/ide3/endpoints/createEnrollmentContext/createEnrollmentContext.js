/* This is the custom endpoint developed and will be used by KOG team to create the context ID. This API takes certain parameters and creates a record in enrollement context ID managed object*/
//declare Global variables
var response = null;
var contextID = null;
var txid = null;
var message = null;
var errors = [];
var requestedUserId = null;
var requesterUserId = null;

(function() {

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
  
    if (request.method === 'create') {
        var requestBody = null;
        var userAttributes = null;
        var bodyValidation = null;
        var expiryDate = null;
        var url = null;
        var shouldShowConfirmationPage = null;
        var createEnrollment = null
        var bodyValidation = null;
        var isAppBodyValid = null;
        var isValidattributes = null;
        var isValidDate = null;
        var isValidUrl = null;
        try {
            logger.info("Create Enrollment context API: Started");
            if (request.content != null) {
                requestBody = request.content;
                userAttributes = request.content.userAccountAttributes;
                if (request.content.transactionId != null) {
                    txid = request.content.transactionId;
                } else {
                    txid = generateGUID();
                    logger.info("transactionId not provided, generated GUID: " + txid);
                }
                logger.info("enrollmentcontext error: validating the request");
                //Verify if the Payload is as per the defined schema
                bodyValidation = validatePayload(requestBody);
                if (bodyValidation.success === false) {
                    return bodyValidation;
                } else if (bodyValidation.success === true) {
                    logger.info("valid payload received");
                    if ((request.content.applicationRoles).length != null) {
                        applicationRoles = request.content.applicationRoles;
                        //Verify if the Application Roles details are correct and Valid
                        isAppBodyValid = validateApplicationBody(requestBody);
                        if (isAppBodyValid.success === false) {
                            return isAppBodyValid;
                        } else if (isAppBodyValid.success === true) {
                            if (userAttributes && userAttributes != null) {
                                logger.error("inside userattributes validation");
                                //Verify and Validate the user attributes in the payload
                                isValidattributes = validateUserAccountAttributes(userAttributes);
                                if (isValidattributes.success === false) {
                                    return isValidattributes;
                                } else if (isValidattributes.success === true) {
                                    logger.info(" Create enrollment context API: user account attributes are valid");
                                }
                            }
                            if (request.content.expirationDateTime && request.content.expirationDateTime != null) {
                                expiryDate = request.content.expirationDateTime;
                                //Validate the expiry date format and the date
                                isValidDate = validate(expiryDate, "expiryDate");
                                if (isValidDate.success === false) {
                                    logger.error("Create Enrollment context API: invalid date");
                                    return isValidDate;
                                } else if (isValidDate.success === true) {
                                    logger.info("Create Enrollment context API: valid date");
                                }
                            }
                            if (request.content.returnURL && request.content.returnURL != null) {
                                url = request.content.returnURL;
                                //Verify the format of the Return URL
                                isValidUrl = validate(url, "url");
                                if (isValidUrl.success === false) {
                                    logger.error("Create Enrollment context API: invalid url");
                                    return isValidUrl;
                                } else if (isValidUrl.success === true) {
                                    logger.info("Create Enrollment context API:: valid url");
                                }
                            }

                            // showConfirmationPage: Boolean, Default False
                            if ("showConfirmationPage" in request.content && request.content.showConfirmationPage != null) {
                                var scp = request.content.showConfirmationPage;
                                if (typeof scp === "boolean") {
                                    shouldShowConfirmationPage = scp;
                                } else if (typeof scp === "string") {
                                    // Accept "true"/"false" (case-insensitive)
                                    var scpLower = scp.trim().toLowerCase();
                                    if (scpLower === "true") {
                                        shouldShowConfirmationPage = true;
                                    } else if (scpLower === "false") {
                                        shouldShowConfirmationPage = false;
                                    } else {
                                        logger.error("showConfirmationPage string value not recognized: " + scp + ". Defaulting to false.");
                                        shouldShowConfirmationPage = false;
                                    }
                                } else {
                                    logger.error("showConfirmationPage is not boolean or string. Defaulting to false.");
                                    shouldShowConfirmationPage = false;
                                }
                                logger.error("showConfirmationPage: " + shouldShowConfirmationPage);
                            } else {
                                shouldShowConfirmationPage = false;
                                logger.error("showConfirmationPage: " + shouldShowConfirmationPage);
                            }

                            // Create a record in the managed object
                            createEnrollment = CreateEnrollmentRecord(requestBody, txid);
                            if (createEnrollment != null && createEnrollment && createEnrollment !== false) {
                                contextID = createEnrollment._id;
                                logger.info("successfully created the record in managed object");
                                response = sendErrorResponse(true, txid, contextID, []);
                                return response;
                            } else {
                                logger.error("Create Enrollment context API: Failed to create record in IDM")
                                errors.push({
                                    messageCode: "999",
                                    messageDescription: "An unknown error has occurred, please contact KYID Technical Support or try again later."
                                });
                                response = sendErrorResponse(false, txid, contextID, errors);
                                return response;
                            }
                        }
                    } else {
                        errors.push({
                            messageCode: "102",
                            messageDescription: "application role cannot be empty or null"
                        });
                        logger.error("application information is not available");
                        response = sendErrorResponse(false, txid, contextID, errors);
                        return response;
                    }
                }
            } else {
                logger.error("Payload cannot be empty or null");
                errors.push({
                    messageCode: "100",
                    messageDescription: "request cannot be null"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        } catch (error) {
            logger.error("Create enrollment context API: failed to create enrollment context ID" + error);
            response = JSON.stringify(error);
            errors.push({
                messageCode: "999",
                messageDescription: "An unknown error has occurred, please contact KYID Technical Support or try again later."
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        }
    } else if (request.method === 'read') {
        return {};
    } else if (request.method === 'update') {

    } else if (request.method === 'patch') {
        return {};
    } else if (request.method === 'delete') {
        return {};
    }
    throw {
        code: 500,
        message: 'Unknown error'
    };
}());

function validatePayload(payload) {

    //Declare all the variables
    var allowedKeys = ["transactionId", "applicationRoles", "userAccountAttributes", "returnURL", "expirationDateTime", "showConfirmationPage"];
    var keys = null;
    var key = null;
    var requiredFields = ["applicationRoles", "returnURL"];
    var field = null;
    var role = null;
    var user = null;
    var requiredroleKeys = ["applicationSystemName", "roleSystemName"];
    var roleKeys = [
        "applicationSystemName", "roleSystemName",
        "kogOrgId", "orgTypeName", "orgName", "orgSourceUniqueId",
        "businessKeyTypeName", "businessKeyId", "businessKeyValue",
        "businessKeyDescription", "kogOrgBusinessKeyId",
        "isForwardDelegable", "delegationEndDate",
        "originalDelegatorUserIdentifier", "currentDelegatorUserIdentifier"
    ];
    var roleObjKeys = null;
    var rKey = null;
    var rField = null;
    var idKeys = ["originalDelegatorUserIdentifier", "currentDelegatorUserIdentifier"];
    var idFields = ["kyidUniqueId", "kogId", "logon", "upn", "emailAddress", "employeeId", "windowsAccountName"];
    var idObjKeys = null;
    var ikey = null;
    var userKeys = ["kyidUniqueId", "kogId", "legalFirstName", "legalLastName", "primaryEmailAddress", "alternateEmailAddress", "mobilePhone"];
    var userObjKeys = null;
    var uKey = null;
    var sf = null;
    var objectF = null;
    var obj = null;
    var subKeys = null;
    var subKey = null;
    var stringFields = ["kyidUniqueId", "kogId"];
    var objectFields = [
        "legalFirstName", "legalMiddleName", "legalLastName",
        "dateOfBirth", "gender",
        "primaryEmailAddress", "alternateEmailAddress", "mobilePhone"
    ];
    var addressField = "userAddress";
    var userKeys = stringFields.concat(objectFields).concat([addressField]);

    var allowedSubKeys = ["value", "isReadOnly"];
    var addressKeys = [
        "addressLine1", "addressLine2", "city", "state",
        "zipCode5", "zipCode4", "county", "isReadOnly"
    ];
    var fieldMessages = {};
    var userObjKeys = null;

    // Checking if payload is an object
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        logger.error("Payload must be a JSON object.");
        errors.push({
            messageCode: "142",
            messageDescription: "Invalid payload received"
        });
        response = sendErrorResponse(false, txid, contextID, errors);
        return response;
    }

    // allowedKeys = ["transactionId", "applicationRoles", "userAccountAttributes", "returnURL", "expirationDateTime"];
    keys = Object.keys(payload);
    for (var i = 0; i < keys.length; i++) {
        key = keys[i];
        if (allowedKeys.indexOf(key) === -1) {
            logger.error("Unexpected attribute:" + key);
            errors.push({
                messageCode: "142",
                messageDescription: "Invalid payload received"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        }
    }
    // Check required fields requiredFields = [applicationRoles", "returnURL"];
    fieldMessages = {
        applicationRoles: {
            messageCode: "102",
            messageDescription: "At least one Application Name, Role Name combination must be provided."
        },
        returnURL: {
            messageCode: "142",
            messageDescription: "returnURL cannot be empty or null"
        }
    };
    for (var j = 0; j < requiredFields.length; j++) {
        field = requiredFields[j];
        if (!(field in payload)) {
            var fieldMsg = fieldMessages[field];
            logger.error("Missing required attribute:" + field);
            errors.push({
                messageCode: fieldMsg.messageCode,
                messageDescription: fieldMsg.messageDescription
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;

        }
    }
    // transactionId must be a string
    if (payload.transactionId && typeof payload.transactionId !== "string") {
        logger.error("transactionId must be a string.");
        errors.push({
            messageCode: "142",
            messageDescription: "Invalid payload received"
        });
        response = sendErrorResponse(false, txid, contextID, errors);
        return response;

    }
    // applicationRoles must be a non-empty array
    if (!Array.isArray(payload.applicationRoles) || payload.applicationRoles.length === 0) {
        logger.error("applicationRoles must be a non-empty array.");
        errors.push({
            messageCode: "102",
            messageDescription: "Application Roles cannot be empty or null"
        });
        logger.error("application information is not available");
        response = sendErrorResponse(false, txid, contextID, errors);
        return response;
    }

    //Return URL should not be empty

    if (payload.returnURL === null || payload.returnURL === undefined || payload.returnURL === '') {
        errors.push({
            messageCode: "142",
            messageDescription: "Return URL cannot be empty or null"
        });
        logger.error("Return URL is empty");
        response = sendErrorResponse(false, txid, contextID, errors);
        return response;
    }

    // 7. Validate each applicationRole object
    for (var idx = 0; idx < payload.applicationRoles.length; idx++) {
        role = payload.applicationRoles[idx];
        roleObjKeys = Object.keys(role);
        for (var r = 0; r < roleObjKeys.length; r++) {
            rKey = roleObjKeys[r];
            if (roleKeys.indexOf(rKey) === -1) {
                logger.error("Unexpected attribute in applicationRoles " + idx + " " + rKey);
                errors.push({
                    messageCode: "142",
                    messageDescription: "Invalid payload received"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // Check required fields in role
        for (var r2 = 0; r2 < requiredroleKeys.length; r2++) {
            rField = requiredroleKeys[r2];
            if (!(rField in role)) {
                logger.error("Missing required attribute in applicationRoles " + idx + " " + rField);
                //  return false;
                errors.push({
                    messageCode: "101",
                    messageDescription: "At least one Application Name, Role Name combination must be provided."
                });
                logger.error("At least one Application Name, Role Name combination must be provided.");
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // applicationSystemName and roleSystemName must be strings
        if (typeof role.applicationSystemName !== 'string') {
            logger.error("applicationSystemName must be a string in applicationRoles " + idx);
            // return false;
            errors.push({
                messageCode: "142",
                messageDescription: "Invalid payload received"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        }
        if (typeof role.roleSystemName !== 'string') {
            logger.error("roleSystemName must be a string in applicationRoles " + idx);
            errors.push({
                messageCode: "142",
                messageDescription: "Invalid payload received"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        }

        // Validate user identifier object ["originalDelegatorUserIdentifier", "currentDelegatorUserIdentifier"];
        for (var k = 0; k < idKeys.length; k++) {
            var idKey = idKeys[k];
            var idObj = role[idKey];

            logger.error("idobj" + idObj);
            if (idObj !== undefined && typeof idObj !== 'object' || idObj === null || Array.isArray(idObj)) {
                logger.error(idKey + " enrollment context error: must be an object in applicationRoles " + idx);
                errors.push({
                    messageCode: "142",
                    messageDescription: "Invalid payload received"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }

            if (idObj && typeof idObj === 'object' && !Array.isArray(idObj)) {
                var idObjKeys = Object.keys(idObj);
                for (var m = 0; m < idObjKeys.length; m++) {
                    ikey = idObjKeys[m];
                    logger.error("Enrollmentcontext error: inside validation2");

                    if (idFields.indexOf(ikey) === -1) {
                        logger.error("Unexpected attribute in " + idKey + " in applicationRoles " + idx + ": " + ikey);
                        errors.push({
                            messageCode: "142",
                            messageDescription: "Invalid payload received"
                        });
                        response = sendErrorResponse(false, txid, contextID, errors);
                        return response;
                    }
                    if (typeof idObj[ikey] !== 'string') {
                        logger.error(ikey + " must be a string in " + idKey + " in applicationRoles " + idx);
                        errors.push({
                            messageCode: "142",
                            messageDescription: "Invalid payload received"
                        });
                        response = sendErrorResponse(false, txid, contextID, errors);
                        return response;
                    }
                }
            }
        }
    }

    // returnURL and expirationDateTime must be strings
    if (typeof payload.returnURL !== "string") {
        logger.error("returnURL must be a string.");
        errors.push({
            messageCode: "142",
            messageDescription: "Invalid payload received"
        });
        response = sendErrorResponse(false, txid, contextID, errors);
        return response;
    }

    if (typeof payload.expirationDateTime !== "string") {
        logger.error("expirationDateTime must be a string.");
        errors.push({
            messageCode: "142",
            messageDescription: "Invalid payload received"
        });
        response = sendErrorResponse(false, txid, contextID, errors);
        return response;
    }

    // userAccountAttributes is optional
    if ("userAccountAttributes" in payload) {
        user = payload.userAccountAttributes;

        if (typeof user !== "object" || user === null || Array.isArray(user)) {
            logger.error("userAccountAttributes must be an object.");
            errors.push({
                messageCode: "142",
                messageDescription: "Invalid payload received"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        }
        userObjKeys = (user !== undefined && user !== null) ? Object.keys(user) : [];
        for (var p = 0; p < userObjKeys.length; p++) {
            var uKey = userObjKeys[p];
            if (userKeys.indexOf(uKey) !== -1) {
                hasValidKey = true;
            } else {
                logger.error("Unexpected attribute in userAccountAttributes: " + uKey);
                errors.push({
                    messageCode: "142",
                    messageDescription: "Invalid payload received"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }
        // Validate string fields
        for (var sf of stringFields) {
            if (sf in user && typeof user[sf] !== "string") {
                logger.error("This field must be a string: " + sf);
                errors.push({
                    messageCode: "142",
                    messageDescription: "Invalid payload received"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }
        // Validate object fields
        for (var o = 0; o < objectFields.length; o++) {
            var objectF = objectFields[o];
            if (objectF in user) {
                var obj = user[objectF];
                if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
                    logger.error("This field must be an object: " + objectF);
                    errors.push({
                        messageCode: "142",
                        messageDescription: "Invalid payload received"
                    });
                    response = sendErrorResponse(false, txid, contextID, errors);
                    return response;
                }

                var subKeys = Object.keys(obj);
                for (var q = 0; q < subKeys.length; q++) {
                    var subKey = subKeys[q];
                    if (allowedSubKeys.indexOf(subKey) === -1) {
                        logger.error("Unexpected attribute in " + objectF + ":" + subKey);
                        errors.push({
                            messageCode: "142",
                            messageDescription: "Invalid payload received"
                        });
                        response = sendErrorResponse(false, txid, contextID, errors);
                        return response;
                    }
                }

                if (!("value" in obj)) {
                    logger.error("This value is required: value in " + objectF);
                    errors.push({
                        messageCode: "142",
                        messageDescription: "Invalid payload received"
                    });
                    response = sendErrorResponse(false, txid, contextID, errors);
                    return response;
                }
                if (typeof obj.value !== 'string') {
                    logger.error("This value must be a string: value in " + objectF);
                    errors.push({
                        messageCode: "142",
                        messageDescription: "Invalid payload received"
                    });
                    response = sendErrorResponse(false, txid, contextID, errors);
                    return response;
                }
                if (typeof obj.isReadOnly !== 'boolean') {
                    logger.error("This value must be a boolean: isReadOnly in " + objectF);
                    errors.push({
                        messageCode: "142",
                        messageDescription: "Invalid payload received"
                    });
                    response = sendErrorResponse(false, txid, contextID, errors);
                    return response;
                }
            }
        }
        // Validate userAddress data type and the allowed keys
        if (addressField in user) {
            var addr = user[addressField];
            if (typeof addr !== 'object' || addr === null || Array.isArray(addr)) {
                logger.error("userAddress must be an object.");
                errors.push({
                    messageCode: "142",
                    messageDescription: "Invalid payload received"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
            var addrKeys = Object.keys(addr);
            for (var i = 0; i < addrKeys.length; i++) {
                var aKey = addrKeys[i];
                if (addressKeys.indexOf(aKey) === -1) {
                    logger.error("Unexpected attribute in userAddress: " + aKey);
                    errors.push({
                        messageCode: "142",
                        messageDescription: "Invalid payload received"
                    });
                    response = sendErrorResponse(false, txid, contextID, errors);
                    return response;
                }
            }
            // All fields except isReadOnly must be strings if present
            for (var k = 0; k < addressKeys.length; k++) {
                var field = addressKeys[k];
                if (field in addr) {
                    if (field === "isReadOnly") {
                        if (typeof addr[field] !== 'boolean') {
                            logger.error("isReadOnly in userAddress must be boolean.");
                            errors.push({
                                messageCode: "142",
                                messageDescription: "Invalid payload received"
                            });
                            response = sendErrorResponse(false, txid, contextID, errors);
                            return response;
                        }
                    } else {
                        if (typeof addr[field] !== 'string') {
                            logger.error(field + " in userAddress must be string.");
                            errors.push({
                                messageCode: "142",
                                messageDescription: "Invalid payload received"
                            });
                            response = sendErrorResponse(false, txid, contextID, errors);
                            return response;
                        }
                    }
                }
            }
        }
    }
    return {
        success: true
    };
}

function sendErrorResponse(status, txid, contextID, message) {
    //  This function is used to send the response body in the required format
    var responseStatus = null;
    if (status === true) {
        responseStatus = 0;
    } else {
        responseStatus = 1;
    }
    var errorObj = {
        success: status,
        transactionId: txid,
        contextId: contextID,
        responseStatus: responseStatus,
        messageResponses: message
    };
    logger.error("errorObj" + errorObj);
    return errorObj;
}

function validate(value, type) {
    switch (type) {
        case "expiryDate":
            var dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
            var date = new Date(value);
            if (!dateRegex.test(value)) {
                errors.push({
                    messageCode: "103",
                    messageDescription: "Invalid date"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            } else if (isNaN(date.getTime())) {
                errors.push({
                    messageCode: "103",
                    messageDescription: "Invalid date"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            } else if (date < new Date()) {
                errors.push({
                    messageCode: "109",
                    messageDescription: "ExpirationDateTime cannot be less than current DateTime."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            } else {
                return {
                    success: true
                };
            }
        case "url":
            var urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;
            if (!urlRegex.test(value)) {
                errors.push({
                    messageCode: "103",
                    messageDescription: "Invalid Return URL"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            } else {
                return {
                    success: true
                };
            }
        default:
            throw {
                code: 400, message: "Unknown validation type: " + type
            };
    }
}

function generateGUID() {
    //This function generates a Random GUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0,
            v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function epochconverter(isoDateString) {
    var date = new Date(isoDateString);
    return date.getTime();
}

function validateApplicationBody(requestBody) {
    var errors = [];
    var origErrors = null;
    var currErrors = null;
    var role = null;
    var appResult = null;
    var roleResult = null;
    var roleId = null;
    var appDetails = null;
    var found = false;
    var businessAppName = null;

    // Validate each applicationRole
    for (var i = 0; i < requestBody.applicationRoles.length; i++) {
        role = requestBody.applicationRoles[i];
        logger.error("inside validateApplicationBody function");

        // Check required fields
        if (!role.applicationSystemName) {
            errors.push({
                messageCode: "103",
                messageDescription: "application name cannot be empty"
            });
            continue;
        }
        if (!role.roleSystemName) {
            errors.push({
                messageCode: "105",
                messageDescription: "Role Name cannot be null or empty"
            });
            continue;
        }

        // checks if the role name entered is available in managed object alpha_role
        roleResult = validateEntity("managed/alpha_role", "name", role.roleSystemName, ["_id"])
        // roleId = roleResult._id
        logger.error("roleResult is" + roleResult);
        if (!roleResult.result || roleResult.result.length === 0) {
            errors.push({
                messageCode: "106",
                messageDescription: "Role name" + role.roleSystemName + "is invalid"
            });
            continue;
        } else {

        }
        //  roleId = roleResult.result[0]._id;

        // checks if the Application name entered is available in managed object alpha_kyis_businessapplication
        appResult = validateEntity("managed/alpha_kyid_businessapplication", "name", role.applicationSystemName, ["_id", "name", "roleAppId"]);
        logger.error("appResult" + appResult);
        if (!appResult.result || appResult.result.length === 0) {
            errors.push({
                messageCode: "104",
                messageDescription: "Application name " + role.applicationSystemName + " is invalid"
            });
            continue;
        } else {
            logger.error("application name is available and is valid");
            var appRoleId = findRoleId(appResult, role.roleSystemName);
            logger.error(" Enrollement context API:RoleId" + appRoleId);
            if (appRoleId === false) {
                errors.push({
                    messageCode: "107",
                    messageDescription: "Application Name " + role.applicationSystemName + " and Role Name " + role.roleSystemName + " combination is invalid"
                });
            }
        }

        /*   if (roleId !== appRoleId) {
             errors.push({
                 messageCode: "107",
                 messageDescription: "Application Name " + role.applicationSystemName + " and Role Name " + role.roleSystemName + " combination is invalid"
             });
         }
         */


        // Validate combination of roleSystemName and applicationSystemName
        /*  appDetails = getBusinessAppInfoFromRole(roleId);
          logger.error("appDetails" +JSON.stringify(appDetails));
          if (appDetails.length > 0 && appDetails[0].businessAppName) {
             businessAppName = appDetails[0].businessAppName;
           } else {
               // Handle the case where appDetails is empty or missing the property
               logger.error("Business Application name is not found");
           }
 
         if (businessAppName !== appResult.result[0].name) {
             errors.push({
                 messageCode: "107",
                 messageDescription: "Application Name " + role.applicationSystemName + " and Role Name " + role.roleSystemName + " combination is invalid"
             });
         }
         */



        // dharjani (09/06) - BEGIN - new validations for Org and Business Key Attributes

        // isForwardDelegable: Boolean, Default False
        if ("isForwardDelegable" in role) {
            if (typeof role.isForwardDelegable !== "boolean") {
                logger.warn("isForwardDelegable is not boolean in applicationRoles " + i + ". Defaulting to false.");
                role.isForwardDelegable = false;
            }
        } else {
            role.isForwardDelegable = false;
        }

        // orgTypeName: string
        if ("orgTypeName" in role && typeof role.orgTypeName !== "string") {
            errors.push({
                messageCode: "301",
                messageDescription: "Organization Type Name is not in a valid format."
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        }

        // orgName: string, Required if orgTypeName is provided
        if ("orgTypeName" in role && role.orgTypeName) {
            if (!("orgName" in role) || typeof role.orgName !== "string" || !role.orgName) {
                errors.push({
                    messageCode: "302",
                    messageDescription: "Organization Name is required if Organization Type Name is provided."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // If orgTypeName is populated, then either orgSourceUniqueId or kogOrgId will be required
        if ("orgTypeName" in role && role.orgTypeName) {
            if (
                (!("orgSourceUniqueId" in role) || typeof role.orgSourceUniqueId !== "string" || !role.orgSourceUniqueId) &&
                (!("kogOrgId" in role) || typeof role.kogOrgId !== "string" || !role.kogOrgId)
            ) {
                errors.push({
                    messageCode: "303",
                    messageDescription: "Organization Source Unique Id or KOG Org Id is required if Organization Type Name is provided."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // orgTypeName: string, Required if orgSourceUniqueId provided
        if ("orgSourceUniqueId" in role && role.orgSourceUniqueId ) {
            if (!("orgTypeName" in role) || typeof role.orgTypeName !== "string" || !role.orgTypeName) {
                errors.push({
                    messageCode: "303",
                    messageDescription: "Organization Type Name is required if Organization Source Unique Id is provided."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // orgTypeName: string, Required if kogOrgId provided
        if ("kogOrgId" in role && role.kogOrgId ) {
            if (!("orgTypeName" in role) || typeof role.orgTypeName !== "string" || !role.orgTypeName) {
                errors.push({
                    messageCode: "303",
                    messageDescription: "Organization Type Name is required if KOG Org Id is provided."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // businessKeyTypeName: string, orgTypeName & orgSourceUniqueId required
        if ("businessKeyTypeName" in role && role.businessKeyTypeName) {
            if (!("orgTypeName" in role) || !role.orgTypeName || !("orgSourceUniqueId" in role) || !role.orgSourceUniqueId) {
                errors.push({
                    messageCode: "304",
                    messageDescription: "Organization Type Name and Organization Source Unique Id are required if Business Key Type Name is provided."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
            if (typeof role.businessKeyTypeName !== "string") {
                errors.push({
                    messageCode: "305",
                    messageDescription: "Business Key Type Name is not in a valid format."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // businessKeyId: string, Required if businessKeyTypeName is provided
        if ("businessKeyTypeName" in role && role.businessKeyTypeName) {
            if (!("businessKeyId" in role) || typeof role.businessKeyId !== "string" || !role.businessKeyId) {
                errors.push({
                    messageCode: "306",
                    messageDescription: "Business Key Id is required if Business Key Type Name is provided"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // businessKeyTypeName: string, Required if businessKeyId is provided
        if ("businessKeyId" in role && role.businessKeyId) {
            if (!("businessKeyTypeName" in role) || typeof role.businessKeyTypeName !== "string" || !role.businessKeyTypeName) {
                errors.push({
                    messageCode: "306",
                    messageDescription: "Business Key Type Name is required if Business Key Id is provided"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // businessKeyValue: string, Required if businessKeyTypeName is provided
        if ("businessKeyTypeName" in role && role.businessKeyTypeName) {
            if (!("businessKeyValue" in role) || typeof role.businessKeyValue !== "string" || !role.businessKeyValue) {
                errors.push({
                    messageCode: "307",
                    messageDescription: "Business Key Value is required if businessKeyTypeName is provided."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // businessKeyDescription: string (optional, type check)
        if ("businessKeyDescription" in role && typeof role.businessKeyDescription !== "string") {
            errors.push({
                messageCode: "308",
                messageDescription: "Business Key Description is not in a valid format."
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        }

        // kogOrgId: must be an integer > 0, or a string that parses to integer > 0
        if ("kogOrgId" in role) {
            var kogOrgIdValue = role.kogOrgId;
            var parsedKogOrgId = null;

            // Check if it's an integer
            if (typeof kogOrgIdValue === "number" && Number.isInteger(kogOrgIdValue) && kogOrgIdValue > 0) {
                // Valid
            }
            // Check if it's a string that can be parsed to a valid integer > 0
            else if (typeof kogOrgIdValue === "string" && /^\d+$/.test(kogOrgIdValue)) {
                parsedKogOrgId = parseInt(kogOrgIdValue, 10);
                if (parsedKogOrgId > 0) {
                    // Valid
                } else {
                    errors.push({
                        messageCode: "314",
                        messageDescription: "KOG Organization Id is not in a valid format."
                    });
                    response = sendErrorResponse(false, txid, contextID, errors);
                    return response;
                }
            }
            // Invalid type or value
            else {
                errors.push({
                    messageCode: "314",
                    messageDescription: "KOG Organization Id is not in a valid format."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        if ("kogOrgBusinessKeyId" in role) {
            var kogOrgBusinessKeyIdValue = role.kogOrgBusinessKeyId;
            var parsedKogOrgBusinessKeyId = null;

            // Check if it's an integer
            if (typeof kogOrgBusinessKeyIdValue === "number" && Number.isInteger(kogOrgBusinessKeyIdValue) && kogOrgBusinessKeyIdValue > 0) {
                // Valid
            }
            // Check if it's a string that can be parsed to a valid integer > 0
            else if (typeof kogOrgBusinessKeyIdValue === "string" && /^\d+$/.test(kogOrgBusinessKeyIdValue)) {
                parsedKogOrgBusinessKeyId = parseInt(kogOrgBusinessKeyIdValue, 10);
                if (parsedKogOrgBusinessKeyId > 0) {
                    // Valid
                } else {
                    errors.push({
                        messageCode: "315",
                        messageDescription: "KOG Organization Business Key Id is not in a valid format."
                    });
                    response = sendErrorResponse(false, txid, contextID, errors);
                    return response;
                }
            }
            // Invalid type or value
            else {
                errors.push({
                    messageCode: "315",
                    messageDescription: "KOG Organization Business Key Id is not in a valid format."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }


        // kogOrgId: Required if orgName is provided
        if ("orgName" in role && role.orgName) {
            if (!("kogOrgId" in role) || !role.kogOrgId) {
                errors.push({
                    messageCode: "309",
                    messageDescription: "KOG Organization Id is required if Organization Name is provided."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // kogOrgBusinessKeyId: string, Required if businessKeyId is provided
        if ("businessKeyId" in role && role.businessKeyId) {
            if (!("kogOrgBusinessKeyId" in role) || !role.kogOrgBusinessKeyId) {
                errors.push({
                    messageCode: "310",
                    messageDescription: "KOG Organization Business Key Id is required if Business Key Id is provided"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // delegationEndDate: optional, if present must be valid date string and in future
        if ("delegationEndDate" in role && role.delegationEndDate) {
            var dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
            if (!dateRegex.test(role.delegationEndDate)) {
                errors.push({
                    messageCode: "311",
                    messageDescription: "Delegation End Date must be a valid date in ISO format (YYYY-MM-DDTHH:MM:SSZ)."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
            var delegationDate = new Date(role.delegationEndDate);
            if (isNaN(delegationDate.getTime())) {
                errors.push({
                    messageCode: "312",
                    messageDescription: "Delegation End Date is not a valid date."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
            var now = new Date();
            if (delegationDate <= now) {
                errors.push({
                    messageCode: "313",
                    messageDescription: "Delegation End Date cannot be in the past."
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }

        // dharjani (09/06) - END - new validations for Org and Business Key Attributes


        // Validate originalDelegator
        logger.error(" role ID before original delegator" + roleId);
        if (role && role.originalDelegatorUserIdentifier != null) {
            origErrors = validateDelegatorFields(role.originalDelegatorUserIdentifier, "original Delegator User Identifier", i, appRoleId, role.roleSystemName, role.applicationSystemName);
            if (origErrors.success === false) {
                return origErrors;
            }
        }

        // Validate currentDelegator
        if (role && role.currentDelegatorUserIdentifier != null) {
            currErrors = validateDelegatorFields(role.currentDelegatorUserIdentifier, "current Delegator User Identifier", i, appRoleId, role.roleSystemName, role.applicationSystemName);
            if (currErrors.success === false) {
                return currErrors;
            }
        }
    }
    if (errors.length > 0) {
        logger.error("errors is :::::" + errors);
        response = sendErrorResponse(false, txid, contextID, errors);
        return response;
    }
    return {
        success: true
    };
}

function validateDelegatorFields(delegator, delegatorType, index, role, roleName, appName) {
    var errors = [];
    // Define configuration for fields that require validation
    var fieldConfigs = {
        logon: {
            entityAttr: "custom_logon",
            errorFormat: "123"
        },
        upn: {
            entityAttr: "frIndexedString1",
            errorFormat: "122"
        },
        emailAddress: {
            entityAttr: "mail",
            errorFormat: "121"
        },
        windowsAccountName: {
            entityAttr: "custom_windowsAccountName",
            errorFormat: "125"
        },
        kyidUniqueId: {
            entityAttr: "_id",
            errorFormat: "133"
        },
        kogId: {
            entityAttr: "userName",
            errorFormat: "134"
        }
    };

    // List of fields to check
    var fields = ["kyidUniqueId", "kogId", "logon", "upn", "emailAddress", "windowsAccountName"];
    var fieldValid = false;
    var messageCodes = {
        "original Delegator User Identifier": "127",
        "current Delegator User Identifier": "141"
    };


    function validateField(field, value) {
        var config = fieldConfigs[field];
        var details = null;
        var result = null;
        var effectiveRoles = null;
        if (!config) return null;

        details = validateEntity("managed/alpha_user", config.entityAttr, value, [""]);

        if (details && details.result && details.result.length > 0) {
            for (var j = 0; j < details.result.length; j++) {
                result = details.result[j];
                effectiveRoles = result.effectiveRoles;
                for (var z = 0; z < effectiveRoles.length; z++) {
                    if (effectiveRoles[z]._refResourceId === role) {
                        logger.info("found the role::" + role);
                        return {
                            valid: true,
                            found: true
                        };
                    }
                }
            }
            return {
                valid: true,
                found: false
            };
        }
        return {
            valid: false,
            found: false
        };
    }

    // Iterate through fields, validate each, and collect errors if any
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var value = delegator[field];
        var result = null;
        if (!value) continue;
        if (fieldConfigs[field]) {
            result = validateField(field, value);
            logger.info("delegator validation: result:: " + result);
            if (result && result.valid && result.found) {
                fieldValid = true;
                break; // Stops at the first valid field
            } else if (result && result.valid && !result.found) {
                if (messageCodes[delegatorType]) {
                    errors.push({
                        messageCode: messageCodes[delegatorType],
                        messageDescription: delegatorType + " does not have Application Name " + appName + "'s Role Name " + roleName
                    });
                }
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            } else {
                errors.push({
                    messageCode: fieldConfigs[field].errorFormat,
                    messageDescription: delegatorType + " has invalid " + field + " " + value
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            }
        }
    }

    // If no valid field found, push a generic error
    if (!fieldValid) {
        if (messageCodes[delegatorType]) {
            errors.push({
                messageCode: messageCodes[delegatorType],
                messageDescription: delegatorType + " requires at least one from the following parameters (KYID Unique Id, KOGID, UPN, Logon, Email Address, Employee ID, Windows Account Name)"
            });
        }
        response = sendErrorResponse(false, txid, contextID, errors);
        return response;
    }

    return {
        success: true
    };
}


function validateEntity(collection, field, value, returnFields) {
    var queryFilter = null;
    var details = null;
    if (value != null) {
        try {
            var startTime = new Date();
            queryFilter = '/' + field + ' eq "' + value + '"';
            details = openidm.query(collection, {
                "_queryFilter": queryFilter
            }, returnFields);
            var endTime = new Date();
            var duration = endTime - startTime;
            var durationInSeconds = duration / 1000;
            logger.error("Performance time: " + durationInSeconds);
            if (details.result.length > 0 && details.result[0]._id) {
                return details;
            } else {
                return {
                    success: false
                };
            }
        } catch (error) {
            message = "value" + value + "is invalid";
            errors.push({
                messageCode: "98",
                messageDescription: "value" + value + "is invalid"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;

        }
    }
}

function validateUserAccountAttributes(userAccountAttributes) {
    logger.info("Create Enrollment context API:: validating the user account attributes");
    var errors = [];
    var uniqueId = null;
    var uniqueIdResult = null;
    var kogId = null;
    var kogIdResult = null;
    var legalFirstName = null;
    var isValidFirstName = null;
    var legalLastName = null;
    var isValidLastName = null;
    var legalMiddleName = null;
    var isValidMiddleName = null;
    var primaryEmail = null;
    var isValidmail = null;
    var alternateEmail = null;
    var isValidAlternateEmail = null;
    var phoneNumber = null;
    var isValidnumber = null;
    var dob = null;
    var userAddress = null;
    var isAddressValid = null;
    var gender = null;

    //Verifies the kyid Unique ID information
    uniqueId = (userAccountAttributes && userAccountAttributes.kyidUniqueId) ? userAccountAttributes.kyidUniqueId : null;
    if (uniqueId) {
        uniqueIdResult = validateEntity("managed/alpha_user", "_id", uniqueId, ["_id"]);
        if (!uniqueIdResult.result || uniqueIdResult.result.length === 0) {

            errors.push({
                messageCode: "130",
                messageDescription: "Invalid KYID Unique Id",
            });

            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else if (uniqueIdResult.result || uniqueIdResult.result.length !== 0) {
            requesterUserId = uniqueIdResult.result[0]._id;
        }
    }
    //Verifies the KOG ID information
    kogId = (userAccountAttributes && userAccountAttributes.kogId) ? userAccountAttributes.kogId : null;
    if (kogId) {
        kogIdResult = validateEntity("managed/alpha_user", "userName", kogId, ["_id"]);
        if (!kogIdResult.result || kogIdResult.result.length === 0) {
            errors.push({
                messageCode: "114",
                messageDescription: "invalid KogID"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else if (kogIdResult.result || kogIdResult.result.length !== 0) {
            requesterUserId = kogIdResult.result[0]._id;
        }
    }
    //checks if the Legal First name entered is valid or not
    legalFirstName = userAccountAttributes && userAccountAttributes.legalFirstName && userAccountAttributes.legalFirstName.value;
    if (legalFirstName) {
        isValidFirstName = isValidName(legalFirstName);
        if (!isValidFirstName) {
            errors.push({
                messageCode: "110",
                messageDescription: "Invalid Legal First Name."
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else {
            logger.info("Create Enrollment context API:Legal first Name is valid");
        }

    }
    legalLastName = userAccountAttributes && userAccountAttributes.legalLastName && userAccountAttributes.legalLastName.value;
    if (legalLastName) {
        isValidLastName = isValidName(legalLastName);
        if (!isValidLastName) {
            errors.push({
                messageCode: "112",
                messageDescription: "Invalid Legal Last Name."
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else {
            logger.info("Create Enrollment context API:Legal last Name is valid");
        }
    }
    legalMiddleName = userAccountAttributes && userAccountAttributes.legalMiddleName && userAccountAttributes.legalMiddleName.value;
    if (legalMiddleName) {
        isValidMiddleName = isValidName(legalMiddleName);
        if (!isValidMiddleName) {
            errors.push({
                messageCode: "111",
                messageDescription: "Invalid Middle Name."
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else {
            logger.error("Create Enrollment context API:Legal Middle Name is valid");
        }
    }
    primaryEmail = userAccountAttributes && userAccountAttributes.primaryEmailAddress && userAccountAttributes.primaryEmailAddress.value;
    if (primaryEmail) {
        isValidmail = isValidEmail(primaryEmail);
        if (!isValidmail) {
            errors.push({
                messageCode: "113",
                messageDescription: "Invalid Primary Email address"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else {
            logger.info("Create Enrollment context API:Primary email address is valid");
        }
    } else {
        logger.info("Create Enrollment context API:primary email does not exist")
    }

    alternateEmail = userAccountAttributes && userAccountAttributes.alternateEmail && userAccountAttributes.alternateEmail.value;
    if (alternateEmail) {
        if (primaryEmail !== alternateEmail) {
            isValidAlternateEmail = isValidEmail(alternateEmail);
            if (!isValidAlternateEmail) {
                errors.push({
                    messageCode: "128",
                    messageDescription: "Invalid alternate Email address"
                });
                response = sendErrorResponse(false, txid, contextID, errors);
                return response;
            } else {
                logger.error("Create Enrollment context API:altername email address is valid");
            }

        } else {
            logger.error("primary email address and alternate email address are same");
            errors.push({
                messageCode: "128",
                messageDescription: "Invalid alternate Email address"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        }
    } else {
        logger.error("Create Enrollment context API:alternate email address is empty");
    }

    phoneNumber = userAccountAttributes && userAccountAttributes.mobilePhone && userAccountAttributes.mobilePhone.value;
    if (phoneNumber) {
        isValidnumber = isValidPhoneNumber(phoneNumber);
        if (!isValidnumber) {
            errors.push({
                messageCode: "129",
                messageDescription: "Invalid phone number"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else {
            logger.error("Create Enrollment context API:phone number is valid");
        }
    }
    dob = userAccountAttributes && userAccountAttributes.dateOfBirth && userAccountAttributes.dateOfBirth.value;
    if (dob) {
        var isDateOfBirth = isdob(dob);
        if (!isDateOfBirth) {
            errors.push({
                messageCode: "144",
                messageDescription: "Invalid date of Birth"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else {
            logger.info("Create Enrollment context API:Date of Birth is valid");
        }
    }
    userAddress = userAccountAttributes && userAccountAttributes.userAddress ? userAccountAttributes.userAddress : {};
    if (userAddress) {
        isAddressValid = validateAddress(userAddress);
        if (!isAddressValid) {
            errors.push({
                messageCode: "143",
                messageDescription: "Invalid Address"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else {
            logger.error("Create Enrollment context API: valid address");
        }
    }

    gender = userAccountAttributes && userAccountAttributes.gender && userAccountAttributes.gender.value;
    if (gender) {
        isGenderValid = isValidGender(gender);
        if (!isGenderValid) {
            errors.push({
                messageCode: "144",
                messageDescription: "Invalid Gender"
            });
            response = sendErrorResponse(false, txid, contextID, errors);
            return response;
        } else {
            logger.error("Create Enrollment context API: valid Gender");
        }
    }
    return {
        success: true
    };
}

function isdob(dob) {
    var regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(dob);
}

/* function isValidPhoneNumber(phoneNumber) {
    try {
        var phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
        var authCode = null;
        var params = {};
        var response = null;
        if(!phoneNumber.startsWith('+')){
          phoneNumber="+1"+phoneNumber;
        }
        phoneNumber="+"+phoneNumber.replace(/\D/g, '');
        // if (phoneRegex.test(phoneNumber) === true) {
            authCode = "Basic " + identityServer.getProperty("esv.twilio.authorizationcode");
            logger.error("Auth Code is ::" + authCode);
            params = {
                url: 'https://lookups.twilio.com/v2/PhoneNumbers/' + phoneNumber,
                method: 'GET',
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": authCode.toString()
                }
            }
            try {
                response = openidm.action("external/rest", "call", params);

            } catch (error) {
                logger.error("Error Occurred while executing " + error)
                return false;

            }
            logger.info("validatePhoneNumber response is ::" + JSON.stringify(response));
            response = JSON.parse(response);
            if (response.valid === false) {
                return false;
            }
            else if (response.valid === true) {
                return true;
            }
        // }
        else {
            return false;
        }
    } catch (error) {
        logger.error("Error Occured in validatePhoneNumber function : " + error);
        return false;
    } */

function isValidPhoneNumber(phoneNumber) {
    try {
        phoneNumber = phoneNumber.replace(/\D/g, '');
        if (!(phoneNumber.length > 5 && phoneNumber.length < 16)) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        logger.error("Error Occured in validatePhoneNumber function : " + error);
        return false;
    }
}

function isValid(input, type, checkFn) {
    var restrictedEntries = checkRestrictedEntries(type);
    var checkUserInput = checkFn(input, restrictedEntries);
    // If checkUserInput is false, input is invalid
    return checkUserInput;
}

// Name validation logic
function checkName(input, keywords) {
    logger.info("Inside check input name function");
    try {
        logger.info("input value : " + input);
        var regex = /^[^/{{{{\[\]:;|=,+*?<>\@"\\]}}}}+$/;
        logger.error("regex.test(input) : " + regex.test(input));
        if (regex.test(input) == false && !(input.length < 2) && !(input.length > 64)) {
            logger.error("input meets regex validation");
            if (keywords.map(k => k.toLowerCase()).includes(input.toLowerCase())) {
                logger.error("input matches with keyword");
                return false;
            } else {
                logger.info("input does not match with keyword");
                return true;
            }
        } else {
            logger.info("input does not meet regex validation");
            return false;
        }
    } catch (error) {
        logger.error("Exception : " + error);
    }
}
// Email validation logic
function checkEmail(email, domains) {
    try {
        var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        var trimmedEmail = email.trim();
        var parts = null;
        var domain = null;
        if (trimmedEmail.length > 128) {
            logger.error("enrollment context error:email length exceeds 128 ");
            return false;
        } else {
            logger.error("enrollment context error:email length does not exceed 128 ");
            if (emailRegex.test(trimmedEmail) == true) {
                parts = trimmedEmail.split('@');
                domain = parts[1];
                //checking if present in restricted entries
                if (domains.includes(domain)) {
                    logger.error("enrollment context error: email matches with restricted domain");
                    return false;
                } else {
                    return true;
                }
            } else {
                logger.error("enrollment context error: invalid email format");
                return false;
            }
        }
    } catch (error) {
        logger.error("enrollment context error: Exception : " + error);
        return error;
    }
}

function isValidName(name) {
    return isValid(name, "name", checkName);
}

function isValidEmail(email) {
    logger.error("enrollment context error email:" + email);
    return isValid(email, "email", checkEmail);
}

function checkRestrictedEntries(inputFlag) {
    try {
        var keywordSet = [];
        var domainSet = [];
        var keywordsArray = null;
        var keyword = null;
        var domainArray = null;
        var domain = null;
        var startTime = new Date();
        var response = openidm.query("managed/alpha_kyid_restricted_entries/", {
            "_queryFilter": 'true'
        }, ["*"]);
        var endTime = new Date();
        var duration = endTime - startTime;
        var durationInSeconds = duration / 1000;
        logger.error("Performance time: " + durationInSeconds);

        //check value of input flag
        if (inputFlag === "name") {
            keywordsArray = response.result[0].restrictedKeywords;
            for (var i = 0; i < keywordsArray.length; i++) {
                keyword = keywordsArray[i].keywords;
                keywordSet.push(keyword);
            }
            return keywordSet;
        } else if (inputFlag === "email") {
            domainArray = response.result[0].restrictedDomain;
            for (var i = 0; i < domainArray.length; i++) {
                domain = domainArray[i].domain;
                domainSet.push(domain);
            }
            logger.error("domainSet : " + domainSet);
            return domainSet;
        }
    } catch (error) {
        logger.error("Exception : " + error);
    }
}

function validateAddress(userAddress) {
    var addressLine1 = userAddress && userAddress.addressLine1 ? userAddress.addressLine1 : '';
    var addressLine2 = userAddress && userAddress.addressLine2 ? userAddress.addressLine2 : '';
    var city = userAddress && userAddress.city ? userAddress.city : '';
    var state = userAddress && userAddress.state ? userAddress.state : '';
    var zipCode5 = userAddress && userAddress.zipCode5 ? userAddress.zipCode5 : '';
    var zipCode4 = userAddress && userAddress.zipCode4 ? userAddress.zipCode4 : '';
    var county = userAddress && userAddress.county ? userAddress.county : '';
    if (addressLine1.length != 0 && !isMaxlength500(addressLine1)) {
        logger.error("invalid address 1");
        return false;
    }
    if (addressLine2.length != 0 && addressLine2.length > 500) {
        logger.error("invalid address 2");
        return false;
    }
    if (city.length != 0 && city.length > 128) {
        logger.error("invalid city");
        return false;
    }
    if (state.length != 0 && (!isAlpha(state) || state.length > 128)) {
        logger.error("invalid state");
        return false;
    }
    if (zipCode5.length != 0 && (!isValidZip(zipCode5) || zipCode5.length > 40)) {
        logger.error("invalid zipCode5");
        return false;
    }
    if (county.length != 0 && !isAlpha(county)) {
        logger.error("invalid county");
        return false;
    }
    if (zipCode4.length != 0 && !isMaxlength40(zipCode4)) {
        logger.error("invalid zipcode4");
        return false;
    }
    return true;
}

function isValidZip(zip) {
    logger.error("validting the zip");
    return /^\d{5}(-\d{4})?$/.test(zip);
}

function isValidPhone(phone) {
    var phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
    return phoneRegex.test(phone);
}

function isAlpha(value) {
    return /^[a-zA-Z ,.'-]+$/.test(value);
}

function isMaxlength40(value) {
    logger.error("Inside max 40 length check")
    return /^[\s\S]{1,40}$/.test(value);
}

function isMaxlength500(value) {
    logger.error("Inside max 500 length check")
    return /^[\s\S]{1,500}$/.test(value);
}

function isMaxlength128(value) {
    logger.error("Inside max 128 length check")
    return /^[\s\S]{1,128}$/.test(value);
}

function isValidGender(gender) {
    logger.error("Inside isValidGender function");
    try {
        logger.error("Input gender: " + gender);
        if (gender && !['male', 'female', 'other'].includes(gender.toLowerCase())) {
            logger.error("Invalid gender value entered.");
            return false;
        } else {
            return true;
        }
    } catch (error) {
        return false;
    }
}

function getQueryAttributeName(key) {
    switch (key) {
        case "kyidUniqueId":
            return "_id";
        case "kogId":
            return "userName";
        case "logon":
            return "custom_logon";
        case "upn":
            return "frIndexedString1";
        case "emailAddress":
            return "mail";
        case "windowsAccountName":
            return "custom_windowsAccountName";
        default:
            return key;
    }
}

function getFirstKey(obj) {
    logger.error("inside getFirstKeyValue");
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return {
                key: key,
                value: obj[key]
            };
        }
    }
    return {
        key: null,
        value: null
    };
}

// Query managed/alpha_user and return _id
function fetchUserIdByIdentifier(identifierObj) {
    var kv = getFirstKey(identifierObj);
    var queryAttr = null;
    var result = null;
    if (!kv.key || !kv.value) return null;
    queryAttr = getQueryAttributeName(kv.key);
    result = validateEntity("managed/alpha_user", queryAttr, kv.value, [""]);
    if (result && result.result && result.result.length > 0) {
        return result.result[0]._id;
    }
    return null;
}

function CreateEnrollmentRecord(body, txid) {
    if (body != null) {
        var userAttributeName = null;
        var userAttributeValue = null;
        var name = null;
        var description = null;
        var applicationRoles = null;
        var returnUrl = null;
        var showConfirmationPage = null;
        var expiryDate = null;
        var userDetailsinRequest = body && body.userAccountAttributes ? body.userAccountAttributes : null;
        var originalAttr = body && body.userAccountAttributes ? body.userAccountAttributes : null;
        var output = {};
        var dateValue = null;
        var attr = null;
        var userAttr = null;
        var createResult = null;
        var recordSource = "0";
        var recordState = "0";
        var createDate = new Date().toISOString().slice(0, 19) + 'Z';
        var createDateEpoch = epochconverter(createDate);
        var updateDate = new Date().toISOString().slice(0, 19) + 'Z';
        var updateDateEpoch = epochconverter(updateDate);
        var createdBy = "KYID-System";
        var updatedBy = "KYID-System";
      var createdByID = "KYID-System";
        var updatedByID = "KYID-System";
        var expiryDateinEpoch = null;
        var roleResult = null;
        var roleId = null;
        var appResult = null;
        var appId = null;
        var orginalDelegatorIdentifierAttributeId = null;
        var currentDelegatorIdentifierAttributeId = null;
        var attroutput = null;
        var Jsoncontent = null;
        var createResult = null;

        if (userDetailsinRequest && userDetailsinRequest.kogId != null) {
            userAttributeName = "KOGID";
            userAttributeValue = userDetailsinRequest.kogId;
            logger.info("enrollmentcontext error: KOG ID is found");
        } else if (userDetailsinRequest && userDetailsinRequest.kyidUniqueId != null) {
            userAttributeName = "KYIDUNIQUEID";
            userAttributeValue = userDetailsinRequest.kyidUniqueId;
            logger.info("enrollmentcontext error: KYIDUNIQUEID is found");
        }
        if (body && body.name != null) {
            name = body.name;
            logger.info("enrollmentcontext error: name is found");
        }
        if (body && body.description != null) {
            description = body.description;
            logger.info("enrollmentcontext error: description is found" + body.description);
        }

        if (body && body.applicationRoles.length > 0) {
            logger.info("enrollmentcontext error: applicationRoles is found" + applicationRoles);

            output = {
                applicationRoles: body.applicationRoles.map((role) => {

                    appResult = validateEntity("managed/alpha_kyid_businessapplication", "name", role.applicationSystemName, ["_id", "name", "roleAppId"]);
                    appId = appResult.result[0]._id;

                    var appRoleId = findRoleId(appResult, role.roleSystemName);
                    logger.error("appRoleId" + appRoleId);
                    if (appRoleId) {
                        roleId = appRoleId;
                    }

                    orginalDelegatorIdentifierAttributeId = fetchUserIdByIdentifier(role.originalDelegatorUserIdentifier);
                    currentDelegatorIdentifierAttributeId = fetchUserIdByIdentifier(role.currentDelegatorUserIdentifier);

                    return {
                        applicationName: role.applicationSystemName,
                        applicationId: appId,
                        roleName: role.roleSystemName,
                        roleId: roleId,
                        orgId: role.kogOrgId,
                        orgType: role.orgTypeName,
                        orgName: role.orgName,
                        orgSourceUniqueId: role.orgSourceUniqueId,
                        businessKeyTypeName: role.businessKeyTypeName,
                        businessKeyId: role.businessKeyId,
                        businessKeyName: role.businessKeyValue,
                        businessKeyDescription: role.businessKeyDescription,
                        kogOrgBusinessKeyId: role.kogOrgBusinessKeyId,
                        isForwardDelegable: role.isForwardDelegable,
                        delegationEndDate: role.delegationEndDate,
                        delegationEndDateEpoch: epochconverter(role.delegationEndDate),
                        orginalDelegatorIdentifierAttributeName: getFirstKeyValue(role.originalDelegatorUserIdentifier, "key"),
                        orginalDelegatorIdentifierAttributeValue: getFirstKeyValue(role.originalDelegatorUserIdentifier, "value"),
                        originalDelegatorUserAccountId: orginalDelegatorIdentifierAttributeId,
                        currentDelegatorIdentifierAttributeName: getFirstKeyValue(role.currentDelegatorUserIdentifier, "key"),
                        currentDelegatorIdentifierAttributeValue: getFirstKeyValue(role.currentDelegatorUserIdentifier, "value"),
                        currentDelegatorUserAccountId: currentDelegatorIdentifierAttributeId,
                    };
                })
            };
        }
        if (body.returnURL != null) {
            returnUrl = body.returnURL;
        }
        if (body.showConfirmationPage != null) {

            //Identifying showConfirmationPage as it is sent on the request
            var scp = body.showConfirmationPage;
            if (typeof scp === "boolean") {
                showConfirmationPage = scp;
            } else if (typeof scp === "string") {
                // Accept "true"/"false" (case-insensitive)
                var scpLower = scp.trim().toLowerCase();
                if (scpLower === "true") {
                    showConfirmationPage = true;
                } else if (scpLower === "false") {
                    showConfirmationPage = false;
                } else {
                    logger.error("showConfirmationPage string value not recognized: " + scp + ". Defaulting to false.");
                    showConfirmationPage = false;
                }
            } else {
                logger.error("showConfirmationPage is not boolean or string. Defaulting to false.");
                showConfirmationPage = false;
            }

            //If showConfirmationPage is now set as false, but there are more than one roles in the enrollment context, override it to true
            if (!showConfirmationPage && body.applicationRoles.length > 1) {
                showConfirmationPage = true;
            }
        } else {
            //Default logic = if there are more than one roles in the enrollment context set it to true, else false
            if (body && body.applicationRoles.length > 1) {
                showConfirmationPage = true;
            } else {
                showConfirmationPage = false;
            }
        }

        if (body.expirationDateTime != null) {
            expiryDate = body.expirationDateTime;
            expiryDateinEpoch = epochconverter(expiryDate);
        } else if (!body.expirationDateTime) {
            logger.info("Create Enrollment context API: No expiration Date provided adding the default expiry");
            dateValue = addDefaultExpiryDate();
            if (dateValue) {
                expiryDate = dateValue;
                expiryDateinEpoch = epochconverter(expiryDate);
            } else {
                logger.error("error in creating the default datevalue");
            }
        }

        userAttr = Object.assign({}, originalAttr);
        delete userAttr.kyidUniqueId;
        delete userAttr.kogId;
        attroutput = {
            userAccountAttributes: []
        };
        for (var key in userAttr) {
            var attr = userAttr[key];
            var value;

            if (key === "userAddress" && typeof attr === "object") {
                // Store all address fields except isReadOnly
                value = {};
                for (var addrKey in attr) {
                    if (addrKey !== "isReadOnly") {
                        value[addrKey] = attr[addrKey];
                    }
                }
                attroutput.userAccountAttributes.push({
                    attributeName: key,
                    attributeValue: value,
                    isReadOnly: attr.isReadOnly
                });
            } else {
                value = attr.value;
                // Clean mobilePhone value
                if (key === "mobilePhone" && typeof value === "string") {
                    value = value.replace(/\D/g, '');
                }
                attroutput.userAccountAttributes.push({
                    attributeName: key,
                    attributeValue: value,
                    isReadOnly: attr.isReadOnly
                });
            }
        }
        Jsoncontent = {
            "name": name,
            "description": description,
            "applicationRoles": output.applicationRoles,
            "returnURL": returnUrl,
            "showConfirmationPage": showConfirmationPage ? "true" : "false",
            "recordState": recordState,
            "expiryDate": expiryDate,
            "expiryDateEpoch": expiryDateinEpoch,
            "recordSource": recordSource,
            "createDate": createDate,
            "createDateEpoch": createDateEpoch,
            "updateDate": updateDate,
            "updateDateEpoch": updateDateEpoch,
            "createdBy": createdBy,
            "updatedBy": updatedBy,
            "createdByID": createdBy,
            "updatedByID": updatedBy,
            "transactionId": txid,
            "requestedUserIdentifierAttributeName": userAttributeName,
            "requestedUserIdentifierAttributeValue": userAttributeValue,
            "requestedUserAccountId": requesterUserId,
            "requestedUserAccountAttibutes": attroutput.userAccountAttributes,
            "requesterUserIdentifierAttributeName": null,
            "requesterUserIdentifierAttributeValue": null,
            "requesterUserAccountId": null,
            "status": "0"

        }
        try {
            logger.info("enrollmentcontext error: IDM create call");
            var startTime = new Date();
            createResult = openidm.create("managed/alpha_kyid_enrollment_contextId", null, Jsoncontent);
            var endTime = new Date();
            var duration = endTime - startTime;
            var durationInSeconds = duration / 1000;
            logger.error("Performance time: " + durationInSeconds);
            return createResult;
        } catch (error) {
            logger.error("enrollmentcontext error:failed to create record in IDM" + error);
            return false;
        }
    }
}

function getFirstKeyValue(obj, type) {
    if (obj && typeof obj === 'object' && Object.keys(obj).length > 0) {
        var firstKey = Object.keys(obj)[0];
        if (type === 'key') {
            return firstKey;
        } else if (type === 'value') {
            return obj[firstKey];
        } else {
            // Default: return key-value pair as an object
            var result = {};
            result[firstKey] = obj[firstKey];
            return result;
        }
    }
    // Return undefined or null if object is empty or invalid
    return undefined;
}

function addDefaultExpiryDate() {
    const now = new Date();
    now.setHours(now.getHours() + 24);
    return now.toISOString();
}

function getBusinessAppInfoFromRole(roleId) {
    try {
        var startTime = new Date();
        var roleObj = openidm.read("managed/alpha_role/" + roleId);
        var endTime = new Date();
        var duration = endTime - startTime;
        var durationInSeconds = duration / 1000;
        logger.error("Performance time: " + durationInSeconds);
        if (!roleObj || !roleObj.businessAppId) {
            logger.error("Enrollment context API: No business application found for role " + roleId);
            return [];
        }

        var appId = roleObj.businessAppId._refResourceId;
        var startTime = new Date();
        var busAppResponse = openidm.read("managed/alpha_kyid_businessapplication/" + appId);
        var endTime = new Date();
        var duration = endTime - startTime;
        var durationInSeconds = duration / 1000;
        logger.error("Performance time: " + durationInSeconds);

        var busAppName = busAppResponse.name || "Unknown App";
        if (!busAppResponse) {
            logger.error("Enrollment context API: Business app not found for id: " + appId);
            return [];
        }

        return [{
            businessAppName: busAppName,
        }];

    } catch (error) {
        logger.error("Enrollment context API: Error in getBusinessAppInfoFromRole: " + error.message);
        return [];
    }
}


function findRoleId(appResult, targetRoleName) {
    var roleAppIds = appResult.result[0].roleAppId;
    var roleObj = null;
    logger.error("targetRoleName" + targetRoleName);
    logger.error("roleAppIDs" + roleAppIds);
    if (Array.isArray(roleAppIds)) {
        for (var i = 0; i < roleAppIds.length; i++) {
            var refId = roleAppIds[i]._refResourceId;
            try {
                var startTime = new Date();
                var queryResult = openidm.query("managed/alpha_role", {
                    "_queryFilter": '_id eq "' + refId + '"'
                });
                var endTime = new Date();
                var duration = endTime - startTime;
                var durationInSeconds = duration / 1000;
                logger.error("Performance time: " + durationInSeconds);

                if (queryResult.result && queryResult.result.length > 0) {
                    roleObj = queryResult.result[0];
                    logger.error("enrollment context API validateEntity result: roleObj" + roleObj.name);

                    if (
                        typeof roleObj.name === 'string' &&
                        typeof targetRoleName === 'string' &&
                        roleObj.name.toLowerCase() === targetRoleName.toLowerCase()
                    ) {
                        logger.error("found the role" + roleObj.name);
                        return roleObj._id;
                    }
                }
            } catch (e) {
                logger.error("enrollment context API: Error querying the role", refId, e);
                return false;
            }
        }
    }
    return false;
}
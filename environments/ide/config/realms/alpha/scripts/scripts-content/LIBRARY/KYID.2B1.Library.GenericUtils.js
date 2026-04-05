var ops = require("KYID.2B1.Library.IDMobjCRUDops");

function getHelpdeskContactInfo(obj) {
    try {
        var helpdeskObj = {};
        //   var obj = "KYID Helpdesk";
        var helpdeskResponse = openidm.query("managed/alpha_kyid_helpdeskcontact", {
            "_queryFilter": 'name eq "' + obj + '"'
        }, [""]);

        if (!helpdeskResponse || helpdeskResponse.result.length === 0) {
            logger.error("No Helpdesk contacts found");
            return helpdeskObj;
        } else {

            var helpdeskItem = helpdeskResponse.result[0];
            var phoneContact = helpdeskItem.phoneContact;
            var emailContact = helpdeskItem.emailContact;


            logger.error("phoneContact method " + getPhoneNumber(phoneContact));
            logger.error("emailContact method " + getEmailAdrress(emailContact));

            var helpDeskEmail = getEmailAdrress(emailContact);
            var helpDeskNumber = getPhoneNumber(phoneContact);

            logger.error("helpDeskEmail " + helpDeskEmail);
            logger.error("helpDeskNumber " + helpDeskNumber);

            helpdeskObj = {
                "helpDeskEmail": helpDeskEmail,
                "helpDeskNumber": helpDeskNumber
            }

        }

        return JSON.stringify(helpdeskObj);

    } catch (e) {
        logger.error("getHelpdeskContactInfo script error: " + e);
    }
}

function getPhoneNumber(phoneContact) {
    var phoneNumber = null;
    phoneContact.forEach(c => {
        if (c.isVisible === "true") {
            phoneNumber = c.phoneNumber;
        }
    });
    return phoneNumber;
}

function getEmailAdrress(emailContact) {
    var emailAddress = null;
    emailContact.forEach(c => {
        if (c.isVisible === "true") {
            emailAddress = c.emailAddress;
        }
    });
    return emailAddress;
}


function getBusinessAppInfo(roleId) {
    try {
        var application = {};
        if (roleId) {
            // var roleResponse = openidm.query("managed/alpha_role/" + roleId + "/businessAppId/name", {
            //     "_queryFilter": "true"
            // }, [""]);
            var roleResponse = openidm.read("managed/alpha_role/" + roleId);
            logger.error("roleResponse is in :: " + JSON.stringify(roleResponse))
            if (!roleResponse) {
                logger.error("No applications found for role");
                result = {};
            } else {

                // var appItem = roleResponse.result[0];
                // var appId = appItem._refResourceId;

                // var appResponse = ops.crudOps("read", "alpha_application", null, null, null, appId);
                // if (!appResponse || !appResponse.businessApplication) {
                //     logger.error("No business application linked with app: " + appId);
                //     result = {};
                // }

                var businessAppId = roleResponse.businessAppId._refResourceId;
                logger.error("businessAppId is in ::" + businessAppId)
                var businessAppResponse = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, businessAppId);
                if (!businessAppResponse) {
                    logger.error("Business app not found for id: " + businessAppId);
                    result = {};
                    return result;
                } else {
                    // var logo = null
                    // if (businessAppResponse.logoURL) {
                    //     logo = businessAppResponse.logoURL;
                    // }
                    // var name = null;
                    // if (businessAppResponse.name) {
                    //     name = businessAppResponse.name;
                    // }
                    // var url = null;
                    // if (businessAppResponse.applicationURL) {
                    //     url = businessAppResponse.applicationURL;
                    // }
                    // var mail = null;
                    // if (businessAppResponse.applicationHelpdeskContact.emailContact[0].emailAddress) {
                    //     mail = businessAppResponse.applicationHelpdeskContact.emailContact[0].emailAddress || null;
                    // }
                    // var operatingHours = null;
                    // if (businessAppResponse.applicationHelpdeskContact.operationHours[0]) {
                    //     operatingHours = businessAppResponse.applicationHelpdeskContact.operationHours[0]|| null;
                    // }
                    // var phone = null;
                    // if (businessAppResponse.applicationHelpdeskContact.phoneContact[0]) {
                    //     phone = businessAppResponse.applicationHelpdeskContact.phoneContact[0] || null;
                    // }

                    var logo = businessAppResponse.logoFileName || null;
                    var name = businessAppResponse.name || null;
                    var url = businessAppResponse.applicationURL || null;
                    var applicationDisplayName = null; 
                    if(businessAppResponse && businessAppResponse.content.length >0 && businessAppResponse.content[0].title){
                        logger.error("businessAppResponse content is -->1 "+ businessAppResponse.content[0].title.en)
                        applicationDisplayName = businessAppResponse.content[0].title
                    }
                    
                    logger.error("logo is :: " + logo)
                    logger.error("name is :: " + name)
                    logger.error("namename is :: " + name)

                    var mail = null;
                    if (
                        businessAppResponse.applicationHelpdeskContact &&
                        businessAppResponse.applicationHelpdeskContact.emailContact &&
                        businessAppResponse.applicationHelpdeskContact.emailContact.length > 0 &&
                        businessAppResponse.applicationHelpdeskContact.emailContact[0].emailAddress
                    ) {
                        mail = businessAppResponse.applicationHelpdeskContact.emailContact[0].emailAddress;
                    }

                    var operatingHours = null;
                    if (
                        businessAppResponse.applicationHelpdeskContact &&
                        businessAppResponse.applicationHelpdeskContact.operationHours &&
                        businessAppResponse.applicationHelpdeskContact.operationHours.length > 0
                    ) {
                        operatingHours = businessAppResponse.applicationHelpdeskContact.operationHours[0];
                    }

                    var phone = null;
                    if (
                        businessAppResponse.applicationHelpdeskContact &&
                        businessAppResponse.applicationHelpdeskContact.phoneContact &&
                        businessAppResponse.applicationHelpdeskContact.phoneContact.length > 0
                    ) {
                        phone = businessAppResponse.applicationHelpdeskContact.phoneContact[0];
                    }
                    var role = null;
                    var roleNameResponse = ops.crudOps("read", "alpha_role", null, null, null, roleId);
                    if (roleNameResponse.name) {
                        role = roleNameResponse.name;
                    }

                    var result = {
                        application: {
                            logo: logo || null,
                            name: name || null,
                            role: role || null,
                            phone: phone || null,
                            mail: mail || null,
                            url: url || null,
                            applicationDisplayName : applicationDisplayName || null,
                            operatingHours: operatingHours || null
                        }
                    }
                    logger.error("result is in :: " + JSON.stringify(result))
                }


            }

            return JSON.stringify(result);
        } else {
            return {}
        }


    } catch (error) {
        logger.error("Error in getAppAndBusinessAppFromRole: " + error.message);
    }

}

function addIfNotNull(obj, key, value) {
    if (value !== null && value !== undefined && value !== "") {
        obj[key] = value;
    }
}

function removeMfaFactors(mfaMethod, usrKOGID, mfaValue, bearerToken, user, auditData) {
    logger.error("auditData in remove mfa method: " + JSON.stringify(auditData));
    logger.error("mfaMethod: " + mfaMethod + "usrKOGID: " + usrKOGID + "mfaValue : " + mfaValue + "bearerToken :" + bearerToken);
    try {
        var URL = systemEnv.getProperty("esv.kyid.tenant.fqdn");
        var query = {
            "_queryFilter": 'KOGId eq "' + usrKOGID + '" and MFAMethod eq "' + mfaMethod + '" and MFAValue eq "' + mfaValue + '" and MFAStatus eq "' +"ACTIVE"
        };
        logger.error("Query is :: " + JSON.stringify(query))
        // var roleNameResponse = openidm.query("managed/alpha_kyid_mfa_methods/", {
        //     "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "' + "ACTIVE" + '" AND MFAValue eq "' + mfaValue + '"'
        // });
        var roleNameResponse = openidm.query("managed/alpha_kyid_mfa_methods/", {
            "_queryFilter": 'KOGId eq "' + usrKOGID + '" and MFAMethod eq "' + mfaMethod + '" and MFAValue eq "' + mfaValue + '" and MFAStatus eq "ACTIVE"'
        });
        // var roleNameResponse = openidm.query("alpha_kyid_mfa_methods", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" and MFAMethod eq "' + mfaMethod + '" and MFAValue eq "' + mfaValue+  '" and MFAStatus eq "' + "ACTIVE"},["*"]);
        logger.error("roleNameResponse is " + JSON.stringify(roleNameResponse));
        roleNameResponse = JSON.parse(roleNameResponse);
        if (roleNameResponse.result.length > 0) {


            for (var i = 0; i < roleNameResponse.result.length; i++) {
                var mfamethodId = roleNameResponse.result[i]._id;
                var methodType = roleNameResponse.result[i].MFAMethod;

                if (mfaMethod === "SMSVOICE" || mfaMethod === "SYMANTEC" || mfaMethod === "SECONDARY_EMAIL") {
                    logger.error("Inside for Loop")

                    var patchJSONContent = [{
                        "operation": "add",
                        "field": "MFAStatus",
                        "value": "INACTIVE"
                    }]
                    var patchedUser = ops.crudOps("patch", "alpha_kyid_mfa_methods", patchJSONContent, null, null, mfamethodId);
                    logger.error("patchedUser is " + patchedUser);
                    try {
                        
                        var patchJSONContent = [{
                                "operation": "replace",
                                "field": "updateDateEpoch",
                                "value": auditData.updatedDateEpoch
                            },
                            {
                                "operation": "replace",
                                "field": "updateDate",
                                "value": auditData.updatedDate
                            }
                        ];

                        //only add updatedByID if present
                        if (auditData.updatedByID && auditData.updatedByID !== "" && auditData.updatedByID !== null) {
                            patchJSONContent.push({
                                "operation": "replace",
                                "field": "updatedByID",
                                "value": auditData.updatedByID
                            });
                        }

                        //only add updatedBy if present
                        if (auditData.updatedBy && auditData.updatedBy !== "" && auditData.updatedBy !== null) {
                            patchJSONContent.push({
                                "operation": "replace",
                                "field": "updatedBy",
                                "value": auditData.updatedBy
                            });
                        }
                        var patchedUser = ops.crudOps("patch", "alpha_kyid_mfa_methods", patchJSONContent, null, null, mfamethodId);
                   
                          logger.error("patchedUser is-- " + JSON.stringify(patchJSONContent));
                    } catch (error) {
                        logger.error("error occurred in restAPItoResetDevice :: " + restAPItoResetDevice)
                        return false;
                    }


                    logger.error("RemoveMFAJson" + JSON.stringify(patchJSONContent));



                    if (patchedUser) {
                        return true;
                    } else {
                        return false;
                    }

                } else if (mfaMethod === "PUSH" || mfaMethod === "FRPUSH") {
                    logger.error("Removing PUSH method")
                    requestURL = URL + "/am/json/realms/root/realms/alpha/users/" + user + "/devices/2fa/push?_action=reset";
                    if (restAPItoResetDevice(bearerToken, requestURL)) {

                        var patchJSONContent = [{
                                "operation": "add",
                                "field": "MFAStatus",
                                "value": "INACTIVE"
                            },
                            {
                                "operation": "replace",
                                "field": "updateDateEpoch",
                                "value": auditData.updatedDateEpoch
                            },
                            {
                                "operation": "replace",
                                "field": "updateDate",
                                "value": auditData.updatedDate
                            }
                        ];

                        //only add updatedByID if present
                        if (auditData.updatedByID && auditData.updatedByID !== "" && auditData.updatedByID !== null) {
                            patchJSONContent.push({
                                "operation": "replace",
                                "field": "updatedByID",
                                "value": auditData.updatedByID
                            });
                        }

                        //only add updatedBy if present
                        if (auditData.updatedBy && auditData.updatedBy !== "" && auditData.updatedBy !== null) {
                            patchJSONContent.push({
                                "operation": "replace",
                                "field": "updatedBy",
                                "value": auditData.updatedBy
                            });
                        }
                        logger.error("RemoveMFAJsonPUSH:::" + JSON.stringify(patchJSONContent));
                        var patchedUser = ops.crudOps("patch", "alpha_kyid_mfa_methods", patchJSONContent, null, null, mfamethodId);
                        if (patchedUser) {
                            return true
                        } else {
                            return false
                        }

                    }

                } else if ((mfaMethod === "TOTP" && methodType === "TOTP") || mfaMethod === "FRTOTP") {
                    logger.error("Removing TOTP method")
                    requestURL = URL + "/am/json/realms/root/realms/alpha/users/" + user + "/devices/2fa/oath?_action=reset";

                    var patchJSONContent = [{
                            "operation": "add",
                            "field": "MFAStatus",
                            "value": "INACTIVE"
                        },
                        {
                            "operation": "replace",
                            "field": "updateDateEpoch",
                            "value": auditData.updatedDateEpoch
                        },
                        {
                            "operation": "replace",
                            "field": "updateDate",
                            "value": auditData.updatedDate
                        }
                    ];

                    //only add updatedByID if present
                    if (auditData.updatedByID && auditData.updatedByID !== "" && auditData.updatedByID !== null) {

                        patchJSONContent.push({
                            "operation": "replace",
                            "field": "updatedByID",
                            "value": auditData.updatedByID
                        });
                    }

                    //only add updatedBy if present
                    if (auditData.updatedBy && auditData.updatedBy !== "" && auditData.updatedBy !== null) {
                        patchJSONContent.push({
                            "operation": "replace",
                            "field": "updatedBy",
                            "value": auditData.updatedBy
                        });
                    }
                    var patchedUser = ops.crudOps("patch", "alpha_kyid_mfa_methods", patchJSONContent, null, null, mfamethodId);
                    if (patchedUser) {
                        return true
                    } else {
                        return false
                    }


                }
            }
        } else {
            return ("Invalid MFA Method")

        }
    } catch (error) {
        return ("Error Occured: " + error)

    }

}

function restAPItoResetDevice(bearerToken, requestURL) {
    try {
        logger.error("Inside restAPItoResetDevice fun")
        var options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept-API-Version": "resource=1.0"
            },
            token: bearerToken,
            body: {}
        };

        var apiResponse = httpClient.send(requestURL, options).get();
        logger.error("API Response is " + apiResponse.text())
        if (apiResponse) {
            var status = apiResponse.status;
            logger.error("API status is " + status)
            if (status === 200) {
                return true;
            } else {
                return false
            };
        } else {
            return false;
        }
    } catch (error) {
        logger.error("error occurred in restAPItoResetDevice :: " + restAPItoResetDevice)
        return false;

    }

}

function validatePhoneNumber(phoneNumber) {
    try {
        const phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
        logger.error("Phone Number is ::" + phoneNumber);
        if (phoneRegex.test(phoneNumber) === true) {
            var authCode = "Basic " + systemEnv.getProperty("esv.twilio.authorizationcode");
            logger.error("Auth Code is ::" + authCode);
            var options = {
                method: "GET",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": authCode.toString()
                }
            }

            var requestURL = "https://lookups.twilio.com/v2/PhoneNumbers/" + phoneNumber;

            var response = httpClient.send(requestURL, options).get();
            logger.error("validatePhoneNumber response is ::" + response.text())
            var response = JSON.parse(response.text());
            if (response.valid === true) {
                return true;
            } else {
                return false;
            }

        } else {
            return false;
        }



    } catch (error) {
        logger.error("Error Occured in KYID.2B1.Library.GenericUtils validatePhoneNumber function : " + error)
        return error;

    }


}

function patchPreReq(preRequisiteId, requestedUserAccountId) {
    logger.error("preRequisiteId is :: " + preRequisiteId)
    logger.error("requestedUserAccountId is :: " + requestedUserAccountId)
    var prereqPatch = openidm.query("managed/alpha_kyid_enrollment_user_prerequisites/", {
        "_queryFilter": '!(enrollmentRequestId pr)' + ' AND !(associatedRoleIds pr)' + ' AND requestedUserAccountId eq "' + requestedUserAccountId + '"' + ' AND preRequisiteId/_refResourceId eq "' + preRequisiteId + '"' + ' AND (status eq "0" OR status eq "NOT_STARTED")' + ' AND (recordState eq "0" OR recordState eq "ACTIVE")'
    }, ["preRequisiteTypeId/*", "preRequisiteId/*", "*"])
    logger.error("prereqPatch is in :: " + JSON.stringify(prereqPatch))
    var arrayStatus = []
    if (prereqPatch.resultCount > 0) {
        var PrereqIds = prereqPatch.result.forEach(value => {
            logger.error("value is :: " + JSON.stringify(value));
            var userPrereqId = value._id;
            logger.error("userPrereqId:: " + userPrereqId)
            var patchStatus = updatePrereqStatus(userPrereqId, requestedUserAccountId);
            if (patchStatus) {
                logger.error("patchStatus is in :: " + JSON.stringify(patchStatus))
                arrayStatus.push(patchStatus)
            }
        });
        return arrayStatus
    }
}


function updatePrereqStatus(userPrereqId, userDetails) {
    logger.error("userPrereqId is :: " + userPrereqId)
    var currentTimeEpoch = Date.now();
    var dateTime = new Date().toISOString();
    try {
        var jsonArray = []
        var prereqValues = []

        logger.error("prereqValues are --> " + JSON.stringify(prereqValues))

        var jsonObj = {
            "operation": "replace",
            "field": "status",
            "value": "2"
        }
        jsonArray.push(jsonObj)

        jsonObj = {
            "operation": "replace",
            "field": "updateDateEpoch",
            "value": currentTimeEpoch
        }
        jsonArray.push(jsonObj)

        jsonObj = {
            "operation": "replace",
            "field": "updateDate",
            "value": dateTime
        }
        jsonArray.push(jsonObj)


        jsonObj = {
            "operation": "replace",
            "field": "completionDateEpoch",
            "value": currentTimeEpoch
        }
        jsonArray.push(jsonObj)

        jsonObj = {
            "operation": "replace",
            "field": "completionDate",
            "value": dateTime
        }
        jsonArray.push(jsonObj)

        if (userDetails) {
            jsonObj = {
                "operation": "replace",
                "field": "updatedBy",
                "value": userDetails
            }
            jsonArray.push(jsonObj)
        }

        if (prereqValues.length > 0) {
            jsonObj = {
                "operation": "replace",
                "field": "prerequisiteValues",
                "value": prereqValues
            }
            jsonArray.push(jsonObj)
        }

        logger.error("endpoint/UserPrerequisiteAPI jsonArray --> " + JSON.stringify(jsonArray))

        var response = openidm.patch("managed/alpha_kyid_enrollment_user_prerequisites/" + userPrereqId, null, jsonArray);
        logger.error("updatePrereqStatus -- response --> " + response)
        if (response) {
            return response
        } else {
            return null
        }
    } catch (error) {
        logger.error("Error Occurred while updatePrereqStatus User Prerequsites" + error)
        action.goTo("error")
    }
}

function languagePreference(value){
    if(value == 1 || value =="1"){
        return "en"
    }else if(value == 2 || value =="2"){
        return "es"
    }
}

exports.getBusinessAppInfo = getBusinessAppInfo;
exports.removeMfaFactors = removeMfaFactors;
exports.validatePhoneNumber = validatePhoneNumber;
exports.getHelpdeskContactInfo = getHelpdeskContactInfo;
exports.patchPreReq = patchPreReq;
exports.languagePreference = languagePreference;
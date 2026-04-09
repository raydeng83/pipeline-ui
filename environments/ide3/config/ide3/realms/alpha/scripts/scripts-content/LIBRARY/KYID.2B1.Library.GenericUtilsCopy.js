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

            var helpDeskEmail = null;
            if (emailContact.isVisible === true) {
                helpDeskEmail = emailContact.emailAddress;
            }

            var helpDeskNumber = null;
            if (phoneContact.isVisible === true) {
                helpDeskNumber = phoneContact.phoneNumber;
            }
        
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



function getBusinessAppInfo(roleId) {
    try {
        var application = {};
        if (roleId) {
            var roleResponse = openidm.query("managed/alpha_role/" + roleId + "/applications", {
                "_queryFilter": "true"
            }, [""]);

            if (!roleResponse || roleResponse.result.length === 0) {
                logger.error("No applications found for role");
                result = {};
            }
            else {

                var appItem = roleResponse.result[0];
                var appId = appItem._refResourceId;

                var appResponse = ops.crudOps("read", "alpha_application", null, null, null, appId);
                if (!appResponse || !appResponse.businessApplication) {
                    logger.error("No business application linked with app: " + appId);
                    result = {};
                }

                var businessAppId = appResponse.businessApplication._refResourceId;
                var businessAppResponse = ops.crudOps("read", "alpha_kyid_businessapplication", null, null, null, businessAppId);
                if (!businessAppResponse) {
                    logger.error("Business app not found for id: " + businessAppId);
                    result = {};
                }
                else {
                    var logo = null
                    if (businessAppResponse.logoURL) {
                        logo = businessAppResponse.logoURL;
                    }
                    var name = null;
                    if (businessAppResponse.name) {
                        name = businessAppResponse.name;
                    }
                    var url = null;
                    if (businessAppResponse.applicationURL) {
                        url = businessAppResponse.applicationURL;
                    }
                    var mail = null;
                    if (businessAppResponse.applicationHelpdeskContact.emailContact[0].emailAddress) {
                        mail = businessAppResponse.applicationHelpdeskContact.emailContact[0].emailAddress;
                    }
                    var operatingHours = null;
                    if (businessAppResponse.applicationHelpdeskContact.operationHours[0]) {
                        operatingHours = businessAppResponse.applicationHelpdeskContact.operationHours[0];
                    }
                    var phone = null;
                    if (businessAppResponse.applicationHelpdeskContact.phoneContact[0]) {
                        phone = businessAppResponse.applicationHelpdeskContact.phoneContact[0];
                    }
                    var role = null;
                    var roleNameResponse = ops.crudOps("read", "alpha_role", null, null, null, roleId);
                    if (roleNameResponse.name) {
                        role = roleNameResponse.name;
                    }

                    var result = {
                        application: {
                            logo: logo,
                            name: name,
                            role: role,
                            phone: phone,
                            mail: mail,
                            url: url,
                            operatingHours: operatingHours
                        }
                    }
                }


            }

            return JSON.stringify(result);
        }
        else {
            return {}
        }


    } catch (error) {
        logger.error("Error in getAppAndBusinessAppFromRole: " + error.message);
    }

}

function removeMfaFactors(mfaMethod, usrKOGID, mfaValue, bearerToken, user) {
    logger.error("mfaMethod: " + mfaMethod + "usrKOGID: " + usrKOGID + "mfaValue : " + mfaValue + "bearerToken :" + bearerToken);
    try {
        var URL = systemEnv.getProperty("esv.kyid.tenant.fqdn");
        var query = {
            "_queryFilter": 'KOGId eq "' + usrKOGID + '" and MFAMethod eq "' + mfaMethod + '" and MFAValue eq "' + mfaValue + '" and MFAStatus eq "' + "ACTIVE"
        };
        logger.error("Query is :: " + JSON.stringify(query))
        var roleNameResponse = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "' + "ACTIVE" + '" AND MFAValue eq "' + mfaValue + '"' });
        // var roleNameResponse = openidm.query("alpha_kyid_mfa_methods", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" and MFAMethod eq "' + mfaMethod + '" and MFAValue eq "' + mfaValue+  '" and MFAStatus eq "' + "ACTIVE"},["*"]);
        logger.error("roleNameResponse is " + JSON.stringify(roleNameResponse));
        roleNameResponse = JSON.parse(roleNameResponse);
        if (roleNameResponse.result.length > 0) {

            for (var i = 0; i < roleNameResponse.result.length; i++) {
                var mfamethodId = roleNameResponse.result[i]._id;
                if (mfaMethod === "SMSVOICE" || mfaMethod === "SYMANTEC" || mfaMethod === "SECONDARY_EMAIL") {
                    logger.error("Inside for Loop")

                    var patchJSONContent = [{ "operation": "add", "field": "MFAStatus", "value": "INACTIVE" }];
                    var patchedUser = ops.crudOps("patch", "alpha_kyid_mfa_methods", patchJSONContent, null, null, mfamethodId);
                    logger.error("patchedUser is " + patchedUser);
                    // openidm.patch("managed/alpha_kyid_mfa_methods/" + mfamethodId, null, [
                    //  { "operation": "add", "field": "MFAStatus", "value": "INACTIVE" }
                    //     ]);
                    if (patchedUser) {
                        return true;
                    }
                    else {
                        return false;
                    }

                }


                else if (mfaMethod === "PUSH") {
                    logger.error("Removing PUSH method")
                    requestURL = "https://" + URL + "/am/json/realms/root/realms/alpha/users/" + user + "/devices/2fa/push?_action=reset";
                    if (restAPItoResetDevice(bearerToken, requestURL)) {
                        var patchJSONContent = [{ "operation": "add", "field": "MFAStatus", "value": "INACTIVE" }];
                        var patchedUser = ops.crudOps("patch", "alpha_kyid_mfa_methods", patchJSONContent, null, null, mfamethodId);
                        if (patchedUser) {
                            return true
                        }
                        else {
                            return false
                        }

                    }

                }
                else if (mfaMethod === "TOTP") {
                    requestURL = URL + "/am/json/realms/root/realms/alpha/users/" + user + "/devices/2fa/oath?_action=reset";
                    var patchJSONContent = [{ "operation": "add", "field": "MFAStatus", "value": "INACTIVE" }];
                    var patchedUser = ops.crudOps("patch", "alpha_kyid_mfa_methods", patchJSONContent, null, null, mfamethodId);
                    if (patchedUser) {
                        return true
                    }
                    else {
                        return false
                    }


                }
            }
        }
        else {
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
            }
            else { return false };
        }
        else {
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
        logger.error("Phone Number is ::"+phoneNumber )
        if (phoneRegex.test(phoneNumber) === true) {
            var authCode = "Basic " + systemEnv.getProperty("esv.twilio.authorizationcode");
            logger.error("Auth Code is ::"+authCode)
            var options = {
                method: "GET",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": authCode.toString()
                }
            }

            var requestURL = "https://lookups.twilio.com/v2/PhoneNumbers/" + phoneNumber;

            var response = httpClient.send(requestURL, options).get();
            logger.error("validatePhoneNumber response is ::"+ response.text())
            var response = JSON.parse(response.text());
            if(response.valid === true){
                return true;
            }
            else {
                return false;
            }

        }
        else {
                return false;
            }



    } catch (error) {
        logger.error("Error Occured in KYID.2B1.Library.GenericUtils validatePhoneNumber function : " + error)
        return error;

    }


}


exports.getBusinessAppInfo = getBusinessAppInfo;
exports.removeMfaFactors = removeMfaFactors;
exports.validatePhoneNumber = validatePhoneNumber;
exports.getHelpdeskContactInfo = getHelpdeskContactInfo;


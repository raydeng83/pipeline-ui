var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
if (endpointExecution && endpointExecution === "true") {
    var mail = newObject.mail;
    var firstname = newObject.givenName;
    var lastname = newObject.sn;

    var phoneNumber = object.telephoneNumber;
    var inputFlag = null;

    isValidName(firstname, lastname);

    if (newObject.givenName && newObject.sn) {
        newObject.cn = newObject.givenName + " " + newObject.sn;
    } else if (newObject.givenName) {
        newObject.cn = newObject.givenName + " " + object.sn;
    } else if (newObject.sn) {
        newObject.cn = object.givenName + " " + newObject.sn;
    } else {
        newObject.cn = object.givenName + " " + object.sn;
    }

    isValidEmail(mail);
    if (newObject.custom_gender && newObject.custom_gender !== null)
        isValidGender(newObject.custom_gender.toLowerCase());
    if (phoneNumber && phoneNumber != null) {
        validatePhoneNumber(phoneNumber);
    }
    updateAuditFields();
}

function updateAuditFields() {
    //logger.error("Context Info =>" + JSON.stringify(context))
    var enableAuditLog = identityServer.getProperty("esv.enable.auditlogs");
    var currDateTime = new Date();
    var userId;
    var userFriendlyName;
    var updateAuditFields = true;
    var blindUpdate = false;

    if (enableAuditLog && enableAuditLog === "true") {
	   try {
            if(context && context.oauth2 && context.oauth2.rawInfo) {
				var invokedBy = context.oauth2.rawInfo.subname;
				var userLogon = context.oauth2.rawInfo.logon;
				var clientId = context.oauth2.rawInfo.client_id;
				if (invokedBy && (invokedBy === "idm-provisioning")) {
					//Updated by journey
					updateAuditFields = false;
				} else if (clientId && clientId === "idmAdminClient") {
					//Updated By Tenant Admin
					userId = context.oauth2.rawInfo.subname;
					userFriendlyName = "Tenant_Admin";
					blindUpdate = true;
				} else if (!userLogon || userLogon == null || userLogon === undefined) {
					//Updated by oauth client
					userId = context.oauth2.rawInfo.subname;
					userFriendlyName = "Application_Client";
				} else {
					//Updated by end user
					userId = context.oauth2.rawInfo.subname;
					userFriendlyName = context.oauth2.rawInfo.logon;
				}
			}
            else {
                userId = "System";
                userFriendlyName = "System";
            }
        } catch(error)
        {
            userId = "System";
            userFriendlyName = "System";
        }
		
        if (updateAuditFields && !blindUpdate) {
            if (!JSON.stringify(request).includes("custom_updatedByID")) {
                newObject.custom_updatedByID = userId;
            }
            if (!JSON.stringify(request).includes("custom_updatedBy")) {
                newObject.custom_updatedBy = userFriendlyName;
            }
            if (!JSON.stringify(request).includes("custom_updatedDateISO")) {
                newObject.custom_updatedDateISO = currDateTime.toISOString();
            }
            if (!JSON.stringify(request).includes("custom_updatedDateEpoch")) {
                newObject.custom_updatedDateEpoch = currDateTime.getTime();
            }
        } else if (updateAuditFields) {
            newObject.custom_updatedByID = userId;
            newObject.custom_updatedBy = userFriendlyName;
            newObject.custom_updatedDateISO = currDateTime.toISOString();
            newObject.custom_updatedDateEpoch = currDateTime.getTime();
        }
    }
	
}

function validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
    logger.debug("Phone Regex Outcome is " + phoneRegex.test(phoneNumber));
    if (phoneRegex.test(phoneNumber) == true) {
        var authCode = "Basic " + identityServer.getProperty("esv.twilio.authorizationcode");
        var params = {
            url: 'https://lookups.twilio.com/v2/PhoneNumbers/' + phoneNumber,
            method: 'GET',
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": authCode.toString()
            }

        }
        try {
            var response = openidm.action("external/rest", "call", params);

        } catch (error) {
            logger.error("Error Occurred while executing " + error)
            throw error.code ? error : { code: 400, message: 'Exception : Invalid Phone Number' };

        }
        response = JSON.parse(response);
        if (response.valid == false) {
            throw { code: 400, message: 'Exception : Phone Number not valid' };
        }
    }
    else {
        logger.error("Failed Phone Regex")
        throw { code: 400, message: 'Exception :  Phone Number not valid' };
    }
}

/**
 * Validates an email address:
 * - local + domain length ≤ 64 characters
 * - valid RFC 5321 format
 * - no local length restriction
 *
 * @param {string} email - The email to validate
 * @returns {boolean} - true if valid, false otherwise
 */
function isValidEmail(email) {
    logger.debug("Inside isValidEmail function");
    try {
        inputFlag = "email";
        var domains = checkRestrictedEntries(inputFlag);
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        const trimmedEmail = email.trim();

        if (trimmedEmail.length > 128) {
            logger.error("Email length exceeds 128 ");
            throw { code: 400, message: 'Exception : Email Length Exceeded' };
        } else {
            logger.debug("email length does not exceed 128 ");
            if (emailRegex.test(trimmedEmail) == true) {
                const parts = trimmedEmail.split('@');
                const [local, domain] = parts;

                //check if present in restricted entries
                if (domains.includes(domain)) {
                    logger.error("Email matches with restricted domain");
                    throw { code: 400, message: 'Exception : Invalid Email Format' };
                }
            } else {
                logger.error("Invalid email format");
                throw { code: 400, message: 'Exception : Invalid Email Format' };
            }
        }
    } catch (error) {
        logger.error("Exception caught in email validation: " + error.message);
        throw error.code ? error : { code: 400, message: 'Exception : Invalid Email Format' };
    }
}

function isValidName(firstname, lastname) {
    logger.debug("Inside check name function");
    try {
        inputFlag = "name";
        var keywords = checkRestrictedEntries(inputFlag);
        logger.error("checkKeywordsResponse : " + keywords);

        logger.error("firstname in checkinput: : " + firstname);
        logger.error("lastname in checkinput: : " + lastname);
        const regex = /^[^/{{{{\[\]:;|=,+*?<>\@"\\]}}}}+$/;
        logger.error("regex.test(firstname) : " + regex.test(firstname));
        logger.error("regex.test(lastname) : " + regex.test(lastname));
        if (regex.test(firstname) == false && !(firstname.length > 64) && regex.test(lastname) == false && !(lastname.length > 64)) {
            logger.error("input meets regex validation");
            if (keywords.includes(firstname) || keywords.includes(lastname)) {
                logger.error("input matches with keyword");
                throw { code: 400, message: 'Exception : Invalid Name' };
                //return true;
            } else {
                logger.error("input does not match with keyword");
                //return false;
            }
        } else {
            logger.error("input does not meet regex validation");
            throw { code: 400, message: 'Exception : Invalid Name' };
            //return true;
        }
    } catch (error) {
        logger.error("Exception : " + error);
        throw { code: 400, message: 'Exception : Invalid Name' };
    }
}

function checkRestrictedEntries(inputFlag) {
    logger.debug("Inside check restricted entries");
    try {
        logger.debug("input flag value : " + inputFlag);
        var keywordSet = [];
        var domainSet = [];
        var response = openidm.query("managed/alpha_kyid_restricted_entries/", { "_queryFilter": 'true' }, ["*"])
        logger.debug("response : " + response);

        if (inputFlag === "name") {
            const keywordsArray = response.result[0].restrictedKeywords;
            logger.debug("keywordsArray : " + keywordsArray);
            for (var i = 0; i < keywordsArray.length; i++) {
                var keyword = keywordsArray[i].keywords;//.toLowerCase();
                keywordSet.push(keyword);
            }
            return keywordSet;
        } else if (inputFlag === "email") {
            const domainArray = response.result[0].restrictedDomain;
            for (var i = 0; i < domainArray.length; i++) {
                var domain = domainArray[i].domain;//.toLowerCase();
                logger.error("domain : " + domain);
                domainSet.push(domain);
            }
            return domainSet;
        }
    } catch (error) {
        logger.error("Exception : " + error);
        throw { code: 400, message: 'Exception : ' + error };
    }
}

function isValidGender(gender) {
    logger.debug("Inside isValidGender function");
    try {
        logger.debug("Input gender: " + gender);
        if (gender !== 'male' && gender !== 'female' && gender !== 'other') {
            logger.error("Invalid gender value entered.");
            throw { code: 400, message: 'Exception : Gender value not supported, use \"Male/Female\"' };
        }
    } catch (error) {
        logger.error("Exception caught in validation: " + error.message);
        throw error.code ? error : { code: 400, message: 'Exception : Invalid Gender Format' };
    }
}
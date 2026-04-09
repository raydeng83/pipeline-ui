var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "UserProfile",
    script: "Script",
    scriptName: "KYID.2B1.Manage.Journey.Profile",
    errorLastName: "lastName_validation_failed",
    errorFirstName: "firstName_validation_failed",
    errorFirstNameLastName: "firstName_lastName_validation_failed",
    errorEmail: "email validation failed",
    errorId_lastNameValidation: "errorID::KYID005",
    errorId_firstNameValidation: "errorID:KYID006",
    errorId_emailValidation: "errorID:KYID007",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    INVALID_INPUT: "invalidName",
    ERROR: "error",
    BACK: "back",
    MAX_LIMIT: "max limit"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

function requestCallbacks() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Invoking requestCallback Function");

    try {
        callbacksBuilder.textOutputCallback(1, '{"pageHeader":"1_Update_Basic_Information"}'); 
        if (nodeState.get("errorMessage") != null) {
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>${nodeState.get("errorMessage")}</div>`);
        }
        if (nodeState.get("errorInvalidName") != null) {
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>${nodeState.get("errorInvalidName")}</div>`);
        }
        if(nodeState.get("orig_custom_title")){
    var title= nodeState.get("orig_custom_title")
    callbacksBuilder.textInputCallback("Title", title);
        }else {
            callbacksBuilder.textInputCallback("Title");
        }      
if(nodeState.get("orig_givenName")){
    var givenName = nodeState.get("orig_givenName")
    callbacksBuilder.textInputCallback("Legal first Name", givenName);
}else {
    callbacksBuilder.textInputCallback("Legal first Name");
}

if(nodeState.get("orig_custom_middleName")){
    var middleName = nodeState.get("orig_custom_middleName")
    callbacksBuilder.textInputCallback("Legal middle Name", middleName);
        }else {
            callbacksBuilder.textInputCallback("Legal middle Name");
        }

if(nodeState.get("orig_sn")){
    var lastName = nodeState.get("orig_sn")
    callbacksBuilder.textInputCallback("Legal last Name", lastName);
} else {
    callbacksBuilder.textInputCallback("Legal last Name");
}

        if(nodeState.get("orig_custom_suffix")){
var suffix = nodeState.get("orig_custom_suffix")
            callbacksBuilder.textInputCallback("Suffix", suffix);
        }else {
            callbacksBuilder.textInputCallback("Suffix");
        }
        
        if(nodeState.get("orig_custom_gender")){
            var gender = nodeState.get("orig_custom_gender")
            callbacksBuilder.textInputCallback("Gender", gender);
        } else {
            callbacksBuilder.textInputCallback("Gender");
        }
        if(nodeState.get("orig_custom_dateofBirth")){
            var dateOfBirth = nodeState.get("orig_custom_dateofBirth")
            callbacksBuilder.textInputCallback("BirthDate", dateOfBirth);
        }else {
            callbacksBuilder.textInputCallback("DateofBirth");
        }
        // if(nodeState.get("orig_languagePreference")){
        //     var languagePreference = nodeState.get("orig_languagePreference")
        //     callbacksBuilder.textInputCallback("LanguagePreference", languagePreference);
        // } else {
        //     callbacksBuilder.textInputCallback("LanguagePreference");
        // }

        if(nodeState.get("orig_frUnindexedString3")){
            var languagePreference = nodeState.get("orig_frUnindexedString3")
            callbacksBuilder.textInputCallback("LanguagePreference", languagePreference);
        } else {
            callbacksBuilder.textInputCallback("LanguagePreference");
        }

        
        if(nodeState.get("orig_postalAddress")){
            var postalAddress = nodeState.get("orig_postalAddress")
            callbacksBuilder.textInputCallback("Address1", postalAddress);
        } else {
            callbacksBuilder.textInputCallback("Address1");
        }
        if(nodeState.get("orig_custom_postalAddress2")){
            var postalAddress2 = nodeState.get("orig_custom_postalAddress2")
            callbacksBuilder.textInputCallback("Address2", postalAddress2);
        }else {
            callbacksBuilder.textInputCallback("Address2");
        }
        if(nodeState.get("orig_city")){
            var city = nodeState.get("orig_city")
            callbacksBuilder.textInputCallback("City", city);
        } else {
            callbacksBuilder.textInputCallback("City");
        }
         if(nodeState.get("orig_stateProvince")){
            var stateProvince = nodeState.get("orig_stateProvince")
            callbacksBuilder.textInputCallback("State", stateProvince);
        } else{
            callbacksBuilder.textInputCallback("State");
        }
        if(nodeState.get("orig_postalCode")){
            var postalCode = nodeState.get("orig_postalCode")
            callbacksBuilder.textInputCallback("ZipCode", postalCode);
        }else {
            callbacksBuilder.textInputCallback("ZipCode");
        }
        if(nodeState.get("orig_country")) {
            var country = nodeState.get("orig_country")
            callbacksBuilder.textInputCallback("Country", country);
        } else {
            callbacksBuilder.textInputCallback("Country");
        }
        if(nodeState.get("orig_custom_county")) {
            var county = nodeState.get("orig_custom_county")
            callbacksBuilder.textInputCallback("County", county);
        } else {
            callbacksBuilder.textInputCallback("County");
        }
       
        callbacksBuilder.textOutputCallback(0, "PrimaryEmail: " +nodeState.get("mail"));
        
        if(nodeState.get("orig_telephoneNumber")){
            callbacksBuilder.textOutputCallback(0, "MobileNumber: " +nodeState.get("orig_telephoneNumber"));
        }

        if (nodeState.get("orig_custom_zipExtension")) {
            var zipExt =  nodeState.get("orig_custom_zipExtension") ;
            callbacksBuilder.textInputCallback("Zip extension", zipExt);
        } else {
            callbacksBuilder.textInputCallback("Zip extension");
        }
        //callbacksBuilder.textOutputCallback(0, "MobileNumber: " +nodeState.get("orig_telephoneNumber"));
       // if(nodeState.get("orig_telephoneNumber")) {
       //      var telephoneNumber = nodeState.get("orig_telephoneNumber")
       //      callbacksBuilder.textInputCallback("MobileNumber", telephoneNumber);
       //  } else {
       //      callbacksBuilder.textInputCallback("MobileNumber");
       //  }
        
        callbacksBuilder.confirmationCallback(0, ["Update", "Back"], 1);
    } catch (error) {
        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in Request Callback Function::" + error);
        action.goTo(NodeOutcome.ERROR);
    }
}

function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Invoking handleUserResponses Function");

        var title = callbacks.getTextInputCallbacks().get(0).trim();
        var givenName = callbacks.getTextInputCallbacks().get(1).trim();
        var middleName = callbacks.getTextInputCallbacks().get(2).trim();
        var lastName = callbacks.getTextInputCallbacks().get(3).trim();
        var suffix = callbacks.getTextInputCallbacks().get(4).trim();
        var custom_gender = callbacks.getTextInputCallbacks().get(5).trim();
        var dateOfBirth = callbacks.getTextInputCallbacks().get(6).trim();
        //var languagePreference = callbacks.getTextInputCallbacks().get(7).trim();
        var frUnindexedString3 = callbacks.getTextInputCallbacks().get(7).trim();
        var postalAddress = callbacks.getTextInputCallbacks().get(8).trim();
        var postalAddress2 = callbacks.getTextInputCallbacks().get(9).trim();
        var city = callbacks.getTextInputCallbacks().get(10).trim();
        var stateProvince = callbacks.getTextInputCallbacks().get(11).trim();
        var postalCode = callbacks.getTextInputCallbacks().get(12).trim();
        var country = callbacks.getTextInputCallbacks().get(13).trim();
        var county = callbacks.getTextInputCallbacks().get(14).trim();
       // var telephoneNumber = callbacks.getTextInputCallbacks().get(15).trim();
        var zipExtension = callbacks.getTextInputCallbacks().get(15).trim();

        nodeState.putShared("custom_title", title);
        nodeState.putShared("givenName", givenName);
        nodeState.putShared("custom_middleName", middleName);
        nodeState.putShared("sn", lastName);
        nodeState.putShared("custom_suffix", suffix);
        nodeState.putShared("custom_gender", custom_gender);
        nodeState.putShared("custom_dateofBirth", dateOfBirth);
        nodeState.putShared("frUnindexedString3", frUnindexedString3);
        //nodeState.putShared("languagePreference", languagePreference);
        nodeState.putShared("postalAddress", postalAddress);
        nodeState.putShared("custom_postalAddress2", postalAddress2);
        nodeState.putShared("city", city);
        nodeState.putShared("stateProvince", stateProvince);
        nodeState.putShared("postalCode", postalCode);
        nodeState.putShared("country", country);
        nodeState.putShared("custom_county", county);
       // nodeState.putShared("telephoneNumber", telephoneNumber);
        nodeState.putShared("custom_zipExtension", zipExtension);

        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        if (selectedOutcome === 1) {
            action.goTo(NodeOutcome.BACK);
        } else {
            var checkGivenName = isValidName(givenName);
            var checkLastName = isValidName(lastName);
            var checkMiddleName = isValidName(middleName);

            if ((checkGivenName && checkLastName && checkMiddleName && isValidDateOfBirth(dateOfBirth) && isValidZip(postalCode) && isAlpha(city) && isAlpha(stateProvince) && isAlpha(country) && postalAddress.length !== 0)) {
                  nodeState.putShared("errorMessage", null);
                nodeState.putShared("errorInvalidName", null);
                logger.debug("going to next");
                action.goTo(NodeOutcome.NEXT);
            }

            // Additional field validations
        //    else if (!isValidDateOfBirth(dateOfBirth)|| postalAddress.length === 0 || !isAlpha(city) || !isAlpha(stateProvince) || !isValidZip(postalCode) || !isAlpha(country)|| !isValidPhone(telephoneNumber)|| !checkGivenName || !checkLastName || !checkMiddleName) {
        //         action.goTo(NodeOutcome.INVALID_INPUT);
        //     }
           else if (postalAddress.length === 0) {
                nodeState.putShared("errorMessage", "Address1_is_required");
               logger.debug("wrong postal address");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
           else if (!isAlpha(city) || city.length === 0) {
                nodeState.putShared("errorMessage", "Invalid_city");
                              logger.debug("wrong city");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
           else if (!isAlpha(stateProvince) || stateProvince.length === 0) {
                nodeState.putShared("errorMessage", "Invalid_state");
               logger.debug("Invalid state");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
            else if (!isValidZip(postalCode) || postalCode.length === 0) {
                nodeState.putShared("errorMessage", "Invalid_ZIP_code");
                logger.debug("Invalid zip");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
            else if (!isAlpha(country) || country.length === 0) {
                nodeState.putShared("errorMessage", "Invalid_country");
                logger.debug("Invalid country");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
                else if (!isAlpha(county) || county.length === 0) {
                nodeState.putShared("errorMessage", "Invalid_county");
                logger.debug("Invalid county");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
            // else if (!isValidPhone(telephoneNumber) || telephoneNumber.length === 0) {
            //     nodeState.putShared("errorMessage", "Invalid mobile number.");
            //     logger.error("Invalid phn");
            //     action.goTo(NodeOutcome.INVALID_INPUT);
            // }
                else if (!isValidDateOfBirth(dateOfBirth)) {
                nodeState.putShared("errorMessage", "Invalid_dob");
                    logger.debug("failing in dob")
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
            else if (!checkGivenName) {
                nodeState.putShared("errorMessage", "Invalid_first_name");
                nodeState.putShared("errorInvalidName", nodeConfig.errorFirstName);
                logger.debug("Invalid givenName");
                action.goTo(NodeOutcome.INVALID_INPUT);
            } else if (!checkLastName) {
                nodeState.putShared("errorMessage", "Invalid_last_name");
                nodeState.putShared("errorInvalidName", nodeConfig.errorLastName);
                logger.debug("Invalid lastName");
                action.goTo(NodeOutcome.INVALID_INPUT);
            } else if (!checkMiddleName) {
                nodeState.putShared("errorMessage", "Invalid_middle_name");
                nodeState.putShared("errorInvalidName", nodeConfig.errorFirstNameLastName);
                logger.debug("Invalid middleName");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in handleUserResponses Function::" + error);
        action.goTo(NodeOutcome.ERROR);
    }
}

// Reusable validation helpers
// function isValidName(name) {
//     return /^[a-zA-Z ,.'-]+$/.test(name);
// }

function isValidName(name) {
    inputFlag = "name";
    var lib = require('KYID.2B1.Library.RestrictedEntriesLibraryScript');
   
    var restrictedEntries = lib.checkRestrictedEntries(inputFlag);
    logger.debug("restrictedEntries response : "+restrictedEntries);
    var checkUserInput = lib.checkName(name,restrictedEntries);
    logger.debug("checkUserInput response : "+checkUserInput);
    if(checkUserInput == true){
        return false;
    }else{
        return true;
    }
}

function isValidDateOfBirth(dob) {
    var regex = /^\d{4}-\d{2}-\d{2}$/;
    //his ensures the input string is in "YYYY-MM-DD" format 
    // if (!regex.test(dob)) return false;
    // var parts = dob.split("-");
    // var date = new Date(parts[2], parts[0] - 1, parts[1]);
    // return date.getMonth() + 1 === parseInt(parts[0]) &&
    //        date.getDate() === parseInt(parts[1]) &&
    //        date.getFullYear() === parseInt(parts[2]);
  return  regex.test(dob);
}

// function isValidZip(zip) {
//     return /^\d{6}(-\d{4})?$/.test(zip);
// }

function isValidZip(zip) {
    // return /^[1-9]\d{0,4}$/.test(String(zip));
    return true
}

function isValidPhone(phone) {
    const phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
    return phoneRegex.test(phone);
}

function isAlpha(value) {
    return /^[a-zA-Z ,.'-]+$/.test(value);
}

if (callbacks.isEmpty()) {
    requestCallbacks();
} else {
    handleUserResponses();
}
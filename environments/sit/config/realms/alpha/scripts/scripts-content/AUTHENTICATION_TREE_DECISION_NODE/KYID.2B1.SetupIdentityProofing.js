var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "UserProfile",
    script: "Script",
    scriptName: "Duplicate_KYID.2B1.SetupIdentityProofing",
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
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Invoking requestCallback Function");

    try {
        if (nodeState.get("errorMessage") != null) {
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>${nodeState.get("errorMessage")}</div>`);
        }
        if (nodeState.get("errorInvalidName") != null) {
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>${nodeState.get("errorInvalidName")}</div>`);
        }


    callbacksBuilder.textOutputCallback(1, '{"pageHeader":"Setup_IDProofing"}'); 

        
    if (nodeState.get("givenName")){
    var givenName = nodeState.get("givenName")
    callbacksBuilder.textInputCallback("Legal first Name",givenName);
} else {
    callbacksBuilder.textInputCallback("Legal first Name");
}

if (nodeState.get("custom_middleName")){
    var custom_middleName = nodeState.get("custom_middleName")
    callbacksBuilder.textInputCallback("Legal middle Name",custom_middleName);
} else {
    callbacksBuilder.textInputCallback("Legal middle Name");
}

if (nodeState.get("lastName")){
    var lastName = nodeState.get("lastName")
    callbacksBuilder.textInputCallback("Legal last Name",lastName);
} else {
    callbacksBuilder.textInputCallback("Legal last Name");
}

if (nodeState.get("custom_gender")){
    var custom_gender = nodeState.get("custom_gender")
    callbacksBuilder.textInputCallback("Gender",custom_gender);
} else {
    callbacksBuilder.textInputCallback("Gender");
}

if (nodeState.get("custom_dateofBirth")){
    var custom_dateofBirth = nodeState.get("custom_dateofBirth")
    callbacksBuilder.textInputCallback("DateofBirth",custom_dateofBirth);
} else {
    callbacksBuilder.textInputCallback("DateofBirth");
}

if (nodeState.get("postalAddress")){
    var postalAddress = nodeState.get("postalAddress")
    callbacksBuilder.textInputCallback("Address1",postalAddress);
} else {
    callbacksBuilder.textInputCallback("Address1");
}  


if (nodeState.get("custom_postalAddress2")){
    var custom_postalAddress2 = nodeState.get("custom_postalAddress2")
    callbacksBuilder.textInputCallback("Address2",custom_postalAddress2);
} else {
    callbacksBuilder.textInputCallback("Address2");
}  

if (nodeState.get("city")){
    var city = nodeState.get("city")
    callbacksBuilder.textInputCallback("City",city);
} else {
    callbacksBuilder.textInputCallback("City");
} 

if (nodeState.get("stateProvince")){
    var stateProvince = nodeState.get("stateProvince")
    callbacksBuilder.textInputCallback("State",stateProvince);
} else {
    callbacksBuilder.textInputCallback("State");
} 

if (nodeState.get("postalCode")){
    var postalCode = nodeState.get("postalCode")
    callbacksBuilder.textInputCallback("ZipCode",postalCode);
} else {
    callbacksBuilder.textInputCallback("ZipCode");
} 

if (nodeState.get("county")){
    var county = nodeState.get("county")
    callbacksBuilder.textInputCallback("County",county);
} else {
    callbacksBuilder.textInputCallback("County");
} 

if (nodeState.get("zipExtension")){
    var zipExtension = nodeState.get("zipExtension")
    callbacksBuilder.textInputCallback("zipExtension",zipExtension);
} else {
    callbacksBuilder.textInputCallback("zipExtension");
} 

if (nodeState.get("driversLicense")){
    var driversLicense = nodeState.get("driversLicense")
    callbacksBuilder.textInputCallback("driversLicense",driversLicense);
} else {
    callbacksBuilder.textInputCallback("driversLicense");
} 

if (nodeState.get("custom_suffix")){
    var suffix = nodeState.get("custom_suffix")
    callbacksBuilder.textInputCallback("suffix",suffix);
} else {
    callbacksBuilder.textInputCallback("suffix");
} 


 if (nodeState.get("socialSecurityNumber")){
    var socialSecurityNumber = nodeState.get("socialSecurityNumber")
    callbacksBuilder.textInputCallback("socialSecurityNumber",socialSecurityNumber);
} else {
    callbacksBuilder.textInputCallback("socialSecurityNumber");
}         
        
callbacksBuilder.confirmationCallback(0, ["Save","Cancel"], 0);
       
        
} 
catch (error) {
        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in Request Callback Function::" + error);
        action.goTo(NodeOutcome.ERROR);
    }
}

function handleUserResponses() {
    nodeState.putShared("errorMessage", null);
    try {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Invoking handleUserResponses Function");


        var givenName = callbacks.getTextInputCallbacks().get(0).trim();
        var middleName = callbacks.getTextInputCallbacks().get(1).trim();
        var lastName = callbacks.getTextInputCallbacks().get(2).trim();
        //var suffix = callbacks.getTextInputCallbacks().get(3).trim();
        var custom_gender = callbacks.getTextInputCallbacks().get(3).trim();
        var dateOfBirth = callbacks.getTextInputCallbacks().get(4).trim();
        //var socialSecurityNumber = callbacks.getTextInputCallbacks().get(6).trim();
        var postalAddress = callbacks.getTextInputCallbacks().get(5).trim();
        var postalAddress2 = callbacks.getTextInputCallbacks().get(6).trim();
        var city = callbacks.getTextInputCallbacks().get(7).trim();
        var stateProvince = callbacks.getTextInputCallbacks().get(8).trim();
        var postalCode = callbacks.getTextInputCallbacks().get(9).trim();
        var county = callbacks.getTextInputCallbacks().get(10).trim();
        var zipExtension = callbacks.getTextInputCallbacks().get(11).trim();
        var driversLicense = callbacks.getTextInputCallbacks().get(12).trim();
        var suffix = callbacks.getTextInputCallbacks().get(13).trim();
        var socialSecurityNumber = callbacks.getTextInputCallbacks().get(14).trim();
       // var country = callbacks.getTextInputCallbacks().get(12).trim();

        nodeState.putShared("givenName", givenName);
        nodeState.putShared("custom_middleName", middleName);
        nodeState.putShared("lastName", lastName);
       // nodeState.putShared("custom_suffix", suffix);
        nodeState.putShared("custom_gender", custom_gender);
        nodeState.putShared("custom_dateofBirth", dateOfBirth);
       // nodeState.putShared("socialSecurityNumber", socialSecurityNumber);
        nodeState.putShared("postalAddress", postalAddress);
        nodeState.putShared("custom_postalAddress2", postalAddress2);
        nodeState.putShared("city", city);
        nodeState.putShared("stateProvince", stateProvince);
        nodeState.putShared("postalCode", postalCode);
        nodeState.putShared("county", county);
        nodeState.putShared("zipExtension", zipExtension);
        nodeState.putShared("driversLicense", driversLicense);
        nodeState.putShared("custom_suffix", suffix);
        nodeState.putShared("socialSecurityNumber", socialSecurityNumber);

        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        if (selectedOutcome === 1){
            logger.error("user has selected back from RIDP screen")
            nodeState.putShared("backfromridp","backfromridp")
            action.goTo("back")
        }
        else {
    var outcome = null;
    var errorMsgs = []; 
    logger.error("user wants to go next");

    var checkGivenName = isValidName(givenName);
    var checkLastName = isValidName(lastName);
    var checkMiddleName = isValidName(middleName);

    if (givenName.length == 0) {
        errorMsgs.push("First name is required.");
    } else if (!checkGivenName) {
        errorMsgs.push("Invalid first name.");
    }

    if (lastName.length == 0) {
        errorMsgs.push("Last name is required.");
    } else if (!checkLastName) {
        errorMsgs.push("Invalid last name.");
    }

    if (middleName.length != 0 && !checkMiddleName) {
        errorMsgs.push("Invalid middle name.");
    }

    if (dateOfBirth.length == 0) {
        errorMsgs.push("Date of birth is required.");
    } else if (!isValidDateOfBirth(dateOfBirth)) {
        errorMsgs.push("Invalid date of birth.");
    }

    if (postalAddress.length != 0 && postalAddress.length > 500) {
        errorMsgs.push("Invalid Address1.");
    }

    if (postalAddress2.length != 0 && postalAddress2.length > 500) {
        errorMsgs.push("Invalid Address2.");
    }

    if (city.length != 0 && city.length >128) {
        errorMsgs.push("Invalid City.");
    }

    if (stateProvince.length != 0 && (!isAlpha(stateProvince) || stateProvince.length > 128)) {
        errorMsgs.push("Invalid State.");
    }

    if (postalCode.length != 0 && (!isValidZip(postalCode) || postalCode.length > 40)) {
        errorMsgs.push("Invalid ZIP Code.");
    }

    if (county.length != 0 && !isAlpha(county)) {
        errorMsgs.push("Invalid County.");
    }

    if (zipExtension.length != 0 && !isMaxlength40(zipExtension)) {
        errorMsgs.push("Invalid Zip Extension.");
    }

    if (socialSecurityNumber.length != 0 && !isMaxValidSsn(socialSecurityNumber)) {
        errorMsgs.push("Invalid SSN.");
    }

    // Final
    if (errorMsgs.length > 0) {
        nodeState.putShared("errorMessage", errorMsgs.join(" ")); 
        nodeState.putShared("backfromridp", null);
        outcome = NodeOutcome.INVALID_INPUT;
    } else {
        nodeState.putShared("errorMessage", null);
        nodeState.putShared("errorInvalidName", null);
        nodeState.putShared("organDonor", "true");
        nodeState.putShared("backfromridp", null);
        logger.error("going to next");
        outcome = NodeOutcome.NEXT;
    }

    action.goTo(outcome);
}
   }
    catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in handleUserResponses Function::" + error);
        nodeState.putShared("backfromridp",null)
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
    logger.error("restrictedEntries response : "+restrictedEntries);
    var checkUserInput = lib.checkName(name,restrictedEntries);
    logger.error("checkUserInput response : "+checkUserInput);
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

function isValidZip(zip) {
    // return /^\d{5}(-\d{4})?$/.test(zip);
    return true
}

function isValidPhone(phone) {
    const phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
    return phoneRegex.test(phone);
}

function isAlpha(value) {
    return /^[a-zA-Z ,.'-]+$/.test(value);
}

function isMaxlength40(value){
    logger.error("Inside max 40 length check")
    return /^[\s\S]{1,40}$/.test(value);
}

function isMaxlength500(value){
    logger.error("Inside max 500 length check")
    return /^[\s\S]{1,500}$/.test(value);
}

function isMaxlength128(value){
    logger.error("Inside max 128 length check")
    return /^[\s\S]{1,128}$/.test(value);
}

function isMaxValidSsn(value){
    return /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/.test(value);
}



if (callbacks.isEmpty()) {
    requestCallbacks();
} else {
    handleUserResponses();
}
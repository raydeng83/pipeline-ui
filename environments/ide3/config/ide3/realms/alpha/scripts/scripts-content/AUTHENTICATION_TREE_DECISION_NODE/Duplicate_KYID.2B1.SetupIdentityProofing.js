var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "UserProfile",
    script: "Script",
    scriptName: "KYID.2B1.SetupIdentityProofing",
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
        
    callbacksBuilder.confirmationCallback(0, ["Save","Cancel"], 0);
    } catch (error) {
        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in Request Callback Function::" + error);
        action.goTo(NodeOutcome.ERROR);
    }
}

function handleUserResponses() {
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

        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        if (selectedOutcome === 1){
            logger.error("user has selected back from RIDP screen")
            nodeState.putShared("backfromridp","backfromridp")
            action.goTo("back")
        }
        else {
            logger.error("user wants to go next")
            var checkGivenName = isValidName(givenName);
            var checkLastName = isValidName(lastName);
            var checkMiddleName = isValidName(middleName);

           // if (checkGivenName && checkLastName && checkMiddleName && isValidDateOfBirth(dateOfBirth) && isValidZip(postalCode) && isAlpha(city) && (postalAddress.length !== 0) && isAlpha(county) && (county.length !== 0) ) {
            if (givenName.length!=0 && lastName.length!=0  && dateOfBirth.length!=0 && checkGivenName && checkLastName && isValidDateOfBirth(dateOfBirth)) {
                // if state is not null the validate the state
                if(stateProvince.length!=0){
                    if (!isAlpha(stateProvince)) {  
                    nodeState.putShared("errorMessage", "Invalid_state");
                    logger.error("Invalid state");
                    nodeState.putShared("backfromridp",null)
                    action.goTo(NodeOutcome.INVALID_INPUT);
                    }
                }
                // if zip code is not null the validate it
                if(postalCode.length!=0){
                    if (!isValidZip(postalCode)) {  
                    nodeState.putShared("errorMessage", "Invalid_ZIP_code");
                    logger.error("Invalid zip");
                    nodeState.putShared("backfromridp",null)
                    action.goTo(NodeOutcome.INVALID_INPUT);
                    }
                }
                
                // if county is not null then validate it
                if(county.length!=0){
                    if (!isAlpha(county)) {  
                    nodeState.putShared("errorMessage", "Invalid_county");
                    logger.error("Invalid county");
                    nodeState.putShared("backfromridp",null)
                    action.goTo(NodeOutcome.INVALID_INPUT);
                    }
                }

                // if middle name is not null then validate it
                if(middleName.length!=0){
                    if (!checkMiddleName) {  
                    nodeState.putShared("errorMessage", "Invalid_middle_name");
                    nodeState.putShared("errorInvalidName", nodeConfig.errorFirstNameLastName);
                    logger.error("Invalid middleName");
                    nodeState.putShared("backfromridp",null)
                    action.goTo(NodeOutcome.INVALID_INPUT);
                    }
                }

                else{
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("errorInvalidName", null);
                    nodeState.putShared("organDonor","true")
                    nodeState.putShared("backfromridp",null)
                    logger.error("going to next");
                    action.goTo(NodeOutcome.NEXT);
                }
                
             }
            else if(givenName.length==0){
                nodeState.putShared("errorMessage", "firstName_is_required");
                logger.error("empty firstName");
                nodeState.putShared("errorInvalidName", null);
                nodeState.putShared("backfromridp",null)
                action.goTo(NodeOutcome.INVALID_INPUT);       
            }
            else if(lastName.length==0){
                nodeState.putShared("errorMessage", "lastName_is_required");
                logger.error("empty lastName");
                nodeState.putShared("errorInvalidName", null);
                nodeState.putShared("backfromridp",null)
                action.goTo(NodeOutcome.INVALID_INPUT);  
            }  
            else if(dateOfBirth.length==0){
                nodeState.putShared("errorMessage", "dateOfBirth_is_required");
                logger.error("empty DOB");
                nodeState.putShared("errorInvalidName", null);
                nodeState.putShared("backfromridp",null)
                action.goTo(NodeOutcome.INVALID_INPUT);   
            }
            else if (!checkGivenName) {
                nodeState.putShared("errorMessage", "Invalid_first_name");
                nodeState.putShared("errorInvalidName", nodeConfig.errorFirstName);
                logger.error("Invalid givenName");
                nodeState.putShared("backfromridp",null)
                action.goTo(NodeOutcome.INVALID_INPUT);
            } else if (!checkLastName) {
                nodeState.putShared("errorMessage", "Invalid_last_name");
                nodeState.putShared("errorInvalidName", nodeConfig.errorLastName);
                logger.error("Invalid lastName");
                nodeState.putShared("backfromridp",null)
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
            
            else if (!isValidDateOfBirth(dateOfBirth)) {
                nodeState.putShared("errorMessage", "Invalid_dob");
                logger.error("failing in dob")
                nodeState.putShared("backfromridp",null)
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
             
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
    return /^\d{5}(-\d{4})?$/.test(zip);
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
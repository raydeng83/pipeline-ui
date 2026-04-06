var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
//var organDonor = nodeState.putShared("orig_organPreference","true");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "UserProfile",
    script: "Script",
    scriptName: "KYID.2B1.Manage.Journey.Profile.Organ.Donor",
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
    INVALID_EMAIL: "invalidEmail",
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

function auditLog(code, message){
    var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                // var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                    userId = existingSession.get("UserId")
                }else if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log update Personal info updated "+ error)
         action.goTo(NodeOutcome.SUCCESS);
    }
    
}

function getPhoneOptions(usrKOGID){
     try {
        var response = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAStatus eq "ACTIVE" AND MFAMethod eq "SMSVOICE" ' });
        logger.debug("user response is --> " + JSON.stringify(response))
        var mfaValues = [];
        if (response && response.result && response.resultCount>0) {
            for (var i = 0; i < response.result.length; i++) {
                var entry = response.result[i];
                if (entry.MFAValue) {
                    mfaValues.push(entry.MFAValue);
                }
            }
        }
        if (mfaValues && mfaValues.length>0) {
            return mfaValues;
        }else {
            logger.debug("Inside else condition")
            return false
        }
 
 
    } catch (error) {
        logger.error("Error Occurred while getUserDetails" + error)
        return null;
    } 
}

function isValidPhone(phone) {
    var validatePhoneLib = require("KYID.2B1.Library.GenericUtils");
    var isPhoneValid = validatePhoneLib.validatePhoneNumber(phone);
    //const phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
    return isPhoneValid;
}

function requestCallbacks() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Invoking requestCallback Function");
    try {
       callbacksBuilder.textOutputCallback(1, '{"pageHeader":"1_Update_Organ_Donor"}'); 
        if (nodeState.get("errorMessage") != null) {
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + error + `</div>`);
        }
        if (nodeState.get("errorInvalidName") != null) {
            var errorInvalidName = nodeState.get("errorInvalidName");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>` + errorInvalidName + `</div>`);
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

        if (nodeState.get("isHomeless")) {
            var isHomeless = nodeState.get("isHomeless");
            callbacksBuilder.textInputCallback("isHomeless", isHomeless);
        } else {
            callbacksBuilder.textInputCallback("isHomeless"),"false";
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
        if(nodeState.get("orig_postalCode")){
            var postalCode = nodeState.get("orig_postalCode")
            callbacksBuilder.textInputCallback("ZipCode", postalCode);
        }else {
            callbacksBuilder.textInputCallback("ZipCode");
        }


        if (nodeState.get("orig_custom_county") || nodeState.get("orig_county")) {
            var county = nodeState.get("orig_custom_county") || nodeState.get("orig_county");
            callbacksBuilder.textInputCallback("County", county);
        } else {
            callbacksBuilder.textInputCallback("County");
        }

        
        // if(nodeState.get("orig_county")) {
        //     var county = nodeState.get("orig_county")
        //     callbacksBuilder.textInputCallback("County", county);
        // } else {
        //     callbacksBuilder.textInputCallback("County");
        // }

        
        if(nodeState.get("orig_stateProvince")){
            var stateProvince = nodeState.get("orig_stateProvince")
            callbacksBuilder.textInputCallback("State", stateProvince);
        } else{
            callbacksBuilder.textInputCallback("State");
        }

        if (nodeState.get("postalExtension") || nodeState.get("orig_custom_zipExtension")) {
            var zipExt =  nodeState.get("orig_custom_zipExtension") || nodeState.get("postalExtension") ;
            callbacksBuilder.textInputCallback("zipExtension", zipExt);
        } else {
            callbacksBuilder.textInputCallback("zipExtension");
        }
        
        //callbacksBuilder.textInputCallback("zipExtension");
        callbacksBuilder.textInputCallback("driversLicense");
        //callbacksBuilder.textInputCallback("Social Security Number");

        // if (nodeState.get("orig_custom_title")) {
        //     var title = nodeState.get("orig_custom_title");
        //     callbacksBuilder.textInputCallback("Title", title);
        // } else {
        //     callbacksBuilder.textInputCallback("Title");
        // }

        // if (nodeState.get("orig_custom_suffix")) {
        //     var suffix = nodeState.get("orig_custom_suffix");
        //     callbacksBuilder.textInputCallback("suffix", suffix);
        // } else {
        //     callbacksBuilder.textInputCallback("suffix");
        // }

        // if (nodeState.get("mail")) {
        //         var mail = nodeState.get("mail");
        //         logger.debug("mail is :: => "+ mail)
        //         callbacksBuilder.textOutputCallback(0,`Email : ${mail}`);
        // }

        //  var phoneArray = []
        // if(nodeState.get("KOGID")!== null && nodeState.get("KOGID")){
        //     phoneArray = getPhoneOptions(nodeState.get("KOGID"))   
        // }
        // if (phoneArray.length>0 ) {
        //     nodeState.putShared("phoneArray",phoneArray)
        //     var prompt = "Mobile Number"
        //     callbacksBuilder.choiceCallback(`${prompt}`, phoneArray, 0 ,false) 
        // } else {
        //       if (nodeState.get("orig_telephoneNumber")) {
        //         var telephoneNumber = nodeState.get("orig_telephoneNumber");
        //         callbacksBuilder.textInputCallback("Mobile Number*", telephoneNumber);
        //     } else {
        //         callbacksBuilder.textInputCallback("Mobile Number*");
        //     }
        //  }

// if(nodeState.get("orig_country")) {
//             var country = nodeState.get("orig_country")
//             callbacksBuilder.textInputCallback("Country", "US");
//         } else {
//             callbacksBuilder.textInputCallback("Country","US");
        // }
        
        var promptMessage = "do_you_agree_for_organ_donor";
        var options = ["agree", "donotagree"];
        callbacksBuilder.choiceCallback(promptMessage, options, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Update", "Back"], 1);

        //FAQ topic
     var lib = require("KYID.Library.FAQPages");
    var process ="OrganDonor";
    var pageHeader= "1_Update_Organ_Donor";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);

    if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
        
    } catch (error) {
        logger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error Occurred in Request Callback Function " + "::" + error);
        action.goTo(NodeOutcome.ERROR);
    }
}

function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Invoking handleUserResponses Function");

        // if (isNameEditable == "true") {
        
           
            var givenName = callbacks.getTextInputCallbacks().get(0).trim();
            var middleName = callbacks.getTextInputCallbacks().get(1).trim();
            var lastName = callbacks.getTextInputCallbacks().get(2).trim();
            var custom_gender = callbacks.getTextInputCallbacks().get(3).trim();
            var dateOfBirth = callbacks.getTextInputCallbacks().get(4).trim();
            var isHomeless = callbacks.getTextInputCallbacks().get(5);
            var postalAddress = callbacks.getTextInputCallbacks().get(6).trim();
            var postalAddress2 = callbacks.getTextInputCallbacks().get(7).trim();
            var city = callbacks.getTextInputCallbacks().get(8).trim();
            var postalCode = callbacks.getTextInputCallbacks().get(9).trim();
            var county = callbacks.getTextInputCallbacks().get(10).trim();
            var stateProvince = callbacks.getTextInputCallbacks().get(11).trim();
            var zipExtension = callbacks.getTextInputCallbacks().get(12).trim();
            var driversLicense = callbacks.getTextInputCallbacks().get(13).trim();
            // var country = callbacks.getTextInputCallbacks().get(14).trim();
            //var ssn = callbacks.getTextInputCallbacks().get(13);
            //var country = callbacks.getTextInputCallbacks().get(9).trim();\
            //var title = callbacks.getTextInputCallbacks().get(13);
            //var suffix  = callbacks.getTextInputCallbacks().get(14);
            //var selectedIndex = null;
            var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0]; 
            logger.debug("selectedIndex is :: "+ selectedIndex)
            var userInfoJSON = {};
        
            // Store in shared state with consistent keys
           
            nodeState.putShared("givenName", givenName);
            nodeState.putShared("custom_middleName", middleName);
            nodeState.putShared("sn", lastName);
            nodeState.putShared("custom_gender", custom_gender);
            nodeState.putShared("custom_dateofBirth", dateOfBirth);
            nodeState.putShared("isHomeless", isHomeless);
            nodeState.putShared("postalAddress", postalAddress);
            nodeState.putShared("custom_postalAddress2", postalAddress2);
            nodeState.putShared("city", city);
            nodeState.putShared("postalCode", postalCode);
            nodeState.putShared("custom_county", county);
            nodeState.putShared("county", county);
            nodeState.putShared("stateProvince", stateProvince);
            nodeState.putShared("zipExtension", zipExtension);
            nodeState.putShared("driversLicense", driversLicense);
            nodeState.putShared("country", "US");
             nodeState.putShared("orig_custom_country", "US");
           // nodeState.putShared("custom_title", title);
            //nodeState.putShared("custom_suffix", suffix);
            //nodeState.putShared("ssn", ssn);
            
        
           // nodeState.putShared("organDonor",organDonor)
            // if(nodeState.get("phoneArray")!== null && nodeState.get("phoneArray")){
            //     var phoneArray = []
            //     var phoneArray = nodeState.get("phoneArray")
            //     if(phoneArray.length>0){
            //         var telephoneNumberCallback = callbacks.getChoiceCallbacks().get(0)[0];
            //         selectedIndex = callbacks.getChoiceCallbacks().get(1)[0]; 
            //         var telephoneNumber = phoneArray[telephoneNumberCallback]
            //         //var terms = callbacks.getChoiceCallbacks().get(1)[0];
            //     }else{
            //         var telephoneNumber = callbacks.getTextInputCallbacks().get(16);
            //         selectedIndex = callbacks.getChoiceCallbacks().get(0)[0]; 
            //         //var terms = callbacks.getChoiceCallbacks().get(1)[0];
            //         //var terms = callbacks.getChoiceCallbacks().get(0)[0];
            //     }    
            // }else{
            //         var telephoneNumber = callbacks.getTextInputCallbacks().get(16);
            //         selectedIndex = callbacks.getChoiceCallbacks().get(0)[0]; 
            //         //var terms = callbacks.getChoiceCallbacks().get(0)[0];
            // }
        
        //Selecting the update or back
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if (selectedOutcome === 1) {
            nodeState.putShared("back","true");
            action.goTo(NodeOutcome.BACK);
        } else {
            var options = ["agree", "donotagree"];
            var selectedValue = options[selectedIndex];

    if (selectedValue === "agree") {
        nodeState.putShared("orig_organDonorRegistrationStatus","true")
        nodeState.putShared("organDonorStatus",true)
        logger.debug("user clicks on agree")
         var checkGivenName = isValidName(givenName);
         var checkLastName = isValidName(lastName);
         var checkMiddleName = isValidName(middleName);
         //var checkTelephoneNumber = isValidPhone(telephoneNumber)

           // if (checkGivenName && checkLastName && checkMiddleName && isValidDateOfBirth(dateOfBirth) && isValidZip(postalCode) && isAlpha(city) && (postalAddress.length !== 0) && isAlpha(county) && (county.length !== 0) ) {
           //  if (checkGivenName && checkLastName && isValidDateOfBirth(dateOfBirth) && isValidZip(postalCode) && isAlpha(city) && (postalAddress.length !== 0) && checkTelephoneNumber) {
                  // if (checkGivenName && checkLastName && isValidDateOfBirth(dateOfBirth) && isValidZip(postalCode) && isAlpha(city) && (postalAddress.length !== 0)) {
                 // if (checkGivenName && checkLastName && isValidDateOfBirth(dateOfBirth) && isValidZip(postalCode) && isAlpha(city) ) {
                    if (checkGivenName && checkLastName && isValidDateOfBirth(dateOfBirth) && isAlpha(city) ) {
                  userInfoJSON["givenName"] = givenName;
                  userInfoJSON["middleName"] = middleName || null;
                  userInfoJSON["sn"] = lastName;
                  userInfoJSON["gender"] = custom_gender;
                  userInfoJSON["dob"] = dateOfBirth;
                 // userInfoJSON["ssn"] = ssn || null;
                  userInfoJSON["postalAddress"] = postalAddress;
                  userInfoJSON["postalAddress2"] = postalAddress2;
                  userInfoJSON["stateProvince"] = stateProvince;
                  userInfoJSON["postalCode"] = postalCode;
                  userInfoJSON["postalExtension"] = zipExtension;
                  //userInfoJSON["country"] = country;
                  userInfoJSON["county"] = county;
                  userInfoJSON["city"] = city;
                  userInfoJSON["mail"] = nodeState.get("mail") || ""
                  userInfoJSON["country"] = "US"
                  //userInfoJSON["telephoneNumber"] = telephoneNumber;
                  //userInfoJSON["title"] = title;
                 // userInfoJSON["suffix"] = suffix;
                  //userInfoJSON["mail"] = nodeState.get("collectedPrimaryEmail");

                  nodeState.putShared("userInfoJSON", userInfoJSON)
                  nodeState.putShared("errorMessage", null);
                  nodeState.putShared("errorInvalidName", null);
                  nodeState.putShared("organDonor","true")
                  nodeState.putShared("journeyName","organdonor")
                  logger.debug("going to next");
                  action.goTo(NodeOutcome.NEXT);
            }else if (postalAddress.length === 0) {
                nodeState.putShared("errorMessage", "Address1_is_required");
                logger.debug("wrong postal address");
                nodeState.putShared("errorInvalidName", null);
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
           else if (!isAlpha(city) || city.length === 0) {
                nodeState.putShared("errorMessage", "Invalid_city");
                logger.debug("wrong city");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
                else if (!isAlpha(county)) {
                nodeState.putShared("errorMessage", "Invalid_county");
                logger.debug("Invalid county");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
           else if (!isAlpha(stateProvince) || stateProvince.length === 0) {  
                nodeState.putShared("errorMessage", "Invalid_state");
               logger.debug("Invalid state");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
            // else if ((isHomeless == "false") && (!isValidZip(postalCode) || postalCode.length === 0)) {
            //     nodeState.putShared("errorMessage", "Invalid_ZIP_code");
            //     logger.debug("Invalid zip");
            //     action.goTo(NodeOutcome.INVALID_INPUT);
            // }
                else if (custom_gender.length === 0) {
                nodeState.putShared("errorMessage", "Invalid_Gender");
                logger.debug("Invalid Gender");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
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
            else if((isHomeless) && (isHomeless !="true" || isHomeless !="false" )){
                nodeState.putShared("errorMessage", "isHomeless should be string(true/false)");
                logger.debug("Invalid Input for HomeLess");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }
            /*else if(!checkTelephoneNumber){
                nodeState.putShared("errorMessage", "Invalid_telephoneNumber");
                //nodeState.putShared("errorInvalidName", nodeConfig.errorFirstNameLastName);
                logger.debug("Invalid telephoneNumber");
                action.goTo(NodeOutcome.INVALID_INPUT);
            }*/
    } else {
        logger.debug("user clicks do not agree")
        nodeState.putShared("donotagreeorgandonor", "donotagreeorgandonor");
        nodeState.putShared("errorMessage",null)
        nodeState.putShared("errorInvalidName", null);
        // If "false" was selected in ChoiceCallback
        action.goTo("donotagree");
    }
}
        
        //     var checkGivenName = isValidName(givenName);
        //     var checkLastName = isValidName(lastName);

        //     if (checkGivenName && checkLastName) {
        //         nodeState.putShared("errorMessage", null);
        //         nodeState.putShared("errorInvalidName", null);
        //         action.goTo(NodeOutcome.NEXT);
        //     } else {
        //         var errMsg = "Invalid first name or last name";
        //         nodeState.putShared("errorMessage", errMsg);
        //         nodeState.putShared("errorInvalidName", errMsg);
        //         action.goTo(NodeOutcome.INVALID_NAME);
        //     }
        // }

            
            // Example: simple validation on names
            
        // } else {
        //     // No edits allowed, just proceed
        //     action.goTo(NodeOutcome.NEXT);
        // }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error Occurred in handleUserResponses Function " + "::" + error);
        auditLog("PRO007", "Organ Donor Registration Failure");
        action.goTo(NodeOutcome.ERROR);
    }
}

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
//     return /^\d{5}(-\d{4})?$/.test(zip);
// }
//Regex to accept digits 1 to 5 length
// function isValidZip(zip) {
//     return /^[1-9]\d{0,4}$/.test(String(zip));
// }
function isValidZip(zip) {
   // return /^\d{5}(-\d{4})?$/.test(zip);
   // return /^\d{5,10}$/.test(zip);
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
    logger.error("starting the KYID.2B1.Journey.Manage.Profile.Organ.Donor")
    requestCallbacks();
} else {
    handleUserResponses();
}
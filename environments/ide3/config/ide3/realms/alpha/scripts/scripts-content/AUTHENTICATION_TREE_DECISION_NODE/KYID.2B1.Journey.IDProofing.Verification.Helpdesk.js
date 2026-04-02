var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Collect Basic Information ",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Verification",
    emptyhandleResponse: "In Function emptyhandleResponse",
    handleResponse: "In Function handleResponse",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back",
    MISSING_MANDATORY: "divert",
    EXIT: "exit",
    changeLog: "changeLog"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};


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

function isValidDateOfBirth(dob) {
    logger.debug("dob is "+ dob)
    logger.debug("type of dob " + typeof dob)
    //var regex = /^\d{2}\/\d{2}\/\d{4}$/
    var regex = /^\d{4}-\d{2}-\d{2}$/;
    // var datevalue = dob;
    // var dateObj = new Date(datevalue);
    // var today = new Date();
    //     if(isNaN(dateObj.getTime())) {
    //         return false;
    //     }else if (dateObj > today) {
    //         return false;
    //     }else if(!regex.test(dob)){
    //         return false;
    //     }else{
    //         return true;
    //     }

    return(regex.test(dob))

}

// function isValidDateOfBirth(dob) {
//     var regex = /^\d{4}\/\d{2}\/\d{2}$/;
//     if (!regex.test(dob)) {
//         return false;
//     }
//     var parts = dob.split('/');
//     var year = parseInt(parts[0], 10);
//     var month = parseInt(parts[1], 10) - 1;
//     var day = parseInt(parts[2], 10);

//     var dateObj = new Date(year, month, day);

//     if (
//         dateObj.getFullYear() !== year ||
//         dateObj.getMonth() !== month ||
//         dateObj.getDate() !== day
//     ) {
//         return false;
//     }

//     var today = new Date();
//     today.setHours(0,0,0,0);

//     if (dateObj > today) {
//         return false;
//     }
//     return true;
// }

function isValidZip(zip) {
    // Updated the Zip Length to 10
   // return /^\d{5}(-\d{4})?$/.test(zip);
   // return /^\d{5,10}$/.test(zip);
    return true
}

function isValidPhone(phone) {
    // var validatePhoneLib = require("KYID.2B1.Library.GenericUtils");
    // var isPhoneValid = validatePhoneLib.validatePhoneNumber(phone);
    //const phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
    // return isPhoneValid;
    const regex = /^\+?\d+$/;
    return regex.test(phone);
}

function isValidMail(mail) {
    var mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return mailRegex.test(mail);
}

function isAlpha(value) {
    return /^[a-zA-Z ,.'-]+$/.test(value);
}

function isCounty(value) {
    return /^[a-zA-Z0-9 ,.'-]+$/.test(value) && value.length < 20;
}

function isMaxlength40(value){
    logger.debug("Inside max 40 length check")
    return /^[\s\S]{1,40}$/.test(value);
}

function isMaxlength500(value){
    logger.debug("Inside max 500 length check")
    return /^[\s\S]{1,500}$/.test(value);
}

function isMaxlength128(value){
    logger.debug("Inside max 128 length check")
    return /^[\s\S]{1,128}$/.test(value);
}

function isMaxValidSsn(value){
   // return /^(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/.test(value);
    return /^(?!000|666)\d{3}-(?!00)\d{2}-(?!0000)\d{4}$/.test(value);
}

function emptyhandleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.emptyhandleResponse);
    try{
        var errorArray = [];
        var jsonobj = {"pageHeader": "1_RIDP_Collect_Personal_Info"};
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
        if (nodeState.get("errorArray") != null) {
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>${nodeState.get("errorArray")}</div>`);
        }
    
        if (nodeState.get("orig_givenName")) {
        var givenName = nodeState.get("orig_givenName");
        callbacksBuilder.textInputCallback("Legal first Name*", givenName);
        } else {
            callbacksBuilder.textInputCallback("Legal first Name*");
        }
        
        if (nodeState.get("orig_custom_middleName")) {
            var middleName = nodeState.get("orig_custom_middleName");
            callbacksBuilder.textInputCallback("Legal middle Name", middleName);
        } else {
            callbacksBuilder.textInputCallback("Legal middle Name");
        }
        
        if (nodeState.get("orig_sn")) {
            var lastName = nodeState.get("orig_sn");
            callbacksBuilder.textInputCallback("Legal last Name*", lastName);
        } else {
            callbacksBuilder.textInputCallback("Legal last Name*");
        }

        if (nodeState.get("orig_custom_title")) {
            var title = nodeState.get("orig_custom_title");
            callbacksBuilder.textInputCallback("Title", title);
        } else {
            callbacksBuilder.textInputCallback("Title");
        }

        
        if (nodeState.get("orig_custom_suffix")) {
            var suffix = nodeState.get("orig_custom_suffix");
            callbacksBuilder.textInputCallback("suffix", suffix);
        } else {
            callbacksBuilder.textInputCallback("suffix");
        }
        
        if (nodeState.get("orig_custom_gender")) {
            var gender = nodeState.get("orig_custom_gender");
            callbacksBuilder.textInputCallback("Gender", gender);
        } else {
            callbacksBuilder.textInputCallback("Gender");
        }
        
        if (nodeState.get("orig_custom_dateofBirth")) {
            var birthdate = nodeState.get("orig_custom_dateofBirth");
            callbacksBuilder.textInputCallback("Birthdate*", birthdate);
        } else {
            callbacksBuilder.textInputCallback("Birthdate*");
        }
        
        if (nodeState.get("ssn")) {
            var ssn = nodeState.get("ssn");
            callbacksBuilder.textInputCallback("Social Security Number", ssn);
        } else {
            callbacksBuilder.textInputCallback("Social Security Number");
        }
        if (nodeState.get("isHomeless")) {
            var isHomeless = nodeState.get("isHomeless");
            callbacksBuilder.textInputCallback("isHomeless", isHomeless);
        } else {
            callbacksBuilder.textInputCallback("isHomeless");
        }
        
        if (nodeState.get("orig_postalAddress")) {
            var address1 = nodeState.get("orig_postalAddress");
            callbacksBuilder.textInputCallback("Address 1", address1);
        } else {
            callbacksBuilder.textInputCallback("Address 1");
        }
        
        if (nodeState.get("orig_custom_postalAddress2")) {
            var address2 = nodeState.get("orig_custom_postalAddress2");
            callbacksBuilder.textInputCallback("Address 2", address2);
        } else {
            callbacksBuilder.textInputCallback("Address 2");
        }
        
        if (nodeState.get("orig_city")) {
            var city = nodeState.get("orig_city");
            callbacksBuilder.textInputCallback("City", city);
        } else {
            callbacksBuilder.textInputCallback("City");
        }
        
        if (nodeState.get("orig_stateProvince")) {
            var state = nodeState.get("orig_stateProvince");
            callbacksBuilder.textInputCallback("State", state);
        } else {
            callbacksBuilder.textInputCallback("State");
        }
        
        if (nodeState.get("orig_postalCode") && nodeState.get("orig_postalCode")!="undefined" ) {
            var zip = nodeState.get("orig_postalCode");
            logger.debug("zip is in ::"+ zip)
            callbacksBuilder.textInputCallback("Zip/postal code", zip);
        } else {
            callbacksBuilder.textInputCallback("Zip code");
        }
        
        if (nodeState.get("postalExtension") || nodeState.get("orig_custom_zipExtension")) {
            var zipExt =  nodeState.get("orig_custom_zipExtension") || nodeState.get("postalExtension") ;
            callbacksBuilder.textInputCallback("Zip/postal extension", zipExt);
        } else {
            callbacksBuilder.textInputCallback("Zip/postal extension");
        }
        
        if (nodeState.get("orig_custom_county")) {
            var county = nodeState.get("orig_custom_county");
            callbacksBuilder.textInputCallback("County", county);
        } else {
            callbacksBuilder.textInputCallback("County");
        }

        if (nodeState.get("orig_custom_country")) {
            var country = nodeState.get("orig_custom_country");
            callbacksBuilder.textInputCallback("Country", country);
        } else {
            callbacksBuilder.textInputCallback("Country");
        }

        if(nodeState.get("journeyName")=="updateprofile"){
            if (nodeState.get("orig_languagePreference")) {
                var language = nodeState.get("orig_languagePreference");
                callbacksBuilder.textInputCallback("Language Preference", language);
            } else {
                callbacksBuilder.textInputCallback("Language Preference");
            }            
        }

        
        callbacksBuilder.textOutputCallback(0, " By submitting this registration I affirm that I am the applicant described on this applicationand that the information entered herein is true and correct to the best of my knowledge. Thisform will serve as donor document of gift as outlined in the Unitorm Anatomical Gitt Act. Adocument of gift, not revoked by the donor before death, is considered legal authorization fordonation and does not require the consent of another. If I am under 18 years of age, I understand that consent must be obtained from my parents or legal guardian at the time of donation.");
        //logger.debug("KOGID is "+ nodeState.get("KOGID"))
        //logger.debug("journeyName is "+ nodeState.get("journeyName"))
        if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase()=="forgotpassword"){
            if (nodeState.get("orig_telephoneNumber")) {
                var telephoneNumber = nodeState.get("orig_telephoneNumber");
                callbacksBuilder.textInputCallback("Mobile Number*", telephoneNumber);
            } else {
                callbacksBuilder.textInputCallback("Mobile Number*");
            }
    
            if (nodeState.get("mail")) {
                var mail = nodeState.get("mail");
                logger.debug("mail1 is :: => "+ mail)
                callbacksBuilder.textOutputCallback(0,`Email : ${mail}`);
            } else {
                callbacksBuilder.textInputCallback("Primary email*");
            }
        }else if(nodeState.get("journeyName")=="updateprofile" || nodeState.get("journeyName")=="organdonor" || nodeState.get("journeyName")==="MFARecovery" || nodeState.get("journeyName")=="RIDP_LoginMain" || nodeState.get("context") === "appEnroll" || (nodeState.get("journeyName") === "accountRecovery") ){
               
                var phoneArray = []
                logger.debug("phoneArray is "+phoneArray)
                if(nodeState.get("KOGID")!== null && nodeState.get("KOGID")){
                    phoneArray = getPhoneOptions(nodeState.get("KOGID"))   
                }
                logger.debug("phoneArray is "+phoneArray)
                if (phoneArray.length>0 ) {
                    nodeState.putShared("phoneArray",phoneArray)
                    var prompt = "Mobile Number"
                    callbacksBuilder.choiceCallback(`${prompt}`, phoneArray, 0 ,false) 
                } else {
                      if (nodeState.get("orig_telephoneNumber")) {
                        var telephoneNumber = nodeState.get("orig_telephoneNumber");
                        callbacksBuilder.textInputCallback("Mobile Number*", telephoneNumber);
                    } else {
                        callbacksBuilder.textInputCallback("Mobile Number*");
                    }
                }
    
                if (nodeState.get("mail") || nodeState.get("EmailAddress")) {
                    if(nodeState.get("firsttimeloginjourney") ==="true"){
                        var mail = nodeState.get("mail") || nodeState.get("EmailAddress");
                        logger.debug("mail2 is :: => "+ mail)
                    }else{
                         var mail = nodeState.get("mail");
                        logger.debug("mail 3is :: => "+ mail)                       
                    }
                    callbacksBuilder.textOutputCallback(0,`Email : ${mail}`);;
                } else if(!(nodeState.get("journeyName") === "accountRecovery")){
                    callbacksBuilder.textInputCallback("Primary email");
                }
        }
        var prompt = "I have read, understand, and agree to the above terms and conditions"
        callbacksBuilder.choiceCallback(`${prompt}`, ["Agree", "Deny"], 0 ,false) 
        callbacksBuilder.confirmationCallback(0, ["next", "back"], 0);
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script anf function emptyHandleResponse:: " + error);
    }
}

function handleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.handleResponse);
    try{ 
        var num=null;
        var errorArray = [];
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
            if(selectedOutcome === 1){
                nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.handleResponse + "KYID.2B1.Journey.IDProofing.Verification --> Back Option Selected");
                nodeState.putShared("IDProofingAnotherMethod","true")
                nodeState.putShared("action","back")
                action.goTo("back");
            }else if(selectedOutcome === 0){
                var changeLog= [];
                var givenName = callbacks.getTextInputCallbacks().get(0);
                var middleName = callbacks.getTextInputCallbacks().get(1);
                var lastName = callbacks.getTextInputCallbacks().get(2);
                var title = callbacks.getTextInputCallbacks().get(3);
                var suffix = callbacks.getTextInputCallbacks().get(4);
                var custom_gender = callbacks.getTextInputCallbacks().get(5);
                var dateOfBirth = callbacks.getTextInputCallbacks().get(6);
                var ssn = callbacks.getTextInputCallbacks().get(7);
                var isHomeless = callbacks.getTextInputCallbacks().get(8);
                var postalAddress = callbacks.getTextInputCallbacks().get(9);
                var postalAddress2 = callbacks.getTextInputCallbacks().get(10);
                var city = callbacks.getTextInputCallbacks().get(11);
                var stateProvince = callbacks.getTextInputCallbacks().get(12);
                var postalCode = callbacks.getTextInputCallbacks().get(13);
                var postalExtension = callbacks.getTextInputCallbacks().get(14);
                var county = callbacks.getTextInputCallbacks().get(15);
                var country = callbacks.getTextInputCallbacks().get(16);

                logger.debug("county is :: "+ county)
                logger.debug("stateProvince is :: "+ stateProvince)

                //if(nodeState.get("journeyName")=="updateprofile" || nodeState.get("journeyContext") == "ridp"){
                if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase()=="updateprofile"){
                    var language  = callbacks.getTextInputCallbacks().get(17);
                    num = 18;
                }else{
                    num = 17;
                }
                
                
                if(nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase()=="forgotpassword" ){
                    var telephoneNumber = callbacks.getTextInputCallbacks().get(num);
                    var terms = callbacks.getChoiceCallbacks().get(0)[0];
                    //var mail = callbacks.getTextInputCallbacks().get(14);
                }else if(nodeState.get("journeyName")=="updateprofile" || nodeState.get("journeyName")=="organdonor" || nodeState.get("journeyName")=="MFARecovery" || nodeState.get("journeyName")=="RIDP_LoginMain" || nodeState.get("context") === "appEnroll" || (nodeState.get("journeyName") === "accountRecovery")){
                    if(nodeState.get("phoneArray")!== null && nodeState.get("phoneArray")){
                        var phoneArray = []
                        var phoneArray = nodeState.get("phoneArray")
                        //logger.debug("phoneArray is ::: "+ phoneArray)
                        if(phoneArray.length>0){
                            var telephoneNumberCallback = callbacks.getChoiceCallbacks().get(0)[0];
                            var telephoneNumber = phoneArray[telephoneNumberCallback]
                            var terms = callbacks.getChoiceCallbacks().get(1)[0];
                        }else{
                            var telephoneNumber = callbacks.getTextInputCallbacks().get(num);
                            //var terms = callbacks.getChoiceCallbacks().get(1)[0];
                             var terms = callbacks.getChoiceCallbacks().get(0)[0];
                        }    
                    }
                    else{
                            var telephoneNumber = callbacks.getTextInputCallbacks().get(num);
                            var terms = callbacks.getChoiceCallbacks().get(0)[0];
                        }
                }else{
                   var terms = callbacks.getChoiceCallbacks().get(0)[0];
                }
                
                //logger.debug("telephoneNumber is :: "+ telephoneNumber)
                //logger.debug("terms in KYID.2B1.Journey.IDProofing.Verification is :: "+ terms)
                
                var checkGivenName = isValidName(givenName);
                var checkLastName = isValidName(lastName);
                var checkMiddleName = isValidName(middleName); 
                var userInfoJSON = {};
    
                // First Name
                if (givenName != null && givenName) {
                    if(nodeState.get("orig_givenName")!==givenName){
                        changeLog.push({"First Name": givenName})
                    }
                    nodeState.putShared("orig_givenName", givenName);
                    nodeState.putShared("givenName", givenName);
                    if(!checkGivenName){
                        errorArray.push("Invalid first name.");
                    }
                    userInfoJSON["givenName"] = givenName;
                }else{
                    errorArray.push("Legal first Name is mandatory"); 
                }
    
                // Middle Name
                if (middleName != null && middleName) {
                    if(nodeState.get("orig_custom_middleName")!==middleName){
                        changeLog.push({"Middle Name": middleName})
                        //changeLog.push("Legal middle Name")
                    }
                    nodeState.putShared("custom_middleName", middleName);
                    nodeState.putShared("orig_custom_middleName", middleName);                    
                    //userInfoJSON["custom_middleName"] = middleName;
                    userInfoJSON["middleName"] = middleName;
                }

                //Last Name
                if (lastName != null && lastName) {
                    if(nodeState.get("orig_sn")!==lastName){
                        changeLog.push({"Last Name": lastName})
                        //changeLog.push("Legal last Name")
                    }
                    nodeState.putShared("sn", lastName);
                    nodeState.putShared("orig_sn", lastName);
                    nodeState.putShared("lastName", lastName);                    
                    if(!checkLastName){
                        errorArray.push("Invalid lastName name.");
                    }
                    userInfoJSON["sn"] = lastName;
                }else{
                    errorArray.push("Legal lastName Name is mandatory");
                }

                //Suffix
                if (suffix != null && suffix) {
                    if(nodeState.get("orig_custom_suffix")!==suffix){
                        changeLog.push({"Suffix": suffix})
                        //changeLog.push("suffix")
                    }
                     nodeState.putShared("custom_suffix", suffix);
                     nodeState.putShared("orig_custom_suffix", suffix);                  
                    //userInfoJSON["custom_suffix"] = suffix;
                    userInfoJSON["suffix"] = suffix;
                }

            
                //Gender
                if (custom_gender != null && custom_gender) {
                    if(nodeState.get("orig_custom_gender")!==custom_gender){
                        changeLog.push({"Gender ": custom_gender})
                        //changeLog.push("Gender")
                    }
                    nodeState.putShared("custom_gender", custom_gender);
                    nodeState.putShared("orig_custom_gender", custom_gender);                   
                    // userInfoJSON["custom_gender"] = custom_gender;
                       userInfoJSON["gender"] = custom_gender;
                }else{
                    //errorArray.push("Gender is mandatory")
                }

                //DOB
                if (dateOfBirth != null && dateOfBirth) {
                    if(nodeState.get("orig_custom_dateofBirth")!==dateOfBirth){
                        changeLog.push({"Date Of Birth": dateOfBirth})
                        //changeLog.push("Birthdate")
                    }
                    nodeState.putShared("custom_dateofBirth", dateOfBirth);
                    nodeState.putShared("orig_custom_dateofBirth", dateOfBirth);                    
                    if(!isValidDateOfBirth(dateOfBirth)){
                        errorArray.push("Invalid dateOfBirth");
                    }
                        //userInfoJSON["custom_dateofBirth"] = dateOfBirth;
                        userInfoJSON["dob"] = dateOfBirth;
                }else{
                    errorArray.push("Birthdate is mandatory")
                    nodeState.putShared("errorMessage", "Birthdate is mandatory");
                }

                // if (dateOfBirth && dateOfBirth.trim() !== "") {
                //         if (!isValidDateOfBirth(dateOfBirth)) {
                //             errorArray.push("Invalid dateOfBirth");
                //             nodeState.putShared("errorMessage", "Invalid dateOfBirth");
                //         } else {
                //             if (nodeState.get("orig_custom_dateofBirth") !== dateOfBirth) {
                //                 nodeState.putShared("orig_custom_dateofBirth", dateOfBirth);
                //                 changeLog.push("Birthdate");
                //             }
                //             userInfoJSON["custom_dateofBirth"] = dateOfBirth;
                //         }
                //     } else {
                //     errorArray.push("Birthdate is mandatory");
                //     nodeState.putShared("errorMessage", "Birthdate is mandatory");
                // }
    
                //SSN
                if (ssn != null && ssn) {
                    if(!isMaxValidSsn(ssn)){
                        errorArray.push("Invalid SSN.")
                    }
                    userInfoJSON["ssn"] = ssn;
                }

                // isHomeless Validation
                if (isHomeless != null && isHomeless) {
                    if(isHomeless ==="true" ||isHomeless ==="false"){
                     nodeState.putShared("isHomeless", isHomeless);
                     userInfoJSON["isHomeless"] = isHomeless;
                    }
                    else{
                        errorArray.push("isHomeless should be string(true/false)");
                    }
                } 

                // ADddress 1
                if (postalAddress != null && postalAddress) {
                    if(nodeState.get("orig_postalAddress")!==postalAddress){
                        changeLog.push({"Postal Address 1": postalAddress})
                        //changeLog.push("Address 1")
                    } 
                    nodeState.putShared("postalAddress", postalAddress);
                    nodeState.putShared("orig_postalAddress", postalAddress);                    
                    if(!isMaxlength500(postalAddress)){
                        errorArray.push("Invalid Adress 1.");
                    }
                    if(nodeState.get("orig_postalAddress")!==postalAddress){
                        // changeLog.push("Address 1")
                    }                
                    userInfoJSON["postalAddress"] = postalAddress;
                }else{
                    //errorArray.push("Adress 1 is mandatory");
                }

                // Address 2
                if (postalAddress2 != null && postalAddress2) {
                    if(nodeState.get("orig_custom_postalAddress2")!==postalAddress2){
                        changeLog.push({"Postal Address 2": postalAddress2})
                        //changeLog.push("Address 2")
                    } 
                    nodeState.putShared("custom_postalAddress2", postalAddress2);
                    nodeState.putShared("orig_custom_postalAddress2", postalAddress2);                    
                    if(postalAddress2.length > 500){
                        errorArray.push("Invalid Address2.");
                    }
                    if(nodeState.get("orig_custom_postalAddress2")!==postalAddress2){
                        // changeLog.push("Address 2")
                    }               
                    //userInfoJSON["custom_postalAddress2"] = postalAddress2;
                      userInfoJSON["postalAddress2"] = postalAddress2;
                }

                //City
                if (city != null && city) {
                    if(nodeState.get("orig_city")!==city){
                        changeLog.push({"City": city})
                        //changeLog.push("City")
                    } 
                    nodeState.putShared("city", city);
                    nodeState.putShared("orig_city", city);                   
                    if(city.length >128){
                        errorArray.push("Inavlid City")
                    }
                    userInfoJSON["city"] = city;
                }else{
                   // errorArray.push("City is mandatory")
                }

                //State
                if (stateProvince != null && stateProvince) {
                    if(nodeState.get("orig_stateProvince")!==stateProvince){
                        //changeLog.push("State")
                        changeLog.push({"State": stateProvince})
                    }
                    nodeState.putShared("stateProvince", stateProvince);
                    nodeState.putShared("orig_stateProvince", stateProvince);                 
                    if((!isAlpha(stateProvince) || stateProvince.length > 128)){
                        // errorArray.push("Invalid State")
                    }
                    nodeState.putShared("orig_stateProvince", stateProvince);
                    userInfoJSON["stateProvince"] = stateProvince;
                }else{
                   // errorArray.push("State is mandatory")
                }

                //Postal Code
                if (postalCode != null && postalCode) {
                    if(nodeState.get("orig_postalCode")!==postalCode){
                        //changeLog.push("Zip/postal code")
                        changeLog.push({"Postal Code": postalCode})
                    }
                    nodeState.putShared("postalCode", postalCode);
                    nodeState.putShared("orig_postalCode", postalCode);                  
                    // if((!isValidZip(postalCode) || postalCode.length > 40)){
                    //     errorArray.push("Invalid ZIP Code.");
                    // }
                    // if(nodeState.get("orig_postalCode")!==postalCode){
                    //     changeLog.push("Zip/postal code")
                    // }
                        userInfoJSON["postalCode"] = postalCode;
                }else{
                    nodeState.putShared("postalCode", null);
                    //errorArray.push("Zip Code is mandatory");
                    userInfoJSON["postalCode"] = null;
                }

                //Postal Extension
                if (postalExtension != null && postalExtension) {
                    if(nodeState.get("orig_custom_zipExtension")!=postalExtension){
                        nodeState.putShared("orig_custom_zipExtension", postalExtension);
                        nodeState.putShared("postalExtension", postalExtension);
                        nodeState.putShared("custom_zipExtension", postalExtension);
                        changeLog.push({"Postal Extension": postalExtension})
                        //changeLog.push("Zip/postal extension")
                    }
                    nodeState.putShared("custom_zipExtension", postalExtension);
                    nodeState.putShared("zipExtension", postalExtension);
                    nodeState.putShared("orig_custom_zipExtension", postalExtension);      
                    nodeState.putShared("postalExtension", postalExtension);
                    if( !isMaxlength40(postalExtension)){
                        errorArray.push("Invalid Zip Extension.");
                    }
                    userInfoJSON["postalExtension"] = postalExtension;
                }

                //County
                if (county != null && county) {
                    if(nodeState.get("orig_custom_county")!==county){
                        nodeState.putShared("orig_custom_county", county);
                        nodeState.putShared("custom_county", county);
                        changeLog.push({"County": county})
                        //changeLog.push("County")
                    }
                    logger.debug("county is :"+ county)
                    nodeState.putShared("custom_county", county);
                    nodeState.putShared("orig_custom_county", county);
                    if( !isCounty(county)){
                        errorArray.push("Invalid County."); 
                    }
                    nodeState.putShared("orig_custom_county", county);
                        //userInfoJSON["custom_county"] = county;
                        userInfoJSON["county"] = county;
                }

            
                if (country != null && country) {
                    if(nodeState.get("orig_custom_country")!==country){
                        nodeState.putShared("orig_custom_country", country);
                        nodeState.putShared("country", country);
                        changeLog.push({"Country": country})
                       // changeLog.push("Country")
                    }
                    nodeState.putShared("country", country);
                    nodeState.putShared("orig_custom_country", country);    
                    nodeState.putShared("countryCode", country);  
                    if( !isAlpha(country)){
                        errorArray.push("Invalid County."); 
                    }
                    nodeState.putShared("orig_custom_country", country);
                        //userInfoJSON["custom_county"] = county;
                        userInfoJSON["country"] = country;
                }

                if (title != null && title) {
                    if(nodeState.get("orig_custom_title")!==title){
                        nodeState.putShared("orig_custom_title", title);
                        nodeState.putShared("title", title);
                        nodeState.putShared("custom_title", title);
                        //changeLog.push("title")
                        changeLog.push({"Title": title})
                    }
                    nodeState.putShared("custom_title", title);
                    nodeState.putShared("orig_custom_title", title);
                    nodeState.putShared("title", title);
                    //userInfoJSON["custom_suffix"] = suffix;
                    userInfoJSON["title"] = title;
                }

                if (language != null && language) {
                        nodeState.putShared("frUnindexedString3", language);
                        nodeState.putShared("languagePreference", language);
                        userInfoJSON["language_preference"] = language;
                        //userInfoJSON["custom_suffix"] = suffix;
                        //userInfoJSON["title"] = title;
                }


                if(nodeState.get("journeyName")==="createAccount" && nodeState.get("collectedPrimaryEmail")){
                            userInfoJSON["mail"] = nodeState.get("collectedPrimaryEmail");
                }

                if(nodeState.get("journeyName") && (nodeState.get("journeyName").toLowerCase() =="forgotpassword" || nodeState.get("journeyName")=="updateprofile" || nodeState.get("journeyName")=="organdonor"||nodeState.get("journeyName")=="MFARecovery" || nodeState.get("context") === "appEnroll" || nodeState.get("journeyName")=="RIDP_LoginMain" || nodeState.get("appEnroll") || (nodeState.get("journeyName") === "accountRecovery") || nodeState.get("firsttimeloginjourney") ==="true")){
                    var flag = false;
                    
                    if(nodeState.get("firsttimeloginjourney") ==="true"){
                        flag = true;
                    }
                    if(!flag){
                       logger.debug("telephoneNumber is in :: "+ telephoneNumber)
                        if (telephoneNumber != null && telephoneNumber) {
                            if(nodeState.get("orig_telephoneNumber")!==telephoneNumber){
                                changeLog.push({"Telephone number": telephoneNumber})
                                //changeLog.push("telephoneNumber")
                            }
                            nodeState.putShared("orig_telephoneNumber", telephoneNumber);
                            nodeState.putShared("telephoneNumber", telephoneNumber);
                            if(!isValidPhone(telephoneNumber)){
                                errorArray.push("Invalid telephoneNumber.");
                            }
                            if(nodeState.get("orig_telephoneNumber")!==telephoneNumber){

                            changeLog.push("telephoneNumber")
                            }
                            userInfoJSON["telephoneNumber"] = telephoneNumber;
                        }/*else {
                            errorArray.push("telephoneNumber is mandatory");
                        }  */
                    }
                   


                    //  if(nodeState.get("mail") || nodeState.get("EmailAddress")){
                    //     userInfoJSON["mail"] = nodeState.get("mail") || nodeState.get("EmailAddress");
                    // }  
                    logger.debug("EmailAddress is :: "+nodeState.get("EmailAddress") )
                     if(nodeState.get("firsttimeloginjourney") ==="true"){
                         userInfoJSON["mail"] =  nodeState.get("EmailAddress") || "";
                    }else{
                         userInfoJSON["mail"] = nodeState.get("mail")                      
                    }

                     
                    // if (mail != null && mail) {
                    //     if(!isValidMail(mail)){
                    //         errorArray.push("Invalid mail."); 
                    //     }
                    //     if(nodeState.get("mail")!==mail){
                    //     nodeState.putShared("mail", mail);
                    //     changeLog.push("Mail")
                    //     }
                    //     userInfoJSON["mail"] = mail;
                    // }else{
                    //     errorArray.push("mail is mandatory"); 
                    // }
                }

                if(terms===1){
                    logger.debug("inside terms failed")
                    errorArray.push("You need to accept Terms & Conditions");
                    nodeState.putShared("errorMessage", "You need to accept Terms & Conditions");
                }

                nodeState.putShared("userInfoJSON", userInfoJSON)
                logger.debug("changeLog is :: "+ JSON.stringify(changeLog))
                if(changeLog.length>0){
                    nodeState.putShared("changeLog", JSON.stringify(changeLog))
                }
               var userInfoJSON1 = {};
               var maxProps = 25; // Or any reasonable upper limit
               var count = 0;
                for (var k in userInfoJSON) {
                    if (userInfoJSON.hasOwnProperty(k)) {
                        userInfoJSON1[k] = userInfoJSON[k];
                        count++;
                        if (count > maxProps) {
                            logger.error("Abnormal object: too many properties!");
                            break;
                        }
                    }
                }
                if(userInfoJSON1 && userInfoJSON1.ssn){
                    delete userInfoJSON1.ssn;
                }
               
               nodeState.putShared("userInfoJSON1", userInfoJSON1)
               logger.debug("userInfoJSON in KYID.2B1.Journey.IDProofing.Verification"+ JSON.stringify(userInfoJSON1))

                if(errorArray.length>0){
                logger.debug("inside errorArray")
                nodeState.putShared("errorArray",errorArray)
                action.goTo(NodeOutcome.MISSING_MANDATORY);
                }else{
                    logger.debug("selectedoutcome is :: =>" + selectedOutcome); 
                    

                    if(terms === 0 && selectedOutcome === 0 && (nodeState.get("journeyName")==="createAccount")){
                        
                        nodeState.putShared("method", "LexisNexis")
                        nodeState.putShared("action", "verification")
                        action.goTo(NodeOutcome.NEXT); 
                    }else if(terms === 0 && selectedOutcome === 0 && ((nodeState.get("journeyName") === "updateprofile") || (nodeState.get("journeyName") === "organdonor")|| nodeState.get("journeyName")=="MFARecovery" || nodeState.get("journeyName")=="RIDP_LoginMain") || nodeState.get("context")==="appEnroll"){
                        /*if(changeLog.length>0){
                            nodeState.putShared("changeLog", changeLog)
                            action.goTo(NodeOutcome.changeLog); 
                        }else{
                        */
                            action.goTo(NodeOutcome.NEXT);  
                        // }
                    }
                    else if(terms === 0 && selectedOutcome === 0 && ((nodeState.get("journeyName") === "accountRecovery") || (nodeState.get("journeyName") && nodeState.get("journeyName").toLowerCase() === "forgotpassword"))){
                        nodeState.putShared("method", "LexisNexis")
                        nodeState.putShared("action", "proofing")
                        action.goTo(NodeOutcome.NEXT); 
                    }
                        
                }
            }
    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script function handleResponse:: " + error);
    }
}

function main(){ 
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try{
        if (callbacks.isEmpty()) {
            emptyhandleResponse()
        } else {   
            handleResponse()
        }
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in KYID.2B1.Journey.IDProofing.Verification script:: " + error);
    }
}

main();
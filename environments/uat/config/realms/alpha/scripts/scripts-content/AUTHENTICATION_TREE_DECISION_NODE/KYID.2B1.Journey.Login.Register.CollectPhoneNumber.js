var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
 
var maxretryerror = "You have reached the maximum number of attempts to go back and edit your details. Please restart the process and try again.";
var retryLimit = systemEnv.getProperty("esv.retry.limit.for.back");
  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "Collect Phone Number",
      script: "Script",
      scriptName: "KYID.2B1.Journey.Registration_Acceptance.CollectPhoneNumber",
      errorEmail:"email validation failed",
      errorId_phoneNumber:"errorID::KYID011",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      NEXT: "next",
      ERROR: "invalidEmail",
      MAX_LIMIT:"max limit"
  };
  
  
  /**
     * Logging function
     * @type {Function}
     */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
}


// Main Execution
try {

      // var telephoneNumber = nodeState.get("telephoneNumber");
      var lib = require("KYID.Library.FAQPages");
      var process ="SelfRegistration";
      var pageHeader= "2_phone_number";
      var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
      var telephoneNumber = nodeState.get("telephoneNumber") || null;
      var isPhoneEditable = nodeState.get("isPhoneEditable");
      var phoneVerified = "false";
      var mail = nodeState.get("verifiedPrimaryEmail");
      var verifiedTelephone = null;
      var usrKOGID = nodeState.get("KOGID");
      if(nodeState.get("phoneVerified") != null){
         phoneVerified = nodeState.get("phoneVerified");
      }
      if(nodeState.get("verifiedTelephoneNumber")!= null){
          verifiedTelephone = nodeState.get("verifiedTelephoneNumber");
      }
     if(getRegisteredMFACount(usrKOGID,"SMSVOICE") < 5) {
     if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
     }
    else{
        logger.debug("I am here");
        action.goTo("maxLimitReached")
    }
  } catch (error) {
      action.goTo("error")
      nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error in main execution" +error.message );
      
  }


// Functions..
function requestCallbacks() {
     logger.debug("inside requestCallbacks");
    try {
            if(nodeState.get("validationErrorCode") !=null){
                nodeState.putShared("validationErrorCode", null);
                var errorMessage = nodeState.get("validationErrorCode");
                callbacksBuilder.textOutputCallback(0,errorMessage);
            }
              var jsonobj = {"pageHeader": "provide_your_mobile_number"};
              callbacksBuilder.textOutputCallback(1,JSON.stringify(jsonobj));
        
             callbacksBuilder.textOutputCallback(0, "provide_your_mobile_number")
             callbacksBuilder.textOutputCallback(0, " * Indicates a required field.")
             //callbacksBuilder.textInputCallback("Country code*");
             callbacksBuilder.textInputCallback("mobile number*");
            if(!nodeState.get("IsJourneyForgotEmail")){
                callbacksBuilder.textInputCallback("Confirm mobile number*");
            }     
        var mfaOptions = ["phone_sms", "phone_voice"];
        var promptMessage = "how_would_you_like_to_receive_the_verification_code";
        callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
        callbacksBuilder.textOutputCallback(0,"By providing your mobile number you are consenting to receive messages (standard data rates may apply).")
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
     

        if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
        
        
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error requestCallback Function" +error.message );
    }
    
}
function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+""+"Verified Phone Number is "+ nodeState.get("verifiedTelephoneNumber") + nodeState.get("phoneVerified") )
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var selectedMFA = callbacks.getChoiceCallbacks().get(0)[0];
      
             
            if(selectedOutcome === 1){
                nodeState.putShared("errorMessage",null);
                // nodeState.putShared("Journey_Phone_Verification","back");
                // if(nodeState.get("gobackcount")){
                //     var gobackcount = nodeState.get("gobackcount")
                // } else {
                //     var gobackcount = 1;
                // }
            
                // if (gobackcount > retryLimit) {
                //     nodeState.putShared("maxlimitforback","true")
                //     action.goTo("max limit");
                    
                // } else {
                    // gobackcount++
                    // nodeState.putShared("gobackcount", gobackcount);
                    
                 
                    nodeState.putShared("phoneBack", "true");
                    action.goTo("back");
                    
                // }
                
            }
            else if(selectedOutcome == 0){
                /*var countryCode =  null;
                if(callbacks.getTextInputCallbacks().get(0).trim()){
                   countryCode = callbacks.getTextInputCallbacks().get(0).trim();
                }*/
                var phoneNumber = null;
                if(callbacks.getTextInputCallbacks().get(0).trim()){
                    phoneNumber = callbacks.getTextInputCallbacks().get(0).trim();
                    logger.debug("NewPhoneNumber:"+phoneNumber)
                }
                var ConfirmPhoneNumber = null;
              
                ConfirmPhoneNumber = callbacks.getTextInputCallbacks().get(1).trim();
                
                /*if(countryCode == null ){
                    errMsg["code"] = "ERR-INP-COC-001";
                    errMsg["message"] = libError.readErrorMessage("ERR-INP-COC-001"); 
                    nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
                    action.goTo("missingCountryCode")
                }*/
                 if(phoneNumber == null ){
                     errMsg["code"] = "ERR-INP-PHN-003";
                     errMsg["message"] = libError.readErrorMessage("ERR-INP-PHN-003"); 
                     nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
                     action.goTo("missingPhoneNumber")
                }
                else if(ConfirmPhoneNumber == null && !nodeState.get("IsJourneyForgotEmail")){
                            errMsg["code"] = "ERR-INP-PHN-003";
                            errMsg["message"] = libError.readErrorMessage("ERR-INP-PHN-003"); 
                            nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
                    action.goTo("missingConfirmPhoneNumber")
                }
                
                else{
                    if(phoneNumber === ConfirmPhoneNumber){
                        if(! isValidPhone(phoneNumber)){
                            nodeState.putShared("validationErrorCode","invalid_phone_number");
                            errMsg["code"] = "ERR-INP-PHN-001";
                            errMsg["message"] = libError.readErrorMessage("ERR-INP-PHN-001"); 
                            nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
                            action.goTo("invalidPhoneNumber");
                        }
                            
                        else{
                            logger.debug("inside else");
                          if(isDuplicateNumberCheck(phone_Number)){
                            // errMsg["code"] = "ERR-INP-PHN-001";
                           // errMsg["message"] = libError.readErrorMessage("ERR-INP-PHN-002"); 
                           // nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
                            nodeState.putShared("validationErrorCode","duplicate_phonenumber");
                            action.goTo("duplicate")
                            
                        }
                            
                           else{
                            nodeState.putShared("telephoneNumber",phoneNumber);
                               if(selectedMFA == 0){
                               nodeState.putShared("MFAMethod", "sms");
                               nodeState.putShared("errorMessage",null);
                               nodeState.putShared("validationErrorCode",null);
                               action.goTo("verify")
                          }
                                else{
                                nodeState.putShared("MFAMethod", "voice");
                                nodeState.putShared("errorMessage",null);
                                nodeState.putShared("validationErrorCode",null);
                                action.goTo("verify")
                             }
                          }
                        }                     
                    }
                    else{
                        // nodeState.putShared("validationErrorCode","phoneNumber_missmatch");
                        errMsg["code"] = "ERR-INP-PHN-002";
                        errMsg["message"] = libError.readErrorMessage("ERR-INP-PHN-002"); 
                        nodeState.putShared("validationErrorCode",JSON.stringify(errMsg));
                        action.goTo("phoneNumberNotMatched")
                    }
                }
                

                //

                
        }
                
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in handleUserResponses function ::"+ error);
        action.goTo("error");
        
    }
    
}
function isValidPhone(phoneNumber) {
   //  // const phoneRegex = /^\+[1-9]{1}[0-9]{1,14}$/;
   //  const phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
    
   // logger.error("IsValidPhone Result -- "+phoneRegex.test(phoneNumber))
   //  return phoneRegex.test(phoneNumber);
    var validatePhoneLib = require("KYID.2B1.Library.GenericUtils");
    var isPhoneValid = validatePhoneLib.validatePhoneNumber(phoneNumber);
    if(isPhoneValid === true){
        return true;
    }
    else{
        return false;
    }
}

function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        nodeLogger.debug("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
        return mfaMethodResponses;
 
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}

function getUserActiveMFAValue(usrMFAData, usrMFAType) {
    var mfaValueArray = []
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") == 0 && mfaMethodResponse["MFAMethod"].localeCompare(usrMFAType) == 0) {
                mfaValueArray.push(mfaMethodResponse["MFAValue"]);
            }
        }
    }
    return mfaValueArray;                                                                      
}

function isDuplicateNumberCheck(collectedPhoneNumber) {
    logger.debug("collectedPhoneNumber: "+collectedPhoneNumber)
    var existingTelephoneNumber = null;
    var usrKOGID = null;
    var exist = false; 
    
    if(nodeState.get("KOGID") && nodeState.get("KOGID")!=null){
        usrKOGID = nodeState.get("KOGID");
    }
    logger.debug("usrKOGID value is: "+usrKOGID)
    var usrMFAData = getMFAObject(usrKOGID);
    var mfaValueArray = getUserActiveMFAValue(usrMFAData, "SMSVOICE")

    for(var i=0;i<mfaValueArray.length;i++){
        logger.debug("PhoneNumber in Directory is: "+mfaValueArray[i]);
        existingTelephoneNumber = mfaValueArray[i];
         logger.debug("existingTelephoneNumber: "+existingTelephoneNumber)
         logger.debug("typeof existingTelephoneNumber: "+typeof existingTelephoneNumber)

    // Check for duplicates
        if (existingTelephoneNumber.localeCompare(collectedPhoneNumber)==0){
            logger.debug("****Duplicate numbers********");
            exist = true;
        } else {
            logger.debug("****Not Duplicate numbers********");
        }
    }
    return exist;
}

function getRegisteredMFACount(usrKOGID, MFAMethod) {
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND MFAMethod eq "' + MFAMethod + '" AND MFAStatus eq "' + "ACTIVE" + '"'});
    var MFACount = mfaMethodResponses.result.length;
    logger.debug("MFA Count is --"+MFACount )
    return MFACount;
}
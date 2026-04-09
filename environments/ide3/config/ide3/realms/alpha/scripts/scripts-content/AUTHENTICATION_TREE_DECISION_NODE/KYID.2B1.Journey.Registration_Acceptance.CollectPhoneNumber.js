var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
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
  var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var mail = ""
if(nodeState.get("mail") != null){
    mail = nodeState.get("mail");
}
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
      logger.debug("pageHeader isw in "+ nodeState.get("pageHeader"))
      if(nodeState.get("process") === "RegisterMFA" && nodeState.get("pageHeader") === "1_add_methods"){
          var process = nodeState.get("process");
          var pageHeader = nodeState.get("pageHeader");
      }else{
          var process ="SelfRegistration";
          var pageHeader= "2_phone_number";
      }
      var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
      var telephoneNumber = nodeState.get("telephoneNumber") || null;
      logger.debug("telephoneNumber is in "+ telephoneNumber)
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
     if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
  } catch (error) {
      action.goTo("error")
      nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error in main execution" +error.message );
      
  }


// Functions..
function requestCallbacks() {
     logger.debug("inside requestCallbacks");
    try {
        if (nodeState.get("validationErrorCode") != null) {
                  var error = nodeState.get("validationErrorCode");
                     callbacksBuilder.textOutputCallback(0,error);       
              }
            
        if(nodeState.get("IsJourneyForgotEmail")){
            var headerObj={
            "pageHeader": "2_forgot_email_phone"
             }
            callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
            //callbacksBuilder.textOutputCallback(1, "2_forgot_email_phone");
        }
        else{
            var headerObj={
            "pageHeader": "2_phone_number"
             }
            callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
            //callbacksBuilder.textOutputCallback(1, "2_phone_number")
        }
        
        if (isPhoneEditable != null && isPhoneEditable == "false" && telephoneNumber !=null ){
                  callbacksBuilder.textOutputCallback(0,"Phone Number :: "+telephoneNumber);
              }
            else if (telephoneNumber !=null){
                callbacksBuilder.textInputCallback("Phone Number",telephoneNumber);
            }
          else{
              callbacksBuilder.textInputCallback("Phone Number");
          }
        var mfaOptions = ["phone_sms", "phone_voice"];
        var promptMessage = "set_account_recovery_method";
        callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);
        if(isPhoneEditable == "false" || nodeState.get("IsJourneyForgotEmail") || nodeState.get("journeyName") === "loginSecurity"){
        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
        }
        else{
            callbacksBuilder.confirmationCallback(0, ["Next", "Back", "Skip"], 1);
        }
        
        if(getFaqTopicId!= null && nodeState.get("IsJourneyForgotEmail")== null ){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
        

        
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error requestCallback Function" +error.message );
    }
    
}
function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+""+"Verified Phone Number is "+ nodeState.get("verifiedTelephoneNumber") + nodeState.get("phoneVerified") )
        if(telephoneNumber != null){
             logger.debug("PrintTelephoneNumber1:"+telephoneNumber);
            var phone_Number = telephoneNumber;
        }
       
        else{
          var phone_Number = callbacks.getTextInputCallbacks().get(0).trim(); 
          logger.debug("PrintTelephoneNumber2:"+phone_Number);
          nodeState.putShared("telephoneNumber",phone_Number);
        }

        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var selectedMFA = callbacks.getChoiceCallbacks().get(0)[0];
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+""+"selectedMFA is::  "+ selectedMFA )
        if(isPhoneEditable == "false"){
            var phone_Number = callbacks.getTextInputCallbacks().get(0).trim();
            if(selectedOutcome === 1){
                nodeState.putShared("invalidPhoneNumber",null);
                nodeState.putShared("validationErrorCode", null);
                nodeState.putShared("Journey_Phone_Verification","back");
                if(nodeState.get("gobackcount")){
                    var gobackcount = nodeState.get("gobackcount")
                } else {
                    var gobackcount = 1;
                }
            
                if (gobackcount > retryLimit) {
                    action.goTo("max limit");
                } else {
                    gobackcount++
                    nodeState.putShared("gobackcount", gobackcount);
                    action.goTo("back");
                }
            }
            else if(selectedOutcome == 0){
                nodeState.putShared("MaxLimitReachedSkipPhone","true");
                if (phoneVerified == "true"){
                    
                    if(phone_Number == verifiedTelephone){
                        nodeState.putShared("invalidPhoneNumber",null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("phoneVerified","true")
                        nodeState.putShared("phoneDontVerify","true")
                        nodeState.putShared("phoneStatus","true")
                        action.goTo("dontVerify")
                    }

                         
                    else{
                        nodeState.putShared("telephoneNumber",phone_Number)
                        if(selectedMFA == 0){
                            nodeState.putShared("MFAMethod", "sms");
                            action.goTo("verify")
                        }
                        else{
                            nodeState.putShared("MFAMethod", "voice");
                            action.goTo("verify")
                        }
                        
                    }
                }
                else{
                     if(selectedMFA == 0){
                         nodeState.putShared("MFAMethod", "sms");
                         action.goTo("verify")
                     }
                    else{
                         nodeState.putShared("MFAMethod", "voice");
                         action.goTo("verify")
                    }
                    


                    
                }
             
            }
           
        }
        else{
            if(telephoneNumber != null){
            var phone_Number = telephoneNumber;
            }
            
            
            if(selectedOutcome === 1){
                nodeState.putShared("errorMessage",null);
                nodeState.putShared("validationErrorCode", null);
                nodeState.putShared("Journey_Phone_Verification","back");
                if(nodeState.get("gobackcount")){
                    var gobackcount = nodeState.get("gobackcount")
                } else {
                    var gobackcount = 1;
                }
            
                if (gobackcount > retryLimit) {
                    nodeState.putShared("maxlimitforback","true")
                    action.goTo("max limit");
                    
                } else {
                    gobackcount++
                    nodeState.putShared("gobackcount", gobackcount);
                    action.goTo("back");
                }
                
            }
            else if(selectedOutcome == 0){
            var test = isDuplicateNumberCheck(phone_Number);
//logger.debug("Is Duplicate = "+ stringify(test));
                var phone_Number = callbacks.getTextInputCallbacks().get(0).trim();
                var checkPhone = isValidPhone(phone_Number)
                if (checkPhone== false){
                    nodeState.putShared("MaxLimitReachedSkipPhone","true");
                    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Invalid Phone Number" +"::"+phone_Number+"::"+nodeConfig.errorId_phoneNumber);
                    action.goTo("invalidPhone");
                }
                else if(isDuplicateNumberCheck(phone_Number)){
                errMsg["code"] = "ERR-MFA-MOB-003";
                  errMsg["message"] = libError.readErrorMessage("ERR-MFA-MOB-003"); 
                  nodeState.putShared("validationErrorCode",JSON.stringify(errMsg)); 
                            //nodeState.putShared("validationErrorCode","duplicate_phonenumber");
//logger.debug("Duplicate phone = "+stringify(nodeState.get("validationErrorCode")));
                            nodeState.putShared("invalidPhoneNumber",null);
                            action.goTo("duplicatePhoneNumber")
                }
                else{
                nodeState.putShared("MaxLimitReachedSkipPhone","true");
                 var phone_Number = callbacks.getTextInputCallbacks().get(0).trim();
                if (phoneVerified == "true"){
                    var verifiedTelephone = nodeState.get("verifiedTelephoneNumber");
                    
                    if(phone_Number == verifiedTelephone){
                        nodeState.putShared("errorMessage",null);
                        nodeState.putShared("validationErrorCode", null);
                        nodeState.putShared("phoneDontVerify","true")
                        nodeState.putShared("phoneStatus","true")
                        action.goTo("dontVerify")
                    }
                    else{
 
                        nodeState.putShared("telephoneNumber",phone_Number)
                        if(selectedMFA == 0){
                            nodeState.putShared("MFAMethod", "sms");
                            nodeState.putShared("validationErrorCode", null);
                            nodeState.putShared("errorMessage",null);
                            action.goTo("verify")
                        }
                        else{
                            logger.debug("InsideElseVoice");
                            nodeState.putShared("MFAMethod", "voice");
                            nodeState.putShared("validationErrorCode", null);
                            nodeState.putShared("errorMessage",null);
                            action.goTo("verify")
                        }
                        // }
                        
                        
                    }
                }
                else{
                    nodeState.putShared("telephoneNumber",phone_Number)
                        
                        if(selectedMFA == 0){
                            nodeState.putShared("MFAMethod", "sms");
                            nodeState.putShared("validationErrorCode", null);
                            nodeState.putShared("errorMessage",null);
                            action.goTo("verify")
                        }
                        else{
                            nodeState.putShared("MFAMethod", "voice");
                            nodeState.putShared("errorMessage",null);
                            nodeState.putShared("validationErrorCode", null);
                            action.goTo("verify")
                        }
                }
            
            }
            }
            else if (selectedOutcome == 2){
                nodeState.putShared("verifiedTelephone", null);
                nodeState.putShared("Journey_Phone_Verification","skip");
                nodeState.putShared("errorMessage",null);
                nodeState.putShared("validationErrorCode", null);
                nodeState.putShared("telephoneNumber",null);
                nodeState.putShared("MFAMethod",null)
                nodeState.putShared("sms",null)
                nodeState.putShared("verifiedTelephoneNumber",null)
                nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Step to provide mobile phone number is skipped" +"::"+mail);
                action.goTo("skip");
            }
            
            // }
        }
                
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"error occurred in handleUserResponses function ::"+ error);
        action.goTo("error");
        
    }
    
}
function isValidPhone(phoneNumber) {
    // const phoneRegex = /^\+[1-9]{1}[0-9]{1,14}$/;
   // const phoneRegex = /^[+]{1}(?:[0-9\-\\(\\)\\/.]\s?){6,15}[0-9]{1}$/;
    var validatePhoneLib = require("KYID.2B1.Library.GenericUtils");
    var isPhoneValid = validatePhoneLib.validatePhoneNumber(phoneNumber);
    if(isPhoneValid === true){
        return true;
    }
    else{
        return false;
    }  
    // return phoneRegex.test(phoneNumber);    
}




function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        nodeLogger.error("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
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
    
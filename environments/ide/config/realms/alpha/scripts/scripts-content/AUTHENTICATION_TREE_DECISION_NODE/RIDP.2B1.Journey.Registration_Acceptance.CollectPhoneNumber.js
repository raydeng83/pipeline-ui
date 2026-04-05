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
  var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
  
nodeState.putShared("telephoneNumber",null)

  /**
     * Logging function
     * @type {Function}
     */

//nodeState.putShared("validationErrorCode", null);
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
      logger.error("pageHeader isw in "+ nodeState.get("pageHeader"))
      if(nodeState.get("process") === "RegisterMFA" && nodeState.get("pageHeader") === "1_add_methods"){
          var process = nodeState.get("process");
          var pageHeader = nodeState.get("pageHeader");
      }else{
          var process ="SelfRegistration";
          var pageHeader= "2_phone_number";
      }
      var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
      var telephoneNumber = nodeState.get("telephoneNumber") ||  nodeState.get("userTelephoneNumber") || null;
      logger.error("telephoneNumber is in "+ telephoneNumber)
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
     nodeState.putShared("verififcation","mail")
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
     logger.error("inside requestCallbacks");
      
    try {
            if(nodeState.get("validationErrorCode") != null){
                logger.error("inside the invalidphonenumber")
                var invalidPhoneNumber = nodeState.get("validationErrorCode")
                nodeState.putShared("validationErrorCode", null);
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+invalidPhoneNumber+`</div>`)
            }
        if(nodeState.get("IsJourneyForgotEmail")){
            var headerObj={
            "pageHeader": "2_forgot_email_phone"
             }
            callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
            //callbacksBuilder.textOutputCallback(1, "2_forgot_email_phone");
        } 
        // else if(nodeState.get("isMasterLogin") === "true") {
        //     logger.error("the journey is master login")
        //     var headerObj={
        //     "pageHeader": "1_add_methods"
        //      }
        //     callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
        // }
        else{
            var headerObj={
            "pageHeader": "2_phone_number"
             }
            callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
            //callbacksBuilder.textOutputCallback(1, "2_phone_number")
        }

        if(nodeState.get("journeyName")=="RIDP_LoginMain"){
             callbacksBuilder.textInputCallback("Phone Number");
        }else if (isPhoneEditable != null && isPhoneEditable == "false" && telephoneNumber !=null ){
                  callbacksBuilder.textOutputCallback(0,"Phone Number :: "+telephoneNumber);
        }else if (telephoneNumber !=null){
                callbacksBuilder.textInputCallback("Phone Number",telephoneNumber);
        }else{
              callbacksBuilder.textInputCallback("Phone Number");
        }
        var mfaOptions = ["phone_sms", "phone_voice"];
        var promptMessage = "set_account_recovery_method";
        callbacksBuilder.choiceCallback(`${promptMessage}`, mfaOptions, 0, false);

        logger.error("the nodeState1::"+nodeState.get("firsttimeloginjourney"))
        logger.error("the nodeState2::"+nodeState.get("isMasterLogin"))
        if(nodeState.get("firsttimeloginjourney") === "true"){
            logger.error("the journey is first time. Phone registration with SKIP button.")
            callbacksBuilder.confirmationCallback(0, ["Next", "Back", "Skip"], 1);
            }
       else if(isPhoneEditable == "false" || nodeState.get("IsJourneyForgotEmail") || nodeState.get("journeyName") === "loginSecurity" || nodeState.get("journeyName")=="RIDP_LoginMain" || nodeState.get("isMasterLogin") === "true"){
        logger.error("the confirmation callback does not have skip")
           callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 1);
        }
        else{
            logger.error("the confirmation callback does have skip")
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
             logger.error("PrintTelephoneNumber1:"+telephoneNumber);
            var phone_Number = telephoneNumber;
        }
       
        else{
          var phone_Number = callbacks.getTextInputCallbacks().get(0).trim(); 
          logger.error("PrintTelephoneNumber2:"+phone_Number);
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
                        nodeState.putShared("Journey_Phone_Verification","verify");
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
                            logger.error("InsideElseVoice");
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
    logger.error("collectedPhoneNumber: "+collectedPhoneNumber)
    var existingTelephoneNumber = null;
    var usrKOGID = null;
    var exist = false; 
    
    if(nodeState.get("KOGID") && nodeState.get("KOGID")!=null){
        usrKOGID = nodeState.get("KOGID");
    }
    logger.error("usrKOGID value is: "+usrKOGID)
    var usrMFAData = getMFAObject(usrKOGID);
    var mfaValueArray = getUserActiveMFAValue(usrMFAData, "SMSVOICE")

    for(var i=0;i<mfaValueArray.length;i++){
        logger.error("PhoneNumber in Directory is: "+mfaValueArray[i]);
        existingTelephoneNumber = mfaValueArray[i];
         logger.error("existingTelephoneNumber: "+existingTelephoneNumber)
         logger.error("typeof existingTelephoneNumber: "+typeof existingTelephoneNumber)

    // Check for duplicates
        if (existingTelephoneNumber.localeCompare(collectedPhoneNumber)==0){
            logger.error("****Duplicate numbers********");
            exist = true;
        } else {
            logger.error("****Not Duplicate numbers********");
        }
    }
    return exist;
}
    
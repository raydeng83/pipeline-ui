// JavaScript source code
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var mail = ""
if(nodeState.get("mail") != null){
    mail = nodeState.get("mail");
}
  

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "MFA Symantec EnterCredentialandToken",
      script: "Script",
      scriptName: "KYID.2B1.Journey.Login.Register.SymantecCredentials",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      VERIFY: "Verify",
      ANOTHER_FACTOR: "Back",
      FAILED: "false",
      DUPLICATE: "Duplicate",
      EMPTY_OTP: "BlankOTP",
      SKIP: "skip"
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
  };
  
 // var DEBUG = "true";
  

function generateRandomCode(){
    var letters ='';
    for (i=0;i<4;i++){
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        letters += randomChar
    }

    var numbers ='';
    for (j=0;j<4;j++){
        const randomDigit =Math.floor(Math.random() * 10);
        numbers +=randomDigit;
    }

    return letters + numbers;

}

function isValidSymantecId(credentialId) {
    // Check for length = 12
    if (credentialId.length !== 12) {
        logger.debug("credentialId.length = "+credentialId.length);
        return false;
    }
    // Check if it starts with 'SYMC' or 'VSST'
    if (!(credentialId.startsWith('SYMC') || credentialId.startsWith('VSST'))) {
        return false;
    }
    // Check if the last 8 characters are all digits
    const lastEight = credentialId.slice(-8);
    if (!/^\d{8}$/.test(lastEight)) {
        return false;
    }
    return true;
}

  
  // Function to handle callback requests
  function requestCallbacks() {

      try {
         var lib = require("KYID.Library.FAQPages");
		 var process ="RegisterMFA";
         var pageHeader= "1_setup_your_symantec_vip_app";
         var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
         logger.debug("getFaqTopicId : "+getFaqTopicId);
  
              

            var jsonobj = {"pageHeader": "1_setup_your_symantec_vip_app"};
            callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonobj));
             //callbacksBuilder.textOutputCallback(0,"1_setup_your_symantec_vip_app")
             // callbacksBuilder.textOutputCallback(0,"1. Download the Symantec VIP application from the iOS App Store or Google Play onto your device. 2. Open the Symantec VIP application on your device and add a new profile.")   
                
              if(nodeState.get("credId")){
                  var credId = nodeState.get("credId")
                  callbacksBuilder.textInputCallback("Enter_Credential_ID", credId);
              } else {
                  callbacksBuilder.textInputCallback("Enter_Credential_ID");
              }
              
              callbacksBuilder.textInputCallback("Security_Code_1");
              callbacksBuilder.textInputCallback("Security_Code_2");
          logger.debug("MFARegistered is "+ nodeState.get("MFARegistered"))
          if(nodeState.get("MFARegistered") && nodeState.get("MFARegistered") == "true"){
              callbacksBuilder.confirmationCallback(0, ["Next", "Back", "Skip this step",], 0); 
          }else{
              callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 0);
          }
              
              
              
              if (getFaqTopicId != null) {
                callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
              }
if (nodeState.get("SymantecErrorMessage") != null) {
                  var error = nodeState.get("SymantecErrorMessage");
                     callbacksBuilder.textOutputCallback(0,error)          
              }
            if (nodeState.get("SymantecvalidationErrorCode") != null) {
                  var error = nodeState.get("SymantecvalidationErrorCode");
                     callbacksBuilder.textOutputCallback(0,error)          
              }
          
      } catch (error) {
          nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error requesting callbacks: " + error.message);
      }
  }
  
  // Function to handle user responses
  function handleUserResponses() {
      try {
          
          var credentialId = callbacks.getTextInputCallbacks().get(0).toUpperCase().trim();
          var token1 = callbacks.getTextInputCallbacks().get(1).trim();
          var token2 = callbacks.getTextInputCallbacks().get(2).trim();
          var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
          logger.debug("selectedOutcome is in "+ selectedOutcome)
          nodeState.putShared("selectedOutcome", selectedOutcome);
          nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :::: " + selectedOutcome +"::"+ mail);
         
          nodeState.putShared("credId", credentialId)
          nodeState.putShared("otp1", token1)
          nodeState.putShared("otp2", token2)

          
  
          if (selectedOutcome === 1) {
              nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Selected Back Option"+"::"+mail);
              nodeState.putShared("SymantecErrorMessage", null);
              nodeState.putShared("credId", null);
              nodeState.putShared("symantecBack","true")
              nodeState.putShared("BackFromTOTP","true")
              action.goTo(NodeOutcome.ANOTHER_FACTOR);
          } else if (selectedOutcome === 0) {

           var isDuplicate = isDuplicateSymantecCredId(credentialId);
           if (isDuplicate) {
                nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Already Resgiterd with the given credential ID"+"::"+mail);
                errMsg["code"] = "ERR-2FA-SYM-003";
                  errMsg["message"] = libError.readErrorMessage("ERR-2FA-SYM-003"); 
                  nodeState.putShared("SymantecvalidationErrorCode",JSON.stringify(errMsg));  
            action.goTo(NodeOutcome.DUPLICATE);
                   } else {
               
                   
              
              var SymantecTransId =generateRandomCode();
              nodeState.putShared("Id", SymantecTransId);
              if(!credentialId || credentialId == "") {
                    logger.debug("Cred length = "+credentialId.length);
                  nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Symantec credential ID is null or blank"+"::"+mail);
                  errMsg["code"] = "ERR-2FA-SYM-001";
                  errMsg["message"] = libError.readErrorMessage("ERR-2FA-SYM-001"); 
                  nodeState.putShared("SymantecvalidationErrorCode",JSON.stringify(errMsg));                  
                  action.goTo(NodeOutcome.EMPTY_OTP);
              }
            else{
              if(!isValidSymantecId(credentialId)){
                  logger.debug("Cred length = "+credentialId.length);
                  nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Symantec credential ID is null or blank"+"::"+mail);
                  nodeState.putShared("SymantecErrorMessage", "Invalid_Credential_ID");                  
                  errMsg["code"] = "ERR-MFA-VIP-003";
                  errMsg["message"] = libError.readErrorMessage("ERR-MFA-VIP-003"); 
                  nodeState.putShared("SymantecvalidationErrorCode",JSON.stringify(errMsg));                  
                  action.goTo(NodeOutcome.EMPTY_OTP);
              }
              else if (!token1 || !token2 ) {
              nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "security code is null or blank"+"::"+mail);
              nodeState.putShared("SymantecErrorMessage", "Blank_OTP");
              errMsg["code"] = "ERR-2FA-SYM-002";
              errMsg["message"] = libError.readErrorMessage("ERR-2FA-SYM-002"); 
              nodeState.putShared("SymantecvalidationErrorCode",JSON.stringify(errMsg));         
              action.goTo(NodeOutcome.EMPTY_OTP);
              } else {
              nodeLogger.debug(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition"+"::"+mail);
              nodeState.putShared("SymantecErrorMessage", null);
              action.goTo(NodeOutcome.VERIFY);    
              }
            }
          }
          }else if(selectedOutcome === 2){
            action.goTo(NodeOutcome.SKIP);  
          }

      } catch (error) {
          nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: " + error.message+"::"+mail);
          nodeState.putShared("SymantecErrorMessage", null);
          action.goTo(NodeOutcome.FAILED);
      }
  }

function isDuplicateSymantecCredId(credentialId) {
    logger.debug("collectedcredentialId: "+credentialId)
    var existingTelephoneNumber = null;
    var usrKOGID = null;
    var exist = false; 
    
    if(nodeState.get("KOGID") && nodeState.get("KOGID")!=null){
        usrKOGID = nodeState.get("KOGID");
    }
    // usrKOGID = "0143b817-8d3c-4cf8-ad3f-d7a347000000";
    // nodeState.putShared("usrKOGID",usrKOGID)
    var usrMFAData = getMFAObject(usrKOGID);
    var mfaValueArray = getUserActiveMFAValue(usrMFAData, "SYMANTEC")

    for(var i=0;i<mfaValueArray.length;i++){
        existingCredID = mfaValueArray[i];

    // Check for duplicates
        if (existingCredID.localeCompare(credentialId)==0){
            nodeState.putShared("ccredId",credentialId)
            exist = true;
        } else {
        }
    }
    return exist;
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
 
 
function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        return mfaMethodResponses;
 
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}

  // Main execution
  try {
      if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
  } catch (error) {
      nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
      nodeState.putShared("errorMessage", null)
      nodeState.putShared("errorduplicatesymanteccredid", null)
      nodeState.putShared("errorMessage_BlankOTP", null)
      action.goTo(NodeOutcome.FAILED);
  }
  
  
// JavaScript source code
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
  var dateTime = new Date().toISOString();

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "MFA Symantec EnterCredentialandToken",
      script: "Script",
      scriptName: "KYID.Journey.SymantecEnterCredentialandToken",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      VERIFY: "Verify",
      ANOTHER_FACTOR: "Choose Another Method",
      FAILED: "false",
      DUPLICATE: "Duplicate",
      EMPTY_OTP: "BlankOTP"
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
      }
  };
  
 // var DEBUG = "true";
  
  function getLocale() {
      var clocale = "en";
      if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
          if (requestCookies.clocale && requestCookies.clocale != null) {
              var cookieValue = requestCookies.clocale;
              if (cookieValue.localeCompare("en") == 0 || cookieValue.localeCompare("es") == 0) {
                  clocale = cookieValue;
              }
          }
      }
      nodeState.putShared("clocale", clocale);
      return clocale;
  }

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

  
  // Function to handle callback requests
  function requestCallbacks() {
      getLocale();
      var clocale = nodeState.get("clocale");
      try {
          if (clocale === "en") {
              // English locale
              if (nodeState.get("errorMessage") != null) {
                  var error = nodeState.get("errorMessage");
               callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)          
              }

              if (nodeState.get("errorduplicatesymanteccredid")){
               var errorduplicatesymanteccredid = nodeState.get("errorduplicatesymanteccredid");
			   callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorduplicatesymanteccredid+`</div>`)
              
            }

              if (nodeState.get("errorMessage_BlankOTP") != null) {
                var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_BlankOTP+`</div>`)
            }
              //callbacksBuilder.textOutputCallback(0,`<div class='page-element'></div>`)   

              if(nodeState.get("credId")){
                var credId = nodeState.get("credId")
                callbacksBuilder.textInputCallback("Enter Credential ID", credId);
            } else {
                callbacksBuilder.textInputCallback("Enter Credential ID");
            }
              
              callbacksBuilder.textInputCallback("Security Code 1");
              callbacksBuilder.textInputCallback("Security Code 2");
              callbacksBuilder.confirmationCallback(0, ["Enroll", "Return to authenticator list"], 0);
          } else if (clocale === "es") {
              // Spanish locale
              if (nodeState.get("errorMessage") != null) {
                  var error = nodeState.get("errorMessage");
                  callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
                  
              }

              if (nodeState.get("errorduplicatesymanteccredid")){
               var errorduplicatesymanteccredid = nodeState.get("errorduplicatesymanteccredid");
			   callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorduplicatesymanteccredid+`</div>`)
              
            }

              if (nodeState.get("errorMessage_BlankOTP") != null) {
            var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_BlankOTP+`</div>`)
        }
        
        if(nodeState.get("credId")){
            var credId = nodeState.get("credId")
            callbacksBuilder.textInputCallback("Restablecer métodos de seguridad", credId);
        } else {
            callbacksBuilder.textInputCallback("Restablecer métodos de seguridad");
        }
              
              callbacksBuilder.textInputCallback("Código de seguridad 1");
              callbacksBuilder.textInputCallback("Código de seguridad 2");
              callbacksBuilder.confirmationCallback(0, ["Volver a la solicitud", "Volver a la lista de autenticadores"], 0);
          } else {
              nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Unsupported locale: " + clocale);
  
          }
      } catch (error) {
          nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error requesting callbacks: " + error.message);
      }
  }
  
  // Function to handle user responses
  function handleUserResponses() {
      try {
          
          var credentialId = callbacks.getTextInputCallbacks().get(0).toUpperCase().trim();
          var token1 = callbacks.getTextInputCallbacks().get(1).trim();
          var token2 = callbacks.getTextInputCallbacks().get(2).trim();
          var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
  
          nodeState.putShared("selectedOutcome", selectedOutcome);
          nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :::: " + selectedOutcome);

           var isDuplicate = isDuplicateSymantecCredId(credentialId);
           if (isDuplicate) {
            nodeState.putShared("errorMessage", null)
            nodeState.putShared("errorMessage_BlankOTP", null)
            action.goTo(NodeOutcome.DUPLICATE);
               return;
           }

          
          nodeState.putShared("credId", credentialId)
          nodeState.putShared("otp1", token1)
          nodeState.putShared("otp2", token2)
  
          if (selectedOutcome === 1) {
              nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Choose Another Method condition");
              nodeState.putShared("errorMessage", null)
              nodeState.putShared("errorduplicatesymanteccredid", null)
              nodeState.putShared("errorMessage_BlankOTP", null)
              action.goTo(NodeOutcome.ANOTHER_FACTOR);
          } else if (selectedOutcome === 0) {
              var SymantecTransId =generateRandomCode();
              nodeState.putShared("Id", SymantecTransId);

              if (!credentialId || !token1 || !token2) {
              nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the credentialId null condition");
              nodeState.putShared("errorMessage", null)
              nodeState.putShared("errorduplicatesymanteccredid", null)
              action.goTo(NodeOutcome.EMPTY_OTP);
              } else {
              nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Symantec Transaction ID :: " + nodeState.get("Id"));
              nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
              nodeState.putShared("errorMessage", null)
              nodeState.putShared("errorduplicatesymanteccredid", null)
              nodeState.putShared("errorMessage_BlankOTP", null)
              action.goTo(NodeOutcome.VERIFY);    
              }

          } else if (!credentialId || !token1 || !token2) {
              nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the credentialId null condition");
              nodeState.putShared("errorMessage", null)
              nodeState.putShared("errorduplicatesymanteccredid", null)
              nodeState.putShared("errorMessage_BlankOTP", null)
              action.goTo(NodeOutcome.EMPTY_OTP);
          } else {
              nodeState.putShared("errorMessage", null)
              nodeState.putShared("errorduplicatesymanteccredid", null)
              nodeState.putShared("errorMessage_BlankOTP", null)
              action.goTo(NodeOutcome.FAILED);
          }
      } catch (error) {
          nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: " + error.message);
          nodeState.putShared("errorMessage", null)
          nodeState.putShared("errorduplicatesymanteccredid", null)
          nodeState.putShared("errorMessage_BlankOTP", null)
          action.goTo(NodeOutcome.FAILED);
      }
  }

function isDuplicateSymantecCredId(credentialId) {
    logger.error("collectedcredentialId: "+credentialId)
    var existingTelephoneNumber = null;
    var usrKOGID = null;
    var exist = false; 
    
    if(nodeState.get("KOGID") && nodeState.get("KOGID")!=null){
        usrKOGID = nodeState.get("KOGID");
    }
    logger.error("usrKOGID value is: "+usrKOGID)
    var usrMFAData = getMFAObject(usrKOGID);
    var mfaValueArray = getUserActiveMFAValue(usrMFAData, "SYMANTEC")

    for(var i=0;i<mfaValueArray.length;i++){
        logger.error("Symantec cred id is: "+mfaValueArray[i]);
        existingCredID = mfaValueArray[i];
         logger.error("existingCredID: "+existingCredID)
         logger.error("typeof existingCredID: "+typeof existingCredID)

    // Check for duplicates
        if (existingCredID.localeCompare(credentialId)==0){
            logger.error("****Duplicate credId********");
            exist = true;
        } else {
            logger.error("****Not Duplicate credId********");
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
        nodeLogger.error("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
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
  
  
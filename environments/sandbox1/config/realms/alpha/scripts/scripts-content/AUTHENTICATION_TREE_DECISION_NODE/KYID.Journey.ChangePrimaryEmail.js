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
      nodeName: "Change Primary Email",
      script: "Script",
      scriptName: "KYID.Journey.ChangePrimaryEmail",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      VERIFY: "Verify",
      FAILED: "false",
      DUPLICATE: "Duplicate",
      EMPTY_OTP: "BlankOTP",
      NOTMATCHING: "EmailDifferent"
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
  
  
  // Function to handle callback requests
  function requestCallbacks() {

      try {
          
              //callbacksBuilder.textOutputCallback(0,`<div class='page-element'></div>`)    
              
              //callbacksBuilder.textInputCallback("Current Email");
              callbacksBuilder.textOutputCallback(0,originalemail);
              callbacksBuilder.textInputCallback("New Email");
              callbacksBuilder.textInputCallback("Confirm New Email");
              callbacksBuilder.confirmationCallback(0, ["Continue"], 0);
        
  
          }
      catch (error) {
          nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error requesting callbacks: " + error.message);
      }
  }
  
  
  // Function to handle user responses
  function handleUserResponses() {
      try {
          
          //var originalemail = callbacks.getTextInputCallbacks().get(0).toUpperCase().trim();
          var newemail1 = callbacks.getTextInputCallbacks().get(0).trim();
          var newemail2 = callbacks.getTextInputCallbacks().get(1).trim();
          var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
  
          nodeState.putShared("selectedOutcome", selectedOutcome);
          nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :::: " + selectedOutcome);


          
          //nodeState.putShared("originalemail", originalemail)
          nodeState.putShared("newemail1", newemail1)
          nodeState.putShared("newemail2", newemail2)
  
          if (selectedOutcome === 0) {
              //var SymantecTransId =generateRandomCode();
              

              if (!newemail1 || !newemail2) {
              nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the newemail1 null condition");
              action.goTo(NodeOutcome.EMPTY_OTP);
              }
              else if (newemail1 !== newemail2) {
                action.goTo(NodeOutcome.NOTMATCHING)
              }
              else {
              nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the Submit condition");
              nodeState.putShared("EMAIL","MFAMethod")
              action.goTo(NodeOutcome.VERIFY);    
              }

          } else if (!newemail1 || !newemail2) {
              nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside the newemail1 null condition");
              action.goTo(NodeOutcome.EMPTY_OTP);
          } else {
              action.goTo(NodeOutcome.FAILED);
          }
      } catch (error) {
          nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user responses: " + error.message);
          action.goTo(NodeOutcome.FAILED);
      }
  }

function isDuplicateSymantecCredId(newemail1) {
    logger.error("collectednewemail1: "+newemail1)
    var existingTelephoneNumber = null;
    var usrKOGID = null;
    var exist = false; 
    
    if(nodeState.get("KOGID") && nodeState.get("KOGID")!=null){
        usrKOGID = nodeState.get("KOGID");
    }
    logger.error("usrKOGID value is: "+usrKOGID)
    var usrMFAData = getMFAObject(usrKOGID);
    var mfaValueArray = getUserActiveMFAValue(usrMFAData, "EMAIL")

    for(var i=0;i<mfaValueArray.length;i++){
        logger.error("Email is: "+mfaValueArray[i]);
        existingEmailID = mfaValueArray[i];
         logger.error("existingEmailID: "+existingEmailID)
         logger.error("typeof existingEmailID: "+typeof existingEmailID)

    // Check for duplicates
        if (existingEmailID.localeCompare(newemail1)==0){
            logger.error("****Duplicate newemail1********");
            exist = true;
        } else {
            logger.error("****Not Duplicate newemail1********");
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
          var originalemail = nodeState.get("mail")
          logger.error("line 173" +originalemail)
          nodeState.putShared("originalemail", originalemail)
          requestCallbacks();
      } else {
          handleUserResponses();
      }
  } catch (error) {
      nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
      action.goTo(NodeOutcome.FAILED);
  }
  
  
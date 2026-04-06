var dateTime = new Date().toISOString();

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "UserProfile",
      script: "Script",
      scriptName: "KYID.2B1.Journey.EnterEditableUserDetailsforInvitation",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      NEXT: "next",
      PHONEEXISTING: "Phone Number Existing",
      INVALIDPHONE: "Invalid Number",
      INVALIDEMAIL: "InvalidEmailFormat",
      INVALIDFN: "InvalidFirstName",
      INVALIDLN: "InvalidLastName",
      EMPTYEMAIL: "EmptyEmail",
      INVALIDNAME: "InvalidName"
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
  

//Basic validations on the phone number 
function isValidPhoneNumber(number) {
    logger.debug("Inside function isValidPhoneNumber: " + number);
    var result = false;
    if (number.length > 2 && number.length < 15) {
        //result = /^[+]?(\d{1,4})(-\d{1,4})*$/g.test(number);
        //result = new RegExp("^\\+?[1-9]\\d{9,14}$");
        result = new RegExp("^\\+?[1-9]\\d{9,14}$").test(number);
    }

    if (result) {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + number);
        nodeState.putShared("phonenumber", number);
    } else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + number);
        nodeState.putShared("invalidphoneNoMsg", "invalid_phoneNumber");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::invalid_phoneNumber");
    }

    return result;
}

function lookupInPhone(number) {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + " lookupInPhone");

    var mfaMethodResponses = openidm.query("managed/alpha_user", { "_queryFilter": '/telephoneNumber eq "' + number + '"' });
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + " mfaMethodResponses: " + JSON.stringify(mfaMethodResponses));

    if (mfaMethodResponses.result.length > 0) {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + " mfaMethodResponses is more than one");
        return true;
    }
    return false;
}

//Valicatin for First name and last name
function isValidName(name) {
    /*const nameRegex = /^[^?*<>@:;=,|"+\/\\[\]]*$/; // Regex to disallow special characters
    return name.length >= 2 && name.length <= 64 && nameRegex.test(name);*/

    var lib = require('KYID.2B1.RestrictedEntriesLibraryScript');
    var restrictedEntries = lib.checkRestrictedKeywords();
    logger.debug("restrictedEntries response : "+restrictedEntries);
    var checkUserInput = lib.checkInput(name,restrictedEntries);
    logger.debug("checkUserInput response : "+checkUserInput);
    if(checkUserInput == true){
        return false;
    }else{
        return true;
    }
}

//clear the nodestate
function clearSharedStates() {
    nodeState.putShared("errorInvalidEmailFormat", null);
    nodeState.putShared("invalidPhoneNumber", null);
    nodeState.putShared("phoneExistingMessage", null);
    nodeState.putShared("errorInvalidName", null);
}

nodeState.putShared("mail",null)
// Function to handle callback requests
function requestCallbacks() {
     logger.debug("inside requestCallbacks")

    if (nodeState.get("phoneExistingMessage") != null) {
                var phoneExistingMessage = nodeState.get("phoneExistingMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+phoneExistingMessage+`</div>`)
            }
			
    if (nodeState.get("invalidPhoneNumber") != null) {
                var invalidPhoneNumber = nodeState.get("invalidPhoneNumber");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+invalidPhoneNumber+`</div>`)
            }

    if (nodeState.get("errorInvalidEmailFormat")!=null){
                var errorInvalidEmailFormat = nodeState.get("errorInvalidEmailFormat")
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorInvalidEmailFormat+`</div>`);
           }

    if (nodeState.get("errorInvalidName") != null) {
    var errorInvalidName = nodeState.get("errorInvalidName");
    callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorInvalidName+`</div>`)
            }
            
            // if (nodeState.get("errorInvalidLastName") != null) {
            //     var errorInvalidLastName = nodeState.get("errorInvalidLastName");
            //     callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorInvalidLastName+`</div>`)
            // }
    
      try {      
              callbacksBuilder.textInputCallback("First Name");
              callbacksBuilder.textInputCallback("Last Name");
              callbacksBuilder.choiceCallback("Name Editable",  ["Y", "N"], 0, false);
              callbacksBuilder.textInputCallback("Email Address");
              callbacksBuilder.choiceCallback("Email Editable",  ["Y", "N"], 0, false);
              callbacksBuilder.textInputCallback("Phone Number");
              callbacksBuilder.choiceCallback("Phone Editable",  ["Y", "N"], 0, false);
              callbacksBuilder.confirmationCallback(0, ["Next"], 0);
          }
       catch (error) {
          logger.error("there is some error");
      }
  }
  
// Function to handle user responses
function handleUserResponses() {
     
          
          var firstname = callbacks.getTextInputCallbacks().get(0).trim();
          var lastname = callbacks.getTextInputCallbacks().get(1).trim();
          var email = callbacks.getTextInputCallbacks().get(2).trim();
          var phonenumber = callbacks.getTextInputCallbacks().get(3).trim();

          var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
          // var selectNameEditable = callbacks.getChoiceCallbacks(0).get(0)[0];
          // var selectEmailEditable = callbacks.getChoiceCallbacks(0).get(0)[1];
          // var selectPhoneEditable = callbacks.getChoiceCallbacks(0).get(0)[2];

         var selectNameEditable = callbacks.getChoiceCallbacks().get(0)[0]; 
         var selectEmailEditable = callbacks.getChoiceCallbacks().get(1)[0]; 
         var selectPhoneEditable = callbacks.getChoiceCallbacks().get(2)[0]; 

          var roleID = requestParameters.get("roleID");
          nodeState.putShared("selectedOutcome", selectedOutcome);
      
          nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +"Print Outcome Selected::" + selectedOutcome);
          logger.debug("Print email :::: " + email);
          nodeState.putShared("mail", email)
          nodeState.putShared("objectAttributes", {"mail": email}) 
          nodeState.putShared("sn", lastname)
          nodeState.putShared("givenName", firstname)
          nodeState.putShared("phonenumber", phonenumber)

          if(selectNameEditable === 1){
            nodeState.putShared("usrisNameEditable", "false")
          } else {
            nodeState.putShared("usrisNameEditable", "true")
          }
          if(selectEmailEditable === 1){
            nodeState.putShared("usrisEmailEditable", "false")
        } else {
          nodeState.putShared("usrisEmailEditable", "true")
        }
          
          if(selectPhoneEditable === 1){
            nodeState.putShared("usrisPhoneEditable", "false")
        } else {
          nodeState.putShared("usrisPhoneEditable", "true")
        }
          

          
//           if (selectedOutcome === 0) {
//             if(email !=null){
//                 var pattern = /^[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/i;
//                 var testMail = pattern.test(email);
//                 if (!testMail) {
//                     nodeState.putShared("invalidPhoneNumber",null);
//                     nodeState.putShared("phoneExistingMessage",null);
//                     nodeState.putShared("errorInvalidFirstName",null);
//                     nodeState.putShared("errorInvalidLastName",null);
//                     action.goTo(NodeOutcome.INVALIDEMAIL);
//                 }
          
//             else if(phonenumber){
//                 if(isValidPhoneNumber(phonenumber)){
//                     if(lookupInPhone(phonenumber)){
//                         nodeState.putShared("errorInvalidEmailFormat",null);
//                         nodeState.putShared("invalidPhoneNumber",null);
//                         nodeState.putShared("errorInvalidFirstName",null);
//                         nodeState.putShared("errorInvalidLastName",null);
//                         action.goTo(NodeOutcome.PHONEEXISTING);
//                     }
//                     else{
//                         nodeState.putShared("errorInvalidEmailFormat",null);
//                         nodeState.putShared("invalidPhoneNumber",null);
//                         nodeState.putShared("phoneExistingMessage",null);
//                         nodeState.putShared("errorInvalidFirstName",null);
//                         nodeState.putShared("errorInvalidLastName",null);
//                         action.goTo(NodeOutcome.NEXT);    
//                     }
//                  } else {
//                     nodeState.putShared("errorInvalidEmailFormat",null);
//                     nodeState.putShared("phoneExistingMessage",null);
//                     nodeState.putShared("errorInvalidFirstName",null);
//                     nodeState.putShared("errorInvalidLastName",null);
//                     action.goTo(NodeOutcome.INVALIDPHONE);
//                  }
//             } else if (!isValidName(firstname) || !firstname){
//                 nodeState.putShared("errorInvalidLastName",null);
//                 nodeState.putShared("phoneExistingMessage",null);
//                 nodeState.putShared("invalidPhoneNumber",null);
//                 nodeState.putShared("errorInvalidEmailFormat",null);
//                     action.goTo(NodeOutcome.INVALIDFN);
//                 } else if (!isValidName(lastname) || !lastname) {
//                 nodeState.putShared("errorInvalidFirstName",null);
//                 nodeState.putShared("phoneExistingMessage",null);
//                 nodeState.putShared("invalidPhoneNumber",null);
//                 nodeState.putShared("errorInvalidEmailFormat",null);
//                     action.goTo(NodeOutcome.INVALIDLN);
//                 }
            
//             else {
//                 nodeState.putShared("errorInvalidEmailFormat",null);
//                 nodeState.putShared("invalidPhoneNumber",null);
//                 nodeState.putShared("phoneExistingMessage",null);
//                 nodeState.putShared("errorInvalidFirstName",null);
//                 nodeState.putShared("errorInvalidLastName",null);
//                 action.goTo(NodeOutcome.NEXT);  
//             }
    
//               } else {
//                 nodeState.putShared("invalidPhoneNumber",null);
//                 nodeState.putShared("phoneExistingMessage",null);
//                 nodeState.putShared("errorInvalidFirstName",null);
//                 nodeState.putShared("errorInvalidLastName",null);
//                 action.goTo(NodeOutcome.EMPTYEMAIL);
//               }
// }


    if (selectedOutcome === 0) {
if (!isValidName(firstname) || !firstname || !isValidName(lastname) || !lastname) {
    clearSharedStates();
    action.goTo(NodeOutcome.INVALIDFN);

} else if (email != null) {
    // Email validation
    var pattern = /^[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/i;
    var testMail = pattern.test(email);

    if (!testMail) {
        clearSharedStates();
        action.goTo(NodeOutcome.INVALIDEMAIL);

    } else if (phonenumber) {
        // Phone number validation
        if (isValidPhoneNumber(phonenumber)) {
            if (lookupInPhone(phonenumber)) {
                clearSharedStates();
                action.goTo(NodeOutcome.PHONEEXISTING);
            } else {
                clearSharedStates();
                action.goTo(NodeOutcome.NEXT);
            }
        } else {
            clearSharedStates();
            action.goTo(NodeOutcome.INVALIDPHONE);
        }

    } else {
        clearSharedStates();
        action.goTo(NodeOutcome.NEXT);
    }

} else {
    clearSharedStates();
    action.goTo(NodeOutcome.EMPTYEMAIL);
}
}
           
}

  //Main execution
  try {
      var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
      if (callbacks.isEmpty()) {
          requestCallbacks();
          var roleID = nodeState.get("roleid")
          callbacksBuilder.textOutputCallback(1,roleID);    
      } else {
          handleUserResponses();
      }
  } catch (error) {
      var transactionid=requestHeaders.get("X-ForgeRock-TransactionId")
      nodeLogger.error(transactionid+ "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
  }



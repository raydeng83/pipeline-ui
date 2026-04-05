var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");


  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "UserProfile",
      script: "Script",
      scriptName: "KYID.2B1.RegistrationAcceptance.userInput",
      errorLastName:"lastName_validation_failed",
      errorFirstName:"firstName_validation_failed",
      errorFirstNameLastName:"firstName_lastName_validation_failed",
      errorEmail:"email validation failed",
      errorId_lastNameValidation:"errorID::KYID005",
      errorId_firstNameValidation:"errorID:KYID006",
      errorId_emaileValidation:"errorID:KYID007",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      NEXT: "next",
      INVALID_EMAIL: "invalidEmail",
      INVALID_NAME:"invalidName",
      ERROR:"error",
      BACK:"back",
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
  };
  
  // Function to handle callback requests
  function requestCallbacks() {
     nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Invoking requestCallback Function" );
      try {
         if (nodeState.get("errorMessage") != null) {
                var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }
            if (nodeState.get("errorInvalidName") != null) {
                var errorInvalidName = nodeState.get("errorInvalidName");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorInvalidName+`</div>`)
            }
              if (isNameEditable != null && isNameEditable == "false" && givenName != null && lastName != null ){
                  callbacksBuilder.textOutputCallback(0,"First Name :: "+givenName);
                  callbacksBuilder.textOutputCallback(0,"Last Name :: "+lastName);
              }
                else if(givenName!=null &&lastName!=null ){
                  callbacksBuilder.textInputCallback("First Name",givenName);
                  callbacksBuilder.textInputCallback("Last Name",lastName);
            }
              else{
                  callbacksBuilder.textInputCallback("First Name");
                  callbacksBuilder.textInputCallback("Last Name");
              }
        
             if (isEmailEditable != null && isEmailEditable == "false" && primaryEmail !=null){
                  callbacksBuilder.textOutputCallback(0,"Email Address :: "+primaryEmail);
              }
            else if(primaryEmail!=null ){
                callbacksBuilder.textInputCallback("Email Address",primaryEmail);
            }
            else if(collectedPrimaryEmail != null){
                 callbacksBuilder.textInputCallback("Email Address",collectedPrimaryEmail);
            }
          else{
              callbacksBuilder.textInputCallback("Email Address");
          }
            
              callbacksBuilder.confirmationCallback(0, ["Next","Back"], 1);
         if (getFaqTopicId != null) {
                
                callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
            }

          }
          
          
       catch (error) {
          logger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+"Error Occurred in Request Callback Function "+"::"+error )
          action.goTo(NodeOutcome.ERROR);
       }
      
  }
  
  // Function to handle user responses
  function handleUserResponses() {
      try {
          nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Invoking handleUserResponses Function" );
      var dynamicFields = [];
      if(isNameEditable == "true" ){
      // if (isNameEditable == null || isNameEditable == "true" || givenName != null || lastName != null){
            var givenName = callbacks.getTextInputCallbacks().get(0).trim();
            var lastName = callbacks.getTextInputCallbacks().get(1).trim();
            nodeState.putShared("givenName",givenName);
            nodeState.putShared("lastName",lastName);
            dynamicFields.push(givenName);
            dynamicFields.push(lastName);            
         }
         if (isEmailEditable == null || isEmailEditable == "true" || primaryEmail ==null ){
               collectedPrimaryEmail = callbacks.getTextInputCallbacks().get(dynamicFields.length).trim();
             logger.error("collectedPrimaryEmail is "+collectedPrimaryEmail )
             nodeState.putShared("collectedPrimaryEmail",collectedPrimaryEmail);
             dynamicFields.push(collectedPrimaryEmail);
             
         }

          var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
  
          nodeState.putShared("selectedOutcome", selectedOutcome);
      
         nodeLogger.error(" Print Outcome Selected :::: " + selectedOutcome);
         
          if (selectedOutcome === 0) {
              if (collectedPrimaryEmail == null){
                  collectedPrimaryEmail = primaryEmail;
              }
              if(isEmailEditable == "false"){
                  var checkEmail =true;
              }
              else{
                  var checkEmail = isValidEmail(collectedPrimaryEmail);
              }
              if(isNameEditable == "false"){
                  var checkName = true;
                  var checkLastName = true;
              }
              else{
                  var checkName = isValidName(givenName);
                  var checkLastName = isValidName(lastName);
              }
              
              nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "isNameValid :: " +checkName+ "::"+"isLastNameValid :: " +checkLastName +"::"+"::"+ "isEmailValid :: " +checkEmail );
              nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Collected First Name :: " +givenName+ "::"+"Collected Last Name :: " +lastName +"::"+"::"+ "Collected Email ID :: " +collectedPrimaryEmail );
              if(checkName == true && checkLastName == true && checkEmail == true){
                nodeState.putShared("errorMessage",null);
                nodeState.putShared("errorInvalidName",null);
                action.goTo(NodeOutcome.NEXT); 
              }
              else if(checkName == true && checkLastName == false && checkEmail == true){
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorLastName +"::"+ nodeConfig.errorId_lastNameValidation);
                  nodeState.putShared("errorMessage",null);
                  nodeState.putShared("lastName",null);
                  nodeState.putShared("errorInvalidName",null);
                  action.goTo(NodeOutcome.INVALID_NAME);
              }
              else if(checkName == false && checkLastName == true && checkEmail == true){
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorLastName +"::"+ nodeConfig.errorId_firstNameValidation);
                  nodeState.putShared("errorMessage",null);
                  nodeState.putShared("errorInvalidName",null);
                  nodeState.putShared("givenName",null);
                  action.goTo(NodeOutcome.INVALID_NAME);
              }
              else if(checkName == true && checkLastName == true && checkEmail == false){
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorEmail +"::"+ nodeConfig.errorId_emaileValidation);
                  nodeState.putShared("errorMessage",null);
                  nodeState.putShared("errorInvalidName",null);
                  nodeState.putShared("collectedPrimaryEmail",null);
                  action.goTo(NodeOutcome.INVALID_EMAIL);
              }
              else if(checkName == false && checkLastName == false && checkEmail == true){
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorLastName +"::"+ nodeConfig.errorId_lastNameValidation);
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorFirstName +"::"+ nodeConfig.errorId_firstNameValidation);
                  nodeState.putShared("errorMessage",null);
                  nodeState.putShared("errorInvalidName",null);
                  nodeState.putShared("lastName",null);
                  nodeState.putShared("givenName",null);
                  action.goTo(NodeOutcome.INVALID_NAME);
              }
              else if(checkName == false && checkLastName == false && checkEmail == false){
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorLastName +"::"+ nodeConfig.errorId_lastNameValidation);
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorFirstName +"::"+ nodeConfig.errorId_firstNameValidation);
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorEmail +"::"+ nodeConfig.errorId_emaileValidation);
                  nodeState.putShared("errorMessage",null);
                  nodeState.putShared("errorInvalidName",null);
                  nodeState.putShared("givenName",null);
                  nodeState.putShared("lastName",null);
                  nodeState.putShared("collectedPrimaryEmail",null);
                  action.goTo(NodeOutcome.INVALID_NAME);
              }
              else if(checkName == true && checkLastName == false && checkEmail == false){
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorLastName +"::"+ nodeConfig.errorId_lastNameValidation);
                  nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorEmail +"::"+ nodeConfig.errorId_emaileValidation);
                  nodeState.putShared("errorMessage",null);
                  nodeState.putShared("errorInvalidName",null);
                  nodeState.putShared("collectedPrimaryEmail",null);
                  nodeState.putShared("lastName",null);
                  action.goTo(NodeOutcome.INVALID_NAME);
              }
             
                 
              }
          else{
               nodeState.putShared("givenName",null);
              nodeState.putShared("collectedPrimaryEmail",null);
              nodeState.putShared("lastName",null);
                // if(nodeState.get("firstbacklimit")){
                //     var firstbacklimit = nodeState.get("firstbacklimit")
                // } else {
                //     var firstbacklimit = 1;
                // }
            
                // if (firstbacklimit > 2) {
                //     nodeState.putShared("maxlimitforfirstback","true");
                //     action.goTo(nodeOutcome.MAX_LIMIT);
                // } else {
                //     firstbacklimit++
                //     nodeState.putShared("firstbacklimit", firstbacklimit);
                    nodeState.putShared("userInput","back");
                    action.goTo(NodeOutcome.BACK);
                //}
            }
          
      } catch (error) {
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Error Occurred handleUserResponses Function"+"::"+error );
          action.goTo(NodeOutcome.ERROR);
      }
      

           }
 


// Validation Function
var inputFlag = null;

function isValidEmail(email) {
    inputFlag = "email";
    /*const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);    */

    var lib = require('KYID.2B1.Library.RestrictedEntriesLibraryScript');
	var restrictedEntries = lib.checkRestrictedEntries(inputFlag);
    logger.error("restrictedEntries response : "+restrictedEntries);
    var checkUserInput = lib.checkEmail(email,restrictedEntries);
    logger.error("checkEmail response : "+checkUserInput);
    if(checkUserInput == true){
        return false;
    }else{
        return true;
    }
}


// function isValidEmail(email) {
//     inputFlag = "email";
    
    /*const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (typeof email !== 'string') return false;

    const trimmedEmail = email.trim();
    const parts = trimmedEmail.split('@');

    if (parts.length !== 2) return false;

    const [local, domain] = parts;

    // Check combined length of local and domain (excluding '@')
    if ((local.length + domain.length) > 128) {
        return false;
    }
    return emailRegex.test(trimmedEmail);*/
//}

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


    
//Main execution
try {
      nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Invoking main Function" );
      var collectedPrimaryEmail = null;
      var lib = require("KYID.Library.FAQPages");
      var process ="SelfRegistration";
      var pageHeader= "1_userInput";
      var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
      if(nodeState.get("collectedPrimaryEmail") != null){
      collectedPrimaryEmail=nodeState.get("collectedPrimaryEmail");
      }
      var givenName = null;
      if(nodeState.get("givenName") != null){
          givenName= nodeState.get("givenName");
      }
      var lastName = null;
      if(nodeState.get("lastName")!= null){
         lastName= nodeState.get("lastName");
      }
      var primaryEmail = null;
      if(nodeState.get("primaryEmail") != null){
       primaryEmail=nodeState.get("primaryEmail");
      }
      // var telephoneNumber = nodeState.get("telephoneNumber");
      var isNameEditable = "true";
      if(nodeState.get("isNameEditable")!= null){
         isNameEditable= nodeState.get("isNameEditable");
      }
      var isEmailEditable = "true";
      if(nodeState.get("isEmailEditable")!=null){
         isEmailEditable= nodeState.get("isEmailEditable");
      }
      var isPhoneEditable = null;
      if(nodeState.get("isPhoneEditable")!=null){
          isPhoneEditable=nodeState.get("isPhoneEditable");
      }
      if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
  } catch (error) {
      nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error);
      action.goTo(NodeOutcome.ERROR);  
}
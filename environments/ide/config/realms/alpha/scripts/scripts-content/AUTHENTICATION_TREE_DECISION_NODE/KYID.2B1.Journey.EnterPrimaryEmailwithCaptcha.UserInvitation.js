var dateTime = new Date().toISOString();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");


  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "UserProfile",
      script: "Script",
      scriptName: "KYID.2B1.Journey.EnterPrimaryEmailwithCaptcha",
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
      TRUE: "true",
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

        //   if(requestHeaders.get("accept-language") && requestHeaders.get("accept-language")!=null){
        //         logger.debug("requestHeaders is :: " + requestHeaders.get("accept-language"))
        //         var userLanguageUser = requestHeaders.get("accept-language");
        //         var userLanguage = userLanguageUser[0];
        //         if(userLanguage.includes("es-ES")){
        //             nodeState.putShared("userLanguage","es")
        //         }else{
        //             nodeState.putShared("userLanguage","en")
        //         }
        // }
        if(requestHeaders.get("accept-language") && requestHeaders.get("accept-language")!=null){
                logger.debug("requestHeaders is :: " + requestHeaders.get("accept-language"))
                logger.debug("requestHeaders is :: is " + requestHeaders.get("accept-language")[0])
                var userLanguageUser = requestHeaders.get("accept-language");
                var userLangCode = userLanguageUser[0] || "en-EN";
                userLangCode = userLangCode.split("-")[0]
                var languageMap =systemEnv.getProperty("esv.language.preference");
                var lang = getLangCode(userLangCode, languageMap) || "en";
                logger.debug("lang is :: " + lang)
                languagePreference = lang || "1";
                nodeState.putShared("languagePreference",languagePreference);
                nodeState.putShared("userLanguage",languagePreference);
                nodeState.putShared("frUnindexedString3",languagePreference);
                // if(userLanguage.includes("es-ES")){
                //     nodeState.putShared("userLanguage","es")
                // }else{
                //     nodeState.putShared("userLanguage","en")
                // }
        }
         if (nodeState.get("errorMessage") != null) {
                var error = nodeState.get("errorMessage");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
            }
            if (nodeState.get("errorInvalidName") != null) {
                var errorInvalidName = nodeState.get("errorInvalidName");
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorInvalidName+`</div>`)
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
          //action.goTo(NodeOutcome.ERROR);
       }
      
  }
  
  // Function to handle user responses
  function handleUserResponses() {
      try {
          nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Invoking handleUserResponses Function" );
      var dynamicFields = [];

         if (isEmailEditable == null || isEmailEditable == "true" || primaryEmail ==null ){
            collectedPrimaryEmail = callbacks.getTextInputCallbacks().get(dynamicFields.length).trim();
            logger.debug("collectedPrimaryEmail is "+collectedPrimaryEmail )
            nodeState.putShared("collectedPrimaryEmail",collectedPrimaryEmail);

            dynamicFields.push(collectedPrimaryEmail);
             
         }

          var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
  
          nodeState.putShared("selectedOutcome", selectedOutcome);
      
         nodeLogger.debug(" Print Outcome Selected :::: " + selectedOutcome);
         
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

              nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "isEmailValid :: " +checkEmail );
              nodeLogger.info(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Collected Email ID :: " +collectedPrimaryEmail );
              if(checkEmail == true){
                nodeState.putShared("errorMessage",null);
                nodeState.putShared("errorInvalidName",null);
                logger.debug("InsidethenextCondition");
                nodeState.putShared("next","next")
                action.goTo("true")
              //  action.goTo(NodeOutcome.NEXT); 
              }
              else{
                  nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorLastName +"::"+ nodeConfig.errorId_lastNameValidation);
                  nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorFirstName +"::"+ nodeConfig.errorId_firstNameValidation);
                  nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ nodeConfig.errorEmail +"::"+ nodeConfig.errorId_emaileValidation);
                  nodeState.putShared("errorMessage",null);
                  nodeState.putShared("errorInvalidName",null);
                  nodeState.putShared("collectedPrimaryEmail",null);
                  nodeState.putShared("errorinvalidName","errorinvalidName")
                  action.goTo("true")
               //   action.goTo(NodeOutcome.INVALID_NAME);
              }
              
             
                 
              }
          else{

              nodeState.putShared("collectedPrimaryEmail",null);

                    nodeState.putShared("userInput","back");
                    action.goTo("true")
                  //  action.goTo(NodeOutcome.BACK);

            }
          
      } catch (error) {
          nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"::"+ "Error Occurred handleUserResponses Function"+"::"+error );
          nodeState.putShared("scriptfailed","scriptfailed")
          action.goTo("true")
         // action.goTo(NodeOutcome.ERROR);
      }
      

           }
 


// Validation Function
var inputFlag = null;

function isValidEmail(email) {
    inputFlag = "email";
    var lib = require('KYID.2B1.Library.RestrictedEntriesLibraryScript');
	var restrictedEntries = lib.checkRestrictedEntries(inputFlag);
    logger.debug("restrictedEntries response : "+restrictedEntries);
    var checkUserInput = lib.checkEmail(email,restrictedEntries);
    logger.debug("checkEmail response : "+checkUserInput);
    if(checkUserInput == true){
        return false;
    }else{
        return true;
    }
}

function getLangCode(langCode, languageMap){
    var languageMap = JSON.parse(languageMap);
    var langCode = langCode;
    var langKey = null;
    
    for(var key in languageMap){
        if(languageMap[key] == langCode){
            langKey = key;
            break;
        }
    }
    return langKey;
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
      if(nodeState.get("requestedUserAccountAttibutes")){
          var requestedUserAccountAttibutes = nodeState.get("requestedUserAccountAttibutes")
          for(var i=0; i<requestedUserAccountAttibutes.length; i++){
              if(requestedUserAccountAttibutes[i].attributeName === "mail"){
                  primaryEmail = requestedUserAccountAttibutes[i].attributeName
                  nodeState.putShared("collectedPrimaryEmail",primaryEmail)
                  if(requestedUserAccountAttibutes[i].isReadOnly === true){
                     isEmailEditable = "false"
                  }
                  else{
                      isEmailEditable = "true"
                  }
                  
                  
                  }
                }
        }
      if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
  } catch (error) {
      nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error);
      nodeState.putShared("scriptfailed","scriptfailed")
      action.goTo("true"); 
      action.goTo(NodeOutcome.ERROR);  
}
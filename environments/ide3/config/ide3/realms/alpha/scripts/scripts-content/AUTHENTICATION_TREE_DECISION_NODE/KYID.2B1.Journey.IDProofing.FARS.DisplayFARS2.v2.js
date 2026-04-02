var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "MCI API Call",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.FARS.DisplayFARS2.v2",
    timestamp: dateTime,
     end: "Node Execution Completed"
  };
  
  var NodeOutcome = {

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
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var userInfoJSON = null;
    var transactionRecord = null;
    var referenceId = null;
    var helpDeskContact = null;
    var visitInPerosnalInfo = null;
    var displayFARS = {
        referenceId:referenceId,
        submitedUserInfo : userInfoJSON,
        helpDeskDetails:helpDeskContact,
        requiredDocuments:visitInPerosnalInfo
    }


    var userInfo = nodeState.get("userInfoJSON") || {};
    var  telephoneNumber = nodeState.get("telephoneNumber") || null;
    userInfo.mobileNumber = telephoneNumber;
    nodeState.putShared("userInfoJSON",userInfo)
    
    if(nodeState.get("userInfoJSON")){
        displayFARS.submitedUserInfo = nodeState.get("userInfoJSON")
    }
    if(nodeState.get("helpdeskContact")){
        displayFARS.helpDeskDetails = nodeState.get("helpdeskContact")
    }
    if(nodeState.get("documents")){
        displayFARS.requiredDocuments = nodeState.get("documents")
    }
    if(nodeState.get("refId")){
        displayFARS.referenceId = nodeState.get("refId") ||nodeState.get("ridpReferenceID")
    }

    //displayFARS.localOfficeMessage = "Local Office"


    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }

} catch (error) {
    nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
}

function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        var lib = require("KYID.Library.FAQPages");
        var mfaOptions = null;
        var documents = nodeState.get("documents") || ""
        var ridpReferenceID = null;
        var jsonobj = {};

        // var requiredDocuments = []
        // requiredDocuments.push(documents);

        if (nodeState.get("validationMessage") != null) {
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        var pageHeader= {"pageHeader": "Display_2_FARS"};
        callbacksBuilder.textOutputCallback(1, JSON.stringify(pageHeader));
        // var pageHeader= "2_add_methods";
         //callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
        //callbacksBuilder.textOutputCallback(0,JSON.stringify(requiredDocuments));

         if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
             if(nodeState.get("flow")==="helpdesk"){
                //var pageHeader = {"pageHeader":"IdentityVerificationError"};
                ridpReferenceID  = nodeState.get("ridpReferenceID");
                //callbacksBuilder.textOutputCallback(1, JSON.stringify(pageHeader));
                jsonobj["Flow"]=nodeState.get("flowName");
                jsonobj["ErrorMsg"] =nodeState.get("errorMessage");
                //sonobj["ErrorMsg"] ="We are unable to verify your identity based on the submitted information. Please contact KYID Help desk with the following reference code for further assistance."
                jsonobj["HelpDeskContactId"] = nodeState.get("helpdeskContact") || "b93154a8-a55f-4e4e-8769-bdad375eb852";
                jsonobj["TransactionId:"] = ridpReferenceID;
                jsonobj["TransactionDateTime"]=dateTime;
                jsonobj["UseCaseInput"] = nodeState.get("collectedPrimaryEmail") || nodeState.get("EmailAddress");
                jsonobj["userAttributes"] = nodeState.get("userAttributesForTransaction") || "";
                jsonobj["associatedAccounts"] = nodeState.get("associatedAccounts") || "";
                jsonobj["Context"] = nodeState.get("Context") || "resume";
                jsonobj["verifiedLexID"] = nodeState.get("verifiedLexIdHelpdesk") || nodeState.get("verifiedLexId") || "";
                jsonobj["userLexID"] = nodeState.get("uuid") || "";
                jsonobj["riskIndicator"] = nodeState.get("riskIndicator") || "";
                var refernceObj = {"referenceId": ridpReferenceID}
                callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
             }
             
             officeLocation = [{
                 "officeName":"Location DCB Office",
                 "link":"https:dbcOfficeLink"
             },
            {
                 "officeName":"Location Kynector Office",
                 "link":"https:kynectorLink"
             }
                 
             ]
            callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
             // displayFARS["officeLocation"]= JSON.parse(systemEnv.getProperty("esv.ridp.lexisnexis.fars.office")) || {};
             // callbacksBuilder.textOutputCallback(0,JSON.stringify(displayFARS));
             
         }else {
           // officeLocation = [            {
           //       "officeName":"Location Kynector Office",
           //       "link":"https:kynectorLink"
           //   }     
           // ]
            displayFARS["officeLocation"]= JSON.parse(systemEnv.getProperty("esv.ridp.cms.fars.office")) || {};
            callbacksBuilder.textOutputCallback(0,JSON.stringify(displayFARS));
        }
        // callbacksBuilder.textInputCallback("Response")
        // allbacksBuilder.textInputCallback("Last Name");
        callbacksBuilder.confirmationCallback(0, ["Done"], 0);
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}


function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 0){
            action.goTo("Next")
        }
    } catch (error) {
        logger.error(
            (typeof transactionid !== "undefined" ? transactionid : "") + "::" +
            (nodeConfig && nodeConfig.timestamp ? nodeConfig.timestamp : "") + "::" +
            (nodeConfig && nodeConfig.node ? nodeConfig.node : "") + "::" +
            (nodeConfig && nodeConfig.nodeName ? nodeConfig.nodeName : "") + "::" +
            (nodeConfig && nodeConfig.script ? nodeConfig.script : "") + "::" +
            (nodeConfig && nodeConfig.scriptName ? nodeConfig.scriptName : "") + "::" +
            (nodeConfig && nodeConfig.begin ? nodeConfig.begin : "") + "::" +
            "error occurred in handleUserResponses function ::" + error +
            (typeof mail !== "undefined" ? mail : "")
        );
        nodeState.putShared("validationMessage", "invalid_input");
        action.goTo("error");
    }
}


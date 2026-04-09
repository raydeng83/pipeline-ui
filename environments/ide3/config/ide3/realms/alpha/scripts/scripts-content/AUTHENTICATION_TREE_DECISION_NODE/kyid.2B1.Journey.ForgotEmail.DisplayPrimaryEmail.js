var auditLib = require("KYID.2B1.Library.AuditLogger")
var userEmail = null;
var userId = null;
var emailMaskedList=[];

function requestCallbacks() {
    try{
    //callbacksBuilder.textOutputCallback(1, "")
        //var emailObj;
        var headerObj={
         "pageHeader": "3_forgot_email"
      }
        callbacksBuilder.textOutputCallback(1, JSON.stringify(headerObj));
        logger.debug("ListOfPrimaryEmails" + nodeState.get("ListOfPrimaryEmails"))
        if(nodeState.get("ListOfPrimaryEmails")){
            var raw = nodeState.get("ListOfPrimaryEmails");
            //logger.debug("type of ListOfPrimaryEmails" + typeof nodeState.get("ListOfPrimaryEmails"))
            if(nodeState.get("method") == "alternatemail"){
                var emailList= nodeState.get("ListOfPrimaryEmails");
                 nodeState.putShared("method", null);
            }else{
                var emailList = Array.isArray(raw) ? raw : (typeof raw === "string" && raw.trim() !== "") ? JSON.parse(raw): [];
            }
            
            //var emailList= JSON.parse(nodeState.get("ListOfPrimaryEmails"));
            if (emailList.length === 1) {
                // this has been added to log the user activity
                userEmail = emailList[0];
                var forgotEmailviaAlternatemail = nodeState.get("forgotEmailviaAlternatemail") || null;
                logger.debug("forgotEmailviaAlternatemail" +nodeState.get("forgotEmailviaAlternatemail"));
                if(forgotEmailviaAlternatemail)
                {
                auditLog("VER007", "Validate Alternate Email");
                }
                auditLog("ACR001", "Primary Email Address Recovery");
           }
           //logger.error("NoPrimaryEmail_EmailList"+emailList)
           if(emailList.length>=1){
                //callbacksBuilder.textOutputCallback(0, "We found more than one account associated with the alternate email you entered");
                for (var i=0; i<emailList.length; i++){ 
                    logger.debug("List_of_PrimaryEmails:"+emailList[i]);
                    userEmail=emailList[i];
                    var lastLetter = userEmail.split("@")[0]
                    lastLetter = lastLetter.slice(-2)
                    var maskedEmail = userEmail[0] + "****" + lastLetter + "@" + userEmail.split("@")[1]
                    emailMaskedList.push(maskedEmail);
                }
                //callbacksBuilder.confirmationCallback(0, ["Sign_In"], 0);
            }  
            logger.debug("emailMaskedList is :: " + JSON.stringify(emailMaskedList))
            var emailObj = {
                "emailAccounts": emailMaskedList
            };
    
            callbacksBuilder.textOutputCallback(0,JSON.stringify(emailObj));
            callbacksBuilder.confirmationCallback(0, ["Try_different_verification_method"], 0);
         }
        //logger.error("PrintingMaskedEmailList:"+emailMaskedList);
        
        //
        if(getFaqTopicId!= null){
            callbacksBuilder.textOutputCallback(0,getFaqTopicId+"");
        }
     
       action.goTo("True");
    }catch(e){
        logger.error("Main script error: " + e);
        action.goTo("True");
    }
}


function handleUserResponses() {
    try {
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];

        
        if(selectedOutcome === 0){
            logger.debug("Inside_Try_different_verification_method");
            nodeState.putShared("Try_different_verification_method",true);
            action.goTo("True");
            }else {
            logger.debug("Unexpected confirmation outcome: " + selectedOutcome);
            action.goTo("True");
        }

    } catch (error) {
        logger.error(":: Error in handleUserResponses: " + error.message);
    }
}

try{
    var lib = require("KYID.Library.FAQPages");
    var process ="SelfRegistration";
    var pageHeader= "3_additional_alternate_email";
    var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
    
    nodeState.putShared("PrimaryEmailFlag",false);
        
    if (callbacks.isEmpty()) {
            requestCallbacks();
    }else {
        handleUserResponses();
    }
}
catch(e){
    logger.error(e.message);
}


function auditLog(code, message){
    try{
         var auditLib = require("KYID.2B1.Library.AuditLogger")
          var headerName = "X-Real-IP";
         var headerValues = requestHeaders.get(headerName); 
          var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
           var browser = requestHeaders.get("user-agent"); 
           var os = requestHeaders.get("sec-ch-ua-platform"); 
         //  var userId = null;
                   var eventDetails = {};
              eventDetails["IP"] = ipAdress;
               eventDetails["Browser"] = browser;
         eventDetails["OS"] = os;
         eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
          //var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";

         //MFA Reporting
           var purpose = "";
            var journeyName = nodeState.get("journeyName");
            var alternateJourneyName = nodeState.get("journeyNameReporting");
            var journeyPurposeMapping = systemEnv.getProperty("esv.mfapurpose.mapper");
            var parsedjourneyPurposeMapping = JSON.parse(journeyPurposeMapping)
            logger.error("the journey name in kyid.2B1.Journey.ForgotEmail.DisplayPrimaryEmail:: "+nodeState.get("journeyName"))
            if (journeyName) {
                logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[journeyName])
               
                if (parsedjourneyPurposeMapping) {
                    if (parsedjourneyPurposeMapping.hasOwnProperty(journeyName)) {
                        logger.error("Journey Name: " + journeyName + ", Purpose: " + parsedjourneyPurposeMapping[journeyName]);
                        purpose = parsedjourneyPurposeMapping[journeyName];
                    } else {
                        logger.error("No purpose mapping found for Journey Name: " + journeyName);
                        if (alternateJourneyName && parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                            logger.error("Trying alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                            purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                        }
                        }
                    }
                } else if (alternateJourneyName) {
                    logger.error("the journeyPurposeMapping esv is "+JSON.stringify(journeyPurposeMapping))
                    logger.error("the journeyPurposeMapping esv is parsedjourneyPurposeMapping "+parsedjourneyPurposeMapping[alternateJourneyName])
                    if (parsedjourneyPurposeMapping) {
                        if (parsedjourneyPurposeMapping.hasOwnProperty(alternateJourneyName)) {
                            logger.error("Alternate Journey Name: " + alternateJourneyName + ", Purpose: " + parsedjourneyPurposeMapping[alternateJourneyName]);
                            purpose = parsedjourneyPurposeMapping[alternateJourneyName];
                        } else {
                            logger.error("No purpose mapping found for Alternate Journey Name: " + alternateJourneyName);
                        }
                    }
                }
                    
                
                eventDetails["purpose"] = purpose || ""

               if(nodeState.get("journeyName") === "PasswordRecovery" 
                   || nodeState.get("journeyName") === "BSPUserVerification"
                   || nodeState.get("journeyName") === "MyAccountUpdate"
                   || nodeState.get("journeyNameReporting") ==="MFARecovery"
                   || nodeState.get("journeyName") ==="accountRecovery"){
                    eventDetails["action"] = "MFA Performed"
                }

               if(message === "Account Recovery Failure"){
                    eventDetails["mfastatus"] = "Failed"
                } else {
                    eventDetails["mfastatus"] = "Successful"
                }

               eventDetails["mfatype"] = "Alternate Email OTP";
        
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];

                if (userEmail){
              var userQueryResult = openidm.query("managed/alpha_user", {
                     _queryFilter: 'mail eq "' + userEmail + '"'
                 }, ["_id"]);
              userId = userQueryResult.result[0]._id;
                }

                auditLib.auditLogger(code, sessionDetails, message, eventDetails, userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId,requestHeaders)
    }catch(error){
        logger.error("Failed to log the user activity "+ error)
        //action.goTo(NodeOutcome.SUCCESS);
    }
    
}

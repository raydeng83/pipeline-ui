var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Script: LexisNexis",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexis.Phone.Email.Verification",
    timestamp: dateTime,
    end: "Node Execution Completed"
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

// Main Function
function main() {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");  
    var flowName = null
    try {
        logger.error("differentMail :: " + nodeState.get("differentMail"))
        if(nodeState.get("differentMail") && nodeState.get("differentMail") === "true"){
            nodeState.putShared("differentMail", null)
            nodeState.putShared("alternateEmail", null)
            action.goTo("skip");
        }else{
            var mail = nodeState.get("mail");
            var displayCallBackJSON = {
                apiCalls: [
                {
                    method: "LexisNexis"
                }
                ],
                collectedUserInfo: nodeState.get("userInfoJSON") || nodeState.get("userInfoJSON1"),
                userMail: mail
            };
    
            if (nodeState.get("verification") === "phone") {
                displayCallBackJSON.apiCalls[0].action = "phoneVerification";
                flowName = "Phone Verification"
                displayCallBackJSON.collectedUserInfo.telephoneNumber =  nodeState.get("telephoneNumber") ||  nodeState.get("mobileNumber")
            } else if (nodeState.get("verification") === "mail") {
                displayCallBackJSON.apiCalls[0].action = "emailVerification";
                flowName = "Email Verification"
                if(nodeState.get("changePrimary") ==="true"){
                    displayCallBackJSON.collectedUserInfo.mail =  nodeState.get("collectedPrimaryEmail")
                }else{
                    displayCallBackJSON.collectedUserInfo.mail =  nodeState.get("alternateEmail")
                }
            }
            logger.debug("collectedUserInfo is :: "+ JSON.stringify(displayCallBackJSON))
            if (callbacks.isEmpty()) {
                requestCallbacks(displayCallBackJSON);
            } else {
                handleUserResponses(flowName);
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ error);
    }
}

main();

// Function to request Callbacks
function requestCallbacks(displayCallBackJSON) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside requestCallbacks Function");
    var pageHeader = null;
    
    try {

        if(nodeState.get("verification") === "phone"){
           pageHeader = {"pageHeader": "2_RIDP_lexisNexis_Phone_Verification"};
           nodeState.putShared("flowContext", "phoneFinder")
        }else  if(nodeState.get("verification") === "mail"){
           pageHeader = {"pageHeader": "2_RIDP_lexisNexis_Mail_Verification"};
           nodeState.putShared("flowContext", "emailAge")
        }
        

        if (nodeState.get("validationMessage") != null) {
            logger.debug("validationMessage"+nodeState.get("validationMessage") )
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
        callbacksBuilder.textInputCallback("Response")
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }
}

// Function to handle User Responses
function handleUserResponses(flowName) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses Function");
    var response = null;
    var selectedOutcome = null;
    var transactionIdLN = null;
    var risk = null;
    var requestStatus = null;
    var riskReason = null;
    var riskReasonID = null;
    var riskReasonDescription = null;
    var riskBand = null;
    var failureReason = null;
    var reason = null;
    var title = null;
    var mail = nodeState.get("mail") || "";
    var userInfo = nodeState.get("userInfoJSON");
    var lexisnexisResponse = null;
    var riskFlag = true;
    var parsedResponse = null
    
    try {
        selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if(selectedOutcome === 0){
            response = callbacks.getTextInputCallbacks().get(0);
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "User Response: " + response);
            nodeState.putShared("lexisnexisResponse", JSON.parse(response))
            lexisnexisResponse = response;
            parsedResponse = JSON.parse(response)
            logger.error("parsedResponse is :: " + JSON.stringify(parsedResponse))
            var queryResponse = openidm.query("managed/alpha_kyid_ridp_config", {"_queryFilter" : "true"});
            logger.debug("response from query :: " + JSON.stringify(queryResponse))
            riskFlag = queryResponse.result[0].ridp_emailage_high_risk;
            logger.error("riskFlag from query :: " + riskFlag)
            riskFlagPhone = queryResponse.result[0].ridp_phonefinder_high_risk;
            logger.error("riskFlagPhone from query :: " + riskFlagPhone)
            logger.error("risk is :: " + parsedResponse.risk)
            // Ensure required attributes are present in parsedResponse
            if (parsedResponse.transactionId && parsedResponse.risk) {
                // Store values in nodeState
                transactionIdLN = parsedResponse.transactionId || "" ;
                risk = parsedResponse.risk || "" ;
                requestStatus = parsedResponse.requestStatus || "" ;
                riskReason = parsedResponse.reason || "" ;
                riskReasonID = parsedResponse.riskReasonId || "" ;
                riskReasonDescription = parsedResponse.riskReasonDescription || "" ;
                riskBand = parsedResponse.riskBand || "" ;
                failureReason = parsedResponse.failureReason || "" ;

                logger.debug("phoneFinderRiskIndicator is :: " + JSON.stringify(parsedResponse.phoneFinderRiskIndicator))
                logger.debug("emailageRiskIndicator is :: " + JSON.stringify(parsedResponse.emailageRiskIndicator))


                if(parsedResponse.emailageRiskIndicator && parsedResponse.emailageRiskIndicator != null){
                    logger.debug("inside alternateEmailRiskIndicator")
                    var transformedDetails = transformRiskIndicatorDetails(parsedResponse.emailageRiskIndicator);
                     logger.debug("alternateEmailRiskIndicator transformedDetails is :: " + JSON.stringify(transformedDetails))
                    nodeState.putShared("alternateEmailRiskIndicator", JSON.stringify(transformedDetails));
                    nodeState.putShared("alternateEmailRiskIndicatorForTransaction",transformedDetails);
                } 
                
                if(parsedResponse.phoneFinderRiskIndicator && parsedResponse.phoneFinderRiskIndicator != null){
                    logger.debug("inside phoneFinderRiskIndicator")
                    var transformedDetails = transformRiskIndicatorDetails(parsedResponse.phoneFinderRiskIndicator);
                     logger.debug("phoneRiskIndicator transformedDetails is :: " + JSON.stringify(transformedDetails))
                    logger.error("transformedDetails is :: " + JSON.stringify(transformedDetails))
                    nodeState.putShared("phoneFinderRiskIndicator", JSON.stringify(transformedDetails));
                    nodeState.putShared("phoneFinderRiskIndicatorForTransaction", transformedDetails);
                }

                if(parsedResponse.riskIndicatorDetails && parsedResponse.riskIndicatorDetails != null){
                    logger.debug("inside riskIndicatorDetails")
                    nodeState.putShared("riskIndicatorDetails", JSON.stringify(parsedResponse.riskIndicatorDetails));
                    nodeState.putShared("riskIndicatorDetailsForTransaction", parsedResponse.riskIndicatorDetails);
                }

                nodeState.putShared("transactionIdLN", transactionIdLN);
                //nodeState.putShared("risk", risk);
                nodeState.putShared("mailRisk",risk)
                nodeState.putShared("requestStatus", requestStatus);
                nodeState.putShared("riskReason", riskReason);
                nodeState.putShared("riskReasonId", riskReasonID);
                nodeState.putShared("riskReasonDescription", riskReasonDescription);
                nodeState.putShared("riskBand", riskBand);
                nodeState.putShared("failureReason", failureReason);

                if(nodeState.get("verification") === "phone" && riskFlagPhone  && risk && risk.toLowerCase() === "high"){
                    nodeState.putShared("errorMessage","KYID-LN-000")
                    reason = "The LexisNexis response contains high risk indicators";
                    var title =""
                     if(nodeState.get("verification") === "phone"){
                      title = "Phone verification failed as part of Phone Finder Verification";
                    }else  if(nodeState.get("verification") === "mail"){
                      title = "Email verification failed as part of Email Age Verification";
                    }
                    
                    auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                    auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                    nodeState.putShared("alternateEmail", null)
                    patchHighRisk();
                    action.goTo("highRisk");
                }else if(nodeState.get("verification") === "mail" && riskFlag && risk && risk.toLowerCase() === "high"){
                    nodeState.putShared("errorMessage","KYID-LN-000")
                    reason = "The LexisNexis response contains high risk indicators";
                    var title =""
                     if(nodeState.get("verification") === "phone"){
                      title = "Phone verification failed as part of Phone Finder Verification";
                    }else  if(nodeState.get("verification") === "mail"){
                      title = "Email verification failed as part of Email Age Verification";
                    }
                    
                    auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                    auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                    nodeState.putShared("alternateEmail", null)
                    patchHighRisk();
                    action.goTo("highRisk");
                } else if (risk) {
                    nodeState.putShared("phoneVerification", "success")
                    var text = "Verification"
                     if(nodeState.get("verification") === "phone"){
                       nodeState.putShared("flowContext", "phoneFinder")
                         text = "Phone Verification"
                    }else  if(nodeState.get("verification") === "mail"){
                       nodeState.putShared("flowContext", "emailAge")
                          text = "Email Verification"
                    }
                    auditLog("KYID-LN-007", `${flowName} success as part of ${text}`, false, transactionid, flowName, mail, null, null, null, null, true);
                    action.goTo("success");
                }

                // if(risk && risk.toLowerCase() === "high" && riskFlag) {
                //     nodeState.putShared("errorMessage","KYID-LN-000")
                //     reason = "The LexisNexis response contains high risk indicators";
                //     var title =""
                //      if(nodeState.get("verification") === "phone"){
                //       title = "Phone verification failed as part of Phone Finder Verification";
                //     }else  if(nodeState.get("verification") === "mail"){
                //       title = "Email verification failed as part of Email Age Verification";
                //     }
                    
                //     auditLog("KYID-LN-000", `${flowName} - High Risk Transaction`, true, transactionid, flowName, mail, userInfo, lexisnexisResponse, reason, title);
                //     auditLog("KYID-LN-000", `User identity verification failed as part of ${flowName}`, false, transactionid, flowName, mail, null, null, null, null, true);
                //     nodeState.putShared("alternateEmail", null)
                //     patchHighRisk();
                //     action.goTo("highRisk");
                // //} else if (risk && risk.toLowerCase() !== "high" ) {
                // } else if (risk) {
                //     nodeState.putShared("phoneVerification", "success")
                //     var text = "Verification"
                //      if(nodeState.get("verification") === "phone"){
                //        nodeState.putShared("flowContext", "phoneFinder")
                //          text = "Phone Verification"
                //     }else  if(nodeState.get("verification") === "mail"){
                //        nodeState.putShared("flowContext", "emailAge")
                //           text = "Email Verification"
                //     }
                //     auditLog("KYID-LN-007", `${flowName} success as part of ${text}`, false, transactionid, flowName, mail, null, null, null, null, true);
                //     action.goTo("success");
                // }
                
            } else {
                nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Missing required LexisNexis response attributes");
                action.goTo("error");
                return;
            }

        }else {
            nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "back button clicked");
            action.goTo("error");
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::" + "Error handleUserResponses Function " + error.message);
        action.goTo("error");
    }  
} 



// function transformRiskIndicatorDetails(inputArray) {
//     var result = {
//         "riskIndicatorDetails": []
//     };
//     logger.error("inputArray is :: " + JSON.stringify(inputArray))
//     // Ensure we have a valid array to loop through
//     if (inputArray && inputArray.length > 0) {
//         for (var i = 0; i < inputArray.length; i++) {
//             var item = inputArray[i];
            
//             // Push the new mapped object
//             result.riskIndicatorDetails.push({
//                 "riskIndicatorCode": item.Code,
//                 "riskIndicatorDescription": item.Description
//             });
//         }
//     }

//     logger.error("result is :: " + JSON.stringify(result))
//     return result;
// }

function transformRiskIndicatorDetails(inputArray) {
  logger.error("inputArray is :: " + JSON.stringify(inputArray))
  var result = { "riskIndicator": [] };
  
  if (inputArray && inputArray.length) {
    for (var i = 0; i < inputArray.length; i++) {
      var item = inputArray[i] || {};

      var code = (item.Code != null) ? item.Code : item.riskIndicatorCode;
      var desc = (item.Description != null) ? item.Description : item.riskIndicatorDescription;

      // Only add if we actually have something
      if (code != null || desc != null) {
        result.riskIndicator.push({
          "riskIndicatorCode": String(code),
          "riskIndicatorDescription": String(desc)
        });
      }
    }
  }
  logger.error("result is :: " + JSON.stringify(result))
  return result;
}
        

// Audit Log Function
function auditLog(code, message, helpdeskVisibility, transactionid, useCase, useCaseInput, lexisNexisRequest, lexisNexisResponse, reason , title, sspVisibility) {
    try {
        var auditLib = require("KYID.2B1.Library.AuditLogger")
        var headerName = "X-Real-IP";
        var headerValues = requestHeaders.get(headerName);
        var ipAdress = String(headerValues.toArray()[0].split(",")[0]);
        var browser = requestHeaders.get("user-agent");
        var os = requestHeaders.get("sec-ch-ua-platform");
        var userId = null;
        var eventDetails = {};
        eventDetails["IP"] = ipAdress;
        eventDetails["Browser"] = browser;
        eventDetails["OS"] = os;
        eventDetails["applicationName"] = nodeState.get("appName") || systemEnv.getProperty("esv.kyid.portal.name");
        eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
        eventDetails["MFATYPE"] = nodeState.get("nextStep") || ""
        //eventDetails["transactionid"] = transactionid || "";
        eventDetails["useCase"] = useCase || "";
        eventDetails["useCaseInput"] = useCaseInput || "";
        eventDetails["lexisNexisRequest"] = lexisNexisRequest || "";
        eventDetails["lexisNexisResponse"] = lexisNexisResponse || "";
        eventDetails["message"] = title || "";
        eventDetails["reason"] = reason || "";
        
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
        var sessionDetails = {}
        var sessionDetail = null
        logger.error("sessionRefId in KYID.2B1.Journey.IDProofing.CreateAccount " + nodeState.get("sessionRefId"))
        if (nodeState.get("sessionRefId")) {
            sessionDetail = nodeState.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else if (typeof existingSession != 'undefined') {
            sessionDetail = existingSession.get("sessionRefId")
            sessionDetails["sessionRefId"] = sessionDetail
        } else {
            sessionDetails = { "sessionRefId": "" }
        }
        var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
        var ridpReferenceId = nodeState.get("ridpReferenceID") || "";
        var sspVisibility = sspVisibility || false;
        var helpdeskVisibility = helpdeskVisibility || false;
        
        if (userEmail) {
            var userQueryResult = openidm.query("managed/alpha_user", {
                _queryFilter: 'mail eq "' + userEmail + '"'
            }, ["_id"]);
            userId = userQueryResult.result[0]._id;
        }
        var requesterUserId = null;
        if (typeof existingSession != 'undefined') {
            requesterUserId = existingSession.get("UserId")
        }

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders, sspVisibility, ridpReferenceId, helpdeskVisibility)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }
}


function patchHighRisk() {
    logger.debug("Inside patchHighRisk function")
    try {
        // Extract user info
        var usrKOGID = nodeState.get("KOGID");
        var telephoneNumber = nodeState.get("telephoneNumber"); 
        var secondaryEmail = nodeState.get("alternateEmail") ||nodeState.get("alternateEmailRIDP") || nodeState.get("newemail1") 
        var auditDetails = require("KYID.2B1.Library.AuditDetails")
        var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
        var method = null;
        var usrMfaValue = null;
        var _id = null

        logger.debug("usrKOGID :: " + usrKOGID)
        logger.debug("telephoneNumber :: " + telephoneNumber)
        logger.debug("secondaryEmail :: " + secondaryEmail)
        if(telephoneNumber){
            var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND (MFAStatus eq "highrisk" OR MFAStatus eq "HIGHRISK") AND MFAValue eq "' + telephoneNumber + '"' });
            method = "SMSVOICE"
            usrMfaValue = telephoneNumber;
            logger.debug("mfaMethodResponses for telephoneNumber :: " + JSON.stringify(mfaMethodResponses))
        }else if(nodeState.get("newemail1")){
            var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND (MFAStatus eq "highrisk" OR MFAStatus eq "HIGHRISK") AND MFAValue eq "' + secondaryEmail + '"' });
            method = "EMAIL"
            usrMfaValue = secondaryEmail
            logger.debug("mfaMethodResponses for secondaryEmail :: " + JSON.stringify(mfaMethodResponses))
        }else if(secondaryEmail){
            var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods/", { "_queryFilter": 'KOGId eq "' + usrKOGID + '" AND (MFAStatus eq "highrisk" OR MFAStatus eq "HIGHRISK") AND MFAValue eq "' + secondaryEmail + '"' });
            method = "SECONDARY_EMAIL"
            usrMfaValue = secondaryEmail
            logger.debug("mfaMethodResponses for secondaryEmail :: " + JSON.stringify(mfaMethodResponses))
        }

        var transactionIdLN = nodeState.get("transactionIdLN")  || "" ;
        var risk = nodeState.get("mailRisk") || "" ;
        var requestStatus = nodeState.get("requestStatus") || "" ;
        var riskReasonId = nodeState.get("riskReasonId") || "" ;
        var riskReason = nodeState.get("riskReason") || "" ;
        var riskReasonDescription = nodeState.get("riskReasonDescription") || "" ;
        var riskBand = nodeState.get("riskBand") || "" ;
        var failureReason = nodeState.get("failureReason") || "" ;


        var emailPhoneRiskIndicator = []
        if(nodeState.get("phoneFinderRiskIndicator")){
            emailPhoneRiskIndicator = nodeState.get("phoneFinderRiskIndicator") ? JSON.parse(nodeState.get("phoneFinderRiskIndicator")) : [] ;
            logger.debug("emailPhoneRiskIndicatorin ptachMFA is :: " + JSON.stringify(emailPhoneRiskIndicator))
        }else if(nodeState.get("alternateEmailRiskIndicator")){
            emailPhoneRiskIndicator = nodeState.get("alternateEmailRiskIndicator") ? JSON.parse(nodeState.get("alternateEmailRiskIndicator")) : [] ;
            logger.debug("emailPhoneRiskIndicatorin ptachMFA is :: " + JSON.stringify(emailPhoneRiskIndicator))
        }else{
            emailPhoneRiskIndicator = nodeState.get("riskIndicatorDetails") ? JSON.parse(nodeState.get("riskIndicatorDetails")) : [] ;
        }
        logger.debug("emailPhoneRiskIndicator is :: " + JSON.stringify(emailPhoneRiskIndicator))
            //For MFA Reporting
        var normalizedMethod = (method || "").toString().toUpperCase();
        var normalizedValue = (usrMfaValue || "").toString().toUpperCase();

        var mfaTypeLabel = "";
        if (normalizedMethod === "PUSH" && normalizedValue === "FORGEROCK") {
            mfaTypeLabel = "ForgeRock Push";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "FORGEROCK") {
            mfaTypeLabel = "ForgeRock TOTP";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "MICROSOFT") {
            mfaTypeLabel = "Microsoft TOTP";
        } else if (normalizedMethod === "TOTP" && normalizedValue === "GOOGLE") {
            mfaTypeLabel = "Google TOTP";
        } else if (normalizedMethod === "SYMANTEC") {
            // usrMfaValue is credId for Symantec
            if (normalizedValue.indexOf("SYMC") === 0) {
                mfaTypeLabel = "Symantec Mobile Soft Token";
            } else if (normalizedValue.indexOf("VSS") === 0) {
                mfaTypeLabel = "Symantec Desktop Soft Token";
            } else {
                mfaTypeLabel = "Symantec Hard Token";
            }
        } else if (normalizedMethod === "SMSVOICE") {
            var otpDelivery = (nodeState.get("otpDeliveryMethod") || "").toString().toUpperCase();
            mfaTypeLabel = (otpDelivery === "VOICE") ? "Mobile Phone OTP Voice" : "Mobile Phone OTP SMS"; // default SMS
        } else if (normalizedMethod === "EMAIL") {
            mfaTypeLabel = "Primary Email OTP";
        } else if (normalizedMethod === "SECONDARY_EMAIL") {
            mfaTypeLabel = "Alternate Email OTP";
        }

        var purpose = "";
        var journeyName = nodeState.get("journeyName");
        var alternateJourneyName = nodeState.get("journeyNameReporting");
        var journeyPurposeMapping = systemEnv.getProperty("esv.mfapurpose.mapper");
        var parsedjourneyPurposeMapping = JSON.parse(journeyPurposeMapping)
        logger.error("the journey name in KYID.2B1.Journey.VerifyPrimaryEmailOTP:: "+nodeState.get("journeyName"))
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

            if (mfaMethodResponses.resultCount > 0) {                
                    var patchObj = [
                {
                    "operation": "replace",
                    "field": "/MFAStatus",
                    "value": "high"
                },
                {
                    "operation": "replace",
                    "field": "/updateDateEpoch",
                    "value": auditData.updatedDateEpoch
                },
                {
                    "operation": "replace",
                    "field": "/updatedByID",
                    "value": auditData.updatedByID || nodeState.get("_id") || ""
                },
                {
                    "operation": "replace",
                    "field": "/updateDate",
                    "value": auditData.updatedDate
                },
                {
                    "operation": "replace",
                    "field": "/updatedBy",
                    "value": auditData ? auditData.updatedBy || nodeState.get("mail") || nodeState.get("EmailAddress") || "" : nodeState.get("mail") || nodeState.get("EmailAddress") || ""
                },
                {
                    "operation": "replace",
                    "field": "/transactionId",
                    "value": transactionIdLN    
                },
                {
                    "operation": "replace", 
                    "field": "/risk",
                    "value": risk   
                },
                {
                    "operation": "replace",
                    "field": "/requestStatus",
                    "value": requestStatus
                },
                {
                    "operation": "replace",
                    "field": "/riskReasonId",
                    "value": riskReasonId || ""
                },
                {
                    "operation": "replace",
                    "field": "/riskReasonDescription",
                    "value": riskReasonDescription || ""
                },
                {
                    "operation": "replace",
                    "field": "/riskBand",
                    "value": riskBand || ""
                },
                {
                    "operation": "replace",
                    "field": "/failureReason",
                    "value": failureReason || ""
                },
                {
                    "operation": "replace",
                    "field": "/riskIndicator",
                    "value": emailPhoneRiskIndicator ? emailPhoneRiskIndicator.riskIndicator || [] : []
                },
                {
                    "operation": "replace",
                    "field": "/purpose",
                    "value": purpose || ""
                }
                
            ];

            _id = mfaMethodResponses.result[0]._id;
            logger.debug("patchObj in patchMFA :: " + JSON.stringify(patchObj))
            openidm.patch("managed/alpha_kyid_mfa_methods/" + _id, null, patchObj);
        }else{
            logger.error("No MFA method found to patch for user with KOGID: " + usrKOGID + " and value: " + usrMfaValue + "Creating one with highrisk status");
                var mfajsonObj = {
                    'KOGId': usrKOGID,
                    'MFAMethod': method,
                    'MFAValue': usrMfaValue,
                    'MFAStatus': "highrisk",
                    'isRecoveryOnly': true,
                    'createDate': auditData.createdDate,
                    'createDateEpoch': auditData.createdDateEpoch,
                    'createdBy': auditData.createdBy,
                    'createdByID': auditData.createdByID,
                    'updateDate': auditData.updatedDate,
                    'updateDateEpoch': auditData.updatedDateEpoch,
                    'updatedBy': auditData.updatedBy,
                    'updatedByID': auditData.updatedByID,
                    'transactionId': transactionIdLN || "",
                    'risk': risk || "",
                    'requestStatus': requestStatus || "",
                    'riskReason': riskReason || "",
                    'riskReasonID': riskReasonId || "",
                    'riskReasonDescription': riskReasonDescription || "",
                    'riskBand,': riskBand || "",
                    'failureReason': failureReason || "",
                    'riskIndicator': emailPhoneRiskIndicator ? emailPhoneRiskIndicator.riskIndicator || [] : [],
                   //'purpose': purpose    //MFA Reporting 1
                };
            logger.debug("mfajsonObj is :: " + JSON.stringify(mfajsonObj))
            var response = openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
            logger.debug("Response after creating MFA method with highrisk status :: " + JSON.stringify(response))
        }
    } catch (error) {
        logger.error("Error in patchHighRisk function :: " + error)
    }
}
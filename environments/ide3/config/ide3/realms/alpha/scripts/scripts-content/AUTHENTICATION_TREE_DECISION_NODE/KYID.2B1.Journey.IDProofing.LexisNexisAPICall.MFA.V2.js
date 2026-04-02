var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Select LexisNexisAPICall",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexisAPICall.MFA",
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



function searchUserIdentity(lexId) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside searchUserIdentity function");
    try {
        nodeLogger.debug("lexId is --> "+lexId)
        var userIdentityResponse =  openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": 'uuid eq "' + lexId + '"' }, ["account/*","*"]);
        
        if(userIdentityResponse){
            return userIdentityResponse
        }else{
            return null
        }
    } catch (error) {
        nodeLogger.error("Error Occurred While searchUserIdentity "+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error searchUserIdentity Function" + error.message);
    }    
}



function patchUserIdentity(Id,proofingMethod) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
    try {
        nodeLogger.debug("_patchUserIdentity id is --> "+Id)
        var jsonArray = []

        //KOGID
        if(nodeState.get("KOGID") ){
        var jsonObj = {
            "operation": "replace",
            "field": "KOGID",
            "value": nodeState.get("KOGID")
            }
            jsonArray.push(jsonObj)
        }

        //Given Name
        if(nodeState.get("givenName")){
        var jsonObj = {
            "operation": "replace",
            "field": "givenName",
            "value": nodeState.get("givenName")
            }
            jsonArray.push(jsonObj)
        }

        //Middle Name
        if(nodeState.get("custom_middleName") && nodeState.get("custom_middleName")!==null){
        var jsonObj = {
            "operation": "replace",
            "field": "middleName",
            "value": nodeState.get("custom_middleName")
            }
            jsonArray.push(jsonObj) 
        }else{
        var jsonObj = {
            "operation": "replace",
            "field": "middleName",
            "value": ""
            }
            jsonArray.push(jsonObj) 
            
        }

        //SN
        if(nodeState.get("sn")){
        var jsonObj = {
            "operation": "replace",
            "field": "sn",
            "value": nodeState.get("sn")
            }
            jsonArray.push(jsonObj) 
        }

        //Proofing Method
        nodeLogger.debug("proofingMethod is :: "+ proofingMethod)
        if(proofingMethod!== null && proofingMethod){
        var jsonObj = {
            "operation": "replace",
            "field": "proofingMethod",
            "value": proofingMethod
            }
            jsonArray.push(jsonObj) 
        }


        //Suffix
        if(nodeState.get("custom_suffix")){
        var jsonObj = {
            "operation": "replace",
            "field": "suffix",
            "value": nodeState.get("custom_suffix")
            }
            jsonArray.push(jsonObj)
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "suffix",
            "value": ""
            }
            jsonArray.push(jsonObj)
        }
        


        //Gender
        if(nodeState.get("custom_gender")){
        var jsonObj = {
            "operation": "replace",
            "field": "gender",
            "value": nodeState.get("custom_gender")
            }
            jsonArray.push(jsonObj)
        }

        //DOB
        if(nodeState.get("custom_dateofBirth")){
        var jsonObj = {
            "operation": "replace",
            "field": "dob",
            "value": nodeState.get("custom_dateofBirth")
            }
            jsonArray.push(jsonObj) 
        }
        //isHomeless
        if(nodeState.get("isHomeless")){
        var jsonObj = {
            "operation": "replace",
            "field": "isHomeless",
            "value": JSON.parse(nodeState.get("isHomeless"))
            }
            jsonArray.push(jsonObj)  
        }
        else{
            var jsonObj = {
            "operation": "replace",
            "field": "isHomeless",
            "value": false
            }
            jsonArray.push(jsonObj)  
        }
            
        

        //Address Line1
        if(nodeState.get("postalAddress")){
        var jsonObj = {
            "operation": "replace",
            "field": "addressLine1",
            "value": nodeState.get("postalAddress")
            }
            jsonArray.push(jsonObj)  
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "addressLine1",
            "value": ""
            }
            jsonArray.push(jsonObj)  
        }

        //Address Line2
        if(nodeState.get("custom_postalAddress2")){
        var jsonObj = {
            "operation": "replace",
            "field": "addressLine2",
            "value": nodeState.get("custom_postalAddress2")
            }
            jsonArray.push(jsonObj)
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "addressLine2",
            "value": ""
            }
            jsonArray.push(jsonObj)  
        }

        //City
        if(nodeState.get("city")){
        var jsonObj = {
            "operation": "replace",
            "field": "city",
            "value": nodeState.get("city")
            }
            jsonArray.push(jsonObj) 
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "city",
            "value": ""
            }
            jsonArray.push(jsonObj) 
            
        }

        //Postal Code
        if(nodeState.get("postalCode")){
        var jsonObj = {
            "operation": "replace",
            "field": "zip",
            "value": nodeState.get("postalCode")
            }
            jsonArray.push(jsonObj)   
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "zip",
            "value": ""
            }
            jsonArray.push(jsonObj)  
        }

        //Postal Extension
        if(nodeState.get("zipExtension")){
        var jsonObj = {
            "operation": "replace",
            "field": "zipExtension",
            "value": nodeState.get("zipExtension")
            }
            jsonArray.push(jsonObj)  
        }else{
            var jsonObj = {
            "operation": "replace",
            "field": "zipExtension",
            "value": ""
            }
            jsonArray.push(jsonObj)  
        }

        //Country Code
        if(nodeState.get("stateProvince")){
        var jsonObj = {
            "operation": "replace",
            "field": "stateCode",
            "value": nodeState.get("stateProvince")
            }
            jsonArray.push(jsonObj)  
        }
        else{
            var jsonObj = {
            "operation": "replace",
            "field": "stateCode",
            "value": ""
            }
            jsonArray.push(jsonObj)  
            
        }

        //County Code
        if(nodeState.get("custom_county")){
        var jsonObj = {
            "operation": "replace",
            "field": "countyCode",
            "value": nodeState.get("custom_county")
            }
            jsonArray.push(jsonObj)   
        }
        else{
        var jsonObj = {
            "operation": "replace",
            "field": "countyCode",
            "value": ""
            }
            jsonArray.push(jsonObj)   
            
        }
        
        //Country Code
        if(nodeState.get("orig_custom_country") || nodeState.get("country")){
        var jsonObj = {
            "operation": "replace",
            "field": "countryCode",
            "value": nodeState.get("orig_custom_country") || nodeState.get("country")
            }
            jsonArray.push(jsonObj)   
        }
        else{
        var jsonObj = {
            "operation": "replace",
            "field": "countryCode",
            "value": ""
            }
            jsonArray.push(jsonObj)   
            
        }

        //County Code
        if(nodeState.get("custom_title")){
        var jsonObj = {
            "operation": "replace",
            "field": "title",
            "value": nodeState.get("custom_title")
            }
            jsonArray.push(jsonObj)   
        }
        else{
        var jsonObj = {
            "operation": "replace",
            "field": "title",
            "value": ""
            }
            jsonArray.push(jsonObj)   
            
        }

        //LanguagePreference
        if(nodeState.get("languagePreference")){
        var jsonObj = {
            "operation": "replace",
            "field": "languagePreference",
            "value": nodeState.get("languagePreference")
            }
            jsonArray.push(jsonObj)   
        }

        //uuid
        if(nodeState.get("uuid") && nodeState.get("uuid")!==null && typeof nodeState.get("uuid")!== 'undefined'){
        var jsonObj = {
            "operation": "replace",
            "field": "uuid",
            "value": nodeState.get("uuid")
            }
            jsonArray.push(jsonObj)   
        }

        //verificationMismatch
        if(nodeState.get("verificationMismatch") && nodeState.get("verificationMismatch")!==null && nodeState.get("verificationMismatch") === true){
        var jsonObj = {
            "operation": "replace",
            "field": "verificationMismatch",
            "value": nodeState.get("verificationMismatch")
            }
            jsonArray.push(jsonObj)   
        }else{
             var jsonObj = {
            "operation": "replace",
            "field": "verificationMismatch",
            "value": false
            }
            jsonArray.push(jsonObj)
        }
    
        //lastVerificationDate
        var jsonObj = {
            "operation": "replace",
            "field": "lastVerificationDate",
            "value": dateTime
            }
            jsonArray.push(jsonObj)   

        //updateDate
        var jsonObj = {
            "operation": "replace",
            "field": "updateDate",
            "value": dateTime
            }
            jsonArray.push(jsonObj)

        //updateDateEpoch
        var jsonObj = {
            "operation": "replace",
            "field": "updateDateEpoch",
            "value": currentTimeEpoch
            }
            jsonArray.push(jsonObj)

        // //updatedBy
        // if(nodeState.get("_id") || nodeState.get("id")){
        // var jsonObj = {
        //     "operation": "replace",
        //     "field": "updatedBy",
        //     "value": nodeState.get('_id') || nodeState.get('id')
        //     }
        //     jsonArray.push(jsonObj)
        // }

        if(jsonArray.length>0){
            var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
            logger.debug("Patch Response -->"+response)
            if(response){
                return true
            }
        }else{
            return false
        }  
    } catch (error) {
        logger.error("Error Occurred While patchUserIdentity "+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error patchUserIdentity Function" + error.message);
    }    
}

function generateGUID() {
    const firstName = nodeState.get("givenName") ||"A"
    const firstLetter = firstName.charAt(0).toUpperCase();
    const randomNumber = Math.floor(Math.random() * 9000000000) + 1000000000; // 10 digits
    return `${firstLetter}${randomNumber}`;
}

function main() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside Main Function");
        nodeLogger.debug("userInfoJSON in  KYID.2B1.Journey.IDProofing.LexisNexisAPICall"+nodeState.get("userInfoJSON") )
        var usrKOGID = nodeState.get("KOGID");
        var mail = nodeState.get("mail");
        var context = null;
        var AppEnrollIDVerificationMethod = null;
        // var userInfoJSON = nodeState.get("userInfoJSON");
        var action = null;
        if(nodeState.get("RidpMethod")==="LexisNexisVerification"){
            action = "IdVerification"
        }else if(nodeState.get("RidpMethod")==="LexisNexisKBA"){
            action = "KBA"
        }
        var displayCallBackJSON = {
            "apiCalls":[
                {
                    "method" :"LexisNexis",
                    "action" : action,
                            
                }
            ],
            "collectedUserInfo": nodeState.get("userInfoJSON"),
            "userID": usrKOGID,
            "userMail": mail
        }
        if(nodeState.get("context")){
            context = nodeState.get("context")
        }
        if(nodeState.get("AppEnrollIDVerificationMethod")){
            AppEnrollIDVerificationMethod = nodeState.get("AppEnrollIDVerificationMethod")
        }
    
        if (callbacks.isEmpty()) {
            requestCallbacks(displayCallBackJSON);
        } else {
            handleUserResponses();
        }

    } catch (error) {
        nodeLogger.error(transactionid+"::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in Main Execution "+ mail);
    }
}

main();

function requestCallbacks(displayCallBackJSON) {
    nodeLogger.debug("inside requestCallbacks");
    try {
        if(nodeState.get("RidpMethod")==="LexisNexisVerification"){
            var pageHeader= {"pageHeader": "2_RIDP_lexisNexis_Verification"};
        }else if(nodeState.get("RidpMethod")==="LexisNexisKBA"){
            var pageHeader= {"pageHeader": "4_RIDP_KBA"};
        }
        
        //nodeLogger.debug("validationMessage"+nodeState.get("validationMessage") )
        if (nodeState.get("validationMessage") != null) {
            nodeLogger.debug("validationMessage"+nodeState.get("validationMessage") )
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



function isValidInput(newLexID) { 

    if(Array.isArray(newLexID)){
        if(newLexID.length>=0){
            if(newLexID.length > 0){
                newLexID.filter(item => typeof item === "string");
            }
        }else{
            nodeState.putShared("validationMessage", "invalid_input");
            return false;
        }
    }else{
        nodeState.putShared("validationMessage", "invalid_input");
        nodeLogger.debug("IN MY ERROR "+newLexID);
        return false;
    }   
}

function auditLog(code, message) {
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
        var userEmail = nodeState.get("primaryEmail") || nodeState.get("mail") || "";
        var sessionDetails = {}
        var sessionDetail = null
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

        auditLib.auditLogger(code, sessionDetails, message, eventDetails, requesterUserId || userId, userId, transactionId, userEmail, eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    } catch (error) {
        logger.error("Failed to log RIDP verification activity " + error)
    }

}

function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses function");
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var newLexID = callbacks.getTextInputCallbacks().get(0)
        var uuid = null;
        newLexID = JSON.parse(newLexID)
        nodeLogger.debug("newLexID is --> : "+newLexID.length);
         nodeLogger.debug("journeyContext :: "+nodeState.get("journeyContext"));

        if(nodeState.get("journeyContext") === "ridp"){
            if(newLexID.length === 1){
                 action.goTo("standaloneSuccess");
            }else{
                  nodeState.putShared("unableToVerify","true");
                  action.goTo("fail")  
            }
        }else{

        var isValidInputs = isValidInput(newLexID)
        if(isValidInputs===false){
            action.goTo("error");
        }else{
            if (selectedOutcome === 0) {
            nodeState.putShared("validationErrorCode", null);
                //if(newLexID.length==0){
                var proofingMethod = nodeState.get("proofingMethod")
                if(newLexID.length === 1){
                    //Single LexID Found
                    var searchResult = searchUserIdentity(newLexID[0])
                    var userIdentity = nodeState.get("userIdentity");
                    nodeLogger.debug("searchResult is --> "+JSON.stringify(searchResult));
                    if(searchResult && searchResult.resultCount>0){
                    var userLexID = nodeState.get("uuid");
                        logger.error("uuid is :: "+ nodeState.get("uuid"))
                        if(userLexID && userLexID !== null ){

                            //Checking Associated user id
                            if(searchResult.result[0].account.length>0){
                                // nodeLogger.debug("searchMail is  -->"+searchResult.result[0].account[0].mail)
                                // var searchMail = searchResult.result[0].account[0].mail
                                // var searchEmailArray = []
                                // searchEmailArray.push(searchMail)
                                // nodeState.putShared("searchEmailArray",searchEmailArray) 
                                var searchEmailArray = []
                                var accounts = searchResult.result[0].account;
                                accounts.forEach(function(account){
                                    if(account.mail && account.mail !== null){
                                        nodeLogger.debug("searchMail is --> "+account.mail);  
                                        searchEmailArray.push(account.mail)
                                    }
                                })
                                nodeState.putShared("searchEmailArray",searchEmailArray)

                                if(userLexID!== newLexID[0]){
                                    // LexID's does not match
                                    nodeState.putShared("lexId",null)
                                    nodeState.putShared("verificationMismatch", true)
                                    nodeLogger.debug("UUID not matched with newLexID[0]");
                                    if(nodeState.get("journeyName") === "updateprofile" || nodeState.get("journeyName") === "organdonor"){
                                        nodeState.putShared("uuid",userLexID)
                                        patchUserIdentity(nodeState.get("userIdentity"),"-1")
                                        nodeLogger.debug("Update Profile Not Verified Success")
                                        auditLog("VER009", "Remote Identity Verification Failure");
                                        action.goTo("true");
                                    }else{
                                        if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                            patchUserIdentity(nodeState.get("userIdentity"),"-1")
                                            nodeLogger.debug(" First Time Login with not verified identity")
                                            action.goTo("true")  
                                        }else if(nodeState.get("context") ==="appEnroll"){
                                            // Need to update the flag mismatched need confirmation 
                                             nodeState.putShared("prereqStatus","NOT_STARTED")
                                             //nodeState.putShared("unableToVerify","true")
                                             patchUserIdentity(nodeState.get("userIdentity"),"-1")
                                            auditLog("VER009", "Remote Identity Verification Failure");
                                             action.goTo("fail")
                                        }else{
                                            patchUserIdentity(nodeState.get("userIdentity"),"-1")
                                            nodeState.putShared("unableToVerify","true");
                                            auditLog("VER009", "Remote Identity Verification Failure");
                                            action.goTo("fail")  
                                        } 
                                    }
                                }else{
                                    nodeState.putShared("uuid",newLexID[0])
                                    nodeState.putShared("lexId",newLexID[0])
                                    nodeState.putShared("MCISync","true")
                                    nodeState.putShared("validationMessage", null);
                                    nodeState.putShared("LexIdMachFound", true)
                                    nodeState.putShared("prereqStatus","COMPLETED")
                                    if(nodeState.get("journeyName")==="createAccount"){
                                        if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                            patchUserIdentity(nodeState.get("userIdentity"),"1")
                                            action.goTo("continue")
                                        }else{
                                            auditLog("VER008", "Remote Identity Verification Success");
                                            action.goTo("succcess")
                                        }
                                        
                                    }//else if(nodeState.get("context")==="appEnroll"){
                                        else if(nodeState.get("prereqStatus") == "REVERIFY"){
                                            nodeState.putShared("proofingMethod", "4")
                                            patchUserIdentity(nodeState.get("userIdentity"),"4")
                                        //}
                                    }else{
                                        //Going MCI SYNC
                                        patchUserIdentity(nodeState.get("userIdentity"),proofingMethod)
                                        auditLog("VER008", "Remote Identity Verification Success");
                                        action.goTo("success")
                                    }
                                }
                            }else{
                                    // Need to handle if no email is associated with the LexID  
                                nodeLogger.debug("Accounts Not Present in User Identity")
                            }  
                        }else{
                            //Logged in user does not have any LexID associated
                            nodeState.putShared("lexId",newLexID[0])
                            if(nodeState.get("journeyName")==="forgotPassword" || nodeState.get("journeyName")==="accountRecovery" ||  nodeState.get("journeyName")==="MFARecovery" || nodeState.get("isMFARecovery")==="true"){
                                if(searchResult.result[0].account.length>0){
                                    nodeLogger.debug("searchMail is in accountRecovery -->"+searchResult.result[0].account[0].mail)
                                        var searchMail = searchResult.result[0].account[0].mail
                                        var searchEmailArray = []
                                        searchEmailArray.push(searchMail)
                                        nodeState.putShared("ListOfPrimaryEmails", searchEmailArray);

                                    }
                                if(nodeState.get("journeyName")==="accountRecovery"){
                                    //     if(searchResult.result[0].account.length>0){
                                    //     nodeLogger.debug("searchMail is in accountRecovery -->"+searchResult.result[0].account[0].mail)
                                    //     var searchMail = searchResult.result[0].account[0].mail
                                    //     var searchEmailArray = []
                                    //     searchEmailArray.push(searchMail)
                                    //     nodeState.putShared("ListOfPrimaryEmails", searchEmailArray);
                                    //     //if(searchEmailArray.length>0){
                                           
                                    //     //}  
                                    // }
                                         auditLog("VER008", "Remote Identity Verification Success");  //I don't think we should log?
                                         action.goTo("true");
                                }else{
                                    if(nodeState.get("EmailAddress") == searchMail || nodeState.get("mail") == searchMail ){
                                        auditLog("VER008", "Remote Identity Verification Success");
                                        patchUserIdentity(nodeState.get("userIdentity"),proofingMethod)
                                        action.goTo("success");
                                    }
                                    else{
                                        nodeState.putShared("unableToVerify","true")
                                        auditLog("VER009", "Remote Identity Verification Failure");
                                        action.goTo("fail")
                                    }

                                }

                            }else if(nodeState.get("journeyName")==="createAccount"){

                                if(nodeState.get("firsttimeloginjourneyskip") == "false"){
                                    nodeState.putShared("verificationMismatch", true)
                                    patchUserIdentity(nodeState.get("userIdentity"),"-1")
                                    action.goTo("true")
                                }else{
                                     if(searchResult.result[0].account.length>0){
                                        nodeLogger.debug("searchMail is in createAccount -->"+searchResult.result[0].account[0].mail)
                                        var searchMail = searchResult.result[0].account[0].mail
                                        var searchEmailArray = []
                                        searchEmailArray.push(searchMail)
                                        nodeState.putShared("searchEmailArray",searchEmailArray) 
                                    }
                                action.goTo("fail")
                                }
                            }// NR : Added this condtion to handle Update Profile for Mismatch LexID
                            else if(nodeState.get("journeyName") === "updateprofile" || nodeState.get("journeyName") === "organdonor"){
                                if(nodeState.get("userIdentity")!=null && nodeState.get("userIdentity")){// NR: What to do if we don't have UserIdentity Record ? I think we should create 
                                 nodeState.putShared("verificationMismatch", true)
                                 patchUserIdentity(nodeState.get("userIdentity"),"-1");
                                 nodeState.putShared("unableToVerify",null)
                                 nodeLogger.debug("Update Profile Not Verified Success")
                               //  auditLog("VER009", "Remote Identity Verification Failure");   
                                 action.goTo("true");
                                }
                            }
                            else{
                                var searchEmailArray = []
                                var accounts = searchResult.result[0].account;
                                accounts.forEach(function(account){
                                    if(account.mail && account.mail !== null){
                                        nodeLogger.debug("searchMail is --> "+account.mail);  
                                        searchEmailArray.push(account.mail)
                                    }
                                })
                                nodeState.putShared("searchEmailArray",searchEmailArray)
                                
                                auditLog("VER009", "Remote Identity Verification Failure");

                                action.goTo("fail")
                                
                            }
                            
                        }
                    }else{
                        //MCI Search
                        nodeState.putShared("lexId",newLexID[0])
                        action.goTo("MCISearch")
                    }
                }else{
                    // LexID greater than 1 or Zero
                    //nodeLogger.debug("journeyName is :: => "+ nodeState.get("journeyName"))
                    var userIdentity = nodeState.get("userIdentity");
                    //if(nodeState.get("journeyName")==="createAccount" || nodeState.get("journeyName")==="RIDP_LoginMain"){
                    if(nodeState.get("journeyName")==="createAccount"){
                        // Checking First time login
                        if(nodeState.get("journeyName")==="RIDP_LoginMain"){
                            patchUserIdentity(userIdentity,"-1");
                            nodeLogger.debug("User verification failed");
                            //Continue Journey for first time login
                        }
                        action.goTo("MCISearch");
                    }else if(nodeState.get("context")==="appEnroll"){
                        nodeState.putShared("appEnrollUnableToVerify", "true");
                        if(nodeState.get("LexisNexisFARS")==="true"){
                            nodeState.putShared("prereqStatus", "PENDING");
                        }
                        else{
                            nodeState.putShared("LexisNexisFARS","true")
                            nodeState.putShared("prereqStatus", "REVERIFY");
                        }

                        //Generating REFID for lexisNexis
                        if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                            if(!nodeState.get("refId")){
                            refId= generateGUID()
                            nodeState.putShared("refId",refId)   
                            }
                        }
                        // Fars Scenario
                        patchUserIdentity(userIdentity,"-1");
                        auditLog("VER009", "Remote Identity Verification Failure");
                        action.goTo("FARS");
                    }else if(nodeState.get("journeyName") === "updateprofile" || nodeState.get("journeyName") === "organdonor"){
                        if(nodeState.get("userIdentity")!=null && nodeState.get("userIdentity")){
                             patchUserIdentity(userIdentity,"-1");
                             nodeState.putShared("unableToVerify",null)
                             nodeLogger.debug("Update Profile Not Verified Success")
                             auditLog("VER009", "Remote Identity Verification Failure"); 
                             action.goTo("true");
                        }
                    }else{                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               
                        nodeState.putShared("unableToVerify","true")
                        nodeLogger.debug("unableToVerify")
                        patchUserIdentity(userIdentity,"-1");
                        auditLog("VER009", "Remote Identity Verification Failure");
                        action.goTo("fail")
                        //action.goTo("unableToVerify");
                    } 
                }
            }
        }
    }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "error occurred in handleUserResponses function ::" + error);
        action.goTo("error");

    }
}
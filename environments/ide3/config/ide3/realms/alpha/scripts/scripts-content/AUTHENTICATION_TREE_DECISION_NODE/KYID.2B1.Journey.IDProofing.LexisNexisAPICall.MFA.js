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
        logger.debug("lexId is --> "+lexId)
        var userIdentityResponse =  openidm.query("managed/alpha_kyid_user_identity/", { "_queryFilter": 'uuid eq "' + lexId + '"' }, ["account/*","*"]);
        
        if(userIdentityResponse){
            return userIdentityResponse
        }
        else{
            return null
        }
    } catch (error) {
        logger.error("Error Occurred While searchUserIdentity "+ error)
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error searchUserIdentity Function" + error.message);
    }    
}



function patchUserIdentity(Id,proofingMethod) {
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside patchUserIdentity function");
    try {
        logger.debug("_patchUserIdentity id is --> "+Id)
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
        logger.debug("proofingMethod is :: "+ proofingMethod)
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

        //Address Line1
        if(nodeState.get("postalAddress")){
        var jsonObj = {
            "operation": "replace",
            "field": "addressLine1",
            "value": nodeState.get("postalAddress")
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
        }

        //City
        if(nodeState.get("city")){
        var jsonObj = {
            "operation": "replace",
            "field": "city",
            "value": nodeState.get("city")
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
        }

        //Postal Extension
        if(nodeState.get("zipExtension")){
        var jsonObj = {
            "operation": "replace",
            "field": "zipExtension",
            "value": nodeState.get("zipExtension")
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

        //County Code
        if(nodeState.get("custom_county")){
        var jsonObj = {
            "operation": "replace",
            "field": "countyCode",
            "value": nodeState.get("custom_county")
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

        //LanguagePreference
        if(nodeState.get("languagePreference")){
        var jsonObj = {
            "operation": "replace",
            "field": "languagePreference",
            "value": nodeState.get("languagePreference")
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


// function generateGUID() {
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
//     .replace(/[xy]/g, function (c) {
//         const r = Math.random() * 16 | 0, 
//             value = c == 'x' ? r : (r & 0x3 | 0x8);
//         return value.toString(16);
//     });
// }

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

function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Inside handleUserResponses function");
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var lexisNexisUsers = callbacks.getTextInputCallbacks().get(0)
        lexisNexisUsers = JSON.parse(lexisNexisUsers)
        nodeLogger.debug("lexisNexisUsers is --> : "+lexisNexisUsers.length);
        if(Array.isArray(lexisNexisUsers)){
            if(lexisNexisUsers.length>=0){
                if(lexisNexisUsers.length > 0){
                    lexisNexisUsers.filter(item => typeof item === "string");
                }
            }else{
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("error");
            }
        }else{
           nodeState.putShared("validationMessage", "invalid_input");
           nodeLogger.debug("IN MY ERROR "+lexisNexisUsers);
           action.goTo("error"); 
        }
        nodeState.putShared("lexisNexisUsers",lexisNexisUsers)
        nodeLogger.debug("lexisNexisUsers is --> : "+lexisNexisUsers.length);
        if (selectedOutcome === 0) {
           nodeState.putShared("validationErrorCode", null);
           if(lexisNexisUsers.length>0){
               if(lexisNexisUsers.length === 1){
                  var searchResult = searchUserIdentity(lexisNexisUsers[0])
                  if(searchResult && searchResult.resultCount>0){
                      nodeLogger.debug("searchResult is --> "+JSON.stringify(searchResult))
                      if(searchResult.result[0].account.length>0){
                          nodeLogger.debug("searchMail is  -->"+searchResult.result[0].account[0].mail)
                          var searchMail = searchResult.result[0].account[0].mail;
                          var kogID = searchResult.result[0].account[0].userName;
                          var searchEmailArray = []
                          var userInfoJSON = nodeState.get("userInfoJSON");
                          userInfoJSON.mail = searchMail || null;
                          userInfoJSON.kogId = kogID || null;
                          searchEmailArray.push(searchMail)
                          nodeState.putShared("searchEmailArray",searchEmailArray) 
                      }

                      var proofingMethod = nodeState.get("proofingMethod")
                       patchUserIdentity(searchResult.result[0]._id,proofingMethod)
                       nodeState.putShared("patchUserId",searchResult.result[0]._id)
                       if (nodeState.get("context") === "appEnroll") {
                            nodeState.putShared("appEnrollKBA", "true");
                            nodeState.putShared("prereqStatus", "COMPLETED");
                       }
                       nodeState.putShared("validationMessage",null);
                       //action.goTo("singleLexIdMachFound")
                          nodeState.putShared("MCISync","true")
                          if(nodeState.get("journeyName")==="forgotEmail" || nodeState.get("context") === "appEnroll"|| nodeState.get("journeyName")==="forgotPassword" || nodeState.get("journeyName")==="MFARecovery" || nodeState.get("journeyName")==="accountRecovery" || nodeState.get("journeyName")==="RIDP_LoginMain"){
                               nodeState.putShared("validationMessage", null);
                               action.goTo("MCISYNC")
                          }else if(nodeState.get("journeyName")==="updateprofile" || nodeState.get("journeyName")==="organdonor"){
                                nodeLogger.debug("proofingMethod :: "+ proofingMethod)
                                nodeState.putShared("MCISync","true")
                                nodeState.putShared("validationMessage", null);
                                if(proofingMethod==="1"){
                                    action.goTo("MCISYNC")
                                }else if(proofingMethod==="4"){
                                    action.goTo("MCISYNC")
                                }else{
                                    action.goTo("MCISYNC")
                                }
                          }else if(nodeState.get("journeyName")==="createAccount"){
                              nodeState.putShared("MCISync","true")
                              nodeState.putShared("validationMessage", null);
                              nodeState.putShared("LexIdMachFound", true);
                              action.goTo("singleLexIdMachFound")
                              
                          }
                   }else{
                       if(nodeState.get("journeyName")==="createAccount" || nodeState.get("context") === "appEnroll" ){
                            nodeState.putShared("MCISync","false")
                            nodeState.putShared("lexId",lexisNexisUsers[0])
                            nodeLogger.debug("Lexid in NodeState is --> "+ nodeState.get("lexId"))
                            nodeState.putShared("validationMessage", null);
                            if(nodeState.get("journeyName")==="createAccount"){
                                nodeState.putShared("createProofingMethod","1")
                            }
                            nodeState.putShared("LexIdMachFound", true)
                            action.goTo("singleLexIdNoMatch")
                       }else{
                            nodeState.putShared("validationMessage", null);
                            if(nodeState.get("journeyName") === "updateprofile"){
                               if(nodeState.get("userIdentity")!=null && nodeState.get("userIdentity")){
                                    patchUserIdentity(nodeState.get("userIdentity"),"-1")
                                    nodeState.putShared("unableToVerify",null)
                                    action.goTo("MCISYNC");
                               }
                            }else{
                                nodeState.putShared("unableToVerify","true")
                                action.goTo("unableToVerify");
                            } 
                       } 
                    } 
                }else if(lexisNexisUsers.length > 1){
                   if(nodeState.get("journeyName")==="createAccount"){
                        nodeState.putShared("validationMessage", null);
                        nodeState.putShared("createProofingMethod","1")
                        action.goTo("multipleLexId")
                   }else if(nodeState.get("context")==="appEnroll"){
                        if (nodeState.get("context") === "appEnroll") {
                            nodeState.putShared("appEnrollUnableToVerify", "true");
                            // nodeLogger.debug("KBA RefID "+kbaStatus.refId)
                            // nodeState.putShared("refId",kbaStatus.refId)
                            if(nodeState.get("LexisNexisFARS")==="true"){
                                nodeState.putShared("prereqStatus", "PENDING");
                            }
                            else{
                                nodeState.putShared("prereqStatus", "REVERIFY");
                            }
                            nodeState.putShared("validationMessage",null);
                            if(nodeState.get("context")==="appEnroll"){
                                //var refId = "12345678"
                                if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                                    if(!nodeState.get("refId")){
                                        refId= generateGUID();
                                        nodeState.putShared("refId",refId)
                                        
                                    }
                                   
                                }
                            }
                            action.goTo("appEnrollUnableToVerify");
                        }
                    }else{
                        nodeState.putShared("validationMessage", null);
                        if(nodeState.get("journeyName") === "updateprofile"){
                            if(nodeState.get("userIdentity")!=null && nodeState.get("userIdentity")){
                                patchUserIdentity(nodeState.get("userIdentity"),"-1")
                                nodeState.putShared("unableToVerify",null)
                                action.goTo("MCISYNC");
                            }
                        }else{
                            nodeState.putShared("unableToVerify","true")
                            action.goTo("unableToVerify");
                        }
                    }
               }
           }else{
               if(nodeState.get("journeyName")==="createAccount"){
                   if(nodeState.get("firsttimeloginjourney") == "true" && nodeState.get("journeyName")==="createAccount"){
                       var userIdentity = nodeState.get("userIdentity")
                       patchUserIdentity(userIdentity,"0")
                   }
                    nodeState.putShared("validationMessage", null);
                   action.goTo("noLexId")
               }else if(nodeState.get("context")==="appEnroll"){
                    if (nodeState.get("context") === "appEnroll") {
                        nodeState.putShared("appEnrollUnableToVerify", "true");
                        // nodeLogger.debug("KBA RefID "+kbaStatus.refId)
                        // nodeState.putShared("refId",kbaStatus.refId)
                        if(nodeState.get("LexisNexisFARS")==="true"){
                            nodeState.putShared("prereqStatus", "PENDING");
                        }
                        else{
                            nodeState.putShared("prereqStatus", "REVERIFY");
                        }
                        nodeState.putShared("validationMessage",null);
                        if(nodeState.get("context")==="appEnroll"){
                            //var refId = "12345678"
                            if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                                if(!nodeState.get("refId")){
                                refId= generateGUID()
                                nodeState.putShared("refId",refId)
                                    
                                }

                            }
                        }
                        action.goTo("appEnrollUnableToVerify");
                    }
                }else{
                    //Need to patch the transaction for Failure
                   nodeState.putShared("validationMessage", null);
                    if(nodeState.get("journeyName") === "updateprofile"){
                       if(nodeState.get("userIdentity")!=null && nodeState.get("userIdentity")){
                            patchUserIdentity(nodeState.get("userIdentity"),"-1")
                            nodeState.putShared("unableToVerify",null)
                            action.goTo("MCISYNC");
                       }
                    }else{
                        nodeState.putShared("unableToVerify","true")
                        action.goTo("unableToVerify");
                    } 
               } 
           }

        }
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error+mail);
        action.goTo("error");

    }
}
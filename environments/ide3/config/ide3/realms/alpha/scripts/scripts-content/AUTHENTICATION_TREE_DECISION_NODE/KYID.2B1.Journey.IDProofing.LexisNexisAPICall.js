var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");
     // nodeState.putShared("journeyName","forgotEmail")

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Select LexisNexisAPICall",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.LexisNexisAPICall",
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
    logger.debug("Executing KYID.2B1.Journey.IDProofing.LexisNexisAPICall")
     logger.debug("userInfoJSON in  KYID.2B1.Journey.IDProofing.LexisNexisAPICall"+nodeState.get("userInfoJSON") )
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    var context = null;
    var AppEnrollIDVerificationMethod = null
    // var userInfoJSON = nodeState.get("userInfoJSON");
    var displayCallBackJSON = {
            "apiCalls":[
                {
                   	"method" :"LexisNexis",
                	"action" : "IdVerification",
                            
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
        var pageHeader= {"pageHeader": "2_RIDP_lexisNexis_Verification"};
        logger.debug("validationMessage"+nodeState.get("validationMessage") )
          if (nodeState.get("validationMessage") != null) {
            logger.debug("validationMessage"+nodeState.get("validationMessage") )
            var errorMessage = nodeState.get("validationMessage")
            callbacksBuilder.textOutputCallback(0, errorMessage)
          }
        
        callbacksBuilder.textOutputCallback(0,JSON.stringify(pageHeader));
       
        callbacksBuilder.textOutputCallback(0,JSON.stringify(displayCallBackJSON));
       
        callbacksBuilder.textInputCallback("Response")
        // allbacksBuilder.textInputCallback("Last Name");

       

        callbacksBuilder.confirmationCallback(0, ["Next"], 0);



    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}

function handleUserResponses() {
    try {
        // nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "" + "Verified Phone Number is " + nodeState.get("verifiedTelephoneNumber") + nodeState.get("phoneVerified"))
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        var lexisNexisUsers = callbacks.getTextInputCallbacks().get(0)
        logger.debug("lexisNexisUsers is --> : "+lexisNexisUsers);
        try {
            lexisNexisUsers = JSON.parse(lexisNexisUsers)
        } catch (parseError) {
            nodeState.putShared("validationMessage", "invalid_input");
            logger.debug("JSON parse error for lexisNexisUsers: " + parseError + " | Input: " + lexisNexisUsers);
            action.goTo("error");
            return;
        }
        if(Array.isArray(lexisNexisUsers)){
            if(lexisNexisUsers.length>0){
                lexisNexisUsers.filter(item => typeof item === "string");
            }else{
                nodeState.putShared("validationMessage", "invalid_input");
                action.goTo("error");
            }
        }else{
           nodeState.putShared("validationMessage", "invalid_input");
           logger.debug("IN MY ERROR "+lexisNexisUsers);
           action.goTo("error"); 
        }
        nodeState.putShared("lexisNexisUsers",lexisNexisUsers)
        logger.debug("lexisNexisUsers is --> : "+lexisNexisUsers.length);
        if (selectedOutcome === 0) {
           nodeState.putShared("validationErrorCode", null);
           if(lexisNexisUsers.length>0){
               if(lexisNexisUsers.length === 1){
                   var searchResult = searchUserIdentity(lexisNexisUsers[0])
                  if(searchResult && searchResult.resultCount>0){
                      logger.debug("searchResult is --> "+JSON.stringify(searchResult))
                      if(searchResult.result[0].account.length>0){
                      logger.debug("searchMail is  -->"+searchResult.result[0].account.mail)
                      var searchMail = searchResult.result[0].account[0].mail
                      var searchEmailArray = []
                      searchEmailArray.push(searchMail)
                      nodeState.putShared("searchEmailArray",searchEmailArray) 
                      }

                      var proofingMethod = "1";
                       patchUserIdentity(searchResult.result[0]._id,proofingMethod)
                       nodeState.putShared("patchUserId",searchResult.result[0]._id)
                          if(nodeState.get("journeyName")==="forgotEmail" || nodeState.get("context") === "appEnroll"|| nodeState.get("journeyName")==="forgotPassword" || nodeState.get("journeyName")==="MFARecovery"  || nodeState.get("journeyName")==="updateprofile" || nodeState.get("journeyName")==="organdonor"  || nodeState.get("journeyName")==="accountRecovery" || nodeState.get("journeyName")==="RIDP_LoginMain"){
                               nodeState.putShared("validationMessage", null);
                              action.goTo("KBA")
                          }
                          else if(nodeState.get("journeyName")==="createAccount"){
                              nodeState.putShared("MCISync","true")
                              nodeState.putShared("validationMessage", null);
                              action.goTo("singleLexIdMachFound")
                          }
                  
                   }
                   else{
                       if(nodeState.get("journeyName")==="createAccount" || nodeState.get("context") === "appEnroll" ){

                           nodeState.putShared("MCISync","false")
                            nodeState.putShared("lexId",lexisNexisUsers[0])
                           logger.debug("Lexid in NodeState is --> "+ nodeState.get("lexId"))
                           nodeState.putShared("validationMessage", null);
                            if(nodeState.get("journeyName")==="createAccount"){
                               nodeState.putShared("createProofingMethod","1")
                            }
                          
                           action.goTo("singleLexIdNoMatch")
                       }
                       else{
                       nodeState.putShared("unableToVerify","true")
                       nodeState.putShared("validationMessage", null);
                       action.goTo("unableToVerify")
                           
                       }
                       
                   }
                   
               }
               else if(lexisNexisUsers.length > 1){
              
                   if(nodeState.get("journeyName")==="createAccount"){
                        nodeState.putShared("validationMessage", null);
                        nodeState.putShared("createProofingMethod","1")
                        action.goTo("multipleLexId")
                   }
                   
                   else if(nodeState.get("context")==="appEnroll"){
                    if(nodeState.get("LexisNexisFARS")==="true"){
                               nodeState.putShared("prereqStatus","PENDING")
                    }
                    else{
                        nodeState.putShared("prereqStatus","REVERIFY")
                    }
                         nodeState.putShared("appEnrollUnableToVerify","true")
                        nodeState.putShared("validationMessage", null);
                        // nodeState.putShared("prereqStatus","REVERIFY")
                       action.goTo("appEnrollUnableToVerify")
                   }
                   else{
                       nodeState.putShared("unableToVerify","true")
                        nodeState.putShared("validationMessage", null);
                       //Need to patch the transaction for Failure
                       action.goTo("unableToVerify")
                   }
                   
               }
               
               
           }
           else{
               if(nodeState.get("journeyName")==="createAccount"){
                    nodeState.putShared("validationMessage", null);
                   action.goTo("noLexId")
               }
               else if(nodeState.get("context")==="appEnroll"){
                   nodeState.putShared("appEnrollUnableToVerify","true")
                    nodeState.putShared("validationMessage", null);
                    if(nodeState.get("LexisNexisFARS")==="true"){
                        nodeState.putShared("prereqStatus","PENDING")
                    }
                   else{
                       nodeState.putShared("prereqStatus","REVERIFY")
                   }
                    // nodeState.putShared("prereqStatus","REVERIFY")
                   action.goTo("appEnrollUnableToVerify")
               }
               else{
                   nodeState.putShared("unableToVerify","true")
                    nodeState.putShared("validationMessage", null);
                    //Need to patch the transaction for Failure
                   action.goTo("unableToVerify")
               }
               
           }

        }
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error+mail);
        action.goTo("error");

    }

}

function searchUserIdentity(lexId) {
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
    
}    
}

function patchUserIdentity(Id,proofingMethod) {
try {
    logger.debug("_patchUserIdentity id is --> "+Id)
    var jsonArray = []

    if(nodeState.get("orig_givenName")){
    var jsonObj = {
        "operation": "replace",
        "field": "givenName",
        "value": nodeState.get("orig_givenName")
        }
        jsonArray.push(jsonObj)
        
        
    }
    logger.debug("proofingMethod is :: "+ proofingMethod)
    if(proofingMethod!== null && proofingMethod){
    var jsonObj = {
        "operation": "replace",
        "field": "proofingMethod",
        "value": proofingMethod
        }
        jsonArray.push(jsonObj)
        
        
    }
    if(nodeState.get("orig_sn")){
    var jsonObj = {
        "operation": "replace",
        "field": "sn",
        "value": nodeState.get("orig_sn")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_custom_suffix")){
    var jsonObj = {
        "operation": "replace",
        "field": "suffix",
        "value": nodeState.get("orig_custom_suffix")
        }
        jsonArray.push(jsonObj)
        
        
    }
    
    if(nodeState.get("orig_custom_middleName")){
    var jsonObj = {
        "operation": "replace",
        "field": "middleName",
        "value": nodeState.get("orig_custom_middleName")
        }
        jsonArray.push(jsonObj)
        
        
    }
    if(nodeState.get("orig_custom_gender")){
    var jsonObj = {
        "operation": "replace",
        "field": "gender",
        "value": nodeState.get("orig_custom_gender")
        }
        jsonArray.push(jsonObj)
        
        
    }
    if(nodeState.get("orig_custom_dateofBirth")){
    var jsonObj = {
        "operation": "replace",
        "field": "dob",
        "value": nodeState.get("orig_custom_dateofBirth")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_postalAddress")){
    var jsonObj = {
        "operation": "replace",
        "field": "addressLine1",
        "value": nodeState.get("orig_postalAddress")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_custom_postalAddress2")){
    var jsonObj = {
        "operation": "replace",
        "field": "addressLine2",
        "value": nodeState.get("orig_custom_postalAddress2")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_city")){
    var jsonObj = {
        "operation": "replace",
        "field": "city",
        "value": nodeState.get("orig_city")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_postalCode")){
    var jsonObj = {
        "operation": "replace",
        "field": "zip",
        "value": nodeState.get("orig_postalCode")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("postalExtension")){
    var jsonObj = {
        "operation": "replace",
        "field": "zip",
        "value": nodeState.get("postalExtension")
        }
        jsonArray.push(jsonObj)
        
        
    }


    if(nodeState.get("orig_stateProvince")){
    var jsonObj = {
        "operation": "replace",
        "field": "stateCode",
        "value": nodeState.get("orig_stateProvince")
        }
        jsonArray.push(jsonObj)
        
        
    }

    if(nodeState.get("orig_custom_county")){
    var jsonObj = {
        "operation": "replace",
        "field": "countyCode",
        "value": nodeState.get("orig_custom_county")
        }
        jsonArray.push(jsonObj)
        
        
    }

     try {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
             var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
             jsonObj =  {operation: "replace",field: "/updatedDateEpoch",value: auditData.updatedDateEpoch}
        jsonArray.push(jsonObj)
       jsonObj = {operation: "replace",field: "/updatedByID",value: auditData.updatedByID}
      jsonArray.push(jsonObj)
       jsonObj = {operation: "replace",field: "/updateDate",value: auditData.updatedDate}
      jsonArray.push(jsonObj)
       jsonObj = {operation: "replace",field: "/updatedBy",value: auditData.updatedBy}
      jsonArray.push(jsonObj)
        logger.debug("auditDetail " + JSON.stringify(auditData))
    } catch (error) {
       logger.error("Error Occured : Couldnot find audit details"+ error)

    }


    if(jsonArray.length>0){
         var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
        logger.debug("Patch Response -->"+response)
         
    if(response){
        return true
    }
    }
    else{
        return false
    }




    
} catch (error) {
    logger.error("Error Occurred While patchUserIdentity "+ error)
    
}    
}


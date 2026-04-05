var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    start: "Beginning Node Execution",
    node: "Node",
    nodeName: "KBA",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.KBA",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    BACK: "back",
    NOKBA: "nokba",
    FAILED: "failed",
    NEXTNOAPPENROLL: "nextnoappenroll"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};


function validateObject(obj) {
    if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
        return false;
    }
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return true;
        }
    }

    return true;
}

nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.start);
function main(){
    try{
        // if(nodeState.get("UserVerificationMethod")== "IDProofing"){
        if (callbacks.isEmpty()) {

            // if(nodeState.get("context") === "appEnroll"){
            //         var obj = {
            //         "apiCalls":[
            //             { "method": "KBA", "action": "proofing" },
            //             { "method": "MCI", "action": "sync" }
            //         ],
            //         "collectedUserInfo": nodeState.get("userInfoJSON")
            //     };
            // }else{
            //        var obj = {
            //         "apiCalls":[ { "method": "KBA", "action": "proofing" }],
            //         "collectedUserInfo": nodeState.get("userInfoJSON")
            //     }; 
            // }


            var obj = {
                    "apiCalls":[ { "method": "KBA", "action": "proofing" }],
                    "collectedUserInfo": nodeState.get("userInfoJSON")
                }; 
            
            // var obj = {
            //     "KBA": { "method": "KBA", "action": "proofing" },
            //     "collectedUserInfo": nodeState.get("userInfoJSON")
            // };

            if (nodeState.get("validationMessage") != null) {
                var errorMessage = nodeState.get("validationMessage");
                callbacksBuilder.textOutputCallback(0, errorMessage);
            }
            var pageHeader= {"pageHeader": "4_RIDP_KBA"};
            callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader));
            callbacksBuilder.textOutputCallback(0, JSON.stringify(obj));
            callbacksBuilder.textInputCallback("KBA Status");
            callbacksBuilder.confirmationCallback(0, ["next", "back"], 0);
        } else {
            var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
            var kbaStatus = callbacks.getTextInputCallbacks().get(0)

            if (typeof kbaStatus === "string") {
                try {
                    kbaStatus = JSON.parse(kbaStatus);
                    if (!kbaStatus || typeof kbaStatus !== "object" || typeof kbaStatus.status !== "string") {
                        logger.debug("Invalid kbaStatus object or missing status property");
                        nodeState.putShared("validationMessage", "invalid_input");
                        action.goTo("errorMessage");
                        return;
                    }

                    // Only check refId if status is "failure"
                    if (kbaStatus.status.toLowerCase() === "failure") {
                        if (!(kbaStatus.refId === null || typeof kbaStatus.refId === "string")) {
                            logger.debug("Invalid refId in kbaStatus (must be null or string) when status is failure");
                            nodeState.putShared("validationMessage", "invalid_input");
                            action.goTo("errorMessage");
                            return;
                        }else{
                            nodeState.putShared("refId",kbaStatus.refId)
                        }
                    }

                } catch (e) {
                    nodeLogger.error("Error parsing kbaStatus or invalid status: " + e);
                    nodeState.putShared("validationMessage", "invalid_input");
                    action.goTo("errorMessage");
                    return;
                }
            }
            nodeLogger.debug("kbaStatus.status --> " + (kbaStatus && kbaStatus.status ? kbaStatus.status : "undefined"))

                if (selectedOutcome === 1) {
                    nodeState.putShared("KBABack", "true");
                    // nodeState.putShared("IDProofingAnotherMethod","true")
                    nodeState.putShared("validationMessage",null);
                    action.goTo(NodeOutcome.BACK);
                } else if (selectedOutcome === 0 && kbaStatus && kbaStatus.status && kbaStatus.status.toLowerCase() === "success" && nodeState.get("context") === "appEnroll") {
                    nodeState.putShared("KBABack", "false");
                    if (nodeState.get("context") === "appEnroll") {
                        nodeState.putShared("appEnrollKBA", "true");
                        nodeState.putShared("prereqStatus", "COMPLETED");
                    }
                    nodeState.putShared("validationMessage",null);
                    var proofingMethod = "2";
                    if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                        proofingMethod = "2"
                    }
                    else{
                        proofingMethod = "3"
                    }
                    // patchUserIdentity(proofingMethod)
                    if(nodeState.get("context")==="appEnroll"){
                        // createTransaction("0",null,null,null) 
                    }
                    
                    action.goTo(NodeOutcome.NEXT);
                } else if (selectedOutcome === 0 && kbaStatus && kbaStatus.status && kbaStatus.status.toLowerCase() === "success"){
                    nodeState.putShared("KBABack", "false");
                    nodeState.putShared("RIDPMethodUsed","KBA")
                    action.goTo(NodeOutcome.NEXTNOAPPENROLL);
                }else if (nodeState.get("context") === "appEnroll") {
                    nodeState.putShared("appEnrollUnableToVerify", "true");
                    logger.debug("KBA RefID "+kbaStatus.refId)
                    nodeState.putShared("refId",kbaStatus.refId)
                    if(nodeState.get("LexisNexisFARS")==="true"){
                        nodeState.putShared("prereqStatus", "PENDING");
                    }
                    else{
                        nodeState.putShared("prereqStatus", "REVERIFY");
                    }
                    nodeState.putShared("validationMessage",null);
                    var proofingMethod = "2";
                    if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                        proofingMethod = "2"
                    }
                    else{
                        proofingMethod = "3"
                    }
                    // patchUserIdentity(proofingMethod)
                if(nodeState.get("context")==="appEnroll"){
                        var refId = "12345678"
                        if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                        refId= generateGUID()
                        }
                        
                        // createTransaction("1",refId,null,null) 
                    }
                    action.goTo("appEnrollUnableToVerify");
                } else {
                    nodeState.putShared("unableToVerify", "true");
                    nodeState.putShared("validationMessage",null);
                    //Need to patch the transaction for Failure
                    action.goTo(NodeOutcome.FAILED);
                }
        }
        // }else{
        //     action.goTo(NodeOutcome.NOKBA)
        // }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::Error Occurred in handleUserResponses Function::" + error);
        action.goTo("error");
    }
}



function patchUserIdentity(proofingMethod) {
try {
    var Id = nodeState.get("patchUserId")
    logger.debug("_patchUserIdentity id is --> "+Id+"Lexid::"+lexId)
    
    var jsonArray = []
    if(proofingMethod !== null && proofingMethod){
    var jsonObj = {
        "operation": "replace",
        "field": "proofingMethod",
        "value": proofingMethod
        }
        jsonArray.push(jsonObj)

         try {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
             var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
             var jsonObj =  {operation: "replace",field: "/updatedDateEpoch",value: auditData.updatedDateEpoch}
        jsonArray.push(jsonObj)
       var jsonObj = {operation: "replace",field: "/updatedByID",value: auditData.updatedByID}
      jsonArray.push(jsonObj)
       var jsonObj = {operation: "replace",field: "/updateDate",value: auditData.updatedDate}
      jsonArray.push(jsonObj)
       var jsonObj = {operation: "replace",field: "/updatedBy",value: auditData.updatedBy}
      jsonArray.push(jsonObj)
        logger.debug("auditDetail " + JSON.stringify(auditData))
    } catch (error) {
       logger.error("Error Occured : Couldnot find audit details"+ error)

    }

        
  

    logger.debug("KYID.2B1.Journey.IDProofing.MCISearchApiCall jsonArray Length is --> "+jsonArray.length )

    if(jsonArray.length>0){
         var response = openidm.patch("managed/alpha_kyid_user_identity/" + Id, null, jsonArray);
         nodeState.putShared("patchUserIdentity_id",response._id)
        logger.debug("Patch Response -->"+response)
         
    if(response){
        return true
    }
    }
    else{
        return false
    }
    }
    else{
        return false
    }
    
    } catch (error) {
        logger.error("Error Occurred While patchUserIdentity "+ error)
        
    }    
}


function createTransaction(status,refId,expiryDate,expiryDateEpoch) {
    try {
        
        logger.debug("Starting user identity creation for ID: " );
        logger.debug("status is --> "+ status)
        logger.debug("refId is --> "+ refId)
        logger.debug("expiryDate is --> "+ expiryDate)
        logger.debug("expiryDateEpoch is --> "+ expiryDateEpoch)
        logger.debug("currentTimeEpoch is --> "+ currentTimeEpoch)
        logger.debug("dateTime is --> "+ dateTime)
        logger.debug("user Id  is --> "+ nodeState.get("UserId"))
        logger.debug("user Id  is --> "+ nodeState.get("userPrereqId"))
        

        var requestBody={
            "createDate":dateTime,
            "createdBy":nodeState.get("UserId"),
            "requestedUserId":nodeState.get("UserId"),
            "requesterUserId":nodeState.get("UserId"),
            "updatedBy":nodeState.get("UserId"),
            "updateDate":dateTime,
            "createDateEpoch":currentTimeEpoch,
            "updateDateEpoch":currentTimeEpoch,
            "recordState":"0",
            "recordSource":"KYID-System"
            
                                    
        }
        if(nodeState.get("userPrereqId")){
            requestBody["userPrereqId"]={ "_ref": "managed/alpha_kyid_enrollment_user_prerequisites/" + nodeState.get("userPrereqId"), "_refProperties": {} }
        }
        if(status){
            requestBody["status"]=status
        }
        if(expiryDate){
            requestBody["expiryDate"]=expiryDate
        }
        if(expiryDateEpoch){
            requestBody["expiryDateEpoch"]=expiryDateEpoch
        }
        if(refId){
            requestBody["referenceId"]=refId
        }

        try {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
             var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
              requestBody['createDate']= auditData.createdDate
             requestBody['createDateEpoch']= auditData.createdDateEpoch
             requestBody['createdBy']= auditData.createdBy
             requestBody['createdByID']= auditData.createdByID
        logger.debug("auditDetail " + JSON.stringify(auditData))
    } catch (error) {
       logger.error("Error Occured : Couldnot find audit details"+ error)

    }
        
        
        var response = openidm.create("managed/alpha_kyid_remote_identity_proofing_request", null, requestBody);
        logger.debug("response is --> "+ response)


    } catch (error) {
        logger.error("Errror Occurred While creating userIdentity is --> "+ error)
        
    }
    
}

// Generate a random GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0, 
            value = c == 'x' ? r : (r & 0x3 | 0x8);
        return value.toString(16);
    });
}



main()
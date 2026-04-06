var dateTime = new Date().toISOString();
var currentTimeEpoch = Date.now();
var transactionid=requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "DisplayUserAccount",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.DisplayUserAccount",
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

function helpDesk(){
    try{
        var helpDeskName = null;
        var query = null;
        var helpDeskInfo = null;
        if (systemEnv.getProperty("esv.helpdesk.name")) {
            var helpDeskName = systemEnv.getProperty("esv.helpdesk.name");
            var query = openidm.query("managed/alpha_kyid_helpdeskcontact", { "_queryFilter": '/name eq "' + helpDeskName + '"' }, ["*"]);
            if (query.result.length > 0) {
                var helpDeskInfo = query.result[0];
                nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Help Desk Info::" + JSON.stringify(helpDeskInfo));
                return helpDeskInfo;
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in helpDesk function " + error);
        return null;
    }
}


// Main Execution
try {
    logger.debug("I'm here.");
    var usrKOGID = nodeState.get("KOGID");
    var mail = nodeState.get("mail");
    // var userInfoJSON = nodeState.get("userInfoJSON");
    var outcome = {
        associatedEmailIds: null,
        //apiCalls:[]
        apicalls:[]
    }
    var apicalls ={
        
    }
    if(nodeState.get("MCISync") === "true"){
        //apicalls["method"] = "MCI"
        //apicalls["action"] = "sync"
        outcome["collectedUserInfo"]= nodeState.get("userInfoJSON")
    }
    outcome.apicalls.push(apicalls)
   
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
        var emailIds = []
       
        if(nodeState.get("searchEmailArray")){
            // emailIds = JSON.parse(nodeState.get("searchEmailArray"))
             emailIds = (nodeState.get("searchEmailArray"))
            logger.debug("emailIds Type is --> "+Array.isArray(emailIds))
            var maskedEmailList = []
            emailIds.forEach(val=>{
            var lastLetter = val.split("@")[0]
            lastLetter = lastLetter.slice(-2)
            var maskedEmail = val[0] + "****" + lastLetter + "@" + val.split("@")[1]
            maskedEmailList.push(maskedEmail)
            })
            logger.debug("Masked Email IDs are "+ maskedEmailList)
            logger.debug("EmailIDs are -- >"+emailIds)
            nodeState.putShared("searchEmailArray",maskedEmailList)
        }
        
        var pageHeader = null;
        if(nodeState.get("context")==="appEnroll" || nodeState.get("journeyName")==="createAccount"){
            if(nodeState.get("SSAStatus")=="failed"){
                pageHeader= {"pageHeader": "5_SSA_Unable_To_Verify"};
            }else{
                pageHeader= {"pageHeader": "5_RIDP_Sync_SIH_Display_Email"};
            }
            
        }else{
            pageHeader= {"pageHeader": "5_Unable_To_verify"};
        }
         

        if (nodeState.get("validationErrorCode") != null) {
            var errorMessage = nodeState.get("validationErrorCode")
            callbacksBuilder.textOutputCallback(0, errorMessage)
        }
        callbacksBuilder.textOutputCallback(0, JSON.stringify(pageHeader))
        
        // outcome["associatedEmailIds"]=nodeState.get("searchEmailArray")
        // callbacksBuilder.textOutputCallback(0,JSON.stringify(outcome));
        // callbacksBuilder.confirmationCallback(0, ["Next"], 0);
        if(nodeState.get("context")==="appEnroll" && nodeState.get("prereqStatus")==="COMPLETED"){
            if(nodeState.get("completedAttemp")==="2"){
                // var response = {
                //     "apiCalls":[
                //         {
                //         "method":"MCI",
                //         "action":"sync"
                //         }
                //     ],
                //     "message":"appEnroll_ID_Proofing_Completed",
                //     "status":"COMPLETED"
                // }
                var response = {
                    "message":"appEnroll_ID_Proofing_Completed",
                    "status":"COMPLETED"
                }
            }
            else{
                var response = {"apiCalls":[],"message":"appEnroll_ID_Proofing_Completed","status":"COMPLETED"}
            }
            
            callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
            callbacksBuilder.confirmationCallback(0, ["Next"], 0);
        }
        
        else if(nodeState.get("context")==="appEnroll" && nodeState.get("prereqStatus")==="REVERIFY"){
            if(nodeState.get("displayUser")==="true"){
                 var response = {
                    associatedEmailIds: null,
                    "status":"REVERIFY",
                    "apiCalls":[]
                } 
                 response.associatedEmailIds = nodeState.get("searchEmailArray")
            }else{
                var response = {"apiCalls":[],"errorMessage":"Display_FARS_Message:","status":"REVERIFY"}
            }
            
            callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
            callbacksBuilder.confirmationCallback(0, ["Next"], 0);
        }
        else if(nodeState.get("unableToVerify")==="true"){
           var UnableToVerifyoutcome ={
                "apiCalls": [],
                "errorMessage":"Unable To Verify Your Identity"
            }
           callbacksBuilder.textOutputCallback(0,JSON.stringify(UnableToVerifyoutcome)); 
           callbacksBuilder.confirmationCallback(0, ["Try With Different Method"], 0);
        }
        else{
        if(nodeState.get("context")==="appEnroll"){
            // if(nodeState.getShared("SSAStatus")=="failed"){
            //     var response = {
            //     "status":"NOT_COMPLETED",
            //     "apiCalls":[]
            //     } 
            // }else{
                var response = {
                associatedEmailIds: null,
                "status":"NOT_COMPLETED",
                "apiCalls":[]
                } 
            //}

            // outcome["associatedEmailIds"]=nodeState.get("searchEmailArray")
            response.associatedEmailIds = nodeState.get("searchEmailArray")
            callbacksBuilder.textOutputCallback(0,JSON.stringify(response));
            callbacksBuilder.confirmationCallback(0, ["Next"], 0)
            
        }
        else{
        
        outcome["associatedEmailIds"]=nodeState.get("searchEmailArray")
        if(nodeState.get("journeyName")==="createAccount"){
            var helpDeskInfo = helpDesk();  
            if(helpDeskInfo != null){
                outcome["helpDeskContactInfo"] = helpDeskInfo;
            }else{
                outcome["helpDeskContactInfo"] = "";
            }
        }
        callbacksBuilder.textOutputCallback(0,JSON.stringify(outcome));
        callbacksBuilder.confirmationCallback(0, ["Next"], 0);
            
        } 
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "Error requestCallback Function" + error.message);
    }

}

function handleUserResponses() {
    try {
        // nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "" + "Verified Phone Number is " + nodeState.get("verifiedTelephoneNumber") + nodeState.get("phoneVerified"))
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        if (selectedOutcome === 0) {
            if(nodeState.get("unableToVerify")==="true"){
                action.goTo("Next")
            }
            else{
            nodeState.putShared("validationErrorCode", null);
                action.goTo("false")   
            }
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error+mail);
        action.goTo("error");
    }
}




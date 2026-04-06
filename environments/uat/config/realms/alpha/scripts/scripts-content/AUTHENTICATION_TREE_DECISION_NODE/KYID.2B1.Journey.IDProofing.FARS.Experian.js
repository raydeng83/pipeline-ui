var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Select Option ",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.FARS.Experian",
    emptyhandleResponse: "In Function emptyhandleResponse",
    handleResponse: "In Function handleResponse",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    NEXT: "next",
    DIVERT: "divert"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};

function emptyhandleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.emptyhandleResponse);
    try{
        var jsonobj = {"pageHeader": "FARS_ENTER_DETAILS"};
        
        if (nodeState.get("errorArray") != null) {
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>${nodeState.get("errorArray")}</div>`);
        }

        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
        callbacksBuilder.textInputCallback("Last Name");
        callbacksBuilder.textInputCallback("Date of Birth");
        callbacksBuilder.textInputCallback("referenceId");

     }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " :: Error in emptyhandleResponse:: " + error);
    }
}

function handleResponse(){
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.handleResponse);
    try{ 

        var lastName = callbacks.getTextInputCallbacks().get(0);
        var dob = callbacks.getTextInputCallbacks().get(1);
        var referenceId = callbacks.getTextInputCallbacks().get(2);
        nodeLogger.debug("lastName : " + lastName + " :: dob : " + dob + " :: referenceId : " + referenceId);

        var userInfoJSON = nodeState.get("userInfoJSON");
        var errorArray = []

        if(lastName && lastName!==null){
            userInfoJSON.sn = lastName;
        }else{
            errorArray.push("Last Name is Mandatory");
        }

        if(dob && dob!==null){
            userInfoJSON.dob = dob;
        }else{
            errorArray.push("Date of Birth is Mandatory");
        }

        if(referenceId && referenceId!==null){
            userInfoJSON.hubReferenceNumber = referenceId;
        }else{
            errorArray.push("Reference Id is Mandatory");
        }

        nodeState.putShared("userInfoJSON", userInfoJSON);
        logger.debug("userInfoJSON : " + JSON.stringify(userInfoJSON));
        
        if(errorArray.length > 0){
            nodeState.putShared("errorArray", errorArray);
            action.goTo(NodeOutcome.DIVERT);
        }else{
            nodeState.putShared("errorArray", null);
            action.goTo(NodeOutcome.NEXT);
        }
        

    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " :: Error in handleResponse :: "  + error);
    }
}

function main(){ 
    nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try{
        if (callbacks.isEmpty()) {
            emptyhandleResponse()
        } else {   
            handleResponse()
        }
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + " :: Error in main :: "  + error);
    }
}

main();
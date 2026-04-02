var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Failed Verification Details",
    script: "Script",
    scriptName: "KYID.2B1.Journey.IDProofing.Failed.Verification.Details",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    CANCEL: "cancel",
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};


function main(){
    var reference = "12345678"
    try{
         if (callbacks.isEmpty()) {
             if(nodeState.get("IDVerificationStatus")==="failed"){
                 callbacksBuilder.textOutputCallback(0,"Verification Failed");
                 callbacksBuilder.textOutputCallback(0,"Submitted information");
                if (nodeState.get("givenName")) {
                var givenName = nodeState.get("givenName");
                callbacksBuilder.textInputCallback("Legal first Name", givenName);
                }
                
                if (nodeState.get("middleName")) {
                    var middleName = nodeState.get("middleName");
                    callbacksBuilder.textInputCallback("Legal middle Name", middleName);
                }
                
                if (nodeState.get("lastName")) {
                    var lastName = nodeState.get("lastName");
                    callbacksBuilder.textInputCallback("Legal last Name", lastName);
                }
                
                if (nodeState.get("suffix")) {
                    var suffix = nodeState.get("suffix");
                    callbacksBuilder.textInputCallback("suffix", suffix);
                }
                if (nodeState.get("custom_gender")) {
                    var gender = nodeState.get("custom_gender");
                    callbacksBuilder.textInputCallback("Gender", gender);
                }
                
                if (nodeState.get("dateOfBirth")) {
                    var birthdate = nodeState.get("dateOfBirth");
                    callbacksBuilder.textInputCallback("Birthdate", birthdate);
                }
                
                if (nodeState.get("ssn")) {
                    var ssn = nodeState.get("ssn");
                    callbacksBuilder.textInputCallback("Social Security Number", ssn.slice(-4));
                }
                
                if (nodeState.get("postalAddress")) {
                    var address1 = nodeState.get("postalAddress");
                    callbacksBuilder.textInputCallback("Address 1*", address1);
                }
                
                if (nodeState.get("postalAddress2")) {
                    var address2 = nodeState.get("postalAddress2");
                    callbacksBuilder.textInputCallback("Address 2", address2);
                }
                
                if (nodeState.get("city")) {
                    var city = nodeState.get("city");
                    callbacksBuilder.textInputCallback("City", city);
                }
                
                if (nodeState.get("stateProvince")) {
                    var state = nodeState.get("stateProvince");
                    callbacksBuilder.textInputCallback("State", state);
                }
                
                if (nodeState.get("postalCode")) {
                    var zip = nodeState.get("postalCode");
                    callbacksBuilder.textInputCallback("Zip code*", zip);
                }
                
                if (nodeState.get("postalExtension")) {
                    var zipExt = nodeState.get("postalExtension");
                    callbacksBuilder.textInputCallback("Zip extension", zipExt);
                }
                
                if (nodeState.get("county")) {
                    var county = nodeState.get("county");
                    callbacksBuilder.textInputCallback("County", county);
                }
        
                if(nodeState.get("UserVerificationMethod")=="IDProofing"){
                    if (nodeState.get("telephoneNumber")) {
                        var telephoneNumber = nodeState.get("telephoneNumber");
                        callbacksBuilder.textInputCallback("Mobile Number*", telephoneNumber);
                    } 
    
                    if (nodeState.get("mail")) {
                        var telephoneNumber = nodeState.get("mail");
                        callbacksBuilder.textInputCallback("Primary email*", mail);
                    } 
                }
                    callbacksBuilder.textOutputCallback(0,"Please go through the below option for further assistance");
                    callbacksBuilder.textInputCallback("Visit in-person");
                    callbacksBuilder.textOutputCallback(0,`Reference number ${reference} `);
                    callbacksBuilder.confirmationCallback(0, ["cancel"], 1);
            }
         }else{
             var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
             if(selectedOutcome === 0){
                 action.goTo(NodeOutcome.CANCEL);
             }
         }
    }catch(error){
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end + "::Error Occurred in main Function::" + error);
    }
    
}

main();
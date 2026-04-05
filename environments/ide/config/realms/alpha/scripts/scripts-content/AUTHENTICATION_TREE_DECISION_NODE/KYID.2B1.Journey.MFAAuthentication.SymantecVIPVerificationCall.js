var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthentication SymantecVIPVerificationCall",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFAAuthentication.SymantecVIPVerificationCall",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    ANOTHER_FACTOR: "AnotherMethod",
    FAILED: "false",
    SINGLE_SYMANTEC: "singlesymantec",
    EMPTY_SECURITY_CODE: "EmptyCode"
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
    }
};


function getCredID() {
    
    var usrKOGID = null;
    var type = "single";
    if(nodeState.get("KOGID") && nodeState.get("KOGID")!=null){
        nodeLogger.debug("Printing KOGID for enduser"+ nodeState.get("KOGID"));
        usrKOGID = nodeState.get("KOGID");
    }
    var usrMFAData = getMFAObject(usrKOGID);
    var mfaValueArray = getUserActiveMFAValue(usrMFAData, "SYMANTEC");

    //to handle when user has only one symantec cred registered
     if (mfaValueArray.length == 1) {
        nodeLogger.debug("Only one Symantec ID found, navigating to singlesymantec."+mfaValueArray[0]);
        nodeState.putShared("CredID",mfaValueArray[0]); 

    } else {
        var symantecIDs = [];
        for(var i=0;i<mfaValueArray.length;i++)
        {
            var symantecID = "              <TokenIds>"+mfaValueArray[i]+"</TokenIds>";
            symantecIDs.push(symantecID);
        }  
        var indent = "              ";
        symantecIDs.push(indent);
        logger.debug("***********Symnatec Array Config: "+String(symantecIDs).replace(/,/g,''));
        nodeState.putShared("CredID", String(symantecIDs).replace(/,/g,''));  
        type="multiple"; 
     }
    return type;
}


// Function to get the locale from request parameters
function getLocale() {
    var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
        if (requestCookies.clocale && requestCookies.clocale != null) {
            var cookieValue = requestCookies.clocale;
            if (cookieValue.localeCompare("en") == 0 || cookieValue.localeCompare("es") == 0) {
                clocale = cookieValue;
            }
        }
    }
    nodeState.putShared("clocale", clocale);
    return clocale;
}

function generateRandomCode(){
    var letters ='';
    for (i=0;i<4;i++){
        const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26));
        letters += randomChar
    }

    var numbers ='';
    for (j=0;j<4;j++){
        const randomDigit =Math.floor(Math.random() * 10);
        numbers +=randomDigit;
    }

    return letters + numbers;

}


function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        nodeLogger.debug("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
        return mfaMethodResponses;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}

function getUserActiveMFAValue(usrMFAData, usrMFAType) {
    var mfaValueArray = []
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0 && mfaMethodResponse["MFAMethod"].localeCompare(usrMFAType) === 0) {
                mfaValueArray.push(mfaMethodResponse["MFAValue"]);
            }
        }
    }
    return mfaValueArray;																	   
}


// Function to build callbacks based on locale
function buildCallbacks() {
    try {
        var clocale = getLocale();
        var textPrompt, confirmationOptions, displayMessage;

        if (clocale === "es") {
            displayMessage = "Ingrese el código de seguridad generado desde la aplicación Symantec VIP."
            textPrompt = "Introduzca el código de seguridad";
            confirmationOptions = ["Verificar", "Verificar con otra cosa"];
        } else {
            displayMessage = "Enter the generated security code from the Symantec VIP app."
            textPrompt = "Enter security code";
            confirmationOptions = ["Verify", "Return to authenticator list"];
        }
        if (nodeState.get("errorMessage") != null) {
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`)
        }
         
         if (nodeState.get("errorMessage_BlankOTP") != null) {
            var errorMessage_BlankOTP = nodeState.get("errorMessage_BlankOTP");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_BlankOTP+`</div>`)
        }

        
        callbacksBuilder.textOutputCallback(0, `<div class='page-element'>${displayMessage}</div>`)
        callbacksBuilder.textInputCallback(textPrompt);
        callbacksBuilder.confirmationCallback(0, confirmationOptions, 0);
        
    } catch (e) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error building callbacks :: " + e);

    }
}

// Function to handle user responses
function handleUserResponses() {

    try {
        var clocale = getLocale();
       // var securityCode = callbacks.getTextInputCallbacks().get(0);
        var securityCode = callbacks.getTextInputCallbacks().get(0).trim();
        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
        nodeState.putShared("securityCode", securityCode);

        if (selectedOutcome === 0) {
            if (securityCode) {
                if(getCredID().localeCompare("single")==0){
                     var SymantecTransId =generateRandomCode();
                    nodeState.putShared("Id", SymantecTransId);
                    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"Symantec Transcation ID " + nodeState.get("Id"))
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("errorMessage_BlankOTP",null);
                    nodeState.putShared("anotherFactor",null);
                    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside single");
                    action.goTo(NodeOutcome.SINGLE_SYMANTEC);
                } else {
                    var SymantecTransId =generateRandomCode();
                    nodeState.putShared("Id", SymantecTransId);
                    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin +"Symantec Transcation ID " + nodeState.get("Id"))
                    nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Inside multiple");
                    nodeState.putShared("errorMessage", null);
                    nodeState.putShared("errorMessage_BlankOTP",null);
                    nodeState.putShared("anotherFactor",null);
                    action.goTo(NodeOutcome.SUCCESS);
                }
                    
            }
            else {
                nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Security Code is Empty");
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("anotherFactor",null);
                action.goTo(NodeOutcome.EMPTY_SECURITY_CODE);


            }


        } else if (selectedOutcome === 1) {
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("errorMessage_BlankOTP",null);
            var anotherFactor = "anotherFactor";
            nodeState.putShared("anotherFactor", anotherFactor);
            action.goTo(NodeOutcome.ANOTHER_FACTOR);
        } else {
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("errorMessage_BlankOTP",null);
            nodeState.putShared("anotherFactor",null);
            action.goTo(NodeOutcome.FAILED);
        }
    } catch (e) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error handling user response ::::: " + e);

    }
}

// Main execution
try {
    if (callbacks.isEmpty()) {
        buildCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
    nodeState.putShared("errorMessage", null);
    nodeState.putShared("errorMessage_BlankOTP",null);
    nodeState.putShared("anotherFactor",null);
    action.goTo(NodeOutcome.FAILED);
}

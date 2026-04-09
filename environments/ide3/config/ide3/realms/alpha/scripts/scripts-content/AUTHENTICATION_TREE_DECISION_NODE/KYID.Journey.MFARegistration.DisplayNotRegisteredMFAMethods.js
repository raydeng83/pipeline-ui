var dateTime = new Date().toISOString();
var defaultMsgen = systemEnv.getProperty("esv.defaultmsg.en");
var defaultMsges = systemEnv.getProperty("esv.defaultmsg.es");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFARegistration DisplayNotRegisteredMFAMethods",
    script: "Script",
    scriptName: "KYID.Journey.MFARegistration.DisplayNotRegisteredMFAMethods",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    DEFAULT: "Default",
    EMAIL: "email",
    SMS: "sms",
    VOICE: "voice",
    FROTP: "otp",
    FRPUSH: "swk",
    SYMANTEC: "symantec",
    FAILED: "false"
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

// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User ID: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error retrieving user ID from node state: " + error.message);
        return null;
    }
}

// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Fetching user data for ID: " + userId);
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}


function availableMFAOptions(){
    var setMFAContext = nodeState.get("setMFAContext")
    var MFAContextCode = setMFAContext.requiredMFAMethodCode;
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + MFAContextCode);

    var newMFAOptions = []
    if (MFAContextCode === 3) {
        newMFAOptions = ["DEFAULT","EMAIL", "SMSVOICE", "FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    
    else if (MFAContextCode === 4) {
        newMFAOptions = ["DEFAULT","SMSVOICE", "FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    
    else if (MFAContextCode === 5) {
        newMFAOptions = ["DEFAULT","FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    
    else if (MFAContextCode === 0) {
        setMFAContext.isMFARequired = "false"
    } 
    else{
        newMFAOptions = ["DEFAULT","FRPUSH", "FRTOTP", "SYMANTEC"]
    }

    return newMFAOptions;
}

// Function to build MFA options array with localization
function buildMFAOptionsArray(nonCommonMFAOptions,usrMFAData) {
    var mfaOptionsArray = [];
    var messages = {
        en: {
            DEFAULT: defaultMsgen,
            SMSVOICE: "Verify with a code sent to your phone",
            FRTOTP: "Register ForgeRock Authenticator app",
            FRPUSH: "Register ForgeRock Push notification",
            SYMANTEC: "Set up Symantec VIP",
            verify: "Verify",
        },
        es: {
            DEFAULT: defaultMsges,
            SMSVOICE: "Verifica con un código enviado a tu teléfono",
            FRTOTP: "Registrar la aplicación ForgeRock Authenticator",
            FRPUSH: "Registrar la notificación Push de ForgeRock",
            SYMANTEC: "Configurar Symantec VIP",
            verify: "Verificar",
            }
    };

    var clocale = getLocale(); 
    var localeMessages = messages[clocale] || messages.en;

    try {
        var userData = fetchUserData(getUserId());
        for (var i = 0; i < nonCommonMFAOptions.length; i++) 
            {
            var mfaMethod = nonCommonMFAOptions[i]
            if(mfaMethod === "DEFAULT"){
                var defaultMessage = localeMessages[mfaMethod];
                logger.error("Going to default");
                mfaMethod = defaultMessage;
                mfaOptionsArray.push(mfaMethod);
            }
            else if (mfaMethod === "SMSVOICE") {
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "inside the sms select condition")
                mfaMethod = localeMessages[mfaMethod];
                mfaOptionsArray.push(mfaMethod);
            } else if (mfaMethod === "FRTOTP") {
                mfaMethod = localeMessages[mfaMethod];
                mfaOptionsArray.push(mfaMethod);
            } else if (mfaMethod === "FRPUSH") {
                mfaMethod = localeMessages[mfaMethod];
                mfaOptionsArray.push(mfaMethod);
            } else if (mfaMethod === "SYMANTEC") {
                mfaMethod = localeMessages[mfaMethod];
                mfaOptionsArray.push(mfaMethod);
            }  
        }
        
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error building MFA options array: " + error.message);
        action.goTo(NodeOutcome.FAILED);
    }

    return mfaOptionsArray;
}

// Function to handle callbacks and set the action
function processCallbacks(mfa) {
    var mfaOptions=[];
    try {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Processing callbacks");
        
        for (var i = 0; i < mfa.length; i++) {
            
            if(mfa[i].includes("|")){
               
                 mfaOptions.push(mfa[i].substring(0, mfa[i].indexOf("|")));
            } else {
                mfaOptions.push(mfa[i])
            }
        }
        logger.error("mfaOptions in processCallbacks: "+mfaOptions)
        var clocale = getLocale();

        var promptMessage = clocale === "es" ? "Métodos de seguridad" : "Security Methods";
        var setupLabel = clocale === "es" ? "Construir" : "Set Up";
        if (callbacks.isEmpty()) {
            if(nodeState.get("blankmsg")){
                var error = nodeState.get("blankmsg");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
            }
            callbacksBuilder.textOutputCallback(0, "<div class='page-element'></div>");
            callbacksBuilder.choiceCallback(
                promptMessage,
                mfaOptions,
                0,
                false
            );
            callbacksBuilder.confirmationCallback(0, [setupLabel], 0);
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "MFA Options: " + mfaOptions);
        } else {
            var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0];
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Selected outcome: " + selectedOutcome);
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Selected index: " + selectedIndex);

            if (selectedOutcome === 0) {
                var selectedMFAOption = mfaOptions[selectedIndex];
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Printing selected MFA option :: " + selectedMFAOption)

                selectedMFAOption.toString()
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Selected MFA option: " + selectedMFAOption);
                selectedMFAOption = selectedMFAOption.toString()
                if (selectedMFAOption.includes(defaultMsgen) || selectedMFAOption.includes(defaultMsges)) {
                     nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.DEFAULT);
            }
               else if (selectedMFAOption.includes("phone") || selectedMFAOption.includes("teléfono")) {
                    var phoneNumber =  mfa[selectedIndex].split("|")
                    nodeState.putShared("smsvoice", phoneNumber[1]);
                    nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.SMS);
                } else if (selectedMFAOption.includes("Authenticator")) {
                    nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.FROTP);
                } else if (selectedMFAOption.includes("Push")) {
                    nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.FRPUSH);
                } else if (selectedMFAOption.includes("Symantec")) {
                    nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.SYMANTEC);
                } else {
                    nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.FALSE);
                }
            } else {
                 nodeState.putShared("blankmsg",null);
                action.goTo(NodeOutcome.REGISTRATION);
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +"Error processing callbacks: " + error.message);
         nodeState.putShared("blankmsg",null);
        action.goTo(NodeOutcome.FAILED);
    }
}


function main() {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try {
        var clocale = getLocale();
        var userId = getUserId();
        if (userId) {
            var userData = fetchUserData(userId);
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Data: " + userData);
            if (userData) {
                var usrMFAData = getMFAObject(userData.userName);
                var userMFAMethods = getUserMFAMethods(usrMFAData);
                var newMFAOptions = availableMFAOptions();
                var nonCommonMFAOptions = newMFAOptions.filter(value => !userMFAMethods.includes(value));
                var setMFAContext = nodeState.get("setMFAContext")
                var MFAContextCode = setMFAContext.requiredMFAMethodCode;

             
                
                //SMSVOICE is included if MFAContextCode is 3 or 4
                if (MFAContextCode == 3 || MFAContextCode == 4) {
                    logger.error("*******  ********* printing the mfacontext" +MFAContextCode);
                  
                    if (!nonCommonMFAOptions.includes("SMSVOICE")) {
                        nonCommonMFAOptions.push("SMSVOICE");
                    }
                }

                   if (!nonCommonMFAOptions.includes("SYMANTEC") ) {
                    nonCommonMFAOptions.push("SYMANTEC");
                   
                }
                  if (!nonCommonMFAOptions.includes("DEFAULT")) {
                    nonCommonMFAOptions.push("DEFAULT");
                }
                // Always include SYMANTEC
                
               
                
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Printing the noncommon  ::::: " + nonCommonMFAOptions)
                var arrayWithMessages = buildMFAOptionsArray(nonCommonMFAOptions,usrMFAData)
                
                if (arrayWithMessages) {
                    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Going to the true condition inside is registered for any method ")
                    processCallbacks(arrayWithMessages);
                }
                else {
                     nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.FAILED);
                }
    
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + ("Error in main execution: " + error.message));
         nodeState.putShared("blankmsg",null);
        action.goTo(NodeOutcome.FAILED);
    }
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
}


function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        nodeLogger.error("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
        return mfaMethodResponses;

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
         nodeState.putShared("blankmsg",null);
        action.goTo(NodeOutcome.FAILED);
    }
}


function getUserMFAMethods(usrMFAData) {
    var mfaOptionsArray = []
    if (usrMFAData.result.length > 0) {
        
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                mfaOptionsArray.push(mfaMethodResponse["MFAMethod"]); 
            }
        }
        
    }
    return mfaOptionsArray;
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


// Main execution
main();
dateTime = new Date().toISOString();
var defaultMsgen = systemEnv.getProperty("esv.defaultmsg.en");
var defaultMsges = systemEnv.getProperty("esv.defaultmsg.es");
// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Select MFAMethod to RemoveReset",
    script: "Script",
    scriptName: "KYID.Journey.SelectMFAMethodtoRemoveReset",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    DEFAULT:"Default",
    EMAIL: "email",
    SMS: "sms",
    VOICE: "voice",
    FROTP: "otp",
    FRPUSH: "swk",
    SYMANTEC: "symantec",
};

// Logger Function
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



// Function to build MFA options array with localization
function buildMFAOptionsArray(userMFAMethods, usrMFAData) {
    var mfaOptionsArray = [];
    var messages = {
        en: {
            DEFAULT: defaultMsgen,
            SMSVOICE: "Remove Phone: ",
            FRTOTP: "Remove ForgeRock Authenticator app",
            FRPUSH: "Remove ForgeRock Push Notification",
            SYMANTEC: "Remove Symantec: "
        },
        es: {
            DEFAULT: defaultMsges,
            SMSVOICE: "Eliminar teléfono: ",
            FRTOTP: "Eliminar la OTP de ForgeRock",
            FRPUSH: "Eliminar la notificación Push de ForgeRock",
            SYMANTEC: "Quitar Symantec: "
        }
    };

    var clocale = getLocale(); 
    var localeMessages = messages[clocale] || messages.en;
    var addedMethods = [];
    try {
        var userData = fetchUserData(getUserId());
        for (var i = 0; i < userMFAMethods.length; i++) {
            var mfaMethod = userMFAMethods[i]
            if (addedMethods.indexOf(mfaMethod) === -1) {
                addedMethods.push(mfaMethod); // Track the method as added
                if(mfaMethod === "DEFAULT"){
                    var defaultMessage = localeMessages[mfaMethod];
                    mfaMethod = defaultMessage;
                    mfaOptionsArray.push(mfaMethod);
                }
              else if (mfaMethod === "SMSVOICE") {
                nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "inside the sms select condition")
                var phoneNumbers = getUserActiveMFAValue(usrMFAData, "SMSVOICE")
                for (var j = 0; j < phoneNumbers.length; j++) {
                    mfaMethod = "SMSVOICE";
                    var phoneNumber = phoneNumbers[j];
                    var phoneMessage = localeMessages[mfaMethod] + phoneNumber.substring(0, phoneNumber.length-10) + " XXX-XXX-" + phoneNumber.slice(-4)
                    mfaMethod = phoneMessage;
                    mfaOptionsArray.push(mfaMethod+"|"+phoneNumbers[j]);
                }
            } else if (mfaMethod === "FRTOTP") {
                mfaMethod = localeMessages.FRTOTP;
                mfaOptionsArray.push(mfaMethod);
            } else if (mfaMethod === "FRPUSH") {
                mfaMethod = localeMessages.FRPUSH;
                mfaOptionsArray.push(mfaMethod);
            } else if (mfaMethod === "SYMANTEC") {
                var credentialIds = getUserActiveMFAValue(usrMFAData, "SYMANTEC")
                for (var j = 0; j < credentialIds.length; j++) {
                    mfaMethod = "SYMANTEC";
                    var credentialId = credentialIds[j];
                    var symantecMessage = localeMessages[mfaMethod] + credentialId;
                    mfaMethod = symantecMessage;
                    mfaOptionsArray.push(mfaMethod);
                }
              }
            }
            }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error building MFA options array: " + error.message);
    }

    return mfaOptionsArray;
}


// Function to handle callbacks and set the action
function processCallbacks(mfa) {
    var mfaOptions=[];
    try {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Processing callbacks");
        for (var i = 0; i < mfa.length; i++) {
             logger.error("Printing on trimming 1:::::::::::::::::")
             logger.error("Printing on trimming 2::::::::::::::::"+ mfa[i])
            if(mfa[i].includes("|")){
                logger.error("Printing on trimming 3::::::::::::::::"+ mfa[i].substring(0, mfa[i].indexOf("|")))
                 mfaOptions.push(mfa[i].substring(0, mfa[i].indexOf("|")));
            } else {
                mfaOptions.push(mfa[i])
            }
        }
        logger.error("mfaOptions in processCallbacks: "+mfaOptions)
        
        var clocale = getLocale();
        var resetRemoveLabel = clocale === "es" ? "Eliminar método de seguridad" : "Remove Security Method";
        var promptMessage = clocale === "es" ? "Seleccione el método de seguridad del usuario" : "Select the user’s security method to remove";
        var promptCont = clocale === "es" ? " para eliminarlo del perfil" : " from the profile";

        /*if (callbacks.isEmpty()) {
            callbacksBuilder.textOutputCallback(0,`<div class='message-text'>`+promptMessage+`</div>`)  
            //callbacksBuilder.choiceCallback(`<div class='message-container'>`+promptMessage+`</div>`,mfaOptions,0,false );
            
                callbacksBuilder.choiceCallback(promptCont,mfaOptions,0,false);
            callbacksBuilder.confirmationCallback(0, [resetRemoveLabel], 0);
            nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "MFA Options: " + mfaOptions);
        }*/
        
         if (callbacks.isEmpty()) {
             if(nodeState.get("blankmsg")){
                var error = nodeState.get("blankmsg");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
            }
            callbacksBuilder.textOutputCallback(0,`<div class='message-text-wrap'>`+promptMessage+promptCont+`</div>`)  
            callbacksBuilder.choiceCallback(" ",mfaOptions,0,false);
            callbacksBuilder.confirmationCallback(0, [resetRemoveLabel], 0);
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
               else if (selectedMFAOption.includes("Phone") || selectedMFAOption.includes("teléfono")) {
                    var phoneNumber =  mfa[selectedIndex].split("|")
                    nodeState.putShared("telephonenumber", phoneNumber[1]);
                      // nodeState.putShared("SMSVOICE", "methodToRemove");
                       nodeState.putShared("methodToRemove", "SMSVOICE");
                    nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.SMS);
                } else if (selectedMFAOption.includes("app") || selectedMFAOption.includes("OTP")) {
                    nodeState.putShared("blankmsg",null);
                       nodeState.putShared("methodToRemove", "FRTOTP");
                    action.goTo(NodeOutcome.FROTP);
                } else if (selectedMFAOption.includes("Push")) {
                       nodeState.putShared("methodToRemove", "FRPUSH");
                    nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.FRPUSH);
                } else if (selectedMFAOption.includes("Symantec")) {
                       var credentialId =  mfa[selectedIndex].split(": ")
                       logger.error("*****" +credentialId)
                       nodeState.putShared("credentialId", credentialId[1]);
                       nodeState.putShared("methodToRemove", "SYMANTEC");
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
        action.goTo("false");
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
                logger.error("printing userMFAMethods" + userMFAMethods);
                
                var arrayWithMessages = buildMFAOptionsArray(userMFAMethods, usrMFAData);
                
                if (arrayWithMessages) {
                    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Going to the true condition inside is registered for any method ")
                    processCallbacks(arrayWithMessages);
                }
                else {
                     nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.FAILED)
                }
    
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + ("Error in main execution: " + error.message));
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
    }
}


function getUserMFAMethods(usrMFAData) {
    var mfaOptionsArray = []
    if (usrMFAData.result.length > 0) {
        mfaOptionsArray.push("DEFAULT");
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
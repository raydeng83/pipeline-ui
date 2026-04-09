var dateTime = new Date().toISOString();
var defaultMsgen = systemEnv.getProperty("esv.defaultmsg.en");
var defaultMsges = systemEnv.getProperty("esv.defaultmsg.es");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "MFAAuthenticationAndRegistration MFAAuthenticationWithRemoveReset",
    script: "Script",
    scriptName: "KYID.Journey.MFAAuthenticationAndRegistration.MFAAuthenticationWithRemoveReset",
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
    REMOVERESET: "Remove/Reset MFA Method"
};

// Function to log errors
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



var messages = {};
var localeMessages;

// Function to get the locale
function getLocale() {
   var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
       if(requestCookies.clocale && requestCookies.clocale!=null){
           var cookieValue = requestCookies.clocale;
           if( cookieValue.localeCompare("en")==0 || cookieValue.localeCompare("es")==0 ) {
                clocale = cookieValue;
            } 
       }
   }
   nodeState.putShared("clocale", clocale);
   return clocale;
}


var MFAContextCode = 3
logger.error("Printing the MFA Context Code ::::::: "  + MFAContextCode)
var newMFAOptions = []
if (MFAContextCode === 3) {
    newMFAOptions = ["Default", "email", "sms", "voice", "swk", "otp", "symantec"]
}

// Function to get user ID from node state
function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID :: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving user ID from node state: " + error.message);
        return null;
    }
}

// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}

// Function to populate node state with MFA methods
function populateMFAOptions(userData) {
    try {
        for (var i = 0; i < userData.custom_MFAMethods.length; i++) {
            var mfaMethodRef = userData.custom_MFAMethods[i]._ref;
            var mfaMethodData = openidm.read(mfaMethodRef);
            nodeState.putShared("mfaMethod" + i, mfaMethodData.MFAMethods);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the MFA Method :: " + nodeState.get("mfaMethod" + i));
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error populating node state with MFA methods: " + error.message);
    }
}

// Function to build the MFA options array with localization
function buildMFAOptionsArray() {
    var mfaOptionsArray = [];
    var clocale = getLocale();

    // Localization dictionary
    messages = {
        en: {
            Default:defaultMsgen,
            email: "Send an email to: ",
            sms: "Send a code to phone: ",
            voice: "Send a code to phone: ",
            code: "Send a code to the Authenticator app",
            Push: "Send a Push Notification to the Authenticator app",
            symantec: "Verify with Symantec VIP",
            verify: "Select",
            removeReset: "Remove/Reset MFA Method"
        },
        es: {
            Default:defaultMsges,
            email: "Envíe un correo electrónico a: ",
            sms: "Envíe un código al teléfono: ",
            voice: "Envíe un código al teléfono: ",
            code: "Envíe un código a la aplicación de autenticación",
            Push: "Envíe una notificación push a la aplicación de autenticación",
            symantec: "Verificar with Symantec VIP",
            verify: "Seleccionar",
            removeReset: "Eliminar/Restablecer método MFA"
        }
    };

    // Define localeMessages in the scope where it's used
    localeMessages = messages[clocale] || messages.en;

    try {
        var userData = fetchUserData(getUserId());
        if (!userData) {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User data not found");
            return mfaOptionsArray;
        }

        for (var i = 0; i < userData.custom_MFAMethods.length; i++) {
            var mfaMethod = nodeState.get("mfaMethod" + i);


            var nodeStateMessage;
            if(mfaMethod === "Default"){
                var defaultMessage = localeMessages[mfaMethod];
                mfaMethod = defaultMessage;
                mfaOptionsArray.push(mfaMethod);
            }
          else if (mfaMethod === "email") {
                logger.error("I am inside the email ...1");
                var userId = nodeState.get("_id");
                var userProfile = openidm.read("managed/alpha_user/" + userId)      
                nodestateEmail = userProfile.mail
                logger.error("I am inside the email ...2"+nodestateEmail);
                var nodeStateEmailArray = []
                nodeStateEmailArray = nodestateEmail.split("@")
                nodeStateMessage = localeMessages.email + nodeStateEmailArray[0][0] + "***" + "@" + nodeStateEmailArray[1];
                //nodeStateMessage = localeMessages.email + nodestateEmail;
                 mfaMethod = nodeStateMessage;
            } else if (mfaMethod === "sms") {
                var userId = getUserId();
                var userProfile = fetchUserData(userId);
                var nodeStateNumber = userProfile.telephoneNumber;
                nodeStateMessage = localeMessages.sms + nodeStateNumber[0] + nodeStateNumber.slice(1, 3) + " XXX-XXX-" + nodeStateNumber.slice(-4);
                mfaMethod = nodeStateMessage;
            } else if (mfaMethod === "voice") {
                skipVoice=true
            } else if (mfaMethod === "otp") {
                mfaMethod = localeMessages.code;
            } 
            else if(mfaMethod === "symantec"){
                
                mfaMethod = localeMessages.symantec;
            }
            else if (mfaMethod === "swk") {
                mfaMethod = localeMessages.Push;
            }
            //mfaOptionsArray.push(mfaMethod);
            /* Added the below check to add*/
            if (!skipVoice) {
            mfaOptionsArray.push(mfaMethod);
             }else{
               skipVoice=false;
             }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error building MFA options array: " + error.message);
    }
    return mfaOptionsArray;
}

// Function to handle callbacks and set the action
function processCallbacks(mfaOptionsArray, clocale) {
    try {
        // Define locale-specific messages
        messages = {
            en: {
                Default:defaultMsgen,
                email: "Send an email to: ",
                sms: "Send a code to phone: ",
                voice: "Send a code to phone: ",
                code: "Send a code to the Authenticator app",
                Push: "Send a Push Notification to the Authenticator app",
                symantec: "Verify with Symantec VIP",
                verify: "Select",
                removeReset: "Remove/Reset MFA Method"
            },
            es: {
                Default:defaultMsges,
                email: "Envíe un correo electrónico a: ",
                sms: "Envíe un código al teléfono: ",
                voice: "Envíe un código al teléfono: ",
                code: "Envíe un código a la aplicación de autenticación",
                Push: "Envíe una notificación Push a la aplicación de autenticación",
                symantec: "Verificar with Symantec VIP",
                verify: "Seleccionar",
                removeReset: "Eliminar/Restablecer método MFA"
            }
        };

        // Get locale-specific messages
        localeMessages = messages[clocale] || messages.en;

        // Set prompt message based on locale
        var promptMessage = clocale === "es" ? "Seleccione entre los siguientes métodos" : "Select from the following methods";

        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing MFA Options Array :: " + mfaOptionsArray);

        if (callbacks.isEmpty()) {
            if(nodeState.get("blankmsg")){
                var error = nodeState.get("blankmsg");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
            }
            callbacksBuilder.choiceCallback(
                promptMessage, 
                mfaOptionsArray, 
                0, 
                false
            );
           // callbacksBuilder.confirmationCallback(0, [localeMessages.verify, localeMessages.removeReset], 0);
            callbacksBuilder.confirmationCallback(0, [localeMessages.verify], 0);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "ChoiceCallback set with promptMessage: " + promptMessage);
        } else {
            var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0];
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the selected choice :: " + selectedIndex);

            // Assuming `selectedOutcome` should be checked (ensure this variable is defined correctly in your context)
            if (selectedOutcome === 0) {
                                nodeState.putShared("anotherFactor" , null)

                for (var i = 0; i < mfaOptionsArray.length; i++) {
                    if (selectedIndex === i) {
                        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the selected MFA method from array ::: " + mfaOptionsArray[i]);
                        var selectedMFAOption = String(mfaOptionsArray[i]);
                        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the type of selectedMFA Option :: " + typeof(selectedMFAOption));
                        if (selectedMFAOption.includes(defaultMsgen) || selectedMFAOption.includes(defaultMsges)) {
                             nodeState.putShared("blankmsg",null);
                            action.goTo(NodeOutcome.DEFAULT);
                    }
                       else if (selectedMFAOption.includes("email") || selectedMFAOption.includes("electrónico")) {
                            nodeState.putShared("blankmsg",null);
                       // logger.error("Inside the select email button")
                        action.goTo(NodeOutcome.EMAIL);
                    } else if (selectedMFAOption.includes("phone") || selectedMFAOption.includes("teléfono")) {
                            nodeState.putShared("blankmsg",null);
                        action.goTo(NodeOutcome.SMS);
                    } else if (selectedMFAOption.includes("voice") || selectedMFAOption.includes("voz")) {
                            nodeState.putShared("blankmsg",null);
                        action.goTo(NodeOutcome.VOICE);
                    } else if (selectedMFAOption.includes("code") || selectedMFAOption.includes("código")) {
                            nodeState.putShared("blankmsg",null);
                        action.goTo(NodeOutcome.FROTP);
                    } else if (selectedMFAOption.includes("Push") || selectedMFAOption.includes("notificación")) {
                            nodeState.putShared("blankmsg",null);
                        action.goTo(NodeOutcome.FRPUSH);
                    }else if(selectedMFAOption.includes("Symantec")){
                            nodeState.putShared("blankmsg",null);
                        action.goTo(NodeOutcome.SYMANTEC);
                    }
                    }
                }
            } else {
                 nodeState.putShared("blankmsg",null);
                action.goTo(NodeOutcome.REMOVERESET);
            }
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error processing callbacks: " + error.message);
         nodeState.putShared("blankmsg",null);
    }
}


function buildMFAOptionsArrayForCommon(){
    var mfaOptionsArray = []
    mfaOptionsArray.push("DEFAULT");
    for(var i=0; i<userData.custom_MFAMethods.length;i++){
        var mfaMethod = nodeState.get("mfaMethod" + i);
        mfaOptionsArray.push(mfaMethod);
    }
    return mfaOptionsArray;
    
}



// // Main execution
try {
    var clocale = getLocale();
    var userId = getUserId();
    if (userId) {
        var userData = fetchUserData(userId);
        if (userData) {
            populateMFAOptions(userData);
            var userMFAMethods = buildMFAOptionsArrayForCommon();
            
            var common = newMFAOptions.filter(value => userMFAMethods.includes(value));
            //common.push("DEFAULT");
            var arrayWithMessages = buildMFAOptionsArray(common)

            processCallbacks(arrayWithMessages, clocale);
        } else {
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User data is null. Cannot proceed with MFA options.");
        }
    } else {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "User ID is null. Cannot proceed with fetching user data.");
    }
} catch (error) {
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
}
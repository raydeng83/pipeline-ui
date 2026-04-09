dateTime = new Date().toISOString();
var defaultMsgen = systemEnv.getProperty("esv.defaultmsg.en");
var defaultMsges = systemEnv.getProperty("esv.defaultmsg.es");
// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "NodeMFA Authentication List",
    script: "Script",
    scriptName: "KYID.2B1.MFAAuthentications.Others",
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
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User ID: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error retrieving user ID from node state: " + error.message);
        return null;
    }
}

// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Fetching user data for ID: " + userId);
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}

											  

function availableMFAOptions(){
    // var setMFAContext = nodeState.get("setMFAContext")
    // var MFAContextCode = setMFAContext.requiredMFAMethodCode;

    // var isJourneySelfOthers = nodeState.get("isJourneySelfOthers");
    // if (isJourneySelfOthers !== null && isJourneySelfOthers !== undefined) {
    // if (isJourneySelfOthers === "true") {
    //     var MFAContextCode = 3
    //     nodeState.putShared("isRegistrationAllowed","true");
    // } }

    //nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + MFAContextCode);
		var MFAContextCode = 3			
    nodeState.putShared("isRegistrationAllowed","true");
    var newMFAOptions = []
    if (MFAContextCode === 3) {
        newMFAOptions = ["DEFAULT", "EMAIL", "SMSVOICE", "FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    
    else if (MFAContextCode === 4) {
        newMFAOptions = ["DEFAULT", "SMSVOICE", "FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    
    else if (MFAContextCode === 5) {
        newMFAOptions = ["DEFAULT", "FRPUSH", "FRTOTP", "SYMANTEC"]
    }
    
    else if (MFAContextCode === 0) {
        setMFAContext.isMFARequired = "false"
    } 
    else{
        newMFAOptions = ["DEFAULT", "FRPUSH", "FRTOTP", "SYMANTEC"]
    }

    return newMFAOptions;
}


 

function populateMFAOptions(userData) {
        var userMFAMethodsArray = [];
    try {
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Populating MFA options");
        for (var i = 0; i < userData.custom_MFAMethods.length; i++) {
            var mfaMethodRef = userData.custom_MFAMethods[i]._ref;
            var mfaMethodData = openidm.read(mfaMethodRef);
            nodeState.putShared("mfaMethod" + i, mfaMethodData.MFAMethods);
            userMFAMethodsArray.push(mfaMethodData.MFAMethods);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "MFA Method: " + nodeState.get("mfaMethod" + i));
        }
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error populating node state with MFA methods: " + error.message);
    }
    return userMFAMethodsArray;
}

// Function to build MFA options array with localization
function buildMFAOptionsArray(common,usrMFAData) {
    var mfaOptionsArray = [];
    var messages = {
        en: {
            DEFAULT: defaultMsgen,
            EMAIL: "Send a code to email: ",
            SMSVOICE: "Send a code to phone: ",
            FRTOTP: "Get code from ForgeRock Authenticator App",															
            FRPUSH: "Get Notification on ForgeRock Authenticator App",
            SYMANTEC: "Verify with a code from Symantec VIP: ",
            verify: "Select",
            removeReset: "Remove/Reset MFA Method"
        },
        es: {
            DEFAULT: defaultMsges,
            EMAIL: "Envíe un correo electrónico con un código de verificación a: ",
            SMSVOICE: "Envíe un código al teléfono: ",												  
            FRTOTP: "Obtener código de la aplicación ForgeRock Authenticator",
            FRPUSH: "Recibir notificación en la aplicación ForgeRock Authenticator",
            SYMANTEC: "Verificar con un código de Symantec VIP : ",
            verify: "Seleccionar",
            removeReset: "Eliminar/Restablecer método MFA"
        }
    };

    var clocale = getLocale(); 
    var localeMessages = messages[clocale] || messages.en;								 

    try {
							  
        var userData = fetchUserData(getUserId());
        for (var i = 0; i < common.length; i++) {																																																																	 
            var mfaMethod = common[i]
          //   if(mfaMethod === "DEFAULT"){
          //       var defaultMessage = localeMessages[mfaMethod];
          //       mfaMethod = defaultMessage;
          //       mfaOptionsArray.push(mfaMethod);
          //   }
          // else
                if (mfaMethod === "EMAIL") {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "inside the email select condition")
                var email = nodeState.get("mail");
                var emailParts = email.split("@");
                var emailMessage = localeMessages[mfaMethod] + emailParts[0][0] + "***" + "@" + emailParts[1];
                mfaMethod = emailMessage;
                mfaOptionsArray.push(mfaMethod);
            } else if (mfaMethod === "SMSVOICE") {
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "inside the sms select condition")
                var phoneNumbers = getUserActiveMFAValue(usrMFAData, "SMSVOICE")
                for (var j = 0; j < phoneNumbers.length; j++) {
                    mfaMethod = "SMSVOICE";
                    var phoneNumber = phoneNumbers[j];
                    var phoneMessage = localeMessages[mfaMethod] + phoneNumber.substring(0, phoneNumber.length-10) + " XXX-XXX-" + phoneNumber.slice(-4)
                    mfaMethod = phoneMessage;
                    mfaOptionsArray.push(mfaMethod+"|"+phoneNumbers[j]);
                }		  
            } else if (mfaMethod === "FRTOTP") {
                mfaMethod = localeMessages[mfaMethod];
                mfaOptionsArray.push(mfaMethod);
            } else if (mfaMethod === "FRPUSH") {
                mfaMethod = localeMessages[mfaMethod];
                mfaOptionsArray.push(mfaMethod);									
            } else if (mfaMethod === "SYMANTEC") {
                var credentialIds = getUserActiveMFAValue(usrMFAData, "SYMANTEC")
                for (var j = 0; j < credentialIds.length; j++) {
                    mfaMethod = "SYMANTEC";
                    var credentialId = credentialIds[j];
                    var symantecMessage = localeMessages[mfaMethod] + credentialId[0] + credentialId.slice(1, 3) + " XXX-XXX-" + credentialId.slice(-3);
                    mfaMethod = symantecMessage;
                    mfaOptionsArray.push(mfaMethod);
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
             //logger.error("Printing on trimming 1:::::::::::::::::")
             //logger.error("Printing on trimming 2::::::::::::::::"+ mfa[i])
            if(mfa[i].includes("|")){
                //logger.error("Printing on trimming 3::::::::::::::::"+ mfa[i].substring(0, mfa[i].indexOf("|")))
                 mfaOptions.push(mfa[i].substring(0, mfa[i].indexOf("|")));
            } else {
                mfaOptions.push(mfa[i])
            }
        }
        nodeLogger.debug("mfaOptions in processCallbacks: "+mfaOptions)
        var clocale = getLocale();
        var localeMessages = {
            en: {
                verify: "Select",
                removeReset: "Remove MFA Method"
            },
            es: {
                verify: "Seleccionar",
                removeReset: "Eliminar método MFA"
            }
        }[clocale] || localeMessages.en;
	    var promptMessage = clocale === "es" ? "Seleccione una de las siguientes opciones" : "Select from the following options";																													  

        if (callbacks.isEmpty()) {
            if(nodeState.get("blankmsg")){
                var error = nodeState.get("blankmsg");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+error+`</div>`);
            }
			callbacksBuilder.textOutputCallback(0,"<div class='page-element'></div>")																		 
            callbacksBuilder.choiceCallback(
               `${promptMessage}`,
                mfaOptions,
                0,
                false
            );
            callbacksBuilder.confirmationCallback(0, [localeMessages.verify], 0);
																				
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "MFA Options: " + mfaOptions);
        } else {
            var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0];
            var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Selected outcome: " + selectedOutcome);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Selected index: " + selectedIndex);

            if (selectedOutcome === 0) {
				nodeState.putShared("anotherFactor" , null)											
                var selectedMFAOption = mfaOptions[selectedIndex];
				
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Printing selected MFA option :: " + selectedMFAOption)

                selectedMFAOption.toString()
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Selected MFA option: " + selectedMFAOption);
                selectedMFAOption = selectedMFAOption.toString()
            //    if (selectedMFAOption.includes(defaultMsgen) || selectedMFAOption.includes(defaultMsges)) {
            //        nodeState.putShared("blankmsg",null);
            //         action.goTo(NodeOutcome.DEFAULT);
            // } 
            // else 
                   if (selectedMFAOption.includes("email") || selectedMFAOption.includes("electrónico")) {
                nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.EMAIL);
                } else if (selectedMFAOption.includes("phone") || selectedMFAOption.includes("teléfono")) {
                    var phoneNumber =  mfa[selectedIndex].split("|")
                    nodeState.putShared("smsvoice", phoneNumber[1]);
                nodeState.putShared("blankmsg",null);
                    action.goTo(NodeOutcome.SMS);
                } else if (selectedMFAOption.includes("Get code from ForgeRock Authenticator App") || selectedMFAOption.includes("Obtener código de la aplicación ForgeRock Authenticator")) {											
                nodeState.putShared("blankmsg",null);    
                action.goTo(NodeOutcome.FROTP);
                } else if (selectedMFAOption.includes("Notification") || selectedMFAOption.includes("notificación")) {
                nodeState.putShared("blankmsg",null);    
                action.goTo(NodeOutcome.FRPUSH);
                } else if (selectedMFAOption.includes("Symantec")) {
                nodeState.putShared("blankmsg",null);   
                action.goTo(NodeOutcome.SYMANTEC);
                }
            } else {
                //action.goTo(NodeOutcome.REMOVERESET);
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Else condition");
            }
        }
	 
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +"Error processing callbacks: " + error.message);
       nodeState.putShared("blankmsg",null);
        action.goTo("false");
    }
}

function main() {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try {
        var clocale = getLocale();
        var userId = getUserId();
        if (userId) {
            var userData = fetchUserData(userId);
            nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "User Data: " + userData);
            if (userData) {
                var usrMFAData = getMFAObject(userData.userName);
                var userMFAMethods = getUserMFAMethods(usrMFAData);
                var newMFAOptions = availableMFAOptions();
                var common = newMFAOptions.filter(value => userMFAMethods.includes(value));
                //common.push("DEFAULT");
                nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Printing the common  ::::: " + common)
                var arrayWithMessages = buildMFAOptionsArray(common,usrMFAData)
                
                if (arrayWithMessages) {
                    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + " Going to the true condition inside is registered for any method ")
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
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
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




// Main Execution
// Logger Function
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "NodeMFA Authentication List for MFARecovery",
    script: "Script",
    scriptName: "TBD.KYID.2B1.Journey.MFALoginAuthn.Select.RDIP.Email",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

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

try {
if (callbacks.isEmpty()) {
    var userId = getUserId();
    logger.debug("Received userId in main block: " + userId);
    if (userId) {
        logger.debug("Calling fetchUserData for userId: " + userId);
        var userData = fetchUserData(userId);
        logger.debug("fetched userData")
        if (userData) {
            logger.debug("line10")
            //var usrMFAData = getMFAObject(userData.userName);
            var usrMFAData = nodeState.get("usrMFAData") ? JSON.parse(nodeState.get("usrMFAData")) : [];
            logger.debug("usrMFAData : " + JSON.stringify(usrMFAData));

            if (usrMFAData && usrMFAData.result && usrMFAData.result.length > 0) {
                //var userMFAMethods = getUserMFAMethods(usrMFAData);
                var userMFAMethods = nodeState.get("userMFAMethods") ? JSON.parse(nodeState.get("userMFAMethods")) : [];
                logger.debug("userMFAMethods : " + JSON.stringify(userMFAMethods));
                requestCallbacks(); 
            } else {
                nodeLogger.debug("No MFA methods found or KOG ID not present");
                action.goTo("error");
            }
        } else {
            nodeLogger.debug("User data not found");
            action.goTo("error");
        }
    } else {
        nodeLogger.debug("User ID not found");
        action.goTo("error");
    }
} else {
        handleUserResponses();
    }

} catch (error) {
    logger.error("Unexpected error in main execution: " + error.message);
    action.goTo("error");
}


function requestCallbacks() {
    logger.debug("inside requestCallbacks");
    try {
        var options =null;
        var lib = require("KYID.Library.FAQPages");
        // var process ="RegisterMFA";
        // var pageHeader= "1_add_methods";
        var process ="ManageMFA";
       var pageHeader= "select_IDVerification_OR_Email";
        var getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
        nodeState.putShared("process", "RegisterMFA")
        nodeState.putShared("pageHeader", "1_add_methods")
        logger.debug("getFaqTopicId : "+getFaqTopicId);
        
        var jsonobj = {"pageHeader": "select_IDVerification_OR_Email"};
        logger.debug("jsonobj : "+jsonobj);
        callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonobj));

        if(nodeState.get("alternatemail") !== null){
            // options = ["PlatformIdentityVerification", "SendVerificationCodeToPrimaryAlternateEmail", "ContactHelpdesk"];
            //options = ["PlatformIdentityVerification", "SendVerificationCodeToPrimaryAlternateEmail"];
            if(nodeState.get("showRIDP") && nodeState.get("showRIDP") == true){
                options = ["SendVerificationCodeToPrimaryAlternateEmail", "PlatformIdentityVerification" ];
            }else{
                options = ["SendVerificationCodeToPrimaryAlternateEmail"];
            }
            
        } else {
           // options = ["PlatformIdentityVerification", "ContactHelpdesk"];
            if(nodeState.get("showRIDP") && nodeState.get("showRIDP") == true){
                options = ["PlatformIdentityVerification"];
            }
        }
        

       
        var promptMessage = ".";
        callbacksBuilder.choiceCallback(`${promptMessage}`, options, 0, false);
        callbacksBuilder.confirmationCallback(0, ["Next", "cancel"], 0);
       
        if (getFaqTopicId != null) {
        
        callbacksBuilder.textOutputCallback(0,""+getFaqTopicId+"")
        }
    
        

    } catch (error) {
        nodeLogger.error("KYID.2B1.Journey.MFALoginAuthn.Select.RDIP.Email --> Error Occurred in requestCallbacks ");
    }

}

function handleUserResponses() {
    try {
        var choiceOutcome = null;
        // nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "" + "Verified Phone Number is " + nodeState.get("verifiedTelephoneNumber") + nodeState.get("phoneVerified"))
        var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
        choiceOutcome = callbacks.getChoiceCallbacks().get(0)[0];
        logger.debug("selectedOutcome is =="+ selectedOutcome);
        //if((isTOTPRegistered == true && isSyamtecRegistered == true && isPUSHRegistered == true && isPhoneRegistered == true ) || nodeState.get("error") === "showed"){
         nodeState.putShared("journeyName","MFARecovery")

        if((nodeState.get("alternatemail") !== null)){
            if(selectedOutcome === 0){
           
                if(choiceOutcome ===1){
                   //nodeState.putShared("journeyName","RIDP_LoginMain")
                     nodeState.putShared("journeyName","MFARecovery")
                   nodeState.putShared("journeyIs","RIDP_LoginMain")
                   nodeState.putShared("isMFARecovery","true")
                   nodeState.putShared("backfromridploginsecurity",null)
                   nodeState.putShared("flowName",null)
                   nodeState.putShared("flowName","mfarecovery")
                   action.goTo("RIDP")
                }else if(choiceOutcome ===0){
                    nodeState.putShared("primary_secondary_email",true);
                    nodeState.putShared("journeyName","RIDP_LoginMain")
                     //nodeState.putShared("journeyName","MFARecovery")
                    nodeState.putShared("backfromridploginsecurity",null)
                    action.goTo("PrimaryAlternateEmail")
                }
            /*    else if(choiceOutcome ===2){
                nodeState.putShared("backfromridploginsecurity",null)
                action.goTo("helpdeskContact")      
                }
                */
            }
            else{ 
            nodeState.putShared("backfromridploginsecurity",null)
            action.goTo("Cancel")
              }    
          }
         else{
            if(selectedOutcome === 0){
           
            if(choiceOutcome ===0){
               nodeState.putShared("journeyName","RIDP_LoginMain")
               nodeState.putShared("journeyIs","RIDP_LoginMain")
                nodeState.putShared("backfromridploginsecurity",null)
                 nodeState.putShared("isMFARecovery","true")
               action.goTo("RIDP")
            }
           /* else if(choiceOutcome ===1){
                nodeState.putShared("backfromridploginsecurity",null)
            action.goTo("helpdeskContact")  
            }
            */
         }
        else{
            nodeState.putShared("backfromridploginsecurity",null)
            action.goTo("Cancel")
           }
       }
        
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + "error occurred in handleUserResponses function ::" + error);
        action.goTo("error");

    }

}


function getUserMFAMethods(usrMFAData) {
    var mfaOptionsArray = []
    nodeState.putShared("alternatemail", null);
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            nodeLogger.debug("Printing the mfaMethodResponse ::::::::::::: " + mfaMethodResponse)
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                mfaOptionsArray.push(mfaMethodResponse["MFAMethod"]);
                var mfaMethod = usrMFAData.result[i].MFAMethod;
                if (mfaMethod === "EMAIL") {
                    var mfaValue = usrMFAData.result[i].MFAValue;
                    nodeState.putShared("collectedPrimaryEmail", mfaValue);
                }

                if (mfaMethod === "SECONDARY_EMAIL") {
                    var mfaValue = usrMFAData.result[i].MFAValue;
                    nodeState.putShared("alternatemail", mfaValue);
                }

            }
        }
    }
    return mfaOptionsArray;
}

function getUserId() {
    try {
         if(nodeState.get("helpdeskjourney") === "true" && requestParameters.get("_id")){
            var userId = requestParameters.get("_id")[0]
            logger.debug("the userID from nodeState: "+userId)
         } else {
                var userId = nodeState.get("_id");
                logger.debug("the _id from nodeState: "+userId)
        }
           
        
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
        logger.debug("Calling openidm.read for: managed/alpha_user/" + userId);
        nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Fetching user data for ID: " + userId);
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
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
    nodeState.putShared("alternatemail", null);
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            nodeLogger.debug("Printing the mfaMethodResponse ::::::::::::: " + mfaMethodResponse)
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                mfaOptionsArray.push(mfaMethodResponse["MFAMethod"]);
                var mfaMethod = usrMFAData.result[i].MFAMethod;
                if (mfaMethod === "EMAIL") {
                    var mfaValue = usrMFAData.result[i].MFAValue;
                    nodeState.putShared("collectedPrimaryEmail", mfaValue);
                }

                if (mfaMethod === "SECONDARY_EMAIL") {
                    var mfaValue = usrMFAData.result[i].MFAValue;
                    nodeState.putShared("alternatemail", mfaValue);
                }

            }
        }
    }
    return mfaOptionsArray;
}



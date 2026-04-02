/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "validate Invited Request",
    script: "Script",
    scriptName: "KYID.2B1.RegistrationAcceptance.ValidateInvitedLink",
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
    }
};


try {
    logger.debug("Invoking KYID.2B1.RegistrationAccptance.ValidateInvitedLink  Script");
var requestId = requestParameters.get("requestId")
logger.debug("Request ID is:: "+ requestId)
if(requestId != null){
    logger.debug("requestId value: "+requestId[0]);
    requestId = requestId[0];
    var validateRequest = validateRequest(requestId)
    logger.debug("validateRequest is :: "+validateRequest )
    if(validateRequest === "UserInvitedOrAppCreated"){
        logger.debug("Request is Valid")
        action.goTo("UserInvitedOrAppCreated")
    }
    else if (validateRequest === "active"){
        logger.debug("Request is Valid")
        action.goTo("active")
    }
    else if(validateRequest == false){
        logger.debug("Request is Expired")
        deleteUser();
        action.goTo("expiredRequest")
    }
    else{
        logger.debug("Request not Found")
        action.goTo("notFound")
                 
    }
}
else{
    logger.debug("Else Request not Found")
    action.goTo("notFound")
}
    
} catch (error) {
    logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::" + error)
    
}

 

function validateRequest(requestId){
    try{
        nodeState.putShared("journeyName","Registration_Acceptance");
        // var contextdetails = openidm.query("managed/Kyid_alpha_context_details/", { "_queryFilter": '/contextId eq "'+contextid+'"'}, ["contextId","locale","whoisthisfor","whadoyouneed","howmuctime","additionalhelp","imageId","applicationName"]);
        var validateRequest = openidm.query("managed/alpha_kyid_applicationrequest/", { "_queryFilter": '/_id eq "'+requestId+'"'}, [""]);
        logger.debug("validateRequest : "+validateRequest);
        logger.debug("validateRequest Result Length : "+validateRequest.result.length);
        if(validateRequest.result.length > 0){
            var requestTime = validateRequest.result[0].requestTime;
            logger.debug("requestTime Is " + requestTime);
            var expiryTime = validateRequest.result[0].expiryTime;  
            logger.debug("expiryTime Is " + expiryTime);
            var userKogId = validateRequest.result[0].kogID; 
            var roleId = validateRequest.result[0].roleId;
            var isNameEditable = validateRequest.result[0].isNameEditable;
            var isEmailEditable = validateRequest.result[0].isEmailEditable;
            var isPhoneEditable = validateRequest.result[0].isPhoneEditable;
            var roleId = validateRequest.result[0].roleId;
            nodeState.putShared("roleId",roleId);
            nodeState.putShared("userKogId",userKogId);
            nodeState.putShared("isNameEditable",isNameEditable);
            nodeState.putShared("isEmailEditable",isEmailEditable);
            nodeState.putShared("isPhoneEditable",isPhoneEditable);
            var checkRequestExpiryy = checkRequestExpiry (requestTime, expiryTime)
            if (checkRequestExpiryy == false){
                var validateUserResponse = validateUser(userKogId)
                if (validateUserResponse == true){
                    return ("UserInvitedOrAppCreated");
                }
                else if (validateUserResponse == false){
                    return ("active");
                }
                else{
                     return ("ErrorOccured");
                }
               
            }
            else{
                return false;
            }
             
        }else{ 
            return ("No Request Found");
        }     
    }catch(error){
        logger.error("Exception : "+error);
        return error;
    }
}

function checkRequestExpiry (requestTime, ExpiryTime) {
    var ExpiryTimeinMillisec =  1000 * 60 * 60 * 1000;
    var requestExpiredTime = parseInt(requestTime) + ExpiryTimeinMillisec;
    var currentTime = Date.now();
    if(currentTime > requestExpiredTime){
        logger.debug("Inside This Request ")
        return true;
    }
    else{
        return false;
    }
    
    
}

function validateUser(userKogId) {
    try {
        var response = openidm.query("managed/alpha_user/", { "_queryFilter": '/userName eq "'+userKogId+'"'}, [""]);
        logger.debug("User Response is :: " + response)
        if(response.result.length > 0){
            nodeState.putShared("userExist","true");
            var givenName = response.result[0].givenName;
            var lastName = response.result[0].sn;
            var primaryEmail = response.result[0].mail;
            var telephoneNumber = response.result[0].telephoneNumber;
            var userId = response.result[0]._id;
            var userStatus = response.result[0].accountStatus.toLowerCase();
            nodeState.putShared("givenName",givenName);
            nodeState.putShared("lastName",lastName);
            nodeState.putShared("primaryEmail",primaryEmail);
            nodeState.putShared("telephoneNumber",telephoneNumber);
            nodeState.putShared("userId",userId);
            nodeState.putShared("accountStatus",userStatus);
            logger.debug("userStatus is :: " + userStatus)
            if(userStatus === "invited" || (userStatus === "appcreated")){
                return (true)
            }
            else if (userStatus ==="active") {
                return(false)
            }
            else{
                return("Error Occured")
            }
        }
        
    } catch (error) {
        
        
    }
    
}

function deleteUser() {
    try {
        var userKogId = null;
    var userId =null;
    if( nodeState.get("userKogId")!= null){
        userKogId= nodeState.get("userKogId")
    }
    var response = validateUser(userKogId);
    if(response !="Error Occured"){
        if( nodeState.get("userId")!= null){
        userId= nodeState.get("userId");
        var userDeleteRespose = openidm.delete('managed/alpha_user/'+ userId, null);
        logger.debug("userDeleteRespose is"+ userDeleteRespose);
    }       

}
 return true;    
    } catch (error) {
        logger.error("error is"+ error);
        
    }
    
}


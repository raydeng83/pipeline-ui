// Node outcomes
var nodeOutcome = {
    SUCCESS: "true",
    //ERROR: "false"
};

var jsonObj = {};
var createUserSuccess = false;

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
//nodeState.putShared("Mfavalue","telephoneNumber")
var Secondary_Email=nodeState.get("Secondary_Email");
var email=nodeState.get("email")
var sms=nodeState.get("sms")
var voice=nodeState.get("voice")
 var usrKOGID = nodeState.get("usrKOGID");
var MFA_Additional=nodeState.get("MFA_Additional");
var MFAMethodEmail=nodeState.get("MFAMethodEmail")
logger.error("****************email*********"+email);
var usrMfaValue=nodeState.get("MFAMethod")
logger.error("************MFA_Additional************"+MFA_Additional)
logger.error("************usrMfaValue************"+usrMfaValue)
//logger.error("************MFA_Additional************"+MFA_Additional)


if(usrMfaValue=="sms"){
    if(MFA_Additional=="add_email")
    {
         createMFAObject(usrKOGID, "SMS",sms, "ACTIVE");
         createMFAObject(usrKOGID, "SECONDARY_MAIL",Secondary_Email, "ACTIVE");
         logger.error("**************sms_email********************")

    }
    else{
         createMFAObject(usrKOGID, "SMS",sms, "ACTIVE");
        logger.error("**************sms********************")
            
        }}
else if(usrMfaValue=="voice" ){
    if(MFA_Additional=="add_email")
{
        createMFAObject(usrKOGID, "PHONE_VOICE",voice, "ACTIVE");
         createMFAObject(usrKOGID, "SECONDARY_MAIL",email, "ACTIVE");
        logger.error("**************voice_email********************")



}
    else{
            createMFAObject(usrKOGID, "PHONE_VOICE",voice, "ACTIVE");
         }

}
else if(usrMfaValue=="voice"){
                     createMFAObject(usrKOGID, "PHONE_VOICE",voice, "ACTIVE");
                    logger.error("**************voice********************")


    }
    else if(usrMfaValue=="sms"){
         createMFAObject(usrKOGID, "SMS",sms, "ACTIVE");
            logger.error("**************sms********************")


    }
else{
             createMFAObject(usrKOGID, "SECONDARY_MAIL",Secondary_Email, "ACTIVE");
        logger.error("**************mail********************")


}
       
  // var Secondary_Email  =   nodeState.get("Secondary_Email")
    //var mail=nodeState.get("mail");

 //  var phone =     nodeState.get("phone")

//if(Secondary_Email===mail){
    //action.goTo("false");
    
//}else{

  //  try {
    
           // if (Secondary_Email != null && typeof Secondary_Email != "undefined") {
            //    logger.error("In Side If Line 59")
           //    if (!lookupInMFAObject(usrKOGID, Secondary_Email)) {
            //        logger.error("Creating MFA Email factor");
                   // createMFAObject(usrKOGID, "SECONDARY_EMAIL", Secondary_Email, "ACTIVE");
              //  }
           // }               

        //}

     /*catch (error) {
        logger.error(error);
        action.goTo(nodeOutcome.ERROR);
    }*/

    action.goTo(nodeOutcome.SUCCESS);
//}



function createMFAObject(usrKOGID, method, usrMfaValue, status) {
    //logger.error("MFA Method is being registered for " + usrKOGID + " and the method is "+method+" and value is "+usrMfaValue);
    var mfajsonObj = {};
    mfajsonObj['KOGId'] = usrKOGID;
    mfajsonObj['MFAMethod'] = method;
    mfajsonObj['MFAValue'] = usrMfaValue;
    mfajsonObj['MFAStatus'] = status;
    nodeLogger.error("Line 85 Create MFA Object" + JSON.stringify(mfajsonObj));
    openidm.create("managed/alpha_kyid_mfa_methods", null, mfajsonObj);
}


function lookupInMFAObject(usrKOGID, usrMfaValue) {
    //logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter": '/KOGId eq "' + usrKOGID + '"' });
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
            if (mfaMethodResponse["MFAValue"].localeCompare(usrMfaValue) === 0 &&
                mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") === 0) {
                return true;
            }
        }
    }
    return false;
}




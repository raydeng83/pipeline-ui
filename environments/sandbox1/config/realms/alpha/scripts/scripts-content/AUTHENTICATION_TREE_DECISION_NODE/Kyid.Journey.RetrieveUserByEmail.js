/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.error("*****************************retrieve****************************")
var KOGIDlist=nodeState.get("usrKOGID");
function lookupInMFAObject(KOGIDlist) {
    //logger.error("MFA Method is being looked up for " + usrKOGID + " and value is "+usrMfaValue);
    var userEmails=[];
    for(var j=0;j<KOGIDlist.length;j++){
        var KOGID=KOGIDlist[j];
        logger.error("***********************Looking up MFA Method for KOGID***************"+ KOGID);
    }
    var mfaMethodResponses = openidm.query("managed/alpha_user", { "_queryFilter": '/KOGId eq "' + KOGID + '"' });
    if (mfaMethodResponses.result.length > 0) {
        for (i = 0; i < mfaMethodResponses.result.length; i++) {
            var mfaMethodResponse = mfaMethodResponses.result[i];
           {
               if(mfaMethodResponse.hasOwnProperty("mail")){
                   userEmails.push(mfaMethodResponse["mail"]);
               }
            }
        }
    }
    logger.error("******************Retrieved User emails:********************"+JSON.stringify(userEmails))
    return userEmails;
};
var userEmails=lookupInMFAObject(KOGIDlist);
callbacksBuilder.textOutputCallback(0, userEmails);
nodeState.putShared("userEmails",userEmails);
action.goTo("true")

var NodeOutcome = {
    SUCCESS: "NoAuthNeeded",
    AUTHENTICATE: "Authenticate"
};


var setMFAContext = nodeState.get("setMFAContext")
var MFAContextCode = setMFAContext.requiredMFAMethodCode;
 logger.error("Printing mfa context in KYID.Journey.CheckifReAuthenticationNeeded" +MFAContextCode);
var recoveryauthmethod = nodeState.get("recoveryauthmethod")
if (recoveryauthmethod) {
 if (MFAContextCode === 3 && (recoveryauthmethod === "mail" || recoveryauthmethod === "phone" )) {
     logger.error("KYID.Journey.CheckifReAuthenticationNeeded going for no auth for email" )
    action.goTo(NodeOutcome.SUCCESS);
 } else if (MFAContextCode === 4 && recoveryauthmethod === "phone" ) {
     logger.error("KYID.Journey.CheckifReAuthenticationNeeded going for no auth for phone" )
    action.goTo(NodeOutcome.SUCCESS);
 } else {
     logger.error("KYID.Journey.CheckifReAuthenticationNeeded going for re auth" )
    action.goTo(NodeOutcome.AUTHENTICATE);
 }
}
else 
{
logger.error("KYID.Journey.CheckifReAuthenticationNeeded going for reauthentication" )
action.goTo(NodeOutcome.AUTHENTICATE); 
}

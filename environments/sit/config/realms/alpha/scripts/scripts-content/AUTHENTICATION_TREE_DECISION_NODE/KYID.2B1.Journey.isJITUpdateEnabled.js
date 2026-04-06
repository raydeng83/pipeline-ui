var isJitRequired = systemEnv.getProperty("esv.isjitrequiredflag"); 
var KYIDProfileSetupCompleted = "false";
if (nodeState.get("isKYIDProfileSetupCompleted") !== null && nodeState.get("isKYIDProfileSetupCompleted") !== undefined) {
    logger.debug("isKYIDProfileSetupCompleted in KYID.2B1.Journey.isJITUpdateEnabled::"+nodeState.get("isKYIDProfileSetupCompleted"))
    KYIDProfileSetupCompleted = nodeState.get("isKYIDProfileSetupCompleted");
    logger.debug("isExtUserFirstTimeUser in KYID.2B1.Journey.isJITUpdateEnabled::"+KYIDProfileSetupCompleted)
}

var isJITDone = "false";
if (nodeState.get("isJITDone") !== null && nodeState.get("isJITDone") !== undefined) {
    logger.debug("isJITDone in KYID.2B1.Journey.isJITUpdateEnabled::"+nodeState.get("isJITDone"))
    isJITDone = nodeState.get("isJITDone");
    logger.debug("isJITDone in KYID.2B1.Journey.isJITUpdateEnabled::"+isJITDone)
}

//Fetch the user's id and keep in nodestate, when JIT is not required
var id = null;
if (nodeState.get("_id")) {
    logger.debug("IDValueinJIT:" + nodeState.get("_id"))
    id = nodeState.get("_id");
}

//userType
var userType = null;
if(nodeState.get("userType")){
    logger.debug("the usertype in KYID.2B1.Journey.isJITUpdateEnabled::"+nodeState.get("userType"))
   userType=nodeState.get("userType")  
}
if (isJitRequired === "true" || isJitRequired === true) {

    if (KYIDProfileSetupCompleted === "true" || KYIDProfileSetupCompleted === true) {
	    logger.debug("JIT ESV is ON, user not a first time user,check JIT is done already");
		if (isJITDone === "true" || isJITDone === true){
		logger.debug("JIT ESV is ON, user not a first time user,JIT has been done already for the user. Hence skip JIT this time.");
        nodeState.putShared("isJitRequired", "false");
        if (id) {
        nodeState.putShared("usrcreatedId", id);
         }
        action.goTo("false");
		} else {
		logger.debug("JIT ESV is ON, user not a first time user,JIT has never been done on the user profile. Hence do JIT.");
		nodeState.putShared("isJitRequired", "true");
        action.goTo("true");
		}
        
    } else if(userType=="Internal" && (isJITDone === "true" || isJITDone === true)){
    logger.debug("JIT ESV is ON, internal user not a first time user,JIT has been done already for the user. Hence skip JIT this time.");
        nodeState.putShared("isJitRequired", "false");
        if (id) {
        nodeState.putShared("usrcreatedId", id);
         }
        action.goTo("false")
}
    
    else {
        logger.debug("JIT ESV is ON and user is first-time external user,JIT needed");
        nodeState.putShared("isJitRequired", "true");
        action.goTo("true");
    }

} else {
    logger.error("JIT is not required as per esv");
    nodeState.putShared("isJitRequired", "false");
    if (id) {
        nodeState.putShared("usrcreatedId", id);
    }
    action.goTo("false");
}
if(nodeState.get("firsttimemfacompleted") === "firsttimemfacompleted"){
    logger.debug("User First Time MFA has been completed. Skip MFA Verification again")
    action.goTo("noMFAtrigger")
} else {
    logger.debug("First Time MFA trigger")
    action.goTo("MFAtrigger")
}

if(nodeState.get("MFAMethod") === "MOBILE"){
    logger.debug("skipMobile")
    action.goTo("skipMobile")
}
else {
    logger.debug("Mobile")
    action.goTo("Mobile")
}
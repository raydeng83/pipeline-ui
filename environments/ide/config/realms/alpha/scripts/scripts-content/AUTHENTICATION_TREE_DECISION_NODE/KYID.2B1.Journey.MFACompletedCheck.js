if(nodeState.get("backfrommfadisplay") === "backfrommfadisplay"){
    logger.debug("User clicked on back First Time MFA")
    nodeState.putShared("backfrommfadisplay",null) 
    action.goTo("back")
} else {
    nodeState.putShared("firsttimemfacompleted","firsttimemfacompleted") 
    logger.debug("First Time MFA has been performed successfully")
    nodeState.putShared("backfrommfadisplay",null) 
    action.goTo("next")
}
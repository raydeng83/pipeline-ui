try {
    //var guid = nodeState.get("userGuid");
    var guid=requestParameters.get("_id")[0]
    logger.error("_id: " + guid);
    
    if (guid) {
        var originalId = nodeState.get("_id")
        if(guid !== originalId) {
            logger.error("guid does not match nodeState");
            action.goTo("false");
        } else {
            action.goTo("true");
        }
    } else {
        logger.error("no guid");
        action.goTo("false");
    }
} catch (error) {
    logger.error("catching error");
    action.goTo("false");
}
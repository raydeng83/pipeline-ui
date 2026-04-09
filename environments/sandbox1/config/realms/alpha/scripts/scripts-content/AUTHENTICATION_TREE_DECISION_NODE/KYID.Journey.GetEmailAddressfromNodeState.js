try { 
    var attribs = nodeState.get("EmailAddress");  
    logger.error("print attribs: " + attribs);

    var objectAttr = nodeState.get("objectAttributes");
    //logger.error("printing the object attr: " + JSON.stringify(objectAttr));
    nodeState.putShared("mail", attribs);
    nodeState.putShared("objectAttributes", {"mail": attribs}); 
    logger.error("reading mail from fetchedEmail " + attribs);
    action.goTo("true");

} catch (e) {    
    logger.error("Error getting userInfo: " + e); 
}
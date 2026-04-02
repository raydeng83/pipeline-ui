if(nodeState.get("PUSHQRNode") == "skip"){
    logger.debug("inside skip")
    action.goTo("skip")
}
else{
     nodeState.putShared("PUSHQRNode",null);
    logger.debug("inside else")
     action.goTo("true")
}

if(nodeState.get("userIdentityPresent") === "true"){
    //user has identity linked
    action.goTo("hasIdentityLinked");
} else {
    //user has no identity linked
    action.goTo("noIdentityLinked");
}
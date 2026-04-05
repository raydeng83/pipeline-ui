try{
    var spEntityIDArray = nodeState.get("spEntityID");
    if(spEntityIDArray) {
        var lastAppId = nodeState.get("spEntityID").get(0).toString();
        if (lastAppId) {
            action.goTo("True").putSessionProperty("lastAppId", lastAppId);
        }
    }
    action.goTo("True")
} catch(e) {
    action.goTo("False");
}
var id = null;
var jsonArray = [];
if (nodeState.get("_id")) {
    logger.debug("IDValueinJIT:" + nodeState.get("_id"))
    id = nodeState.get("_id");
} else if(nodeState.get("usrcreatedId")) {
    logger.debug("IDValueinJIT:" + nodeState.get("usrcreatedId"))
    id = nodeState.get("usrcreatedId");
}

var jsonObj = {
    operation: "replace",
    field: "custom_isJITDone",
    value: true
};
jsonArray.push(jsonObj);

try {
    openidm.patch("managed/alpha_user/" + id, null, jsonArray);
    logger.error("Update of isJITDone is done");
    action.goTo("true");
} catch (e) {
    logger.error("error while updating isJITDone" + e);
    action.goTo("true");
}
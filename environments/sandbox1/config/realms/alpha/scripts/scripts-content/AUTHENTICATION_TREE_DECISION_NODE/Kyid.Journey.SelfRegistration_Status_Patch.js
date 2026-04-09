/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//var accountstatus=nodeState.get("accountStatus");
    // callbacksBuilder.textOutputCallback(1, accountstatus);
// var attributes=nodeState.get("objectAttributes");
// nodeState.putShared("objectAttributes", {"accountStatus": "active"});
 var id= nodeState.get("_id");
// nodeState.keys().toArray().forEach(function(key){
//     var value = nodeState.get(key);
//     callbacksBuilder.stringAttributeInputCallback(key, "nodestate".concat(key),value,false);
// });
// callbacksBuilder.textOutputCallback(1, id);
//openidm.patch("managed/user/" + id, null, [{"operation":"add", "field":"/password", "value":password}]);
openidm.patch("managed/alpha_user/" + id, null, [{"operation":"replace", "field":"accountStatus", "value":"active"}]);


// var attribute = "accountStatus";
// attributes[attribute]="active";
// nodeState.putShared("objectAttributes",attributes);
// var obj=nodeState.get("objectAttributes");
action.goTo("true");
// idRepository.setAttribute(username, attribute, "ACTIVE")
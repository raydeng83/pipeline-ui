/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
                    // nodeState.putShared("invalidJSONError",null);
                    // nodeState.putShared("invalidRoleError",null);

var libError = require("KYID.2B1.Library.Loggers");
var errMsg = {};
errMsg["code"] = "ERR-DAS-INP-000";
errMsg["message"] = libError.readErrorMessage("ERR-DAS-INP-000"); 

if(nodeState.get("invalidJSONError")!= null){
    nodeState.putShared("invalidJSONError",JSON.stringify(errMsg));
    action.goTo("true");
}
else if (nodeState.get("invalidRoleError")!= null){
    nodeState.putShared("invalidRoleError",JSON.stringify(errMsg));
    action.goTo("true");
}
else if(nodeState.get("gobackfromremoverole")){
    var gobackfromremoverolevalue = nodeState.get("gobackfromremoverole")
    if(gobackfromremoverolevalue === "gobackfromremoverole"){
        nodeState.putShared("roleremovalstatus",null)
        nodeState.putShared("invalidRoleError",null)
         nodeState.putShared("invalidJSONError",null)
        nodeState.putShared("unexpectederror",null)
        action.goTo("true");
    }
} else if (nodeState.get("unexpectederror")){
    //var unexpectederror = nodeState.get("unexpectederror")
        action.goTo("unexpectederror");
} else if (nodeState.get("internaluser") || nodeState.get("rolenotremovable") ){
action.goTo("true");
}

else {
    logger.debug("going back to myapps or applibrary screen after removal role")
    action.goTo("false");
}

// if(nodeState.get("gobackfromremoverole")){
//     var gobackfromremoverolevalue = nodeState.get("gobackfromremoverole")
//     if(gobackfromremoverolevalue === "gobackfromremoverole"){
//         outcome = "true";
//     }
// } else {
//     outcome = "false";
// }



var backretrylimit = nodeState.get("backretrylimit");
var phonemaxlimit = nodeState.get("phonemaxlimit");
 if(phonemaxlimit === "true"){
            action.goTo("true");
        }
else if (nodeState.get("Journey_Phone_Verification") === "back") {
    logger.debug("inside Journey_Phone_Verification");

    if (backretrylimit === "true") {
        logger.debug("inside backretrylimit " + backretrylimit);
        action.goTo("true");
    }
    else {
        nodeState.putShared("Journey_Phone_Verification", null);
        logger.debug("inside Journey_Phone_Verification2");
        action.goTo("back");
    }

} else if (nodeState.get("Journey_Phone_Verification") === "skip") {
    nodeState.putShared("Journey_Phone_Verification", null);
    action.goTo("skip");

} else if (nodeState.get("skipPhone") === "true") {
    action.goTo("skip");

} else {
    action.goTo("next");
}

// var backretrylimit = nodeState.get("backretrylimit");
// if(nodeState.get("Journey_Phone_Verification") ==="back"){
//     if(backretrylimit === "true"){
//     action.goTo("true")
// } else {
//     nodeState.putShared("Journey_Phone_Verification",null);
//     action.goTo("back")
// }
    
// }
// else if(nodeState.get("Journey_Phone_Verification") ==="skip"){
//     nodeState.putShared("Journey_Phone_Verification",null);
//     action.goTo("skip")
// }
// else if(nodeState.get("skipPhone") ==="true"){
//     action.goTo("skip")
// }
// // else if(nodeState.get("backretrylimit") === "true"){
// //     action.goto("true")
// // }
// else {
//     action.goTo("next")
// }

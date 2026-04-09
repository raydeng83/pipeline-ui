/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
// logger.error("****Starting*****");
// var userId=nodeState.get("_id");
// logger.error("***userId***"+userId);
// // var user= idRepository.getIdentity(userId);
// // var username= user.getAttributeValues("username");

// //nodeState.putShared("userName",username)
// //logger.error("****userName*****"+username);
// var userQueryResult = openidm.read("managed/alpha_user/" + userId);
// logger.error("userQueryResult from query"+userQueryResult)
// //logger.error("userQueryResult from query"+userQueryResult.result.length)
// //if (userQueryResult && userQueryResult.result && userQueryResult.result.length > 0) 
// if (userQueryResult){
//     var mail = userQueryResult.result[0].mail
//     var KOGID = userQueryResult.result[0].userName
//     logger.error("mail from shared"+mail)
//     logger.error("KOGID from shared"+KOGID)
//     nodeState.putShared("mail",mail)
//     nodeState.putShared("KOGID",KOGID)
// }
// //outcome = "true";

// action.goTo("true").putSessionProperty('KOGID',KOGID).putSessionProperty('mail',mail);


logger.error("****Starting*****");
var userId = nodeState.get("_id");
logger.error("***userId***" + userId);

var userQueryResult = openidm.read("managed/alpha_user/" + userId);
logger.error("userQueryResult from query: " + JSON.stringify(userQueryResult));

if (userQueryResult && userQueryResult.mail && userQueryResult.userName) {
    var mail = userQueryResult.mail;
    var KOGID = userQueryResult.userName;

    logger.error("mail from shared: " + mail);
    logger.error("KOGID from shared: " + KOGID);

    nodeState.putShared("mail", mail);
    nodeState.putShared("KOGID", KOGID);

    // Ensure session properties are set before redirect
    action.goTo("true").putSessionProperty('KOGID',KOGID).putSessionProperty('mail',mail);
} else {
    logger.error("No user data found or missing mail/userName for userId: " + userId);
    //action.goTo("false"); // Optionally handle the case where the user data is missing
}
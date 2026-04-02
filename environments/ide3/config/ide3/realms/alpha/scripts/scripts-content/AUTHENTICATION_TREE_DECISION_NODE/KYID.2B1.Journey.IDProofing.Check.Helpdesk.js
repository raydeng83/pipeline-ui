/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
if(nodeState.get("ishelpdesk")==="true"){
    if(nodeState.get("journeyName") ==="updateprofile"){
      //  auditLog("VER008", "Remote Identity Verification Success");
        action.goTo("Helpdesk_Manage")
    }
    /*else if(nodeState.get("journeyContext") ==="ridp"){
         action.goTo("ridpHepldesk") 
        //auditLog("VER008", "Remote Identity Verification Success");
    }*/
    else{
       //  auditLog("VER008", "Remote Identity Verification Success");
        action.goTo("Helpdesk")
    }
    
}else{
    action.goTo("NotHelpdesk") 
}


// function auditLog(code, message){
//     try{
//          var auditLib = require("KYID.2B1.Library.AuditLogger")
//                 var headerName = "X-Real-IP";
//                 var headerValues = requestHeaders.get(headerName); 
//                 var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
//                 var helpdeskUserId = null;
//                 var eventDetails = {};
//                 var userId = null;
//                 eventDetails["IP"] = ipAdress;
//                 eventDetails["Browser"] = nodeState.get("browser") || "";
//                 eventDetails["OS"] = nodeState.get("os") || "";
//                 eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
//                 eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
//                 var sessionDetails = {}
//                 var sessionDetail = null
//                 if(nodeState.get("sessionRefId")){
//                     sessionDetail = nodeState.get("sessionRefId") 
//                     sessionDetails["sessionRefId"] = sessionDetail
//                 }else if(typeof existingSession != 'undefined'){
//                     sessionDetail = existingSession.get("sessionRefId")
//                     sessionDetails["sessionRefId"] = sessionDetail
//                 }else{
//                      sessionDetails = {"sessionRefId": ""}
//                 }
//                 var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
//                 var userEmail = nodeState.get("mail") || "";
//                      if(typeof existingSession != 'undefined'){
//                  helpdeskUserId = existingSession.get("UserId")
//                 }
//                 if (userEmail){
//                     var userQueryResult = openidm.query("managed/alpha_user", {
//                       _queryFilter: 'mail eq "' + userEmail + '"'
//                        }, ["_id"]);
//                      userId = userQueryResult.result[0]._id;
//                 }
//                 auditLib.auditLogger(code, sessionDetails, message, eventDetails, helpdeskUserId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
//     }catch(error){
//         logger.error("Failed to log RIDP Verification status"+ error)
//         action.goTo("Helpdesk")
//     }
    
// }
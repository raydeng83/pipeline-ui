var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Patch in Ping",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Patch.ManageProfile",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SUCCESS: "true",
    FAILED: "false"
  };

var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
  };



  try {
    var userId = nodeState.get("_id");
    if (!userId) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::User ID is null or undefined.");
        nodeState.putShared("unableToVerify","true")
        action.goTo(NodeOutcome.FAILED);
    }

    var userIdentity = nodeState.get("userIdentity");
    logger.debug("userIdentity is :: "+ userIdentity)
    if (!userIdentity) {
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::userIdentity is null or undefined.");
        nodeState.putShared("unableToVerify","true")
        action.goTo(NodeOutcome.FAILED);
    }
    // var attributes = [
    //     "custom_title", "givenName", "custom_middleName", "sn", "custom_suffix", "custom_gender", "custom_dateofBirth","postalAddress", "custom_postalAddress2","city", "stateProvince", "postalCode", "country", "county", "telephoneNumber"
    // ];
    //nodeState.putShared("orig_proofingMethod","2");
    //nodeState.putShared("proofingMethod","1");
    nodeState.putShared("lastVerificationDate",dateTime);  

    var identity_attributes = ["suffix", "givenName", "middleName", "sn", "gender", "dob", "addressLine1", "addressLine2", "city", "stateCode", "zip", "countryCode", "countyCode", "lastVerificationDate"];
    var identity_attributes2 = ["custom_suffix", "givenName", "custom_middleName", "sn", "custom_gender", "custom_dateofBirth", "postalAddress", "custom_postalAddress2", "city", "stateProvince", "postalCode", "country", "custom_county","lastVerificationDate"];

    var attributes = ["custom_title","custom_zipExtension", "givenName", "custom_middleName", "sn"];

    var patchArray = [];
    var identity_patchArray = [];

    for (var i = 0; i < attributes.length; i++) {
        var key = attributes[i];
        var newValue = nodeState.get(key);
        //var oldValue = nodeState.get("orig_" + key); 

        // Normalize null/undefined to empty string
        newValue = newValue || "";
        //oldValue = oldValue || "";
        
        //logger.debug("oldValue in alpha_user:: "+ oldValue)
        logger.debug("oldValue in alpha_user::  "+ newValue)

       // if (newValue !== oldValue) {
            patchArray.push({
                operation: "replace",
                field: key,
                value: newValue
            });
        //}
    }

    for (var i = 0; i < identity_attributes.length; i++) {
        var key = identity_attributes[i];
        var key2 = identity_attributes2[i];
        var newValue = nodeState.get(key2);
        //var oldValue = nodeState.get("orig_" + key); 

        logger.debug("newValue:: "+ newValue)
        //logger.debug("oldValue:: "+ oldValue)

        // Normalize null/undefined to empty string
        newValue = newValue || "";
       // oldValue = oldValue || "";

        //if (newValue !== oldValue) {
            identity_patchArray.push({
                operation: "replace",
                field: key,
                value: newValue
            });
        //}
    }

      // var newLangPref = nodeState.get("languagePreference") || "";
      // var oldLangPref = nodeState.get("orig_languagePreference") || "";
    // if(nodeState.get("orig_organPreference")){
    //     var organdonor = "true"
    // } else {
    //     var organdonor = "false"
    // }
    // if (newLangPref !== oldLangPref) {
    //     patchArray.push({
    //         operation: "replace",
    //         field: "/preferences",
    //         value: {
    //             "organdonor": organdonor,
    //             "language": newLangPref
    //         }
    //     });
    // }


    if (patchArray.length > 0) {
        var result = openidm.patch("managed/alpha_user/" + userId, null, patchArray);
        logger.debug("Result in KYID.2B1.Journey.Patch.ManageProfile.Helpdeskis :: "+ JSON.stringify(result))
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + ":: Patched Attributes in alpha_user: " + JSON.stringify(patchArray));
        auditLog("PRO003", "Personal Information Updated");
    } else {
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + ":: No attribute changes detected, skipping patch.");
    }

    logger.debug("identity_patchArray is :: "+ JSON.stringify(identity_patchArray))
    //logger.debug("identity_patchArray is :: "+ userIdentity)
    if (identity_patchArray.length > 0) {
        //var result = openidm.patch("managed/alpha_kyid_user_identity/" + userIdentity, null, identity_patchArray);
        var response = openidm.patch("managed/alpha_kyid_user_identity/" + userIdentity, null, identity_patchArray);
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + ":: Patched Attributes in user_identity: " + JSON.stringify(response));
    } else {
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + ":: No attribute changes detected, skipping patch.");
    }
    nodeState.putShared("unableToVerify","false")
    action.goTo(NodeOutcome.SUCCESS);

} catch (error) {
    nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Error in patch execution: " + error.message);
    auditLog("PRO004", "Personal Information update Failure");
      nodeState.putShared("unableToVerify","true")
    action.goTo(NodeOutcome.FAILED);
}


function auditLog(code, message){
    try{
        var helpdeskUserId = null;
         var auditLib = require("KYID.2B1.Library.AuditLogger")
                var headerName = "X-Real-IP";
                var headerValues = requestHeaders.get(headerName); 
                var ipAdress = String(headerValues.toArray()[0].split(",")[0]); 
                
                var eventDetails = {};
                eventDetails["IP"] = ipAdress;
                eventDetails["Browser"] = nodeState.get("browser") || "";
                eventDetails["OS"] = nodeState.get("os") || "";
                eventDetails["applicationName"] = nodeState.get("appName") || nodeState.get("appname") || systemEnv.getProperty("esv.kyid.portal.name");
                eventDetails["applicationLogo"] = nodeState.get("appLogo") || ""
                var sessionDetails = {}
                var sessionDetail = null
                if(nodeState.get("sessionRefId")){
                    sessionDetail = nodeState.get("sessionRefId") 
                    sessionDetails["sessionRefId"] = sessionDetail
                }else if(typeof existingSession != 'undefined'){
                    sessionDetail = existingSession.get("sessionRefId")
                    sessionDetails["sessionRefId"] = sessionDetail
                }else{
                     sessionDetails = {"sessionRefId": ""}
                }
                var transactionId = requestHeaders.get("X-ForgeRock-TransactionId")[0];
                var userEmail = nodeState.get("mail") || "";
                if(typeof existingSession != 'undefined'){
                 helpdeskUserId = existingSession.get("UserId")
                }
                if(nodeState.get("_id")){
                    userId = nodeState.get("_id")
                }
                auditLib.auditLogger(code, sessionDetails, message, eventDetails, helpdeskUserId || userId, userId, transactionId, userEmail , eventDetails.applicationName, sessionDetails.sessionRefId, requestHeaders)
    }catch(error){
        logger.error("Failed to log update Personal info updated "+ error)
         action.goTo(NodeOutcome.SUCCESS);
    }
    
}

// var dateTime = new Date().toISOString();

// // Node Config
// var nodeConfig = {
//     begin: "Begining Node Execution",
//     node: "Node",
//     nodeName: "Patch NewEmail in UserProfile",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.Patch.ManageProfile",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     SUCCESS: "true",
//     FAILED: "false"
//   };

// var nodeLogger = {
//     // Logs detailed debug messages for troubleshooting  
//     debug: function (message) {
//         logger.debug(message);
//     },
//     // Logs Error that can impact Application functionality
//     error: function (message) {
//         logger.error(message);
//     }
//   };



//   try {
//     var userId = nodeState.get("_id");
//     if (!userId) {
//         nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::User ID is null or undefined.");
//         action.goTo(NodeOutcome.FAILED);
//     }

//     // var attributes = [
//     //     "custom_title", "givenName", "custom_middleName", "sn", "custom_suffix", "custom_gender", "custom_dateofBirth","postalAddress", "custom_postalAddress2","city", "stateProvince", "postalCode", "country", "county", "telephoneNumber"
//     // ];

//       var attributes = [
//         "custom_title", "givenName", "custom_middleName", "sn", "custom_suffix", "custom_gender", "custom_dateofBirth", "frUnindexedString3", "postalAddress", "custom_postalAddress2","city", "stateProvince", "postalCode", "country", "custom_county"
//     ];
      
// //"custom_dateOfBirth"
//     var patchArray = [];

//     for (var i = 0; i < attributes.length; i++) {
//         var key = attributes[i];
//         var newValue = nodeState.get(key);
//         var oldValue = nodeState.get("orig_" + key); 

//         // Normalize null/undefined to empty string
//         newValue = newValue || "";
//         oldValue = oldValue || "";

//         if (newValue !== oldValue) {
//             patchArray.push({
//                 operation: "replace",
//                 field: key,
//                 value: newValue
//             });
//         }
//     }

//       // var newLangPref = nodeState.get("languagePreference") || "";
//       // var oldLangPref = nodeState.get("orig_languagePreference") || "";
// if(nodeState.get("orig_organPreference")){
//     var organdonor = "true"
// } else {
//     var organdonor = "false"
// }
// // if (newLangPref !== oldLangPref) {
// //     patchArray.push({
// //         operation: "replace",
// //         field: "/preferences",
// //         value: {
// //             "organdonor": organdonor,
// //             "language": newLangPref
// //         }
// //     });
// // }


//     if (patchArray.length > 0) {
//         var result = openidm.patch("managed/alpha_user/" + userId, null, patchArray);
//         nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Patched Attributes: " + JSON.stringify(patchArray));
//     } else {
//         nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: No attribute changes detected, skipping patch.");
//     }

//     action.goTo(NodeOutcome.SUCCESS);

// } catch (error) {
//     nodeLogger.error("AUDIT::" + nodeConfig.timestamp + ":: Error in patch execution: " + error.message);
//     action.goTo(NodeOutcome.FAILED);
// }
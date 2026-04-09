var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get MFARequired by App",
    script: "Script",
    scriptName: "KYID.2B1.Journey.GetMFARequiredbyApp",
    timestamp: dateTime,
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
    SUCCESS: "success",
    FAILED: "failed"
 };

  /**
      * Logging function
      * @type {Function}
  */
  var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
        debug: function (message) {
        logger.debug(message);
},
    // Logs Error that can impact Application functionality
        error: function (message) {
        logger.error(message);
},
       info: function (message) {
        logger.info(message);
}
};

var spEntityID = null;
var requiredMFAMethod = null;

function getApplicationMetadata() {
    try {
        if(nodeState.get("MFACodeForClaims")){
            var mfaCode = nodeState.get("MFACodeForClaims")
            //var mfaCode = "5"
        }
        else {
            nodeState.putShared("MFACodeForClaims","0")
            var mfaCode = "0"
        }
      //  var mfaCode = nodeState.get("MFACodeForClaims")
        logger.debug("Required MFA Method code fetched for application: " + mfaCode);

        var mfaCodeToName = {
            5: "AUTHENTICATOR",
            4: "MOBILE",
            3: "EMAIL",
            0: "EMAIL"
        };

        var appRequiredMFAMethodName = mfaCodeToName[mfaCode];

        if (appRequiredMFAMethodName) {
            nodeState.putShared("appRequiredMFAMethod", appRequiredMFAMethodName);
            logger.debug("App Required MFA Method (name): " + appRequiredMFAMethodName);
        } else {
            logger.debug("Unknown requiredMFAMethod code: " + mfaCode);
        }

        return mfaCode;
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
            nodeConfig.script + "::" + nodeConfig.scriptName + ":: Query failed: " + error);
          return null;
    }
}

function main() {
    try {
       var requiredMFAMethod =  getApplicationMetadata();

        if (requiredMFAMethod) {
            nodeState.putShared("requiredMFAMethod", requiredMFAMethod);
            action.goTo(nodeOutcome.SUCCESS);
        } else {
            logger.debug("Required MFA Method is null or undefined.");
            action.goTo(nodeOutcome.FAILED);
        }

    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
            nodeConfig.script + "::" + nodeConfig.scriptName + ":: Unhandled error: " + error);
        action.goTo(nodeOutcome.FAILED);
    }
}

// Start execution
main();

// // Function to query requiredMFAMethod based on spEntityID
// function getApplicationMetadata() {
//     try {
//             requiredMFAMethod = nodeState.get("MFACodeForClaims")
//             logger.debug("Required MFA Method code fetched for application " + requiredMFAMethod);

//             // Map numeric MFA method to readable name
//             var mfaCodeToName = {
//                 5: "AUTHENTICATOR",
//                 4: "MOBILE",
//                 3: "EMAIL",
//                 0: "EMAIL"
//             };

//             var appRequiredMFAMethodName = mfaCodeToName[requiredMFAMethod];

//             if (appRequiredMFAMethodName) {
//                 nodeState.putShared("appRequiredMFAMethod", appRequiredMFAMethodName);
//                 logger.debug("App Required MFA Method (name): " + appRequiredMFAMethodName);
//             } else {
//                 logger.debug("Unknown requiredMFAMethod code: " + requiredMFAMethod);
//             }

//     } catch (error) {
//         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: Query failed: " + error);
//     }
// }
// // Main function
// function main() {
//     try { 
//         //getAppNamefromRequestParam();
//         //spEntityID will the application url and will be fetched from goto url
//        //  var spEntityID = nodeState.get("spEntityID");
//        // logger.debug("Extracted spEntityID from nodeState: " + spEntityID);
//        //  if (spEntityID) {
//        //      var queryFilter = 'applicationURL eq "' + spEntityID + '"';

//        //      var appIDQuery = openidm.query("managed/alpha_kyid_businessapplication", {
//        //      "_queryFilter": queryFilter
//        //  }, []);

//        //  var appIDQueryResult = appIDQuery.result[0]._id

//        //      //Keeping in nodestate as authz flow will take the user to requestAccess page
//        //      nodeState.putShared("appIDinWidget",appIDQueryResult)
            
//             getApplicationMetadata();
//             var requiredMFAMethod = nodeState.get("MFACodeForClaims")
//             if (requiredMFAMethod) {
//                 nodeState.putShared("requiredMFAMethod", requiredMFAMethod);
//                 action.goTo(nodeOutcome.SUCCESS);
//             } 
//             // else {
//             //     logger.debug("Required MFA Method is null for application: " + spEntityID);
//             //     action.goTo(nodeOutcome.FAILED);
//             // }
//        // } 
//     // else {
//     //         logger.debug("spEntityID is null or undefined");
//     //         action.goTo(nodeOutcome.FAILED);
//     //     }

//     } catch (error) {
//         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + ":: Unhandled error: " + error);
//         action.goTo(nodeOutcome.SESSION_NOTEXIST);
//     }
// }

// // Invoke Main Function
// main();

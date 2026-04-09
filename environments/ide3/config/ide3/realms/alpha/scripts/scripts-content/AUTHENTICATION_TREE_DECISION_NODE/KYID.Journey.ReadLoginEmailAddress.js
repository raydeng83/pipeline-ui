/**
 * Script: KYID.Journey.ReadLoginEmailAddress
 * Description:  This script is used to display Login Email to the user and store mail of IDM user in the sharedState.             
 * Date: 26th July 2024
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
   var nodeConfig = {
     begin: "Begining Node Execution",
     node: "Node",
     nodeName: "Get Email Address",
     script: "Script",
     scriptName: "KYID.Journey.ReadLoginEmailAddress",
     timestamp: dateTime,
     end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
    ERROR: "False"
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
    }
};

//added to cater the email or upn entered by the user

function fetchEmailFromUserStore(email) {
    try {
        // Query using 'mail'
        var userQueryResultemail = openidm.query("managed/alpha_user", {
            "_queryFilter": 'mail eq "' + mail + '"'
        }, ["mail"]);

        nodeLogger.error("userQueryResultemail: " + JSON.stringify(userQueryResultemail));

        if (userQueryResultemail.result && userQueryResultemail.result.length > 0) {
            var emailFromMail = userQueryResultemail.result[0].mail;
            var userid = userQueryResultemail.result[0]._id;
            nodeLogger.error("Email found via 'mail' query: " + emailFromMail);
            nodeLogger.error("ID found via 'mail' query: " + userid);
            return emailFromMail;
        } else {
            // Query using 'frIndexedString1' if 'mail' query fails
            var userQueryResultupn = openidm.query("managed/alpha_user", {
                "_queryFilter": 'frIndexedString1 eq "' + mail + '"'
            }, ["mail"]);

            nodeLogger.error("userQueryResultupn: " + JSON.stringify(userQueryResultupn));

            if (userQueryResultupn.result && userQueryResultupn.result.length > 0) {
                var emailViaUPN = userQueryResultupn.result[0].mail;
                 var userid = userQueryResultupn.result[0]._id;
                nodeLogger.error("Email found via 'frIndexedString1' query: " + emailViaUPN);
                return emailViaUPN;
            } else {
                nodeLogger.error("No email found via either query.");
                return null;
            }
        }
    } catch (error) {
        nodeLogger.error("Error in fetchEmailFromUserStore: " + error);
        return null;
    }
}

try{
    if( nodeState.get("objectAttributes") &&  nodeState.get("objectAttributes")!=null){
       if( nodeState.get("objectAttributes").get("mail") &&  nodeState.get("objectAttributes").get("mail") !=null){ 
         var mail = nodeState.get("objectAttributes").get("mail").trim();
         nodeState.putShared("userInputmail", mail);
           
            if(mail !=null){ 
                 var pattern = /^[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/i;
                 var testMail = pattern.test(mail);
                 if (!testMail) {
                        //callbacksBuilder.textOutputCallback(0, <div class='error-message'>Invalid email format: ${testMail}</div>);
                        // nodeState.putShared("invalidEmailerror", "Invalid email format:");
                        action.goTo(nodeOutcome.ERROR);
                  } else {
                     var fetchedEmail = fetchEmailFromUserStore(mail);
                     if (fetchedEmail) {
                   var useridQueryResultemail = openidm.query("managed/alpha_user", {
                    "_queryFilter": 'mail eq "' + fetchedEmail + '"'
                   }, ["_id"]);
                    if (useridQueryResultemail.result && useridQueryResultemail.result.length > 0) {
                   var result = openidm.patch("managed/alpha_user/" + useridQueryResultemail.result[0]._id, null, [{"operation": "add","field": "frIndexedString5","value": mail }]);
                    } else {
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::Could not patch the user input email or upn::"+mail);
                    }
                    nodeState.putShared("mail", fetchedEmail);
                    nodeState.putShared("objectAttributes", {"userName": fetchedEmail}); 
                    nodeState.putShared("objectAttributes", {"mail": fetchedEmail}); 
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+mail);  
                    action.goTo(nodeOutcome.SUCCESS).putSessionProperty("emailaddress",fetchedEmail);  
                     } else {
                     nodeState.putShared("mail", mail);
                     nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+mail);  
                     action.goTo(nodeOutcome.SUCCESS).putSessionProperty("emailaddress",mail);   
                     }
                                   
                  }
               } else {
                    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeState.get("objectAttributes").get("mail"));
                    action.goTo(nodeOutcome.ERROR);
              }

           // nodeState.putShared("mail", mail);
           // nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+mail);  
           // action.goTo(nodeOutcome.SUCCESS).putSessionProperty("emailaddress",mail);
           
       } else {
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeState.get("objectAttributes").get("mail"));
        action.goTo(nodeOutcome.ERROR);
       }
    } else {
        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeState.get("objectAttributes")); 
         action.goTo(nodeOutcome.ERROR);
    } 
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
}



    /**
    * Function: KYID.Connector.Check
    * Description: This script is used to check Connector Status.
    * Param(s):
    * Input:
    *                              
    * Returns: 

    * Date: 17th Feb 2024
    * Author: Deloitte
    */


    var dateTime = new Date().toISOString();

    // Node Config
    var scriptConfig = {
        begin: "Begining Script Execution",
        script: "Script",
        scriptName: "KYID.Connector.Check",
        timestamp: dateTime,
        exceptionErrMsg: "Error calculating redirect time: ",
        end: "Script Execution Completed"
    };


    //Logging Function
    var scriptLogger = {
        // Logs detailed debug messages for troubleshooting  
        debug: function(message) {
            logger.debug(message);
        },
        // Logs Error that can impact Application functionality
        error: function(message) {
            logger.error(message);
        }
    };

    var env = identityServer.getProperty("esv.environment.name");
    var checkDisabled = identityServer.getProperty("esv.adconnector.checkdisabled");
    var emailString = identityServer.getProperty("esv.adconnector.notifyemails");
    var fromEmail = identityServer.getProperty("esv.smtp.from.address");
    var externalRcsEmailSubject = identityServer.getProperty("esv.external.rcs.alert.email.subject");
    var internalRcsEmailSubject = identityServer.getProperty("esv.internal.rcs.alert.email.subject");
    var connectorEmailSubject = identityServer.getProperty("esv.connector.alert.email.subject");

    if (checkDisabled == null) {
        checkDisabled = false;
    }

    if (emailString == null) {
        var emailList = ["xli5@deloitte.com", "kasshah@deloitte.com", "mzahran@deloitte.com"];
    } else {
        var emailList = JSON.parse(emailString);
    }

    var connectorName = "";
    var invalidConnectorNames = [];
    var disabledConnectorNames = [];
    var brokenInternalRcsServersNames = [];
    var brokenExternalRcsServersNames = [];
    var fullCheckEnvs = ["UAT", "PROD"];
    var rcsServerstoCheck = ["rcs-cluster-internal", "rcs-cluster-external", "rcs-connector-internal-1", "rcs-connector-external-1"]

    function checkConnectorStatus() {

        var connectorStatus = openidm.action("system", "test", null);

        return connectorStatus;
    }

    function checkRcsServerStatus() {

        var rcsServerStatus = openidm.action("system", "testConnectorServers", null);
        return rcsServerStatus.openicf;
    }

    function sendMail(emailList, emailSubject, emailBody) {


        if (emailList && emailSubject && emailBody) {

            for (var i = 0; i < emailList.length; i++) {

                scriptLogger.error(scriptConfig.timestamp + "::" + scriptConfig.script + "::" + scriptConfig.scriptName + "::mail Check::" + emailList[i]);

                var userEmail = emailList[i];

                if (userEmail) {

                    emailParams = {
                        "from": fromEmail,
                        "to": userEmail,
                        "subject": emailSubject,
                        "type": "text/plain",
                        "body": emailBody
                    };

                    openidm.action('external/email', 'send', emailParams);
                }

            }
        } else {

            scriptLogger.error(scriptConfig.timestamp + "::" + scriptConfig.script + "::" + scriptConfig.scriptName + ":: mail element missing");

        }
    }

    function main() {
        scriptLogger.error(scriptConfig.timestamp + "::" + scriptConfig.script + "::" + scriptConfig.scriptName + "::" + scriptConfig.begin);

        try {

            var connectorStatus = checkConnectorStatus();
            var rcsServerStatus = checkRcsServerStatus();

            if (connectorStatus) {
                for (var i = 0; i < connectorStatus.length; i++) {

                    if (checkDisabled) {
                        if (connectorStatus[i].enabled != true && connectorStatus[i].connectorRef.bundleName.includes("ldap")) {
                            disabledConnectorNames.push(connectorStatus[i].name);
                        }
                    }

                    if (connectorStatus[i].enabled == true && connectorStatus[i].ok != true && connectorStatus[i].connectorRef.bundleName.includes("ldap")) {
                        invalidConnectorNames.push(connectorStatus[i].name);
                    }
                }
            }


            if (rcsServerStatus) {

                var serverstoCheck = fullCheckEnvs.includes(env) ? rcsServerStatus.map(item => item.name) : rcsServerstoCheck;
                scriptLogger.error(scriptConfig.timestamp + "::" + scriptConfig.script + "::" + scriptConfig.scriptName + ":: serverstoCheck:: " + serverstoCheck);

                for (var key of rcsServerStatus) {
                    if (serverstoCheck.includes(key.name) && key.ok != true) {
                        if (key.name.includes("internal")) {

                            brokenInternalRcsServersNames.push(key.name);
                        } else if (key.name.includes("external")) {

                            brokenExternalRcsServersNames.push(key.name);
                        }

                    }
                }

            }

            var connectorEmailBody = "Following Connectors in " + env + " are either down or disabled:\n";
            var internalRcsEmailBody = "Following Internal RCS servers in " + env + " are either down or unstable:\n";
            var externalRcsEmailBody = "Following External RCS servers in " + env + " are either down or unstable:\n";

            if (invalidConnectorNames.length > 0 || disabledConnectorNames.length > 0) {

                if (invalidConnectorNames.length > 0) {
                    connectorEmailBody = connectorEmailBody + "Broken Connectors: " + invalidConnectorNames.join(", ") + ".\n";
                }

                if (disabledConnectorNames.length > 0) {
                    connectorEmailBody = connectorEmailBody + "Disabled Connectors: " + disabledConnectorNames.join(", ") + ".\n";
                }

                sendMail(emailList, connectorEmailSubject, connectorEmailBody)
            }


            if (brokenInternalRcsServersNames.length > 0) {

                internalRcsEmailBody += brokenInternalRcsServersNames.join(", ") + ".\n";
                sendMail(emailList, internalRcsEmailSubject, internalRcsEmailBody);
            }

            if (brokenExternalRcsServersNames.length > 0) {

                externalRcsEmailBody += brokenExternalRcsServersNames.join(", ") + ".\n";
                sendMail(emailList, externalRcsEmailSubject, externalRcsEmailBody)
            }




            scriptLogger.error(scriptConfig.timestamp + "::" + scriptConfig.script + "::" + scriptConfig.scriptName + "::" + scriptConfig.end);

        } catch (error) {

            scriptLogger.error(scriptConfig.timestamp + "::" + scriptConfig.script + "::" + scriptConfig.scriptName + "::" + scriptConfig.exceptionErrMsg + ":: " + error);
        }

    }

    main();
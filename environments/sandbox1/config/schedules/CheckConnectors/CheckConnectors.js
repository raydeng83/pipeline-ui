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


if(typeof checkDisabled == 'undefined'){
    var checkDisabled = false;
}

if(typeof emailGroup == 'undefined'){
    var emailGroup = "";
}

var connectorName = "";
var invalidConnectorNames = [];
var disabledConnectorNames = [];

function checkConnectorStatus(){

    var connectorStatus = openidm.action("system", "test", null);

    return connectorStatus;
}

function main(){
    nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);

    try {

        var connectorStatus = checkConnectorStatus();

        if(connectorStatus){
            for(var i=0; i < connectorStatus.length; i++){

                if(checkDisabled){
                    if(connectorStatus[i].enabled != true){
                        disabledConnectorNames.push(connectorStatus.name);
                    }
                }

                if(connectorStatus[i].enabled == true && connectorStatus[i].ok != true){
                    invalidConnectorNames.push(connectorStatus.name);
                }
            }
        }


        if(invalidConnectorNames.length > 0 || disabledConnectorNames.length > 0){

            var emailBody = "Following Connectors in " + env + " are invalid or disabled need to report:\n";
            
            if(invalidConnectorNames.length > 0){
                emailBody += "Broken Connectors: " + invalidConnectorNames.join(", ") + "\n";
            }

            if(disabledConnectorNames.length > 0){
                emailBody += "Disabled Connectors: " + disabledConnectorNames.join(", ") + "\n";
            }
        }

        if(emailGroup){
            var emailParams = new Object();
            var emailGroupRoleId = openidm.query("managed/alpha_role/", {"_query_Filter": "name eq '" + emailGroup + "'"}, ["id"] );

            var groupMembers = openidm.query("managed/role/" + emailGroupRoleId.result[0]._id + "/members", {
                "_queryFilter": "true"}, ["_refResourceId"]
            );

            for (var i = 0; i < groupMembers.length; i++){

                var userEmail = openidm.query("managed/user/", {
                    "_queryFilter": "/_id eq '" + groupMembers.result[i]._refResourceId + "'"}, ["mail"]
                );
                if(userEmail.result[0].mail){
                    emailParams = {
                        "from": "monitor@deloitte.com",
                        "to": userEmail.result[0].mail,
                        "subject": "Connector Alert",
                        "type": "text/plain",
                        "body": emailBody
                    };

                    openidm.action('external/mail', 'send', emailParams);
                }

            }
        }

        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
    
    } catch (error) {
        
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.exceptionErrMsg + ":: " + error);
    }

}

main();

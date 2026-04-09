/**
 * Script: KYID.2B1.Prerequisites.Email
 * Description: This script is used to send success or failure email to user when requested application role is successfully provisioned or failed to provisioned. 
 * Author: Deloitte
 */

// Compute current system timestamp

var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    nodeName: "Send Access Grant Success Email",
    idmEndpoint: "external/email",
    idmAction: "sendTemplate",
    templateIDForSuccess: "kyidprerequisitesuccess",
    templateIDForFailure: "kyidprerequisitefailure",
    begin: "Beginning Node Execution",
    node: "Node",
    script: "Script",
    scriptName: "KYID.2B1.Prerequisites.Email",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var NodeOutcome = {
    PASS: "Mail_Send_Success",
    FAIL: "Mail_Send_Failed"
};

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
}

/* This function is used to send email to the user
Input : mail <string>
        givenName <string>
        sn <string>
        application <string>
        status <string> 
Output: status */

function sendMail(mail, givenName, sn, roleId, application, status) {
    try {
        var params = new Object();
        if (status === "success") {
            params.templateName = nodeConfig.templateIDForSuccess;

        } else if (status === "failure") {
            params.templateName = nodeConfig.templateIDForFailure;
        }

        params.to = mail;
        params.object = {
            "givenName": givenName,
            "sn": sn,
            "application" : application,
            "role" : roleId,
            "timestamp":dateTime
        };
        openidm.action(nodeConfig.idmEndpoint, nodeConfig.idmAction, params);
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script 
                        + "::" + nodeConfig.scriptName + "::" + "Email Notification sent successfully to " + "::" + mail);
        action.goTo(NodeOutcome.PASS);
    }
    catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script 
                         + "::" + nodeConfig.scriptName + " ::" + "Error occurred while sending email notification. Error - " + "::" + error);
        action.goTo(NodeOutcome.FAIL);
    }
}


// main execution
function main(){

    //Function Name
    nodeConfig.functionName = "main()";

    //Local Variables
    var status = null;
    var givenName = null;
    var sn = null;
    var mail = null;
    var roleId = null;
    var application = " KYID application";
    
    if(nodeState.get("sendAccessGrant")!=null && nodeState.get("sendAccessGrant")){
        status = nodeState.get("sendAccessGrant");
    }
    if(nodeState.get("sendAccessGrantAttr_MAIL")!=null && nodeState.get("sendAccessGrantAttr_MAIL")){
        mail = nodeState.get("sendAccessGrantAttr_MAIL");
    }
    if(nodeState.get("sendAccessGrantAttr_SN")!=null && nodeState.get("sendAccessGrantAttr_SN")){
        sn = nodeState.get("sendAccessGrantAttr_SN");
    }
    if(nodeState.get("sendAccessGrantAttr_GIVENNAME")!=null && nodeState.get("sendAccessGrantAttr_GIVENNAME")){
        givenName = nodeState.get("sendAccessGrantAttr_GIVENNAME");
    }
    if(nodeState.get("sendAccessGrantAttr_rolename")!=null && nodeState.get("sendAccessGrantAttr_rolename")){
        roleId = nodeState.get("sendAccessGrantAttr_rolename");
    }
    
    sendMail(mail, givenName, sn, roleId, application, status);
}    



//Invoke Main Function
main();


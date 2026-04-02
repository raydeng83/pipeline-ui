/**
 * Script: 
 * Description:               
 * Date: 26th July 2024
 * Author: Deloitte
 **/

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
     begin: "Begining Node Execution",
     node: "Node",
     nodeName: "Store idpauthtype param",
     script: "Script",
     scriptName: "KYID.Journey.SetIdpAuthType",
     timestamp: dateTime,
     end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    SUCCESS: "True",
};

nodeState.putShared("idpauthtype","pwd");
nodeState.putShared("idpauthtime",dateTime);
nodeState.putShared("AuthenticationInstant",dateTime);



action.goTo(nodeOutcome.SUCCESS).putSessionProperty('idpauthtype', "pwd").putSessionProperty('AuthenticationInstant', dateTime).putSessionProperty('idpauthtime', dateTime);
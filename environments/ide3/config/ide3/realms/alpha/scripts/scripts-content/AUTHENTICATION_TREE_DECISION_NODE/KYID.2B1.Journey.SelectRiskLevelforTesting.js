var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "NodeMFA Authentication List",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MFA.RiskLevelSelection",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    CONTINUE: "continue",
    SKIP: "skip",
    FAILED: "failed"
};

// Logger
var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); }
};

function processCallbacks() {
    // dropdown options
    var riskLevelOptions = ["HIGH", "MEDIUM", "LOW"];
    var promptMessage = "select_pingoneprotect_risk_level";

    if (callbacks.isEmpty()) {
        var jsonobj = {"pageHeader": "Select Risk Level"};
        callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));

        callbacksBuilder.choiceCallback(promptMessage, riskLevelOptions, 0, false);

        callbacksBuilder.confirmationCallback(0, ["Next", "Back", "Skip"],   0);
    } else {
        var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0]; // index of HIGH/LOW/MEDIUM/SKIP
        var confirmationChoice = callbacks.getConfirmationCallbacks().get(0); // always 0 when only "Next"

        if (selectedIndex === null || selectedIndex === undefined || selectedIndex < 0 || selectedIndex > 2) {
            nodeLogger.error("Invalid selection index for risk level ChoiceCallback: " + selectedIndex);
            action.goTo(NodeOutcome.FAILED);
            return;
        }
        if (confirmationChoice === 0) {
            var selectedValue = ["HIGH", "MEDIUM", "LOW"][selectedIndex];
            // Store selection for downstream nodes
            nodeState.putShared("riskLevel", selectedValue);
            logger.error("User selected risk level and clicked Next: " + selectedValue);
            action.goTo(NodeOutcome.CONTINUE);
            return;
        } else if (confirmationChoice === 1) { 
            logger.error("User selected risk level and clicked Back: ");
            action.goTo(NodeOutcome.FAILED);
            return;
        } else if (confirmationChoice === 2) {
            logger.error("User selected risk level and clicked Skip: ");
            action.goTo(NodeOutcome.SKIP);
            return;
        }
    }
}

function main() {
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try {
        processCallbacks();
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error in main execution: " + error.message);
    }
    nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
}

// Main execution
main();


// /*
// - ChoiceCallback => ["HIGH","LOW","MEDIUM","SKIP"]
// Show the drop down during login to show the mfa method risk level selection
// */

// var dateTime = new Date().toISOString();

// // Node Config
// var nodeConfig = {
//     begin: "Beginning Node Execution",
//     node: "Node",
//     nodeName: "NodeMFA Authentication List",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.MFA.RiskLevelSelection",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     CONTINUE: "continue",
//     SKIP: "skip",
//     FAILED: "failed"
// };

// // Logger
// var nodeLogger = {
//     debug: function (message) { logger.debug(message); },
//     error: function (message) { logger.error(message); }
// };

// function processCallbacks() {
//     // dropdown options
//     var riskLevelOptions = ["HIGH", "LOW", "MEDIUM", "SKIP"];
//     var promptMessage = "select_pingoneprotect_risk_level";

//     if (callbacks.isEmpty()) {
//         var jsonobj = {"pageHeader": "Select Risk Level"};
//         callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));

//         callbacksBuilder.choiceCallback(promptMessage, riskLevelOptions, 0, false);

//         callbacksBuilder.confirmationCallback(0, ["Next"], 0);
//     } else {
//         var selectedIndex = callbacks.getChoiceCallbacks().get(0)[0]; // index of HIGH/LOW/MEDIUM/SKIP
//         var confirmationChoice = callbacks.getConfirmationCallbacks().get(0); // always 0 when only "Next"

//         if (selectedIndex === null || selectedIndex === undefined || selectedIndex < 0 || selectedIndex > 3) {
//             nodeLogger.error("Invalid selection index for risk level ChoiceCallback: " + selectedIndex);
//             action.goTo(NodeOutcome.FAILED);
//             return;
//         }

//         var selectedValue = ["HIGH", "MEDIUM", "LOW", "SKIP"][selectedIndex];
//        logger.error("user has selected dropdwon risk level"+selectedValue)
//         // Store selection for downstream nodes
//         nodeState.putShared("riskLevel", selectedValue);

//         if (selectedValue === "SKIP") {
//             action.goTo(NodeOutcome.SKIP);
//             return;
//         }

//         if (confirmationChoice === 0) {
//             action.goTo(NodeOutcome.CONTINUE);
//         } else {
//             action.goTo(NodeOutcome.FAILED);
//         }
//     }
// }

// function main() {
//     nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
//     try {
//         processCallbacks();
//     } catch (error) {
//         nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Error in main execution: " + error.message);
//     }
//     nodeLogger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
// }

// // Main execution
// main();
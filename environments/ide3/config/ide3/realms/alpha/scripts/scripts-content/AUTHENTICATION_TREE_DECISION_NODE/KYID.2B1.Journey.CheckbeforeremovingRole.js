function executeMainLogic() {
    var dateTime = new Date().toISOString();
    var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");
    var ops = require("KYID.2B1.Library.IDMobjCRUDops");

    var nodeConfig = {
        begin: "Beginning Node Execution",
        node: "Node",
        nodeName: "Dashboard RemoveRole",
        script: "Script",
        scriptName: "KYID.2B1.Journey.CheckbeforeremovingRole",
        timestamp: dateTime,
        end: "Node Execution Completed"
    };

    var NodeOutcome = {
        DONOTREMOVE: "donotremove",
        PROCEED: "proceed",
        ERROR: "error",
        INTERNALUSER: "internaluser"
    };

    var nodeLogger = {
        debug: function (message) { logger.debug(message); },
        error: function (message) { logger.error(message); },
        info: function (message) { logger.info(message); }
    };

    try {
        // === Normalize roleIds from nodeState ===
        var rawRoleIds = nodeState.get("roleIds");
        var roleIds;

        if (typeof rawRoleIds === "object") {
            roleIds = JSON.parse(JSON.stringify(rawRoleIds));
        } else {
            roleIds = rawRoleIds;
        }

        if (typeof roleIds === "string") {
            try {
                roleIds = JSON.parse(roleIds);
                if (!Array.isArray(roleIds)) roleIds = [roleIds];
            } catch (e) {
                roleIds = [roleIds];
            }
        } else if (!Array.isArray(roleIds)) {
            roleIds = [roleIds];
        }

        logger.debug("Final roleID array: " + JSON.stringify(roleIds));

        // === Check if user is INTERNAL (accountType = "C") ===
        var userId = nodeState.get("_id");
        logger.debug("userId: " + userId);

        var usrObj = openidm.read("managed/alpha_user/" + userId);
        // if (usrObj && usrObj.custom_useraccounttype) {
        //     var accountTypeId = usrObj.custom_useraccounttype._refResourceId;
        //     var accTypeObj = openidm.read("managed/alpha_kyid_useraccounttype/" + accountTypeId);
        //     if (accTypeObj && accTypeObj.name === "C") {
        //         logger.debug("User is internal (C), skipping role removal.");
        //         nodeState.putShared("internaluser", "C"); // Mark as internal user
        //         action.goTo(NodeOutcome.INTERNALUSER); // Skip further execution if internal
        //         return;
        //     }
        // }
        
        //userAccount type is not a separate MO its a string in alpha_user
        
        if (usrObj && usrObj.custom_userType) {
            var accountTypeId = usrObj.custom_userType
            if (accountTypeId === "C") {
                logger.debug("User is internal (C), skipping role removal.");
                nodeState.putShared("internaluser", "C"); // Mark as internal user
                action.goTo(NodeOutcome.INTERNALUSER); // Skip further execution if internal
                return;
            }
        }

        // === Check each role's actionType ===
        var roleDetails = [];
        var removableRoleFound = false;
        var notRemovableRoleFound = false;

        roleIds.forEach(function (roleId) {
            var roleObj = openidm.read("managed/alpha_role/" + roleId);
            if (roleObj) {
                var roleName = roleObj.name || "Unknown";
                roleDetails.push({ name: roleName });
                logger.debug("Role found: " + roleName);

                // if (roleObj.actionType && roleObj.actionType._refResourceId) {
                //     var actionTypeId = roleObj.actionType._refResourceId;
                //     var actionTypeObj = openidm.read("managed/alpha_kyid_roleactiontype/" + actionTypeId);

                //     if (actionTypeObj && actionTypeObj.name !== "Self-Service") {
                //         logger.debug("Role action for roleId " + roleId + " is NOT removable.");
                //         notRemovableRoleFound = true;
                //     } else if (actionTypeObj && actionTypeObj.name === "Self-Service") {
                //         logger.debug("Removable role action found for roleId: " + roleId);
                //         removableRoleFound = true;
                //     }
                // } 
                //role action type in alpha_role
                if (roleObj.roleActionType) {
                    if (roleObj.roleActionType !== "Self-Service") {
                        logger.debug("Role action for roleId " + roleId + " is NOT removable.");
                        notRemovableRoleFound = true;
                    } else if (roleObj.roleActionType === "Self-Service") {
                        logger.debug("Removable role action found for roleId: " + roleId);
                        removableRoleFound = true;
                    }
                } 
                    
                else {
                    logger.debug("No actionType found for roleId: " + roleId);
                }
            } else {
                logger.debug("No role found for roleId: " + roleId);
            }
        });

        nodeState.putShared("roleNames", JSON.stringify(roleDetails));
        logger.debug("printing the roleNames in json" +JSON.stringify(roleDetails) )

        // === Outcome Routing ===
        if (nodeState.get("internaluser") === "C") {
            logger.debug("User is internal, skipping role removal.");
            action.goTo(NodeOutcome.INTERNALUSER);
        } else if (notRemovableRoleFound) {
            logger.debug("Redirecting to DONOTREMOVE due to NOT removable role.");
            action.goTo(NodeOutcome.DONOTREMOVE);
        }  else {
            logger.debug("Proceeding with role removal.");
            action.goTo(NodeOutcome.PROCEED);
        }

    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" +
            nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName +
            "::" + nodeConfig.begin + ":: Error: " + error.message);
        action.goTo(NodeOutcome.ERROR);
    }
}

// === Execute Main Function ===
(function main() {
    executeMainLogic();
})();



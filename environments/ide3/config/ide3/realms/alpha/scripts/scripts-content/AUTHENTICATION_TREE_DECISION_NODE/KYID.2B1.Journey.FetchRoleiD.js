try {
    // Step 1: Get app _id by app name
    var appName = nodeState.get("appidinrolewidget");
    logger.debug("Looking up business app with name: " + appName);

    var appQueryResp = openidm.query("managed/alpha_kyid_businessapplication", {
        "_queryFilter": 'name eq "' + appName + '"'
    }, ["_id", "name"]);

    if (appQueryResp && appQueryResp.result && appQueryResp.result.length === 1) {
        var businessAppIdFromAppQuery = appQueryResp.result[0]._id;
        logger.debug("Found business app _id: " + businessAppIdFromAppQuery);

        // Step 2: Get role names from nodeState
        var roleNames = nodeState.get("roleIds");  // Can be array or string
        logger.debug("Retrieved roleIds from nodeState: " + roleNames);

        if (typeof roleNames === "string") {
            roleNames = [roleNames];
        }

        if (!Array.isArray(roleNames)) {
            logger.debug("roleIds is not an array, cannot proceed.");
        } else {
            var matchedRoles = [];

            for (var i = 0; i < roleNames.length; i++) {
                var roleName = roleNames[i];
                logger.debug("Processing roleName: " + roleName);

                // Step 3: Query alpha_role by role name
                var roleQueryResp = openidm.query("managed/alpha_role", {
                    "_queryFilter": 'name eq "' + roleName + '"'
                }, ["_id", "name", "businessAppId"]);

                logger.debug("Role query response: " + JSON.stringify(roleQueryResp));

                if (roleQueryResp && roleQueryResp.result && roleQueryResp.result.length > 0) {
                    var roleId = roleQueryResp.result[0]._id;
                    logger.debug("Fetched roleId: " + roleId);

                    // Step 4: Read role object to get businessAppId
                    var businessIdResp = openidm.read("managed/alpha_role/" + roleId);

                    if (!businessIdResp) {
                        logger.debug("No role details found for roleId: " + roleId);
                        continue;
                    }

                    var businessAppId = businessIdResp.businessAppId ? businessIdResp.businessAppId._refResourceId : null;

                    if (!businessAppId) {
                        logger.debug("No businessAppId linked to roleId: " + roleId);
                        continue;
                    }

                    logger.debug("Found businessAppId from role object: " + businessAppId);

                    // Step 5: Validate businessAppId
                    if (businessAppId === businessAppIdFromAppQuery) {
                        logger.debug(`Role '${roleName}' is linked to expected businessAppId '${businessAppId}'`);

                        nodeState.putShared("roleIds", roleId);  // Store valid roleId
                        matchedRoles.push({
                            roleId: roleId,
                            roleName: roleName,
                            businessAppId: businessAppId
                        });
                    } else {
                        logger.debug(`Role '${roleName}' is not linked to expected businessAppId '${businessAppIdFromAppQuery}'`);
                    }

                } else {
                    logger.debug(`No role found for roleName: '${roleName}'`);
                }
            }

            logger.debug("Final matchedRoles: " + JSON.stringify(matchedRoles));
            outcome = "true"
        }

    } else {
        logger.debug("No business application found for name: " + appName);
         outcome = "true"
    }

} catch (e) {
    logger.error("Error during business app and role query flow: " + e);
    outcome = "true"
}

// try {
//     // Step 1: Get app _id by app name
//     var appName = nodeState.get("appidinrolewidget");
//     logger.debug("Looking up business app with name: " + appName);

//     var appQueryResp = openidm.query("managed/alpha_kyid_businessapplication", {
//         "_queryFilter": 'name eq "' + appName + '"'
//     }, ["_id", "name"]);

//     if (appQueryResp && appQueryResp.result && appQueryResp.result.length === 1) {
//         var businessAppId = appQueryResp.result[0]._id;
//         logger.debug("Found business app _id: " + businessAppId);

//         // Step 2: Get role(s) by role name(s) and business app _id
//         var roleNames = nodeState.get("roleIds");  // Can be array or string
//          logger.debug("Found roleNames from nodeState roleIds:: " + roleNames);
        
//         if (typeof roleNames === "string") {
//             roleNames = [roleNames];
//         }

//         if (!Array.isArray(roleNames)) {
//             logger.debug("roleIds is not an array, cannot proceed.");
//         }

//         var matchedRoles = [];

//         for (var i = 0; i < roleNames.length; i++) {
//             var roleName = roleNames[i];
//         logger.debug("the roleName is "+roleName)
//             var roleQueryResp = openidm.query("managed/alpha_role", {
//                 "_queryFilter": 'name eq "' + roleName + '" AND businessAppId/_refResourceId eq "' + businessAppId + '"'
//             }, ["_id", "name"]);

//             logger.debug("the roleName in the roleQueryResp::: "+JSON.stringify(roleQueryResp))
            
//             if (roleQueryResp && roleQueryResp.result && roleQueryResp.result.length > 0) {
//                 logger.debug(`Role(s) found for roleName '${roleName}': ` + JSON.stringify(roleQueryResp.result));
//                // matchedRoles = matchedRoles.concat(roleQueryResp.result);
//                 nodeState.putShared("roleIds",roleQueryResp.result[0]._id)
//                 outcome = "true"
//             } else {
//                 logger.debug(`No matching role found for roleName '${roleName}' and businessAppId '${businessAppId}'`);
//                 outcome = "true"
//             }
//         }

//         // Store matched roles in nodeState
//         //nodeState.putShared("matchedRoles", matchedRoles);
//         logger.debug("Final matched roles stored in nodeState: " + JSON.stringify(matchedRoles));
//         outcome = "true"

//     } else {
//         logger.debug("No business application found for name: " + appName);
//         outcome = "true"
//     }

// } catch (e) {
//     logger.error("Error during business app and role query flow: " + e);
// }
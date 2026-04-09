// Scheduled job - retry failed recon items
(function () {
    logger.error("[POC-RECON] retry_job:: START");

    // Step 1: Query MO for failed items
    var failedResults = openidm.query("managed/userMOAaronTest", {
        "_queryFilter": "lastSyncStatus eq \"FAILED\""
    }, ["lastSyncSourceId"]);

    if (!failedResults || !failedResults.result || failedResults.result.length === 0) {
        logger.error("[POC-RECON] retry_job:: No failed items found, skipping");
        return;
    }

    logger.error("[POC-RECON] retry_job:: Found " + failedResults.result.length + " failed items");

    // Step 2: Build sourceQuery OR filter from sourceIds
    var filterParts = [];
    for (var i = 0; i < failedResults.result.length; i++) {
        var sid = failedResults.result[i].lastSyncSourceId;
        if (sid) {
            filterParts.push("__NAME__ eq \"" + sid + "\"");
            logger.error("[POC-RECON] retry_job:: Adding sourceId=" + sid);
        }
    }

    if (filterParts.length === 0) {
        logger.error("[POC-RECON] retry_job:: No valid sourceIds found, skipping");
        return;
    }

    var sourceFilter = filterParts.join(" OR ");
    logger.error("[POC-RECON] retry_job:: sourceQuery=" + sourceFilter);

    // Step 3: Trigger recon with filtered sourceQuery
    var mappingName = "systemCsvconnectoraarontest2_managedUserMOAaronTst";
    var params = { "mapping": mappingName };
    var content = {
        "sourceQuery": {
            "_queryFilter": sourceFilter
        },
        "runTargetPhase": false
    };

    try {
        var result = openidm.action("recon", "recon", content, params);
        logger.error("[POC-RECON] retry_job:: Recon triggered, reconId=" + result._id);
    } catch (e) {
        logger.error("[POC-RECON] retry_job:: Recon FAILED error=" + e.message);
    }

    logger.error("[POC-RECON] retry_job:: END");
})();
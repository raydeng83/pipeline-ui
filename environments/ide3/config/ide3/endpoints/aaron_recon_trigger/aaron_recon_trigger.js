/**
 * @name Aaron Recon Trigger
 * @description Trigger reconciliation for CSV inbound mapping
 * @version v1.0.0
 */

(function () {
    var mappingName = "systemAaroncsv__ACCOUNT___managedAlpha_user";

    logger.error("aaron_recon_trigger: Starting recon for mapping: " + mappingName);

    var body = request.content;
    var sourceQueryFilter = body.sourceQueryFilter || "true";

    logger.error("aaron_recon_trigger: sourceQueryFilter: " + sourceQueryFilter);

    var params = { "mapping": mappingName };
    var content = {
        "sourceQuery": {
            "_queryFilter": sourceQueryFilter
        }
    };

    try {
        var result = openidm.action("recon", "recon", content, params);
        logger.error("aaron_recon_trigger: recon started - " + result._id);
        return {
            status: "success",
            reconId: result._id,
            mapping: mappingName,
            timestamp: new Date().toISOString()
        };
    } catch (e) {
        logger.error("aaron_recon_trigger: recon failed - " + e.message);
        return {
            status: "error",
            message: e.message,
            mapping: mappingName,
            timestamp: new Date().toISOString()
        };
    }
}());

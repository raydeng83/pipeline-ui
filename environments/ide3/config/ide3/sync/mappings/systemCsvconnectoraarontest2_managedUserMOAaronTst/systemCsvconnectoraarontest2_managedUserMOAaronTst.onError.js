(function () {
    logger.error("[POC-RECON] onError:: sourceId=" + sourceId + " targetId=" + targetId + " situation=" + situation);
    logger.error("[POC-RECON] onError:: error=" + JSON.stringify(error));

    if (targetId) {
        try {
            var now = new Date().toISOString();
            var errorMsg = (error && error.message) ? error.message : JSON.stringify(error);

            openidm.patch("managed/userMOAaronTest/" + targetId, null, [
                { "operation": "replace", "field": "/lastSyncTime", "value": now },
                { "operation": "replace", "field": "/lastSyncStatus", "value": "FAILED" },
                { "operation": "replace", "field": "/lastSyncSourceId", "value": sourceId },
                { "operation": "replace", "field": "/lastSyncError", "value": errorMsg }
            ]);
            logger.error("[POC-RECON] onError:: PATCHED targetId=" + targetId);
        } catch (e) {
            logger.error("[POC-RECON] onError:: PATCH FAILED error=" + e.message);
        }
    } else {
        logger.error("[POC-RECON] onError:: No targetId, sourceId=" + sourceId);
    }
})();
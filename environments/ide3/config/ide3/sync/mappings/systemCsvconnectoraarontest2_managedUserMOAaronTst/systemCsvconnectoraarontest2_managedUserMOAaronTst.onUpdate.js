var SIMULATE_FAILURE = true;
var FAIL_LIST = ["bwilson", "dlee"];

var sid = source._id;
logger.error("[POC-RECON] onUpdate:: sourceId=" + sid);

if (SIMULATE_FAILURE && FAIL_LIST.indexOf(sid) >= 0) {
    logger.error("[POC-RECON] onUpdate:: THROWING for " + sid);
    throw { code: 400, message: "Simulated failure for: " + sid };
}

target.lastSyncTime = new Date().toISOString();
target.lastSyncStatus = "SUCCESS";
target.lastSyncSourceId = sid;
target.lastSyncError = "";
logger.error("[POC-RECON] onUpdate:: sourceId=" + sid + " status=SUCCESS");
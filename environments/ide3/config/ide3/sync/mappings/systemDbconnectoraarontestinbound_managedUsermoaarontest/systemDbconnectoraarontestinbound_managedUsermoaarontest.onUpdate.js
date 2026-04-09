var SIMULATE_FAILURE = false;
var FAIL_LIST = ["jpark"];

var sid = source.__NAME__;
logger.error("[POC-LIVESYNC] onUpdate:: sourceId=" + sid);

if (SIMULATE_FAILURE && FAIL_LIST.indexOf(sid) >= 0) {
    logger.error("[POC-LIVESYNC] onUpdate:: THROWING for " + sid);
    throw { code: 400, message: "Simulated failure for: " + sid };
}

logger.error("[POC-LIVESYNC] onUpdate:: SUCCESS for " + sid);
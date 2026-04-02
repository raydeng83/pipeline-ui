// webauthn_precheck_dump_aaron
// Runs BEFORE WebAuthn Registration Node
// Dumps ALL state + request headers (server-side only)

var TAG = "[WEBAUTHN-PRECHECK]";

// 1. Full state dump — catches everything, no guessing key names
logger.error(TAG + " === FULL STATE DUMP (PRE-REG) ===");
try {
    var allKeys = nodeState.keys().toArray();
    for (var i = 0; i < allKeys.length; i++) {
        logger.error(TAG + " state[" + allKeys[i] + "] = " + nodeState.get(allKeys[i]));
    }
    logger.error(TAG + " total keys: " + allKeys.length);
} catch(e) {
    // Fallback if keys() is not available in sandbox
    logger.error(TAG + " keys() failed: " + e);
    logger.error(TAG + " username: " + nodeState.get("username"));
    logger.error(TAG + " userid: " + nodeState.get("userid"));
}

// 2. HTTP request headers — User-Agent for device identification
logger.error(TAG + " === REQUEST HEADERS ===");
try {
    var headerNames = ["user-agent", "accept-language", "sec-ch-ua", "sec-ch-ua-platform",
                        "sec-ch-ua-mobile", "sec-ch-ua-platform-version"];
    for (var i = 0; i < headerNames.length; i++) {
        var hdr = requestHeaders.get(headerNames[i]);
        if (hdr) {
            logger.error(TAG + " " + headerNames[i] + ": " + hdr.get(0));
        }
    }
} catch(e) {
    logger.error(TAG + " requestHeaders not available: " + e);
}

action.goTo("true");

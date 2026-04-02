// webauthn_error_dump_aaron
// Runs when WebAuthn Registration hits Client Error
// Full state dump to capture DOMException + all context

var TAG = "[WEBAUTHN-ERROR]";

// 1. Full state dump
logger.error(TAG + " === FULL STATE DUMP (ERROR) ===");
try {
    var allKeys = nodeState.keys().toArray();
    for (var i = 0; i < allKeys.length; i++) {
        logger.error(TAG + " state[" + allKeys[i] + "] = " + nodeState.get(allKeys[i]));
    }
    logger.error(TAG + " total keys: " + allKeys.length);
} catch(e) {
    logger.error(TAG + " keys() failed: " + e);
}

// 2. Highlight the DOMException specifically
logger.error(TAG + " === ERROR HIGHLIGHTS ===");
logger.error(TAG + " >> WebAuthenticationDOMException: " + nodeState.get("WebAuthenticationDOMException"));
logger.error(TAG + " >> username: " + nodeState.get("username"));

action.goTo("true");

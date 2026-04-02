// webauthn_postcheck_dump_aaron
// Runs AFTER successful WebAuthn Registration
// Full state dump + highlighted WebAuthn-specific keys

var TAG = "[WEBAUTHN-POSTCHECK]";

// 1. Full state dump — catches EVERYTHING the WebAuthn Reg Node produced
logger.error(TAG + " === FULL STATE DUMP (POST-REG) ===");
try {
    var allKeys = nodeState.keys().toArray();
    for (var i = 0; i < allKeys.length; i++) {
        logger.error(TAG + " state[" + allKeys[i] + "] = " + nodeState.get(allKeys[i]));
    }
    logger.error(TAG + " total keys: " + allKeys.length);
} catch(e) {
    logger.error(TAG + " keys() failed: " + e);
}

// 2. Highlight known WebAuthn keys (in case the full dump truncates large values)
logger.error(TAG + " === WEBAUTHN KEY HIGHLIGHTS ===");
var webauthnKeys = [
    "webauthnDeviceAaguid",       // AAGUID (authenticator model ID)
    "webauthnAttestationType",    // BASIC, SELF, CA, NONE
    "webauthnAttestationInfo",    // flags (UV, UP, BE, BS, AT, ED) + authenticatorAttachment
    "webauthnDeviceData",         // credential ID, public key, device info
    "webauthnData"                // full registration data blob
];
for (var i = 0; i < webauthnKeys.length; i++) {
    var val = nodeState.get(webauthnKeys[i]);
    logger.error(TAG + " >> " + webauthnKeys[i] + ": " + val);
}

action.goTo("true");

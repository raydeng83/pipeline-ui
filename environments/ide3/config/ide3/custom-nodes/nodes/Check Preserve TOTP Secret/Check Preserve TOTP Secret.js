// Check if we should preserve the existing TOTP secret
var preserveSecret = nodeState.get("preserveTOTPSecret");

if (preserveSecret === "true") {
    // User pressed back - reuse existing secret, skip OATH Registration
    logger.debug("Preserving existing TOTP secret - skipping OATH Registration");
    action.goTo("skip");
} else {
    // Normal flow - proceed to OATH Registration to generate new secret
    logger.debug("Generating new TOTP secret - proceeding to OATH Registration");
    action.goTo("generate");
}
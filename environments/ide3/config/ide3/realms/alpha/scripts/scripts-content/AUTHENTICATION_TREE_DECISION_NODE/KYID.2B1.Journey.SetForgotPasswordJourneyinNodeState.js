/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
nodeState.putShared("forgotPassword","forgotPassword");
nodeState.putShared("isForgotPasswordJourney", true);
// outcome = "true";

if (typeof existingSession != 'undefined') {
            logger.debug("session exist")
            action.goTo("true")
        } else {
            logger.debug("session does not exist")
            //Defect Fix# 211192 (Unknown Location) - 03/12
            var sessionRefId = {
                sessionRefId: "",
                city: "",
                state: "",
                country: ""
            }
            sessionRefId.sessionRefId = generateGUID();
            nodeState.putShared("sessionRefId", JSON.stringify(sessionRefId));
            action.goTo("true").putSessionProperty("sessionRefId", JSON.stringify(sessionRefId));
}
// Generate a random GUID
function generateGUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0,
                value = c == 'x' ? r : (r & 0x3 | 0x8);
            return value.toString(16);
        });
}
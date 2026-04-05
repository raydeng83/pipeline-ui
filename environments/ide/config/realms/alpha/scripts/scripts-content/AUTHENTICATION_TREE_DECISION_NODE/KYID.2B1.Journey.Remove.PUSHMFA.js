var errMsg = {};
var libError = null;
libError = require("KYID.2B1.Library.Loggers");
var userId = null;
var bearerToken = nodeState.get("amAccessToken");
var URL = systemEnv.getProperty("esv.kyid.tenant.fqdn");
if(nodeState.get("userId")){
   
    //  userId = existingSession.get("UserId");
    userId = nodeState.get("userId");
    logger.debug("userId is -- "+ userId);
}else if( existingSession && existingSession.get("UserId")) {
    userId = existingSession.get("UserId")
}
logger.debug("userId is -- "+ userId);
logger.debug("bearerToken is -- "+ bearerToken);

try {
    requestURL =  URL + "/am/json/realms/root/realms/alpha/users/" + userId + "/devices/2fa/push?_action=reset";
    var response =restAPItoResetDevice(bearerToken, requestURL)
    var bearerToken = nodeState.putShared("amAccessToken", null);
     action.goTo("true");
} catch (error) {
    logger.error("Error Occurred while Removing MFA"+ error );
    action.goTo("false");
}

function restAPItoResetDevice(bearerToken, requestURL) {
    try {
        logger.debug("Inside restAPItoResetDevice fun")
        var options = {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept-API-Version": "resource=1.0"
            },
            token: bearerToken,
            body: {}
        };

        var apiResponse = httpClient.send(requestURL, options).get();
        logger.debug("API Response is " + apiResponse.text())
        if (apiResponse) {
            var status = apiResponse.status;
            logger.debug("API status is " + status)
            if (status === 200) {
                return true;
            }
            else { return false };
        }
        else {
            return false;
        }
    } catch (error) {
        logger.error("error occurred in restAPItoResetDevice :: " + restAPItoResetDevice)
        return false;

    }

}




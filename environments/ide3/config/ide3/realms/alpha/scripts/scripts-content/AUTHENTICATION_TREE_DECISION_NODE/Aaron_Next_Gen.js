/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

// ---- Config ----
var AM_BASE = "https://sso.ide3.kyid.ky.gov";
var REALM_PATH = "/am/json/realms/root/realms/alpha";
var USER_ID = nodeState.get("uuid");

var ssotoken = requestCookies[cookieName];

var requestURL = [AM_BASE, REALM_PATH, "/users/", USER_ID, "/devices/2fa/webauthn?_queryId=*"].join("")

var options = {
    method: "GET",
    headers: {
      "accept": "application/json, text/plain, */*",
      "accept-api-version": "protocol=2.1,resource=1.0",
      "Cookie": [cookieName, "=", ssotoken].join("")
    }
};


var response = httpClient.send(requestURL, options).get();

nodeState.putShared("response", response.json());

action.goTo("true");

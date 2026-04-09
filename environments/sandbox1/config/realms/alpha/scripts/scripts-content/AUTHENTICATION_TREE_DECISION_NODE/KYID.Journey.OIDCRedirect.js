/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

function replaceRedirectURI(url, newRedirectURI) {

    var regex = /([?&])redirect_uri=[^&]+/;

    if (url.match(regex)) {

        return url.replace(regex, '$1redirect_uri=' + encodeURIComponent(newRedirectURI));
    } else {

        var separator = url.indexOf('?') === -1 ? '?' : '&';
        return url + separator + 'redirect_uri=' + encodeURIComponent(newRedirectURI);
    }
}


//var originalURL = "https://sso.dev.kyid.ky.gov:443/am/oauth2/authorize?response_type=code&redirect_uri=https://test-redcap.chfs.redcapkydph.com/index.php&client_id=6zqx9zs5uqlfh4465bzhuclnd&nonce=99592d8c1c29bb8233eed9de80a17232&state=f83baac29994740f1c6baf01cadb81c3&scope=address%20phone%20openid%20profile%20fr:idm:*%20am-introspect-all-tokens%20email%20openid";
//var newRedirectURI = "https://dev.kog.ky.gov/account/";

//var newRedirectURI = nodeState.get("needKogSuccess");

//var newRedirectURI = "https://dev.kog.ky.gov/account/AccessDenied.aspx"
//var newRedirectURI = "https://dev.kog.ky.gov/account/RouterPage.aspx"
var newRedirectURI = "https://dev.kog.ky.gov/account/RouterPage.aspx?fr=1&nonce=f177a65e-05ed-414a-a8c2-e095b57e453b"
var originalURL = nodeState.get("goto")
//var newRedirectURI = nodeState.get("needKogSuccess");

logger.error("print TBD original URL is++" +originalURL );
var updatedURL = replaceRedirectURI(originalURL, newRedirectURI);
//nodeState.putShared("updatedURL",updatedURL);
logger.error("print the new go to url" +updatedURL );
var redirect = callbacksBuilder.redirectCallback(updatedURL, null, "GET");
action.goTo("redirect");

//action.goTo("true");
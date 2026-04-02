/**
* Function: KYID.Journey.MonitorAuthnSession
* Description: This script is used to to manage client-side session monitoring and redirection. It ensures that user's session is continuously monitored on the client-side and user should be redirected to a specified URL if their session expires.
* Param(s):
* Input:
*                              
* Returns: 
•	Success: Initialization completed successfully.
•	Error: An exception occurred during initialization.

* Date: 22nd December 2024
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
	tenantFqdnEsv: systemEnv.getProperty("esv.sa.accesstoken.tenantfqdnesv"),
    clientSecretEsv: systemEnv.getProperty("esv.getcurrenttimeclientsecret"),
    nodeName: "Monitor Authentication Session",
    script: "Script",
    scriptName: "KYID.2B1.Journey.MonitorAuthnSession",
    timestamp: dateTime,
    exceptionErrMsg: "Error calculating redirect time: ",
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     SUCCESS: "True"
 };

 //Logging Function
 var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
};
 
 function createPeriodicCheckScript(currentTime, redirectTime, redirectUrl, intervalMs,accessToken,tenantFqdn) {   
    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Inside createPeriodicCheckScript");
    return String(`(function() {            
	var redirectTimestamp = ${redirectTime}; 
    console.log("redirectTimestamp: "+redirectTimestamp);
    var accessToken = "${accessToken}";
    var tenantFqdn = "${tenantFqdn}";
	var redirectUrl = "${redirectUrl}";   
    console.log("redirectUrl: "+redirectUrl);
	var interval = ${intervalMs};   
    console.log("interval: "+interval);
	function checkTime() { 
    getCurrentTime()
    .then(response => {
        // You can store the response in a variable if needed
        var currentTimeMillis = response.currentTimeMillis;
		var currentTimestamp = currentTimeMillis;
        console.log("currentTimestamp: "+currentTimestamp);
      	if (currentTimestamp >= redirectTimestamp) {                    
    		clearInterval(intervalId); // Stop the interval when redirecting                    
            window.location.replace(redirectUrl);                
		}
		
    })
    .catch(error => {
        console.error(error);  // Log any error that occurred
    });
	 }

function getCurrentTime() {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();  // Create a new XMLHttpRequest object
        xhr.open('GET', 'https://'+tenantFqdn+'/openidm/endpoint/getCurrentTime', true);  // Specify the HTTP method and URL
        xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {  // Check if the request is complete and successful
                var response = JSON.parse(xhr.responseText);  // Parse the JSON response
                resolve(response);  // Resolve the promise with the response data
            } else if (xhr.readyState === 4) {  // If there's an error
                reject('Error: ' + xhr.status);  // Reject the promise with the error status
            }
        };

        xhr.send();  // Send the request
    });
}
		// Run the check periodically based on the interval            
		var intervalId = setInterval(checkTime, interval);
        console.log("intervalId: "+intervalId)
		})();`);
	}


	try {    
        var clientSecretEsvValue=nodeConfig.clientSecretEsv;
        var params = [
          `grant_type=${encodeURIComponent("client_credentials")}`,
          `client_id=${encodeURIComponent("getCurrentTime")}`,
          `client_secret=${encodeURIComponent(clientSecretEsvValue)}`,
          `scope=${encodeURIComponent("fr:idm:*")}`
        ].join("&");
        
        var requestOptions = {
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded"            
                },
                body: params
        };

		var tenantFqdn = nodeConfig.tenantFqdnEsv;
		var requestURL = "https://".concat(tenantFqdn).concat("/am/oauth2/alpha/access_token");
        var response = httpClient.send(requestURL, requestOptions).get();
        var responseJson = JSON.parse(response.text());
        var tkn = responseJson["access_token"];
        nodeLogger.debug("Response token is ******* " + tkn);
		var authnSessionCurrentTime = Date.now(); 
		// Current time in milliseconds    
		var authnSessionRedirectTime = nodeState.get("authnSessionRedirectTime"); 
		// Redirect time from node state
        var privateKey = systemEnv.getProperty("esv.frserviceaccount.key");
		var authnSessionRedirectUrl = nodeState.get("authnSessionRedirectUrl"); 
		// Redirect URL from node state    
		var authnSessionCheckInterval = nodeState.get("authnSessionCheckInterval"); 
		// Interval in milliseconds, default to 1000ms    
    	if (!authnSessionCurrentTime || !authnSessionRedirectTime || !authnSessionRedirectUrl) {        
    		throw "authnSessionCurrentTime, authnSessionRedirectTime, or authnSessionRedirectUrl are not defined!";    
    	}    
    	if (callbacks.isEmpty()) {        
    	// Inject the periodic check script with the interval        
    		callbacksBuilder.scriptTextOutputCallback(createPeriodicCheckScript(authnSessionCurrentTime, authnSessionRedirectTime, authnSessionRedirectUrl, authnSessionCheckInterval,tkn,tenantFqdn));    
    	} else {        
    	// If callbacks are already populated, move to the next step        
    		action.goTo(nodeOutcome.SUCCESS); 
    	}
     } catch (error) {      
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.exceptionErrMsg+"::"+error); 
		action.goTo(nodeOutcome.SUCCESS);
	}


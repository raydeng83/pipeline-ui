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
    nodeName: "Monitor Authentication Session",
    script: "Script",
    scriptName: "KYID.Journey.MonitorAuthnSession",
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

 
 function createPeriodicCheckScript(currentTime, redirectTime, redirectUrl, intervalMs) {   
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Inside createPeriodicCheckScript");
	return String(`(function() {            
	var redirectTimestamp = ${redirectTime};  
    console.log("redirectTimestamp: "+redirectTimestamp);
	var redirectUrl = "${redirectUrl}";   
    console.log("redirectUrl: "+redirectUrl);
	var interval = ${intervalMs};   
    console.log("interval: "+interval);
	function checkTime() {  
        //console.log("Inside checkTime()");
		var currentTimestamp = Date.now();   
      	if (currentTimestamp >= redirectTimestamp) {                    
    		clearInterval(intervalId); // Stop the interval when redirecting                    
            window.location.replace(redirectUrl);                
		}
	 }            
		// Run the check periodically based on the interval            
		var intervalId = setInterval(checkTime, interval);
        console.log("intervalId: "+intervalId)
		})();`);
	}


	try {    
		var authnSessionCurrentTime = Date.now(); 
		// Current time in milliseconds    
		var authnSessionRedirectTime = nodeState.get("authnSessionRedirectTime"); 
		// Redirect time from node state    
		var authnSessionRedirectUrl = nodeState.get("authnSessionRedirectUrl"); 
		// Redirect URL from node state    
		var authnSessionCheckInterval = nodeState.get("authnSessionCheckInterval"); 
		// Interval in milliseconds, default to 1000ms    
    	if (!authnSessionCurrentTime || !authnSessionRedirectTime || !authnSessionRedirectUrl) {        
    		throw "authnSessionCurrentTime, authnSessionRedirectTime, or authnSessionRedirectUrl are not defined!";    
    	}    
    	if (callbacks.isEmpty()) {        
    	// Inject the periodic check script with the interval        
    		callbacksBuilder.scriptTextOutputCallback(createPeriodicCheckScript(authnSessionCurrentTime, authnSessionRedirectTime, authnSessionRedirectUrl, authnSessionCheckInterval));    
    	} else {        
    	// If callbacks are already populated, move to the next step        
    		action.goTo(nodeOutcome.SUCCESS); 
    	}
     } catch (error) {      
        nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.exceptionErrMsg+"::"+error); 
		action.goTo(nodeOutcome.SUCCESS);
	}


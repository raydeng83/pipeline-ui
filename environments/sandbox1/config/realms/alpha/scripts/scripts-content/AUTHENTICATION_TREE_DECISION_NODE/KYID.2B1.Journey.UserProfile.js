var dateTime = new Date().toISOString();

  // Node Config
  var nodeConfig = {
      begin: "Begining Node Execution",
      node: "Node",
      nodeName: "UserProfile",
      script: "Script",
      scriptName: "KYID.2B1.Journey.UserProfile",
      timestamp: dateTime,
      end: "Node Execution Completed"
  };
  
  var NodeOutcome = {
      VERIFY: "Verify",
      ANOTHER_FACTOR: "Choose Another Method",
      FAILED: "false",
      DUPLICATE: "Duplicate",
      EMPTY_OTP: "BlankOTP"
  };
  
  
  /**
     * Logging function
     * @type {Function}
     */
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
  


  nodeState.putShared("mail",null)
  // Function to handle callback requests
  function requestCallbacks() {
     logger.error("inside requestCallbacks")
      try {      
              callbacksBuilder.textInputCallback("First Name");
              callbacksBuilder.textInputCallback("Last Name");
              callbacksBuilder.textInputCallback("Email Address");
              callbacksBuilder.confirmationCallback(0, ["Next"], 0);
          }
       catch (error) {
          logger.error("there is some error");
      }
  }
  
  // Function to handle user responses
  function handleUserResponses() {
     
          
          var firstname = callbacks.getTextInputCallbacks().get(0).trim();
          var lastname = callbacks.getTextInputCallbacks().get(1).trim();
          var email = callbacks.getTextInputCallbacks().get(2).trim();
          var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
  
          nodeState.putShared("selectedOutcome", selectedOutcome);
      
          //nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Print Outcome Selected :::: " + selectedOutcome);
          logger.error("Print Outcome Selected :::: " + selectedOutcome);
      logger.error("Print email :::: " + email);
          nodeState.putShared("mail", email)
          nodeState.putShared("sn", lastname)
          nodeState.putShared("givenName", firstname)
          if (selectedOutcome === 0) {
              action.goTo("next");    
              }
           }
 



  //Main execution
  try {
      if (callbacks.isEmpty()) {
          requestCallbacks();
      } else {
          handleUserResponses();
      }
  } catch (error) {
      nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error in main execution: " + error.message);
  }
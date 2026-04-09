/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var value = sharedState.get("userName");
//var phone = sharedState.get("telephoneNumber");

// Check which attribute is provided
if (value && value.trim() !== "") {
	var emailPattern= /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	if(!emailPattern.test(value)){
    	if(!phonePattern.test(value)){
			logger.error("Invalid phone number format");
      		outcome = "invalid";
        }
		outcome = "phone";
    }
    outcome = "email";
} else {
	logger.error("Invalid input format");
    outcome = "invalid";
}

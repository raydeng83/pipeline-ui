/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
var userInput = sharedState.get("username");
logger.error(sharedState);
sharedState.put("telephoneNumber", userInput);
//var phone = sharedState.get("telephoneNumber");
function isEmail(input) {
        var emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(input);
    }

function isPhoneNumber(input) {
        var phonePattern = /^\+\d{9,}$/;
        return phonePattern.test(input);
//return true;
    }

if (isEmail(userInput)) {
//logger.error("in email loop");
        outcome="email";
    } 
else if (isPhoneNumber(userInput)) {
//logger.error("in phone loop");

        outcome="phone";
    } 
else {
        // Handle invalid input
//logger.error("in invalid loop");
        outcome="invalid";
    }



logger.error("Shared State : "+sharedState);
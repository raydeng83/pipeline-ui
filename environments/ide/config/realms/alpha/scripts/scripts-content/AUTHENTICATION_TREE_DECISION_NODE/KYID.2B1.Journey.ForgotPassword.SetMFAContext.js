// /*
//   - Data made available by nodes that have already executed are available in the sharedState variable.
//   - The script should set outcome to either "true" or "false".
//  */

// // Function to log shared state values for debugging
function logSharedState() {
}

// Function to set shared state values
function setSharedState() {
    var isMFARequired = "True";
    var requiredMFAMethodCode = 3;
    var isRegistrationAllowed = "false";

    // nodeState.putShared("isMFARequired", isMFARequired);
    // nodeState.putShared("requiredMFAMethodCode", requiredMFAMethodCode);
    // nodeState.putShared("IsRegistrationAllowed", isRegistrationAllowed);

    var setMFAContextJSON = {
                    "user": nodeState.get("mail"),
                    "isMFARequired": "True",
                    "requiredMFAMethodCode": 3,
                    "isRegistrationAllowed":  "false"
                }

                nodeState.putShared("setMFAContext",setMFAContextJSON);
}

// // Function to determine outcome
// function determineOutcome() {
//     // Example logic to set the outcome. You can customize this as needed.
//     var outcome = "true"; // Placeholder for actual outcome logic
//     return outcome;
// }

// Main execution
setSharedState(); // Set values in shared state
logSharedState(); // Log shared state values

// // Determine the outcome
// var outcome = determineOutcome();

// // Set the outcome in the shared state
// nodeState.putShared("outcome", outcome);

// // Log the result



outcome = "true"



// var dateTime = new Date().toISOString();
// var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// var nodeConfig = {
//     begin: "Begining Node Execution",
//     node: "Node",
//     nodeName: "Verification Options",
//     script: "Script",
//     scriptName: "KYID.2B1.Journey.Update.Profile.Verification.Options",
//     timestamp: dateTime,
//     end: "Node Execution Completed"
// };

// var NodeOutcome = {
//     NEXT: "next",
//     BACK: "back",
//     EMAIL: "email",
//     VISIT: "visit",
//     SKIP: "skip"
// };

// var nodeLogger = {
//     debug: function (message) { logger.debug(message); },
//     error: function (message) { logger.error(message); },
//     info: function (message) { logger.info(message); }
// };

// function main(){
//     try{
//         if (callbacks.isEmpty()) {
//           //callbacksBuilder.textOutputCallback(0, 'Select an option below to verify'); 
//           var jsonobj = {"pageHeader": "2_Select_Verification_Options"};
//           callbacksBuilder.textOutputCallback(1, JSON.stringify(jsonobj));
//           var prompt =  "Select an option below to verify"
//           var value1 = ["Knowledge based questions"]
//             if(value1!=null){
//                 logger.debug("inside choice callback")
//                callbacksBuilder.choiceCallback(`${prompt}`, value1, 0 ,false) 
//             }
//           callbacksBuilder.confirmationCallback(0, ["Next", "back"], 0);
//         }else{
//           var selectedOutcome = callbacks.getConfirmationCallbacks()[0];
//           var choiceOutcome = callbacks.getChoiceCallbacks().get(0)[0];
//             logger.debug("selectedOutcome ::: "+ selectedOutcome)
//             logger.debug("choiceOutcome ::: "+ choiceOutcome)
//             if(selectedOutcome === 0){
//                 if(choiceOutcome == 0){
//                      action.goTo(NodeOutcome.NEXT);  
//                 }
//             }/*else if(selectedOutcome === 1){
//                 nodeState.putShared("skipped","true")
//                 action.goTo(NodeOutcome.SKIP);     
//             }*/
//             else if(selectedOutcome === 1){
//                 nodeState.putShared("isback", true)
//                 nodeState.putShared("IDProofingAnotherMethod","true")
//                 action.goTo(NodeOutcome.BACK);  
//             }
//         }
//     }catch(error){
//     }

// }

// main()
action.goTo("next")
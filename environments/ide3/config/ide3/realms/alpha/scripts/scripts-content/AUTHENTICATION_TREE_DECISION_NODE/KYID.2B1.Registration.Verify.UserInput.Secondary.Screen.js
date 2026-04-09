/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
//var firstbackretrylimit = nodeState.get("firstbackretrylimit");
var differentemailretrylimit = nodeState.get("differentemailretrylimit");
var userInput = nodeState.get("userInput");
logger.debug("userInput 1 : "+userInput);
if(userInput === "back"){
    logger.debug("userInput 2 : "+userInput);
    action.goTo("true");
} 
    else if(differentemailretrylimit === "true"){
 action.goTo("true");
 }
//    else if(firstbackretrylimit === "true"){
// action.goTo("true");
// }
else{
    logger.debug("going through false");
    action.goTo("false");
}
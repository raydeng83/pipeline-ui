/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

function main(){

    var txid = null;
    var errMsg = "null";
    logger.debug("Inside KYID.2B1.Journey.ShowErrorMessage")
    
    try{
       txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));  

       if(nodeState.get("readErrMsgFromCode")!=null && nodeState.get("readErrMsgFromCode")){
           errMsg = JSON.stringify(nodeState.get("readErrMsgFromCode"));
       }
    
       if(callbacks.isEmpty()) { 
            callbacksBuilder.textOutputCallback(0, errMsg); 
       } else {
            action.goTo("True");
       }  
        
    } catch(error){
        logger.error("Exception caught - "+error);
        action.goTo("True");
    }     
}

//Invoke Main Function
main();
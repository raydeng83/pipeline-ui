/**
* Script: KYID.2B1.Journey.checkValidSessionExistOrNot
* Description: This script is used to check existing session of the user.
* Param(s):
* Input:
*                  
*                
* Returns: 
* Date: 6th August 2024
* Author: Deloitte
*/

var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "Is Session Exist",
    script: "Script",
    scriptName: "KYID.2B1.Journey.checkValidSessionExistOrNot",
    begin: "Begin Function Execution", 
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed" 
 };

 // Node outcomes
 var nodeOutcome = {
     SESSION_EXIST: "hasSession",
     SESSION_NOTEXIST: "noSession",
     BYPASS: "byPass"
 };


function main(){

    //Function Name
    nodeConfig.functionName = "main()";

    //Local Variables
    var txid = null;
    var nodeLogger = null;
    var errMsg = null;
    logger.error("journeyName is :: => "+ nodeState.get("journeyName"))
    
    try {

   if(requestHeaders.get("accept-language") && requestHeaders.get("accept-language")!=null){
                logger.debug("requestHeaders is :: " + requestHeaders.get("accept-language"))
                var userLanguageUser = requestHeaders.get("accept-language");
                var userLanguage = userLanguageUser[0];
                if(userLanguage.includes("es-ES")){
                    nodeState.putShared("userLanguage","es")
                }else{
                    nodeState.putShared("userLanguage","en")
                }
        }
        
         txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId")); 
         logger.debug("txid is - "+txid+" | "+typeof txid)
         nodeLogger = require("KYID.2B1.Library.Loggers");
         nodeLogger.log("debug", nodeConfig, "begin", txid);
        
         if(typeof existingSession != 'undefined'){
            nodeLogger.log("debug", nodeConfig, "end", txid); 
            action.goTo(nodeOutcome.SESSION_EXIST);      
             
         }else if(nodeState.get("journeyName")==="RIDP_LoginMain" || nodeState.get("firsttimeloginjourney") == "true"){
             action.goTo(nodeOutcome.BYPASS);  
         }else{
            nodeLogger.log("error", nodeConfig, "end", txid); 
            errMsg = nodeLogger.readErrorMessage("KYID103"); 
            nodeState.putShared("readErrMsgFromCode",errMsg);
            nodeLogger.log("error", nodeConfig, "mid", txid, JSON.stringify(errMsg)); 
            //var KOGID = "00a62039-bd29-4a40-9bb9-adbbc07017cc";
            //nodeState.putShared("KOGID",KOGID);
            action.goTo(nodeOutcome.SESSION_NOTEXIST);  
         }
    
    } catch(error){
        nodeLogger.log("error", nodeConfig, "mid", txid, error);
        action.goTo(nodeOutcome.SESSION_NOTEXIST);
    }
}

//Invoke Main Function
main();


/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Navigate RIDP Method",
    script: "Script",
    scriptName: "KYID.2B1.Journey.RIDP.Method.Decision",
    emptyhandleResponse: "In Function emptyhandleResponse",
    handleResponse: "In Function handleResponse",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
   LexisNexisKBA: "LexisNexisKBA",
   LexisNexisVerification: "LexisNexisVerification",
   CMSEXPERIAN: "CMSEXPERIAN",
   SSA: "SSA"
};

var nodeLogger = {
    debug: function (message) { logger.debug(message); },
    error: function (message) { logger.error(message); },
    info: function (message) { logger.info(message); }
};


function main(){ 
    var proofingMethod = null;
    logger.debug("journeName1 in KYID.2B1.Journey.RIDP.Method.Decision :: " + nodeState.get("journeyName"))
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin);
    try{
       if(nodeState.get("journeyName")==="forgotEmail" || nodeState.get("context") === "appEnroll"|| nodeState.get("journeyName")==="forgotPassword" || nodeState.get("journeyName")==="MFARecovery" || nodeState.get("journeyName")==="accountRecovery" || nodeState.get("journeyName") === "RIDP_LoginMain" ){
            proofingMethod = "4";
        }else if(nodeState.get("journeyName")==="updateprofile" || nodeState.get("journeyName")==="organdonor"){
           logger.error("orig_proofingMethod is "+ nodeState.get("orig_proofingMethod"))
            proofingMethod = nodeState.get("orig_proofingMethod") || nodeState.get("proofingMethod");
           logger.error("proofingMethod is -------- "+ proofingMethod)
           if(proofingMethod == "2"){
               proofingMethod = "4"
           } 
           else if(proofingMethod !== "1" && proofingMethod !== "-1"){
                proofingMethod = "4"
            }else if(proofingMethod == "-1"){
                proofingMethod = "1"
            }
        }else{
            logger.debug("Proofing method will be 1")
            proofingMethod = "1";
        }
        
        if(nodeState.get("context")==="appEnroll"){
            if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
                nodeState.putShared("RidpMethod","LexisNexisKBA")
                nodeState.putShared("proofingMethod",proofingMethod)
                nodeState.putShared("RIDPMethodUsed","LexisNexisKBA")
                action.goTo(NodeOutcome.LexisNexisKBA)
            }else if(nodeState.get("appEnrollRIDPMethod")==="CMS"){
                proofingMethod = "2"
                nodeState.putShared("proofingMethod",proofingMethod)
                if(nodeState.get("ssn")!== null && nodeState.get("ssn")!== "" && nodeState.get("ssn")){
                    nodeState.putShared("RidpMethod","SSA")
                    nodeState.putShared("appEnrollRIDPMethod","SSA")
                    nodeState.putShared("RIDPMethodUsed","SSA")
                    action.goTo(NodeOutcome.SSA)
                }else{
                    nodeState.putShared("appEnrollRIDPMethod","Experian")
                    nodeState.putShared("RidpMethod","CMSEXPERIAN")
                    nodeState.putShared("RIDPMethodUsed","CMSEXPERIAN")
                    action.goTo(NodeOutcome.CMSEXPERIAN); 
                }  
            }
        }else{
            nodeState.putShared("proofingMethod",proofingMethod)
            logger.debug("proofingMethod in KYID.2B1.Journey.RIDP.Method.Decision is :: "+ proofingMethod)
            logger.debug("journeyName1 in KYID.2B1.Journey.RIDP.Method.Decision :: " + nodeState.get("journeyName"))
            if(!nodeState.get("journeyName")){
                nodeState.putShared("journeyName","RIDP_LoginMain")
            }
            if(nodeState.get("journeyName").toLowerCase() === "createaccount" || nodeState.get("journeyName").toLowerCase() === "firsttimelogin"){
                logger.debug("journeyName in KYID.2B1.Journey.RIDP.Method.Decision :: " + nodeState.get("journeyName"))
                nodeState.putShared("RidpMethod","LexisNexisVerification")
                nodeState.putShared("RIDPMethodUsed","LexisNexisVerification")
                action.goTo(NodeOutcome.LexisNexisVerification)
            }else if(nodeState.get("journeyName").toLowerCase() === "forgotemail" || nodeState.get("journeyName").toLowerCase() === "forgotpassword" || nodeState.get("journeyName").toLowerCase() === "mfarecovery" || nodeState.get("journeyName").toLowerCase() === "accountrecovery" || nodeState.get("journeyName") === "RIDP_LoginMain"){
                nodeState.putShared("RidpMethod","LexisNexisKBA")
                nodeState.putShared("RIDPMethodUsed","LexisNexisKBA")
                action.goTo(NodeOutcome.LexisNexisKBA)
            }else if(nodeState.get("journeyName").toLowerCase() === "updateprofile" || nodeState.get("journeyName").toLowerCase() === "organdonor"){
                logger.debug("proofingMethod "+ proofingMethod)
                nodeState.putShared("MCISync","true")
                nodeState.putShared("validationMessage", null);
                if(proofingMethod == "1" || proofingMethod == "-1"){
                    nodeState.putShared("RidpMethod","LexisNexisVerification")
                    nodeState.putShared("RIDPMethodUsed","LexisNexisVerification")
                    nodeState.putShared("proofingMethod",proofingMethod)
                    action.goTo(NodeOutcome.LexisNexisVerification)
                }else if(proofingMethod == "4" || proofingMethod == "2"){
                    nodeState.putShared("RidpMethod","LexisNexisKBA")
                    nodeState.putShared("RIDPMethodUsed","LexisNexisKBA")
                    nodeState.putShared("proofingMethod",proofingMethod)
                    action.goTo(NodeOutcome.LexisNexisKBA)
                }else{
                    nodeState.putShared("RidpMethod","LexisNexisKBA")
                    nodeState.putShared("RIDPMethodUsed","LexisNexisKBA")
                    action.goTo(NodeOutcome.LexisNexisKBA)
                }
                                
            }
        }
    }catch(error){
         nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + error);
    }
}

main();
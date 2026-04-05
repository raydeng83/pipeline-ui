/**
 * Script: KYID.Journey.IsMFARequiredWhilePerfTest
 * Description:  This script is used to check if MFA required while perf test          
 * Date: 1 Oct 2025
 * Author: Deloitte
 **/

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
   var nodeConfig = {
     begin: "Begining Node Execution",
     node: "Node",
     nodeName: "Is MFA Required Perf Test",
     script: "Script",
     scriptName: "KYID.2B1.Journey.IsMFARequiredPerfTest",
     timestamp: dateTime,
     end: "Node Execution Completed"
 };

// Node outcomes
var nodeOutcome = {
    PerfON: "perfon",
    PerfOFF: "perfoff"
};


// Declare Global Variables
 var missingInputs = [];
 var isperftest = "true";

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

if(systemEnv.getProperty("esv.perftest.2b") && systemEnv.getProperty("esv.perftest.2b")!=null) { 
    isperftest = systemEnv.getProperty("esv.perftest.2b");   
    nodeLogger.error("Value of isperftest: "+isperftest)
}  

try{
   if(isperftest.localeCompare("true")==0){
       nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::PerfTestON::DisableEvaluateRisk");  
       nodeState.putShared("riskLevel","LOW")
       action.goTo(nodeOutcome.PerfON);
    } else {
       nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::PerfTestOFF::EvaluateRiskEnabled");  
       action.goTo(nodeOutcome.PerfOFF);
    } 
} catch(error) {
    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+error);
}
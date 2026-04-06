/**
* Name: KYID.2B1.Library.Loggers
*
* Description: This library script is used to log scripting logs.
*
* Functions: 
* 1) getLogger(<Parameters>)
*           Mandatory Parameters/Arguments: 
*                   type <String>  => Specifies type of log. **Note:: Acceptable values are - audit, debug, error, info
*                                     audit: To record audit log entries within scripts for security and compliance purposes
*                                     debug: To record detailed information to assist in troubleshooting and identifying issues during development or testing
*                                     error: To record errors during script execution  
*                                     info: To record information logs during script execution  
*                   nodeconfig <Object>  => Specifies journey node configuration details
*                   stage <String> => Specifies begining or end of node execution. **Note::Acceptable values are - "begin", "end", "".
*                   transactionid <String> => Specifies transaction id of journey       
*
*           Optional Parameters:  
*                   message <String> => specifies debug, audit, error, info message details
*
* 2) readErrorMessage(<Parameters>) 
*                   
*
* Invoke Library Function:
*               var nodeLogger = require("KYID.2B1.Library.Loggers");
*
*           Examples: 
*                1) var logInfo = nodeLogger.log("audit", nodeconfig, begin, transactionid, message);
*
*                2) var logInfo = nodeLogger.log("debug", nodeconfig, end, transactionid, message);
*
*                3) var logInfo = nodeLogger.log("error", nodeconfig, begin, transactionid, message);
*
*                4) var logInfo = nodeLogger.log("info", nodeconfig, begin, transactionid, message);
*
* Author: Deloitte
*/


//Global Variables
var dateTime = new Date().toISOString();
var resultJSON = {};
var DELIM = "::";
var ops = require("KYID.2B1.Library.IDMobjCRUDops");
var nodeconfigAvailableKeys = ["timestamp","serviceType","serviceName","node","nodeName","script","scriptName","begin","function","functionName","end"];


function log(type, nodeconfig, stage, transactionid, message){

    var params = {};
    var paramFields = [];
    var errorcode = null;
    var errorrecord = null;
    var errorrecordJSONObj = {};
    var resMandInpExistJSONOBj = null;
    var resValidInputParamsJSONOBj = null;
    var LOGGER_KEY_PREFIX = "KYID_2B1_LOGS"
    var LOGGER_KEY_MSG = "Message";
    var LOGGER_KEY_TIMESTAMP = "Timestamp";
    var LOGGER_KEY_TXID = "TransactionId";
    var LOGGER_KEY_SERVICETYPE = "Library";
    var LOGGER_VALUE_SERVICENAME = "KYID.Library.Loggers";
    var readnodeconfigJSON = {};
    var nodeconfigLoggerDetails = "";
    var libScriptLogger = LOGGER_KEY_PREFIX+DELIM+LOGGER_KEY_TIMESTAMP+DELIM
                          +dateTime+DELIM+LOGGER_KEY_SERVICETYPE+DELIM
                          +LOGGER_VALUE_SERVICENAME+DELIM+LOGGER_KEY_MSG+DELIM;
    
    try{
        if(!(message!=null && message)){
            message = "";
        }

        resMandInpExistJSONOBj = JSON.parse(JSON.stringify(isAllMandatoryInputPresent(type, nodeconfig, stage, transactionid)));
        if(resMandInpExistJSONOBj["status"]==="true"){

            resValidInputParamsJSONOBj = JSON.parse(JSON.stringify(isValidInputParams(type, nodeconfig, stage, transactionid)));
            if(resValidInputParamsJSONOBj["status"]==="true"){
                readnodeconfigJSON = JSON.parse(JSON.stringify(nodeconfig));
                
                if(stage==="begin"){
                     nodeconfigLoggerDetails = LOGGER_KEY_PREFIX+DELIM+LOGGER_KEY_TXID+DELIM+transactionid+DELIM
                         +LOGGER_KEY_TIMESTAMP+DELIM+readnodeconfigJSON["timestamp"]+DELIM
                         +readnodeconfigJSON["serviceType"]+DELIM+readnodeconfigJSON["serviceName"]+DELIM
                         +readnodeconfigJSON["node"]+DELIM+readnodeconfigJSON["nodeName"]+DELIM
                         +readnodeconfigJSON["script"]+DELIM+readnodeconfigJSON["scriptName"]+DELIM
                         +readnodeconfigJSON["begin"]+DELIM
                         +readnodeconfigJSON["function"]+DELIM+readnodeconfigJSON["functionName"];
                
                } else if(stage==="mid"){
                    nodeconfigLoggerDetails = LOGGER_KEY_PREFIX+DELIM+LOGGER_KEY_TXID+DELIM+transactionid+DELIM
                         +LOGGER_KEY_TIMESTAMP+DELIM+readnodeconfigJSON["timestamp"]+DELIM
                         +readnodeconfigJSON["serviceType"]+DELIM+readnodeconfigJSON["serviceName"]+DELIM
                         +readnodeconfigJSON["node"]+DELIM+readnodeconfigJSON["nodeName"]+DELIM
                         +readnodeconfigJSON["script"]+DELIM+readnodeconfigJSON["scriptName"]+DELIM
                         +readnodeconfigJSON["function"]+DELIM+readnodeconfigJSON["functionName"]+DELIM
                         +LOGGER_KEY_MSG+DELIM;
                    
                } else if(stage==="end"){
                    nodeconfigLoggerDetails = LOGGER_KEY_PREFIX+DELIM+LOGGER_KEY_TXID+DELIM+transactionid+DELIM
                         +LOGGER_KEY_TIMESTAMP+DELIM+readnodeconfigJSON["timestamp"]+DELIM
                         +readnodeconfigJSON["serviceType"]+DELIM+readnodeconfigJSON["serviceName"]+DELIM
                         +readnodeconfigJSON["node"]+DELIM+readnodeconfigJSON["nodeName"]+DELIM
                         +readnodeconfigJSON["script"]+DELIM+readnodeconfigJSON["scriptName"]+DELIM
                         +readnodeconfigJSON["end"]+DELIM
                         +readnodeconfigJSON["function"]+DELIM+readnodeconfigJSON["functionName"];
                }
                
                switch (type.toLowerCase()) {
                  case "audit": 
                    logger.audit(nodeconfigLoggerDetails+message);
                    break;
            
                  case "debug":
                    logger.debug(nodeconfigLoggerDetails+message);
                    break;
            
                  case "error":
                    logger.error(nodeconfigLoggerDetails+message);
                    break;

                  case "info":
                    logger.info(nodeconfigLoggerDetails+message);
                    break;      
            
                  default:
                    throw new Error(libScriptLogger+"Invalid logger type '" + type + "'");
                }
            
            } else {
                logger.error(libScriptLogger+"Invalid value provided for the following arguments - "+resValidInputParamsJSONOBj["invalidParamValue"]);
            }
        
        } else {
            logger.error(libScriptLogger+"Following mandatory arguments are missing - "+resMandInpExistJSONOBj["missingParamDetails"]);
        } 
        
    } catch (error) {
          logger.error(libScriptLogger+error);
    }
}


// To check whether all the mandatory input parameters(arguments) are present or not
function isAllMandatoryInputPresent(type, nodeconfig, stage, txid){

    var missingInputArray = [];
    var resultArray = {};

    if(!(type!=null && type)){
        missingInputArray.push("type");
    }

    if(!(nodeconfig!=null && nodeconfig)){
        missingInputArray.push("nodeconfig");
    }

    if(!(stage!=null && stage)){
        missingInputArray.push("stage");
    }

    if(!(txid!=null && txid)){
        missingInputArray.push("transactionid");
    }
    
    if(missingInputArray.length>0){
         resultArray["status"] = "false";  
         resultArray["missingParamDetails"] = missingInputArray; 
    } else {
        resultArray["status"] = "true"; 
    }

    return resultArray;
}


// To check whether values provided to input parameters are valid or not
function isValidInputParams(type, nodeconfig, stage, txid){

    var invalidInputArray = [];
    var resultArray = {};
    var nodeconfigInputKeys = null;
    
     if(!(type==="audit" || type==="debug" || type==="error" || type==="info")){
         invalidInputArray.push("type");
     }

     if(isValidJSON(nodeconfig)){ 
        nodeconfigInputKeys = Object.keys(nodeconfig);
        if(!(isValidJSONStructure(nodeconfigAvailableKeys, nodeconfigInputKeys))){ 
            invalidInputArray.push("nodeconfig");
        }
     } else {
        invalidInputArray.push("nodeconfig");
     } 
    
     if(!(stage==="begin" || stage==="end" || stage==="mid")){ 
        invalidInputArray.push("stage");
     }
                   
     if(!(typeof txid === "string")){
         invalidInputArray.push("transactionid");
     }

     if(invalidInputArray.length>0){
         resultArray["status"] = "false";  
         resultArray["invalidParamValue"] = invalidInputArray; 
    } else {
        resultArray["status"] = "true"; 
    }

    return resultArray; 
}


// To check whether provided input is valid JSON object or not
function isValidJSON(inputData){
    
    if((inputData!=null && inputData) && typeof (inputData) === 'object'){
        if(!(Array.isArray(inputData))){
            //logger.error("It's a JSON object.");    
            return true;
        } else {
            //logger.error("It's not a JSON object.");  
            return false;
        }  
    } else {
        //logger.error("It's not a JSON object.");  
        return false;
    }
}


// To check whether provided input JSON object has all the required keys
function isValidJSONStructure(availableArray, inputArray){

     availableArray = Array.sort(availableArray);
     inputArray = Array.sort(inputArray);

    // To check whether two arrays are equal.
     for (var i = 0; i < availableArray.length; i++) {
         if (availableArray[i] !== inputArray[i]) {
            return false;
          }
     }
     return true;
}


// To get all locale error messages corresponding to errorcode
function readErrorMessage(errorcode){

    //Local Variables
    var params = {};
    var paramFields = [];
    var errorrecord = null;
    var errorrecordJSONObj = {};
    var LOGGER_KEY_MSG = "Message";
    var LOGGER_KEY_TIMESTAMP = "Timestamp";
    var LOGGER_KEY_PREFIX = "KYID_2B1_LOGS"
    var LOGGER_KEY_SERVICETYPE = "Library";
    var LOGGER_VALUE_SERVICENAME = "KYID.Library.Loggers";
    var libScriptLogger = LOGGER_KEY_PREFIX+DELIM+LOGGER_KEY_TIMESTAMP+DELIM
                          +dateTime+DELIM+LOGGER_KEY_SERVICETYPE+DELIM
                          +LOGGER_VALUE_SERVICENAME+DELIM+LOGGER_KEY_MSG+DELIM;
    
    try{
        params["key"] = "errorcode";
        params["ops"] = "eq";
        params["value"] = errorcode;
        paramFields.push("errormsg");
        errorrecord = ops.crudOps("query", "alpha_kyid_errormessages", null, params, paramFields, null);
        //logger.error(libScriptLogger+JSON.stringify(errorrecord.result[0]));
        
        if(JSON.stringify(errorrecord.result[0]).length>2){
            errorrecordJSONObj = JSON.parse(JSON.stringify(errorrecord.result[0]));
            //logger.error(libScriptLogger+JSON.stringify(errorrecordJSONObj["errormsg"]));
            return errorrecordJSONObj["errormsg"];
            
        } else {
            return errorrecordJSONObj;
        } 
        
    } catch(error){
        logger.error(libScriptLogger+error);
    }
}


exports.log = log;
exports.readErrorMessage = readErrorMessage;



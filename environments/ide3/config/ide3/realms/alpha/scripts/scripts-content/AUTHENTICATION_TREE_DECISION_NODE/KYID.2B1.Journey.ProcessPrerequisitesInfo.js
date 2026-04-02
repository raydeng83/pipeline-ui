/**
 * Script: KYID.2B1.Journey.ProcessPrerequisitesInfo
 * Description: This script is used to process prerequisite information.
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "Process Prerequisite Form Values",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ProcessPrerequisitesInfo",
    begin: "Begining Node Execution",
    missingUserSessionDetails: "UserID doesn't exist in session",
    missingPrerequisites: "Prerequisite details are not available",
    createExtIdentitySuccess: "Successfully created record in an external identity managed object",
    createExtIdentityFail: "Failed to create record in an external identity managed object",
    createCredentialSuccess: "Successfully created record in credential managed object",
    createExtIdentityFail: "Failed to create record in credential managed object",
    removeExtIdentityDataResponse: "Successfully removed record from an external identity managed object",
    removeExtIdentityDataFail: "Fail to remove record from an external identity managed object",
    function: "Function",
    functionName: "",
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    NEXT: "Next",
    BACK: "Back",
    ERROR: "No",
    PREREQ_STATUS: "Pending"
};


//Global Variables
var ERRJSON = [];


function getAllPrereqFormAttrs(uuid,type) {

    var endptReqJSONObj = {};
    try { 
          recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity", { "_queryFilter" : 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '"'}, ["attributeName","attributeValue"]);
          //logger.debug("RLogs::Successfully retrieved alpha_kyid_extendedIdentity custom object attributes :: "+JSON.stringify(recordSubmittedPreqreqPage.result[0]));
          recordSubmittedPreqreqPageArray =  JSON.parse(JSON.stringify(recordSubmittedPreqreqPage.result));
          for(var p=0;p<recordSubmittedPreqreqPageArray.length;p++){
              var extIdnJSONObj = null;
              extIdnJSONObj = recordSubmittedPreqreqPageArray[p];
              endptReqJSONObj[extIdnJSONObj["attributeName"]] = extIdnJSONObj["attributeValue"];
          }
       
    } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_extendedIdentity custom object attributes, Exception: '+ error);
    }
    
    return JSON.stringify(endptReqJSONObj);
}


function patchPrerequisiteRequestStatus(id,userID,type,status){
    logger.debug("Inside patchPrerequisiteRequestStatus")

    var recordRequest = null; 
    var requestObjResp = null;
    var recordRequestJSONObj = {};
    var content = {};
    var contentArray = [];
    var ops = require("KYID.2B1.Library.IDMobjCRUDops");
    
    try{
        recordRequest = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
            + 'and type eq "'+type+'"' 
            + 'and requester eq "'+userID+'"'}, ["contextid", "type", "requester", "status"]);
        logger.debug("Successfully queried record in alpha_kyid_request managed object :: "+JSON.stringify(recordRequest));
        recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result[0]));
        logger.debug("Resource ID - "+recordRequestJSONObj["_id"]);
        
        contentArray.push({
           "operation" : "replace",
           "field" : "status",
            "value" : status
        }) ;

        contentArray.push({
           "operation" : "replace",
            "field" : "updatedate",
            "value" : dateTime
        }) ;
 
        ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, recordRequestJSONObj["_id"]);
        patchPrerequisiteRequestStepStatus(recordRequestJSONObj["_id"],status);
        
    } catch(error){
         logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }  
}


function patchPrerequisiteRequestStepStatus(id,status){
    logger.debug("Inside patchPrerequisiteRequestStepStatus")

    var recordRequestSteps = null; 
    var recordRequestStepsJSONObj = {};
    var content = {};
    var contentArray = [];
    var timestamp = new Date().toISOString();
    var ops = require("KYID.2B1.Library.IDMobjCRUDops");
    
    try{
        recordRequestSteps = openidm.query("managed/alpha_kyid_request_steps", { "_queryFilter" : 'id eq "'+id+'"'}, ["type", "status"]);
        logger.debug("Successfully queried record in alpha_kyid_request_steps managed object :: "+JSON.stringify(recordRequestSteps));
        recordRequestStepsJSONObj = JSON.parse(JSON.stringify(recordRequestSteps.result[0]));
        logger.debug("Resource ID - "+recordRequestStepsJSONObj["_id"]);

        contentArray.push({
               "operation" : "replace",
               "field" : "status",
                "value" : status
            }) ;
    
        contentArray.push({
           "operation" : "replace",
            "field" : "updatedate",
            "value" : timestamp
        }) ;
        ops.crudOps("patch", "alpha_kyid_request_steps", contentArray, null, null, recordRequestStepsJSONObj["_id"]);
        
    } catch(error){
         logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }  
}


function addIdentityInExtIdentityObject(res){

    var addExtIdentityDataResponse = null;
    try{
        addExtIdentityDataResponse = openidm.create("managed/alpha_kyid_extendedIdentity", null, res);
        if(addExtIdentityDataResponse!=null && addExtIdentityDataResponse){
            logger.debug("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                             + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.createExtIdentitySuccess);
        } 
    } catch (error){
        logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.createExtIdentityFail + "::" + error);
    }
    return addExtIdentityDataResponse;
}

function patchExtIdentityObject(res, id, pageNumber, type){

    var patchExtIdentityDataResponse = null;
    var extObj = null;
    var extObjVal = null;
    var _id = null;
    try{
        logger.debug("Inside patchExtIdentityObject "+ id + " "+ pageNumber + " "+ type[0].Name );
        extObj = openidm.query("managed/alpha_kyid_extendedIdentity",{ "_queryFilter" : 'uuid eq "'+id+'"' 
            + 'and prereqType eq "'+type[0].Name+'"'})
        extObjVal = extObj.result;
        logger.debug("extObjVal "+ JSON.stringify(extObjVal))
        extObjVal.forEach(item =>{
            logger.debug("extObjVal.pageNumber "+ item.pageNumber)
            if(item.pageNumber == pageNumber){
                _id = item._id;
                logger.debug("_id is inn "+ _id)
                patchExtIdentityDataResponse = openidm.patch("managed/alpha_kyid_extendedIdentity/"+_id, null, res);
                logger.debug("patchExtIdentityDataResponse is in "+ JSON.stringify(patchExtIdentityDataResponse));
            }  
        })
        if(patchExtIdentityDataResponse!=null && patchExtIdentityDataResponse){
            logger.debug("RLogs:: patchExtIdentityObject"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                             + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.createExtIdentitySuccess);
        } 
    } catch (error){
        logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.createExtIdentityFail + "::" + error);
    }
   // return patchExtIdentityDataResponse;
}


function createIdentityInCredentialObject(credentialObj){

    var addCredentialObjResponse = null;
    try{
        addCredentialObjResponse = openidm.create("managed/alpha_kyid_credentials", null, credentialObj);
        if(addCredentialObjResponse!=null && addCredentialObjResponse){
            logger.debug("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                             + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.createCredentialSuccess);
        } 
    } catch (error){
        logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.createCredentialFail + "::" + error);
    }
    return addCredentialObjResponse;
}


function deleteExistingFormDataFromIDNObj(listOfIDs){
    
    var removeExtIdentityDataResponse = null;
    try{
        for(var i=0; i<listOfIDs.length; i++){
            removeExtIdentityDataResponse = openidm.delete("managed/alpha_kyid_extendedIdentity/"+listOfIDs[i], null);
             if(removeExtIdentityDataResponse!=null && removeExtIdentityDataResponse){
                 logger.debug("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                             + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.removeExtIdentityDataResponse);
             } 
        }

    } catch (error){
        logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.removeExtIdentityDataFail + "::" + error);
    }
}


//To check if request contains same number of form fields with same number of field properties
function isAllPageFieldsPresent(value,metadata) {

    var propsCounter = 0;
    var nameOfAllFieldsInAPIRequest = [];
    var nameofAllFieldsInSharedStateMetadata = [];
    
    try {
        var rawFormData = JSON.parse(value);
        var rawFormDataArray = JSON.parse(JSON.stringify(rawFormData.pages));       
        
        for(var i=0;i<rawFormDataArray.length;i++){
            var rawFieldData = null;
            var pageNumber = null;
            rawFieldData = JSON.parse(JSON.stringify(rawFormDataArray[i]));
            pageNumber = rawFieldData["pageNumber"];
            
            if(pageNumber === metadata["pagenumber"]){
                var data = rawFieldData["fields"];        
                
                if(data.length === metadata["nooffields"]){ //Validates total number of fields in a form 
                    nameofAllFieldsInSharedStateMetadata = metadata["fieldPropsList"];
                    
                    for(var j=0;j<data.length;j++){
                        var jsonObj = null;
                        var resArray = [];
                        nameOfAllFieldsInAPIRequest = [];
                        jsonObj = data[j];
                        nameOfAllFieldsInAPIRequest = Object.keys(jsonObj);        
                        resArray = nameofAllFieldsInSharedStateMetadata.filter(value => !nameOfAllFieldsInAPIRequest.includes(value)); //Validates whether name of fields props are same or not 
                        if(resArray.length===0){
                            ++propsCounter;
                        }
                    }
                    
                    if(propsCounter === data.length){
                        return true;
                    } else {
                        return false;
                    }
                    
                } else {
                    return false;
                }
            } else {
                return false;
            }     
        }
    } catch(error) {
       logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
       return false; 
    }
}


function isValidJSON(value){

    if (typeof value !== "string") {
        return false;
    }
    try {
        JSON.parse(value);
        return true;
    } catch (error) {
        logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
        return false;
    }
}

function validateFormStructure(sysValue, inputValue) {
  var pagesJSONObj;
  var pagesJSONArray;
  var pageFormJSONObj;
  var pageFormJSONArray;
  var fieldJSONObj;
  var sysFieldNames = [];
  var inputFieldNames = [];

  if (!inputValue || !sysValue) {
    logger.debug("Missing inputValue or sysValue");
    return false;
  }

  logger.debug("Inside validateFormStructure True");
  pagesJSONObj = JSON.parse(inputValue);
  pagesJSONArray = pagesJSONObj["pages"];
  pageFormJSONObj = JSON.parse(JSON.stringify(pagesJSONArray[0]));
  pageFormJSONArray = pageFormJSONObj["fields"];

    if(pageFormJSONObj["fields"] === null){
        logger.debug("Inside Training & agreement")
    }


  try {
    for (var i = 0; i < sysValue.length; i++) {
      if (sysValue[i].name) {
        sysFieldNames.push(sysValue[i].name);
      }
    }

    for (var j = 0; j < pageFormJSONArray.length; j++) {
      fieldJSONObj = {};
      fieldJSONObj = JSON.parse(JSON.stringify(pageFormJSONArray[j]));
      inputFieldNames.push(fieldJSONObj["name"]);
    }

    logger.debug("sysFieldNames: " + JSON.stringify(sysFieldNames));
    logger.debug("inputFieldNames: " + JSON.stringify(inputFieldNames));

    if (sysFieldNames.length !== inputFieldNames.length) {
      logger.debug("Inside validateFormStructure False");
      return false;
    }

    sysFieldNames.sort();
    inputFieldNames.sort();
      
    for (var k = 0; k < sysFieldNames.length; k++) {
      if (sysFieldNames[k] !== inputFieldNames[k]) {
        return false;
      }
    }
    logger.debug("Inside validateFormStructure True");
    return true;
  } catch (error) {
    logger.error("validation error" + error.message);
    return false;
  }
}


function validateForm(sysValue,inputValue,metadata){

    var type = null;
    var pageMetadata = {};
    var userInfo = {};
    var sysInfo = null;
    var fieldJSONObj = {};
    var sysFieldJSONObj = {};
    var validationArray = null;
    var optionsArray = null;
    var response = {};
    var profileFieldsArray = null;
    var pagesJSONObj = null;
    var pagesJSONArray = null;
    var pageFormJSONObj = null;
    var pageFormJSONArray = null;
    var validationResp = null;
    var portalData = require("KYID.Library.Validations");
    var formStructure = null;
    
    try{
        if(inputValue!=null && inputValue){
           if(isValidJSON(inputValue)){
                formStructure = validateFormStructure(sysValue,inputValue);
                if(formStructure){
                        pageMetadata = JSON.parse(metadata);
                        //if(isAllPageFieldsPresent(inputValue,pageMetadata)){
                        logger.debug("*Inside isAllPageFieldsPresent*") 
                        pagesJSONObj = JSON.parse(inputValue);
                        pagesJSONArray = pagesJSONObj["pages"];
                        pageFormJSONObj = JSON.parse(JSON.stringify(pagesJSONArray[0]));
                        pageFormJSONArray = pageFormJSONObj["fields"];
                        logger.debug("****pageFormJSONArray****"+ pageFormJSONArray.length);
                    
                        for(var i=0; i<sysValue.length; i++){
                            sysFieldJSONObj = {};
                            validationArray = null;
                            optionsArray = null;
                            sysInfo = {};
                            sysFieldJSONObj = JSON.parse(JSON.stringify(sysValue[i]));
                            validationArray = sysFieldJSONObj["validation"];
                            type = sysFieldJSONObj["type"];
                            
                            if(type === "select" || type === "radio" || type === "multicheckbox" || type === "checkbox"){
                                optionsArray = sysFieldJSONObj["options"];
                                logger.debug("****optionsArray****"+ JSON.stringify(optionsArray));
                            }  
                            logger.debug("sysAttribute "+ sysFieldJSONObj["sysAttribute"]);
                            
                            if(sysFieldJSONObj["sysAttribute"]  !== ""){
                                sysInfo["sysAttribute"] = sysFieldJSONObj["sysAttribute"];
                                sysInfo["value"] = sysFieldJSONObj["value"];
                                logger.debug("sysInfoVal is: "+JSON.stringify(sysInfo))
                            }   
                                
                            for(var j=0; j<pageFormJSONArray.length; j++){ 
                                logger.debug("****pageFormJSONArray****"+ pageFormJSONArray.length);
                                    fieldJSONObj = {};
                                    userInfo = {};
                                    validationResp = null;
                                    fieldJSONObj = JSON.parse(JSON.stringify(pageFormJSONArray[j]));
                                
                                    if(sysFieldJSONObj["name"]===fieldJSONObj["name"]){
                                        logger.debug("************Name matches"+sysFieldJSONObj["fieldFormat"]);
                                        userInfo["isReadOnly"] = fieldJSONObj["isReadOnly"];
                                        userInfo["sysAttribute"] = fieldJSONObj["sysAttribute"];
                                        userInfo["value"] = fieldJSONObj["value"];
                                        userInfo["name"]  = fieldJSONObj["name"];
    
                                        
                                        userInfo["fieldFormat"] = sysFieldJSONObj["fieldFormat"];
                                        if(optionsArray!=null){
                                            validationResp = portalData.validate(userInfo,null,type,validationArray,optionsArray);
                                            logger.debug("validationResp is : "+JSON.stringify(validationResp))
                                            if(validationResp["status"] === "success"){
                                                logger.debug(validationResp["message"]);  
                                            } else {
                                                
                                                logger.debug(validationResp["message"]);  
                                                logger.debug("validationResp outcome: "+validationResp["message"])
                                                ERRJSON.push(validationResp["message"]); 
                                            }
                                        
                                        } else {
                                            logger.debug("SYSINFO is"+ sysInfo)
                                            validationResp = portalData.validate(userInfo,sysInfo,type,validationArray,optionsArray);
                                            logger.debug("validationResp is : "+JSON.stringify(validationResp))
                                            if(validationResp["status"] === "success"){
                                                logger.debug(validationResp["message"]);  
                                            } else {
                                                logger.debug(validationResp["message"]);  
                                                ERRJSON.push(validationResp["message"]); 
                                            }
                                        }       
                                   }                            
                              }          
                        }
                }
                else{
                     //response["code"] = "ERR00XX3";
                response["status"] = "Bad Request";
                response["message"] = "Invalid Response Values";
                logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(response));
                ERRJSON.push(response);
                }
                
            } else {
                //response["code"] = "ERR00XX3";
                response["status"] = "Bad Request";
                response["message"] = "Not a valid JSON format";
                logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(response));
                ERRJSON.push(response);
            }
            
        } else {
            //response["code"] = "ERR00XX4";
            response["status"] = "Bad Request";
            response["message"] = "Missing required input data";
            logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + JSON.stringify(response));
            ERRJSON.push(response);
        }
        
    } catch(error){
         //response["code"] = "ERR00XX5";
         response["status"] = "Exception";
         response["message"] = error.message;
         logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
        ERRJSON.push(response);
    }
        
    return ERRJSON;
    
}


function formatToValidJSONString(inputData){

    try {
        var formattedJSON = inputData.replace(/\\/g, '');
        formattedJSON = formattedJSON.substring(1,formattedJSON.length-1);
        logger.debug("RLogs::Formatted JSON Form Fields Values: "+formattedJSON);
        return formattedJSON;
        
    } catch(error) {
        logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error); 
    }   
}


function isEndpointValidationSuccess(uuid,usrPageInfo,sysEndptResponseMapKeys){

    var count = 0;
    var pagesJSONObj = null;
    var pagesJSONArray = null;
    var resmapJSONObj = null;
    var usrEndptResponseMapKeys = null;
    var credentialsJSON = {};
    
    try {

        pagesJSONObj = JSON.parse(usrPageInfo);
        pagesJSONArray = pagesJSONObj["pages"];
        resmapJSONObj = pagesJSONArray[0];
        usrEndptResponseMapKeys = Object.keys(resmapJSONObj["responseDetails"]);
        sysEndptResponseMapKeys.sort();
        usrEndptResponseMapKeys.sort();
        resmapJSONObj = resmapJSONObj["responseDetails"];
        logger.debug("usrEndptResponseMapKeys.sort() - "+usrEndptResponseMapKeys.sort());
        logger.debug("sysEndptResponseMapKeys.sort() - "+sysEndptResponseMapKeys.sort());

        if(sysEndptResponseMapKeys.length>0){
            for(var i = 0; i < sysEndptResponseMapKeys.length; i++) {
              if(sysEndptResponseMapKeys[i] === usrEndptResponseMapKeys[i]) {
                  logger.debug("Keys match");
                  if(resmapJSONObj[usrEndptResponseMapKeys[i]]!=null){
                      ++count;
                  } else {
                      return false;
                  }   
              } else {
                  return false;
              }
            }
            if(count===sysEndptResponseMapKeys.length){
                constructCredentialObject(uuid,resmapJSONObj,sysEndptResponseMapKeys);
                return true;
            }
        }
   
    } catch(error){
        logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
}


function constructCredentialObject(uuid,resmapJSONObj,sysEndptResponseMapKeys){

    var credentialObj = {};
    var createCredentialsResponse = [];
    try {
        for(var i=0; i<sysEndptResponseMapKeys.length;i++){
            credentialObj = {};
            credentialObj["userid"] = uuid;
            credentialObj["createdate"] = new Date().toISOString();
            credentialObj["updatedate"] = new Date().toISOString(); 
            credentialObj["attributeid"] = sysEndptResponseMapKeys[i];
            credentialObj["value"] = resmapJSONObj[sysEndptResponseMapKeys[i]];
             try {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
             var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
              credentialObj['createDate']= auditData.createdDate
             credentialObj['createDateEpoch']= auditData.createdDateEpoch
             credentialObj['createdBy']= auditData.createdBy
             credentialObj['createdByID']= auditData.createdByID
        logger.debug("auditDetail " + JSON.stringify(auditData))
    } catch (error) {
       logger.error("Error Occured : Couldnot find audit details"+ error)

    }
        
            logger.debug("credentialObj - "+JSON.stringify(credentialObj));
            createCredentialsResponse.push(createIdentityInCredentialObject(credentialObj));
        } 
    }catch(error){
        logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                 + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
}

function main(){

    //Function Name
    nodeConfig.functionName = "main()";

    
    //Local Variables
    var errMsg = null;
    var txid = null;
    var nodeLogger = null;
    var formFields = [];
    var res = {};
    var response = {};
    var endptAttrs = {};
    var respFromEndpt = {};
    var pageMetadata = {};
    var pagesJSONObj = {};
    var credentialObj = {};
    var uuid = null;
    var validateResult = null;
    var validateResultArray = [];
    var sysPageInfo = null;
    var usrPageInfo = null;
    var prerequisite = null;
    var selectedOutcome = null;
    var totpagesInPrereq = null;
    var rawPagesDataJSON = null;
    var rawPagesDataArray = null;
    var createExtIDNResponse = [];
    var missingRequiredInputs = [];
    var sysEndptResponseMapKeys = null;
    var usrEndptResponseMapKeys = null;
    var contextID = nodeState.get("prereqContextID");
    var prerequisiterecord = null;
    var roleId = nodeState.get("roleIDinSession")
    var verifyComplete = [];
    
    logger.debug("RLogs::Inside KYID.Journey.ProcessPrerequisitesInfo script main method");
    
    try {
        // logger.error("Inside Try Block");
        // logger.error("Role ID is --> "+ nodeState.get("roleIDinSession"));
        nodeLogger = require("KYID.2B1.Library.Loggers");
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId")); 
        nodeLogger.log("error", nodeConfig.functionName, "begin", txid);

        if(nodeState.get("userIDinSession")!=null && nodeState.get("userIDinSession")){
            uuid =  nodeState.get("userIDinSession");
        } else {
            missingRequiredInputs.push(nodeConfig.missingUserSessionDetails);
        }
    
        if(nodeState.get("prereqtype")!=null && nodeState.get("prereqtype")){
            prerequisite = nodeState.get("prereqtype").toLowerCase();
        } else {
            missingRequiredInputs.push(nodeConfig.missingPrerequisites);
        }
    
        if(nodeState.get("pageMetadata")!=null && nodeState.get("pageMetadata")){
            pageMetadata = nodeState.get("pageMetadata");
        }
    
        if(nodeState.get("sysPageInfo")!=null && nodeState.get("sysPageInfo")){
            sysPageInfo = nodeState.get("sysPageInfo");
        }
        
        if(nodeState.get("usrPageInfo")!=null && nodeState.get("usrPageInfo")){
            usrPageInfo = formatToValidJSONString(nodeState.get("usrPageInfo"));
        }
    
        if(nodeState.get("endptResponseMapKeys")!=null && nodeState.get("endptResponseMapKeys")){
            sysEndptResponseMapKeys = nodeState.get("endptResponseMapKeys");
        }
        
        prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils"); 
        if(nodeState.get("isEndpointPresent") === "true"){
            if(isEndpointValidationSuccess(uuid,usrPageInfo,sysEndptResponseMapKeys)){
                logger.debug("Endpoint validation success");
                res = {};
                res["attributeName"] = "validation";
                res["attributeValue"] = "success";
                res["prereqType"] = prerequisite;
                res["uuid"] = uuid;
                res["pageNumber"] = 1;
                res["source"] = "Portal";

                 try {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
             var auditData = auditDetails.getAuditDetails("CREATE", nodeState)
              res['createDate']= auditData.createdDate
             res['createDateEpoch']= auditData.createdDateEpoch
             res['createdBy']= auditData.createdBy
             res['createdByID']= auditData.createdByID
        logger.debug("auditDetail " + JSON.stringify(auditData))
    } catch (error) {
       logger.error("Error Occured : Couldnot find audit details"+ error)

    }
        
               // createExtIDNResponse.push(addIdentityInExtIdentityObject(res));     
                if(nodeState.get("isverifiedprerequisites")==true && nodeState.get("saveinput")===false){
                    logger.debug("Inside create in extIDN")
                    createExtIDNResponse.push(addIdentityInExtIdentityObject(res)); 
                }else if(nodeState.get("isverifiedprerequisites")==null || !nodeState.get("isverifiedprerequisites")){
                    logger.debug("Inside create in extIDN")
                   createExtIDNResponse.push(addIdentityInExtIdentityObject(res));
                }else if(nodeState.get("extendedDataPresent")== false && nodeState.get("isverifiedprerequisites")==true && nodeState.get("saveinput")==true){
                     logger.debug("Inside create in extIDN")
                   createExtIDNResponse.push(addIdentityInExtIdentityObject(res));
                }
                    
            } else {
                logger.error("Endpoint validation failed");
            }   
        }  
        logger.debug("prerequisite value is - "+prerequisite)

        if(prerequisite==="training" || prerequisite==="agreement"){
            var timestamp = new Date().toISOString();
            var dataObj = {
                "status": "IN_PROGRESS",
                "updatedate": timestamp
            };            
            //patchPrerequisiteRequestStatus(contextID,uuid,prerequisite,"IN_PROGRESS");
           // prerequisiterecord.patchRequest(contextID,uuid,prerequisite,dataObj)
            if(nodeState.get("prereqStatus")!=null && nodeState.get("prereqStatus")){
               if(nodeState.get("prereqStatus") === "pending"){
                   action.goTo(nodeOutcome.PREREQ_STATUS); 
               }
            } else {
               action.goTo(nodeOutcome.NEXT); 
            }  
            
        } else {     
            validateResult = null;
            validateResult = validateForm(sysPageInfo,usrPageInfo,pageMetadata); 
            logger.debug("validateResult is: "+JSON.stringify(validateResult)+ " "+ "Validation length: "+validateResult.length);
            logger.debug("Validation length: "+validateResult.length)
            validateResultArray.push(validateResult[0]);

            nodeState.putShared("validateResultArray", validateResultArray)
            if(validateResult.length>0){
                if(callbacks.isEmpty()) {
                   callbacksBuilder.textOutputCallback(0,JSON.stringify(validateResultArray));    
                } else {
                   action.goTo(nodeOutcome.BACK);
                }
            } else {
                logger.debug("validateResult is success");
                if(usrPageInfo!=null && usrPageInfo){
                        if(nodeState.get("existingPageData")!=null){
                        logger.debug("DELETE existing data");
                        deleteExistingFormDataFromIDNObj(nodeState.get("existingPageData"));
                    }
                    rawPagesDataJSON = JSON.parse(usrPageInfo);
                    logger.debug("Data to patch for endpoint: "+JSON.stringify(rawPagesDataJSON.pages));
                    rawPagesDataArray = JSON.parse(JSON.stringify(rawPagesDataJSON.pages));
                                    
                    for(var i=0;i<rawPagesDataArray.length;i++){
                        var rawPageData = null;
                        rawPageData = JSON.parse(JSON.stringify(rawPagesDataArray[i]));
                        var data = rawPageData["fields"];
                        
                        for(var j=0;j<data.length;j++){
                            var jsonObj = data[j];
                            res["attributeName"] = jsonObj["name"];
                            res["attributeValue"] = jsonObj["value"];
                            res["prereqType"] = prerequisite;
                            res["uuid"] = uuid;
                            res["roleId"] = roleId;
                            if(nodeState.get("pageNo")!=null && nodeState.get("pageNo")){
                                res["pageNumber"] = nodeState.get("pageNo");
                            } 
                            res["source"] = "Portal";
                            //createExtIDNResponse.push(addIdentityInExtIdentityObject(res));   
                            logger.debug("saveinput is in "+ nodeState.get("saveinput"))
                            if(nodeState.get("isverifiedprerequisites")==true && nodeState.get("saveinput")===false){
                                logger.debug("Inside create in extIDN")
                                createExtIDNResponse.push(addIdentityInExtIdentityObject(res)); 
                            }else if(nodeState.get("isverifiedprerequisites")==null || !nodeState.get("isverifiedprerequisites")){
                                logger.debug("Inside create in extIDN")
                               createExtIDNResponse.push(addIdentityInExtIdentityObject(res));
                            }else if(nodeState.get("extendedDataPresent")== false && nodeState.get("isverifiedprerequisites")==true && nodeState.get("saveinput")==true){
                                logger.debug("Inside create in extIDN")
                                createExtIDNResponse.push(addIdentityInExtIdentityObject(res));
                            }
                        }               
                    }
                    var timestamp = new Date().toISOString();
                    if((nodeState.get("isverifiedprerequisites")==true && nodeState.get("isverifiedprerequisites")) || nodeState.get("prereqType") === "new"){
                    var dataObj = {
                        "status": "EXPIRED_INPROGRESS",
                        "updatedate": timestamp
                    }
                    var verifyCompleteOBJ = {"operation": "replace",
                                             "field": "/verificationCompleted",
                                             "value": "true"};
                    verifyComplete.push(verifyCompleteOBJ)

                     try {
             var auditDetails = require("KYID.2B1.Library.AuditDetails")
             var auditData = auditDetails.getAuditDetails("UPDATE", nodeState)
             verifyCompleteOBJ =  {operation: "replace",field: "/updatedDateEpoch",value: auditData.updatedDateEpoch}
             verifyComplete.push(verifyCompleteOBJ)
               verifyCompleteOBJ = {operation: "replace",field: "/updatedByID",value: auditData.updatedByID}
              verifyComplete.push(verifyCompleteOBJ)
               verifyCompleteOBJ = {operation: "replace",field: "/updateDate",value: auditData.updatedDate}
              verifyComplete.push(verifyCompleteOBJ)
               verifyCompleteOBJ = {operation: "replace",field: "/updatedBy",value: auditData.updatedBy}
              verifyComplete.push(verifyCompleteOBJ)
                logger.debug("auditDetail " + JSON.stringify(auditData))
            } catch (error) {
               logger.error("Error Occured : Couldnot find audit details"+ error)

            }
                    patchExtIdentityObject(verifyComplete,uuid,nodeState.get("pageNo"), nodeState.get("enteredForm"));
                    }else{
                  var dataObj = {
                        "status": "IN_PROGRESS",
                        "updatedate": timestamp
                    }}
                    prerequisiterecord.patchRequest(contextID,uuid,prerequisite,dataObj)
                    //patchPrerequisiteRequestStatus(contextID,uuid,prerequisite,"IN_PROGRESS");
    
                    if(nodeState.get("prereqStatus")!=null && nodeState.get("prereqStatus")){
                       if(nodeState.get("prereqStatus") === "pending"){
                           action.goTo(nodeOutcome.PREREQ_STATUS); 
                       }
                    } else {
                       action.goTo(nodeOutcome.NEXT); 
                    }  
                        
                    
                
                } else {
                    logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "Unable to read prerequisite form attribute values");
                    action.goTo(nodeOutcome.ERROR);    
                }
            }
        }
        
   
    } catch(error) {
        /*logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);*/
        errMsg = nodeLogger.readErrorMessage("KYID100"); 
        nodeState.putShared("readErrMsgFromCode",errMsg); 
        nodeLogger.log("error", nodeConfig, "mid", txid, error); 
        nodeLogger.log("error", nodeConfig, "end", txid); 
        action.goTo(nodeOutcome.ERROR);
        
     }
    
}

//Invoke Main Function
main();


/**
 * Script: KYID.2B1.Journey.ListPrerequisitesAttributes
 * Description: This script is used to obtain all the attributes required for specific prerequisite type. 
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    timestamp: dateTime,
    serviceType: "Journey",
    serviceName: "kyid_2b1_VerifiedPrerequisites",
    node: "Node",
    nodeName: "Script Reverify",
    script: "Script",
    scriptName: "KYID.2B1.Journey.Reverify",
    begin: "Begin Function Execution", 
    input: "Enter your response",
    function: "Function",
    functionName: "", 
    end: "Function Execution Completed"
};


// Node outcomes
var nodeOutcome = {
    NEXT: "Next",
    BACK: "Back",
    ERROR: "No",
    IJ: "Workflow",
    PREREQ_COMPLETED: "Completed",
    WORKFLOW_STATUS: "WorkflowStatus",
    PREREQ_REJECTED: "WorkflowReject"
};

// Declare Global Variables


function getPrerequisitePageAttrs(uuid,type,compPreqPagesArray) {

    var response = {};
    var jsonAttributes = {};
    var prereqTypeIDArr = [];
    var prereqID = null;
    var typeofprerequisite = null;
    var recordPrereqTypes = null;
    var jsonPrereqTypesData = null;
    var jsonPrereqTypesParsedData = null;
    var jsonPrereqTypeAtrrsData = null;
  
    try { 
        recordPrereqTypes = openidm.query("managed/alpha_kyid_prerequisitetype", { "_queryFilter" : 'prereqtypename eq "'+type+'"'}, ["_id", "name", "description","typeofprerequisite"]);
        logger.debug("RLogs::Successfully retrieved alpha_kyid_prerequisitetype custom object attributes :: "+JSON.stringify(recordPrereqTypes.result[0]));
        jsonPrereqTypesData =  JSON.stringify(recordPrereqTypes.result[0]);
        jsonPrereqTypesParsedData = JSON.parse(jsonPrereqTypesData);
        prereqID = jsonPrereqTypesParsedData["_id"];
        logger.debug("prereqID value is - "+prereqID);
        typeofprerequisite = jsonPrereqTypesParsedData["typeofprerequisite"];
        logger.debug("typeofprerequisite value is - "+typeofprerequisite);
        nodeState.putShared("typeofprerequisite",typeofprerequisite);
        if(typeofprerequisite!=="workflow"){
            logger.debug("prereq is not of workflow type");
            jsonAttributes = getPageDetails(uuid,prereqID,compPreqPagesArray,type);
            response["formdata"]=jsonAttributes;
            logger.debug("response is in " + JSON.stringify(response))
        }
        
              
    } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_prerequisitetype custom object attributes, Exception: {}', error);
    }
 
    return response;
}


function getRequestObjMapDetails(response){

    var requestmapRecords = null;
    var requestmapRecordsJSONOBj = {};
    var resultmapJSON = {};
    var typeofprerequisite = nodeState.get("typeofprerequisite");
    var kogid = nodeState.get("prereq_KOGID");

    try{
        logger.debug("Requestmap JSON - "+JSON.stringify(response))
        requestmapRecords = JSON.parse(JSON.stringify(response)); 
        if(requestmapRecords.length>0){
            for(var i=0;i<requestmapRecords.length;i++){
                requestmapRecordsJSONOBj = {};
                requestmapRecordsJSONOBj = requestmapRecords[i];
                if((typeofprerequisite==="training" || typeofprerequisite==="agreement") && requestmapRecordsJSONOBj["pageElement"]==="userName"){
                    resultmapJSON[requestmapRecordsJSONOBj["requestElement"]] = kogid;
                } else if((typeofprerequisite==="training" || typeofprerequisite==="agreement") && requestmapRecordsJSONOBj["pageElement"]==="businessappid"){
                    resultmapJSON[requestmapRecordsJSONOBj["requestElement"]] = "0aaa874e-df7e-473a-8842-be8b95bd48c7"; //hard-coded, don't know source of app id
                } else {
                    resultmapJSON[requestmapRecordsJSONOBj["requestElement"]] = requestmapRecordsJSONOBj["pageElement"];
                }              
            }
        }     
        
    } catch(error) {
        logger.error('Failed to retrieve request mapping details. Error -: '+ error);
    }

    return resultmapJSON;
}


function getResponseObjMapDetails(response){

    var responsemapRecords = null;
    var responsemapKeys = [];
    var responsemapRecordsJSONOBj = {};
    var resultmapJSON = {};

    try{
        responsemapRecords = JSON.parse(JSON.stringify(response)); 
        if(responsemapRecords.length>0){
            for(var i=0;i<responsemapRecords.length;i++){
                responsemapRecordsJSONOBj = {};
                responsemapRecordsJSONOBj = responsemapRecords[i];
                resultmapJSON[responsemapRecordsJSONOBj["requestresponseelement"]] = responsemapRecordsJSONOBj["pageresponseelement"];
                responsemapKeys.push(responsemapRecordsJSONOBj["requestresponseelement"]);
            }
            nodeState.putShared("endptResponseMapKeys",responsemapKeys);
        }     
        
    } catch(error) {
        logger.error('Failed to retrieve response mapping details. Error -: '+ error);
    }

    return resultmapJSON;
}


function getEndpointObjMapDetails(id){

    var responseendptRecords = null;
    var responseendptRecordsResultArray = null;
    var responseendptRecordsResultJSON = {};
    var requestmapJSONArray = null;
    var resultJSON = {};
    
    try{
        responseendptRecords = openidm.query("managed/alpha_kyid_prerequisite_endpoint", { "_queryFilter" : '_id eq "' + id + '"'}, 
                                             ["url","method","requestType","action","protectionType","headers","credentials","requestmapping/*","responsemapping/*"]);
        logger.debug("RLogs::Successfully retrieved alpha_kyid_prerequisite_endpoint custom object attributes :: "+JSON.stringify(responseendptRecords.result));
        responseendptRecordsResultArray = JSON.parse(JSON.stringify(responseendptRecords.result));
        if(responseendptRecordsResultArray.length>0){
           responseendptRecordsResultJSON = responseendptRecordsResultArray[0];
           logger.debug("responseendptRecordsResultJSON - "+JSON.stringify(responseendptRecordsResultJSON));
           resultJSON["url"] =  responseendptRecordsResultJSON["url"];
           resultJSON["method"] =  responseendptRecordsResultJSON["method"];
           resultJSON["requestType"] =  responseendptRecordsResultJSON["requestType"];
           resultJSON["action"] =  responseendptRecordsResultJSON["action"];
           resultJSON["protectionType"] =  responseendptRecordsResultJSON["protectionType"];
           resultJSON["headers"] =  responseendptRecordsResultJSON["headers"]; 
           resultJSON["credentials"] =  responseendptRecordsResultJSON["credentials"];  
           resultJSON["requestmapping"] = getRequestObjMapDetails(responseendptRecordsResultJSON["requestmapping"]);
           resultJSON["responseMapping"] = getResponseObjMapDetails(responseendptRecordsResultJSON["responsemapping"]);
        } 
       nodeState.putShared("prereqendptrespmap",resultJSON); 
        
    } catch(error) {
        logger.error('Failed to retrieve endpoint details. Error- '+ error);
    }

    return resultJSON;
}


function getPageDetails(uuid,prereqID,compPreqPagesArray,type){

    var result; 
    var response;
    var resultArray=[];
    var fieldDataArray;
    var prereqnameJSON = {};
    var profileFieldsJSON = {};
    var profileFieldsArray = [];
    var jsonObjPage = {};
    var pageMetadata = {};
    var nextPage = null;
    var endpointJSON = null;
    var prereqTypeTotalPages = null;
    var responseArray = null;
    var preferredLanguage = null;
    var recordPreqreqTypePage = null;
    var availablePreqPagesArray = [];
    var requestmappingJSON = {};
    var responsemappingJSON = {};
    var endpointmappingJSON = {};
    var endpointmappingArray = [];
    var endptID = null;
    var lib = null;
    var process ="kyid_2b1_PrerequisitesEnrolment";
    var pageHeader= null;
    var getFaqTopicId = null;
    var getFaqTopicIdValue = null;
    var pageStep = null;
    
    try { 
         logger.debug("Getting page details");
          lib = require("KYID.Library.FAQPages");
          preferredLanguage = nodeState.get("preferredLanguage");
          recordPreqreqTypePage= openidm.query(
            "managed/alpha_kyid_prerequisite_pages", 
            { "_queryFilter": 'prerequisitetype/_refResourceId eq "' + prereqID + '"' },
            [
                "id", "header", "body", "description", "pagenumber", "footer",
                "prerequisitetype/name", "onsubmit/*", "onload/*", "pageattributes/*"
            ]
        );
          logger.debug("Successfully retrieved alpha_kyid_prerequisite_pages custom object attributes :: "+JSON.stringify(recordPreqreqTypePage.result));
          responseArray =  JSON.parse(JSON.stringify(recordPreqreqTypePage.result));
          logger.debug("responseArray in pages -"+JSON.stringify(responseArray));
          pageStep = nodeState.get("pageStep");
          // To get list of all the pages sequence associated with a prerequisite
          for(var m=0;m<responseArray.length;m++){
              prereqTypeTotalPages = JSON.parse(JSON.stringify(responseArray[m]));
              availablePreqPagesArray.push(prereqTypeTotalPages["pagenumber"]);
               logger.debug("availablePreqPagesArray in pages -"+JSON.stringify(availablePreqPagesArray));
               logger.debug("compPreqPagesArray in pages -"+JSON.stringify(compPreqPagesArray));
              
          }
            if((nodeState.get("viewPreqData")!= null && nodeState.get("viewPreqData")) && (nodeState.get("prevFormPage")==="false" || !nodeState.get("prevFormPage"))){
                
                nodeState.putShared("pagestep",pageStep+"|"+availablePreqPagesArray.length); 
            }else{
                nodeState.putShared("pagestep",pageStep-1+"|"+availablePreqPagesArray.length); 
            }
           
           // To display and show Submit button based on condition
            if(nodeState.get("totalStep") === pageStep){
                 nodeState.putShared("showSubmitBtn","true");
            }
           // if((availablePreqPagesArray.length-compPreqPagesArray.length)===1){
           //     nodeState.putShared("showSubmitBtn","true");
           // }

           nextPage = Number(getNextPageinSequence(availablePreqPagesArray,compPreqPagesArray));
           logger.debug("nextPage - "+nextPage)
          
           for(var j=0;j<responseArray.length;j++){
              response = null;
              result = {};
              prereqnameJSON = {};
              response = responseArray[j];
              
              if(response["pagenumber"]==(nextPage)){
                  nodeState.putShared("pageNo",nextPage);
                  //result["prerequisitename"] = type;
                  prereqnameJSON = JSON.parse(JSON.stringify(response["prerequisitetype"]));
                  result["prerequisitename"] = prereqnameJSON["name"];
                  logger.debug("PAGESTEp is "+ nodeState.get("pagestep"));
                  result["prerequisitestep"] =  nodeState.get("pagestep");
                  result["header"]=response["header"];
                  result["body"]=response["body"];
                  pageHeader = response["id"];
                  getFaqTopicId = lib.getFaqTopidId(pageHeader,process);
                  getFaqTopicIdValue = JSON.parse(getFaqTopicId);
                  result["faqTopicId"] = getFaqTopicIdValue["faqTopicId"];
                  result["footer"] = response["footer"];
                  result["description"] = response["description"];
                  result["pageNumber"] = response["pagenumber"]; 
                  logger.debug("result is in "+ JSON.stringify(result))
                  
                  
                  //To check whether endpoint is present or not for this specific prerequisite form page 
                  if(response["onsubmit"]!=null) {
                      endpointmappingJSON = {};
                      endptID = JSON.parse(JSON.stringify(response["onsubmit"]))["_id"]; 
                      logger.debug("onsubmit endptID - "+endptID);  
                      endpointmappingJSON = getEndpointObjMapDetails(endptID);  
                      endpointmappingArray.push(endpointmappingJSON);    
                  } 

                  if(response["onload"]!=null) {
                      endpointmappingJSON = {};
                      endptID = JSON.parse(JSON.stringify(response["onload"]))["_id"]; 
                      logger.debug("onload endptID - "+endptID);  
                      endpointmappingJSON = getEndpointObjMapDetails(endptID);  
                      endpointmappingArray.push(endpointmappingJSON);
                  } 

                 if(response["onsubmit"]!=null || response["onload"]!=null){
                     nodeState.putShared("isEndpointPresent","true");
                 } else {
                      nodeState.putShared("isEndpointPresent","false");
                  }       
                  
                  var attributesArray = response["pageattributes"];
                  logger.debug("attributesArray is: "+JSON.stringify(attributesArray))
                  fieldDataArray = [];

                  if(JSON.stringify(attributesArray).length>2){
                      for(var k=0;k<attributesArray.length;k++){
                          var fieldObj = null;
                          var fieldData = {};
                          fieldObj = JSON.parse(JSON.stringify(attributesArray[k]));
                          fieldData["type"]=fieldObj["type"];
                          fieldData["label"]=fieldObj["label"];                
                          fieldData["name"]=fieldObj["name"];
                          fieldData["sequence"]=fieldObj["sequence"];
                          
                          if(fieldObj["isReadOnly"]!=null && fieldObj["isReadOnly"]){
                              fieldData["isReadOnly"]=fieldObj["isReadOnly"];
                              
                          } else {
                              fieldData["isReadOnly"]=false;
                          }
                          
                          fieldData["helpMessage"]=fieldObj["helpMessage"];
                          fieldData["description"]=fieldObj["description"];
                          fieldData["fieldFormat"]=fieldObj["fieldFormat"];
                          fieldData["options"]=fieldObj["options"];
                          fieldData["validation"]=fieldObj["validation"];
                          fieldData["encrypted"]=fieldObj["encrypted"];
                          
                          if(fieldObj["layout"]!=null && fieldObj["layout"]){
                              fieldData["layout"]=fieldObj["layout"];       
                          }
                          
                          if(fieldObj["sysAttribute"]!=null && fieldObj["sysAttribute"]){
                              fieldData["sysAttribute"]=fieldObj["sysAttribute"];       
                          } else {
                              fieldData["sysAttribute"]="";
                          }
    
                          if(fieldObj["sysAttribute"]==="givenName"){
                              var value = getUserProfileAttributes(uuid,"givenName");
                              profileFieldsJSON = {};
                              fieldData["value"] = value;
                              profileFieldsJSON["sysAttribute"] = "givenName";
                              profileFieldsJSON["value"] = value;
                              profileFieldsArray.push(profileFieldsJSON);
                              
                          } else if(fieldObj["sysAttribute"]==="sn"){
                              var value = getUserProfileAttributes(uuid,"sn");
                              profileFieldsJSON = {};
                              fieldData["value"] = value;
                              profileFieldsJSON["sysAttribute"] = "sn";
                              profileFieldsJSON["value"] = value;
                              profileFieldsArray.push(profileFieldsJSON);
                              
                          } else{
                              fieldData["value"]="";
                          }  
                          
                          fieldDataArray.push(fieldData);
                          pageMetadata["fieldPropsList"] = Object.keys(fieldData); //returns an array with the keys of an object
                       }
                  }
                  
                  result["fields"] = fieldDataArray;
                  result["links"] = [];
                  result["endPoint"] = endpointmappingArray;
                  nodeState.putShared("sysPageInfo",fieldDataArray); //Page Info from IDM managed object 
                  resultArray.push(result);
              }              
          }
          jsonObjPage["pages"] = resultArray;
          pageMetadata["pagenumber"] = nextPage;
          pageMetadata["nooffields"] = fieldDataArray.length;
          if(profileFieldsArray.length>0){
              pageMetadata["profileFields"] = profileFieldsArray;
          }      
          nodeState.putShared("pageMetadata",JSON.stringify(pageMetadata));
                 
    } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_prerequisite_pages custom object attributes, Exception: '+ error);
    }

   return jsonObjPage;
}


// To get list of all the form pages which are completed and submitted for a specific prerequisite by the user.
function getSubmittedPrereqPagesDetails(uuid,type,pageNumber) {

    var source = "Portal";
    var extIDNJSONArray = [];
    var compPreqPagesArray = [];
    var recordSubmittedPreqreqPage = null; 
    var recordSubmittedPreqreqPageArray = null;
    var pageStepArray = [];
    logger.debug("PageNumber in is "+ pageNumber)
    
    try { 
          if(pageNumber!=null){
              recordSubmittedPreqreqPage= openidm.query("managed/alpha_kyid_extendedIdentity", 
                                                        { "_queryFilter" : 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '" and ' + 'source eq "' + source + '" and ' 
                                                            + 'pageNumber eq ' + Number(pageNumber)}, ["attributeName","attributeValue"]);
          } else {
              recordSubmittedPreqreqPage= openidm.query("managed/alpha_kyid_extendedIdentity", { "_queryFilter" : 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '"'}, ["pageNumber"]);
          }
          
          logger.debug("RLogs::Successfully retrieved alpha_kyid_extendedIdentity custom object attributes :: "+JSON.stringify(recordSubmittedPreqreqPage.result));
          recordSubmittedPreqreqPageArray =  JSON.parse(JSON.stringify(recordSubmittedPreqreqPage.result));
          logger.debug("recordSubmittedPreqreqPageArray "+JSON.stringify(recordSubmittedPreqreqPageArray));
          nodeState.putShared("extIDNResponse",JSON.stringify(recordSubmittedPreqreqPageArray));
          for(var p=0;p<recordSubmittedPreqreqPageArray.length;p++){
              var extIdnJSONObj = null;
              extIdnJSONObj = recordSubmittedPreqreqPageArray[p];
              if(!compPreqPagesArray.includes(extIdnJSONObj["pageNumber"])){
                  compPreqPagesArray.push(extIdnJSONObj["pageNumber"]);
                  logger.debug("compPreqPagesArray in getSubmittedPrereqPagesDetails" + JSON.stringify(compPreqPagesArray));
              }  
              if(pageNumber!=null){
                  extIDNJSONArray.push(extIdnJSONObj["_id"]);
              }
          }

          if(extIDNJSONArray.length>0){
              nodeState.putShared("existingPageData",extIDNJSONArray);
              logger.debug("extIDNJSONArray Data - "+extIDNJSONArray);   
          }
       
    } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_extendedIdentity custom object attributes, Exception: '+error);
    }

    logger.debug("Rlogs::compPreqPagesArray value is - ");
    return compPreqPagesArray;
}


function getNextPageinSequence(availablePreqPagesArray,compPreqPagesArray){
    
    var resArray = [];
    if(nodeState.get("prevFormPage")==="true"){
        resArray = availablePreqPagesArray.filter(value => !compPreqPagesArray.includes(value));
    }
    else{
        resArray = availablePreqPagesArray.filter(value => compPreqPagesArray.includes(value));
    }
    var minVal = 10000;
    var maxVal = -1;

    for(var x=0; x<resArray.length; x++){
      if (resArray[x]< minVal){
          minVal = resArray[x];          
      }

      if (resArray[x]> maxVal){
          maxVal = resArray[x];
      }       
    }
    return minVal;
}


function getUserProfileAttributes(userID,profileNameAttr){
    
    var profileAttr = null;
    var recordUserProfileJSON = null;
    var recordUserProfileParsedJSON= null;
    
    try { 
          recordUserProfileJSON= openidm.read("managed/alpha_user/"+userID, null);
          recordUserProfileParsedJSON =  JSON.parse(JSON.stringify(recordUserProfileJSON));
          profileAttr = recordUserProfileParsedJSON[profileNameAttr];
       
    } catch(error) {
        logger.error('Failed to retrieve alpha_kyid_extendedIdentity custom object attributes, Exception: {}', error);
    }
    return profileAttr;
}


function prepopulateFormFields(jsonResponseFormData,extIDNObjJSONArray,pageNo){

    var resJSONAraay = null;
    var JSONArray = null;
    var JSONFieldsArray = null;
    var JSONObject = null;
    var JSONFieldObject = null;
    var extIDNJSONObject = null;
    var resJSONFieldsArray = [];
    var resJSONFormArray = [];
    var resJSONFormObject = {};

    try{
        logger.debug("RLogs::extIDNObjJSONArray prepop - "+JSON.stringify(extIDNObjJSONArray));
        logger.debug("RLogs::jsonResponseFormData - "+JSON.stringify(jsonResponseFormData));
        JSONArray = jsonResponseFormData["pages"];
        JSONObject = JSON.parse(JSON.stringify(JSONArray[0]));
        JSONFieldsArray = JSONObject["fields"];
        logger.debug("JSONFieldsArray is "+ JSON.stringify(JSONFieldsArray))
        for(var i=0; i<JSONFieldsArray.length; i++){
            JSONFieldObject = JSON.parse(JSON.stringify(JSONFieldsArray[i]));
            for(var j=0; j<extIDNObjJSONArray.length; j++){
                extIDNJSONObject = JSON.parse(JSON.stringify(extIDNObjJSONArray[j]));
                logger.debug("extIDNJSONObject prepop - "+JSON.stringify(extIDNJSONObject));
                if(JSONFieldObject["name"] === extIDNJSONObject["attributeName"]){
                    JSONFieldObject["value"] = extIDNJSONObject["attributeValue"];
                }
            }
            resJSONFieldsArray.push(JSONFieldObject);
        }
        JSONObject["fields"] = resJSONFieldsArray;
        resJSONFormArray.push(JSONObject);
        resJSONFormObject["pages"] = resJSONFormArray;
       logger.debug("Final Updated Fields JSON Object - "+JSON.stringify(resJSONFormObject));
       //nodeState.putShared("prepopFormData",pageNo);

     } catch(error){
         logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
    
    return resJSONFormObject;
}

function getRequestId(id,type,userID) {
    try {
      var record = openidm.query("managed/alpha_kyid_request", { "_queryFilter" : 'contextid eq "'+id+'"' 
            + 'and type eq "'+type+'"' 
            + 'and requester eq "'+userID+'"'}, ["requestId"]);
    if(record != null){
        var requestId =record.result[0].requestId
        logger.debug("requestId is :::" +requestId)
        // return (JSON.parse(JSON.stringify(response.result[0]))["requestId"])
        return (requestId);
    }
    else{
        return "-1"
    }
    

     } catch (error) {
        logger.error("error occurred "+ error)
        return "-1"
        
    }
}

function getRequestStatus(requestId) {
    try {
    logger.debug("requestId is ---++--_+"+ requestId)
     var respJSON = {};   
     var record = openidm.action('endpoint/roleRequestInfo', 'POST', { requestId: requestId });
     if (record.code == -1){
         return false;
     }
     else{
         logger.debug("response of request is ===="+ record)

        return  record.response.decision
     }
        
    } catch (error) {
        logger.error("error occured in getRequestStatus function"+ error)
        return false;
        
    }

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
        contentArray.push({
           "operation" : "replace",
           "field" : "status",
            "value" : status
        }) ;

        contentArray.push({
           "operation" : "replace",
            "field" : "enddate",
            "value" : dateTime
        }) ;
 
        ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, recordRequestJSONObj["_id"])
        
    } catch(error){
         logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }  
}


function main(){

    //Function Name
    nodeConfig.functionName = "main()";

    var errMsg = null;
    var txid = null;
    var nodeLogger = null;
    var decisionResponse = null;
    var typeofprerequisite =null;
    var status = null;
    var decision = null;
    var requestId = null; 
    var inputValue = null;
    var pageNumber = null;
    var extIDNObjJSONArray = null;
    var jsonResponseData = null;
    var selectedOutcome = null;
    var jsonResponseFormData = null;
    var compPreqPagesArray = [];
    var isPreReqCompleted = "false";
    var prereqWorkflowPendingStatus = nodeState.get("prereqWorkflowPendingStatus");
    var uuid = nodeState.get("userId");
    var contextID = nodeState.get("ContextId");
    var response = {};
    var prerequisiterecord = null;
    var type = null;
    var viewPage = null;
    var getPageNumber = null;
    var trackPage ;
    
    try {
        logger.debug("RLogs::Inside KYID.Journey.KYID.2B1.Journey.Reverify script main method");
        nodeLogger = require("KYID.2B1.Library.Loggers");
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId")); 
        nodeLogger.log("error", nodeConfig, "begin", txid);
        type = nodeState.get("prereqtype");
        prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils");
        compPreqPagesArray = getSubmittedPrereqPagesDetails(uuid,type,getPageNumber);
        nodeState.putShared("totalStep", compPreqPagesArray.length);

        trackPage = nodeState.get("trackPage");
        if(typeof trackPage === "undefined"){
            trackPage = 0;
        }
       
        logger.debug("totalStep is "+ compPreqPagesArray.length+ " trackPage "+ trackPage)
       
        if (compPreqPagesArray.length > 0) {
            getPageNumber = Number(compPreqPagesArray[0]);
            nodeState.putShared("pageStep", getPageNumber);;
        } else {
            logger.debug("compPreqPagesArray is empty, cannot store first element in nodeState.");
        }
        
        if(type!=null && type){
  
            if((nodeState.get("viewPreqData")!= null && nodeState.get("viewPreqData")) && (nodeState.get("prevFormPage")==="false" || !nodeState.get("prevFormPage"))){
                // var dataObj = {
                //     "status": "IN_PROGRESS",
                // };
                // prerequisiterecord.patchRequest(contextID,uuid,type,dataObj)
                compPreqPagesArray.pop();
                nodeState.putShared("pgNumber",compPreqPagesArray.length);
                getSubmittedPrereqPagesDetails(uuid,type,getPageNumber);
                logger.debug("RLogs::Data stored in extended idn object of "+compPreqPagesArray.length+" is - "+nodeState.get("extIDNResponse"));
                if(nodeState.get("extIDNResponse")!=null){
                    extIDNObjJSONArray = JSON.parse(nodeState.get("extIDNResponse"));
                } 
                logger.debug("RLogs::compPreqPagesArray value - "+compPreqPagesArray);
            }

        if(nodeState.get("prevFormPage")==="true"){
            logger.debug("Inside back")
            trackPage-=2;
                nodeState.putShared("pgNumber",compPreqPagesArray.length);
                compPreqPagesArray.pop(); // remove last value from array
                getSubmittedPrereqPagesDetails(uuid,type,compPreqPagesArray.length);
                logger.debug("RLogs::Data stored in extended idn object of "+compPreqPagesArray.length+" is - "+nodeState.get("extIDNResponse"));
                if(nodeState.get("extIDNResponse")!=null){
                    extIDNObjJSONArray = JSON.parse(nodeState.get("extIDNResponse"));
                }
                
                logger.debug("RLogs::compPreqPagesArray value - "+compPreqPagesArray);
            }
            
            response = getPrerequisitePageAttrs(uuid,type,compPreqPagesArray);
            typeofprerequisite= nodeState.get("type");
            jsonResponseData = null;//***
            jsonResponseFormData = null;
            logger.debug("Length of response.formdata is - "+JSON.stringify(response).length);
            
            if(JSON.stringify(response).length>2){
                jsonResponseData = JSON.parse(JSON.stringify(response.formdata));
                jsonResponseFormData = JSON.parse(JSON.stringify(jsonResponseData));//***
                logger.debug("PGNM"+nodeState.get("pgNumber"))
    
                if(nodeState.get("prevFormPage")==="true" || nodeState.get("viewPreqData")!= null){ //**
                    jsonResponseFormData = prepopulateFormFields(jsonResponseFormData,extIDNObjJSONArray,nodeState.get("pageStep"));
                }//** 
                          
                 //if(!jsonResponseFormData["pages"].length>0){
                if( trackPage >= nodeState.get("totalStep") ){
                    var timestamp = new Date().toISOString();
                    var dataObj = {
                        "status": "COMPLETED",
                        "enddate": timestamp
                    };
                    prerequisiterecord.patchRequest(contextID,uuid,type,dataObj)                     
                    //patchPrerequisiteRequestStatus(contextID,uuid,type,"COMPLETED");
                    isPreReqCompleted = "true";
                    nodeState.putShared("prereqStatus","completed");
                    logger.debug(type+" type is successfully completed.");
                    trackPage = 0;
                 
                 } else {
                     if (callbacks.isEmpty()) {
                        if(jsonResponseFormData["pages"].length>0){
                            nodeState.putShared("prereqStatus","pending");
                            callbacksBuilder.textOutputCallback(0,JSON.stringify(jsonResponseFormData));   
                            callbacksBuilder.textInputCallback(nodeConfig.input);
                            if(typeofprerequisite==="training" || typeofprerequisite==="agreement"){
                                callbacksBuilder.confirmationCallback(0, ["Done"], 0);
                             } 
                            else {
                                if(nodeState.get("showSubmitBtn")==="true"){
                                    callbacksBuilder.confirmationCallback(0, ["Submit","Back"], 0);
                                } else {
                                    callbacksBuilder.confirmationCallback(0, ["Next","Back"], 0);
                                } 
                            }                               
                        }                       
                    } else {
                         if(isPreReqCompleted === "false"){
                             inputValue = null;
                             selectedOutcome = null;
                             inputValue = callbacks.getTextInputCallbacks().get(0);
                             logger.debug("inputValue is "+ JSON.stringify(inputValue));
                             nodeState.putShared("usrPageInfo",JSON.stringify(inputValue)); //User Input Form Info from Portal 
                             selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
                             logger.debug("selectedOutcome is "+ selectedOutcome);
                             
                             if(selectedOutcome === 0){
                                 if(nodeState.get("prevFormPage")==="true"){
                                    trackPage++
                                 }
                                 nodeState.putShared("prevFormPage","false");
                                 logger.debug("prevFormPage is false");
                                 trackPage++
                                 nodeState.putShared("trackPage", trackPage);
                                 
                                 var dataObj = {
                                             "status": "IN_PROGRESS",
                                            };
                                 prerequisiterecord.patchRequest(contextID,uuid,type,dataObj)
                                 action.goTo(nodeOutcome.NEXT);                   
                             } else {
                                if(compPreqPagesArray.length>0){
                                    nodeState.putShared("prevFormPage","true");
                                    logger.debug("prevFormPage is true");
                                    action.goTo(nodeOutcome.NEXT);
                                } else {
                                     action.goTo(nodeOutcome.BACK);
                                }   
                             }
                           }          
                        }
                     }
    
                    if(isPreReqCompleted === "true"){
                       logger.debug("Go to Completed outcome");
                       action.goTo(nodeOutcome.PREREQ_COMPLETED);
                    }
                 
               } else {
                    if(getRequestId(contextID,type,uuid) != null && getRequestId(contextID,type,uuid) != "" && getRequestId(contextID,type,uuid)){
                        requestId = getRequestId(contextID,type,uuid);
                        nodeState.putShared("roleRequestId",requestId)
                        logger.debug("requestId from getRequestId is "+requestId)
                        decisionResponse = JSON.parse(getRequestStatus(requestId));
                        logger.debug("decisionResponse is "+ decisionResponse);
                        status = decisionResponse.status;
                        logger.debug("decisionResponse Status is "+ status);
                        decision = decisionResponse.decision;
                        logger.debug("decisionResponse decision is "+ decision);
                       
                        if(status === "in-progress" && decision == null){
                            isPreReqCompleted = "false";
                            nodeState.putShared("prereqStatus","pending");
                            nodeState.putShared("prereqWorkflowPendingStatus", "pending");
                            nodeState.putShared("prereqWorkflowRejectedStatus", null);
                            action.goTo(nodeOutcome.WORKFLOW_STATUS);
                        }
                        else if(status === "in-progress" && decision === "approved"){
                            nodeState.putShared("prereqWorkflowPendingStatus", null);
                            nodeState.putShared("prereqWorkflowRejectedStatus", null);
                            isPreReqCompleted = "true";
                            nodeState.putShared("prereqStatus","completed");
                            timestamp = new Date().toISOString();
                            var dataObj = {
                                "status": "COMPLETED",
                                "enddate": timestamp
                            };
                            prerequisiterecord.patchRequest(contextID,uuid,type,dataObj)                            
                            //patchPrerequisiteRequestStatus(contextID,uuid,type,"COMPLETED")
                            logger.debug(type+" type is successfully completed.");
                            action.goTo(nodeOutcome.PREREQ_COMPLETED);
                        }
                        else if(status === "complete" && decision === "rejected"){
                            nodeState.putShared("prereqWorkflowPendingStatus", null);
                            nodeState.putShared("prereqWorkflowRejectedStatus", "rejected");
                            isPreReqCompleted = "false";
                            nodeState.putShared("prereqStatus","rejected");
                            timestamp = new Date().toISOString();
                            var dataObj = {
                                "status": "REJECTED",
                                "enddate": timestamp
                            };
                            prerequisiterecord.patchRequest(contextID,uuid,type,dataObj)                             
                            //patchPrerequisiteRequestStatus(contextID,uuid,type,"REJECTED")
                            logger.debug(type+" workflow is rejected.");
                            action.goTo(nodeOutcome.PREREQ_REJECTED);
                        }
                        
                    
                    } else{
                        action.goTo(nodeOutcome.IJ);
                    }
                 }
 
                
        } else {
            errMsg = nodeLogger.readErrorMessage("KYID101"); 
            nodeState.putShared("readErrMsgFromCode",errMsg); 
            nodeLogger.log("error", nodeConfig, "mid", txid, errMsg); 
            nodeLogger.log("error", nodeConfig, "end", txid); 
            action.goTo(nodeOutcome.ERROR);
            
        }
    } catch(error) {
        errMsg = nodeLogger.readErrorMessage("KYID100"); 
        nodeState.putShared("readErrMsgFromCode",errMsg); 
        nodeLogger.log("error", nodeConfig, "mid", txid, error); 
        nodeLogger.log("error", nodeConfig, "end", txid); 
        action.goTo(nodeOutcome.ERROR);
     }
    
}

//Invoke Main Function
main();
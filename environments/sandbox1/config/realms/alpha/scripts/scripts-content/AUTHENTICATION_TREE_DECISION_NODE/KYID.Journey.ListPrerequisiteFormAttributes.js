/**
 * Script: KYID.Journey.ListPrerequisiteFormAttributes
 * Description: This script is used to obtain all the attributes required for specific prerequisite type form. 
 * Date: 03rd Mar 2025
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "List Prerequisite Attributes ",
    script: "Script",
    scriptName: "KYID.Journey.ListPrerequisiteFormAttributes",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

// Node outcomes
var nodeOutcome = {
    EXIST: "Yes",
    NOT_EXIST: "No"
};

// Declare Global Variables


function getPrerequisitePageAttrs(type) {

    var response = {};
    var jsonAttributes = {};
    var prereqTypeIDArr = [];
    var prereqID = null;
    var recordPrereqTypes = null;
    var recordFormPage = null;
  
    try { 
        recordPrereqTypes = openidm.query("managed/Alpha_Kyid_PrerequisiteType", { "_queryFilter" : '/name eq "'+type+'"'}, ["_id", "name", "isSave", "_prereqformattributes"]);
        //logger.error("Successfully retrieved Alpha_Kyid_PrerequisiteType custom object attributes :: "+JSON.stringify(recordPrereqTypes.result[0]));
        var jsonPrereqTypesData =  JSON.stringify(recordPrereqTypes.result[0]);
        var jsonPrereqTypesParsedData = JSON.parse(jsonPrereqTypesData);
        var jsonPrereqTypeAtrrsData = jsonPrereqTypesParsedData["_prereqformattributes"]; //To fetch prerequisiteType id details
        prereqID = jsonPrereqTypesParsedData["_id"];
        response["_id"]=jsonPrereqTypesParsedData["_id"];
        response["name"]=jsonPrereqTypesParsedData["name"];
        response["isSave"]=jsonPrereqTypesParsedData["isSave"];
        for(var i=0; i<jsonPrereqTypeAtrrsData.length;i++){
          //logger.error("PrerequisiteType Details :: "+JSON.stringify(jsonPrereqTypeAtrrsData[i]));
          var jsonPrereqTypeAtrrsParsedData = JSON.parse(JSON.stringify(jsonPrereqTypeAtrrsData[i]));
          prereqTypeIDArr.push(jsonPrereqTypeAtrrsParsedData["_refResourceId"]);
          //logger.error("PrereqTypeIDs are:: "+prereqTypeIDArr);
        }
        if(prereqTypeIDArr.length>0){
          jsonAttributes = getPrerequisiteTypeFormAttrs(prereqTypeIDArr);
          //getEndpointDetails(prereqID);
        }
        response["formdata"]=jsonAttributes;
        logger.error("jsonAttributes: "+JSON.stringify(jsonAttributes))
        
    } catch(error) {
        var exceptionMessage = getException(error);
        logger.error('Failed to retrieve Alpha_Kyid_PrerequisiteType custom object attributes, Exception: {}', exceptionMessage);
    }
 
    return response;
}


function getPrerequisiteTypeFormAttrs(prereqTypeIDArr) {

  var jsonAttributes = {};
  var jsonAttributesArray = [];
  var recordPrerequisiteTypeFormAttr = null;
  try { 
        for(var j=0;j<prereqTypeIDArr.length;j++){
          var id = prereqTypeIDArr[j];
          recordPrerequisiteTypeFormAttr= openidm.query("managed/Alpha_Kyid_PreReqAttributes", { "_queryFilter" : '/_id eq "'+id+'"'}, ["_id", "type", "name", "localeEN", "localeES", "validationRegex","encrypted","sysAttribute"]);
          //logger.error("Successfully retrieved Alpha_Kyid_PreReqAttributes custom object attributes :: "+JSON.stringify(recordPrerequisiteTypeFormAttr.result[0]));
          jsonAttributesArray.push(JSON.stringify(recordPrerequisiteTypeFormAttr.result[0]));
        }
        jsonAttributes["attributes"]=jsonAttributesArray;
    
    } catch(error) {
        var exceptionMessage = getException(error);
        logger.error('Failed to retrieve Alpha_Kyid_PreReqAttributes custom object attributes, Exception: {}', exceptionMessage);
    }

    return jsonAttributes;
}



function main(){

    var response = {};
    try {
        logger.error("RLogs::Inside KYID.Journey.ListPrerequisiteFormAttributes script main method");
        var type = nodeState.get("prereqtypesList")[0];
        logger.error("RLogs::Prerequisite Type: "+type);
        if(type!=null && type){
           response = getPrerequisitePageAttrs(type);
           if (callbacks.isEmpty()) {
                callbacksBuilder.textOutputCallback(0,`<div class='success-message'>`+JSON.stringify(response)+`</div>`);
            } else {
               action.goTo(nodeOutcome.EXIST); 
            }
           
        } else {
            response["code"] = "ERR00102";
            response["reason"] = "Bad Request";
            response["errorMessage"] = "Missing value of prerequisite type";
            if (callbacks.isEmpty()) {
                callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+JSON.stringify(response)+`</div>`);        
            } else {
               action.goTo(nodeOutcome.NOT_EXIST);
            }        
        }
    } catch(error) {
        response["code"] = "ERR00101";
        response["reason"] = "Exception";
        response["errorMessage"] = "There was an error processing the request";
        logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.end);
        if (callbacks.isEmpty()) {
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+JSON.stringify(response)+`</div>`);    
        } else {
           action.goTo(nodeOutcome.NOT_EXIST);
        }
     }
    
}

//Invoke Main Function
main();


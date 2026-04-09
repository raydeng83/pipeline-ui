var _ = require('lib/lodash');
function getException(e) {
  if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
    return e.javaException.cause.localizedMessage || e.javaException.cause.message;
  } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
    return e.messageDetail.message;
  } else if (_.has(e, 'message')) {
    return e.message;
  } else {
    return e;
  }
}

(function () {
    if (request.method === 'create') {
      // POST
      logger.error("Prerequisite type value is: "+request.content.type);
      var type = request.content.type;
      return getPrerequisitePageAttrs(type);
    } else if (request.method === 'read') {
      // GET
      return {};
    } else if (request.method === 'update') {
      // PUT
      return {};
    } else if (request.method === 'patch') {
      return {};
    } else if (request.method === 'delete') {
      return {};
    }
    throw { code: 500, message: 'Unknown error' };
  }());


function getPrerequisitePageAttrs(type) {

    var response = {};
    var jsonAttributes = {};
    var prereqTypeIDArr = [];
    var prereqID = null;
    var recordPrereqTypes = null;
    var recordFormPage = null;
  
    try { 
        recordPrereqTypes = openidm.query("managed/Alpha_Kyid_PrerequisiteType", { "_queryFilter" : '/name eq "'+type+'"'}, ["_id", "name", "isSave", "_prereqformattributes"]);
        logger.error("Successfully retrieved Alpha_Kyid_PrerequisiteType custom object attributes :: "+JSON.stringify(recordPrereqTypes.result[0]));
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
          getEndpointDetails(prereqID);
        }
        response["formdata"]=jsonAttributes;
        
        
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



function getEndpointDetails(prereqID) {
  
  var recordFormPage = null;
  try {
       recordFormPage = openidm.query("managed/Alpha_Kyid_Pages", { "_queryFilter" : '/prereqtype eq "appPage1"'}, ["_id", "name", "header", "description", "prereqtype", "attributes", "footer", "onSubmit"]);
       logger.error("Successfully retrieved Alpha_Kyid_Pages custom object attributes :: "+JSON.stringify(recordFormPage.result[0]));
       var jsonFormPageData =  JSON.stringify(recordFormPage.result[0]);
       var jsonFormPageParsedData = JSON.parse(jsonFormPageData);
       var jsonFormPageEndpointData = jsonFormPageParsedData["onSubmit"];  
       logger.error("Successfully retrieved Alpha_Kyid_Pages endpoint details :: "+jsonFormPageEndpointData);
    
  } catch(error) {
        var exceptionMessage = getException(error);
        logger.error('Failed to retrieve Alpha_Kyid_PreReqAttributes custom object attributes, Exception: {}', exceptionMessage);
    }

    //return jsonAttributes;
}



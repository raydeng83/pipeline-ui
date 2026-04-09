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
    serviceName: "kyid_2B1_PrerequisitesEnrolment",
    node: "Node",
    nodeName: "List Prerequisite Attributes",
    script: "Script",
    scriptName: "KYID.2B1.Journey.ListPrerequisitesAttributes",
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
    VERIFIED_PREREQ_COMPLETED: "VerfiedCompleted",
    WORKFLOW_STATUS: "WorkflowStatus",
    PREREQ_REJECTED: "WorkflowReject",
    VERIFIEDPREREQBACK: "VerfiedBack"
};

// Declare Global Variables

function calculateExpiryDate(type, value) {
    var today = new Date();
    var expiryDate;

    if (type === 'dayOfMonth') {
        var year = today.getFullYear();
        var month = today.getMonth();
        if (today.getDate() > value) {
            month += 1;
        }
        expiryDate = new Date(year, month, value);
        
    } else if (type === 'numberofDays') {
        value = parseInt(value, 10);
        expiryDate = new Date(today.getTime());
        expiryDate.setDate(expiryDate.getDate() + value);
        expiryDate.toISOString().split('T')[0];
        logger.debug("expiryDate is " + expiryDate)
        
    } else if (type === 'oneTimeDueDate') {
        if (typeof value === 'string') {
            expiryDate = new Date(value);

        } else if (typeof value === 'number') {
            var year = Math.floor(value / 10000);
            var month = Math.floor((value % 10000) / 100) - 1;
            var day = value % 100;
            expiryDate = new Date(year, month, day);
        } else {
            logger.debug("Invalid value type for oneTimeDueDate");
        }
        
    } else {
        logger.debug("Invalid type provided");
    }

    // Format the expiry date as YYYYMMDD
    var formattedDate = Number(
        `${expiryDate.getFullYear()}${String(expiryDate.getMonth() + 1).padStart(2, '0')}${String(expiryDate.getDate()).padStart(2, '0')}`
    );

    return formattedDate;
}


function getPrerequisitePageExpiryAttrs(type) {
    var expirydatefrequencytype = null;
    var expirydatefrequencyvalue = null;
    var expiryaction = null;
    var expiryDate = null;

    try {
        recordPrereqTypes = openidm.query("managed/alpha_kyid_prerequisite", { "_queryFilter": 'prereqtypename eq "' + type + '"' }, ["expirydatefrequencytype", "expirydatefrequencyvalue", "expiryaction"]);
        logger.debug("RLogs::Successfully retrieved alpha_kyid_prerequisite custom object attributes for getPrerequisitePageExpiryAttrs :: " + JSON.stringify(recordPrereqTypes.result[0]));
        jsonPrereqTypesData = JSON.stringify(recordPrereqTypes.result[0]);
        jsonPrereqTypesParsedData = JSON.parse(jsonPrereqTypesData);
        expirydatefrequencytype = recordPrereqTypes.result[0]["expirydatefrequencytype"];
        expirydatefrequencyvalue = recordPrereqTypes.result[0]["expirydatefrequencyvalue"];
        expiryaction = recordPrereqTypes.result[0]["expiryaction"];
        logger.debug("expirydatefrequencyvalue is " + expirydatefrequencyvalue);
        expiryDate = calculateExpiryDate(expirydatefrequencytype, expirydatefrequencyvalue);

        // nodeState.putShared("expirydatefrequencytype",expirydatefrequencytype);
        // nodeState.putShared("expirydatefrequencyvalue",expirydatefrequencyvalue);
        nodeState.putShared("expiryaction", expiryaction);
    } catch (error) {
        logger.error('Failed to retrieve alpha_kyid_prerequisite custom object attributes, Exception: {}', error);
    }
    return expiryDate;
}


function getPrerequisitePageAttrs(uuid, type, compPreqPagesArray) {

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
        recordPrereqTypes = openidm.query("managed/alpha_kyid_prerequisite", { "_queryFilter": 'prereqtypename eq "' + type + '"' }, ["_id", "name", "description", "typeofprerequisite"]);
        logger.debug("RLogs::Successfully retrieved alpha_kyid_prerequisite custom object attributes :: " + JSON.stringify(recordPrereqTypes.result[0]));
        jsonPrereqTypesData = JSON.stringify(recordPrereqTypes.result[0]);
        jsonPrereqTypesParsedData = JSON.parse(jsonPrereqTypesData);
        prereqID = jsonPrereqTypesParsedData["_id"];
        typeofprerequisite = jsonPrereqTypesParsedData["typeofprerequisite"];
        logger.debug("typeofprerequisite value is - " + typeofprerequisite);
        nodeState.putShared("typeofprerequisite", typeofprerequisite);
        if (typeofprerequisite !== "workflow") {
            logger.debug("prereq is not of workflow type");
            jsonAttributes = getPageDetails(uuid, prereqID, compPreqPagesArray, type);
            response["formdata"] = jsonAttributes;
        }


    } catch (error) {
        logger.error('Failed to retrieve alpha_kyid_prerequisite custom object attributes, Exception: {}', error);
    }
logger.debug("response is in getPrerequisitePageAttrs "+ JSON.stringify(response));
    return response;
}


function getRequestObjMapDetails(response) {

    var requestmapRecords = null;
    var requestmapRecordsJSONOBj = {};
    var resultmapJSON = {};
    var typeofprerequisite = nodeState.get("typeofprerequisite");
    var kogid = nodeState.get("prereq_KOGID");

    try {
        logger.debug("Requestmap JSON - " + JSON.stringify(response))
        requestmapRecords = JSON.parse(JSON.stringify(response));
        if (requestmapRecords.length > 0) {
            for (var i = 0; i < requestmapRecords.length; i++) {
                requestmapRecordsJSONOBj = {};
                requestmapRecordsJSONOBj = requestmapRecords[i];
                if ((typeofprerequisite === "training" || typeofprerequisite === "agreement") && requestmapRecordsJSONOBj["pageElement"] === "userName") {
                    resultmapJSON[requestmapRecordsJSONOBj["requestElement"]] = kogid;
                } else if ((typeofprerequisite === "training" || typeofprerequisite === "agreement") && requestmapRecordsJSONOBj["pageElement"] === "businessappid") {
                    resultmapJSON[requestmapRecordsJSONOBj["requestElement"]] = "0aaa874e-df7e-473a-8842-be8b95bd48c7"; //hard-coded, don't know source of app id
                } else {
                    resultmapJSON[requestmapRecordsJSONOBj["requestElement"]] = requestmapRecordsJSONOBj["pageElement"];
                }
            }
        }

    } catch (error) {
        logger.error('Failed to retrieve request mapping details. Error -: ' + error);
    }

    return resultmapJSON;
}


function getResponseObjMapDetails(response) {

    var responsemapRecords = null;
    var responsemapKeys = [];
    var responsemapRecordsJSONOBj = {};
    var resultmapJSON = {};

    try {
        responsemapRecords = JSON.parse(JSON.stringify(response));
        if (responsemapRecords.length > 0) {
            for (var i = 0; i < responsemapRecords.length; i++) {
                responsemapRecordsJSONOBj = {};
                responsemapRecordsJSONOBj = responsemapRecords[i];
                resultmapJSON[responsemapRecordsJSONOBj["requestresponseelement"]] = responsemapRecordsJSONOBj["pageresponseelement"];
                responsemapKeys.push(responsemapRecordsJSONOBj["requestresponseelement"]);
            }
            nodeState.putShared("endptResponseMapKeys", responsemapKeys);
        }

    } catch (error) {
        logger.error('Failed to retrieve response mapping details. Error -: ' + error);
    }

    return resultmapJSON;
}


function getEndpointObjMapDetails(id) {

    var responseendptRecords = null;
    var responseendptRecordsResultArray = null;
    var responseendptRecordsResultJSON = {};
    var requestmapJSONArray = null;
    var resultJSON = {};

    try {
        responseendptRecords = openidm.query("managed/alpha_kyid_prerequisite_endpoint", { "_queryFilter": '_id eq "' + id + '"' },
            ["url", "method", "requestType", "action", "protectionType", "headers", "credentials", "requestmapping/*", "responsemapping/*"]);
        logger.debug("RLogs::Successfully retrieved alpha_kyid_prerequisite_endpoint custom object attributes :: " + JSON.stringify(responseendptRecords.result));
        responseendptRecordsResultArray = JSON.parse(JSON.stringify(responseendptRecords.result));
        if (responseendptRecordsResultArray.length > 0) {
            responseendptRecordsResultJSON = responseendptRecordsResultArray[0];
            logger.debug("responseendptRecordsResultJSON - " + JSON.stringify(responseendptRecordsResultJSON));
            resultJSON["url"] = responseendptRecordsResultJSON["url"];
            resultJSON["method"] = responseendptRecordsResultJSON["method"];
            resultJSON["requestType"] = responseendptRecordsResultJSON["requestType"];
            resultJSON["action"] = responseendptRecordsResultJSON["action"];
            resultJSON["protectionType"] = responseendptRecordsResultJSON["protectionType"];
            resultJSON["headers"] = responseendptRecordsResultJSON["headers"];
            resultJSON["credentials"] = responseendptRecordsResultJSON["credentials"];
            // resultJSON["requestmapping"] = getRequestObjMapDetails(responseendptRecordsResultJSON["requestmapping"]);
            // resultJSON["responseMapping"] = getResponseObjMapDetails(responseendptRecordsResultJSON["responsemapping"]);
            resultJSON["requestmapping"] = responseendptRecordsResultJSON["endpointrequestmapping"];
            resultJSON["responseMapping"] = responseendptRecordsResultJSON["endpointresponsemapping"];
        }
        nodeState.putShared("prereqendptrespmap", resultJSON);

    } catch (error) {
        logger.error('Failed to retrieve endpoint details. Error- ' + error);
    }

    return resultJSON;
}



function prepropData(uuid, sysattribute, data){
    logger.debug("sysattribute is in "+ sysattribute)
    var value = getUserProfileAttributes(uuid, sysattribute);
    profileFieldsJSON = {};
    profileFieldsJSON["sysAttribute"] = sysattribute;
    profileFieldsJSON["value"] = value;
        if(data === "profileFieldsJSON"){
            return profileFieldsJSON;
        }else if(data === "value"){
            return value;
        }
}


function getPageDetails(uuid, prereqID, compPreqPagesArray, type) {

    var result;
    var response;
    var resultArray = [];
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
    var process = "kyid_2B1_PrerequisitesEnrolment";
    var pageHeader = null;
    var getFaqTopicId = null;
    var getFaqTopicIdValue = null;

    try {
        logger.debug("Getting page details");
        lib = require("KYID.Library.FAQPages");
        preferredLanguage = nodeState.get("preferredLanguage");
        recordPreqreqTypePage = openidm.query("managed/alpha_kyid_prerequisite_type", { "_queryFilter": 'prerequisitetype/_refResourceId eq "' + prereqID + '"' },
            ["id", "header", "body", "description", "pagenumber", "footer", "prerequisitetype/name",
                "onsubmit/*", "onload/*", "pageattributes/*"]);
        logger.debug("Successfully retrieved alpha_kyid_prerequisite_type custom object attributes :: " + JSON.stringify(recordPreqreqTypePage.result));
        responseArray = JSON.parse(JSON.stringify(recordPreqreqTypePage.result));
        //logger.debug("responseArray in pages -"+JSON.stringify(responseArray));
        // To get list of all the pages sequence associated with a prerequisite
        for (var m = 0; m < responseArray.length; m++) {
            prereqTypeTotalPages = JSON.parse(JSON.stringify(responseArray[m]));
            availablePreqPagesArray.push(prereqTypeTotalPages["pagenumber"]);
        }
        nodeState.putShared("pagestep", Number(compPreqPagesArray.length + 1) + "|" + availablePreqPagesArray.length);
        // To display and show Submit button based on condition
        if ((availablePreqPagesArray.length - compPreqPagesArray.length) === 1) {
            nodeState.putShared("showSubmitBtn", "true");
        }

        nextPage = Number(getNextPageinSequence(availablePreqPagesArray, compPreqPagesArray));
        nodeState.putShared("nextPageis", nextPage);
        logger.debug("nextPage - " + nextPage)

        for (var j = 0; j < responseArray.length; j++) {
            response = null;
            result = {};
            prereqnameJSON = {};
            response = responseArray[j];

            if (response["pagenumber"] == (nextPage)) {
                nodeState.putShared("pageNo", nextPage);
                //result["prerequisitename"] = type;
                prereqnameJSON = JSON.parse(JSON.stringify(response["prerequisitetype"]));
                result["prerequisitename"] = prereqnameJSON["name"];
                result["prerequisitestep"] = nodeState.get("pagestep");
                result["header"] = response["header"];
                result["body"] = response["body"];
                pageHeader = response["id"];
                getFaqTopicId = lib.getFaqTopidId(pageHeader, process);
                getFaqTopicIdValue = JSON.parse(getFaqTopicId);
                result["faqTopicId"] = getFaqTopicIdValue["faqTopicId"];
                result["footer"] = response["footer"];
                result["description"] = response["description"];
                result["pageNumber"] = response["pagenumber"];


                //To check whether endpoint is present or not for this specific prerequisite form page 
                if (response["onsubmit"] != null) {
                    endpointmappingJSON = {};
                    endptID = JSON.parse(JSON.stringify(response["onsubmit"]))["_id"];
                    logger.debug("onsubmit endptID - " + endptID);
                    endpointmappingJSON = getEndpointObjMapDetails(endptID);
                    endpointmappingArray.push(endpointmappingJSON);
                    /*if(nodeState.get("requestmap")!=null && nodeState.get("responsemap")!=null){
                        logger.debug("Request map in shared state - "+JSON.stringify(nodeState.get("requestmap")))
                        requestmappingJSON = getRequestObjMapDetails(nodeState.get("requestmap"));
                         logger.debug("Response map in shared state - "+JSON.stringify(nodeState.get("responsemap")))
                        responsemappingJSON = getResponseObjMapDetails(nodeState.get("responsemap"));
                    }*/
                }

                if (response["onload"] != null) {
                    endpointmappingJSON = {};
                    endptID = JSON.parse(JSON.stringify(response["onload"]))["_id"];
                    logger.debug("onload endptID - " + endptID);
                    endpointmappingJSON = getEndpointObjMapDetails(endptID);
                    endpointmappingArray.push(endpointmappingJSON);
                    /*if(nodeState.get("requestmap")!=null && nodeState.get("responsemap")!=null){
                        logger.debug("Request map in shared state - "+JSON.stringify(nodeState.get("requestmap")))
                        requestmappingJSON = getRequestObjMapDetails(nodeState.get("requestmap"));
                         logger.debug("Response map in shared state - "+JSON.stringify(nodeState.get("responsemap")))
                        responsemappingJSON = getResponseObjMapDetails(nodeState.get("responsemap"));
                    }*/
                }

                if (response["onsubmit"] != null || response["onload"] != null) {
                    nodeState.putShared("isEndpointPresent", "true");
                } else {
                    nodeState.putShared("isEndpointPresent", "false");
                }

                var attributesArray = response["pageattributes"];
                logger.debug("attributesArray is: " + JSON.stringify(attributesArray))
                fieldDataArray = [];

                if (JSON.stringify(attributesArray).length > 2) {
                    for (var k = 0; k < attributesArray.length; k++) {
                        var fieldObj = null;
                        var fieldData = {};
                        fieldObj = JSON.parse(JSON.stringify(attributesArray[k]));
                        fieldData["type"] = fieldObj["type"];
                        fieldData["label"] = fieldObj["label"];
                        fieldData["name"] = fieldObj["name"];
                        fieldData["sequence"] = fieldObj["sequence"];

                        if (fieldObj["isReadOnly"] != null && fieldObj["isReadOnly"]) {
                            fieldData["isReadOnly"] = fieldObj["isReadOnly"];

                        } else {
                            fieldData["isReadOnly"] = false;
                        }

                        fieldData["helpMessage"] = fieldObj["helpMessage"];
                        fieldData["description"] = fieldObj["description"];
                        fieldData["fieldFormat"] = fieldObj["fieldFormat"];
                        fieldData["options"] = fieldObj["options"];
                        fieldData["validation"] = fieldObj["validation"];
                        fieldData["encrypted"] = fieldObj["encrypted"];

                        if (fieldObj["layout"] != null && fieldObj["layout"]) {
                            fieldData["layout"] = fieldObj["layout"];
                        }

                        if (fieldObj["sysAttribute"] != null && fieldObj["sysAttribute"]) {
                            logger.debug("fieldObj data is in "+ fieldObj["sysAttribute"])
                            fieldData["sysAttribute"] = fieldObj["sysAttribute"];
                        } else {
                            logger.debug("fieldObj2 data is in "+ fieldObj["sysAttribute"])
                            fieldData["sysAttribute"] = "";
                        }

                        if(fieldObj["sysAttribute"] !== undefined){
                            profileFieldsArray.push(prepropData(uuid, fieldObj["sysAttribute"],"profileFieldsJSON"));
                            fieldData["value"] = prepropData(uuid, fieldObj["sysAttribute"],"value")
                        }else{
                             fieldData["value"] = "";
                        }
                        
                        // if (fieldObj["sysAttribute"] === "givenName") {
                        //     var value = getUserProfileAttributes(uuid, "givenName");
                        //     profileFieldsJSON = {};
                        //     fieldData["value"] = value;
                        //     profileFieldsJSON["sysAttribute"] = "givenName";
                        //     profileFieldsJSON["value"] = value;
                        //     profileFieldsArray.push(profileFieldsJSON);

                        // } else if (fieldObj["sysAttribute"] === "sn") {
                        //     var value = getUserProfileAttributes(uuid, "sn");
                        //     profileFieldsJSON = {};
                        //     fieldData["value"] = value;
                        //     profileFieldsJSON["sysAttribute"] = "sn";
                        //     profileFieldsJSON["value"] = value;
                        //     profileFieldsArray.push(profileFieldsJSON);

                        // } else if (fieldObj["sysAttribute"] === "mail") {
                        //     var value = getUserProfileAttributes(uuid, "mail");
                        //     profileFieldsJSON = {};
                        //     fieldData["value"] = value;
                        //     profileFieldsJSON["sysAttribute"] = "mail";
                        //     profileFieldsJSON["value"] = value;
                        //     profileFieldsArray.push(profileFieldsJSON);
                            
                        // } else {
                        //     fieldData["value"] = "";
                        // }

                        fieldDataArray.push(fieldData);
                        pageMetadata["fieldPropsList"] = Object.keys(fieldData); //returns an array with the keys of an object
                    }
                }

                result["fields"] = fieldDataArray;
                result["links"] = [];
                result["endPoint"] = endpointmappingArray;
                nodeState.putShared("sysPageInfo", fieldDataArray); //Page Info from IDM managed object 
                resultArray.push(result);
            }
        }
        jsonObjPage["pages"] = resultArray;
        pageMetadata["pagenumber"] = nextPage;
        pageMetadata["nooffields"] = fieldDataArray.length;
        if (profileFieldsArray.length > 0) {
            pageMetadata["profileFields"] = profileFieldsArray;
        }
        //logger.debug("Data in pageMetadata - "+JSON.stringify(pageMetadata))
        nodeState.putShared("pageMetadata", JSON.stringify(pageMetadata));

    } catch (error) {
        logger.error('Failed to retrieve alpha_kyid_prerequisite_type custom object attributes, Exception: ' + error);
    }
    logger.debug("jsonObjPage is in "+ JSON.stringify(jsonObjPage));
    return jsonObjPage;
}


// To get list of all the form pages which are completed and submitted for a specific prerequisite by the user.
function getSubmittedPrereqPagesDetails(uuid, type, pageNumber,saveinput) {

    var source = "Portal";
    var extIDNJSONArray = [];
    var compPreqPagesArray = [];
    var recordSubmittedPreqreqPage = null;
    var recordSubmittedPreqreqPageArray = null;
    var roleId = nodeState.get("roleIDinSession");
    var enrollmentactionsResponse = null;
    // var saveinput = nodeState.get("saveinput");
    var extIds =[];
    nodeState.putShared("existingPageData", null);

    try {

        if(saveinput === false && pageNumber === null){
            recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity", { "_queryFilter": 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '" and ' + 'roleId eq "' + roleId + '"' }, ["pageNumber"]);
            if(recordSubmittedPreqreqPage.result.length>0){
                for(var i=0 ; i<recordSubmittedPreqreqPage.result.length ;i++){
                    extIds.push(recordSubmittedPreqreqPage.result[i]._id);    
                }
                return extIds;
            }   
        }
        else{  
            
        if (pageNumber != null) {
            recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity",
                {
                    "_queryFilter": 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '" and ' + 'source eq "' + source + '" and ' + 'roleId eq "' + roleId + '" and '
                        + 'pageNumber eq ' + Number(pageNumber)
                }, ["attributeName", "attributeValue", "verificationCompleted"]);
        } else {
            // recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity", { "_queryFilter": 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '"' }, ["pageNumber"]);
            recordSubmittedPreqreqPage = openidm.query("managed/alpha_kyid_extendedIdentity", { "_queryFilter": 'uuid eq "' + uuid + '" and ' + 'prereqType eq "' + type + '" and ' + 'roleId eq "' + roleId + '"' }, ["pageNumber", "verificationCompleted"]);
        }
                
           
        logger.debug("RLogs::Successfully retrieved alpha_kyid_extendedIdentity custom object attributes :: " + JSON.stringify(recordSubmittedPreqreqPage.result));
        if(recordSubmittedPreqreqPage.result.length<=0){
            nodeState.putShared("extendedDataPresent",false)
        }
        recordSubmittedPreqreqPageArray = JSON.parse(JSON.stringify(recordSubmittedPreqreqPage.result));
        nodeState.putShared("extIDNResponse", JSON.stringify(recordSubmittedPreqreqPage.result));
            
                for (var p = 0; p < recordSubmittedPreqreqPageArray.length; p++) {
                    //logger.debug("verificationCompleted is "+ JSON.stringify(recordSubmittedPreqreqPage.result[p].verificationCompleted));
                    if(nodeState.get("isverifiedprerequisites")==true || recordSubmittedPreqreqPage.result[p].verificationCompleted == "true"){
                      var extIdnJSONObj = null;
                      extIdnJSONObj = recordSubmittedPreqreqPageArray[p];
                        logger.debug("verificationCompleted is "+ JSON.stringify(recordSubmittedPreqreqPage.result[p].verificationCompleted));
                        logger.debug("compPreqPagesArray whyich is "+ compPreqPagesArray)
                        if (!compPreqPagesArray.includes(extIdnJSONObj["pageNumber"]) && recordSubmittedPreqreqPage.result[p].verificationCompleted == "true") {
                            logger.debug("Inside true "+ extIdnJSONObj["pageNumber"])
                        compPreqPagesArray.push(extIdnJSONObj["pageNumber"]);
                       }
                        if (pageNumber != null) {
                        extIDNJSONArray.push(extIdnJSONObj["_id"]);
                        }
                    }else{
                        logger.debug("Inside Else")
                      var extIdnJSONObj = null;
                      extIdnJSONObj = recordSubmittedPreqreqPageArray[p];
                        if (!compPreqPagesArray.includes(extIdnJSONObj["pageNumber"])) {
                            logger.debug("Inside Else "+ extIdnJSONObj["pageNumber"])
                        compPreqPagesArray.push(extIdnJSONObj["pageNumber"]);
                        }
                        if (pageNumber != null) {
                        extIDNJSONArray.push(extIdnJSONObj["_id"]);
                        }
                    }
                }


            if (extIDNJSONArray.length > 0) {
                nodeState.putShared("existingPageData", extIDNJSONArray);
                //logger.debug("extIDNJSONArray Data - "+extIDNJSONArray);   
            }
        }

    } catch (error) {
        logger.error('Failed to retrieve alpha_kyid_extendedIdentity custom object attributes, Exception: ' + error);
    }
            
    logger.debug("Rlogs::compPreqPagesArray value is - " + compPreqPagesArray);
    return compPreqPagesArray;
}


function getNextPageinSequence(availablePreqPagesArray, compPreqPagesArray) {

    var resArray = [];
    logger.debug("compPreqPagesArray is in getNextPageinSequence"+ compPreqPagesArray)
    resArray = availablePreqPagesArray.filter(value => !compPreqPagesArray.includes(value));
    logger.debug("resArray is "+resArray )
    var minVal = 10000;
    var maxVal = -1;
    
    for (var x = 0; x < resArray.length; x++) {
        if (resArray[x] < minVal) {
            minVal = resArray[x];
        }

        if (resArray[x] > maxVal) {
            maxVal = resArray[x];
        }
    }

    logger.debug("minVal is "+ minVal)
    return minVal;
}


function getUserProfileAttributes(userID, profileNameAttr) {

    var profileAttr = null;
    var recordUserProfileJSON = null;
    var recordUserProfileParsedJSON = null;
    logger.debug("profileNameAttr is in "+ profileNameAttr)
    try {
        recordUserProfileJSON = openidm.read("managed/alpha_user/" + userID, null);
        //logger.debug("RLogs::Successfully retrieved alpha_user managed object attributes :: "+JSON.stringify(recordUserProfileJSON));
        recordUserProfileParsedJSON = JSON.parse(JSON.stringify(recordUserProfileJSON));
        profileAttr = recordUserProfileParsedJSON[profileNameAttr];

    } catch (error) {
        logger.error('Failed to retrieve alpha_user custom object attributes, Exception: {}', error);
    }
    return profileAttr;
}


function prepopulateFormFields(jsonResponseFormData, extIDNObjJSONArray, pageNo) {

    var resJSONAraay = null;
    var JSONArray = null;
    var JSONFieldsArray = null;
    var JSONObject = null;
    var JSONFieldObject = null;
    var extIDNJSONObject = null;
    var resJSONFieldsArray = [];
    var resJSONFormArray = [];
    var resJSONFormObject = {};

    try {
        logger.debug("RLogs::extIDNObjJSONArray prepop - " + extIDNObjJSONArray);
        JSONArray = jsonResponseFormData["pages"];
        JSONObject = JSON.parse(JSON.stringify(JSONArray[0]));
        JSONFieldsArray = JSONObject["fields"];
        for (var i = 0; i < JSONFieldsArray.length; i++) {
            JSONFieldObject = JSON.parse(JSON.stringify(JSONFieldsArray[i]));
            for (var j = 0; j < extIDNObjJSONArray.length; j++) {
                extIDNJSONObject = JSON.parse(JSON.stringify(extIDNObjJSONArray[j]));
                logger.debug("extIDNJSONObject prepop - " + JSON.stringify(extIDNJSONObject));
                if (JSONFieldObject["name"] === extIDNJSONObject["attributeName"]) {
                    JSONFieldObject["value"] = extIDNJSONObject["attributeValue"];
                }
            }
            resJSONFieldsArray.push(JSONFieldObject);
        }
        JSONObject["fields"] = resJSONFieldsArray;
        resJSONFormArray.push(JSONObject);
        resJSONFormObject["pages"] = resJSONFormArray;
        //logger.debug("Final Updated Fields JSON Object - "+JSON.stringify(resJSONFormObject));
        //nodeState.putShared("prepopFormData",pageNo);

    } catch (error) {
        logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName
            + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }

    return resJSONFormObject;
}


function getRequestId(id, type, userID, workflowId) {
    try {
        if(nodeState.get("_idWorkflow")!==null){
            var record = openidm.query("managed/alpha_kyid_request", {"_queryFilter": '_id eq "' + workflowId + '"'}, ["requestId"]);    
        }else{
            var record = openidm.query("managed/alpha_kyid_request", {
                "_queryFilter": 'contextid eq "' + id + '"'
                    + 'and type eq "' + type + '"'
                    + 'and requester eq "' + userID + '"'
            }, ["requestId"]);
        }
        logger.debug("record is in "+ JSON.stringify(record));
        if (record != null) {
            var requestId = record.result[0].requestId
            logger.debug("requestId is :::" + requestId)
            // return (JSON.parse(JSON.stringify(response.result[0]))["requestId"])
            return (requestId);
        }
        else {
            return "-1"
        }


    } catch (error) {
        logger.error("error occurred " + error)
        return "-1"

    }
}


function getRequestStatus(requestId) {
    try {
        logger.debug("requestId is ---++--_+" + requestId)
        var respJSON = {};
        var record = openidm.action('endpoint/roleRequestInfo', 'POST', { requestId: requestId });
        if (record.code == -1) {
            return false;
        }
        else {
            logger.debug("response of request is ====" + record)

            return record.response.decision
        }

    } catch (error) {
        logger.error("error occured in getRequestStatus function" + error)
        return false;

    }

}


// To query request managed object
function queryPrerequisiteRequestStatus(userId, type) {
  logger.debug("Inside queryPrerequisiteRequestStatus");
  var recordRequest = null;
  var recordRequestJSONObj = {};

  try {
    recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter:'requester eq "' + userId + '" AND type eq "' + type + '"',},["status"]);
    //recordRequest = openidm.query("managed/alpha_kyid_request",{_queryFilter: 'requester eq "' + userId + '" AND (status eq "' + status1 + '" OR status eq "' + status2 + '")'}, ["type", "status", "contextid"]);
    logger.debug("Successfully queried record in alpha_kyid_request managed object :: " +JSON.stringify(recordRequest));
    recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result));
    logger.debug("Successfully queried record in alpha_kyid_request managed object :: recordRequestJSONObj " + recordRequestJSONObj);
    return recordRequestJSONObj;
  } catch (error) {
    logger.error("failure in " + error);
  }
}



function checkIfPreqIsCompleted(userID, type) {
    logger.debug("Inside patchPrerequisiteRequestStatus")

    var response = null;
    var  result = null;
    var ops = require("KYID.2B1.Library.IDMobjCRUDops");

    try {
        response = openidm.query("managed/alpha_kyid_request", {
            "_queryFilter": 'requester eq "' + userID + '"'
                + 'and type eq "' + type + '"'
                + 'and status eq "' + "COMPLETED" + '"'
        }, ["contextid", "type", "requester", "status"]);

        if(response.result.length>0){
            return true;
        }
        else{
            return false;
        }



        
    } catch (error) {
        logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName
            + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
}


function patchPrerequisiteRequestStatus(id, userID, type, status, workflowId) {
    logger.debug("Inside patchPrerequisiteRequestStatus")

    var recordRequest = null;
    var requestObjResp = null;
    var recordRequestJSONObj = {};
    var content = {};
    var contentArray = [];
    var ops = require("KYID.2B1.Library.IDMobjCRUDops");

    try {
        if(nodeState.get("_idWorkflow")!== null){
        recordRequest = openidm.query("managed/alpha_kyid_request", {"_queryFilter": '_id eq "' + workflowId + '"'}, ["contextid", "type", "requester", "status"]);    
        }else{
        recordRequest = openidm.query("managed/alpha_kyid_request", {
            "_queryFilter": 'contextid eq "' + id + '"'
                + 'and type eq "' + type + '"'
                + 'and requester eq "' + userID + '"'
        }, ["contextid", "type", "requester", "status"]);
        }

        logger.debug("Successfully queried record in alpha_kyid_request managed object :: " + JSON.stringify(recordRequest));
        recordRequestJSONObj = JSON.parse(JSON.stringify(recordRequest.result[0]));
        //logger.debug("Resource ID - "+recordRequestJSONObj["_id"]);
        contentArray.push({
            "operation": "replace",
            "field": "status",
            "value": status
        });

        contentArray.push({
            "operation": "replace",
            "field": "enddate",
            "value": dateTime
        });

        ops.crudOps("patch", "alpha_kyid_request", contentArray, null, null, recordRequestJSONObj["_id"])

    } catch (error) {
        logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName
            + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);
    }
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

function patchExtIdentityObject(res, id, pageNumber, type){

    var patchExtIdentityDataResponse = null;
    var extObj = null;
    var extObjVal = null;
    var _id = null;
    
    try{
        logger.debug("Inside patchExtIdentityObject "+ id + " "+ pageNumber + " "+ type[0].Name );
        extObj = openidm.query("managed/alpha_kyid_extendedIdentity",{ "_queryFilter" : 'uuid eq "'+id+'"'+ 'and prereqType eq "'+type[0].Name+'"'})
        extObjVal = extObj.result;
        extObjVal.forEach(item =>{
                _id = item._id;
               // logger.debug("_id is inn "+ _id)
                patchExtIdentityDataResponse = openidm.patch("managed/alpha_kyid_extendedIdentity/"+_id, null, res);
                //logger.debug("patchExtIdentityDataResponse is in "+ JSON.stringify(patchExtIdentityDataResponse));
        })
        if(patchExtIdentityDataResponse!=null && patchExtIdentityDataResponse){
            logger.debug("RLogs:: patchExtIdentityObject"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                             + "::" + nodeConfig.script + "::" + nodeConfig.scriptName);
        } 
    } catch (error){
        logger.error("RLogs::"+nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + "::" + error);
    }
}


function main() {

    //Function Name
    nodeConfig.functionName = "main()";

    var errMsg = null;
    var txid = null;
    var nodeLogger = null;
    var decisionResponse = null;
    var typeofprerequisite = null;
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
    var uuid = nodeState.get("userIDinSession");
    var contextID = nodeState.get("prereqContextID");
    var response = {};
    var prerequisiterecord = null;
    var expiryDate = null;
    var expiryAction = null;
    var alwaysFlagResponse = null;
    var preqReuse = null;
    var data = nodeState.get("flagJSONData");
    var alwaysFlag = true;
    var saveinput = false;
    var prereqListArray = nodeState.get("prereqListArray");
    var preqtypeArray = nodeState.get("preqtypeArray");
    var isworkflow = nodeState.get("isworkflow");
    var prereqNameList = [];
    // var prereqName = null;
    var verifyComplete = [];
    
    try {
        logger.debug("RLogs::Inside KYID.Journey.ListPrerequisiteFormAttributes script main method");
        nodeLogger = require("KYID.2B1.Library.Loggers");
        txid = JSON.stringify(requestHeaders.get("X-ForgeRock-TransactionId"));
        nodeLogger.log("debug", nodeConfig, "begin", txid);
        var type = nodeState.get("prereqtype");
        logger.debug("RLogs::Prerequisite Type: " + type);
        prerequisiterecord = require("KYID.2B1.Library.PrerequisiteUtils");

        if (type != null && type) {
            for (var i = 0; i < data.length; i++) {
                alwaysFlagResponse = JSON.parse(data[i]);
                if (alwaysFlagResponse.prereqtypename === type) {
                    alwaysFlag = alwaysFlagResponse.enrollmentactions.always;
                    preqReuse = alwaysFlagResponse.enrollmentactions.allowreuse;
                    saveinput = alwaysFlagResponse.enrollmentactions.saveinput;
                    break;
                }
            }
            nodeState.putShared("saveinput",saveinput)
             
            compPreqPagesArray = getSubmittedPrereqPagesDetails(uuid, type, pageNumber);
            logger.debug("compPreqPagesArray at start is "+ compPreqPagesArray)

            if(nodeState.get("prevFormPage")==="true") {
                 logger.debug("RLogs::compPreqPagesArray value in prevFormPage pop 1- " + compPreqPagesArray);
                nodeState.putShared("pgNumber", compPreqPagesArray.length);
                getSubmittedPrereqPagesDetails(uuid, type, compPreqPagesArray.length);
                logger.debug("RLogs::Data stored in extended idn object of " + compPreqPagesArray.length + " is - " + nodeState.get("extIDNResponse"));
                if (nodeState.get("extIDNResponse") != null) {
                    extIDNObjJSONArray = JSON.parse(nodeState.get("extIDNResponse"));
                }
                compPreqPagesArray.pop(); // remove last value from array
                logger.debug("RLogs::compPreqPagesArray value in prevFormPage after pop 2 - " + compPreqPagesArray);
            }else if(nodeState.get("isverifiedprerequisites")==true && saveinput == true){
                nodeState.putShared("pgNumber", compPreqPagesArray.length);
                getSubmittedPrereqPagesDetails(uuid, type, compPreqPagesArray.length);
                logger.debug("RLogs::Data stored in extended idn object of " + compPreqPagesArray.length + " is - " + nodeState.get("extIDNResponse"));
                if (nodeState.get("extIDNResponse") != null) {
                    extIDNObjJSONArray = JSON.parse(nodeState.get("extIDNResponse"));
                }
                //compPreqPagesArray.pop(); // remove last value from array
                logger.debug("RLogs::compPreqPagesArray value - " + compPreqPagesArray);
            }

            response = getPrerequisitePageAttrs(uuid, type, compPreqPagesArray);
            logger.debug("response is in "+ JSON.stringify(response));
            typeofprerequisite = nodeState.get("typeofprerequisite");
            jsonResponseData = null;//***
            jsonResponseFormData = null;
            logger.debug("Length of response.formdata is - " + JSON.stringify(response).length);

            if (JSON.stringify(response).length > 2) {
                jsonResponseData = JSON.parse(JSON.stringify(response.formdata));
                jsonResponseFormData = JSON.parse(JSON.stringify(jsonResponseData));//***

                // if (nodeState.get("prevFormPage") === "true") { //**
                //     jsonResponseFormData = prepopulateFormFields(jsonResponseFormData, extIDNObjJSONArray, nodeState.get("pgNumber"));
                // }//** 

                if(nodeState.get("prevFormPage")==="true"){
                    logger.debug("Inside prepopulateFormFields1 ")
                    jsonResponseFormData = prepopulateFormFields(jsonResponseFormData,extIDNObjJSONArray,nodeState.get("pgNumber"));
                }else if(nodeState.get("isverifiedprerequisites")==true && saveinput == true && nodeState.get("nextPageis")<1000 && nodeState.get("extendedDataPresent")== true){
                    logger.debug("Inside prepopulateFormFields2 ")
                    jsonResponseFormData = prepopulateFormFields(jsonResponseFormData,extIDNObjJSONArray,nodeState.get("pgNumber"));
                }

                if (!jsonResponseFormData["pages"].length > 0) {
                    expiryDate = getPrerequisitePageExpiryAttrs(type);
                    expiryAction = nodeState.get("expiryaction");
                    logger.debug("expiryDate " + expiryDate);
                    logger.debug("expiryAction " + expiryAction);
                    var timestamp = new Date().toISOString();
                    var dataObj = {
                        "status": "COMPLETED",
                        "enddate": timestamp,
                        "expirydate": expiryDate,
                        "expiryaction": expiryAction
                    };
                    prerequisiterecord.patchRequest(contextID, uuid, type, dataObj)
                    //patchPrerequisiteRequestStatus(contextID,uuid,type,"COMPLETED");
                     var verifyCompleteOBJ = {"operation": "replace",
                                             "field": "/verificationCompleted",
                                             "value": "false"};
                    verifyComplete.push(verifyCompleteOBJ)
                    patchExtIdentityObject(verifyComplete,uuid,nodeState.get("pgNumber"), nodeState.get("enteredForm"));                   
                    isPreReqCompleted = "true";
                    nodeState.putShared("prereqStatus", "completed");
                    logger.debug(type + " type is successfully completed.");

                } else {
                    if (callbacks.isEmpty()) {
                        if (jsonResponseFormData["pages"].length > 0) {
                            nodeState.putShared("prereqStatus", "pending");
                            
                            if(preqReuse === true && checkIfPreqIsCompleted(uuid,type) === true){
                                callbacksBuilder.textOutputCallback(0, "Prequsite is completed");
                                callbacksBuilder.confirmationCallback(0, ["Next"], 0);
                            }
                            
                            else{
                            callbacksBuilder.textOutputCallback(0, JSON.stringify(jsonResponseFormData));
                            callbacksBuilder.textInputCallback(nodeConfig.input);


                            
                            if (alwaysFlag === false) {
                                if (typeofprerequisite === "training" || typeofprerequisite === "agreement") {
                                    callbacksBuilder.confirmationCallback(0, ["Done", "Skip"], 0);
                                }
                                else {
                                    if (nodeState.get("showSubmitBtn") === "true") {
                                        callbacksBuilder.confirmationCallback(0, ["Submit", "Back","Skip"], 0);
                                    } else {
                                        callbacksBuilder.confirmationCallback(0, ["Next", "Back", "Skip"], 0);
                                    }
                                }

                            }
                            else {
                                if (typeofprerequisite === "training" || typeofprerequisite === "agreement") {
                                    callbacksBuilder.confirmationCallback(0, ["Done"], 0);
                                }
                                else {
                                    if (nodeState.get("showSubmitBtn") === "true") {
                                        callbacksBuilder.confirmationCallback(0, ["Submit", "Back"], 0);
                                    } else {
                                        callbacksBuilder.confirmationCallback(0, ["Next", "Back"], 0);
                                    }
                                }

                            }
                        }

                            // if(typeofprerequisite==="training" || typeofprerequisite==="agreement"){
                            //     callbacksBuilder.confirmationCallback(0, ["Done"], 0);
                            //  } 
                            // else {
                            //     if(nodeState.get("showSubmitBtn")==="true"){
                            //         callbacksBuilder.confirmationCallback(0, ["Submit","Back"], 0);
                            //     } else {
                            //         callbacksBuilder.confirmationCallback(0, ["Next","Back"], 0);
                            //     } 
                            // }                               
                        }
                    } else {
                        if (isPreReqCompleted === "false") {
                            inputValue = null;
                            selectedOutcome = null;
                            selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

                            if(preqReuse === true && checkIfPreqIsCompleted(uuid,type) === true){
                                 if (selectedOutcome === 0){
                                    var dataObj = {
                                            "status": "COMPLETED",
                                        };
                                     prerequisiterecord.patchRequest(contextID, uuid, type, dataObj)
                                     action.goTo(nodeOutcome.PREREQ_COMPLETED);
                                 }
                            }
                            else{
                            inputValue = callbacks.getTextInputCallbacks().get(0);
                            nodeState.putShared("usrPageInfo", JSON.stringify(inputValue)); //User Input Form Info from Portal 
                            if (alwaysFlag === false) {
                                if (typeofprerequisite === "training" || typeofprerequisite === "agreement") {
                                    if (selectedOutcome === 0) {
                                        nodeState.putShared("prevFormPage", "false");
                                        action.goTo(nodeOutcome.NEXT);
                                    }
                                    else {
                                        var dataObj = {
                                            "status": "SKIPPED",
                                        };
                                        prerequisiterecord.patchRequest(contextID, uuid, type, dataObj)
                                        nodeState.putShared("PreqSKIPPED","true");
                                        action.goTo(nodeOutcome.PREREQ_COMPLETED);
                                    }


                                }
                                else {
                                    //if(nodeState.get("showSubmitBtn") === "true"){}
                                    if (selectedOutcome === 0) {
                                        nodeState.putShared("prevFormPage", "false");
                                        action.goTo(nodeOutcome.NEXT);
                                    }
                                    else if (selectedOutcome === 1) {
                                        if (compPreqPagesArray.length > 0) {
                                            nodeState.putShared("prevFormPage", "true");
                                            action.goTo(nodeOutcome.NEXT);
                                        } else {
                                            if(nodeState.get("isverifiedprerequisites")==true || nodeState.get("journeyName")==="loginPrerequisite"){
                                            //if((nodeState.get("viewPreqData")!==null && nodeState.get("viewPreqData"))){ 
                                                action.goTo(nodeOutcome.VERIFIEDPREREQBACK);
                                            }else{
                                                action.goTo(nodeOutcome.BACK);
                                            }
                                        }
                                    }
                                    else if (selectedOutcome === 2){
                                        var dataObj = {
                                            "status": "SKIPPED",
                                        };
                                        prerequisiterecord.patchRequest(contextID, uuid, type, dataObj);
                                        isPreReqCompleted = true;
                                        action.goTo(nodeOutcome.PREREQ_COMPLETED);
                                    }
                                }
                            }
                            else {
                                if (selectedOutcome === 0) {
                                    nodeState.putShared("prevFormPage", "false");
                                    action.goTo(nodeOutcome.NEXT);
                                } else {
                                    if (compPreqPagesArray.length > 0) {
                                        nodeState.putShared("prevFormPage", "true");
                                        action.goTo(nodeOutcome.NEXT);
                                    } else {
                                         if(nodeState.get("isverifiedprerequisites")==true || nodeState.get("journeyName")==="loginPrerequisite"){
                                        //if((nodeState.get("viewPreqData")!==null && nodeState.get("viewPreqData"))){ 
                                            action.goTo(nodeOutcome.VERIFIEDPREREQBACK);
                                        }else{
                                            action.goTo(nodeOutcome.BACK);
                                        }                                        
                                    }
                                }
                            }
                        }

                            // if(selectedOutcome === 0){
                            //     nodeState.putShared("prevFormPage","false");
                            //     action.goTo(nodeOutcome.NEXT);                   
                            // } else {
                            //    if(compPreqPagesArray.length>0){
                            //        nodeState.putShared("prevFormPage","true");
                            //        action.goTo(nodeOutcome.NEXT);
                            //    } else {
                            //         action.goTo(nodeOutcome.BACK);
                            //    }   
                            // }
                        }
                    }
                }

                if (isPreReqCompleted === "true") {
                    var counter = 0;
                    logger.debug("Go to Completed outcome");
                    if(saveinput === false){
                        var extIdsList=getSubmittedPrereqPagesDetails(uuid,type,null,saveinput);
                        deleteExistingFormDataFromIDNObj(extIdsList);                        
                    }
                    if((nodeState.get("isverifiedprerequisites")==true && (nodeState.get("expiryaction") == "removeRole"))){
                    //if((nodeState.get("viewPreqData")!==null && nodeState.get("viewPreqData"))){ 
                        logger.debug("Inside Verified Part")
                        preqtypeArray.forEach(value =>{
                            if(value === "workflow"){
                               if(prereqListArray.length > 0){
                                 logger.debug("prereqListArray.length is "+prereqListArray.length);
                                   for(var i=0; i < prereqListArray.length-1 ; i++){
                                     var prereqName = queryPrerequisiteRequestStatus(uuid,prereqListArray[i]);
                                     prereqNameList.push(prereqName[0].status)
                                     logger.debug("prereqNameList is "+ JSON.stringify(prereqNameList));
                                   }
                                }
                                if (prereqNameList.every(item => item === "COMPLETED" || item === "SKIPPED")){
                                    counter++;
                                }
                                }else{
                                    logger.debug("VERIFIED_PREREQ_COMPLETED")
                                }
                                if(counter>0){
                                        action.goTo(nodeOutcome.PREREQ_COMPLETED); 
                                }else{
                                    action.goTo(nodeOutcome.VERIFIED_PREREQ_COMPLETED);
                                }
                        })
                    }else{  
                        if(isworkflow == false && type == "kyid_prerequiste_workflow" || (nodeState.get("expiryaction") == "removeRole")){
                            nodeState.putShared("prereqtype","kyid_prerequisite_workflow")
                            action.goTo(nodeOutcome.IJ);
                        }else{
                            if(nodeState.get("journeyName")==="loginPrerequisite" || (nodeState.get("expiryaction") == "login.reVerify")){
                                    logger.debug("Inside loginPrerequisite")
                                    action.goTo(nodeOutcome.VERIFIED_PREREQ_COMPLETED);
                            }
                            else{
                                action.goTo(nodeOutcome.PREREQ_COMPLETED);
                            }
                            
                        }
                        
                    }
                }

            } else {
                if(nodeState.get("_idWorkflow")!==null){
                   requestId=  getRequestId(contextID, type, uuid, nodeState.get("_idWorkflow"))
                }else{
                    if (getRequestId(contextID, type, uuid) != null && getRequestId(contextID, type, uuid) != "" && getRequestId(contextID, type, uuid)) {
                    requestId = getRequestId(contextID, type, uuid);
                     }
                }
                if(requestId != null && requestId != "" && requestId){
                    nodeState.putShared("roleRequestId", requestId)
                    logger.debug("requestId from getRequestId is " + requestId)
                    decisionResponse = JSON.parse(getRequestStatus(requestId));
                    logger.debug("decisionResponse is " + decisionResponse);
                    status = decisionResponse.status;
                    logger.debug("decisionResponse Status is " + status);
                    decision = decisionResponse.decision;
                    logger.debug("decisionResponse decision is " + decision);

                    if (status === "in-progress" && decision == null) {
                        isPreReqCompleted = "false";
                        nodeState.putShared("prereqStatus", "pending");
                        nodeState.putShared("prereqWorkflowPendingStatus", "pending");
                        nodeState.putShared("prereqWorkflowRejectedStatus", null);
                        action.goTo(nodeOutcome.WORKFLOW_STATUS);
                    }
                    else if (status === "in-progress" && decision === "approved") {
                        nodeState.putShared("prereqWorkflowPendingStatus", null);
                        nodeState.putShared("prereqWorkflowRejectedStatus", null);
                        isPreReqCompleted = "true";
                        nodeState.putShared("prereqStatus", "completed");
                        timestamp = new Date().toISOString();
                        var dataObj = {
                            "status": "COMPLETED",
                            "enddate": timestamp
                        };
                         if(nodeState.get("_idWorkflow")!==null){
                           patchPrerequisiteRequestStatus(contextID,uuid,type,"COMPLETED",nodeState.get("_idWorkflow") )
                        }else{
                           prerequisiterecord.patchRequest(contextID, uuid, type, dataObj)
                        }
                        //prerequisiterecord.patchRequest(contextID, uuid, type, dataObj)
                        //patchPrerequisiteRequestStatus(contextID,uuid,type,"COMPLETED")
                        logger.debug(type + " type is successfully completed.");
                        action.goTo(nodeOutcome.PREREQ_COMPLETED);
                    }
                    else if (status === "complete" && decision === "rejected") {
                        nodeState.putShared("prereqWorkflowPendingStatus", null);
                        nodeState.putShared("prereqWorkflowRejectedStatus", "rejected");
                        isPreReqCompleted = "false";
                        nodeState.putShared("prereqStatus", "rejected");
                        timestamp = new Date().toISOString();
                        var dataObj = {
                            "status": "REJECTED",
                            "enddate": timestamp
                        };
                        prerequisiterecord.patchRequest(contextID, uuid, type, dataObj)
                        //patchPrerequisiteRequestStatus(contextID,uuid,type,"REJECTED")
                        logger.debug(type + " workflow is rejected.");
                        action.goTo(nodeOutcome.PREREQ_REJECTED);
                    }   
                    else if (status === "complete" && decision === "approved") {
                        //isPreReqCompleted = "true";
                        timestamp = new Date().toISOString();
                        var dataObj = {
                            "status": "TODO",
                            "enddate": timestamp
                        };
                        prerequisiterecord.patchRequest(contextID, uuid, type, dataObj)
                        //patchPrerequisiteRequestStatus(contextID,uuid,type,"REJECTED")
                        logger.debug(type + " workflow is restarted.");
                        action.goTo(nodeOutcome.IJ);
                    }
                    
                }else {
                    action.goTo(nodeOutcome.IJ);
                }

            }


        } else {
            /*logger.debug(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" +"Missing value of prerequisite type");*/
            errMsg = nodeLogger.readErrorMessage("KYID101");
            nodeState.putShared("readErrMsgFromCode", errMsg);
            nodeLogger.log("debug", nodeConfig, "mid", txid, errMsg);
            nodeLogger.log("debug", nodeConfig, "end", txid);
            action.goTo(nodeOutcome.ERROR);

        }
    } catch (error) {
        /*logger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName 
                         + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + error);*/
        errMsg = nodeLogger.readErrorMessage("KYID100");
        nodeState.putShared("readErrMsgFromCode", errMsg);
        nodeLogger.log("error", nodeConfig, "mid", txid, error);
        nodeLogger.log("error", nodeConfig, "end", txid);
        action.goTo(nodeOutcome.ERROR);
    }

}

//Invoke Main Function
main();


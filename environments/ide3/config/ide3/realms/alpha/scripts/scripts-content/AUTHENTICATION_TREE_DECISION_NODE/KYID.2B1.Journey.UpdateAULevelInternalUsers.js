var id = null;
var jsonArray = [];

var userType = null;
var AULevel1Code = null;
var AULevel2Code = null;
var AULevel3Code = null;
var AULevel4Code = null;
var AULevel5Code = null;

if(nodeState.get("userType")){
    logger.error("the usertype in JIT flow"+nodeState.get("userType"))
   userType=nodeState.get("userType")  
}


if (nodeState.get("_id")) {
    logger.error("IDValueinJIT:" + nodeState.get("_id"))
    id = nodeState.get("_id");
} else if(nodeState.get("usrcreatedId")) {
    logger.error("IDValueinJIT:" + nodeState.get("usrcreatedId"))
    id = nodeState.get("usrcreatedId");
}

if(userType && userType==="Internal"){
if (nodeState.get("AULevel1Name") != null) {
    AULevel1Code = nodeState.get("AULevel1Name");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit1Code";
    jsonObj["value"] = AULevel1Code;
    jsonArray.push(jsonObj);
}

if (nodeState.get("AULevel2Name") != null) {
    AULevel2Code = nodeState.get("AULevel2Name");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit2Code";
    jsonObj["value"] = AULevel2Code;
    jsonArray.push(jsonObj);
}

if (nodeState.get("AULevel3Code") != null) {
    AULevel3Code = nodeState.get("AULevel3Code");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit3Code";
    jsonObj["value"] = AULevel3Code;
    jsonArray.push(jsonObj);
} 
if (nodeState.get("AULevel4Code") != null) {
    AULevel4Code = nodeState.get("AULevel4Code");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit4Code";
    jsonObj["value"] = AULevel4Code;
    jsonArray.push(jsonObj);
} 
if (nodeState.get("AULevel5Code") != null) {
    AULevel5Code = nodeState.get("AULevel5Code");
    var jsonObj = {};
    jsonObj["operation"] = "replace";
    jsonObj["field"] = "custom_approvalUnit5Code";
    jsonObj["value"] = AULevel5Code;
    jsonArray.push(jsonObj);
} 

//Adding the last logon timestamp for the authenticated user
var jsonObj = {};
jsonObj["operation"] = "replace";
jsonObj["field"] = "custom_lastLogonDate";
jsonObj["value"] = new Date().toISOString();
jsonArray.push(jsonObj);

}

else {
//Adding the last logon timestamp for the authenticated user
var jsonObj = {};
jsonObj["operation"] = "replace";
jsonObj["field"] = "custom_lastLogonDate";
jsonObj["value"] = new Date().toISOString();
jsonArray.push(jsonObj);
}
try {
    openidm.patch("managed/alpha_user/" + id, null, jsonArray);
    logger.error("Update of AUlevel is done");
    action.goTo("true");
} catch (e) {
    logger.error("error while updating isJITDone" + e);
    action.goTo("true");
}
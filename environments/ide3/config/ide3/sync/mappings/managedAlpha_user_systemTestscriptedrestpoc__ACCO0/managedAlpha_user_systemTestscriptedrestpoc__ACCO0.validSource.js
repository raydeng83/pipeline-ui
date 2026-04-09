logger.error("XiaohanDebugPoint: Valid Source Script:: start");
logger.error("XiaohanDebugPoint: Valid Source Script context 1: " + context);
logger.error("XiaohanDebugPoint: Valid Source Script context 1: " + JSON.stringify(context));


var orgFlag = false;

if(source.memberOfOrg !== "") {

  var userOrgList = openidm.query("managed/alpha_user/"+source._id+"/memberOfOrg", {
    "_queryFilter": "true"
  }, ["name"]);

  for(var i = 0; i < userOrgList.resultCount; i++){

    var orgName = JSON.stringify(userOrgList.result[i].name);
    logger.error("Valid Source Script:: org name "+ orgName);
    if(orgName.includes(checkOrg)){

      orgFlag = true;
      break;
    }

  }

  logger.error("Valid Source Script:: org flag " + orgFlag);
  orgFlag;
}
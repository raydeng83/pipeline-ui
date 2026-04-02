logger.error("Invoking Worfkow")
var content = execution.getVariables();
var requestId = content.get('id');
var context = null;
var skipApproval = false;
var roleId = null;
var userId = null;
var skipApproval = false;
var approverLevel1 = null;
var approverLevel2 = null;
var backupApprovalLevel1 = null;
var backupApprovalLevel2 = null;
var backupApproverL1DateRange = "";
var backupApproverL2DateRange = "";
var isBackupApprovalRequire = true;
var approverLevel = "L1";
var isApprovalRequired = true;
var isBackupApprovalL1Require = false;
var isBackupApprovalL2Require = false;

function checkBackupValidity(dateRange) {
    // const dateRange = dateRange;
    const [start, end] = dateRange.split("-").map(date => new Date(date));
    const currentDate = new Date();
      
    // Normalize time to ignore time part
    currentDate.setHours(0, 0, 0, 0);
      
    if (currentDate >= start && currentDate <= end) {
        return true;
      } else {
        return false;
      }
    
}



// main execution
try {
    // Read request object
    var requestObj = openidm.action('iga/governance/requests/' + requestId, 'GET', {}, {});
    if (requestObj.request.common.context) {
        context = requestObj.request.common.context.type;
        roleId = requestObj.request.common.roleId;
        userId = requestObj.request.common.userId;
        if (context == 'admin') {
            skipApproval = true;
        }
    }
}
catch (e) {
    logger.info("Request Context Check failed " + e.message);
}

var response = openidm.query("managed/alpha_role/", { "_queryFilter": '/_id/ eq "' + roleId + '"' }, [""]);
if(response.result[0].isApprovalRequired){
    isApprovalRequired = response.result[0].isApprovalRequired;
}
if(response.result[0].approverLevel1){
    approverLevel1 = response.result[0].approverLevel1;    
}
if(response.result[0].approverLevel2){
    approverLevel2 = response.result[0].approverLevel2;    
}
if(response.result[0].backupApprovalLevel1){
    backupApprovalLevel1 = response.result[0].backupApprovalLevel1;    
}
else{
    isBackupApprovalL1Require =false;
}
if(response.result[0].backupApprovalLevel2){
    backupApprovalLevel2 = response.result[0].backupApprovalLevel2;    
}
else{
    isBackupApprovalL2Require =false;
}
if(response.result[0].backupApproverValidTillDate){
    backupApproverValidTillDate = response.result[0].backupApproverValidTillDate;    
}
if(response.result[0].backupApproverL1DateRange){
    backupApproverL1DateRange = response.result[0].backupApproverL1DateRange;    
}
if(response.result[0].backupApproverL2DateRange){
    backupApproverL2DateRange = response.result[0].backupApproverL2DateRange;    
}


if(isApprovalRequired == false){
    skipApproval = true;
    context = "admin";
}
if(checkBackupValidity(backupApproverL1DateRange) == true){
    isBackupApprovalL1Require =true;
}
else{
    isBackupApprovalL1Require =false;
}

if(checkBackupValidity(backupApproverL2DateRange)== true){
    isBackupApprovalL2Require =true;
}
else{
    isBackupApprovalL2Require =false;
}

if(approverLevel1 && approverLevel2){
    approverLevel = "L1L2"
}
else if(approverLevel1 && isBackupApprovalL2Require == true){
    approverLevel = "L1L2"
}
else if(approverLevel2&& isBackupApprovalL1Require == true){
    approverLevel = "L1L2"
}
else if(isBackupApprovalL1Require == true&& isBackupApprovalL2Require == true){
    approverLevel = "L1L2"
}
else if(isBackupApprovalL2Require == true || isBackupApprovalL1Require == true || approverLevel1 || approverLevel2){
    approverLevel = "L1"
}


logger.error("Context: " + context);
logger.error("skipApproval: " + skipApproval);
logger.error("approverLevel is : " + approverLevel);
execution.setVariable("context", context);
execution.setVariable("skipApproval", skipApproval);
execution.setVariable("roleId", roleId);
execution.setVariable("userId", userId);
execution.setVariable("approverLevel", approverLevel);
execution.setVariable("approverLevel1",approverLevel1);
execution.setVariable("approverLevel2",approverLevel2);
execution.setVariable("backupApprovalLevel1", backupApprovalLevel1);
execution.setVariable("backupApprovalLevel2",backupApprovalLevel2);
execution.setVariable("isBackupApprovalL1Require", isBackupApprovalL1Require);
execution.setVariable("isBackupApprovalL2Require", isBackupApprovalL2Require);
logger.error("End of the Execution")


/**
 * Script: KYID.Journey.InternalUserCheck
 * Description: This script is used to check internal user
 * Date: 20th Sep 2024
 * Author: Deloitte
 */

// Compute current system timestamp
var dateTime = new Date().toISOString();

// Node Config
 var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Internal User Check",
    script: "Script",
    scriptName: "KYID.Journey.InternalUserCheck",
    timestamp: dateTime,
    missingInputParams: "mandatory input params are missing",
    InvalidIP: "Invalid IP",
    InvalidIPList: "Invalid IP List",
    ipHeader1: "X-Real-IP",
    ipHeader2: "X-Trusted-Forwarded-For",
    end: "Node Execution Completed"
 };

 // Node outcomes
 var nodeOutcome = {
     Internal: "Internal",
     External: "External",
     FAIL: "Fail",
     KerberosAuthCompleted: "KerberosAuthCompleted"
 };

 // Logging Function
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

 // Declare Global Variables
 var ipAddress = null;
 var allowIPList = systemEnv.getProperty("esv.kerberos.ip.range");
 
 // User Esv for IP range
 //  var allowIPList =   [
 //    "159.19.0.0/16",
 //    "162.114.0.0/16",
 //    "205.204.128.0/18"
 // ];
  

//Get request IP
 function getRequestIP(){

    if (requestHeaders.get(nodeConfig.ipHeader1).get(0).toString()){
logger.debug("InternalUserCheck:: header value" + requestHeaders.get(nodeConfig.ipHeader1));
        ipAddress = requestHeaders.get(nodeConfig.ipHeader1).get(0).toString();
    }
    else if(requestHeaders.get(nodeConfig.ipHeader2).get(0).toString()){
logger.debug("InternalUserCheck:: header value" + requestHeaders.get(nodeConfig.ipHeader2));
        ipAddress = requestHeaders.get(nodeConfig.ipHeader2).get(0).toString();
    }
 }

 //check is ip valid
 function isValidIP(ip) {
    var regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!regex.test(ip)) return false;

    // Check if each octet is between 0 and 255
    return ip.split('.').every(octet => {
        var num = parseInt(octet, 10);
        return num >= 0 && num <= 255;
    });
}


//ip convert
function ipToInt(ip) {

    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

//iplist convert
function cidrToRange(cidr) {
    var [range, bits] = cidr.split('/');
    var mask = ~(Math.pow(2, (32 - bits)) - 1);
    //var mask = ~(2 ** (32 - bits) - 1);
    var ip = ipToInt(range);
    var start = ip & mask;
    var end = start + ~mask;
    return [start >>> 0, end >>> 0];
}


//check ip with allowIP list
function isIPInCIDR(ip, cidr) {
    // Validate the IP before processing

    const ipNum = ipToInt(ip);
    const [rangeStart, rangeEnd] = cidrToRange(cidr);
    return ipNum >= rangeStart && ipNum <= rangeEnd;
}

function isIPInCIDRList(ip, cidrlist){
    if (!isValidIP(ip)) {

        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
            +"::"+nodeConfig.scriptName+"::"+nodeConfig.InvalidIP);  
        return false;
    }

    return cidrlist.some(cidr => {
        return isIPInCIDR(ip, cidr);
    });
}

try {

    nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
        +nodeConfig.script+"::"+nodeConfig.scriptName+":: entry"); 

    getRequestIP();
    
    nodeLogger.debug("InternalUserCheck:: ipAddress " + ipAddress);
    
    if(ipAddress && allowIPList){
        allowIPList = JSON.parse(allowIPList)
        nodeLogger.debug("InternalUserCheck:: allowIPList " + allowIPList);
        
        if(isIPInCIDRList(ipAddress, allowIPList)){
            
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                +nodeConfig.script+"::"+nodeConfig.scriptName+":: Internal IP"); 

            // if (nodeState.get("isKerberosAuthCompleted") != null && nodeState.get("isKerberosAuthCompleted") == "true") {
            //      nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
            //     +nodeConfig.script+"::"+nodeConfig.scriptName+":: Kerberos auth is completed and isKerberosAuthCompleted value from node state is " + nodeState.get("isKerberosAuthCompleted")); 
            //     action.goTo(nodeOutcome.KerberosAuthCompleted);
            // } else {
                // nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                // +nodeConfig.script+"::"+nodeConfig.scriptName+":: Kerberos auth is NOT completed and isKerberosAuthCompleted value from node state is " + nodeState.get("isKerberosAuthCompleted")); 
                action.goTo(nodeOutcome.Internal);
            // }
            
        }else{
            
            nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
                +nodeConfig.script+"::"+nodeConfig.scriptName+":: External IP"); 
            action.goTo(nodeOutcome.External);
        }

    }else{

        nodeLogger.debug(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"
            +nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.missingInputParams); 
        action.goTo(nodeOutcome.External);
    }
    
} catch (error) {

    nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script
        +"::"+nodeConfig.scriptName+"::"+error);   

    action.goTo(nodeOutcome.FAIL);       
}



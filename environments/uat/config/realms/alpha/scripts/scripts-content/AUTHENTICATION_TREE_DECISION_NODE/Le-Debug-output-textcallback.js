 var fr = JavaImporter( 
    org.forgerock.openam.auth.node.api.Action, 
       javax.security.auth.callback.TextOutputCallback 
) 

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

var ipAddress;

if (requestHeaders.get(nodeConfig.ipHeader1).get(0).toString()){
logger.error("InternalUserCheck:: header value" + requestHeaders.get(nodeConfig.ipHeader1));
        ipAddress = requestHeaders.get(nodeConfig.ipHeader1).get(0).toString();
    }
    else if(requestHeaders.get(nodeConfig.ipHeader2).get(0).toString()){
logger.error("InternalUserCheck:: header value" + requestHeaders.get(nodeConfig.ipHeader2));
        ipAddress = requestHeaders.get(nodeConfig.ipHeader2).get(0).toString();
    }


if (callbacks.isEmpty()) { 
    action = fr.Action.send( 
           new fr.TextOutputCallback( 
               fr.TextOutputCallback.ERROR, 
               ipAddress
        ) 
    ).build() 
  } 
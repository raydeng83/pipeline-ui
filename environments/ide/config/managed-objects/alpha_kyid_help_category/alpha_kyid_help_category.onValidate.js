var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
if(endpointExecution === "true"){
    var resultLength = object.localizedContent.length;
    logger.error("Object Length is"+resultLength)
    if(resultLength > 1){
    throw { code: 400, message: 'Only 1 entry allowed' };
    }
}
else{
    throw { code: 500, message: "Internal Server Error : Flag Set to False"};
  }

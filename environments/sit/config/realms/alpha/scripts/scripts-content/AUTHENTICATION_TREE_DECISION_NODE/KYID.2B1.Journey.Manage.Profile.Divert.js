if(nodeState.get("back") || nodeState.get("donotagreeorgandonor")){
    nodeState.putShared("back",null);
outcome = "true";
}
else{
   outcome = "false";
}
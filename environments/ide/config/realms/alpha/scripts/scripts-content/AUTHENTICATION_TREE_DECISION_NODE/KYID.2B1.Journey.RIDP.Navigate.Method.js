if(nodeState.get("context")==="appEnroll"){
    if(nodeState.get("appEnrollRIDPMethod")==="LexisNexis"){
        nodeState.putShared("RIDPMethodUsed","LexisNexis")
        action.goTo("LexisNexis")
    }
    else if(nodeState.get("appEnrollRIDPMethod")==="CMS"){
        if(nodeState.get("ssn")!== null && nodeState.get("ssn")!== "" && nodeState.get("ssn")){
           nodeState.putShared("appEnrollRIDPMethod","SSA")
            nodeState.putShared("RIDPMethodUsed","SSA")
            action.goTo("SSA")
        }
        else{
            nodeState.putShared("appEnrollRIDPMethod","Experian")
            nodeState.putShared("RIDPMethodUsed","Experian")
            action.goTo("Experian")
        }
        
    
}
else{
    action.goTo("LexisNexis")
}
}else{
    action.goTo("LexisNexis")
}
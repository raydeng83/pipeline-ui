if(nodeState.get("PushResend")){
    nodeState.putShared("anotherFactor",null)
    nodeState.putShared("PUSHVerifyNode",null)
    nodeState.putShared("PushResend",null)
    action.goTo("Resend")
} else if(nodeState.get("anotherFactor")){
    nodeState.putShared("anotherFactor",null)
    nodeState.putShared("PUSHVerifyNode",null)
    nodeState.putShared("PushResend",null)
    action.goTo("back")
} else if(nodeState.get("PUSHVerifyNode")){
    nodeState.putShared("anotherFactor",null)
    nodeState.putShared("PUSHVerifyNode",null)
    nodeState.putShared("PushResend",null)
    action.goTo("true")
} else {
    action.goTo("error")
}
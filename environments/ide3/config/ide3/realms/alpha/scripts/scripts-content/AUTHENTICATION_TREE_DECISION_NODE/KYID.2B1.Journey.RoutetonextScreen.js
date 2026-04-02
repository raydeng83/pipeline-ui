if (nodeState.get("next") === "next"){
    action.goTo("next")
} else if (nodeState.get("userInput") === "back"){
    action.goTo("back")
} else if (nodeState.get("errorinvalidName") === "errorinvalidName") {
    action.goTo("errorinvalidName")
} else if (nodeState.get("scriptfailed") === "scriptfailed") {
    action.goTo("scriptfailed")
} else {
    action.goTo("error")
}
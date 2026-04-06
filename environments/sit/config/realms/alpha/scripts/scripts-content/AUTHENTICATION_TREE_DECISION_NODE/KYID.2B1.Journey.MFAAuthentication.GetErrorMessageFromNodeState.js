if (nodeState.get("errorMessage") != null){
    action.goTo("True");
}
    else if (nodeState.get("anotherFactor") != null){
      action.goTo("AnotherFactor");   
    }
else {
    action.goTo("False");
}
/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
if (callbacks.isEmpty()) {

//callbacksBuilder.TextOutputCallback(2,"Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development to fill empty spaces in a layout that does not yet have content. Lorem ipsum is typically a corrupted version of De finibus bonorum et malorum, a 1st-century BC text by the Roman statesman and philosopher Cicero, with words altered, added, and removed to make it nonsensical and improper Latin. The first two words themselves are a truncation of dolorem ipsum." )
callbacksBuilder.textOutputCallback(2,"Lorem ipsum is a dummy or placeholder text commonly used in graphic design, publishing, and web development to fill empty spaces")
    action.goTo("true");
} else {
 
action.goTo("true");

}
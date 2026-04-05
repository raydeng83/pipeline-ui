/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */
logger.debug("backretrylimit divert");
var userInput = nodeState.get("userInput");
var backretrylimit = nodeState.get("backretrylimit");
var backretrylimitforphone = nodeState.get("backretrylimitforphone");
var backretrylimitforpassword = nodeState.get("backretrylimitforpassword");
var differentemailretrylimit = nodeState.get("differentemailretrylimit");
var phonemaxlimit = nodeState.get("phonemaxlimit");
//var firstbackretrylimit = nodeState.get("firstbackretrylimit");
if(userInput === "back"){
action.goTo("true");
}
    else if(backretrylimit === "true"){
        nodeState.putShared("collectedPrimaryEmail",null);
        nodeState.putShared("alternateEmail",null);
        nodeState.putShared("lastName",null);
        nodeState.putShared("givenName",null);
        nodeState.putShared("telephoneNumber",null);
        nodeState.putShared("verifiedPrimaryEmail",null);
        nodeState.putShared("verifiedTelephoneNumber",null);
        nodeState.putShared("verifiedAlternateEmail",null);
        nodeState.putShared("backretrylimit",null);
       action.goTo("true");
        
    }
    else if(backretrylimitforphone === "true"){
       nodeState.putShared("collectedPrimaryEmail",null);
        nodeState.putShared("alternateEmail",null);
        nodeState.putShared("lastName",null);
        nodeState.putShared("givenName",null);
        nodeState.putShared("telephoneNumber",null);
         nodeState.putShared("verifiedPrimaryEmail",null);
        nodeState.putShared("verifiedTelephoneNumber",null);
        nodeState.putShared("verifiedAlternateEmail",null);
        nodeState.putShared("backretrylimitforphone",null);
        action.goTo("true");
    }
    else if(backretrylimitforpassword === "true"){
       nodeState.putShared("collectedPrimaryEmail",null);
        nodeState.putShared("alternateEmail",null);
        nodeState.putShared("lastName",null);
        nodeState.putShared("givenName",null);
        nodeState.putShared("telephoneNumber",null);
         nodeState.putShared("verifiedPrimaryEmail",null);
        nodeState.putShared("verifiedTelephoneNumber",null);
        nodeState.putShared("verifiedAlternateEmail",null);
        nodeState.putShared("backretrylimitforpassword",null);
        action.goTo("true");
    }
        else if(differentemailretrylimit === "true")
        {
             nodeState.putShared("collectedPrimaryEmail",null);
        nodeState.putShared("alternateEmail",null);
        nodeState.putShared("lastName",null);
        nodeState.putShared("givenName",null);
        nodeState.putShared("telephoneNumber",null);
         nodeState.putShared("verifiedPrimaryEmail",null);
        nodeState.putShared("verifiedTelephoneNumber",null);
        nodeState.putShared("verifiedAlternateEmail",null);
        nodeState.putShared("differentemailretrylimit",null);
        action.goTo("true");
        }
        else if(phonemaxlimit === "true"){
             nodeState.putShared("collectedPrimaryEmail",null);
        nodeState.putShared("alternateEmail",null);
        nodeState.putShared("lastName",null);
        nodeState.putShared("givenName",null);
        nodeState.putShared("telephoneNumber",null);
         nodeState.putShared("verifiedPrimaryEmail",null);
        nodeState.putShared("verifiedTelephoneNumber",null);
        nodeState.putShared("verifiedAlternateEmail",null);
        nodeState.putShared("phonemaxlimit",null);
        action.goTo("true");
        }
    // else if(firstbackretrylimit === "true"){
    //     nodeState.putShared("firstbackretrylimit",null)
    //     action.goTo("true");
    // }
else{
    action.goTo("false");
}



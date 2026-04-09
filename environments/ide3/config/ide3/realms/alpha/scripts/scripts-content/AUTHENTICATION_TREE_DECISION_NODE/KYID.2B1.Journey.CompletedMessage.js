/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

var dateTime = new Date().toISOString();


// Node outcomes
var nodeOutcome = {
    NEXT: "Next",
};

function main(){
    var appElementsSubJSON = {};
    var prereqcompeletedJSONObj = {};
    var appElementsOpHrsLocaleContent = {};
    try{
        appElementsSubJSON["logo"] = "kynect.png";
        appElementsSubJSON["name"] = "Kynect";
        appElementsSubJSON["role"] = "kyid_prereq_dynamicform_role";
        appElementsSubJSON["phone"] = "000-000-0000";
        appElementsSubJSON["mail"] = "help@kynect.com";
        appElementsSubJSON["url"] = "https://www.kynect.com";
        appElementsOpHrsLocaleContent["en"] = "Monday through Friday, 9 AM - 5 PM EST";
        appElementsOpHrsLocaleContent["es"] = "De lunes a viernes, de 9 a. m. - 5 p. m. EST";
        appElementsSubJSON["operatingHours"] = appElementsOpHrsLocaleContent;
        //response["application"] = appElementsSubJSON;
        //*******Hard-coded Values*******
        prereqcompeletedJSONObj["application"] = appElementsSubJSON;
        prereqcompeletedJSONObj["status"] = "Pre-requisites enrolment request is completed";
        
        if (callbacks.isEmpty()) {
            callbacksBuilder.textOutputCallback(0,JSON.stringify(prereqcompeletedJSONObj));
            callbacksBuilder.confirmationCallback(0, ["Completed"], 0);
        }else{
            selectedOutcome = callbacks.getConfirmationCallbacks().get(0);
            if(selectedOutcome === "0"){
               action.goTo(nodeOutcome.NEXT);
            }  
        }
    }catch(error){
        logger.error("error is "+ error)
    }
}

main();




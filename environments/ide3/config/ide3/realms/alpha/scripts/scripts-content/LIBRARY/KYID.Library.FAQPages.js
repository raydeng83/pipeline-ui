/**
* Name: KYID.Library.FAQPages
* Description: This library script is used to perform prerequisite form fields validation.
* Function: validate(<Parameters>)
*           Parameters: 
*                   userInfo           <JSON Object>  => Specifies the user info
*                   sysInfo            <JSON Object>  => Specifies the managed object info
*                   fieldType          <String>       => Specifies the type of form field
*                   validationArray    <JSON Array>   => Specifies array of validation constraints for a form field 
*                   optionsArray       <JSON Array>   => Specifies all the available options for a radio and checkbox type of form field  
* Import Library:  
*                Example: 
*                        var faqData = require("KYID.Library.FAQPages");
* Invoke Library Function:
*                         Examples: 
*                                 1) validationResp = faqData.validate(userInfo,sysInfo,type,validationArray,optionsArray);
* Date: 27th March 2025
* Author: Deloitte
*/


//Global Variables


function getFaqTopidId(pageHeader,Process){
    try {
        logger.error("**Inside getFaqTopidId function**");
        // var query = { _queryFilter: params}
        var response = openidm.query("managed/alpha_kyid_faq_mapping", { "_queryFilter": 'process eq "'+Process+'" AND pageHeader eq "'+pageHeader+'"' }, [""]);
        var faqTopicId = response.result[0].faqTopics
        var output = {"faqTopicId": faqTopicId };
        // return JSON.stringify(faqTopicId)
        return JSON.stringify(output)
        
    } catch (error) {
        
    }
    
}



exports.getFaqTopidId = getFaqTopidId;




logger.error("Entering Restricted Entries Check Script");


function checkRestrictedKeywords() {
    logger.error("Inside check restricted entries");
    try {
        var keywordSet = [];
        var response=openidm.query("managed/alpha_kyid_restricted_entries/", { "_queryFilter": 'true'}, ["*"]) 
        logger.error("response : "+response);      
        const keywordsArray = response.result[0].restrictedKeywords;
        logger.error("keywordsArray : "+keywordsArray);
        for (var i = 0; i < keywordsArray.length; i++) {
            var keyword = keywordsArray[i].keywords;//.toLowerCase();
            logger.error("keyword : "+keyword);
            keywordSet.push(keyword);
        }
        logger.error("keywordSet : "+keywordSet);
        return keywordSet;
    } catch (error) {
        logger.error("Exception : "+error);
    }
}

function checkInput(input,keywords) {
    logger.error("Inside check input function");
    try {
        logger.error("input value : "+input);
        const regex = /[!@#$%^&*(),.?":{}|<>]/;
        logger.error("regex.test(input) : "+regex.test(input));
        if(regex.test(input) == false && !(input.length<2) && !(input.length>64)){
            logger.error("input meets regex validation");
            if(keywords.includes(input)){
                logger.error("input matches with keyword");        
                return true;
            }else{
                logger.error("input does not match with keyword");            
                return false;
            }   
        }else{
            logger.error("input does not meet regex validation");
            return true;
        }
    } catch (error) {
        logger.error("Exception : "+error);
    }  
}

exports.checkRestrictedKeywords=checkRestrictedKeywords;
exports.checkInput=checkInput;

 
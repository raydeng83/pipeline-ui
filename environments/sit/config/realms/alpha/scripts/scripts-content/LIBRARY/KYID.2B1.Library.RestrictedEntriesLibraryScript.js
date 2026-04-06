logger.error("Entering Restricted Entries Check Script");


function checkRestrictedEntries(inputFlag) {
    logger.error("Inside check restricted entries");
    try {
        var keywordSet = [];
        var domainSet = [];
        var response=openidm.query("managed/alpha_kyid_restricted_entries/", { "_queryFilter": 'true'}, ["*"]) 
        logger.error("restricted_entries response : "+response);  

        //check value of input flag
        if(inputFlag === "name"){
			logger.error("inputflag name : "+inputFlag);
            const keywordsArray = response.result[0].restrictedKeywords;
            logger.error("keywordsArray : "+keywordsArray);
            for (var i = 0; i < keywordsArray.length; i++) {
                var keyword = keywordsArray[i].keywords;//.toLowerCase();
                logger.error("keyword : "+keyword);
                keywordSet.push(keyword);
            }
            logger.error("keywordSet : "+keywordSet);
            return keywordSet;
        }else if(inputFlag === "email"){
			logger.error("inputflag email");
            const domainArray = response.result[0].restrictedDomain;
            logger.error("domainArray : "+domainArray);
            for (var i = 0; i < domainArray.length; i++) {
                var domain = domainArray[i].domain;//.toLowerCase();
                logger.error("domain : "+domain);
                domainSet.push(domain);
            }
            logger.error("domainSet : "+domainSet);
            return domainSet;
        }
        
    } catch (error) {
        logger.error("Exception : "+error);
    }
}

function checkName(input,keywords) {
    logger.error("Inside check input name function");
    try {
        logger.error("input value : "+input);
        const regex = /^[^/{{{{\[\]:;|=,+*?<>\@"\\]}}}}+$/;
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

function checkEmail(email,domains){
	logger.error("Inside check input email function");
	try{
		logger.error("input value : "+email);
		logger.error("domains : "+domains);
		// const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        //const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
        //Updated on 14-july-2025
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const trimmedEmail = email.trim();
		
		if(trimmedEmail.length > 128){
			logger.error("email length exceeds 128 ");
			return true;
		}else{
			logger.error("email length does not exceed 128 ");
			if(emailRegex.test(trimmedEmail) == true){
				const parts = trimmedEmail.split('@');
				logger.error("parts : "+parts);				
				const [local, domain] = parts;
				
				//check if present in restricted entries
				logger.error("parts.domain : "+domain);

                if(domains.includes(domain)){
                    logger.error("email matches with restricted domain");
                    return true;
                }else{
                    logger.error("email does not match with restricted domain");
                    return false;
                }
                
			}else{
				logger.error("invalid email format");
				return true;
			}				
		}					
	}catch(error){
		logger.error("Exception : "+error);
	}
}

exports.checkRestrictedEntries=checkRestrictedEntries;
exports.checkName=checkName;
exports.checkEmail=checkEmail;

 
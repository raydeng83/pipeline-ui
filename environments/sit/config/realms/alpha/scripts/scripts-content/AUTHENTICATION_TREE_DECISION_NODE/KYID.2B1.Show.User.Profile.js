var dateTime = new Date().toISOString();
var transactionid = requestHeaders.get("X-ForgeRock-TransactionId");

// Node Config
var nodeConfig = {
    begin: "Beginning Node Execution",
    node: "Node",
    nodeName: "UserProfile",
    script: "Script",
    scriptName: "KYID.2B1.Show.User.Profile",
    errorLastName: "lastName_validation_failed",
    errorFirstName: "firstName_validation_failed",
    errorFirstNameLastName: "firstName_lastName_validation_failed",
    errorEmail: "email validation failed",
    errorId_lastNameValidation: "errorID::KYID005",
    errorId_firstNameValidation: "errorID:KYID006",
    errorId_emaileValidation: "errorID:KYID007",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    TRUE: "true",
    FALSE: "false",
    ERROR: "error"
};

// Logging function
var nodeLogger = {
    debug: function (message) {
        logger.debug(message);
    },
    error: function (message) {
        logger.error(message);
    },
    info: function (message) {
        logger.info(message);
    }
};

function requestCallbacks() {
    nodeLogger.debug(
        transactionid + "::" + nodeConfig.timestamp + "::" +
        nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
        nodeConfig.script + "::" + nodeConfig.scriptName + "::" +
        nodeConfig.begin + "::Invoking requestCallback Function"
    );

    try {
        callbacksBuilder.textOutputCallback(1, '{"pageHeader":"1_Display_Personal_Information"}'); 
        if (nodeState.get("errorMessage") != null) {
            var error = nodeState.get("errorMessage");
            callbacksBuilder.textOutputCallback(0, `<div class='error-message'>${error}</div>`);
        }

        var title =  nodeState.get("orig_custom_title");
        var firstName = nodeState.get("orig_givenName");
        logger.debug("firstName: "+firstName)
        var middleName = nodeState.get("orig_custom_middleName");
        var lastname = nodeState.get("orig_sn");
        var gender = nodeState.get("orig_custom_gender");
        var dateofBirth = nodeState.get("orig_custom_dateofBirth");
        var postalAddress = nodeState.get("orig_postalAddress");
        var city = nodeState.get("orig_city");
        var county = nodeState.get("orig_custom_county");
        var isHomeless = nodeState.get("isHomeless");
        var postalAddress2 = nodeState.get("orig_custom_postalAddress2");
        var postalCode = nodeState.get("orig_postalCode");
         logger.debug("postalCode: "+postalCode)
        var stateProvince = nodeState.get("orig_stateProvince");
        var preferences = nodeState.get("orig_preferences");
        var suffix= nodeState.get("orig_custom_suffix");
        var country = nodeState.get("orig_country")
       //Update on 22May
        //var languagePreference = nodeState.get("orig_languagePreference") || null;
        var languagePreference = nodeState.get("orig_frUnindexedString3")
        //These values for organization details
        var usractiveDomainDirectory = nodeState.get("domain") || null;
        var usrjobClassification = nodeState.get("orig_custom_jobClassification");
        var usrlevel5ApprovalUnit = nodeState.get("orig_custom_approvalUnit5Code");
        var usrlevel4ApprovalUnit = nodeState.get("orig_custom_approvalUnit4Code");
        var usrlevel3ApprovalUnit = nodeState.get("orig_custom_approvalUnit3Code");
        var usrlevel2ApprovalUnit = nodeState.get("orig_custom_approvalUnit2Code");
        var usrlevel1ApprovalUnit = nodeState.get("orig_custom_approvalUnit1Code");

        if(nodeState.get("orig_lastVerificationDate")){
            var lastVerificationDate = nodeState.get("orig_lastVerificationDate");
        }

        if(nodeState.get("orig_proofingMethod")){
           var proofingMethod = nodeState.get("orig_proofingMethod"); 
        }
        if(proofingMethod){
            if(proofingMethod == "2"){
                   proofingMethod = "4"
           }else if(proofingMethod !== "1" && proofingMethod !== "-1"){
                proofingMethod = "4"
           }else if(proofingMethod == "-1"){
                proofingMethod = "1"
           }
        }

        var IsLNKbaRequired = false
        if(proofingMethod && proofingMethod == "4" ){
            IsLNKbaRequired = true
        }else{
            IsLNKbaRequired = false
        }

        // if(nodeState.get("orig_verificationStatus")){
        //     var verificationStatus = nodeState.get("orig_verificationStatus")
        // }
        
        //var verificationStatus = nodeState.get("orig_verificationStatus");
                // var basicinformation = [];
        // basicinformation.push({
        //     Legal_First_name: firstName,
        //     Legal_Middle_name: middleName,
        //     Legal_Last_name: lastname,
        //     Gender: gender || "null",
        //     Date_of_Birth: dateofBirth || "null",
        //     Language_Preference: languagePreference || "null"

        // });

        // var homeaddress = [];
        // homeaddress.push({
        //     Address1: postalAddress || "null",
        //     Address2: postalAddress2 || "null",
        //     City: city || "null",
        //     County: county || "null",
        //     State: stateProvince || "null",
        //     Zip_Code: postalCode || "null"

        // });
 var basicinformation = {
        Title: title,
        Legal_First_name: firstName,
        Legal_Middle_name: middleName,
        Legal_Last_name: lastname,
        Gender: gender || null,
        Date_of_Birth: dateofBirth || null,
        Language_Preference: languagePreference || null,
        Suffix:suffix || null,
        IsLNKbaRequired: IsLNKbaRequired || false
};

var homeaddress = {
        isHomeless:isHomeless || null,
        Address1: postalAddress || null,
        Address2: postalAddress2 || null,
        City: city || null,
        County: county || null,
        State: stateProvince || null,
        Zip_Code: postalCode || null,
        Country : country || null
};

var organizationDetails = {
        activeDomainDirectory: usractiveDomainDirectory || null,
        jobClassification: usrjobClassification || null,
        level5ApprovalUnit: usrlevel5ApprovalUnit || null,
        level4ApprovalUnit: usrlevel4ApprovalUnit || null,
        level3ApprovalUnit: usrlevel3ApprovalUnit || null,
        level2ApprovalUnit: usrlevel2ApprovalUnit || null,
        level1ApprovalUnit: usrlevel1ApprovalUnit || null
    };
	 var identityVerification = {
		//verificationStatus: verificationStatus || null,
		proofingMethod: proofingMethod || null,
		lastVerificationDate: lastVerificationDate || null
	};													   
                var basicInfoObj = {
            "Basic Information": basicinformation
        };

        var homeAddressObj = {
			"Home Address": homeaddress
		};
        var organizationDetailsObj = {
			"Organization Details": organizationDetails
		};
        
		var identityVerificationObj = {
            "Identity verification": identityVerification
        };
        callbacksBuilder.textOutputCallback(0,JSON.stringify(basicInfoObj));
        callbacksBuilder.textOutputCallback(0,JSON.stringify(homeAddressObj));
        callbacksBuilder.textOutputCallback(0,JSON.stringify(organizationDetailsObj));
		callbacksBuilder.textOutputCallback(0, JSON.stringify(identityVerificationObj));																				 
        // callbacksBuilder.textOutputCallback(0,"Legal First Name: " + firstName);
        // callbacksBuilder.textOutputCallback(0,"Legal Middle Name: " + middleName);
        // callbacksBuilder.textOutputCallback(0,"Legal Last Name: " + lastname);
        // callbacksBuilder.textOutputCallback(0,"Date of Birth: " + dateofBirth);
        // callbacksBuilder.textOutputCallback(0,"Gender: " + gender);
        // callbacksBuilder.textOutputCallback(0,"Address: " + postalAddress + " " + postalAddress2 + ", " +city + ", " + stateProvince + " " + postalCode);
        // if(nodeState.get("orig_organPreference") === "true"){
        //     callbacksBuilder.confirmationCallback(0, ["Update"],0);
        //     }
        if(nodeState.get("orig_custom_organdonor") === true){
        
        callbacksBuilder.confirmationCallback(0, ["Update"],0);
        }
        else{
            
            callbacksBuilder.confirmationCallback(0, ["Update", "Register as Organ Donar"], 1);
            }
    } catch (error) {
        nodeLogger.error(
            transactionid + "::" + nodeConfig.timestamp + "::" +
            nodeConfig.node + "::" + nodeConfig.nodeName + "::" +
            nodeConfig.script + "::" + nodeConfig.scriptName + "::" +
            nodeConfig.begin + "::Error Occurred in Request Callback Function::" + error
        );
        action.goTo(NodeOutcome.ERROR);
    }
}

function handleUserResponses() {
    try {
        nodeLogger.debug(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Invoking handleUserResponses Function");

        var selectedOutcome = callbacks.getConfirmationCallbacks().get(0);

        if (selectedOutcome === 0) {
            nodeState.putShared("journeyName", "updateprofile")
            action.goTo(NodeOutcome.TRUE);
        } else if (selectedOutcome === 1) {
            nodeState.putShared("journeyName", "organdonor")
            action.goTo(NodeOutcome.FALSE);
        } else {
            action.goTo(NodeOutcome.ERROR);
        }
    } catch (error) {
        nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error Occurred in handleUserResponses Function::" + error); 
        action.goTo(NodeOutcome.ERROR);
    }
}

try {
    if (callbacks.isEmpty()) {
        requestCallbacks();
    } else {
        handleUserResponses();
    }
} catch (error) {
    nodeLogger.error(transactionid + "::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "::Error in main execution::" + error);
    action.goTo(NodeOutcome.ERROR);
}
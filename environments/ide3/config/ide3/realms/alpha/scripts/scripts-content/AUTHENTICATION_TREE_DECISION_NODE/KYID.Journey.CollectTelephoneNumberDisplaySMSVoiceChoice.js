var DEBUG = true;

var dateTime = new Date().toISOString();

// Node Config
var nodeConfig = {
    begin: "Begining Node Execution",
    node: "Node",
    nodeName: "Get Telephone Number and options to register",
    script: "Script",
    scriptName: "KYID.Journey.CollectTelephoneNumberDisplaySMSVoiceChoice",
    validPhoneNumber: "Valid Telephone Number",
    inValidPhoneNumber: "InValid Telephone Number",
    timestamp: dateTime,
    end: "Node Execution Completed"
};

var NodeOutcome = {
    SMS: "SMS",
    VOICE: "Voice",
    ANOTHER_FACTOR: "anotherMethod",
    FAILED: "false",
    DUPLICATE:"Duplicate",
    INVALID: "InvalidPhoneNumber",
    EMPTY_OTP: "BlankOTP"
};



 /**
   * Logging function
   * @type {Function}
   */
var nodeLogger = {
    // Logs detailed debug messages for troubleshooting  
    debug: function (message) {
        logger.debug(message);
    },
    // Logs Error that can impact Application functionality
    error: function (message) {
        logger.error(message);
    }
  }; 

// Main execution
execute();

function execute() {
    nodeState.putShared("invalidphoneNoMsg", ""); 
    nodeState.putShared("telephoneNumber", "");
    getLocale();
    var clocale = nodeState.get("clocale");
    renderPageFields(clocale);
}

function getLocale() {
   var clocale = "en";
    if (!(requestCookies && Object.keys(requestCookies).length === 0)) {
       if(requestCookies.clocale && requestCookies.clocale!=null){
           var cookieValue = requestCookies.clocale;
           if( cookieValue.localeCompare("en")==0 || cookieValue.localeCompare("es")==0 ) {
                clocale = cookieValue;
            } 
       }
   }
   nodeState.putShared("clocale", clocale);
   return clocale;
}

function GetRequestID(){
    var ReqID = "";
    var RequestIDError="";
        if (requestCookies.get("ReqID") && requestCookies.get("ReqID") != null){
            logger.error("Request id is " + requestCookies.get("ReqID"))
            ReqID= requestCookies.get("ReqID")
            if(getLocale()==="es"){
                 RequestIDError = `<br>`+"ID de transacción"+`<br>`+ ReqID
            }
            else{
            RequestIDError = `<br>`+"Transaction ID:"+`<br>`+ ReqID
            }
        }
 

    return RequestIDError
}


//Basic validations on the phone number 
function isValidPhoneNumber(number)
{
    logger.error("Inside function isValidPhoneNumber: "+number)
    var result = false;
    if(number.length>2 && number.length<15){
        result = /^[+]*[0-9]*\d{4}$/g.test(number); 
    }   

     if(result){
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.validPhoneNumber+"::"+number);
            nodeState.putShared("telephoneNumber", number);
            
        } else {
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.inValidPhoneNumber+"::"+number);
            var invalidphoneNoMsg = "";
            nodeState.putShared("invalidphoneNoMsg", ""); 
            if(getLocale() === "es"){
                invalidphoneNoMsg = systemEnv.getProperty("esv.error.invalidphonenumber.es");
                nodeState.putShared("invalidphoneNoMsg", invalidphoneNoMsg);
            } else {
                invalidphoneNoMsg = systemEnv.getProperty("esv.error.invalidphonenumber.en");
                nodeState.putShared("invalidphoneNoMsg", invalidphoneNoMsg);
            }
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+nodeConfig.inValidPhoneNumber+"::"+invalidphoneNoMsg);
        } 
    
    return result;
}


function renderPageFields(clocale) {
    var countryCode = clocale === "en" ? [
    "(+1)  United States",
    "(+93)  Afghanistan",
    "(+355)  Albania",
    "(+213)  Algeria",
    "(+1)  American Samoa",
    "(+376)  Andorra",
    "(+244)  Angola",
    "(+1)  Anguilla",
    "(+672)  Antarctica",
    "(+1)  Antigua and Barbuda",
    "(+54)  Argentina",
    "(+374)  Armenia",
    "(+297)  Aruba",
    "(+61)  Australia",
    "(+43)  Austria",
    "(+994)  Azerbaijan",
    "(+1)  Bahamas",
    "(+973)  Bahrain",
    "(+880)  Bangladesh",
    "(+1)  Barbados",
    "(+375)  Belarus",
    "(+32)  Belgium",
    "(+501)  Belize",
    "(+229)  Benin",
    "(+1)  Bermuda",
    "(+975)  Bhutan",
    "(+591)  Bolivia",
    "(+387)  Bosnia and Herzegovina",
    "(+267)  Botswana",
    "(+55)  Brazil",
    "(+246)  British Indian Ocean Territory",
    "(+1)  British Virgin Islands",
    "(+673)  Brunei",
    "(+359)  Bulgaria",
    "(+226)  Burkina Faso",
    "(+257)  Burundi",
    "(+855)  Cambodia",
    "(+237)  Cameroon",
    "(+1)  Canada",
    "(+238)  Cape Verde",
    "(+1)  Cayman Islands",
    "(+236)  Central African Republic",
    "(+235)  Chad",
    "(+56)  Chile",
    "(+86)  China",
    "(+61)  Christmas Island",
    "(+61)  Cocos Islands",
    "(+57)  Colombia",
    "(+269)  Comoros",
    "(+682)  Cook Islands",
    "(+506)  Costa Rica",
    "(+385)  Croatia",
    "(+53)  Cuba",
    "(+599)  Curacao",
    "(+357)  Cyprus",
    "(+420)  Czech Republic",
    "(+243)  Democratic Republic of the Congo",
    "(+45)  Denmark",
    "(+253)  Djibouti",
    "(+1)  Dominica",
    "(+1)  Dominican Republic",
    "(+670)  East Timor",
    "(+593)  Ecuador",
    "(+20)  Egypt",
    "(+503)  El Salvador",
    "(+240)  Equatorial Guinea",
    "(+291)  Eritrea",
    "(+372)  Estonia",
    "(+251)  Ethiopia",
    "(+500)  Falkland Islands",
    "(+298)  Faroe Islands",
    "(+679)  Fiji",
    "(+358)  Finland",
    "(+33)  France",
    "(+689)  French Polynesia",
    "(+241)  Gabon",
    "(+220)  Gambia",
    "(+995)  Georgia",
    "(+49)  Germany",
    "(+233)  Ghana",
    "(+350)  Gibraltar",
    "(+30)  Greece",
    "(+299)  Greenland",
    "(+1)  Grenada",
    "(+1)  Guam",
    "(+502)  Guatemala",
    "(+44)  Guernsey",
    "(+224)  Guinea",
    "(+245)  Guinea-Bissau",
    "(+592)  Guyana",
    "(+509)  Haiti",
    "(+504)  Honduras",
    "(+852)  Hong Kong",
    "(+36)  Hungary",
    "(+354)  Iceland",
    "(+91)  India",
    "(+62)  Indonesia",
    "(+98)  Iran",
    "(+964)  Iraq",
    "(+353)  Ireland",
    "(+44)  Isle of Man",
    "(+972)  Israel",
    "(+39)  Italy",
    "(+225)  Ivory Coast",
    "(+1)  Jamaica",
    "(+81)  Japan",
    "(+44)  Jersey",
    "(+962)  Jordan",
    "(+7)  Kazakhstan",
    "(+254)  Kenya",
    "(+686)  Kiribati",
    "(+383)  Kosovo",
    "(+965)  Kuwait",
    "(+996)  Kyrgyzstan",
    "(+856)  Laos",
    "(+371)  Latvia",
    "(+961)  Lebanon",
    "(+266)  Lesotho",
    "(+231)  Liberia",
    "(+218)  Libya",
    "(+423)  Liechtenstein",
    "(+370)  Lithuania",
    "(+352)  Luxembourg",
    "(+853)  Macau",
    "(+389)  Macedonia",
    "(+261)  Madagascar",
    "(+265)  Malawi",
    "(+60)  Malaysia",
    "(+960)  Maldives",
    "(+223)  Mali",
    "(+356)  Malta",
    "(+692)  Marshall Islands",
    "(+222)  Mauritania",
    "(+230)  Mauritius",
    "(+262)  Mayotte",
    "(+52)  Mexico",
    "(+691)  Micronesia",
    "(+373)  Moldova",
    "(+377)  Monaco",
    "(+976)  Mongolia",
    "(+382)  Montenegro",
    "(+1)  Montserrat",
    "(+212)  Morocco",
    "(+258)  Mozambique",
    "(+95)  Myanmar",
    "(+264)  Namibia",
    "(+674)  Nauru",
    "(+977)  Nepal",
    "(+31)  Netherlands",
    "(+599)  Netherlands Antilles",
    "(+687)  New Caledonia",
    "(+64)  New Zealand",
    "(+505)  Nicaragua",
    "(+227)  Niger",
    "(+234)  Nigeria",
    "(+683)  Niue",
    "(+850)  North Korea",
    "(+1)  Northern Mariana Islands",
    "(+47)  Norway",
    "(+968)  Oman",
    "(+92)  Pakistan",
    "(+680)  Palau",
    "(+970)  Palestine",
    "(+507)  Panama",
    "(+675)  Papua New Guinea",
    "(+595)  Paraguay",
    "(+51)  Peru",
    "(+63)  Philippines",
    "(+64)  Pitcairn",
    "(+48)  Poland",
    "(+351)  Portugal",
    "(+1)  Puerto Rico",
    "(+974)  Qatar",
    "(+242)  Republic of the Congo",
    "(+262)  Reunion",
    "(+40)  Romania",
    "(+7)  Russia",
    "(+250)  Rwanda",
    "(+590)  Saint Barthelemy",
    "(+290)  Saint Helena",
    "(+1)  Saint Kitts and Nevis",
    "(+1)  Saint Lucia",
    "(+590)  Saint Martin",
    "(+508)  Saint Pierre and Miquelon",
    "(+1)  Saint Vincent and the Grenadines",
    "(+685)  Samoa",
    "(+378)  San Marino",
    "(+239)  Sao Tome and Principe",
    "(+966)  Saudi Arabia",
    "(+221)  Senegal",
    "(+381)  Serbia",
    "(+248)  Seychelles",
    "(+232)  Sierra Leone",
    "(+65)  Singapore",
    "(+1)  Sint Maarten",
    "(+421)  Slovakia",
    "(+386)  Slovenia",
    "(+677)  Solomon Islands",
    "(+252)  Somalia",
    "(+27)  South Africa",
    "(+82)  South Korea",
    "(+211)  South Sudan",
    "(+34)  Spain",
    "(+94)  Sri Lanka",
    "(+249)  Sudan",
    "(+597)  Suriname",
    "(+47)  Svalbard and Jan Mayen",
    "(+268)  Swaziland",
    "(+46)  Sweden",
    "(+41)  Switzerland",
    "(+963)  Syria",
    "(+886)  Taiwan",
    "(+992)  Tajikistan",
    "(+255)  Tanzania",
    "(+66)  Thailand",
    "(+228)  Togo",
    "(+690)  Tokelau",
    "(+676)  Tonga",
    "(+1)  Trinidad and Tobago",
    "(+216)  Tunisia",
    "(+90)  Turkey",
    "(+993)  Turkmenistan",
    "(+1)  Turks and Caicos Islands",
    "(+688)  Tuvalu",
    "(+1)  U.S. Virgin Islands",
    "(+256)  Uganda",
    "(+380)  Ukraine",
    "(+971)  United Arab Emirates",
    "(+44)  United Kingdom",
    "(+598)  Uruguay",
    "(+998)  Uzbekistan",
    "(+678)  Vanuatu",
    "(+379)  Vatican",
    "(+58)  Venezuela",
    "(+84)  Vietnam",
    "(+681)  Wallis and Futuna",
    "(+212)  Western Sahara",
    "(+967)  Yemen",
    "(+260)  Zambia",
    "(+263)  Zimbabwe"
] 
    : 
[
    "(+1) Estados Unidos",
    "(+93) Afganistán",
    "(+355) Albania",
    "(+213) Argelia",
    "(+1) Samoa Americana",
    "(+376) Andorra",
    "(+244) Angola",
    "(+1) Anguila",
    "(+672) Antártida",
    "(+1) Antigua y Barbuda",
    "(+54) Argentina",
    "(+374) Armenia",
    "(+297) Aruba",
    "(+61) Australia",
    "(+43) Austria",
    "(+994) Azerbaiyán",
    "(+1) Bahamas",
    "(+973) Baréin",
    "(+880) Bangladesh",
    "(+1) Barbados",
    "(+375) Bielorrusia",
    "(+32) Bélgica",
    "(+501) Belice",
    "(+229) Benín",
    "(+1) Bermudas",
    "(+975) Bután",
    "(+591) Bolivia",
    "(+387) Bosnia y Herzegovina",
    "(+267) Botsuana",
    "(+55) Brasil",
    "(+246) Territorio Británico del Océano Índico",
    "(+1) Islas Vírgenes Británicas",
    "(+673) Brunei",
    "(+359) Bulgaria",
    "(+226) Burkina Faso",
    "(+257) Burundi",
    "(+855) Camboya",
    "(+237) Camerún",
    "(+1) Canadá",
    "(+238) Cabo Verde",
    "(+1) Islas Caimán",
    "(+236) República Centroafricana",
    "(+235) Chad",
    "(+56) Chile",
    "(+86) China",
    "(+61) Isla Christmas",
    "(+61) Islas Cocos",
    "(+57) Colombia",
    "(+269) Comoras",
    "(+682) Islas Cook",
    "(+506) Costa Rica",
    "(+385) Croacia",
    "(+53) Cuba",
    "(+599) Curazao",
    "(+357) Chipre",
    "(+420) República Checa",
    "(+243) República Democrática del Congo",
    "(+45) Dinamarca",
    "(+253) Yibuti",
    "(+1) Dominica",
    "(+1) República Dominicana",
    "(+670) Timor Oriental",
    "(+593) Ecuador",
    "(+20) Egipto",
    "(+503) El Salvador",
    "(+240) Guinea Ecuatorial",
    "(+291) Eritrea",
    "(+372) Estonia",
    "(+251) Etiopía",
    "(+500) Malvinas Islas",
    "(+298) Islas Feroe",
    "(+679) Fiyi",
    "(+358) Finlandia",
    "(+33) Francia",
    "(+689) Polinesia Francesa",
    "(+241) Gabón",
    "(+220) Gambia",
    "(+995) Georgia",
    "(+49) Alemania",
    "(+233) Ghana",
    "(+350) Gibraltar",
    "(+30) Grecia",
    "(+299) Groenlandia",
    "(+1) Granada",
    "(+1) Guam",
    "(+502) Guatemala",
    "(+44) Guernsey",
    "(+224) Guinea",
    "(+245) Guinea-Bissau",
    "(+592) Guyana",
    "(+509) Haití",
    "(+504) Honduras",
    "(+852) Hong Kong",
    "(+36) Hungría",
    "(+354) Islandia",
    "(+91) India",
    "(+62) Indonesia",
    "(+98) Irán",
    "(+964) Irak",
    "(+353) Irlanda",
    "(+44) Isla de Man",
    "(+972) Israel",
    "(+39) Italia",
    "(+225) Costa de Marfil",
    "(+1) Jamaica",
    "(+81) Japón",
    "(+44) Jersey",
    "(+962) Jordania",
    "(+7) Kazajistán",
    "(+254) Kenia",
    "(+686) Kiribati",
    "(+383) Kosovo",
    "(+965) Kuwait",
    "(+996) Kirguistán",
    "(+856) Laos",
    "(+371) Letonia",
    "(+961) Líbano",
    "(+266) Lesoto",
    "(+231) Liberia",
    "(+218) Libia",
    "(+423) Liechtenstein",
    "(+370) Lituania",
    "(+352) Luxemburgo",
    "(+853) Macao",
    "(+389) Macedonia",
    "(+261) Madagascar",
    "(+265) Malawi",
    "(+60) Malasia",
    "(+960) Maldivas",
    "(+223) Malí",
    "(+356) Malta",
    "(+692) Islas Marshall",
    "(+222) Mauritania",
    "(+230) Mauricio",
    "(+262) Mayotte",
    "(+52) México",
    "(+691) Micronesia",
    "(+373) Moldavia",
    "(+377) Mónaco",
    "(+976) Mongolia",
    "(+382) Montenegro",
    "(+1) Montserrat",
    "(+212) Marruecos",
    "(+258) Mozambique",
    "(+95) Myanmar",
    "(+264) Namibia",
    "(+674) Nauru",
    "(+977) Nepal",
    "(+31) Países Bajos",
    "(+599) Antillas Neerlandesas",
    "(+687) Nueva Caledonia",
    "(+64) Nueva Zelanda",
    "(+505) Nicaragua",
    "(+227) Níger",
    "(+234) Nigeria",
    "(+683) Niue",
    "(+850) Corea del Norte",
    "(+1) Islas Marianas del Norte",
    "(+47) Noruega",
    "(+968) Omán",
    "(+92) Pakistán",
    "(+680) Palau",
    "(+970) Palestina",
    "(+507) Panamá",
    "(+675) Papúa Nueva Guinea",
    "(+595) Paraguay",
    "(+51) Perú",
    "(+63) Filipinas",
    "(+64) Pitcairn",
    "(+48) Polonia",
    "(+351) Portugal",
    "(+1) Puerto Rico",
    "(+974) Qatar",
    "(+242) República del Congo",
    "(+262) Reunión",
    "(+40) Rumania",
    "(+7) Rusia",
    "(+250) Ruanda",
    "(+590) San Bartolomé",
    "(+290) Santa Elena",
    "(+1) San Cristóbal y Nieves",
    "(+1) Santa Lucía",
    "(+590) San Martín",
    "(+508) San Pedro y Miquelón",
    "(+1) San Vicente y las Granadinas",
    "(+685) Samoa",
    "(+378) San Marino",
    "(+239) Santo Tomé y Príncipe",
    "(+966) Arabia Saudita",
    "(+221) Senegal",
    "(+381) Serbia",
    "(+248) Seychelles",
    "(+232) Sierra Leona",
    "(+65) Singapur",
    "(+1) San Martín",
    "(+421) Eslovaquia",
    "(+386) Eslovenia",
    "(+677) Islas Salomón",
    "(+252) Somalia",
    "(+27) Sudáfrica",
    "(+82) Corea del Sur",
    "(+211) Sudán del Sur",
    "(+34) España", 
    "(+94) Sri Lanka",
    "(+249) Sudán", 
    "(+597) Surinam", 
    "(+47) Svalbard y Jan Mayen",
    "(+268) Suazilandia ", 
    "(+46) Suecia", "(+41) Suiza",
    "(+963) Siria", "(+886) Taiwán",
    "(+992) Tayikistán", "(+255) Tanzania",
    "(+66) Tailandia", "(+228) Togo", "(+690) Tokelau", 
    "(+676) Tonga", "(+1) Trinidad y Tobago", "(+216) Túnez",
    "(+90) Turquía", 
    "(+993) Turkmenistán",
    "(+1) Islas Turcas y Caicos",
    "(+688) Tuvalu",
    "(+1) Islas Vírgenes de Estados Unidos",
    "(+256) Uganda",
    "(+380) Ucrania", 
    "(+971) Emiratos Árabes Unidos",
    "(+44) Reino Unido", 
    "(+598) Uruguay", 
    "(+998) Uzbekistán", 
    "(+678) Vanuatu",
    "(+379) Vaticano", 
    "(+58) Venezuela", 
    "(+84) Vietnam", 
    "(+681) Wallis y Futuna",
    "(+212) Sáhara Occidental", 
    "(+967) Yemen", "(+260) Zambia",
    "(+263) Zimbabue"
]
    var smsOption = clocale === "en" ? "SMS" : "SMS";
    var voiceOption = clocale === "en" ? "Voice" : "Voz";
    var anotherMethodOption = clocale === "en" ? "Return to authenticator list" : "Volver a la lista de autenticadores"
    var phoneexample = clocale === "en" ? 
          "Phone number (Without country code)" : "Número de teléfono (Sin código de país)"
    var enterPhoneLabel = clocale === "en" ? 
        "Enter your phone number to receive a verification code.": 
        "Ingrese su número de teléfono para recibir un código de verificación.";
    var choicePrompt = clocale === "en" ? 
        "Select a method to receive a verification code. Carrier messaging charges may apply." : 
        "Seleccione un método para recibir un código de verificación. Se pueden aplicar cargos por mensajes del operador.";
    var countryChoicePrompt = clocale === "en" ? 
        "(Code) Country" : 
        "Gestionar sus métodos de seguridad";

    if (callbacks.isEmpty()) {
        if (nodeState.get("errorInvalidPhoneNumber") != null ){
               var errorInvalidPhoneNumber = nodeState.get("errorInvalidPhoneNumber");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorInvalidPhoneNumber+`</div>`)
        }

        if (nodeState.get("errorDuplicatePhoneNumber") != null){
               var errorDuplicatePhoneNumber = nodeState.get("errorDuplicatePhoneNumber");
               callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorDuplicatePhoneNumber+`</div>`)
        }

        if (nodeState.get("errorMessage") != null){
               var errorMessage = nodeState.get("errorMessage");
               callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage +`</div>`)
        }

        if (nodeState.get("errorMessage_BlankOTP") != null) {
            var errorMessage_BlankOTP =nodeState.get("errorMessage_BlankOTP");
            logger.error("Reading the blankOTP error");
            callbacksBuilder.textOutputCallback(0,`<div class='error-message'>`+errorMessage_BlankOTP+`</div>`)
        }

        callbacksBuilder.textOutputCallback(0,"<div class='page-element'></div>");

        /* Country Code */
        callbacksBuilder.choiceCallback(countryChoicePrompt, countryCode, 0, false);
 
        callbacksBuilder.textInputCallback(phoneexample);
        callbacksBuilder.textOutputCallback(0,"<div class='page-element'></div>");
        callbacksBuilder.confirmationCallback(0,[smsOption, voiceOption, anotherMethodOption],0);
        
    } else {
  
        var selectCountryChoiceIndex = callbacks.getChoiceCallbacks().get(0)[0];
        var countryWithCode = countryCode[selectCountryChoiceIndex];
        var countryCode = getCountryCode(countryWithCode);
        var telephoneNum = countryCode + callbacks.getTextInputCallbacks().get(0).trim();
        nodeLogger.error("AUDIT::"+nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+" Printing the telephone number ****** ::" + telephoneNum);
        
        var selectedIndex = callbacks.getConfirmationCallbacks().get(0);
        var selectedOption = selectedIndex === 0 ? smsOption : voiceOption;
        
        if(selectedIndex === 0){
         selectedOption = smsOption 
        } else if(selectedIndex === 1){
            selectedOption = voiceOption
        } else if(selectedIndex === 2){
            selectedOption = anotherMethodOption
        }

        if (!selectedOption) {
            action.goTo(NodeOutcome.FAILED);
        } else {
            nodeState.putShared("selectedOption", selectedOption);
            nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Selected option ::"  + nodeState.get("selectedOption"));
            // Redirect based on selected option
            if (selectedOption === "SMS") {
   logger.error("SMS Printing numberWithoutCountrycode" + numberWithoutCountrycode);
   var numberWithoutCountrycode = callbacks.getTextInputCallbacks().get(0).trim();
   if(!numberWithoutCountrycode || numberWithoutCountrycode == null){
       logger.error("SMS inside blank number");
    nodeState.putShared("errorInvalidPhoneNumber", null);
    nodeState.putShared("errorDuplicatePhoneNumber", null); 
    nodeState.putShared("errorMessage", null);
    nodeState.putShared("errorMessage_BlankOTP", null)
       nodeState.putShared("resendcodeMessage", null)
    action.goTo(NodeOutcome.EMPTY_OTP);
   } else {
     nodeState.putShared("errorInvalidPhoneNumber", null);
    nodeState.putShared("errorDuplicatePhoneNumber", null); 
    nodeState.putShared("errorMessage", null);
    nodeState.putShared("errorMessage_BlankOTP", null)
    nodeState.putShared("resendcodeMessage", null)

    if(isValidPhoneNumber(telephoneNum)){
        
        var numberWithoutCountrycode = callbacks.getTextInputCallbacks().get(0).trim();
        if(numberWithoutCountrycode.length>10){
        logger.error("inside sms numberWithoutCountrycode"+numberWithoutCountrycode);
      var invalidphoneNoMsg = "";
     nodeState.putShared("invalidphoneNoMsg", ""); 
     if(getLocale() === "es"){
     invalidphoneNoMsg = systemEnv.getProperty("esv.error.invalidphonenumber.es");
     nodeState.putShared("invalidphoneNoMsg", invalidphoneNoMsg);
     } else {
     invalidphoneNoMsg = systemEnv.getProperty("esv.error.invalidphonenumber.en");
     nodeState.putShared("invalidphoneNoMsg", invalidphoneNoMsg);
     }
        action.goTo(NodeOutcome.INVALID);
        } 
        else if(isDuplicateNumberCheck(telephoneNum)){
            nodeState.putShared("errorInvalidPhoneNumber", null);
            nodeState.putShared("errorDuplicatePhoneNumber", null); 
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("resendcodeMessage", null)
            action.goTo(NodeOutcome.DUPLICATE);
        }
        else{
            nodeState.putShared("errorInvalidPhoneNumber", null);
            nodeState.putShared("errorDuplicatePhoneNumber", null);    
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("errorMessage_BlankOTP", null)
            nodeState.putShared("resendcodeMessage", null)
            action.goTo(NodeOutcome.SMS);
        }
     } else {
            nodeState.putShared("errorInvalidPhoneNumber", null);
            nodeState.putShared("errorDuplicatePhoneNumber", null);    
            nodeState.putShared("errorMessage", null);
            nodeState.putShared("errorMessage_BlankOTP", null)
        nodeState.putShared("resendcodeMessage", null)
        action.goTo(NodeOutcome.INVALID);
     }
     
     }


   } else if (selectedOption === "Voice" || selectedOption === "Voz") {
     var numberWithoutCountrycode = callbacks.getTextInputCallbacks().get(0).trim();
     if(!numberWithoutCountrycode || numberWithoutCountrycode == null){
    nodeState.putShared("errorInvalidPhoneNumber", null);
    nodeState.putShared("errorDuplicatePhoneNumber", null); 
    nodeState.putShared("errorMessage", null);
    nodeState.putShared("errorMessage_BlankOTP", null)
    action.goTo(NodeOutcome.EMPTY_OTP);
   }
   else {
                nodeState.putShared("errorInvalidPhoneNumber", null);
                nodeState.putShared("errorDuplicatePhoneNumber", null); 
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("errorMessage_BlankOTP", null)
                if(isValidPhoneNumber(telephoneNum)){
                   var numberWithoutCountrycode = callbacks.getTextInputCallbacks().get(0).trim();
                    if(numberWithoutCountrycode.length>10){
                    logger.error("inside sms numberWithoutCountrycode"+numberWithoutCountrycode);
                    var invalidphoneNoMsg = "";
                    nodeState.putShared("invalidphoneNoMsg", ""); 
                    if(getLocale() === "es"){
                        invalidphoneNoMsg = systemEnv.getProperty("esv.error.invalidphonenumber.es");
                        nodeState.putShared("invalidphoneNoMsg", invalidphoneNoMsg);
                    } else {
                        invalidphoneNoMsg = systemEnv.getProperty("esv.error.invalidphonenumber.en");
                        nodeState.putShared("invalidphoneNoMsg", invalidphoneNoMsg);
                    }
                        action.goTo(NodeOutcome.INVALID);
                    }
                    if(isDuplicateNumberCheck(telephoneNum)){
                        nodeState.putShared("errorInvalidPhoneNumber", null);
                        nodeState.putShared("errorDuplicatePhoneNumber", null); 
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("errorMessage_BlankOTP", null)
                        nodeState.putShared("resendcodeMessage", null)
                        action.goTo(NodeOutcome.DUPLICATE);
                    }
                    else{
                        nodeState.putShared("errorInvalidPhoneNumber", null);
                        nodeState.putShared("errorDuplicatePhoneNumber", null); 
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("errorMessage_BlankOTP", null);
                        nodeState.putShared("resendcodeMessage", null)
                        action.goTo(NodeOutcome.VOICE);
                    }
                } else {
                    action.goTo(NodeOutcome.INVALID);
                }
   }
        }       
            else if(selectedIndex === 2) {
                nodeState.putShared("errorInvalidPhoneNumber", null);
                nodeState.putShared("errorDuplicatePhoneNumber", null); 
                nodeState.putShared("errorMessage", null);
                nodeState.putShared("errorMessage_BlankOTP", null);
                nodeState.putShared("resendcodeMessage", null)
                nodeLogger.error(nodeConfig.timestamp+"::"+nodeConfig.node+"::"+nodeConfig.nodeName+"::"+nodeConfig.script+"::"+nodeConfig.scriptName+"::"+"Inside_Another_Factor");
                action.goTo(NodeOutcome.ANOTHER_FACTOR);
            }
            else {
                 nodeState.putShared("errorInvalidPhoneNumber", null);
                        nodeState.putShared("errorDuplicatePhoneNumber", null);    
                        nodeState.putShared("errorMessage", null);
                        nodeState.putShared("errorMessage_BlankOTP", null);
                        nodeState.putShared("resendcodeMessage", null)
                    
                    
                action.goTo(NodeOutcome.FAILED);
            }
        }  
    }
    }


function isDuplicateNumberCheck(collectedPhoneNumber) {
    logger.error("collectedPhoneNumber: "+collectedPhoneNumber)
    var existingTelephoneNumber = null;
    var usrKOGID = null;
    var exist = false; 
    
    if(nodeState.get("KOGID") && nodeState.get("KOGID")!=null){
        usrKOGID = nodeState.get("KOGID");
    }
    logger.error("usrKOGID value is: "+usrKOGID)
    var usrMFAData = getMFAObject(usrKOGID);
    var mfaValueArray = getUserActiveMFAValue(usrMFAData, "SMSVOICE")

    for(var i=0;i<mfaValueArray.length;i++){
        logger.error("PhoneNumber in Directory is: "+mfaValueArray[i]);
        existingTelephoneNumber = mfaValueArray[i];
         logger.error("existingTelephoneNumber: "+existingTelephoneNumber)
         logger.error("typeof existingTelephoneNumber: "+typeof existingTelephoneNumber)

    // Check for duplicates
        if (existingTelephoneNumber.localeCompare(collectedPhoneNumber)==0){
            logger.error("****Duplicate numbers********");
            exist = true;
        } else {
            logger.error("****Not Duplicate numbers********");
        }
    }
    return exist;
}

/*function getUserId() {
    try {
        var userId = nodeState.get("_id");
        nodeLogger.debug("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Printing the user ID :::::: " + userId);
        return userId;
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error retrieving user ID from node state: " + error.message);
        return null;
    }
}
 
 
// Function to read user data from OpenIDM
function fetchUserData(userId) {
    try {
        return openidm.read("managed/alpha_user/" + userId);
    } catch (error) {
        nodeLogger.error("AUDIT::" + nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + "Error reading user data from OpenIDM: " + error.message);
        return null;
    }
}*/

function renderUI(UIElement) {
    if (callbacks.isEmpty()) {
        callbacksBuilder.textOutputCallback(0, UIElement);
    }
}


/**
* Name: getCountryCode
* Description: The function to extract country code from the country format. The format is (+XXX) <COUNTRY_NAME>
* Returns:Country Code 
*/
function getCountryCode(country){
    try{
        var i;
        var startBIndex=0;
        var closeBIndex=0;
        var countryCode;
        
        for(i=0;i<country.length;i++){
            if(country.charAt(i) == "("){
                startBIndex = i+1;
            }else if(country.charAt(i) == ")"){
                closeBIndex=i;
            }
        }
        countryCode = country.substring(startBIndex,closeBIndex);
    }catch(error){
        countryCode = country
    }
    
    return countryCode
}

//To be removed.
function debug(message){
     if (callbacks.isEmpty()) {
           callbacksBuilder.textOutputCallback(0,message);
     }
}


function getUserActiveMFAValue(usrMFAData, usrMFAType) {
    var mfaValueArray = []
    if (usrMFAData.result.length > 0) {
        for (var i = 0; i < usrMFAData.result.length; i++) {
            var mfaMethodResponse = usrMFAData.result[i];
            if (mfaMethodResponse["MFAStatus"].localeCompare("ACTIVE") == 0 && mfaMethodResponse["MFAMethod"].localeCompare(usrMFAType) == 0) {
                mfaValueArray.push(mfaMethodResponse["MFAValue"]);
            }
        }
    }
    return mfaValueArray;                                                                      
}
 
 
function getMFAObject(usrKOGID) {
    try {
        var mfaMethodResponses = openidm.query("managed/alpha_kyid_mfa_methods", { "_queryFilter" : '/KOGId eq "'+ usrKOGID + '"'});      
        nodeLogger.error("Printing the mfaMethodResponses ::::::::::::: "+mfaMethodResponses)
        return mfaMethodResponses;
 
    } catch (error) {
        nodeLogger.error(nodeConfig.timestamp + "::" + nodeConfig.node + "::" + nodeConfig.nodeName + "::" + nodeConfig.script + "::" + nodeConfig.scriptName + "::" + nodeConfig.begin + ("Error in obtaining MFA data for the user: " + error.message));
    }
}
 
<div class="kog-header">
  ¡Bienvenido a la nueva página de inicio de sesión de Kentucky Online Gateway (KOG)! Por favor inicie sesión con su cuenta KOG existente. Si tiene algún problema de inicio de sesión, por favor consulte la nueva página de Ayuda.
  
  
  
  <a href="https://dev.kog.ky.gov/public/help/" target="_blank">Help</a> page.




</div>

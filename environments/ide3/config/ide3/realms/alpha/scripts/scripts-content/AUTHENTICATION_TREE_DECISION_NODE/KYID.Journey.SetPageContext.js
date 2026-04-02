/**
 * Script: KYID.Journey.SetPageContext
 * Description: This script is used to           
 * Date: 26th July 2024
 * Author: Deloitte
 **/


//var DEBUG = true;

/* Main method to execute the script. */
execute()

function execute(){
    try{
    
        const PAGE_NAME = "login-email"
        
        if(nodeState.get(PAGE_NAME)){
            nodeState.putShared("pageContext",nodeState.get(PAGE_NAME))
          //displayMessage("info","Fetching from NodeState")
        }else{
           var pageMetadata = {
                            "name":PAGE_NAME,
                            "titleen":"You are sign-in KY application ",
                            "titlees":"Estás iniciando sesión en la aplicación KY ",
                            "message":" ",
                            "errors":[
                                {
                                    "title":"Show Error",
                                    "message":"This is how message"
                                }
                            ],
                            "fields":[{
                                "type":"input",
                                "callback_type":"username",
                                "name":"login-email.email",
                                "labelen":"Username",
                                "labeles":"Nombre de usuario",
                                "isrequired":true,
                                "isactive":true
                            },
                                      {
                                "type":"input",
                                 "name":"login-email.password",
                                 "callback_type":"password",
                                 "labelen": "New password",
                                 "labeles": "Nueva contraseña",
                                 "labelpen":"Re-enter password",
                                 "labelpes":"Escriba la contraseña otra vez",
                                 "isrequired":true,
                                 "isactive":true
                             }
                       ],
                           "footerfields":[
                             //  {
                             //    "type":"link",
                             //    "name":"login-email.createaccount",
                             //     "labelen":"Create New Account",
                             //     "labeles":"Crear nueva cuenta",
                             //    "values":[
                             //        "https://KOG/account"
                             //    ],
                             //    "isactive":true
                             // } 
                           ],
                           "actions":[
                               "Next",
                           ]
            } 
      //displayMessage("info","Fetching from Object")
           
            nodeState.putShared(PAGE_NAME,pageMetadata)
        }//end of else
    
 //displayMessage ("info", JSON.stringify(nodeState.get(PAGE_NAME)))
 action.goTo("Continue")
    }catch(error){
        //displayMessage (3, error)
    }
}


//function displayMessage (type,message) {
   // try{
        /* Global DEBUG variable. */
       // if(DEBUG){
            // var code = 0
            // if(type.toLowerCase() == "info"){
             //    code = 0
            // }else if (type.toLowerCase() == "warn"){
             //    code = 1
             //}else if (type.toLowerCase() == "error"){
               //  code = 2
            // }
            // if (callbacks.isEmpty()) {
              //  callbacksBuilder.textOutputCallback(code,message)
            // }
       // }
   // }catch(error){
       // if (callbacks.isEmpty()) {
            //callbacksBuilder.textOutputCallback(3,error)
       //  } 
   // }
//}



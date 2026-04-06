/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

 var fr = JavaImporter( 
    org.forgerock.openam.auth.node.api.Action, 
       javax.security.auth.callback.TextOutputCallback 
) 


if (callbacks.isEmpty()) { 
    action = fr.Action.send( 
           new fr.TextOutputCallback( 
               fr.TextOutputCallback.ERROR, 
               sharedState 
        ) 
    ).build() 
  } else { 
             action = fr.Action.goTo("true").build() 
} 


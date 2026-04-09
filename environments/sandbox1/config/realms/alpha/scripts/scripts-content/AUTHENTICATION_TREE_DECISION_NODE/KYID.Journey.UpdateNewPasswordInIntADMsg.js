/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */

 if (callbacks.isEmpty()) {     
       callbacksBuilder.textOutputCallback(0,systemEnv.getProperty("esv.updatepwdinternaladmsg.en"));
    //callbacksBuilder.textOutputCallback(0,systemEnv.getProperty("esv.updatepwdinternaladmsg.es"));
} else {             
   outcome="True";
}

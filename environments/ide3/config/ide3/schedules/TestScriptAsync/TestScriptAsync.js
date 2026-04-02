function delay(ms){
          logger.error("Inside Delay Function")
         var StartTime = Date.now();
         while ( Date.now() - StartTime < ms ){
           //  busy wait for delay
         }
       }
       logger.error("Script execution started")
       delay(60000)
       logger.error("Script execution completed")
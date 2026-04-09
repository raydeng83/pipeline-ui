 logger.error("XiaohanDebugPoint onsync script start 1");
(function() {
  logger.error("XiaohanDebugPoint onsync script start 2");

  if (syncResults.success) {
    
      logger.error("XiaohanDebugPoint onSync Script: syncResults: " + syncResults);
      logger.error("XiaohanDebugPoint onSync Script: syncResults 2: " + JSON.stringify(syncResults));
      return;
  }
}());
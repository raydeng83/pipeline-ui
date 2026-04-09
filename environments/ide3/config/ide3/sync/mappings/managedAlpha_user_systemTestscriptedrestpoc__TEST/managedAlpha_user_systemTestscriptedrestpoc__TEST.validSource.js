logger.error("XiaohanDebugPoint Valid Source Script start");
logger.error("XiaohanDebugPoint: Valid Source Script context 1: " + context);
logger.error("XiaohanDebugPoint: Valid Source Script context 1: " + JSON.stringify(context));
var validFlag = false;

if(source.mail == "alpha.test.user@example.com") {

  validFlag = true;
  
}

logger.error("XiaohanDebugPoint Valid Source Script:: org flag " + validFlag);
validFlag;
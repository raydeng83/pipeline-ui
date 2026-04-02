var content = execution.getVariables();
var currentLevel = parseInt(content.get('currentLevel'), 10);

currentLevel = currentLevel + 1;
execution.setVariable('currentLevel', currentLevel);

logger.error('aaronPOC-v7: incremented to level=' + currentLevel);
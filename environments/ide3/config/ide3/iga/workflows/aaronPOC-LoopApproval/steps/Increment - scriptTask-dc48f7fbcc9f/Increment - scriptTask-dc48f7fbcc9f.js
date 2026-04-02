var content = execution.getVariables();
var currentLevel = content.get('currentLevel');

currentLevel = currentLevel + 1;
execution.setVariable('currentLevel', currentLevel);

logger.error('aaronPOC-Loop: incremented to level=' + currentLevel);
var content = execution.getVariables();
var step2Email = String(content.get('step2Email') || '');

if (step2Email.length > 0) {
    execution.setVariable('currentApproverEmail', step2Email);
    execution.setVariable('hasStep2', 'yes');
    logger.error('aaronPOC-v7: step1 approved, has step2=' + step2Email);
} else {
    execution.setVariable('hasStep2', 'no');
    logger.error('aaronPOC-v7: step1 approved, no step2');
}

/*
  - Data made available by nodes that have already executed are available in the sharedState variable.
  - The script should set outcome to either "true" or "false".
 */


var jdbcUrl = systemEnv.getProperty("esv.dbconnector.jdbcurl");
var jdbcDriver = systemEnv.getProperty("esv.dbconnector.jdbcdriver");
var dbUsername = systemEnv.getProperty("esv.dbconnector.username");
var dbPassword = systemEnv.getProperty("esv-dbconnector-password");

nodeState.putShared("jdbcUrl", jdbcUrl);
nodeState.putShared("jdbcDriver", jdbcDriver);
nodeState.putShared("dbUsername", dbUsername);
nodeState.putShared("dbPassword", dbPassword);






outcome = "true";

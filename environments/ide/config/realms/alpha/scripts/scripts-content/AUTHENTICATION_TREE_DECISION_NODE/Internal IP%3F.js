/* IPv4 CIDR Rules Engine
 *
 * Author: volker.scheuber@forgerock.com, justin.chin@forgerock.com
 * 
 * Evaluate IPv4 CIDR access rules from "esv-ipv4-cidr-access-rules". 
 * Access rules must have the following format:
 * {
 *   "allow": [
 *     "140.118.0.0/16",
 *     "110.35.0.0/16",
 *     "131.26.0.0/16",
 *     "92.61.21.153/32"
 *   ]
 * }
 * 
 * This script does not need to be parametrized. It will work properly as is.
 * 
 * The Scripted Decision Node needs the following outcomes defined:
 * - allow
 * - deny
 */
(function () {
    outcome = "deny";
    
    var rules = JSON.parse(systemEnv.getProperty("esv.ipv4.cidr.access.rules"));
    var allow = rules['allow'];
  
    /*
     * Returns the value of the requested header
     */
    function getHeader(headerName) {
      return requestHeaders.get(headerName).get(0);
    }
  
    /*
     * Returns the client's IP address
     */
    function getClientIPAddress() {
      return getHeader("x-forwarded-for").split(',')[0];
    }
  
    function IPnumber(IPaddress) {
      var ip = IPaddress.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      if (ip) {
        return (+ip[1] << 24) + (+ip[2] << 16) + (+ip[3] << 8) + +ip[4];
      }
      // else ... ?
      return null;
    }
  
    function IPmask(maskSize) {
      return -1 << (32 - maskSize);
    }
  
    function isAllowed(ip) {
      var allowed = false;
      allow.forEach((cidr) => {
        if (
          (IPnumber(ip) & IPmask(cidr.split('/')[1])) ==
          IPnumber(cidr.split('/')[0])
        ) {
          allowed = true;
        }
      });
      return allowed;
    }
    
    if (isAllowed(getClientIPAddress())) {
      outcome = "allow";
    }
  }());
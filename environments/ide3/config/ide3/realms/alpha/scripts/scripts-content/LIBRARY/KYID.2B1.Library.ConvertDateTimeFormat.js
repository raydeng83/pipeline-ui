 /* Name: KYID.2B1.Library.ConvertDateTimeFormat
 
* Description: This library script is used to convert the UTC time to EST
* Function: isoToEastern()
*           Parameters: No parameters are required
* Import Library:  
*                Example: 
*                        var convertTime = require("KYID.2B1.Library.ConvertDateTimeFormat");
* Invoke Library Function:
*                         Examples: 
*                                           var EasternTimeStamp = convertTime.isoToEastern();
*
*  
* Author: Deloitte
*/
function isoToEastern() {
    var date = new Date();

    var year = date.getUTCFullYear();

    // DST calculation
    var march = new Date(Date.UTC(year, 2, 1));
    var marchDay = (7 - march.getUTCDay() + 7) % 7 + 7; // 2nd Sunday
    var dstStart = new Date(Date.UTC(year, 2, 1 + marchDay, 7, 0, 0)); // 2am EST == 7am UTC

    var november = new Date(Date.UTC(year, 10, 1));
    var novDay = (7 - november.getUTCDay()) % 7; // 1st Sunday
    var dstEnd = new Date(Date.UTC(year, 10, 1 + novDay, 6, 0, 0)); // 2am EDT == 6am UTC

    var isDST = (date >= dstStart && date < dstEnd);
    var offset = isDST ? -4 : -5;
    var tzAbbr = isDST ? "EST" : "EST"; //Earlier was EDT:EST

    var local = new Date(date.getTime() + offset * 60 * 60 * 1000);

    // Month names
    var months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Day suffix
    function getOrdinalSuffix(d) {
        if (d >= 11 && d <= 13) return d + "th";
        switch (d % 10) {
            case 1: return d + "st";
            case 2: return d + "nd";
            case 3: return d + "rd";
            default: return d + "th";
        }
    }

    // Format time
    var hours = local.getUTCHours();
    var minutes = local.getUTCMinutes();
    var seconds = local.getUTCSeconds();

    var ampm = hours >= 12 ? "PM" : "AM";
    var hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;

    function pad(n) { return n < 10 ? '0' + n : n; }

    var month = months[local.getUTCMonth()];
    var day = getOrdinalSuffix(local.getUTCDate());
    var time = hour12 + ":" + pad(minutes) + ":" + pad(seconds);

    return month + ", " + day + " " + local.getUTCFullYear() + " - " + time + " " + ampm + " " + tzAbbr;
  
} 
exports.isoToEastern = isoToEastern;
 
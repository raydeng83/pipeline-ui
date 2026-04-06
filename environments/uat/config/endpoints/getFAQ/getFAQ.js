var _ = require('lib/lodash');
var endpointExecution = identityServer.getProperty("esv.journey.execution.flag");
// var endpointExecution = "true";

function getException(e) {
    if (_.has(e, 'javaException') && _.has(e.javaException, 'cause') && e.javaException.cause !== null) {
        return e.javaException.cause.localizedMessage || e.javaException.cause.message;
    } else if (_.has(e, 'messageDetail') && _.has(e.messageDetail, 'message')) {
        return e.messageDetail.message;
    } else if (_.has(e, 'message')) {
        return e.message;
    } else {
        return e;
    }
}

(function () {
    if (endpointExecution === "true") {
        if (request.method === 'read') {
            // GET
            var response = "";
            var languageCode = null;
            var faqTopicId = null;
            var faqTopicId = null;
            var keyword = null;
            var pageSize = 50;
            var pageNumber = 0;
            var languageCode = null;
            var objectName = null;
            var faqTopicId = null;
            var name = null;
            var params = request.additionalParameters;
            const paramKeys = Object.keys(params);
            const allowedLocale = ["en", "es", "ar", "sw", "rw", "my", "ht", "so", "fr", "ne", "ru", "ps"];
            const reqParamGetTopicbykeywords = ["objectName", "keyword", "locale", "pageSize", "pageNumber"];
            const reqParamGetTopicbyname = ["objectName", "name", "pageSize", "pageNumber"];
            const reqParamGetTopicbyCategoryLocale = ["objectName", "categoryId", "locale", "pageSize", "pageNumber"];
            const reqParamGetTopicbyCategoryID = ["objectName", "categoryId", "pageSize", "pageNumber"];
            const reqParamGetTopic = ["objectName", "pageSize", "pageNumber"];
            const reqParamGetTopicRawData = ["objectName", "format", "pageSize", "pageNumber"];
            const reqParamGetHelpCategory = ["objectName", "pageSize", "pageNumber"];
            const reqParamGetHelpCategorybyLocale = ["objectName", "locale", "pageSize", "pageNumber"];
            const reqParamGetHelpCategorybyName = ["objectName", "name", "pageSize", "pageNumber"];
            const invalidParamError = {
                error: "Invalid parameters",
                expectedParams: {
                    getHelpTopicByKeywords: ["objectName", "keyword", "locale", "pageSize", "pageNumber"],
                    getHelpTopicByName: ["objectName", "name", "pageSize", "pageNumber"],
                    getHelpTopicByCategory: ["objectName", "categoryId", "pageSize", "pageNumber"],
                    getHelpTopicByCategoryAndLocale: ["objectName", "categoryId", "locale", "pageSize", "pageNumber"],
                    getAllHelpTopics: ["objectName", "pageSize", "pageNumber"],
                    getAllHelpCategories: ["objectName", "pageSize", "pageNumber"],
                    getHelpCategoryByLocale: ["objectName", "locale", "pageSize", "pageNumber"],
                    getHelpCategoryByName: ["objectName", "name", "pageSize", "pageNumber"]
                }
            };
            if (request.additionalParameters.pageSize != null && request.additionalParameters.pageSize != "") {
                pageSize = parseInt(request.additionalParameters.pageSize);
                // if (pageSize > 50) {
                //     throw { code: 400, message: 'pageSize should not exceed 50' };
                // }
            }
            if (request.additionalParameters.pageNumber != null && request.additionalParameters.pageNumber != "") {
                pageNumber = parseInt(request.additionalParameters.pageNumber);
            }
            if (request.additionalParameters.name != null && request.additionalParameters.name != "") {
                name = request.additionalParameters.name;
            }
            if (request.additionalParameters.keyword != null && request.additionalParameters.keyword != "") {
                keyword = request.additionalParameters.keyword;
            }
            if (request.additionalParameters.locale != null && request.additionalParameters.locale != "") {
                languageCode = request.additionalParameters.locale;
                if (!allowedLocale.includes(languageCode)) {
                    throw { code: 400, message: 'locale not supported, Supported locale:: ' + allowedLocale };
                }
            }
            if (request.additionalParameters.objectName != null && request.additionalParameters.objectName != "") {
                objectName = request.additionalParameters.objectName;
            }
            if (request.additionalParameters.categoryId != null && request.additionalParameters.categoryId != "") {
                faqTopicId = request.additionalParameters.categoryId;
            }

            if (objectName != null) {
                if (objectName === "alpha_kyid_help_topic") {

                    if (reqParamGetTopicbykeywords.sort().toString() === paramKeys.sort().toString()) {
                        response = searchFAQ(languageCode, keyword, pageSize, pageNumber);
                    }
                    else if (reqParamGetTopicbyname.sort().toString() === paramKeys.sort().toString()) {

                        response = getMultipleHelpTopics(name, pageSize, pageNumber);
                    }


                    else if (reqParamGetTopicbyCategoryLocale.sort().toString() === paramKeys.sort().toString()) {

                        response = getFAQContentByTopicLocale(faqTopicId, languageCode, pageSize, pageNumber);

                    }

                    else if (reqParamGetTopicbyCategoryID.sort().toString() === paramKeys.sort().toString()) {
                        response = getFAQContentByTopic(faqTopicId, pageSize, pageNumber);
                    }

                    else if (reqParamGetTopic.sort().toString() === paramKeys.sort().toString()) {
                        response = getFaqFormatedResponse(pageSize, pageNumber);
                    }

                    else if (reqParamGetTopicRawData.sort().toString() === paramKeys.sort().toString()) {
                        format = request.additionalParameters.format
                        if (format === "rawData") {

                            response = getFaq(pageSize, pageNumber);
                        }
                        else {
                            throw { code: 400, message: 'Please provide a correct value of Format' };
                        }
                    }

                    else {
                        // throw { code: 400, message: 'Please provide proper params' };
                        throw { code: 400, message: "invalidParamError", detail: invalidParamError };
                    }

                }
                else if (objectName === "alpha_kyid_help_category") {

                    if (reqParamGetHelpCategorybyName.sort().toString() === paramKeys.sort().toString()) {
                        // languageCode = request.additionalParameters.locale;
                        response = getMultipleHelpCategory(name, pageSize, pageNumber);
                    }

                    else if (reqParamGetHelpCategorybyLocale.sort().toString() === paramKeys.sort().toString()) {
                        // languageCode = request.additionalParameters.locale;
                        response = getFaqTopicbyLoclae(languageCode, pageSize, pageNumber);
                    }
                    // else if (request.additionalParameters.locale == null && request.additionalParameters.format != null) {
                    else if (reqParamGetTopicRawData.sort().toString() === paramKeys.sort().toString()) {
                        format = request.additionalParameters.format
                        if (format === "rawData") {
                            response = getFaqTopics(pageSize, pageNumber);
                        }
                        else {
                            throw { code: 400, message: 'Please prvide a correct value of Format' };
                        }
                    }
                    else if (reqParamGetHelpCategory.sort().toString() === paramKeys.sort().toString()) {
                        response = getFaqTopicFormatedResponse(pageSize, pageNumber);
                    }
                    else {
                        throw { code: 400, message: "invalidParamError", detail: invalidParamError };

                    }


                }
                else {
                    throw { code: 400, message: 'Required Object Name alpha_kyid_help_topic or alpha_kyid_help_category' };
                }
            }

            else {
                throw { code: 400, message: 'Required Object Name alpha_kyid_help_topic or alpha_kyid_help_category' };
            }

            return { response };
        }
        else {
            throw { code: 405, message: 'Method not allowed' };
        }
        // throw { code: 500, message: 'Unknown error' };
    }
    else {
        throw { code: 500, message: "Internal Server Error : Flag Set to False" };
    }
}());

//}else{
// throw { code: 500, message: "Internal Server Error : Flag Set to False"};
//}


function getFaqTopics(_pageSize, _pagedResultsOffset) {
    try {
        // var response = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": "true", "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
        var response = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": "true" }, []);

    } catch (error) {
        throw { code: 400, message: getException(error) };

    }

    return (response);

}

function getFaqTopicFormatedResponse(_pageSize, _pagedResultsOffset) {
    try {
        // var response = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": "true", "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
        var response = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": "true" }, []);


        const output = {

            "result": response.result.map(item => {
                return {
                    "name": item.name,
                    "description": item.description,
                    "logo": item.logo,
                    "localizedContent": item.localizedContent,
                    "sequence": item.sequence,
                    "isVisible": item.isVisible
                };
            })

        };

        return output;

    } catch (error) {
        throw { code: 400, message: getException(error) };

    }

}

function getHelpCategoryByName(name, _pageSize, _pagedResultsOffset) {
    try {

        // var response = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/name/ eq "' + name + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);;

        var response = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/name/ eq "' + name + '"' }, []);;

        const output = {

            "result": response.result.map(item => {
                return {
                    "name": item.name,
                    "description": item.description,
                    "logo": item.logo,
                    "localizedContent": item.localizedContent,
                    "sequence": item.sequence,
                    "isVisible": item.isVisible
                };
            })

        };

        return output;

    } catch (error) {
        throw { code: 400, message: getException(error) };

    }

}

function getMultipleHelpCategory(name, pageSize, pageNumber) {
    try {
        let allNames = name.split(',');
        let combinedResult = [];

        allNames.forEach(function (singleName) {
            let trimmedName = singleName.trim();
            let response = getHelpCategoryByName(trimmedName, pageSize, pageNumber);

            if (response && response.result && response.result.length > 0) {
                combinedResult = combinedResult.concat(response.result);
            }
        });

        return {
            result: combinedResult
        };

    } catch (error) {
        throw { code: 400, message: getException(error) };
    }

}

function getFaqTopicbyLoclae(locale, _pageSize, _pagedResultsOffset) {
    try {
        // var response = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": "true", "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
        var response = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": "true" }, []);


        const results = response.result.map(result => {
            // Map over all topics and extract the necessary values for each topic
            const categorys = result.localizedContent.map(localizedContent => {
                const title = localizedContent.title[locale];
                const description = localizedContent.description[locale];

                return {
                    title: title,
                    description: description
                };
            });

            // Return the desired output structure for each result
            return {
                sequence: result.sequence,
                name: result.name,
                description: result.description,
                logo: result.logo,
                isVisible: result.isVisible,
                localizedContent: categorys  // Multiple topics now
            };
        });

        // Return the output structure wrapped in a response object
        return {
            // categoryId:faqTopicId,
            // response: {
            result: results
            // }
        };


    } catch (error) {
        throw { code: 400, message: getException(error) };
    }

}

function getFaq(_pageSize, _pagedResultsOffset) {
    try {
        // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": "true", "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
        var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": "true" }, []);

        return (response);
    } catch (error) {
        throw { code: 400, message: getException(error) };

    }

}


function getFAQContentByTopic(faqTopicId, _pageSize, _pagedResultsOffset) {
    try {
        // faqTopicId = ""
        // var getTopicRefID = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/name/ eq "' + faqTopicId + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, [""]);
        var getTopicRefID = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/name/ eq "' + faqTopicId + '"' }, [""]);

        if (getTopicRefID.result.length < 1) {
            throw { code: 400, message: "No help topic found with the provided help category" };
        }
        else {
            var faqTopicRefId = getTopicRefID.result[0]._id
            // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": '/categoryId/_refResourceId eq "' + faqTopicRefId + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
            logger.error("faqTopicRefId is --> " + faqTopicRefId)
            // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": '/categoryId/_refResourceId eq "' + faqTopicRefId + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
            var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": '/categoryId/_refResourceId eq "' + faqTopicRefId + '"' }, []);


            logger.error("getFAQContentByTopic Response is  --> " + response)
            const result = response.result.map(item => {
                return {
                    categoryId: [faqTopicId],
                    name: item.name,
                    localizedContent: item.localizedContent,
                    sequence: item.sequence,
                    isVisible: item.isVisible

                };
            });

            var output = {
                "result": result
            };
            return output;
        }

    } catch (error) {
        throw { code: 400, message: getException(error) };
    }

}

function getFAQContentByTopicLocale(faqTopicId, locale, _pageSize, _pagedResultsOffset) {
    try {
        // var getTopicRefID = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/name/ eq "' + faqTopicId + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
        var getTopicRefID = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/name/ eq "' + faqTopicId + '"' }, []);


        if (getTopicRefID.result.length < 1) {
            throw { code: 400, message: "No help topic found with the provided help category" };
        }
        else {
            var faqTopicRefId = getTopicRefID.result[0]._id
            // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": '/categoryId/_refResourceId eq "' + "1660fcd4-9650-403e-a5ee-bd97944baa11" + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, ["name","isVisible","topic","description","sequence"]);
            // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": '/categoryId/_refResourceId eq "' + faqTopicRefId + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
            var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": '/categoryId/_refResourceId eq "' + faqTopicRefId + '"' }, []);

            const results = response.result.map(result => {
                // Map over all topics and extract the necessary values for each topic
                const topics = result.localizedContent.map(localizedContent => {
                    const title = localizedContent.title[locale] || localizedContent.title['en'];  // Fallback to 'en' if locale not found
                    const content = localizedContent.content[locale] || localizedContent.content['en'];  // Fallback to 'en' if locale not found

                    return {
                        title: title,
                        content: content
                    };
                });

                // Return the desired output structure for each result
                return {
                    categoryId: faqTopicId,
                    sequence: result.sequence,
                    name: result.name,
                    description: result.description,
                    isVisible: result.isVisible,
                    title: topics  // Multiple topics now
                };
            });

            // Return the output structure wrapped in a response object
            return {
                // categoryId:faqTopicId,
                // response: {
                result: results
                // result: "Test Out Put"
                // }
            };
        }


    } catch (error) {
        throw { code: 400, message: getException(error) };

    }

}

function getFaqFormatedResponse(pageSize, pageNumber) {
    try {
        // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": "true", "_pageSize": pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": pageNumber }, []);
        var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": "true" }, []);


        var finalResponse = [];


        response.result.forEach(function (faqItem) {
            var name = faqItem.name;
            var topic = faqItem.localizedContent;
            var sequence = faqItem.sequence;
            var isVisible = faqItem.isVisible;
            var description = faqItem.description;
            var faqTopicIDList = [];


            faqItem.categoryId.forEach(function (faqIdItem) {
                var _refResourceId = faqIdItem._refResourceId;

                // Query to get the faqTopicId using the _refResourceId
                var getTopicRefID = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/_id/ eq "' + _refResourceId + '"' }, ["name"]);

                // Add the faqTopicId to the list
                if (getTopicRefID.result && getTopicRefID.result.length > 0) {
                    faqTopicIDList.push(getTopicRefID.result[0].name);
                }
            });


            var finalItem = {
                "name": name,
                "categoryId": faqTopicIDList,
                "localizedContent": topic,
                "sequence": sequence,
                "isVisible": isVisible,
                "description": description,
                // "TotalPages" : response.totalPagedResults,
                // "resultCount" : response.resultCount,
                // "pageNumber" : pageNumber
            };


            finalResponse.push(finalItem);
        });


        var result = {
            "result": finalResponse
        };


        return result;



    } catch (error) {
        throw { code: 400, message: getException(error) };

    }

}



// function searchFAQ(locale, keyword, _pageSize, _pagedResultsOffset) {
//     try {
//         var getTopicRefID = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/name/ co "' + keyword + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);
//         // var faqTopicRefId = getTopicRefID.result[0]._id;
//         var categoryNameList = [];
//         var finalResponse = [];
//         if (getTopicRefID.result.length > 0) {
//             for (let i = 0; i < getTopicRefID.result.length; i++) {
//                 categoryNameList.push(getTopicRefID.result[i].name)
//             }
//         }


//         var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": 'name co "' + keyword + '" OR description co "' + keyword + '" OR localizedContent/0/title/' + locale + '/ co "' + keyword + '" OR localizedContent/0/content/' + locale + '/ co "' + keyword + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);

//         if (response.result.length > 0) {
//             response.result.forEach(function (faqItem) {
//                 var name = faqItem.name;
//                 var topic = faqItem.localizedContent;
//                 var sequence = faqItem.sequence;
//                 var isVisible = faqItem.isVisible;



//                 var finalItem = {
//                     "name": name,
//                     // "categoryName": categoryNameList,
//                     "localizedContent": topic,
//                     "sequence": sequence,
//                     "description": description,
//                     "isVisible": isVisible
//                     // "TotalPages" : response.totalPagedResults,
//                     // "resultCount" : response.resultCount,
//                     // "pageNumber" : pageNumber
//                 };


//                 finalResponse.push(finalItem);
//             });
//         }
//         if (getTopicRefID.result.length > 0 && response.result.length > 0) {
//             var result = {
//                 "result": finalResponse,
//                 "categoryName": categoryNameList
//             };
//         }
//         else if (getTopicRefID.result.length > 0 && response.result.length == 0) {
//             var result = {
//                 "result": [],
//                 "categoryName": categoryNameList
//             };
//         }
//         else if (getTopicRefID.result.length == 0 && response.result.length > 0) {
//             var result = {
//                 "result": finalResponse,
//                 "categoryName": []
//             };
//         }
//         else {
//             var result = {
//                 "result": [],
//                 "categoryName": []
//             };

//         }


//         return result;

//     }
//     catch (error) {
//         throw { code: 400, message: getException(error) };

//     }


// }


function searchFAQ(locale, keyword, _pageSize, _pagedResultsOffset) {
    try {
        // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": "true", "_pageSize": pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": pageNumber }, []);
        // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": 'name co "' + keyword + '" OR description co "' + keyword + '" OR localizedContent/0/title/' + locale + '/ co "' + keyword + '" OR localizedContent/0/content/' + locale + '/ co "' + keyword + '"', "_pageSize": _pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": _pagedResultsOffset }, []);

        var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": 'name co "' + keyword + '" OR description co "' + keyword + '" OR localizedContent/0/title/' + locale + '/ co "' + keyword + '" OR localizedContent/0/content/' + locale + '/ co "' + keyword + '"' }, []);

        var finalResponse = [];


        response.result.forEach(function (faqItem) {
            var name = faqItem.name;
            var topic = faqItem.localizedContent;
            var sequence = faqItem.sequence;
            var isVisible = faqItem.isVisible;
            var description = faqItem.description;
            var faqTopicIDList = [];


            faqItem.categoryId.forEach(function (faqIdItem) {
                var _refResourceId = faqIdItem._refResourceId;

                // Query to get the faqTopicId using the _refResourceId
                var getTopicRefID = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/_id/ eq "' + _refResourceId + '"' }, ["name"]);

                // Add the faqTopicId to the list
                if (getTopicRefID.result && getTopicRefID.result.length > 0) {
                    faqTopicIDList.push(getTopicRefID.result[0].name);
                }
            });


            var finalItem = {
                "name": name,
                "categoryId": faqTopicIDList,
                "localizedContent": topic,
                "sequence": sequence,
                "isVisible": isVisible,
                "description": description,
                // "TotalPages" : response.totalPagedResults,
                // "resultCount" : response.resultCount,
                // "pageNumber" : pageNumber
            };


            finalResponse.push(finalItem);
        });


        var result = {
            "result": finalResponse
        };


        return result;



    } catch (error) {
        throw { code: 400, message: getException(error) };

    }

}

function getHelpTopicByName(name, pageSize, pageNumber) {
    try {
        // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": "true", "_pageSize": pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": pageNumber }, []);
        // var topicName = "don't have email" 
        // var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": '/name/ eq "' + name + '"', "_pageSize": pageSize, "_totalPagedResultsPolicy": "EXACT", "_pagedResultsOffset": pageNumber }, []);

        var response = openidm.query("managed/alpha_kyid_help_topic/", { "_queryFilter": '/name/ eq "' + name + '"' }, []);

        var finalResponse = [];
        if (response.result.length > 0) {
            response.result.forEach(function (faqItem) {
                var name = faqItem.name;
                var topic = faqItem.localizedContent;
                var sequence = faqItem.sequence;
                var isVisible = faqItem.isVisible;
                var description = faqItem.description;
                var faqTopicIDList = [];


                faqItem.categoryId.forEach(function (faqIdItem) {
                    var _refResourceId = faqIdItem._refResourceId;

                    // Query to get the faqTopicId using the _refResourceId
                    var getTopicRefID = openidm.query("managed/alpha_kyid_help_category/", { "_queryFilter": '/_id/ eq "' + _refResourceId + '"' }, ["name"]);

                    // Add the faqTopicId to the list
                    if (getTopicRefID.result && getTopicRefID.result.length > 0) {
                        faqTopicIDList.push(getTopicRefID.result[0].name);
                    }
                });


                var finalItem = {
                    "name": name,
                    "categoryId": faqTopicIDList,
                    "localizedContent": topic,
                    "sequence": sequence,
                    "isVisible": isVisible,
                    "description": description,
                    // "TotalPages" : response.totalPagedResults,
                    // "resultCount" : response.resultCount,
                    // "pageNumber" : pageNumber
                };


                finalResponse.push(finalItem);
            });


            var result = {
                "result": finalResponse
            };

        }
        else {
            var result = {
                "result": finalResponse
            };
        }


        return result;



    } catch (error) {
        throw { code: 400, message: getException(error) };

    }

}

function getMultipleHelpTopics(name, pageSize, pageNumber) {
    try {
        let allNames = name.split(',');
        let combinedResult = [];

        allNames.forEach(function (singleName) {
            let trimmedName = singleName.trim();
            let response = getHelpTopicByName(trimmedName, pageSize, pageNumber);

            if (response && response.result && response.result.length > 0) {
                combinedResult = combinedResult.concat(response.result);
            }
        });

        return {
            result: combinedResult
        };

    } catch (error) {
        throw { code: 400, message: getException(error) };
    }

}

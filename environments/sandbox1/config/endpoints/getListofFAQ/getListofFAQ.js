var _ = require('lib/lodash');
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
    if (request.method === 'create') {
      // POST
      logger.error("FaqTopic ID is : "+request.content.faqTopicId);
      var faqTopicId = request.content.faqTopicId;
      // var faqTopicId = "489ca2f9-c20e-4603-8fa4-fd24a3fa5e83";
      // var languageCode = "en";
      logger.error("Language Code is : "+request.content.languageCode);
      var languageCode = request.content.languageCode;
      return getFAQDataByLanguage(languageCode,faqTopicId);
    } else if (request.method === 'read') {
      // GET
      return {};
    } else if (request.method === 'update') {
      // PUT
      return {};
    } else if (request.method === 'patch') {
      return {};
    } else if (request.method === 'delete') {
      return {};
    }
    throw { code: 500, message: 'Unknown error' };
  }());

function getFAQDataByLanguage(languageCode,faqTopicId) {
  try {
    // faqTopicId = "489ca2f9-c20e-4603-8fa4-fd24a3fa5e83"
    // languageCode = "en"
    var data = openidm.query("managed/Alpha_kyid_help_FAQ", { "_queryFilter" : '/faq_topic/_refResourceId eq "'+faqTopicId+'"'}, [""]);
  const faqList = data.result; // Array of FAQ items
  const translatedFAQs = [];

  // Loop through all FAQ items
  faqList.forEach(faq => {
     
    const questionKey = `question_${languageCode}`;
    const answerKey = `answer_${languageCode}`;

    if (faq[questionKey] && faq[answerKey]) {
      // If the requested language is available, push the translated question and answer
      translatedFAQs.push({
        question: faq[questionKey],
        answer: faq[answerKey],
        faqTopicId: faqTopicId,
      });
    } else {
      // Fallback to English if the requested language is not available
      translatedFAQs.push({
        question: faq.question_en,
        answer: faq.answer_en,
        faqTopicId: faqTopicId,
      });
    }
  });

  return translatedFAQs;
    
  } catch (error) {
    var exceptionMessage = getException(error);
    throw { code: 500, message: exceptionMessage };
    
  }
  
}


 // var data = openidm.query("managed/Alpha_kyid_help_FAQ", { "_queryFilter" : '/faq_topic/_refResourceId eq "'+"489ca2f9-c20e-4603-8fa4-fd24a3fa5e83"+'"'}, [""]);
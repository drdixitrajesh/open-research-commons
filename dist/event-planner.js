import { classificationContent, bindClassification, normalizePlannerClassification, plannerClassificationSnapshot } from './planner-classification.js';

const storageKey = 'open-research-commons:event-planner:v1';
const activeTypeKey = storageKey + ':active-type';
const conferencingUrl = 'https://conferencesdirectory.com/conferencing-app/';
const briefLimits = { notes: 3000, meetingLink: 2048 };
const rowLimit = 100;
const eventTypes = ['seminar', 'symposium', 'workshop', 'webinar', 'conference', 'other'];
const eventModes = ['inPerson', 'online', 'hybrid'];
const sections = ['brief', 'classification', 'timeline', 'onlineMeeting', 'agenda', 'budget'];
const briefFields = ['title', 'eventType', 'mode', 'startDate', 'endDate', 'timezone', 'venue', 'audience', 'registration', 'notes', 'meetingLink'];
const agendaFields = ['time', 'duration', 'session', 'lead'];
const budgetFields = ['item', 'estimate', 'actual'];
const basePhases = [
  { id: 'scope', days: -56, timing: 'eightWeeks', tasks: ['goals', 'team', 'format'] },
  { id: 'programme', days: -28, timing: 'fourWeeks', tasks: ['speakers', 'programmeDraft', 'access'] },
  { id: 'outreach', days: -7, timing: 'oneWeek', tasks: ['registrationTest', 'announce', 'logistics'] },
  { id: 'delivery', days: 0, timing: 'eventDay', tasks: ['rehearse', 'briefing', 'recording'] },
  { id: 'followup', days: 7, timing: 'oneWeekAfter', tasks: ['thanks', 'share', 'close'] },
];
const formats = {
  seminar: {
    fields: ['researchTopic', 'featuredSpeaker', 'discussionChair', 'readingLink'],
    days: [-21, -10, -3, 0, 3],
    tasks: [['seminarOutcome'], ['seminarSpeaker', 'seminarReading'], ['seminarQuestions'], ['seminarDiscussion'], ['seminarSummary']],
    agenda: [['agendaWelcome', 5], ['agendaSeminarTalk', 35], ['agendaDiscussion', 15], ['agendaClosing', 5]],
  },
  symposium: {
    fields: ['symposiumTracks', 'abstractDeadline', 'reviewCriteria', 'proceedingsEditor', 'proceedingsDeadline'],
    days: [-84, -42, -14, 0, 14],
    tasks: [['symposiumCall'], ['symposiumReview', 'symposiumSessions'], ['symposiumProgramme'], ['symposiumSlides'], ['symposiumProceedings', 'symposiumRights']],
    agenda: [['agendaWelcome', 10], ['agendaKeynote', 40], ['agendaPapers', 60], ['agendaBreak', 15], ['agendaPanel', 45], ['agendaClosing', 10]],
  },
  workshop: {
    fields: ['learningOutcomes', 'prerequisites', 'participantCapacity', 'materialsLink', 'practiceTask'],
    days: [-42, -21, -5, 0, 3],
    tasks: [['workshopCapacity'], ['workshopExercises', 'workshopEquipment'], ['workshopPreparation'], ['workshopFeedback'], ['workshopResources']],
    agenda: [['agendaWelcome', 10], ['agendaDemo', 20], ['agendaGuidedExercise', 35], ['agendaBreak', 10], ['agendaIndependentPractice', 30], ['agendaReview', 15]],
  },
  webinar: {
    fields: ['producer', 'discussionChair', 'rehearsalDate', 'backupPlan', 'recordingPlan'],
    days: [-28, -14, -2, 0, 2],
    tasks: [['webinarPlatform'], ['webinarRoles', 'webinarInteraction'], ['webinarRehearsal'], ['webinarLiveChecks', 'webinarBackups'], ['webinarRecording']],
    agenda: [['agendaTechCheck', 10], ['agendaWelcome', 5], ['agendaWebinarTalk', 30], ['agendaModeratedQuestions', 15], ['agendaClosing', 5]],
  },
};
const longDetails = new Set(['symposiumTracks', 'reviewCriteria', 'learningOutcomes', 'prerequisites', 'practiceTask', 'backupPlan', 'recordingPlan']);
const detailLinks = new Set(['readingLink', 'materialsLink']);
const fieldsFor = type => formats[type]?.fields ?? [];
const phasesFor = type => {
  const format = formats[type];
  if (!format) return basePhases;
  return basePhases.map((phase, index) => ({
    ...phase, days: format.days[index], timing: null, tasks: [...phase.tasks, ...format.tasks[index]],
  }));
};
const words = `
intro|Set the brief, organize the programme and track costs for your event.|अपने आयोजन का विवरण, कार्यक्रम और खर्च तय करें।
plannerTypes|Event type plans|आयोजन के प्रकार
seminarIntro|Plan a focused research talk with a speaker, a discussion chair and time for audience questions.|वक्ता, चर्चा संचालक और श्रोताओं के सवालों के लिए समय के साथ एक शोध वार्ता की योजना बनाएं।
symposiumIntro|Plan a programme of research papers and panels, from the call for abstracts to the proceedings.|सार आमंत्रित करने से लेकर कार्यवाही तैयार करने तक शोधपत्रों और पैनल चर्चाओं का कार्यक्रम बनाएं।
workshopIntro|Build a hands-on session around learning outcomes, practical exercises and participant feedback.|सीखने के परिणामों, व्यावहारिक अभ्यास और प्रतिभागियों की प्रतिक्रिया पर आधारित कार्यशाला बनाएं।
webinarIntro|Plan an online session with host roles, a rehearsal, audience interaction and a recording plan.|मेज़बानों की भूमिकाएँ, पूर्वाभ्यास, श्रोताओं की भागीदारी और रिकॉर्डिंग तय करके ऑनलाइन सत्र की योजना बनाएं।
formatDetails|{type} planning details|{type} की तैयारी
researchTopic|Research topic or question|शोध का विषय या प्रश्न
featuredSpeaker|Speaker and affiliation|वक्ता और संस्थान
discussionChair|Discussion chair or moderator|चर्चा अध्यक्ष या संचालक
readingLink|Reading or handout link|पठन सामग्री या हैंडआउट का लिंक
symposiumTracks|Themes or tracks|विषय या शोध सत्र
abstractDeadline|Abstract submission deadline|सार जमा करने की अंतिम तारीख
reviewCriteria|Abstract review criteria|सार की समीक्षा के मानदंड
proceedingsEditor|Proceedings editor|कार्यवाही के संपादक
proceedingsDeadline|Final manuscript deadline|अंतिम पांडुलिपि की समय सीमा
learningOutcomes|Learning outcomes|सीखने के परिणाम
prerequisites|Prerequisites and setup|पूर्व तैयारी और सेटअप
participantCapacity|Participant capacity|प्रतिभागियों की अधिकतम संख्या
materialsLink|Materials or setup guide link|सामग्री या सेटअप निर्देश का लिंक
practiceTask|Practical exercise and expected output|व्यावहारिक अभ्यास और अपेक्षित परिणाम
producer|Technical producer or co-host|तकनीकी प्रभारी या सह-मेज़बान
rehearsalDate|Rehearsal date|पूर्वाभ्यास की तारीख
backupPlan|Backup host and connection plan|वैकल्पिक मेज़बान और कनेक्शन योजना
recordingPlan|Recording consent and access plan|रिकॉर्डिंग की सहमति और पहुँच की योजना
beforeDays|{number} days before the event|आयोजन से {number} दिन पहले
afterDays|{number} days after the event|आयोजन के {number} दिन बाद
useAgenda|Use suggested agenda|सुझाया हुआ कार्यक्रम अपनाएं
proceedings|Prepare proceedings|कार्यवाही तैयार करें
eventWebsite|Build event website|आयोजन की वेबसाइट बनाएं
registrationForm|Participant registration|प्रतिभागी पंजीकरण
brief|Event brief|आयोजन का विवरण
classification|Research and location|शोध और स्थान
subjectCode|Subject (FoR)|विषय (FoR)
streamCode|Research stream (FoR)|शोध की शाखा (FoR)
keywords|Keywords|कीवर्ड
countryCode|Country code|देश कोड
timeline|Planning timeline|योजना की समयरेखा
agenda|Agenda|कार्यक्रम
budget|Budget|बजट
sections|Planner sections|योजना के भाग
download|Download plan|योजना डाउनलोड करें
post|Post an event listing|आयोजन की सूची प्रकाशित करने के लिए भेजें
browserDraft|Your draft is saved in this browser as you edit.|बदलाव इसी ब्राउज़र में अपने आप सहेजे जाते हैं।
temporaryDraft|Browser storage is unavailable. Download your plan before closing this tab.|ब्राउज़र में सहेजना उपलब्ध नहीं है। टैब बंद करने से पहले योजना डाउनलोड करें।
downloaded|Plan downloaded.|योजना डाउनलोड हो गई।
progress|{done} of {total} tasks complete|{total} में से {done} कार्य पूरे
title|Event title|आयोजन का शीर्षक
eventType|Event type|आयोजन का प्रकार
mode|Participation mode|भागीदारी का तरीका
startDate|Start date|शुरू होने की तारीख
endDate|End date|समाप्ति की तारीख
timezone|Time zone|समय क्षेत्र
timezoneExample|e.g. Asia/Kolkata|जैसे Asia/Kolkata
venue|Venue or meeting platform|स्थान या ऑनलाइन प्लेटफ़ॉर्म
audience|Intended audience|लक्षित प्रतिभागी
registration|Registration link|पंजीकरण लिंक
notes|Goals and organizer notes|लक्ष्य और आयोजन के नोट्स
choose|Choose an option|एक विकल्प चुनें
seminar|Seminar|सेमिनार
symposium|Symposium|संगोष्ठी
conference|Conference|सम्मेलन
workshop|Workshop|कार्यशाला
webinar|Webinar|वेबिनार
other|Other|अन्य
inPerson|In person|प्रत्यक्ष
online|Online|ऑनलाइन
hybrid|Hybrid|मिश्रित
dateOrder|The end date precedes the start date.|समाप्ति की तारीख शुरुआत से पहले है।
timelineHelp|Use these suggested milestones as a starting point. Add a start date to see target dates.|इन सुझाए गए चरणों से शुरुआत करें। लक्ष्य की तारीखें देखने के लिए शुरू होने की तारीख जोड़ें।
scope|Set the scope|रूपरेखा तय करें
programme|Build the programme|कार्यक्रम तैयार करें
outreach|Prepare for participants|प्रतिभागियों के लिए तैयारी करें
delivery|Run the event|आयोजन संचालित करें
followup|Follow up|आयोजन के बाद की कार्रवाई
eightWeeks|About 8 weeks before|लगभग 8 सप्ताह पहले
fourWeeks|About 4 weeks before|लगभग 4 सप्ताह पहले
oneWeek|About 1 week before|लगभग 1 सप्ताह पहले
eventDay|Event day|आयोजन का दिन
oneWeekAfter|About 1 week after|लगभग 1 सप्ताह बाद
goals|Define the goal, audience and expected attendance.|लक्ष्य, प्रतिभागी और उनकी अनुमानित संख्या तय करें।
team|Assign an event lead and agree on the budget and approvals.|आयोजन का प्रभारी तय करें और बजट व मंज़ूरी पर सहमति लें।
format|Reserve the date and check room, platform and staffing availability.|तारीख तय करें और कक्ष, प्लेटफ़ॉर्म व कर्मचारियों की उपलब्धता देखें।
speakers|Confirm speakers and chairs. Collect bios, titles and presentation needs.|वक्ता और सत्र अध्यक्ष तय करें। परिचय, शीर्षक और प्रस्तुति की ज़रूरतें लें।
programmeDraft|Draft the agenda with introductions, breaks and time for questions.|परिचय, विराम और सवालों के लिए समय रखते हुए कार्यक्रम बनाएं।
access|Check accessibility, captioning and recording permissions.|सुगम्यता, कैप्शन और रिकॉर्डिंग की अनुमति की जाँच करें।
registrationTest|Test the registration form, confirmation message and attendance limits.|पंजीकरण फ़ॉर्म, पुष्टि संदेश और प्रतिभागी सीमा की जाँच करें।
announce|Share the programme and registration link with the intended audience.|कार्यक्रम और पंजीकरण लिंक लक्षित प्रतिभागियों से साझा करें।
logistics|Confirm AV, connectivity, signage, catering and participant instructions as applicable.|ज़रूरत के अनुसार एवी उपकरण, इंटरनेट, संकेत, खानपान और प्रतिभागियों के निर्देश तय करें।
rehearse|Rehearse presentations, access links and a backup plan.|प्रस्तुति, लिंक और वैकल्पिक योजना का अभ्यास करें।
briefing|Brief hosts on check-in, timekeeping, questions and technical support.|मेज़बानों को चेक-इन, समय प्रबंधन, सवालों और तकनीकी सहायता के बारे में बताएं।
recording|Check consent before recording or distributing participant information.|रिकॉर्डिंग या प्रतिभागियों की जानकारी साझा करने से पहले सहमति लें।
thanks|Thank speakers and participants and collect feedback.|वक्ताओं और प्रतिभागियों को धन्यवाद दें और प्रतिक्रिया लें।
share|Share approved materials, recordings or proceedings.|मंज़ूर सामग्री, रिकॉर्डिंग या कार्यवाही साझा करें।
close|Reconcile costs and record improvements for the next event.|खर्चों का मिलान करें और अगले आयोजन के लिए सुधार लिखें।
seminarOutcome|Write one research question to guide the talk and discussion.|वार्ता और चर्चा को दिशा देने वाला एक शोध प्रश्न लिखें।
seminarSpeaker|Confirm the speaker’s topic, affiliation and allotted time.|वक्ता का विषय, संस्थान और निर्धारित समय पक्का करें।
seminarReading|Collect the abstract, short bio and any approved advance reading.|सार, संक्षिप्त परिचय और मंज़ूर पठन सामग्री जुटाएँ।
seminarQuestions|Ask the chair to prepare opening questions and time for audience discussion.|अध्यक्ष से शुरुआती प्रश्न और श्रोताओं की चर्चा का समय तय करने को कहें।
seminarDiscussion|Introduce the speaker and protect the question period.|वक्ता का परिचय दें और सवालों के लिए तय समय बनाए रखें।
seminarSummary|Share the approved handout or summary and record open research questions.|मंज़ूर हैंडआउट या सारांश साझा करें और खुले शोध प्रश्न लिखें।
symposiumCall|Set the tracks, abstract deadline and submission instructions for the call.|सार आमंत्रण के लिए विषय, अंतिम तारीख और जमा करने के निर्देश तय करें।
symposiumReview|Assign reviewers, agree on criteria and communicate abstract decisions.|समीक्षक तय करें, मानदंड पर सहमति लें और सारों के निर्णय बताएं।
symposiumSessions|Group accepted papers into sessions and confirm chairs, keynote speakers and panelists.|स्वीकृत शोधपत्रों को सत्रों में बाँटें और अध्यक्षों, मुख्य वक्ताओं व पैनल सदस्यों को पक्का करें।
symposiumProgramme|Publish the sessions and give each contributor their time, room and presentation instructions.|सत्रों का कार्यक्रम साझा करें और हर योगदानकर्ता को समय, कक्ष और प्रस्तुति निर्देश दें।
symposiumSlides|Provide a plan for parallel rooms, moderator handoffs and missing slides.|समानांतर कक्षों, संचालकों के बदलाव और स्लाइड न मिलने की स्थिति के लिए योजना बनाएं।
symposiumProceedings|Collect final papers and have the proceedings editor check authors, abstracts and citations.|अंतिम शोधपत्र जुटाएँ और कार्यवाही के संपादक से लेखक, सार और उद्धरण जँचवाएँ।
symposiumRights|Confirm publication permissions and proofread the proceedings before sharing.|प्रकाशन की अनुमति पक्की करें और साझा करने से पहले कार्यवाही का प्रूफ़ पढ़ें।
workshopCapacity|Set the group size based on facilitators, equipment and support available.|उपलब्ध प्रशिक्षकों, उपकरणों और सहायता के आधार पर समूह का आकार तय करें।
workshopExercises|Prepare a worked example, guided practice and an independent exercise.|एक हल किया हुआ उदाहरण, निर्देशित अभ्यास और स्वतंत्र अभ्यास तैयार करें।
workshopEquipment|Test all materials and software on the devices participants will use.|सभी सामग्री और सॉफ़्टवेयर को प्रतिभागियों के इस्तेमाल वाले उपकरणों पर जाँचें।
workshopPreparation|Send prerequisites, setup steps and accessible alternatives before the session.|सत्र से पहले पूर्व तैयारी, सेटअप के चरण और सुलभ विकल्प भेजें।
workshopFeedback|Check understanding during practice and allow time to give feedback.|अभ्यास के दौरान समझ की जाँच करें और प्रतिक्रिया देने के लिए समय रखें।
workshopResources|Share approved exercises, solutions and follow-up resources.|मंज़ूर अभ्यास, उनके हल और आगे की सामग्री साझा करें।
webinarPlatform|Confirm platform capacity, registration settings and participant time zones.|प्लेटफ़ॉर्म की क्षमता, पंजीकरण सेटिंग और प्रतिभागियों के समय क्षेत्र पक्के करें।
webinarRoles|Assign a host, producer, chat moderator and backup host.|मेज़बान, तकनीकी प्रभारी, चैट संचालक और वैकल्पिक मेज़बान तय करें।
webinarInteraction|Plan how to handle chat, moderated questions, captions and any polls.|चैट, संचालित सवाल, कैप्शन और किसी भी पोल की व्यवस्था तय करें।
webinarRehearsal|Run a full rehearsal, including screen sharing, captions and fallback links.|स्क्रीन शेयर, कैप्शन और वैकल्पिक लिंक के साथ पूरा पूर्वाभ्यास करें।
webinarLiveChecks|Before admitting attendees, check audio, video and host controls.|प्रतिभागियों को प्रवेश देने से पहले ऑडियो, वीडियो और मेज़बान नियंत्रण जाँचें।
webinarBackups|Keep the backup presenter, slides and participant updates ready during the session.|सत्र के दौरान वैकल्पिक प्रस्तुतकर्ता, स्लाइड और प्रतिभागियों के लिए अपडेट तैयार रखें।
webinarRecording|Review the recording and captions, and share them with the approved audience.|रिकॉर्डिंग और कैप्शन जाँचें और उन्हें मंज़ूर श्रोताओं से साझा करें।
agendaHelp|List sessions in running order. Include breaks, transitions and questions.|सत्रों को क्रम से लिखें। विराम, बदलाव और सवालों के लिए समय रखें।
agendaWelcome|Welcome and introductions|स्वागत और परिचय
agendaSeminarTalk|Research talk|शोध वार्ता
agendaDiscussion|Audience discussion and questions|श्रोताओं की चर्चा और सवाल
agendaClosing|Closing and next steps|समापन और अगले कदम
agendaKeynote|Keynote|मुख्य व्याख्यान
agendaPapers|Research paper presentations|शोधपत्र प्रस्तुतियाँ
agendaBreak|Break|विराम
agendaPanel|Panel discussion|पैनल चर्चा
agendaDemo|Demonstration|प्रदर्शन
agendaGuidedExercise|Guided exercise|निर्देशित अभ्यास
agendaIndependentPractice|Independent practice|स्वतंत्र अभ्यास
agendaReview|Review and feedback|समीक्षा और प्रतिक्रिया
agendaTechCheck|Technical and accessibility check|तकनीकी और सुगम्यता जाँच
agendaWebinarTalk|Live presentation|लाइव प्रस्तुति
agendaModeratedQuestions|Moderated Q&A|संचालित प्रश्नोत्तर
time|Start time|शुरू होने का समय
duration|Minutes|मिनट
session|Session or activity|सत्र या गतिविधि
lead|Speaker or lead|वक्ता या प्रभारी
addSession|Add session|सत्र जोड़ें
budgetHelp|Use one currency for all items. Track estimated and actual costs for space, AV, travel, catering and other needs.|सभी मदों के लिए एक मुद्रा चुनें। स्थान, एवी, यात्रा, खानपान और अन्य ज़रूरतों का अनुमानित और वास्तविक खर्च लिखें।
currency|Currency|मुद्रा
item|Cost item|खर्च की मद
estimate|Estimated cost|अनुमानित खर्च
actual|Actual cost|वास्तविक खर्च
addItem|Add cost item|खर्च की मद जोड़ें
estimatedTotal|Estimated total|कुल अनुमानित खर्च
actualTotal|Actual total|कुल वास्तविक खर्च
remove|Remove|हटाएं
removeAgenda|Remove session {number}|सत्र {number} हटाएं
removeBudget|Remove cost item {number}|खर्च की मद {number} हटाएं
exportTitle|Event plan|आयोजन की योजना
listed|Post an event listing when the public details are ready.|सार्वजनिक विवरण तैयार होने पर आयोजन की सूची भेजें।
conferencing|Open video conferencing|वीडियो कॉन्फ़्रेंसिंग खोलें
conferencingHelp|Set up or host an online or hybrid session in the conferencing app. Sign in there when prompted, then paste the joining link below.|ऑनलाइन या हाइब्रिड सत्र कॉन्फ़्रेंसिंग ऐप में बनाएं या चलाएं। ज़रूरत पड़ने पर वहाँ साइन इन करें, फिर जुड़ने का लिंक नीचे डालें।
onlineMeeting|Video conferencing|वीडियो कॉन्फ़्रेंसिंग
meetingLink|Meeting link|मीटिंग लिंक
joinMeeting|Join saved meeting|सहेजी गई मीटिंग में जुड़ें
meetingLinkInvalid|Enter a valid HTTPS meeting link.|एक सही HTTPS मीटिंग लिंक डालें।
newTab|Opens in a new tab.|नए टैब में खुलेगा।
`.trim().split('\n');
const copy = Object.fromEntries(words.map(line => {
  const [key, en, hi] = line.split('|');
  return [key, { en, hi }];
}));

const currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'AED', 'BDT', 'BRL', 'CHF', 'CNY', 'JPY', 'KES', 'KRW', 'MXN', 'NPR', 'NZD', 'PKR', 'RUB', 'SAR', 'SGD', 'ZAR'];
const memoryDrafts = new Map();
const unsavedDrafts = new Set();
let activeType;

function textFor(language) {
  const locale = language === 'hi' ? 'hi' : 'en';
  const number = new Intl.NumberFormat(locale);
  const t = (key, values = {}) => copy[key]?.[locale].replace(/\{(\w+)\}/g, (match, name) => {
    const value = values[name];
    return typeof value === 'number' ? number.format(value) : value ?? match;
  }) ?? '';
  return { locale, number, t };
}

function safeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function draftText(value, max = 240) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

function cleanDraft(value, locale, type) {
  const brief = Object.fromEntries(briefFields.map(field => [
    field, draftText(value?.brief?.[field], briefLimits[field]),
  ]));
  brief.eventType = type;
  if (!eventModes.includes(brief.mode)) brief.mode = !value && type === 'webinar' ? 'online' : '';
  const details = Object.fromEntries(fieldsFor(type).map(field => [
    field, draftText(value?.details?.[field], longDetails.has(field) ? 3000 : detailLinks.has(field) ? 2048 : 240),
  ]));
  const rows = (key, fields) => (Array.isArray(value?.[key]) ? value[key] : []).slice(0, rowLimit)
    .map(row => Object.fromEntries(fields.map(field => [field, draftText(row?.[field])])));
  const taskIds = new Set(phasesFor(type).flatMap(phase => phase.tasks));
  return {
    brief, details,
    classification: normalizePlannerClassification(value?.classification),
    agenda: rows('agenda', agendaFields),
    budget: rows('budget', budgetFields),
    checked: new Set((Array.isArray(value?.checked) ? value.checked : []).filter(id => taskIds.has(id))),
    currency: currencies.includes(value?.currency) ? value.currency : locale === 'hi' ? 'INR' : 'USD',
  };
}

const validType = type => eventTypes.includes(type) ? type : '';
const typedDraftKey = type => storageKey + ':' + type;
const legacyDraft = () => JSON.parse(globalThis.localStorage.getItem(storageKey));
const legacyType = value => validType(value?.brief?.eventType) || 'seminar';

function resolvePlannerType(requested) {
  const explicit = validType(requested);
  if (explicit) return explicit;
  if (activeType) return activeType;
  try {
    return validType(globalThis.localStorage.getItem(activeTypeKey)) || legacyType(legacyDraft());
  } catch {
    return 'seminar';
  }
}

function readDraft(locale, type) {
  let available = !unsavedDrafts.has(type);
  let value = memoryDrafts.get(type);
  try {
    if (available) {
      const raw = globalThis.localStorage.getItem(typedDraftKey(type));
      if (raw) value = JSON.parse(raw);
      else if (!value) {
        const previous = legacyDraft();
        if (previous && legacyType(previous) === type) value = previous;
      }
    }
  } catch {
    available = false;
  }
  return { draft: cleanDraft(value, locale, type), available };
}

export function readPlannerEvent(requestedType = '', language = 'en') {
  const type = resolvePlannerType(requestedType);
  const { draft: { brief, agenda, details, classification } } = readDraft(textFor(language).locale, type);
  return { type, brief, agenda, details, classification };
}

function briefInput(field, t, value) {
  if (field === 'mode') {
    return `<label class="field">${t(field)}<select data-brief="${field}">
      <option value="">${t('choose')}</option>${eventModes.map(option =>
        `<option value="${option}"${value === option ? ' selected' : ''}>${t(option)}</option>`).join('')}
    </select></label>`;
  }
  if (field === 'notes') {
    return `<label class="field full">${t(field)}<textarea data-brief="${field}" maxlength="${briefLimits.notes}" dir="auto">${safeText(value)}</textarea></label>`;
  }
  const type = field.endsWith('Date') ? 'date' : ['registration', 'meetingLink'].includes(field) ? 'url' : 'text';
  const hint = field === 'timezone' ? ` placeholder="${safeText(t('timezoneExample'))}"` : '';
  const length = briefLimits[field] ?? 240;
  return `<label class="field${field === 'title' ? ' full' : ''}">${t(field)}<input data-brief="${field}" type="${type}" value="${safeText(value)}" maxlength="${length}" dir="auto"${hint}></label>`;
}

function detailInput(field, t, value) {
  if (longDetails.has(field)) {
    return `<label class="field full">${t(field)}<textarea data-detail="${field}" maxlength="3000" rows="3" dir="auto">${safeText(value)}</textarea></label>`;
  }
  const kind = field.endsWith('Date') || field.endsWith('Deadline') ? 'date'
    : detailLinks.has(field) ? 'url' : field === 'participantCapacity' ? 'number' : 'text';
  const limit = kind === 'number' ? ' min="1" max="100000" step="1"'
    : kind === 'url' ? ' maxlength="2048"' : kind === 'text' ? ' maxlength="240"' : '';
  return `<label class="field">${t(field)}<input type="${kind}"${limit} value="${safeText(value)}" data-detail="${field}" dir="auto"></label>`;
}

function rowInput(field, value, label) {
  const kind = field === 'time' ? 'time' : ['duration', 'estimate', 'actual'].includes(field) ? 'number' : 'text';
  const rules = field === 'duration' ? ' min="0" max="1440" step="1"'
    : kind === 'number' ? ' min="0" max="1000000000" step="any"' : ' maxlength="240"';
  return `<label class="field">${label}<input type="${kind}"${rules} value="${safeText(value)}" data-row-field="${field}" dir="auto"></label>`;
}

function rowMarkup(group, t, rows) {
  const fields = group === 'agenda' ? agendaFields : budgetFields;
  return rows.map((row, index) =>
    `<div class="planner-row planner-row--${group}" data-row="${index}" data-row-group="${group}">
      ${fields.map(field => rowInput(field, row[field], t(field))).join('')}
      <button class="text-button planner-remove" type="button" data-remove="${group}" aria-label="${safeText(t(group === 'agenda' ? 'removeAgenda' : 'removeBudget', { number: index + 1 }))}">${t('remove')}</button>
    </div>`,
  ).join('');
}

function milestoneDate(brief, phase) {
  const start = Date.parse(brief.startDate + 'T00:00:00Z');
  const end = Date.parse(brief.endDate + 'T00:00:00Z');
  const base = phase.id === 'followup' && Number.isFinite(end) && end >= start ? end : start;
  return Number.isFinite(base) ? new Date(base + phase.days * 86_400_000) : null;
}

function milestoneHint(phase, t) {
  if (phase.timing) return t(phase.timing);
  if (!phase.days) return t('eventDay');
  return t(phase.days < 0 ? 'beforeDays' : 'afterDays', { number: Math.abs(phase.days) });
}

function phaseMarkup(phase, draft, t) {
  return `<details class="planner-phase"${phase.id === 'scope' ? ' open' : ''}>
      <summary><span>${t(phase.id)}</span><span class="planner-milestone" data-milestone="${phase.id}">${milestoneHint(phase, t)}</span></summary>
      <ul class="planner-tasks">
      ${phase.tasks.map(id => `<li><label><input type="checkbox" data-task="${id}"${draft.checked.has(id) ? ' checked' : ''}><span>${t(id)}</span></label></li>`).join('')}
      </ul>
    </details>`;
}

function currencyOptions(draft, locale) {
  const names = new Intl.DisplayNames([locale], { type: 'currency' });
  return currencies.map(code => `<option value="${code}"${code === draft.currency ? ' selected' : ''}>${code} · ${safeText(names.of(code))}</option>`).join('');
}

export function eventPlannerContent(language, submitUrl, {
  type: requestedType, plannerUrl, proceedingsUrl, websiteUrl, registrationUrl, subjects = [], countries = [],
} = {}) {
  const { locale, t } = textFor(language);
  const type = resolvePlannerType(requestedType);
  const { draft, available } = readDraft(locale, type);
  const format = formats[type];
  const toolLinks = [['registrationForm', registrationUrl], ['proceedings', proceedingsUrl], ['eventWebsite', websiteUrl]]
    .filter(([, buildUrl]) => typeof buildUrl === 'function')
    .map(([label, buildUrl]) => `<a href="${safeText(buildUrl(type))}" class="text-link">${t(label)}</a>`).join('');
  const submit = safeText(submitUrl);
  return `<section class="event-planner" data-event-planner data-planner-type="${type}" lang="${locale}" dir="ltr">
    <nav class="planner-types" aria-label="${t('plannerTypes')}">
      ${eventTypes.map(value => {
        const href = plannerUrl?.(value) ?? '/?' + new URLSearchParams({ view: 'planner', type: value });
        return `<a href="${safeText(href)}"${value === type ? ' aria-current="page"' : ''}>${t(value)}</a>`;
      }).join('')}
    </nav>
    <p class="page-description planner-intro">${format ? t(type + 'Intro') : t('intro')}</p>
    <div class="planner-toolbar">
      <p class="planner-draft" data-planner-storage>${t(available ? 'browserDraft' : 'temporaryDraft')}</p>
      <button type="button" class="button secondary" data-planner-download>${t('download')}</button>
    </div>
    <nav class="planner-nav" aria-label="${t('sections')}">
      ${sections.map(section => `<a href="#planner-${section}" class="text-link">${t(section)}</a>`).join('')}
      ${toolLinks}
    </nav>
    <section id="planner-brief" class="planner-section" aria-labelledby="planner-brief-title">
      <h2 id="planner-brief-title">${t('brief')}</h2>
      <div class="planner-brief">${briefFields.filter(field => !['eventType', 'meetingLink'].includes(field)).map(field => briefInput(field, t, draft.brief[field])).join('')}</div>
      <p class="planner-feedback" data-planner-dates role="status" hidden>${t('dateOrder')}</p>
      ${format ? `<div class="planner-format">
        <h3>${t('formatDetails', { type: t(type) })}</h3>
        <div class="planner-brief">${format.fields.map(field => detailInput(field, t, draft.details[field])).join('')}</div>
      </div>` : ''}
    </section>
    ${classificationContent(locale, { subjects, countries, value: draft.classification })}
    <section id="planner-timeline" class="planner-section" aria-labelledby="planner-timeline-title">
      <div class="planner-section-heading">
        <h2 id="planner-timeline-title">${t('timeline')}</h2>
        <p data-planner-progress aria-live="polite"></p>
      </div>
      <p class="page-description">${t('timelineHelp')}</p>
      <div class="planner-phases">${phasesFor(type).map(phase => phaseMarkup(phase, draft, t)).join('')}</div>
      <section class="planner-conference" id="planner-onlineMeeting" aria-labelledby="planner-conference-title">
        <div>
          <h3 id="planner-conference-title">${t('onlineMeeting')}</h3>
          <p>${t('conferencingHelp')}</p>
        </div>
        <a class="button" href="${conferencingUrl}" target="_blank" rel="noopener noreferrer">${t('conferencing')}<span class="visually-hidden">. ${t('newTab')}</span></a>
        <div class="planner-meeting-entry">
          ${briefInput('meetingLink', t, draft.brief.meetingLink)}
          <a class="button secondary" data-planner-join target="_blank" rel="noopener noreferrer" hidden>${t('joinMeeting')}<span class="visually-hidden">. ${t('newTab')}</span></a>
          <p class="planner-feedback" id="planner-meeting-error" role="status" hidden>${t('meetingLinkInvalid')}</p>
        </div>
      </section>
    </section>
    <section id="planner-agenda" class="planner-section" aria-labelledby="planner-agenda-title">
      <h2 id="planner-agenda-title">${t('agenda')}</h2>
      <p class="page-description">${t('agendaHelp')}</p>
      <div data-planner-rows="agenda">${rowMarkup('agenda', t, draft.agenda)}</div>
      <div class="planner-agenda-actions">
        <button type="button" class="button secondary" data-add="agenda">${t('addSession')}</button>
        ${format ? `<button type="button" class="button secondary" data-planner-agenda-template${draft.agenda.length ? ' hidden' : ''}>${t('useAgenda')}</button>` : ''}
      </div>
    </section>
    <section id="planner-budget" class="planner-section" aria-labelledby="planner-budget-title">
      <h2 id="planner-budget-title">${t('budget')}</h2>
      <p class="page-description">${t('budgetHelp')}</p>
      <label class="field planner-currency">${t('currency')}<select data-planner-currency>${currencyOptions(draft, locale)}</select></label>
      <div data-planner-rows="budget">${rowMarkup('budget', t, draft.budget)}</div>
      <button type="button" class="button secondary" data-add="budget">${t('addItem')}</button>
      <dl class="planner-totals">
        <div><dt>${t('estimatedTotal')}</dt><dd data-planner-total="estimate"></dd></div>
        <div><dt>${t('actualTotal')}</dt><dd data-planner-total="actual"></dd></div>
      </dl>
    </section>
    <div class="planner-listing"><p>${t('listed')}</p><a class="button" href="${submit}">${t('post')}</a></div>
    <p class="visually-hidden" role="status" data-planner-download-status></p>
  </section>`;
}

function amount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 && number <= 1_000_000_000 ? number : 0;
}

function httpsMeetingUrl(text) {
  if (!/^https:\/\//i.test(text)) return null;
  try {
    const url = new URL(text);
    return url.protocol === 'https:' && !url.username && !url.password ? url : null;
  } catch {
    return null;
  }
}

function budgetTotals(draft, locale) {
  const money = new Intl.NumberFormat(locale, { style: 'currency', currency: draft.currency });
  const precision = 10 ** money.resolvedOptions().maximumFractionDigits;
  const formatSum = field => money.format(draft.budget.reduce(
    (sum, row) => sum + Math.round(amount(row[field]) * precision), 0,
  ) / precision);
  return { format: value => money.format(amount(value)), estimate: formatSum('estimate'), actual: formatSum('actual') };
}

function downloadPlan(draft, t, locale, submitUrl, { subjects, countries }) {
  const money = budgetTotals(draft, locale);
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const lines = [t('exportTitle'), '', t('brief')];
  for (const field of briefFields) {
    const value = draft.brief[field];
    if (value) lines.push(t(field) + ': ' + (['eventType', 'mode'].includes(field) ? t(value) : value));
  }
  const type = draft.brief.eventType;
  if (fieldsFor(type).some(field => draft.details[field])) {
    lines.push('', t('formatDetails', { type: t(type) }));
    for (const field of fieldsFor(type)) {
      if (draft.details[field]) lines.push(t(field) + ': ' + draft.details[field]);
    }
  }
  const classification = plannerClassificationSnapshot(draft.classification, { subjects, countries, language: locale });
  if (Object.values(draft.classification).some(Boolean)) {
    lines.push('', t('classification'));
    const { subjectCode, streamCode, keywords, countryCode } = draft.classification;
    if (subjectCode) lines.push(t('subjectCode') + ': ' + [subjectCode, classification.subject].filter(Boolean).join(' · '));
    if (streamCode) lines.push(t('streamCode') + ': ' + [streamCode, classification.stream].filter(Boolean).join(' · '));
    if (keywords) lines.push(t('keywords') + ': ' + keywords);
    if (countryCode) lines.push(t('countryCode') + ': ' + [
      countryCode, classification.country, ...classification.callingCodes,
    ].filter(Boolean).join(' · '));
  }
  lines.push('', t('timeline'));
  for (const phase of phasesFor(type)) {
    const date = milestoneDate(draft.brief, phase);
    lines.push(t(phase.id) + ' — ' + (date ? dateFormat.format(date) : milestoneHint(phase, t)));
    for (const id of phase.tasks) lines.push((draft.checked.has(id) ? '[x] ' : '[ ] ') + t(id));
  }
  lines.push('', t('agenda'));
  for (const row of draft.agenda) {
    const values = agendaFields.filter(field => row[field]).map(field => t(field) + ': ' + row[field]);
    if (values.length) lines.push(values.join(' · '));
  }
  lines.push('', t('budget') + ' (' + draft.currency + ')');
  for (const row of draft.budget) {
    if (budgetFields.some(field => row[field])) lines.push([
      row.item || t('item'), ...['estimate', 'actual'].filter(field => row[field] !== '')
        .map(field => t(field) + ': ' + money.format(row[field])),
    ].join(' · '));
  }
  lines.push(t('estimatedTotal') + ': ' + money.estimate, t('actualTotal') + ': ' + money.actual, '',
    t('conferencing') + ': ' + conferencingUrl, t('post') + ': ' + new URL(submitUrl, location.href).href, '');
  const url = URL.createObjectURL(new Blob(['\uFEFF', lines.join('\n')], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = (draft.brief.title.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .slice(0, 80).replace(/^-|-$/g, '') || type) + '-plan.txt';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function bindEventPlanner(root, language, submitUrl, { subjects = [], countries = [] } = {}) {
  const planner = root?.matches?.('[data-event-planner]') ? root : root?.querySelector?.('[data-event-planner]');
  if (!planner || planner.dataset.bound) return;
  planner.dataset.bound = 'true';
  const { locale, t } = textFor(language);
  const type = resolvePlannerType(planner.dataset.plannerType);
  const { draft } = readDraft(locale, type);
  const phases = phasesFor(type);
  const taskCount = phases.reduce((count, phase) => count + phase.tasks.length, 0);
  activeType = type;
  try { globalThis.localStorage.setItem(activeTypeKey, type); } catch {}
  const get = selector => planner.querySelector(selector);
  const dates = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' });
  const meetingField = get('[data-brief="meetingLink"]');
  const joinMeeting = get('[data-planner-join]');
  const meetingError = get('#planner-meeting-error');
  const agendaTemplate = get('[data-planner-agenda-template]');

  function save() {
    const value = { ...draft, checked: [...draft.checked] };
    memoryDrafts.set(type, value);
    let available = true;
    try {
      globalThis.localStorage.setItem(typedDraftKey(type), JSON.stringify(value));
      unsavedDrafts.delete(type);
    } catch {
      available = false;
      unsavedDrafts.add(type);
    }
    get('[data-planner-storage]').textContent = t(available ? 'browserDraft' : 'temporaryDraft');
  }

  function updateDates() {
    const { startDate, endDate } = draft.brief;
    const invalid = !!(startDate && endDate && endDate < startDate);
    get('[data-planner-dates]').hidden = !invalid;
    if (invalid) get('[data-brief="endDate"]').setAttribute('aria-invalid', 'true');
    else get('[data-brief="endDate"]').removeAttribute('aria-invalid');
    for (const phase of phases) {
      const date = milestoneDate(draft.brief, phase);
      const target = get(`[data-milestone="${phase.id}"]`);
      target.textContent = date ? dates.format(date) : milestoneHint(phase, t);
    }
  }

  function updateProgress() {
    get('[data-planner-progress]').textContent = t('progress', { done: draft.checked.size, total: taskCount });
  }

  function updateMeetingLink() {
    const value = meetingField.value.trim();
    const url = httpsMeetingUrl(value);
    if (url) joinMeeting.href = url.href;
    else joinMeeting.removeAttribute('href');
    joinMeeting.hidden = !url;
    const invalid = Boolean(value && !url);
    meetingError.hidden = !invalid;
    if (invalid) {
      meetingField.setAttribute('aria-invalid', 'true');
      meetingField.setAttribute('aria-describedby', meetingError.id);
    } else {
      meetingField.removeAttribute('aria-invalid');
      meetingField.removeAttribute('aria-describedby');
    }
  }

  function updateBudget() {
    const totals = budgetTotals(draft, locale);
    for (const field of ['estimate', 'actual']) get(`[data-planner-total="${field}"]`).textContent = totals[field];
  }

  function updateRows(group, focusIndex) {
    const container = get(`[data-planner-rows="${group}"]`);
    container.innerHTML = rowMarkup(group, t, draft[group]);
    const add = get(`[data-add="${group}"]`);
    add.disabled = draft[group].length >= rowLimit;
    (container.querySelector(`[data-row="${focusIndex}"] input`) || add).focus();
    if (group === 'agenda' && agendaTemplate) agendaTemplate.hidden = draft.agenda.length > 0;
    if (group === 'budget') updateBudget();
  }

  updateDates();
  updateProgress();
  updateBudget();
  updateMeetingLink();
  for (const group of ['agenda', 'budget']) get(`[data-add="${group}"]`).disabled = draft[group].length >= rowLimit;
  bindClassification(planner, locale, { subjects, countries, value: draft.classification,
    onChange(value) {
      draft.classification = value;
      save();
    },
  });

  planner.addEventListener('input', event => {
    const field = event.target;
    if (field.dataset.brief) {
      draft.brief[field.dataset.brief] = field.value;
      if (field.type === 'date') updateDates();
      if (field === meetingField) updateMeetingLink();
    } else if (field.dataset.detail) {
      draft.details[field.dataset.detail] = field.value;
    } else if (field.dataset.task) {
      if (field.checked) draft.checked.add(field.dataset.task);
      else draft.checked.delete(field.dataset.task);
      updateProgress();
    } else if (field.matches('[data-planner-currency]')) {
      draft.currency = field.value;
      updateBudget();
    } else if (field.dataset.rowField) {
      const { row, rowGroup } = field.closest('[data-row]').dataset;
      draft[rowGroup][row][field.dataset.rowField] = field.value;
      if (rowGroup === 'budget') updateBudget();
    } else return;
    save();
  });

  planner.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    const { add, remove } = button.dataset;
    if (button === agendaTemplate && !draft.agenda.length) {
      draft.agenda = formats[type].agenda.map(([session, duration]) => ({
        time: '', duration: String(duration), session: t(session), lead: '',
      }));
      updateRows('agenda', 0);
      save();
    } else if (add && draft[add].length < rowLimit) {
      const fields = add === 'agenda' ? agendaFields : budgetFields;
      draft[add].push(Object.fromEntries(fields.map(field => [field, ''])));
      updateRows(add, draft[add].length - 1);
      save();
    } else if (remove) {
      const index = Number(button.closest('[data-row]').dataset.row);
      draft[remove].splice(index, 1);
      updateRows(remove, Math.min(index, draft[remove].length - 1));
      save();
    } else if (button.matches('[data-planner-download]')) {
      downloadPlan(draft, t, locale, submitUrl, { subjects, countries });
      get('[data-planner-download-status]').textContent = t('downloaded');
    }
  });
}

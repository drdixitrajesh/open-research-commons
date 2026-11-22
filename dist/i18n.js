export const locales = {
  en: { name: "English", dir: "ltr", locale: "en" },
  hi: { name: "हिन्दी", dir: "ltr", locale: "hi-IN" },
  es: { name: "Español", dir: "ltr", locale: "es" },
  fr: { name: "Français", dir: "ltr", locale: "fr" },
  ar: { name: "العربية", dir: "rtl", locale: "ar" },
  pt: { name: "Português", dir: "ltr", locale: "pt" },
  zh: { name: "简体中文", dir: "ltr", locale: "zh-Hans" },
  ru: { name: "Русский", dir: "ltr", locale: "ru" },
};

// Translation columns are in the same order as the locales above.
const general = `
brand|Global Conference & Research Repository|वैश्विक सम्मेलन एवं शोध भंडार|Repositorio Global de Congresos e Investigación|Répertoire mondial des conférences et de la recherche|المستودع العالمي للمؤتمرات والأبحاث|Repositório Global de Conferências e Pesquisa|全球学术会议与研究资料库|Глобальный репозиторий конференций и исследований
skip|Skip to content|मुख्य सामग्री पर जाएँ|Ir al contenido|Aller au contenu|انتقل إلى المحتوى|Ir para o conteúdo|跳转到主要内容|Перейти к содержанию
home|Home|मुखपृष्ठ|Inicio|Accueil|الرئيسية|Início|首页|Главная
events|Events|आयोजन|Eventos|Événements|الفعاليات|Eventos|学术活动|Мероприятия
eventsRss|Events RSS feed|आयोजनों की RSS फ़ीड|Fuente RSS de eventos|Flux RSS des événements|خلاصة RSS للفعاليات|Feed RSS de eventos|活动 RSS 订阅|RSS-лента мероприятий
proceedings|Proceedings & materials|सम्मेलन कार्यवाही और सामग्री|Actas y materiales|Actes et ressources|وقائع المؤتمرات والمواد المصاحبة|Anais e materiais|会议论文集与资料|Сборники и материалы
theses|Theses & dissertations|थीसिस और शोधप्रबंध|Tesis y trabajos de posgrado|Thèses et mémoires|الأطروحات والرسائل الجامعية|Teses e dissertações|学位论文|Диссертации и выпускные работы
subjects|Browse subjects|विषय देखें|Explorar disciplinas|Parcourir les disciplines|تصفّح التخصصات|Explorar áreas de pesquisa|浏览学科|Обзор дисциплин
institutions|Institutions|संस्थान|Instituciones|Établissements|المؤسسات|Instituições|机构|Организации
about|About & help|परिचय और सहायता|Acerca del repositorio y ayuda|À propos et aide|عن المستودع والمساعدة|Sobre o repositório e ajuda|关于与帮助|О репозитории и помощь
submit|Submit|जमा करें|Enviar|Soumettre|إرسال|Enviar|提交|Отправить
account|My dashboard|मेरा डैशबोर्ड|Mi panel|Mon tableau de bord|لوحة التحكم الخاصة بي|Meu painel|我的工作台|Мой кабинет
review|Moderation|समीक्षा|Moderación|Modération|الإشراف|Moderação|审核|Модерация
interfaceLanguage|Website language|वेबसाइट की भाषा|Idioma del sitio|Langue du site|لغة الموقع|Idioma do site|网站语言|Язык сайта
heroTitle|Research, in reach.|शोध, सबकी पहुँच में।|La investigación, a tu alcance.|La recherche à votre portée.|البحث في متناولك.|Pesquisa ao seu alcance.|让研究触手可及。|Исследования в открытом доступе.
heroText|Find conferences, seminars, symposia, workshops and webinars. Browse proceedings, conference materials, theses and dissertations from around the world.|दुनिया भर के सम्मेलन, सेमिनार, संगोष्ठियाँ, कार्यशालाएँ और वेबिनार खोजें। सम्मेलन की कार्यवाही, प्रस्तुतियाँ, थीसिस और शोधप्रबंध देखें।|Encuentra congresos, seminarios, simposios, talleres y webinarios. Explora actas, materiales de congresos, tesis y trabajos de posgrado de todo el mundo.|Trouvez des conférences, séminaires, colloques, ateliers et webinaires. Explorez les actes, les ressources de conférence, les thèses et les mémoires du monde entier.|اعثر على المؤتمرات والندوات والملتقيات وورش العمل والندوات عبر الإنترنت. تصفّح وقائع المؤتمرات وموادها والأطروحات والرسائل من حول العالم.|Encontre conferências, seminários, simpósios, oficinas e webinários. Explore anais, materiais de conferências, teses e dissertações do mundo todo.|查找会议、研讨会、专题讨论会、工作坊和网络讲座。浏览全球的会议论文集、会议资料和学位论文。|Находите конференции, семинары, симпозиумы, практикумы и вебинары. Изучайте сборники, материалы конференций и диссертации со всего мира.
homeGuideTitle|About Global Conference & Research Repository|वैश्विक सम्मेलन एवं शोध भंडार का परिचय|Acerca del Repositorio Global de Congresos e Investigación|À propos du Répertoire mondial des conférences et de la recherche|عن المستودع العالمي للمؤتمرات والأبحاث|Sobre o Repositório Global de Conferências e Pesquisa|关于全球学术会议与研究资料库|О Глобальном репозитории конференций и исследований
homeGuideIntro|This public catalog helps you plan which academic events to attend, find materials from a conference, and discover postgraduate research in your field. It brings together organizer announcements and records shared by researchers and institutions.|इस सार्वजनिक कैटलॉग में आप अपने विषय के अकादमिक आयोजन चुन सकते हैं, सम्मेलनों की सामग्री खोज सकते हैं और स्नातकोत्तर शोध देख सकते हैं। इसमें आयोजकों की सूचनाएँ और शोधकर्ताओं व संस्थानों द्वारा साझा की गई प्रविष्टियाँ मिलती हैं।|Este catálogo público te ayuda a planificar a qué eventos asistir, encontrar materiales de congresos y descubrir investigaciones de posgrado en tu campo. Reúne anuncios de organizadores y registros compartidos por investigadores e instituciones.|Ce catalogue public vous aide à choisir des événements scientifiques, à trouver des ressources de conférence et à découvrir les recherches de troisième cycle dans votre domaine. Il rassemble les annonces des organisateurs et les notices partagées par les chercheurs et les établissements.|يساعدك هذا الفهرس العام في اختيار الفعاليات الأكاديمية التي ترغب في حضورها والعثور على مواد المؤتمرات واكتشاف أبحاث الدراسات العليا في تخصصك. ويجمع إعلانات المنظّمين والسجلات التي يشاركها الباحثون والمؤسسات.|Este catálogo público ajuda você a escolher eventos acadêmicos, encontrar materiais de conferências e descobrir pesquisas de pós-graduação na sua área. Ele reúne anúncios de organizadores e registros compartilhados por pesquisadores e instituições.|这个公开目录帮助你选择要参加的学术活动、查找会议资料，并发现本领域的研究生科研成果。目录汇集了主办方发布的活动公告以及研究人员和机构分享的记录。|Общедоступный каталог помогает выбрать научное мероприятие, найти материалы конференций и познакомиться с исследованиями аспирантов и магистрантов. Здесь собраны объявления организаторов и записи, которыми поделились исследователи и учреждения.
homeGuideEventsTitle|Find an event|आयोजन खोजें|Encuentra un evento|Trouver un événement|العثور على فعالية|Encontre um evento|查找活动|Найти мероприятие
homeGuideEventsText|Browse upcoming, ongoing and past events, or check open calls for papers. Filter by date, country or participation mode. Each organizer listing links to the official page for the latest programme and registration details.|आगामी, चल रहे और पिछले आयोजन देखें या शोधपत्रों के लिए खुले आमंत्रण खोजें। तारीख, देश या भागीदारी के तरीके से फ़िल्टर करें। आयोजक की आधिकारिक वेबसाइट का लिंक कार्यक्रम और पंजीकरण की ताज़ा जानकारी देता है।|Consulta eventos próximos, en curso y pasados, o revisa las convocatorias abiertas. Filtra por fecha, país o modalidad. Cada anuncio enlaza con la página oficial para consultar el programa y la inscripción.|Parcourez les événements à venir, en cours ou passés, ou consultez les appels à communications ouverts. Filtrez par date, pays ou mode de participation. Chaque annonce renvoie vers la page officielle pour le programme et l’inscription.|تصفّح الفعاليات القادمة والجارية والسابقة أو اطّلع على الدعوات المفتوحة لتقديم الأوراق البحثية. صفِّ النتائج حسب التاريخ أو البلد أو طريقة المشاركة. يوصلك كل إعلان بصفحة المنظّم للاطّلاع على أحدث تفاصيل البرنامج والتسجيل.|Veja eventos futuros, em andamento ou passados, e consulte chamadas de trabalhos abertas. Filtre por data, país ou modalidade. Cada anúncio inclui um link para a página oficial com a programação e informações de inscrição.|浏览即将举行、正在举行和已经结束的活动，或查看开放的征稿启事。按日期、国家或参与方式筛选。每条主办方公告均链接到官方页面，便于查看最新议程和报名信息。|Просматривайте предстоящие, текущие и прошедшие мероприятия или открытые объявления о приёме работ. Фильтруйте по дате, стране или формату участия. В каждом объявлении есть ссылка на страницу организатора с актуальной программой и регистрацией.
homeGuideResearchTitle|Find and cite research|शोध खोजें और उसका संदर्भ दें|Busca y cita investigaciones|Trouver et citer des travaux|العثور على الأبحاث والاستشهاد بها|Encontre e cite pesquisas|查找和引用研究|Найти и процитировать исследование
homeGuideResearchText|Search by title, author or DOI. Filter results by ANZSRC 2020 subject, stream of research, or the language of the event, document or listing. Open a record to find its source, available files and citation details.|शीर्षक, लेखक या DOI से खोजें। ANZSRC 2020 के विषय, शोध की शाखा या आयोजन, दस्तावेज़ और लिस्टिंग की भाषा के आधार पर परिणाम छाँटें। किसी प्रविष्टि को खोलकर उसका स्रोत, उपलब्ध फ़ाइलें और संदर्भ की जानकारी देखें।|Busca por título, autor o DOI. Acota los resultados por disciplina o línea de investigación de ANZSRC 2020, o por el idioma del evento, documento o registro. Abre un registro para ver su fuente, archivos disponibles y datos de citación.|Recherchez par titre, auteur ou DOI. Affinez les résultats par discipline ou axe de recherche ANZSRC 2020, ou par langue de l’événement, du document ou de la notice. Ouvrez une notice pour consulter sa source, ses fichiers et ses informations de citation.|ابحث بالعنوان أو المؤلف أو DOI. ضيّق النتائج حسب التخصص أو مسار البحث وفق ANZSRC 2020، أو حسب لغة الفعالية أو المستند أو السجل. افتح السجل للاطّلاع على المصدر والملفات المتاحة وبيانات الاستشهاد.|Busque por título, autor ou DOI. Refine por área ou linha de pesquisa da ANZSRC 2020, ou pelo idioma do evento, documento ou registro. Abra o registro para consultar a fonte, os arquivos disponíveis e os dados de citação.|按标题、作者或 DOI 搜索。按 ANZSRC 2020 学科或研究方向缩小范围，或选择活动、文档或记录的语言。打开记录即可查看来源、可用文件和引用信息。|Ищите по названию, автору или DOI. Уточняйте результаты по дисциплине или направлению исследований ANZSRC 2020, либо по языку мероприятия, документа или записи. Откройте запись, чтобы найти источник, доступные файлы и данные для цитирования.
homeGuideSubmitTitle|Share your work|अपना काम साझा करें|Comparte tu trabajo|Partager vos travaux|مشاركة أعمالك|Compartilhe seu trabalho|分享你的成果|Поделиться своей работой
homeGuideSubmitText|Submit an event listing, conference material, thesis or dissertation. Add the details people can search for and attach files you have permission to share, or link to an official source. Contributions go through review before publication.|आयोजन की सूचना, सम्मेलन सामग्री, थीसिस या शोधप्रबंध जमा करें। खोज में काम आने वाली जानकारी भरें और वे फ़ाइलें जोड़ें जिन्हें साझा करने की अनुमति है, या आधिकारिक स्रोत का लिंक दें। प्रकाशन से पहले प्रविष्टियों की समीक्षा होती है।|Envía un anuncio de evento, material de congreso, tesis o trabajo de posgrado. Añade los datos que se podrán buscar y adjunta archivos autorizados o enlaza una fuente oficial. Las contribuciones se revisan antes de publicarse.|Déposez une annonce d’événement, une ressource de conférence, une thèse ou un mémoire. Renseignez les informations utiles à la recherche et joignez les fichiers autorisés ou un lien vers une source officielle. Les dépôts sont examinés avant publication.|أرسل إعلان فعالية أو مواد مؤتمر أو أطروحة أو رسالة جامعية. أضف البيانات التي تساعد الآخرين في العثور عليها وأرفق الملفات المصرّح بمشاركتها أو رابطًا إلى مصدر رسمي. تُراجَع المساهمات قبل نشرها.|Envie um anúncio de evento, material de conferência, tese ou dissertação. Preencha os dados que ajudam na busca e anexe arquivos que você pode compartilhar ou inclua um link para a fonte oficial. As contribuições são revisadas antes da publicação.|提交活动公告、会议资料或学位论文。填写便于检索的信息，并附上获准分享的文件或官方来源链接。提交内容将在发布前接受审核。|Добавьте объявление о мероприятии, материалы конференции или диссертацию. Заполните сведения для поиска и приложите файлы, которые разрешено распространять, или ссылку на официальный источник. Материалы проходят проверку перед публикацией.
search|Search|खोजें|Buscar|Rechercher|بحث|Pesquisar|搜索|Поиск
searchPlaceholder|Search titles, authors, subjects, or DOIs|शीर्षक, लेखक, विषय या DOI खोजें|Busca títulos, autores, disciplinas o DOI|Rechercher par titre, auteur, discipline ou DOI|ابحث بالعنوان أو المؤلف أو التخصص أو DOI|Pesquise por título, autor, área ou DOI|搜索标题、作者、学科或 DOI|Поиск по названию, автору, дисциплине или DOI
all|All contents|सभी सामग्री|Todo el contenido|Tous les contenus|كل المحتوى|Todo o conteúdo|全部内容|Все материалы
notSpecified|Not specified|जानकारी उपलब्ध नहीं|Sin especificar|Non précisé|غير محدد|Não especificado|未注明|Не указано
postEvent|Post an event|आयोजन पोस्ट करें|Anunciar un evento|Annoncer un événement|أضف فعالية|Divulgar um evento|发布活动|Добавить мероприятие
deposit|Deposit research|शोध जमा करें|Depositar investigación|Déposer un travail de recherche|إيداع عمل بحثي|Depositar pesquisa|存档研究成果|Разместить исследование
upcoming|Upcoming events|आगामी आयोजन|Próximos eventos|Événements à venir|الفعاليات المقبلة|Próximos eventos|即将举行的活动|Предстоящие мероприятия
past|Past events|पрошले आयोजन|Eventos anteriores|Événements passés|الفعاليات السابقة|Eventos anteriores|往期活动|Прошедшие мероприятия
ongoing|Ongoing events|चल रहे आयोजन|Eventos en curso|Événements en cours|الفعاليات الجارية|Eventos em andamento|正在举行的活动|Текущие мероприятия
deadlines|Call for papers|शोधपत्र आमंत्रण|Convocatorias de ponencias|Appels à communications|دعوات لتقديم الأوراق البحثية|Chamadas de trabalhos|征稿启事|Приём научных работ
latestResearch|Recently added research|हाल में जोड़े गए शोध|Investigación añadida recientemente|Travaux récemment ajoutés|أبحاث أُضيفت مؤخرًا|Pesquisas adicionadas recentemente|近期新增研究|Недавно добавленные работы
viewAll|View all|सभी देखें|Ver todo|Tout afficher|عرض الكل|Ver tudo|查看全部|Показать все
demo|Example records|उदाहरण प्रविष्टियाँ|Registros de ejemplo|Notices d’exemple|سجلات توضيحية|Registros de exemplo|示例记录|Примеры записей
demoNote|Example records illustrate the repository and carry no registered DOIs.|ये प्रविष्टियाँ संग्रह के उदाहरण हैं। इनके DOI पंजीकृत नहीं हैं।|Los registros de ejemplo ilustran el repositorio y no tienen DOI registrados.|Les notices d’exemple illustrent le dépôt et n’ont pas de DOI enregistré.|توضّح هذه السجلات طريقة عمل المستودع ولا تحمل معرّفات DOI مسجّلة.|Os registros de exemplo ilustram o repositório e não têm DOI registrado.|示例记录用于展示资料库功能，未分配已注册的 DOI。|Эти записи демонстрируют работу репозитория. Зарегистрированных DOI у них нет.
online|Online|ऑनलाइन|En línea|En ligne|عبر الإنترنت|On-line|线上|Онлайн
hybrid|Hybrid|हाइब्रिड|Híbrido|Hybride|مدمج|Híbrido|混合形式|Гибридный формат
inPerson|In person|प्रत्यक्ष|Presencial|En présentiel|حضوري|Presencial|线下|Очно
conference|Conference|सम्मेलन|Congreso|Congrès|مؤتمر|Congresso|学术会议|Конференция
seminar|Seminar|संगोष्ठी|Seminario|Séminaire|حلقة دراسية|Seminário|学术讲座|Семинар
symposium|Symposium|परिसंवाद|Simposio|Symposium|ندوة|Simpósio|专题研讨会|Симпозиум
workshop|Workshop|कार्यशाला|Taller|Atelier|ورشة عمل|Oficina|工作坊|Практикум
webinar|Webinar|वेबिनार|Seminario web|Webinaire|ندوة عبر الإنترنت|Webinário|网络研讨会|Вебинар
proceedingsVolume|Proceedings volume|सम्मेलन कार्यवाही का खंड|Volumen de actas|Volume d’actes|مجلد وقائع المؤتمر|Volume de anais|会议论文集|Сборник трудов
paper|Conference paper|सम्मेलन शोधपत्र|Ponencia de congreso|Article de conférence|ورقة مؤتمر|Artigo de congresso|会议论文|Статья в сборнике конференции
abstractBook|Abstract book|सार-संग्रह|Libro de resúmenes|Recueil de résumés|كتاب الملخصات|Livro de resumos|摘要集|Сборник тезисов
abstract|Abstract|सारांश|Resumen|Résumé|ملخص|Resumo|摘要|Аннотация
presentation|Presentation|प्रस्तुति|Presentación|Présentation|عرض تقديمي|Apresentação|演示文稿|Презентация
poster|Poster|पोस्टर|Póster|Affiche scientifique|ملصق علمي|Pôster|学术海报|Научный постер
report|Report|रिपोर्ट|Informe|Rapport|تقرير|Relatório|报告|Отчёт
recording|Recording|रिकॉर्डिंग|Grabación|Enregistrement|تسجيل|Gravação|录制内容|Запись
supportingMaterial|Supporting material|पूरक सामग्री|Material complementario|Ressource complémentaire|مواد تكميلية|Material complementar|补充材料|Дополнительные материалы
doctoralThesis|Doctoral thesis|डॉक्टरेट शोधप्रबंध|Tesis doctoral|Thèse de doctorat|أطروحة دكتوراه|Tese de doutorado|博士论文|Докторская диссертация
mastersThesis|Master’s thesis|स्नातकोत्तर थीसिस|Tesis de maestría|Mémoire de master|رسالة ماجستير|Dissertação de mestrado|硕士论文|Магистерская диссертация
dissertation|Postgraduate dissertation|स्नातकोत्तर शोधप्रबंध|Trabajo de posgrado|Mémoire de troisième cycle|بحث دراسات عليا|Trabalho de pós-graduação|研究生毕业论文|Выпускная работа по программе послевузовского образования
free|Free to read and contribute|पढ़ना और योगदान करना निःशुल्क है|Consulta y depósito gratuitos|Consultation et dépôt gratuits|القراءة والمساهمة مجانًا|Leitura e depósito gratuitos|免费阅读和提交|Чтение и размещение бесплатны
details|Details|विवरण|Detalles|Détails|التفاصيل|Detalhes|详情|Подробнее
results|Results|परिणाम|Resultados|Résultats|النتائج|Resultados|搜索结果|Результаты
loadingResults|Searching records…|रिकॉर्ड खोज रहे हैं…|Buscando registros…|Recherche de notices…|جارٍ البحث في السجلات…|Pesquisando registros…|正在搜索记录…|Поиск записей…
partialResults|Some records could not be loaded. Results may be incomplete.|कुछ रिकॉर्ड लोड नहीं हो सके। परिणाम अधूरे हो सकते हैं।|No se pudieron cargar algunos registros. Los resultados pueden estar incompletos.|Certaines notices n’ont pas pu être chargées. Les résultats peuvent être incomplets.|تعذّر تحميل بعض السجلات. قد تكون النتائج غير مكتملة.|Alguns registros não puderam ser carregados. Os resultados podem estar incompletos.|部分记录加载失败，结果可能不完整。|Часть записей не удалось загрузить. Результаты могут быть неполными.
noResults|No results found|कोई परिणाम नहीं मिला|No se encontraron resultados|Aucun résultat|لم يُعثر على نتائج|Nenhum resultado encontrado|未找到结果|Ничего не найдено
filter|Filter|फ़िल्टर|Filtrar|Filtrer|تصفية|Filtrar|筛选|Фильтры
clear|Clear filters|फ़िल्टर हटाएँ|Borrar filtros|Effacer les filtres|امسح عوامل التصفية|Limpar filtros|清除筛选条件|Сбросить фильтры
documentLanguage|Document language|दस्तावेज़ की भाषा|Idioma del documento|Langue du document|لغة الوثيقة|Idioma do documento|文献语言|Язык документа
eventLanguage|Event language|आयोजन की भाषा|Idioma del evento|Langue de l’événement|لغة الفعالية|Idioma do evento|活动语言|Язык мероприятия
metadataLanguage|Metadata language|मेटाडेटा की भाषा|Idioma de los metadatos|Langue des métadonnées|لغة البيانات الوصفية|Idioma dos metadados|元数据语言|Язык метаданных
metadataLanguageHelp|Language of the title and description. If blank, uses the event or document language.|शीर्षक और विवरण की भाषा। खाली छोड़ने पर इवेंट या दस्तावेज़ की भाषा इस्तेमाल होगी।|Idioma del título y de la descripción. Si se deja en blanco, se usa el idioma del evento o del documento.|Langue du titre et de la description. À défaut, la langue de l’événement ou du document est utilisée.|لغة العنوان والوصف. إذا تُرك الحقل فارغًا، تُستخدم لغة الفعالية أو المستند.|Idioma do título e da descrição. Se ficar em branco, será usado o idioma do evento ou do documento.|标题和描述的语言。留空时使用活动或文档的语言。|Язык названия и описания. Если поле пустое, используется язык мероприятия или документа.
originalLanguage|Original metadata language|मूल मेटाडेटा की भाषा|Idioma original de los metadatos|Langue d’origine des métadonnées|اللغة الأصلية للبيانات الوصفية|Idioma original dos metadados|原始元数据语言|Исходный язык метаданных
country|Country|देश|País|Pays|البلد|País|国家|Страна
format|Participation mode|भागीदारी का तरीका|Modalidad de participación|Mode de participation|طريقة المشاركة|Modalidade de participação|参与形式|Формат участия
recordType|Record type|प्रविष्टि का प्रकार|Tipo de registro|Type de notice|نوع السجل|Tipo de registro|记录类型|Тип записи
eventKind|Event|आयोजन|Evento|Événement|الفعالية|Evento|学术活动|Мероприятие
contentType|Content type|सामग्री का प्रकार|Tipo de contenido|Type de contenu|نوع المحتوى|Tipo de conteúdo|内容类型|Тип материала
researchType|Research type|शोध का प्रकार|Tipo de trabajo académico|Type de publication scientifique|نوع العمل البحثي|Tipo de trabalho acadêmico|研究成果类型|Вид научной работы
classification|ANZSRC 2020 Fields of Research|ANZSRC 2020 के शोध क्षेत्र|Áreas de investigación de ANZSRC 2020|Domaines de recherche ANZSRC 2020|مجالات البحث وفق تصنيف ANZSRC 2020|Áreas de pesquisa da ANZSRC 2020|ANZSRC 2020 研究领域|Области исследований ANZSRC 2020
browseText|Find related events and research through the official Fields of Research hierarchy.|शोध क्षेत्रों के आधिकारिक वर्गीकरण से संबंधित आयोजन और शोध खोजें।|Encuentra eventos e investigaciones relacionados mediante la jerarquía oficial de áreas de investigación.|Trouvez les événements et travaux associés grâce à la hiérarchie officielle des domaines de recherche.|اعثر على الفعاليات والأبحاث ذات الصلة من خلال التصنيف الرسمي لمجالات البحث.|Encontre eventos e pesquisas relacionados na hierarquia oficial de áreas de pesquisa.|通过官方研究领域分类查找相关活动和研究成果。|Находите связанные мероприятия и работы по официальной иерархии областей исследований.
subjectSearch|Search by subject name or code|विषय का नाम या कोड खोजें|Busca por disciplina o código|Rechercher par nom ou code de discipline|ابحث باسم التخصص أو رمزه|Pesquise por nome ou código da área|按学科名称或代码搜索|Поиск по названию дисциплины или коду
featuredSubjects|Explore subjects|विषय खोजें|Explorar disciplinas|Explorer les disciplines|استكشف التخصصات|Explore as áreas de pesquisa|探索学科|Обзор дисциплин
allSubjects|All subjects|सभी विषय|Todas las disciplinas|Toutes les disciplines|كل التخصصات|Todas as áreas de pesquisa|全部学科|Все дисциплины
subSubject|Stream of Research|शोध की शाखा|Línea de investigación|Axe de recherche|مسار البحث|Linha de pesquisa|研究方向|Направление исследований
allSubSubjects|All research streams|शोध की सभी शाखाएँ|Todas las líneas de investigación|Tous les axes de recherche|جميع مسارات البحث|Todas as linhas de pesquisa|全部研究方向|Все направления исследований
officialLabel|Official English label|आधिकारिक अंग्रेज़ी नाम|Nombre oficial en inglés|Libellé officiel en anglais|التسمية الرسمية بالإنجليزية|Nome oficial em inglês|官方英文名称|Официальное название на английском языке
platformTranslation|Platform translation|मंच द्वारा अनुवाद|Traducción de la plataforma|Traduction de la plateforme|ترجمة المنصة|Tradução da plataforma|平台译名|Перевод платформы
expanded|Show more|और देखें|Mostrar más|Afficher plus|عرض المزيد|Mostrar mais|显示更多|Показать больше
close|Close|बंद करें|Cerrar|Fermer|إغلاق|Fechar|关闭|Закрыть
contact|Contact|संपर्क|Contacto|Contact|التواصل|Contato|联系我们|Контакты
signedIn|Signed in|साइन इन हो गया|Sesión iniciada|Connecté|تم تسجيل الدخول|Sessão iniciada|已登录|Вход выполнен
signIn|Sign in with ChatGPT|ChatGPT से साइन इन करें|Iniciar sesión con ChatGPT|Se connecter avec ChatGPT|سجّل الدخول باستخدام ChatGPT|Entrar com o ChatGPT|使用 ChatGPT 登录|Войти через ChatGPT
signOut|Sign out|साइन आउट करें|Cerrar sesión|Se déconnecter|تسجيل الخروج|Sair|退出登录|Выйти
`;


// Submission and review workflows.
const submissions = `
startSubmission|Start a submission|प्रविष्टि शुरू करें|Iniciar un envío|Commencer un dépôt|ابدأ إرسالًا جديدًا|Iniciar um envio|开始提交|Создать заявку
submissionIntro|Choose the type of record you would like to share.|जिस प्रकार की प्रविष्टि साझा करना चाहते हैं, उसे चुनें।|Elige el tipo de registro que quieres compartir.|Choisissez le type de notice à partager.|اختر نوع السجل الذي تريد مشاركته.|Escolha o tipo de registro que deseja compartilhar.|选择要分享的记录类型。|Выберите тип записи, которой хотите поделиться.
eventForm|Event listing|आयोजन की प्रविष्टि|Anuncio de evento|Annonce d’événement|إعلان فعالية|Divulgação de evento|活动登记|Анонс мероприятия
eventSubmitHeading|{event} Submit|{event} जमा करें|Enviar {event}|Soumettre {event}|إرسال {event}|Enviar {event}|提交{event}|Отправить {event}
eventSubmitCard|Event Submit|आयोजन जमा करें|Enviar evento|Soumettre un événement|إرسال فعالية|Enviar evento|提交活动|Отправить мероприятие
eventBasics|Event details|आयोजन का विवरण|Datos del evento|Détails de l’événement|تفاصيل الفعالية|Dados do evento|活动详情|Сведения о мероприятии
eventSchedule|When and where|कब और कहाँ|Cuándo y dónde|Date et lieu|الزمان والمكان|Quando e onde|时间与地点|Когда и где
eventVerification|Verify the event|आयोजन की पुष्टि|Verificar el evento|Vérifier l’événement|التحقّق من الفعالية|Verificar o evento|核实活动|Подтверждение мероприятия
eventVerificationHelp|Add the official event URL, or provide verification notes or a file.|आयोजन का आधिकारिक लिंक दें, या पुष्टि के लिए टिप्पणी या फ़ाइल जोड़ें।|Añade el enlace oficial del evento, notas de verificación o un archivo.|Ajoutez le lien officiel de l’événement, des notes de vérification ou un fichier.|أضِف رابط الفعالية الرسمي أو ملاحظات التحقّق أو ملفًا.|Adicione o link oficial do evento, notas de verificação ou um arquivo.|请提供活动官方链接、核实说明或文件。|Укажите официальную ссылку на мероприятие либо добавьте пояснения или файл для проверки.
eventVerificationExtras|Add verification notes or files|पुष्टि के लिए टिप्पणी या फ़ाइल जोड़ें|Añadir notas de verificación o archivos|Ajouter des notes de vérification ou des fichiers|إضافة ملاحظات التحقّق أو ملفات|Adicionar notas de verificação ou arquivos|添加核实说明或文件|Добавить пояснения или файлы для проверки
eventMoreDetails|More event details (optional)|आयोजन का अतिरिक्त विवरण (वैकल्पिक)|Más datos del evento (opcional)|Autres détails de l’événement (facultatif)|تفاصيل إضافية عن الفعالية (اختياري)|Mais dados do evento (opcional)|更多活动详情（选填）|Дополнительные сведения о мероприятии (необязательно)
eventPublicationExtras|Translations and DOI (optional)|अनुवाद और DOI (वैकल्पिक)|Traducciones y DOI (opcional)|Traductions et DOI (facultatif)|الترجمات ومعرّف DOI (اختياري)|Traduções e DOI (opcional)|译文和 DOI（选填）|Переводы и DOI (необязательно)
eventTimeZoneHelp|Required if you add a start or end time.|शुरू या समाप्त होने का समय देने पर समय क्षेत्र ज़रूरी है।|Obligatoria si indicas la hora de inicio o de fin.|Obligatoire si vous indiquez une heure de début ou de fin.|مطلوبة عند إدخال وقت بدء أو انتهاء.|Obrigatório se indicar um horário de início ou término.|填写开始或结束时间时必填。|Укажите часовой пояс, если добавили время начала или окончания.
materialsForm|Event materials|आयोजन की सामग्री|Materiales de un evento|Ressources d’un événement|مواد الفعالية|Materiais de evento|活动资料|Материалы мероприятия
thesisForm|Thesis or dissertation|थीसिस या शोधप्रबंध|Tesis o trabajo de posgrado|Thèse ou mémoire|أطروحة أو رسالة جامعية|Tese ou dissertação|学位论文|Диссертация или выпускная работа
draft|Draft|मसौदा|Borrador|Brouillon|مسودة|Rascunho|草稿|Черновик
submitted|Submitted|जमा किया गया|Enviado|Soumis|مُرسل|Enviado|已提交|Отправлено
changes_requested|Changes requested|संशोधन अपेक्षित|Cambios solicitados|Modifications demandées|مطلوب إجراء تعديلات|Alterações solicitadas|待修改|Запрошены исправления
registering|Registering DOI|DOI पंजीकृत हो रहा है|Registrando el DOI|Enregistrement du DOI|جارٍ تسجيل معرّف DOI|Registrando o DOI|正在注册 DOI|Регистрация DOI
doi_failed|DOI action needed|DOI के लिए कार्रवाई आवश्यक|El DOI requiere atención|Action requise pour le DOI|يتطلب معرّف DOI إجراءً|DOI requer atenção|DOI 需要处理|Требуется действие с DOI
rejected|Rejected|अस्वीकृत|Rechazado|Refusé|مرفوض|Rejeitado|已拒绝|Отклонено
published|Published|प्रकाशित|Publicado|Publié|منشور|Publicado|已发布|Опубликовано
withdrawn|Withdrawn|वापस लिया गया|Retirado|Retiré|مسحوب|Retirado|已撤回|Отозвано
saveDraft|Save draft|मसौदा सहेजें|Guardar borrador|Enregistrer le brouillon|حفظ المسودة|Salvar rascunho|保存草稿|Сохранить черновик
preview|Preview|पूर्वावलोकन|Vista previa|Aperçu|معاينة|Prévia|预览|Предпросмотр
sendForReview|Send for review|समीक्षा के लिए भेजें|Enviar a revisión|Soumettre pour examen|إرسال للمراجعة|Enviar para revisão|提交审核|Отправить на проверку
required|Complete the required fields before submitting.|जमा करने से पहले अनिवार्य फ़ील्ड भरें।|Completa los campos obligatorios antes de enviar.|Remplissez les champs obligatoires avant de soumettre votre dépôt.|أكمل الحقول المطلوبة قبل الإرسال.|Preencha os campos obrigatórios antes de enviar.|提交前请填写必填项。|Перед отправкой заполните обязательные поля.
signedOut|Sign in to save drafts and send submissions for review.|मसौदे सहेजने और समीक्षा के लिए भेजने के लिए साइन इन करें।|Inicia sesión para guardar borradores y enviar registros a revisión.|Connectez-vous pour enregistrer vos brouillons et soumettre vos dépôts à examen.|سجّل الدخول لحفظ المسودات وإرسالها للمراجعة.|Entre para salvar rascunhos e enviar registros para revisão.|登录后可保存草稿和提交审核。|Войдите, чтобы сохранять черновики и отправлять заявки на проверку.
saved|Draft saved.|मसौदा सहेज लिया गया।|Borrador guardado.|Brouillon enregistré.|تم حفظ المسودة.|Rascunho salvo.|草稿已保存。|Черновик сохранён.
sent|Submission sent for review.|प्रविष्टि समीक्षा के लिए भेज दी गई।|Envío remitido a revisión.|Dépôt envoyé pour examen.|أُرسل السجل للمراجعة.|Envio encaminhado para revisão.|记录已提交审核。|Заявка отправлена на проверку.
serviceUnavailable|The repository service is unavailable. Try again shortly.|संग्रह की सेवा अभी उपलब्ध नहीं है। थोड़ी देर बाद फिर कोशिश करें।|El servicio del repositorio no está disponible. Inténtalo de nuevo en unos instantes.|Le service de dépôt est indisponible. Réessayez dans un instant.|خدمة المستودع غير متاحة. حاول مرة أخرى بعد قليل.|O serviço do repositório está indisponível. Tente novamente em instantes.|资料库服务暂不可用，请稍后再试。|Репозиторий недоступен. Повторите попытку чуть позже.
noSubmissions|There are no submissions to show.|दिखाने के लिए कोई प्रविष्टि नहीं है।|No hay envíos para mostrar.|Aucun dépôt à afficher.|لا توجد إرسالات لعرضها.|Não há envios para exibir.|暂无提交记录。|Заявок пока нет.
reviewNote|Reviewer note|समीक्षक की टिप्पणी|Nota de revisión|Note de modération|ملاحظة المراجع|Nota da moderação|审核意见|Комментарий модератора
approve|Approve and register DOI|मंज़ूर करें और DOI पंजीकृत करें|Aprobar y registrar el DOI|Approuver et enregistrer le DOI|اعتماد السجل وتسجيل معرّف DOI|Aprovar e registrar o DOI|批准并注册 DOI|Одобрить и зарегистрировать DOI
requestChanges|Request changes|संशोधन माँगें|Solicitar cambios|Demander des modifications|طلب تعديلات|Solicitar alterações|要求修改|Запросить исправления
reject|Reject|अस्वीकार करें|Rechazar|Refuser|رفض|Rejeitar|拒绝|Отклонить
withdraw|Withdraw|वापस लें|Retirar|Retirer|سحب|Retirar|撤回|Отозвать
title|Title|शीर्षक|Título|Titre|العنوان|Título|标题|Название
description|Description or abstract|विवरण या सारांश|Descripción o resumen|Description ou résumé|الوصف أو الملخص|Descrição ou resumo|说明或摘要|Описание или аннотация
keywords|Keywords|मुख्य शब्द|Palabras clave|Mots-clés|الكلمات المفتاحية|Palavras-chave|关键词|Ключевые слова
authors|Authors or contributors|लेखक या योगदानकर्ता|Autores o colaboradores|Auteurs ou contributeurs|المؤلفون أو المساهمون|Autores ou colaboradores|作者或贡献者|Авторы или участники
institution|Organizer or institution|आयोजक या संस्थान|Organizador o institución|Organisateur ou établissement|الجهة المنظمة أو المؤسسة|Organizador ou instituição|组织者或机构|Организатор или учреждение
city|City|शहर|Ciudad|Ville|المدينة|Cidade|城市|Город
venue|Venue|आयोजन स्थल|Lugar de celebración|Lieu de l’événement|مكان انعقاد الفعالية|Local do evento|活动场地|Место проведения
timezone|Event time zone|आयोजन का समय क्षेत्र|Zona horaria del evento|Fuseau horaire de l’événement|المنطقة الزمنية للفعالية|Fuso horário do evento|活动时区|Часовой пояс мероприятия
startDate|Start date|आरंभ तिथि|Fecha de inicio|Date de début|تاريخ البدء|Data de início|开始日期|Дата начала
endDate|End date|समाप्ति तिथि|Fecha de finalización|Date de fin|تاريخ الانتهاء|Data de término|结束日期|Дата окончания
deadline|Submission deadline|प्रस्तुति जमा करने की अंतिम तिथि|Fecha límite de presentación|Date limite de soumission|آخر موعد للتقديم|Prazo para envio|提交截止日期|Срок подачи материалов
callOpens|Submissions open|प्रस्तुतियाँ स्वीकार करने की आरंभ तिथि|Apertura de la convocatoria|Ouverture des soumissions|بدء استقبال المشاركات|Abertura das submissões|开始接受投稿|Начало приёма работ
registrationUrl|Registration URL|पंजीकरण का लिंक|URL de inscripción|Lien d’inscription|رابط التسجيل|URL de inscrição|报名链接|Ссылка для регистрации
sourceUrl|Official or external source URL|आधिकारिक या बाहरी स्रोत का लिंक|URL de la fuente oficial o externa|Lien vers la source officielle ou externe|رابط المصدر الرسمي أو الخارجي|URL da fonte oficial ou externa|官方或外部来源链接|Ссылка на официальный или внешний источник
relatedId|Related event|संबंधित आयोजन|Evento relacionado|Événement associé|الفعالية المرتبطة|Evento relacionado|关联活动|Связанное мероприятие
relatedHelp|Enter the permanent record URL or ID. If the event is missing, submit an event listing first.|प्रविष्टि का स्थायी लिंक या आईडी दर्ज करें। यदि आयोजन सूची में नहीं है, तो पहले उसकी प्रविष्टि जमा करें।|Introduce la URL permanente o el identificador del registro. Si falta el evento, envía primero un anuncio.|Saisissez le lien permanent ou l’identifiant de la notice. Si l’événement est absent, soumettez d’abord une annonce.|أدخل الرابط الدائم للسجل أو معرّفه. إذا لم تجد الفعالية، أرسل إعلانها أولًا.|Insira a URL permanente ou o ID do registro. Se o evento estiver ausente, envie primeiro um anúncio.|请输入记录的永久链接或 ID。如果活动尚未收录，请先提交活动记录。|Введите постоянную ссылку или идентификатор записи. Если мероприятия ещё нет в каталоге, сначала добавьте его.
degree|Exact degree name|उपाधि का पूरा नाम|Nombre exacto del título académico|Intitulé exact du diplôme|الاسم الرسمي للدرجة العلمية|Nome exato do título acadêmico|学位正式名称|Точное название степени
year|Award or publication year|उपाधि या प्रकाशन का वर्ष|Año de titulación o publicación|Année d’obtention du diplôme ou de publication|سنة منح الدرجة أو النشر|Ano de titulação ou publicação|学位授予或出版年份|Год присуждения степени или публикации
yearOrReleaseDate|Enter the year or the publication date.|वर्ष या प्रकाशन की तारीख भरें।|Indica el año o la fecha de publicación.|Indiquez l’année ou la date de publication.|أدخل السنة أو تاريخ النشر.|Informe o ano ou a data de publicação.|请输入年份或出版日期。|Укажите год или дату публикации.
degreeDepartment|Department or school|विभाग या संकाय|Departamento o facultad|Département ou école|القسم أو الكلية|Departamento ou faculdade|院系|Кафедра или факультет
supervisors|Supervisors|शोध निर्देशक|Directores de tesis|Direction de recherche|المشرفون الأكاديميون|Orientadores|导师|Научные руководители
publicContact|Public contact|सार्वजनिक संपर्क|Contacto público|Contact public|معلومات التواصل العامة|Contato público|公开联系信息|Открытые контактные данные
authority|I have permission to submit this record and any attached files.|मुझे यह प्रविष्टि और इसके साथ जुड़ी सभी फ़ाइलें जमा करने की अनुमति है।|Tengo permiso para enviar este registro y todos los archivos adjuntos.|J’ai l’autorisation de déposer cette notice et les fichiers joints.|لدي إذن بإرسال هذا السجل وأي ملفات مرفقة به.|Tenho permissão para enviar este registro e todos os arquivos anexados.|我有权提交此记录及其所有附件。|У меня есть разрешение разместить эту запись и все прикреплённые файлы.
access|Access conditions|पहुँच की शर्तें|Condiciones de acceso|Conditions d’accès|شروط الوصول|Condições de acesso|访问条件|Условия доступа
open|Open access|खुली पहुँच|Acceso abierto|Accès ouvert|وصول مفتوح|Acesso aberto|开放获取|Открытый доступ
embargoed|Embargoed|निर्धारित तिथि तक प्रतिबंधित|Sujeto a embargo|Sous embargo|محجوب مؤقتًا|Sob embargo|限期封存|Доступ временно закрыт
external|External source|बाहरी स्रोत|Fuente externa|Source externe|مصدر خارجي|Fonte externa|外部来源|Внешний источник
license|Rights or reuse terms|अधिकार या पुनः उपयोग की शर्तें|Derechos o condiciones de reutilización|Droits ou conditions de réutilisation|الحقوق أو شروط إعادة الاستخدام|Direitos ou condições de reutilização|权利或再利用条款|Права или условия повторного использования
embargoUntil|Embargo release date|प्रतिबंध हटने की तिथि|Fecha de fin del embargo|Date de fin de l’embargo|تاريخ رفع الحجب|Data de término do embargo|解封日期|Дата открытия доступа
doi|Existing DOI|मौजूदा DOI|DOI existente|DOI existant|معرّف DOI الحالي|DOI existente|已有 DOI|Существующий DOI
doiPolicy|A verified DOI is required for every published event and independent research deposit. For records without a DOI, you can request DOI registration for a fee.|हर प्रकाशित आयोजन और स्वतंत्र शोध प्रविष्टि के लिए सत्यापित DOI अनिवार्य है। जिन प्रविष्टियों का DOI पहले से नहीं है, उनके लिए शुल्क देकर DOI पंजीकरण का अनुरोध किया जा सकता है।|Cada evento publicado y cada depósito de investigación independiente requieren un DOI verificado. Para los registros sin DOI, puedes solicitar el registro de un DOI mediante el pago de una tarifa.|Chaque événement publié et chaque dépôt de recherche indépendant doit avoir un DOI vérifié. Pour une notice sans DOI, vous pouvez demander l’enregistrement d’un DOI moyennant des frais.|يلزم معرّف DOI موثّق لكل فعالية منشورة ولكل عمل بحثي مستقل مُودع. يمكنك طلب تسجيل معرّف DOI للسجلات التي لا تحمل هذا المعرّف مقابل رسوم.|Cada evento publicado e cada depósito de pesquisa independente exige um DOI verificado. Para registros sem DOI, você pode solicitar o registro de um DOI mediante o pagamento de uma taxa.|发布的每项活动和每份独立研究成果都必须具有经核验的 DOI。尚无 DOI 的记录可申请付费注册 DOI。|Для каждого опубликованного мероприятия и каждой самостоятельной научной работы требуется проверенный DOI. Для записи без DOI можно запросить платную регистрацию DOI.
attachments|Files|फ़ाइलें|Archivos|Fichiers|الملفات|Arquivos|文件|Файлы
upload|Upload files|फ़ाइलें अपलोड करें|Subir archivos|Téléverser des fichiers|رفع الملفات|Enviar arquivos|上传文件|Загрузить файлы
attachmentHint|Attach the brochure, programme, or an authorized research file.|ब्रोशर, कार्यक्रम-सूची या अधिकृत शोध फ़ाइल संलग्न करें।|Adjunta el folleto, el programa o un archivo de investigación autorizado.|Joignez la brochure, le programme ou un fichier de recherche autorisé.|أرفق الكتيّب أو البرنامج أو ملفًا بحثيًا مأذونًا بنشره.|Anexe o folheto, o programa ou um arquivo de pesquisa autorizado.|请附上宣传册、活动日程或经授权的研究文件。|Прикрепите брошюру, программу или исследовательский файл, разрешённый к размещению.
uploadSignIn|Sign in before uploading files.|फ़ाइलें अपलोड करने से पहले साइन इन करें।|Inicia sesión para subir archivos.|Connectez-vous pour téléverser des fichiers.|سجّل الدخول قبل رفع الملفات.|Entre para enviar arquivos.|请登录后上传文件。|Войдите, чтобы загрузить файлы.
uploadInProgress|Uploading files…|फ़ाइलें अपलोड हो रही हैं…|Subiendo archivos…|Téléversement des fichiers…|جارٍ رفع الملفات…|Enviando arquivos…|正在上传文件…|Загрузка файлов…
attachmentLimit|Attach up to 10 files per submission.|हर प्रविष्टि में अधिकतम 10 फ़ाइलें जोड़ें।|Adjunta hasta 10 archivos por envío.|Joignez jusqu’à 10 fichiers par dépôt.|أرفق ما لا يزيد على 10 ملفات لكل إرسال.|Anexe até 10 arquivos por envio.|每次提交最多可附加 10 个文件。|К одной заявке можно приложить до 10 файлов.
original|Original metadata|मूल मेटाडेटा|Metadatos originales|Métadonnées d’origine|البيانات الوصفية الأصلية|Metadados originais|原始元数据|Исходные метаданные
searchableDetails|Searchable details|खोज में इस्तेमाल होने वाली जानकारी|Datos de búsqueda|Informations de recherche|بيانات البحث|Dados para busca|用于检索的信息|Данные для поиска
translations|Translated metadata|अनूदित मेटाडेटा|Metadatos traducidos|Métadonnées traduites|البيانات الوصفية المترجمة|Metadados traduzidos|翻译版元数据|Перевод метаданных
translatedTitle|Translated title|अनूदित शीर्षक|Título traducido|Titre traduit|العنوان المترجم|Título traduzido|译文标题|Перевод названия
translatedDescription|Translated description or abstract|अनूदित विवरण या सारांश|Descripción o resumen traducidos|Description ou résumé traduit|الوصف أو الملخص المترجم|Descrição ou resumo traduzido|译文说明或摘要|Перевод описания или аннотации
translatedKeywords|Translated keywords|अनूदित मुख्य शब्द|Palabras clave traducidas|Mots-clés traduits|الكلمات المفتاحية المترجمة|Palavras-chave traduzidas|译文关键词|Перевод ключевых слов
translationStatus|Translation status|अनुवाद की स्थिति|Estado de la traducción|Statut de la traduction|حالة الترجمة|Status da tradução|翻译状态|Статус перевода
authorTranslation|Author-provided translation|लेखक द्वारा दिया गया अनुवाद|Traducción aportada por el autor|Traduction fournie par l’auteur|ترجمة قدّمها المؤلف|Tradução fornecida pelo autor|作者提供的翻译|Перевод предоставлен автором
editorTranslation|Editor-reviewed translation|संपादक द्वारा समीक्षित अनुवाद|Traducción revisada por el editor|Traduction vérifiée par la rédaction|ترجمة راجعها المحرر|Tradução revisada pela equipe editorial|经编辑审核的翻译|Перевод проверен редактором
machineTranslation|Machine translation|मशीनी अनुवाद|Traducción automática|Traduction automatique|ترجمة آلية|Tradução automática|机器翻译|Машинный перевод
addTranslation|Add translation|अनुवाद जोड़ें|Añadir traducción|Ajouter une traduction|إضافة ترجمة|Adicionar tradução|添加翻译|Добавить перевод
translationLanguageRequired|Choose a language for this translation.|इस अनुवाद की भाषा चुनें।|Elige un idioma para esta traducción.|Choisissez la langue de cette traduction.|اختر لغة لهذه الترجمة.|Escolha um idioma para esta tradução.|请选择此译文的语言。|Выберите язык этого перевода.
translationLanguageInvalid|Enter a valid language tag, such as fr or pt-BR.|fr या pt-BR जैसा मान्य भाषा टैग लिखें।|Introduce una etiqueta de idioma válida, como fr o pt-BR.|Saisissez une balise de langue valide, comme fr ou pt-BR.|أدخل وسم لغة صالحًا مثل fr أو pt-BR.|Insira uma etiqueta de idioma válida, como fr ou pt-BR.|请输入有效的语言标签，例如 fr 或 pt-BR。|Введите действительный тег языка, например fr или pt-BR.
translationLanguageOriginal|Choose a language different from the original metadata language.|मूल मेटाडेटा की भाषा से अलग भाषा चुनें।|Elige un idioma distinto al de los metadatos originales.|Choisissez une langue différente de celle des métadonnées d’origine.|اختر لغة مختلفة عن لغة البيانات الوصفية الأصلية.|Escolha um idioma diferente do idioma dos metadados originais.|请选择与原始元数据不同的语言。|Выберите язык, отличный от языка исходных метаданных.
translationLanguageDuplicate|Use a different language for each translation.|हर अनुवाद के लिए अलग भाषा चुनें।|Usa un idioma diferente para cada traducción.|Utilisez une langue différente pour chaque traduction.|استخدم لغة مختلفة لكل ترجمة.|Use um idioma diferente para cada tradução.|每份译文须使用不同的语言。|Для каждого перевода выберите отдельный язык.
remove|Remove|हटाएँ|Quitar|Supprimer|إزالة|Remover|移除|Удалить
`;


// Public records, related materials, and catalog navigation.
const records = `
related|Related records|संबंधित प्रविष्टियाँ|Registros relacionados|Notices associées|سجلات ذات صلة|Registros relacionados|相关记录|Связанные записи
files|Available files|उपलब्ध फ़ाइलें|Archivos disponibles|Fichiers disponibles|الملفات المتاحة|Arquivos disponíveis|可用文件|Доступные файлы
citation|Citation|संदर्भ|Cita|Citation|الاستشهاد المرجعي|Citação|引用|Библиографическая ссылка
copyCitation|Copy citation|संदर्भ कॉपी करें|Copiar cita|Copier la citation|نسخ الاستشهاد|Copiar citação|复制引用|Скопировать ссылку для цитирования
copied|Citation copied.|संदर्भ कॉपी कर लिया गया।|Cita copiada.|Citation copiée.|تم نسخ الاستشهاد.|Citação copiada.|已复制引用。|Ссылка для цитирования скопирована.
recordMissing|This record could not be found.|यह प्रविष्टि नहीं मिली।|No se encontró este registro.|Cette notice est introuvable.|تعذّر العثور على هذا السجل.|Não foi possível encontrar este registro.|未找到此记录。|Эта запись не найдена.
noInstitutions|There are no matching institutions.|कोई मेल खाता संस्थान नहीं मिला।|No hay instituciones que coincidan.|Aucun établissement ne correspond.|لا توجد مؤسسات مطابقة.|Nenhuma instituição correspondente foi encontrada.|没有符合条件的机构。|Подходящие организации не найдены.
aboutText|Global Conference & Research Repository connects academic events with the research they produce and preserves theses and dissertations. Reading, searching, and contributing are free.|वैश्विक सम्मेलन एवं शोध भंडार अकादमिक आयोजनों को उनके शोध कार्यों से जोड़ता है और थीसिस व शोधप्रबंध सुरक्षित रखता है। पढ़ना, खोजना और योगदान करना निःशुल्क है।|El Repositorio Global de Congresos e Investigación vincula los eventos académicos con las investigaciones que generan y conserva tesis y trabajos de posgrado. La lectura, la búsqueda y las aportaciones son gratuitas.|Le Répertoire mondial des conférences et de la recherche relie les événements scientifiques aux travaux qu’ils produisent et conserve les thèses et mémoires. La consultation, la recherche et le dépôt sont gratuits.|يربط المستودع العالمي للمؤتمرات والأبحاث الفعاليات الأكاديمية بالأبحاث الناتجة عنها ويحفظ الأطروحات والرسائل الجامعية. القراءة والبحث والمساهمة مجانية.|O Repositório Global de Conferências e Pesquisa conecta eventos acadêmicos às pesquisas que produzem e preserva teses e dissertações. A leitura, a busca e o envio são gratuitos.|全球学术会议与研究资料库将学术活动与其研究成果关联起来，并保存学位论文。阅读、搜索和提交均免费。|Глобальный репозиторий конференций и исследований объединяет сведения о научных мероприятиях с представленными на них работами и хранит диссертации. Чтение, поиск и размещение бесплатны.
examplesEmpty|No published records yet. Enable examples to explore the repository.|अभी कोई प्रविष्टि प्रकाशित नहीं हुई है। संग्रह देखने के लिए उदाहरण दिखाएँ।|Aún no hay registros publicados. Activa los ejemplos para explorar el repositorio.|Aucune notice n’a encore été publiée. Affichez les exemples pour explorer le dépôt.|لا توجد سجلات منشورة بعد. اعرض الأمثلة لاستكشاف المستودع.|Ainda não há registros publicados. Ative os exemplos para explorar o repositório.|暂无已发布记录。可显示示例以了解资料库。|Опубликованных записей пока нет. Включите примеры, чтобы познакомиться с репозиторием.
showExamples|Show example records|उदाहरण प्रविष्टियाँ दिखाएँ|Mostrar registros de ejemplo|Afficher les notices d’exemple|عرض السجلات التوضيحية|Mostrar registros de exemplo|显示示例记录|Показать примеры записей
hideExamples|Hide example records|उदाहरण प्रविष्टियाँ छिपाएँ|Ocultar registros de ejemplo|Masquer les notices d’exemple|إخفاء السجلات التوضيحية|Ocultar registros de exemplo|隐藏示例记录|Скрыть примеры записей
cancelled|Cancelled|रद्द|Cancelado|Annulé|ملغاة|Cancelado|已取消|Отменено
postponed|Postponed|स्थगित|Aplazado|Reporté|مؤجلة|Adiado|已延期|Перенесено
held|Held|आयोजित|Realizado|Terminé|أُقيمت|Realizado|已举办|Состоялось
scheduled|Scheduled|निर्धारित|Programado|Programmé|مجدولة|Agendado|已排期|Запланировано
eventStatus|Event status|आयोजन की स्थिति|Estado del evento|Statut de l’événement|حالة الفعالية|Status do evento|活动状态|Статус мероприятия
choose|Choose an option|एक विकल्प चुनें|Elige una opción|Choisissez une option|اختر أحد الخيارات|Escolha uma opção|请选择|Выберите вариант
otherChoice|Other|अन्य|Otro|Autre|أخرى|Outra|其他|Другое
specifyOther|Specify another value|अन्य मान लिखें|Especifica otro valor|Précisez une autre valeur|حدّد قيمة أخرى|Informe outro valor|填写其他值|Укажите другое значение
addEventLanguage|Add another event language|आयोजन की एक और भाषा जोड़ें|Añadir otro idioma del evento|Ajouter une autre langue de l’événement|أضف لغة أخرى للفعالية|Adicionar outro idioma do evento|添加另一种活动语言|Добавить другой язык мероприятия
feeFree|Free|निःशुल्क|Gratuito|Gratuit|مجاني|Gratuito|免费|Бесплатно
feePaid|Paid|सशुल्क|De pago|Payant|مدفوع|Pago|收费|Платно
notAnnounced|Not announced|अभी घोषित नहीं|Sin anunciar|Non annoncé|لم يُعلن بعد|Não anunciado|尚未公布|Не объявлено
roleOrganizer|Organizer|आयोजक|Organizador|Organisateur|المنظّم|Organizador|主办方|Организатор
roleAuthor|Author|लेखक|Autor|Auteur|المؤلف|Autor|作者|Автор
roleEditor|Editor|संपादक|Editor|Éditeur|المحرّر|Editor|编辑|Редактор
rolePresenter|Presenter|प्रस्तुतकर्ता|Ponente|Intervenant|المقدّم|Apresentador|报告人|Докладчик
roleSupervisor|Supervisor|मार्गदर्शक|Director de tesis|Directeur de recherche|المشرف|Orientador|导师|Научный руководитель
roleContributor|Contributor|योगदानकर्ता|Colaborador|Contributeur|المساهم|Colaborador|贡献者|Участник
academicInProgress|In progress|प्रगति पर|En curso|En cours|قيد العمل|Em andamento|进行中|В процессе
academicApproved|Approved|स्वीकृत|Aprobado|Approuvé|مُعتمد|Aprovado|已批准|Одобрено
academicAwarded|Degree awarded|उपाधि प्रदान की गई|Título concedido|Diplôme délivré|مُنحت الدرجة|Diploma concedido|已授予学位|Степень присуждена
rightsReserved|All rights reserved|सर्वाधिकार सुरक्षित|Todos los derechos reservados|Tous droits réservés|جميع الحقوق محفوظة|Todos os direitos reservados|保留所有权利|Все права защищены
relatedOther|Event ID or URL|आयोजन की आईडी या लिंक|ID o URL del evento|Identifiant ou lien de l’événement|معرّف الفعالية أو رابطها|ID ou URL do evento|活动编号或链接|Идентификатор или ссылка мероприятия
noRelated|No related records yet.|अभी कोई संबंधित प्रविष्टि नहीं है।|Aún no hay registros relacionados.|Aucune notice associée pour le moment.|لا توجد سجلات ذات صلة بعد.|Ainda não há registros relacionados.|暂无相关记录。|Связанных записей пока нет.
browseRecords|Browse records|प्रविष्टियाँ देखें|Explorar registros|Parcourir les notices|تصفّح السجلات|Explorar registros|浏览记录|Просмотреть записи
materialsHelp|Deposit proceedings, papers, presentations, or other outputs from an academic event.|किसी अकादमिक आयोजन की सम्मेलन कार्यवाही, शोधपत्र, प्रस्तुतियाँ या अन्य सामग्री जमा करें।|Deposita actas, ponencias, presentaciones u otros resultados de un evento académico.|Déposez des actes, articles, présentations ou autres productions issues d’un événement scientifique.|أودع وقائع المؤتمرات أو الأوراق البحثية أو العروض التقديمية أو غيرها من مخرجات فعالية أكاديمية.|Deposite anais, artigos, apresentações ou outros resultados de um evento acadêmico.|存档学术活动的论文集、论文、演示文稿或其他成果。|Разместите сборник, статьи, презентации или другие материалы научного мероприятия.
eventHelp|List a conference, seminar, symposium, workshop, or webinar.|सम्मेलन, संगोष्ठी, परिसंवाद, कार्यशाला या वेबिनार की प्रविष्टि जोड़ें।|Anuncia un congreso, seminario, simposio, taller o seminario web.|Annoncez un congrès, un séminaire, un symposium, un atelier ou un webinaire.|أضف مؤتمرًا أو حلقة دراسية أو ندوة أو ورشة عمل أو ندوة عبر الإنترنت.|Divulgue um congresso, seminário, simpósio, oficina ou webinário.|登记学术会议、讲座、专题研讨会、工作坊或网络研讨会。|Добавьте конференцию, семинар, симпозиум, практикум или вебинар.
thesisHelp|Deposit a doctoral thesis, master’s thesis, or postgraduate dissertation.|डॉक्टरेट शोधप्रबंध, स्नातकोत्तर थीसिस या स्नातकोत्तर शोधप्रबंध जमा करें।|Deposita una tesis doctoral, una tesis de maestría o un trabajo de posgrado.|Déposez une thèse de doctorat, un mémoire de master ou un autre mémoire de troisième cycle.|أودع أطروحة دكتوراه أو رسالة ماجستير أو بحث دراسات عليا.|Deposite uma tese de doutorado, uma dissertação de mestrado ou um trabalho de pós-graduação.|存档博士论文、硕士论文或其他研究生毕业论文。|Разместите докторскую или магистерскую диссертацию либо выпускную работу по программе послевузовского образования.
noFiles|No public files available.|कोई सार्वजनिक फ़ाइल उपलब्ध नहीं है।|No hay archivos públicos disponibles.|Aucun fichier public disponible.|لا توجد ملفات عامة متاحة.|Nenhum arquivo público disponível.|暂无公开文件。|Общедоступных файлов нет.
noDoi|DOI pending|DOI लंबित है|DOI pendiente|DOI en attente|معرّف DOI قيد الانتظار|DOI pendente|DOI 待分配|Ожидается DOI
signInError|Sign in again to continue.|जारी रखने के लिए दोबारा साइन इन करें।|Vuelve a iniciar sesión para continuar.|Reconnectez-vous pour continuer.|سجّل الدخول مرة أخرى للمتابعة.|Entre novamente para continuar.|请重新登录后继续。|Войдите снова, чтобы продолжить.
unknownError|Could not complete the request.|अनुरोध पूरा नहीं हो सका।|No se pudo completar la solicitud.|La demande n’a pas pu être traitée.|تعذّر إتمام الطلب.|Não foi possível concluir a solicitação.|未能完成请求。|Не удалось выполнить запрос.
name|Name|नाम|Nombre|Nom|الاسم|Nome|名称|Имя
sampleContent|The example material on this website is illustrative.|इस वेबसाइट की उदाहरण सामग्री केवल समझाने के लिए है।|El material de ejemplo de este sitio web es ilustrativo.|Le contenu d’exemple de ce site est fourni à titre d’illustration.|المواد المعروضة كمثال في هذا الموقع توضيحية.|O material de exemplo deste site é ilustrativo.|本网站的示例材料仅用于演示。|Примеры на этом сайте приведены для иллюстрации.
primarySubject|Primary subject|मुख्य विषय|Disciplina principal|Discipline principale|التخصص الرئيسي|Área principal|主学科|Основная дисциплина
additionalSubjects|Additional subjects|अतिरिक्त विषय|Disciplinas adicionales|Disciplines complémentaires|تخصصات إضافية|Áreas adicionais|其他学科|Дополнительные дисциплины
subjectDivision|Division|विषय विभाग|División|Division|القسم|Divisão|学科大类|Раздел
addSubject|Add subject|विषय जोड़ें|Añadir disciplina|Ajouter une discipline|إضافة تخصص|Adicionar área|添加学科|Добавить дисциплину
delivery|Delivery|आयोजन का प्रारूप|Modalidad|Modalité|نمط الانعقاد|Modalidade|举办形式|Формат
example|Example|उदाहरण|Ejemplo|Exemple|مثال|Exemplo|示例|Пример
edit|Edit submission|प्रविष्टि संपादित करें|Editar envío|Modifier le dépôt|تعديل الإرسال|Editar envio|编辑提交记录|Редактировать заявку
next|Next|आगे|Siguiente|Suivant|التالي|Próximo|下一步|Далее
previous|Previous|पीछे|Anterior|Précédent|السابق|Anterior|上一步|Назад
examples|Examples|उदाहरण|Ejemplos|Exemples|أمثلة|Exemplos|示例|Примеры
date|Date|तिथि|Fecha|Date|التاريخ|Data|日期|Дата
topic|Subject|विषय|Disciplina|Discipline|التخصص|Área|学科|Дисциплина
countries|Countries & dialing codes|देश और अंतरराष्ट्रीय डायलिंग कोड|Países y prefijos telefónicos|Pays et indicatifs téléphoniques|البلدان ورموز الاتصال الدولية|Países e códigos de discagem|国家和国际电话区号|Страны и телефонные коды
dialingCode|Dialing code|अंतरराष्ट्रीय डायलिंग कोड|Prefijo telefónico|Indicatif téléphonique|رمز الاتصال الدولي|Código de discagem|国际电话区号|Телефонный код
dialingSearch|Search by country name, ISO code, or dialing code|देश का नाम, ISO कोड या अंतरराष्ट्रीय डायलिंग कोड खोजें|Busca por nombre del país, código ISO o prefijo telefónico|Rechercher par nom de pays, code ISO ou indicatif téléphonique|ابحث باسم البلد أو رمز ISO أو رمز الاتصال الدولي|Pesquise por nome do país, código ISO ou código de discagem|按国家名称、ISO 代码或国际电话区号搜索|Поиск по названию страны, коду ISO или телефонному коду
dialingHelp|Browse records by country or territory. Countries can share a dialing code.|देश या क्षेत्र के अनुसार प्रविष्टियाँ देखें। कई देशों का अंतरराष्ट्रीय डायलिंग कोड एक हो सकता है।|Explora los registros por país o territorio. Varios países pueden compartir un prefijo telefónico.|Parcourez les notices par pays ou territoire. Plusieurs pays peuvent partager un indicatif téléphonique.|تصفّح السجلات حسب البلد أو الإقليم. قد تشترك عدة بلدان في رمز اتصال واحد.|Explore os registros por país ou território. Vários países podem compartilhar um código de discagem.|按国家或地区浏览记录。多个国家可能共用一个国际电话区号。|Просматривайте записи по стране или территории. У нескольких стран может быть общий телефонный код.
anyCountry|Choose a country or territory|देश या क्षेत्र चुनें|Elige un país o territorio|Choisissez un pays ou un territoire|اختر بلدًا أو إقليمًا|Escolha um país ou território|请选择国家或地区|Выберите страну или территорию
reviewRequired|Translation needs review|अनुवाद की समीक्षा आवश्यक है|La traducción requiere revisión|La traduction doit être vérifiée|الترجمة بحاجة إلى مراجعة|A tradução precisa de revisão|译文需要审核|Перевод требует проверки
publication_pending|Publication pending|प्रकाशन लंबित है|Publicación pendiente|Publication en attente|بانتظار النشر|Publicação pendente|待发布|Ожидается публикация
`;


// Additional submission details and localized validation.
const details = `
startTime|Start time|आरंभ का समय|Hora de inicio|Heure de début|وقت البدء|Horário de início|开始时间|Время начала
endTime|End time|समाप्ति का समय|Hora de finalización|Heure de fin|وقت الانتهاء|Horário de término|结束时间|Время окончания
eventExtraLanguages|Additional event languages (language tags)|आयोजन की अन्य भाषाएँ (भाषा टैग)|Otros idiomas del evento (etiquetas de idioma)|Autres langues de l’événement (étiquettes de langue)|لغات إضافية للفعالية (وسوم اللغة)|Idiomas adicionais do evento (etiquetas de idioma)|其他活动语言（语言标签）|Дополнительные языки мероприятия (языковые теги)
languageTag|Language code|भाषा कोड|Código de idioma|Code de langue|رمز اللغة|Código do idioma|语言代码|Код языка
programme|Programme|कार्यक्रम-सूची|Programa|Programme|البرنامج|Programação|活动日程|Программа
speakers|Speakers|वक्ता|Ponentes|Intervenants|المتحدثون|Palestrantes|主讲人|Докладчики
programmeUrl|Programme URL|कार्यक्रम-सूची का लिंक|URL del programa|Lien du programme|رابط البرنامج|URL da programação|活动日程链接|Ссылка на программу
paperDeadline|Paper deadline|शोधपत्र जमा करने की अंतिम तिथि|Fecha límite para enviar artículos|Date limite de soumission des articles|آخر موعد لتقديم الأوراق البحثية|Prazo para envio de artigos|论文提交截止日期|Срок подачи статей
registrationDeadline|Registration deadline|पंजीकरण की अंतिम तिथि|Fecha límite de inscripción|Date limite d’inscription|آخر موعد للتسجيل|Prazo para inscrição|报名截止日期|Срок регистрации
attendanceFee|Attendance fee|भागीदारी शुल्क|Cuota de asistencia|Frais de participation|رسوم المشاركة|Taxa de participação|参会费用|Плата за участие
contributorRole|Contributor role|योगदानकर्ता की भूमिका|Función del colaborador|Rôle du contributeur|دور المساهم|Função do colaborador|贡献者角色|Роль участника
verificationNotes|Information moderators can use to verify the event|आयोजन के सत्यापन में समीक्षकों की सहायता करने वाली जानकारी|Información que ayuda al equipo de moderación a verificar el evento|Informations utiles à l’équipe de modération pour vérifier l’événement|معلومات تساعد المشرفين في التحقق من الفعالية|Informações que ajudam a equipe de moderação a verificar o evento|供审核人员核实活动的信息|Сведения для проверки мероприятия модераторами
releaseDate|Publication or release date|प्रकाशन या जारी होने की तिथि|Fecha de publicación o difusión|Date de publication ou de diffusion|تاريخ النشر أو الإصدار|Data de publicação ou divulgação|出版或发布日期|Дата публикации или выпуска
publisher|Publisher|प्रकाशक|Editor|Éditeur|الناشر|Editora|出版方|Издатель
rightsHolder|Rights holder|अधिकार धारक|Titular de los derechos|Titulaire des droits|صاحب الحقوق|Titular dos direitos|权利人|Правообладатель
academicStatus|Academic status|शैक्षणिक स्थिति|Estado académico|Statut académique|الحالة الأكاديمية|Situação acadêmica|学位论文审批状态|Академический статус
translationOf|Record ID of original work|मूल कृति की प्रविष्टि आईडी|Identificador del registro de la obra original|Identifiant de la notice du travail original|معرّف سجل العمل الأصلي|ID do registro do trabalho original|原始作品的记录 ID|Идентификатор записи оригинальной работы
relatedEventTitle|Proposed event title|प्रस्तावित आयोजन का शीर्षक|Título del evento propuesto|Titre de l’événement proposé|عنوان الفعالية المقترحة|Título do evento proposto|拟添加活动的标题|Название предлагаемого мероприятия
updateEventStatus|Update event status|आयोजन की स्थिति बदलें|Actualizar el estado del evento|Mettre à jour le statut de l’événement|تحديث حالة الفعالية|Atualizar o status do evento|更新活动状态|Обновить статус мероприятия
noAccess|Moderator access is required.|इसके लिए समीक्षक की पहुँच आवश्यक है।|Se requiere acceso de moderación.|Les droits de modération sont requis.|يلزم الحصول على صلاحية الإشراف.|É necessário ter acesso de moderação.|需要审核权限。|Необходимы права модератора.
invalidDates|Check the order of the dates or times.|तिथियों या समय का क्रम जाँचें।|Comprueba el orden de las fechas u horas.|Vérifiez l’ordre des dates ou des heures.|تحقق من ترتيب التواريخ أو الأوقات.|Verifique a ordem das datas ou horários.|请检查起止日期或时间的顺序。|Проверьте порядок дат или времени.
invalidDoi|Enter a valid DOI.|मान्य DOI दर्ज करें।|Introduce un DOI válido.|Saisissez un DOI valide.|أدخل معرّف DOI صالحًا.|Insira um DOI válido.|请输入有效的 DOI。|Введите действительный DOI.
retryDoi|Retry DOI registration|DOI फिर से पंजीकृत करें|Reintentar el registro del DOI|Relancer l’enregistrement du DOI|إعادة محاولة تسجيل معرّف DOI|Tentar registrar o DOI novamente|重试 DOI 注册|Повторить регистрацию DOI
smallFile|Choose a supported file up to 20 MB.|20 MB तक की समर्थित फ़ाइल चुनें।|Elige un archivo compatible de hasta 20 MB.|Choisissez un fichier pris en charge de 20 Mo au maximum.|اختر ملفًا مدعومًا لا يتجاوز حجمه 20 ميغابايت.|Escolha um arquivo compatível de até 20 MB.|请选择受支持的文件，大小不超过 20 MB。|Выберите файл поддерживаемого формата размером до 20 МБ.
top|Back to top|ऊपर जाएँ|Volver arriba|Haut de page|العودة إلى أعلى الصفحة|Voltar ao topo|返回顶部|Наверх
organizerListing|Organizer listing|आयोजक की सूचना|Anuncio del organizador|Annonce de l’organisateur|إعلان المنظّم|Anúncio do organizador|主办方发布|Объявление организатора
organizerDirectory|Events from official organizer calendars. Check the organizer’s page for the latest dates and registration.|आधिकारिक आयोजक कैलेंडर से लिए गए आयोजन। नवीनतम तिथियों और पंजीकरण के लिए आयोजक का पृष्ठ देखें।|Eventos de calendarios oficiales. Consulta la página del organizador para ver las fechas y la inscripción actualizadas.|Événements issus des calendriers officiels. Consultez le site de l’organisateur pour les dates et les inscriptions à jour.|فعاليات من التقويمات الرسمية للمنظّمين. راجع صفحة المنظّم للاطّلاع على أحدث المواعيد والتسجيل.|Eventos de calendários oficiais. Consulte a página do organizador para ver datas e inscrições atualizadas.|这些活动来自主办方的官方日历。请查看主办方页面了解最新日期和报名信息。|Мероприятия из официальных календарей. Актуальные даты и регистрация доступны на сайте организатора.
organizerPage|Official organizer page|आयोजक का आधिकारिक पृष्ठ|Página oficial del organizador|Page officielle de l’organisateur|الصفحة الرسمية للمنظّم|Página oficial do organizador|主办方官方页面|Официальная страница организатора
`;

const translations = [general, submissions, records, details].flatMap((section) =>
  section.trim().split("\n").map((entry) => entry.split("|")),
);

const department = translations.find(([key]) => key === "degreeDepartment");
translations.push(["department", ...department.slice(1)]);

export const messages = Object.fromEntries(
  Object.keys(locales).map((language, index) => [
    language,
    Object.fromEntries(translations.map(([key, ...values]) => [key, values[index]])),
  ]),
);

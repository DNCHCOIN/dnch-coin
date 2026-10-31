
(()=>{'use strict';
const data={
parts:{
title:['Намери точната част. Разбери какво купуваш.','Find the right part. Know what you are buying.'],
lead:['Пълният магазин за авточасти трябва да съчетава каталог, информация за съвместимост, сервизни категории и прозрачни условия. TORQUE // PARTS е демонстрация: без реални наличности, VIN база или плащания.','An effective auto-parts store combines catalogue navigation, fitment information and clear shopping terms. TORQUE // PARTS is illustrative: no live stock, VIN database or payments.'],
gallery:['От сервиза до пътя.','From the workshop to the road.'],
services:[
['Каталог по автомобил','Vehicle finder','Марка, модел, година, двигател и параметри — реална версия изисква лицензирана база за съвместимост.','Search by make, model, year and engine; a real version needs verified fitment data.'],
['Проверка по VIN','VIN assisted inquiry','Форма за заявка и ръчна проверка на номер на рама преди изпълнение.','Vehicle identification enquiry with manual fitment verification.'],
['Масла и консумативи','Fluids and service kits','Филтри, масла, ремъци, антифриз и регулярни сервизни комплекти.','Filters, oils, belts, coolant and routine service bundles.'],
['Спирачки и ходова част','Brakes and suspension','Дискове, накладки, шарнири, амортисьори и компоненти на окачването.','Discs, pads, bushings, shocks and suspension components.'],
['Електрика и осветление','Electrics and lighting','Акумулатори, стартери, алтернатори, датчици и автомобилно осветление.','Batteries, starters, alternators, sensors and automotive lighting.'],
['Поръчка за автосервизи','Workshop B2B accounts','Примерна зона за сервизи с пакетни заявки, история и индивидуални условия.','Trade accounts with bulk enquiries, order history and account terms.'],
['Доставка и рекламации','Delivery and returns','Предвидими методи за доставка, политика за връщане и контакт за рекламации.','Shipping options, clear returns policies and complaint support.'],
['Редки и специални части','Hard-to-find components','Форма за нестандартен артикул с каталожен номер и снимка.','Special part enquiries with part numbers and reference images.']
],
faq:[
['Работи ли проверката по VIN?','Does VIN lookup work?','Не. Това е представяне на възможна функция; реална проверка изисква проверени каталожни данни.','No. It is a concept feature and requires reliable data sources.'],
['Реални ли са цените?','Are these live prices?','Не, продуктите, цените и количката са примерни.','No. Products, pricing and basket are illustrative.'],
['Може ли да има отстъпки за сервизи?','Can workshops get trade discounts?','Да, при реален проект могат да се добавят фирмени профили и персонални цени.','A real implementation can support business accounts and negotiated prices.'],
['Как става връщането?','How do returns work?','За работещ магазин трябва ясна политика за връщане и обслужване.','A live store needs a published returns and complaint policy.']
],
steps:[['Избери','Search'],['Провери','Verify'],['Заяви','Enquire'],['Получавай информация','Stay informed']],
photos:['photo-1486262715619-67b85e0b08d3','photo-1487754180451-c456f719a1fc','photo-1530046339160-ce3e530c7d2f','photo-1493238792000-8113da705763','photo-1517524206127-48bbd363f3d7','photo-1503376780353-7e6692767b70'],
captions:['Работилница','Диагностика','Техника','Автомобили','Поддръжка','На пътя'],
cta:['Търсиш магазин за авточасти с реален каталог?','Need a parts store with a real catalogue?']},
factory:{
title:['Производство с ясни технологии и технически възможности.','Manufacturing built around clear specifications.'],
lead:['IRONFORM е демонстрационна корпоративна платформа за индустриално производство. Представя технологии, материали, процес за технически заявки и примерна калкулация, без да описва реална фабрика.','IRONFORM is a fictional industrial company website: technologies, materials, RFQ workflow and a sample calculator. It does not describe a real factory.'],
gallery:['От чертеж до детайл.','From drawing to finished part.'],
services:[
['Лазерно рязане на лист','Sheet laser cutting','Детайли по DXF и DWG с технически преглед на чертежите.','Fabrication from DXF/DWG drawings with engineering review.'],
['Рязане на тръби и профили','Tube and profile cutting','Отвори, срезове и геометрия по модел.','Cuts, slots and geometry from technical models.'],
['Абкант и огъване','Press brake forming','Разгъвки, програми за огъване и контрол на размери.','Flat patterns, forming programmes and dimensional checks.'],
['Заваряване','Welding and assembly','Метални възли и сглобяеми конструкции по чертеж.','Fabricated assemblies and welded structures.'],
['Прахово боядисване','Powder coating','Повърхностни обработки, цветове и защитни покрития.','Finishes, colours and protective coatings.'],
['Прототипиране','Prototyping','Пробни детайли и мостри преди серийно производство.','Samples and test parts prior to series production.'],
['Малки и големи серии','Batch manufacturing','Планиране на партиди, ревизии и повторяемост.','Batch planning, revision control and repeatability.'],
['Контрол и логистика','Quality and logistics','Проверка спрямо чертеж, опаковка и експедиция.','Drawing-based checks, packing and dispatch.']
],
faq:[
['Мога ли да изпратя STEP или DXF?','Can I submit CAD files?','Реална версия може да има защитена форма за технически файлове; демото не приема такива.','A real version could provide a secure engineering upload; this demo cannot.'],
['Калкулаторът реална цена ли е?','Is the estimate binding?','Не. Сметката не отчита всички материали, операции, технологични отпадъци и срокове.','No. It excludes many real production inputs and processes.'],
['Има ли сертификати за качество?','Are certifications shown?','Не твърдим сертификация на измислената фирма. Документи се публикуват само след проверка.','No certification is claimed for this fictional business.'],
['Подходящо ли е за международни клиенти?','Can it serve international customers?','Да, възможни са многоезични страници, международни RFQ форми и каталози.','A real site could support multilingual pages and international RFQs.']
],
steps:[['Чертеж','Drawing'],['Технически преглед','Engineering'],['Изработка','Fabrication'],['Контрол','Quality check']],
photos:['photo-1581092921461-eab62e97a780','photo-1581092160562-40aa08e78837','photo-1565043666747-69f6646db940','photo-1581091226825-a6a2a5aee158','photo-1504917595217-d4dc5ebe6122','photo-1532094349884-543bc11b234d'],
captions:['Машини','Технологии','Производство','Инженеринг','Конструкции','Контрол'],
cta:['Нужен ти е фирмен сайт с технически каталог?','Need a manufacturer website with technical depth?']},
aitech:{
title:['AI иновации, които започват от реален проблем.','AI innovation starts with a real business problem.'],
lead:['NEXA AI представя сценарии за автоматизация на документи, имейли и вътрешни процеси. Симулацията не е свързана с работещ AI модел и не гарантира резултати.','NEXA AI explores automation of documents, email and internal work. The demonstration is not connected to a live AI model and guarantees no results.'],
gallery:['Технология с практическа цел.','Technology with a practical purpose.'],
services:[
['Чат асистенти','Conversational assistants','Отговори на чести въпроси с възможност за човешка намеса.','Routine answers with escalation to a human.'],
['Имейл автоматизация','Email workflow automation','Класифициране на писма, приоритети и чернови за отговор.','Categorise messages, prioritise and draft replies.'],
['Обработка на документи','Document extraction','PDF файлове, фактури и оферти със структурирано извличане.','Extract structured data from PDFs, invoices and quotations.'],
['Вътрешна база знания','Internal knowledge search','Търсене в правила и процедури с контрол на правата.','Search internal documents with access controls.'],
['Автоматични оферти','Proposal drafting','Подготовка на проектни чернови от фирмени параметри.','Draft proposals from company-specific parameters.'],
['Анализ на данни','Business analytics','Обобщения на показатели с проследяване на грешки.','KPI summaries with error monitoring.'],
['Workflow оркестрация','Workflow orchestration','Стъпки, условия и одобрения с лог на действията.','Multi-step workflows with approvals and logs.'],
['Сигурност и надзор','Security and oversight','Права за достъп, човешки преглед и политики за данните.','Permissions, human review and data controls.']
],
faq:[
['Има ли работещ AI зад сайта?','Does the demo include a live AI model?','Не. Показани са интерфейс, сценарии и формулен симулатор.','No. The demo includes a UI and mathematical simulation only.'],
['Как се защитават документи?','How is sensitive data protected?','Реално внедряване изисква оценка на риска, права на достъп и правила за съхранение.','A real project needs access controls and data governance.'],
['Можем ли да изчислим спестеното време?','Can savings be calculated?','Симулаторът е ориентировъчен; реалният ефект се установява след тестване.','The calculator is illustrative; real impact requires testing.'],
['Може ли човек да одобрява решенията?','Can a person approve decisions?','Да, това е важен елемент на системи с контрол върху действията.','Yes, human review is essential for consequential actions.']
],
steps:[['Анализ','Discover'],['Прототип','Prototype'],['Проверка','Review'],['Внедряване','Deploy']],
photos:['photo-1677442136019-21780ecad995','photo-1518770660439-4636190af475','photo-1535223289827-42f1e9919769','photo-1451187580459-43490279c0fa','photo-1519389950473-47ba0277781c','photo-1551434678-e076c223a692'],
captions:['AI концепция','Изчисления','Дигитализация','Свързаност','Екип','Процеси'],
cta:['Искаш да автоматизираш конкретна задача?','Need to automate a real workflow?']},
trade:{
title:['Търговия, която организира продуктите и улеснява поръчките.','Commerce that organises products and simplifies orders.'],
lead:['MERCATO представя структура за B2B и B2C търговия: категории, промоции, заявки, логистика и интеграция със складова система. Всички цени и наличности са примерни.','MERCATO is a B2B/B2C commerce concept with categories, promotions, enquiries and potential inventory integrations. All stock and prices are examples.'],
gallery:['От витрината до доставката.','From storefront to fulfilment.'],
services:[
['Каталог по категории','Category catalogue','Филтри, характеристики, варианти и свързани продукти.','Filters, variants and comparable product information.'],
['Продажби на едро','Wholesale trading','Индивидуални условия, минимални количества и B2B акаунти.','Custom pricing, order minimums and trade accounts.'],
['Промоционални пакети','Product bundles','Пакети от продукти и сезонни предложения.','Curated offers and seasonal bundles.'],
['Складова интеграция','Stock integration','В реален проект — синхронизация с ERP и складови системи.','Live ERP/inventory links in a production build.'],
['Заявки за снабдяване','Sourcing requests','Запитвания за продукти извън основния каталог.','Enquiries for items not currently listed.'],
['Дистрибуция','Distribution','Региони на обслужване и условия за доставка.','Service areas and delivery terms.'],
['Разплащания','Checkout options','Модели за плащане след съобразяване с бизнес и законови изисквания.','Payment workflows aligned with real business requirements.'],
['Партньорска поддръжка','Partner support','Статуси на заявки и история на търговската кореспонденция.','Order statuses and customer communication history.']
],
faq:[
['Количката изпраща ли реална поръчка?','Does the basket place orders?','Не. Демото показва само примерни стойности и категории.','No. The basket demonstrates product selection only.'],
['Може ли да се добави складова наличност?','Can stock data be connected?','Да, с подходяща ERP или складова интеграция.','Yes, with the right inventory system integration.'],
['Поддържат ли се фирмени цени?','Can B2B pricing be supported?','При реален проект могат да се зададат права и ценови нива.','A live project can offer account-specific price lists.'],
['Може ли сайтът да продава международно?','Can it support overseas sales?','Трябва предварително да се уточнят данъци, доставки и търговски условия.','Tax, delivery and legal terms must first be addressed.']
],
steps:[['Разгледай','Browse'],['Избери','Select'],['Потвърди','Confirm'],['Проследи','Track']],
photos:['photo-1556742049-0cfed4f6a45d','photo-1472851294608-062f824d29cc','photo-1556740738-b6a63e27c4df','photo-1542838132-92c53300491e','photo-1578575437130-527eed3abbec','photo-1566576912321-d58ddd7a6088'],
captions:['Магазин','Избор','Обслужване','Каталог','Логистика','Стоки'],
cta:['Нужен ти е сайт за търговия и дистрибуция?','Need a modern trading website?']},
supplements:{
title:['Информацията на етикета е също толкова важна, колкото дизайнът.','A trustworthy label matters as much as a great design.'],
lead:['PULSE LAB е концептуален каталог за хранителни добавки. Реалният магазин трябва да показва проверени съставки, алергени, инструкции от производителя и приложими законови предупреждения. Тук няма медицински съвети и лечебни обещания.','PULSE LAB demonstrates a sports nutrition catalogue. A real shop needs verified ingredients, allergens, manufacturer directions and legally required warnings. No medical claims or advice are offered here.'],
gallery:['Спорт, движение, баланс.','Movement, nutrition, balance.'],
services:[
['Подробни етикети','Detailed product labels','Състав, размер на опаковката и производител при проверени данни.','Verified ingredients, pack size and manufacturer details.'],
['Информация за алергени','Allergen information','Отделно представяне на важните предупреждения.','Prominent relevant warnings and precautions.'],
['Протеинови продукти','Protein products','Категории и сравнение на продуктови характеристики.','Product categories and transparent comparisons.'],
['Витамини и минерали','Vitamins and minerals','Каталог с филтри, без недоказани здравни твърдения.','Filterable ranges without unsubstantiated health claims.'],
['Спортни категории','Sports categories','Подредба по вид продукт и декларирани свойства.','Browse by product type and stated specifications.'],
['Сравнение на артикули','Product comparisons','Сравняване на цена, грамаж и състав от етикет.','Compare price, package size and verified labels.'],
['Помощ при избор','Shopping information','Информация за продукти, но не и персонални дозировки.','Product facts without personalised dosage advice.'],
['Доставка и връщане','Shipping and returns','Ясни условия за реална онлайн търговия.','Clear commercial terms in a real store.']
],
faq:[
['Препоръчва ли се дозировка?','Are dosages recommended?','Не. За реален продукт се следват указанията от етикета и квалифицирана консултация при нужда.','No. Follow verified product directions and seek professional guidance if needed.'],
['Реални ли са продуктовите данни?','Are product details verified?','Не. Това са демонстрационни продукти и примери.','No. All products are sample entries.'],
['Гарантира ли се ефект?','Are results guaranteed?','Не. Няма лечебни или недоказани здравни твърдения.','No. There are no therapeutic or unsupported health claims.'],
['Може ли да се добавят истински етикети?','Can real labels be added?','Да, след проверка на производителя и приложимите изисквания.','Yes, using verified manufacturer data and compliant disclosures.']
],
steps:[['Категория','Category'],['Етикет','Read label'],['Сравнение','Compare'],['Информиран избор','Decide']],
photos:['photo-1517836357463-d25dfeac3438','photo-1534438327276-14e5300c3a48','photo-1571019613454-1cb2f99b2d8b','photo-1518611012118-696072aa579a','photo-1545205597-3d9d02c29597','photo-1490645935967-10de6ba17061'],
captions:['Тренировка','Зала','Спорт','Активност','Баланс','Хранене'],
cta:['Искаш сериозен продуктов сайт с прозрачни данни?','Need a responsible supplement product website?']},
pets:{
title:['За повече щастливи опашки и любопитни муцунки.','For happy tails and curious little faces.'],
lead:['PAW & CO. е примерен магазин за кучета и котки с категории, избор на аксесоари, информация за размери, материали и удобство. Не се приемат реални поръчки.','PAW & CO. is a fictional dog and cat shop concept featuring accessories, sizing information and easy product browsing. No real orders are accepted.'],
gallery:['Всеки любимец има свой характер.','Every pet has a personality.'],
services:[
['Играчки и занимания','Toys and enrichment','Категории по тип занимание, размер и предназначение.','Browse toys by play style, size and purpose.'],
['Поводи и разходки','Walks and accessories','Нагръдници, поводи и комплекти за навън.','Harnesses, leads and outdoor kits.'],
['Легла и комфорт','Beds and comfort','Размери, материи и инструкции за поддръжка.','Dimensions, fabrics and care information.'],
['Котешки принадлежности','Cat essentials','Драскалки, играчки и удобни кътчета за почивка.','Scratchers, toys and relaxing spaces.'],
['Купички и хранене','Feeding accessories','Сравнение на материали, обеми и лесно почистване.','Compare materials, sizes and cleanability.'],
['Грижа и хигиена','Grooming essentials','Четки, пособия и аксесоари за ежедневна грижа.','Brushes and everyday grooming accessories.'],
['Подаръчни комплекти','Pet gift bundles','Примерни подаръци за осиновяване, рожден ден или празник.','Sample gifts for new pets and special days.'],
['Таблици с размери','Size guides','Подбор по размери, без да се замества ветеринарен съвет.','Helpful dimensions without replacing veterinary advice.']
],
faq:[
['Може ли да се избере размер?','Can I choose by size?','Реален магазин може да съдържа таблици и филтри за размери.','A real store could support size filters and fitting guides.'],
['Запазвате ли името на любимеца?','Is the pet name saved?','Не, в демото се показва само на екрана.','No. It is shown only in the current browser view.'],
['Може ли да се направи поръчка?','Can I place an order?','Не. Количката не обработва реални покупки.','No. The basket is illustrative only.'],
['Давате ли медицински съвети?','Do you offer veterinary advice?','Не. При здравословни въпроси се обърни към ветеринарен лекар.','No. Health questions belong with a veterinarian.']
],
steps:[['Вид любимец','Pet type'],['Размер','Size'],['Избор','Select'],['Грижа','Care']],
photos:['photo-1517849845537-4d257902454a','photo-1514888286974-6c03e2ca1dba','photo-1583337130417-3346a1be7dee','photo-1543466835-00a7907e9de1','photo-1533738363-b7f9aef128ce','photo-1548199973-03cce0bbc87b'],
captions:['Куче','Котка','Игра','Разходка','Любопитство','Заедно'],
cta:['Готов ли си за магазин за домашни любимци?','Ready to build a memorable pet store?']}
};
const root=document.querySelector('[data-more-site]');if(!root)return;const key=root.getAttribute('data-more-site'),d=data[key];if(!d)return;const bg=document.documentElement.lang==='bg',i=bg?0:1;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const services=d.services.map((x,j)=>'<article class="more-service"><span class="more-service-index">'+String(j+1).padStart(2,'0')+' / '+key.toUpperCase()+'</span><h3>'+esc(x[i])+'</h3><p>'+esc(x[2+i])+'</p></article>').join('');
const captions=d.photos.map((p,j)=>'<figure class="more-photo"><img src="https://images.unsplash.com/'+p+'?auto=format&fit=crop&w=900&q=78" alt="'+esc(d.captions[j])+'" loading="lazy" decoding="async"><figcaption>'+esc(d.captions[j])+'</figcaption></figure>').join('');
const faqs=d.faq.map(f=>'<details><summary>'+esc(f[i])+'</summary><p>'+esc(f[2+i])+'</p></details>').join('');
const steps=d.steps.map((s,j)=>'<article class="more-step"><b>0'+(j+1)+'</b><h3>'+esc(s[i])+'</h3><p>'+esc(bg?'Примерна стъпка от клиентския процес.':'A step in the illustrative customer journey.')+'</p></article>').join('');
const label=(b,e)=>bg?b:e;
root.innerHTML='<section class="more-intro"><div class="more-wrap more-intro-inner"><div><span class="more-overline">'+label('ИНДУСТРИАЛНО ПОРТФОЛИО / ДЕМО','INDUSTRY PORTFOLIO / DEMO')+'</span><h2 class="more-title">'+esc(d.title[i])+'</h2><p class="more-lead">'+esc(d.lead[i])+'</p></div><div class="more-stats"><div class="more-stat"><b>08</b><span>'+label('Допълнителни направления','Additional capabilities')+'</span></div><div class="more-stat"><b>06</b><span>'+label('Тематични фотографии','Themed photographs')+'</span></div></div></div></section>'+
'<section class="more-section" id="more-services"><div class="more-wrap"><div class="more-head"><div><span class="more-overline">'+label('РАЗШИРЕНИ УСЛУГИ','ADDITIONAL CAPABILITIES')+'</span><h2 class="more-title">'+label('Повече възможности. Повече стойност.','More depth. More value.')+'</h2></div><p class="more-description">'+label('Осем допълнителни направления, които могат да бъдат реализирани при пълна разработка на продукта.','Eight possible capabilities for a production version.')+'</p></div><div class="more-services">'+services+'</div></div></section>'+
'<section class="more-section more-gallery-band" id="more-gallery"><div class="more-wrap"><div class="more-head"><div><span class="more-overline">'+label('ТЕМАТИЧНА ГАЛЕРИЯ','THEMED PHOTO GALLERY')+'</span><h2 class="more-title">'+esc(d.gallery[i])+'</h2></div><p class="more-description">'+label('Подбрани илюстративни снимки за по-ясна история, усещане за бранда и реална визуална дълбочина.','Illustrative imagery adds depth and industry context to this concept.')+'</p></div><div class="more-gallery">'+captions+'</div><p class="more-gallery-note">'+label('Илюстративни изображения от Unsplash. Не изобразяват реална фирма, нейните клиенти или наличности.','Illustrative Unsplash photos. These do not show an operating company, its customers or actual inventory.')+'</p></div></section>'+
'<section class="more-section" id="more-process"><div class="more-wrap"><div class="more-head"><div><span class="more-overline">'+label('ПРОЦЕС','PROCESS')+'</span><h2 class="more-title">'+label('От интерес до решение.','From interest to resolution.')+'</h2></div><p class="more-description">'+label('Примерен процес за завършен продукт, а не реално действаща услуга.','A proposed customer journey rather than an operating service.')+'</p></div><div class="more-steps">'+steps+'</div></div></section>'+
'<section class="more-section more-faq-section" id="more-faq"><div class="more-wrap"><div class="more-head"><div><span class="more-overline">FAQ</span><h2 class="more-title">'+label('Често задавани въпроси','Frequently asked questions')+'</h2></div><p class="more-description">'+label('Какво работи в демонстрацията и какво е необходимо за истински проект.','What works in the demo and what requires a production build.')+'</p></div><div class="more-faq">'+faqs+'</div></div></section>'+
'<section class="more-outro"><div class="more-wrap more-outro-inner"><div><h2>'+esc(d.cta[i])+'</h2><p>'+label('Разгледай портфолиото и подготви запитване към DNCH Studio. Формата генерира текст за изпращане, без автоматично подаване.','Explore the studio portfolio and prepare an enquiry. The form generates text; it does not submit automatically.')+'</p></div><a class="more-cta" href="studio.html#inquiry">'+label('Поискай оферта ↗','Discuss a project ↗')+'</a></div></section>';
})();
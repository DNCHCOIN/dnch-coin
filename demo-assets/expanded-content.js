
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
,
auto:{
title:['Автосервизът не е просто списък от ремонти.','A workshop is more than a list of repairs.'],
lead:['VECTOR AUTO представя технически подход: диагностика, обслужване, ремонт на механични системи и ясна предварителна комуникация. Това е концепция, а не действащ сервиз или записване на час.','VECTOR AUTO demonstrates technical service, diagnostics, mechanical repairs and clear communication. It is a portfolio concept, not an operating workshop or booking system.'],
gallery:['Механика, прецизност и грижа за автомобила.','Mechanics, precision and vehicle care.'],
services:[
['Двигател и диагностика','Engine diagnostics','Диагностични кодове, симптоми и план за техническа проверка.','Fault codes, symptoms and diagnostic work plans.'],
['Турбо и всмукателна система','Turbo and intake','Проверка на въздушни пътища, вакуумни линии и налягане.','Intake, vacuum line and boost-system checks.'],
['Съединител и трансмисия','Clutch and gearbox','Проверка на приплъзване, вибрации и превключване.','Assess slip, vibration and shifting issues.'],
['Спирачна система','Braking system','Накладки, дискове, апарати и проверка на състояние.','Pads, discs, calipers and system checks.'],
['Ходова част','Suspension and steering','Амортисьори, шарнири, втулки и кормилна система.','Dampers, joints, bushings and steering.'],
['Автоклиматик','Air conditioning','Проверка, диагностика, обслужване и течове.','Inspection, diagnosis and maintenance planning.'],
['Гуми и джанти','Tyres and wheels','Смяна, баланс, преглед и проверка на джанти.','Fitting, balancing, inspection and wheel checks.'],
['Обслужване преди път','Pre-trip inspections','Течности, осветление, акумулатор, ремъци и основни проверки.','Fluids, lights, battery, belts and essential checks.']
],
faq:[
['Може ли да се запази реален час?','Can I book a real appointment?','Не. Запитването се копира, но няма свързан работещ автосервиз.','No. The enquiry builder has no operating workshop recipient.'],
['Ориентировъчните времена точни ли са?','Are repair durations accurate?','Не. Те са примерни и не заменят диагностика и реална оценка.','No. Durations are illustrative and not repair estimates.'],
['Може ли да се добави график за сервиза?','Can a service calendar be added?','Да, с управление на свободни часове, екипи и потвърждения.','Yes, with real availability, staff and confirmations.'],
['Може ли да се добави каталог с части?','Can parts be integrated?','Да, при реална база, проверка на съвместимост и условия.','Yes, with fitment checks and product data.']
],
steps:[['Симптоми','Symptoms'],['Диагностика','Diagnosis'],['Оферта','Quote'],['Ремонт','Repair']],
photos:['photo-1486262715619-67b85e0b08d3','photo-1487754180451-c456f719a1fc','photo-1530046339160-ce3e530c7d2f','photo-1493238792000-8113da705763','photo-1517524206127-48bbd363f3d7','photo-1503376780353-7e6692767b70'],
captions:['Работилница','Техник','Диагностика','Автомобил','Поддръжка','Път'],
cta:['Искаш собствен сайт за сервиз?','Need a website for an automotive workshop?']},
logistics:{
title:['Всеки маршрут има срок, товар и реални оперативни условия.','Every route involves cargo, timing and operating constraints.'],
lead:['NORTHLINE LOGISTICS показва как сайт за транспортни услуги може да комбинира запитвания, видове превози, складови операции и примерни изчисления. Не се изпълняват реални превози.','NORTHLINE LOGISTICS demonstrates a transport website with freight enquiries, transport modes, warehousing concepts and sample calculations. No real freight operations are provided.'],
gallery:['Маршрути, товарни единици, логистика.','Routes, freight units and logistics.'],
services:[
['Пълен товар (FTL)','Full truckload','Планиране на превоз с цяло превозно средство и параметри на товара.','Plan dedicated vehicles according to cargo dimensions.'],
['Групаж (LTL)','Groupage freight','Комбинирани пратки, консолидация и междинни терминали.','Consolidation, shared loads and handling points.'],
['Палетни превози','Pallet freight','Стандарти, размери, тегло, линейни метри и товарна пригодност.','Pallet standards, size, weight and loading metres.'],
['Експресен транспорт','Express delivery','Приоритетни заявки и ограничения по срок.','Priority shipments and deadline management.'],
['Складови операции','Warehousing','Приемане, временен престой, комплектоване и експедиция.','Receiving, short-term storage, picking and dispatch.'],
['Дистрибуция до магазини','Retail distribution','Маршрути с няколко спирки и условия за разтоварване.','Multi-stop routes and delivery instructions.'],
['Проследяване','Shipment tracking concept','Статуси и известия в реална система с GPS или TMS интеграция.','Status updates with real GPS or TMS integrations.'],
['Управление на оферти','Quotation management','Събиране на заявки, оценка на разходи и обратна връзка.','Collect shipment details and structure cost proposals.']
],
faq:[
['Калкулаторът реална цена ли дава?','Is the calculator a real freight quote?','Не, това е опростено изчисление без тол такси, ограничения и пазарни тарифи.','No. It excludes tolls, regulations and real market rates.'],
['Работи ли GPS проследяване?','Is live tracking enabled?','Не. Диаграмата и маршрутите са примерни.','No. Route diagrams and statuses are illustrative.'],
['Може ли да се добавят различни товарни единици?','Can cargo dimensions be added?','Да, реална версия може да изчислява палети, линеен метър и обем.','Yes, a real version may support pallets, loading metres and cubic volume.'],
['Може ли да се свърже с TMS?','Can this integrate with a TMS?','Да, при наличен API и договорен достъп.','Yes, subject to API access and integration scope.']
],
steps:[['Заявка','Request'],['Планиране','Planning'],['Товарене','Loading'],['Доставка','Delivery']],
photos:['photo-1586528116311-ad8dd3c8310d','photo-1601584115197-04ecc0da31d7','photo-1565793298595-6ba8971cba21','photo-1494412519320-aa613dfb7738','photo-1578575437130-527eed3abbec','photo-1504307651254-35680f356dfd'],
captions:['Склад','Камион','Логистичен център','Транспорт','Контейнери','Операции'],
cta:['Имаш нужда от транспортен бизнес сайт?','Need a freight and logistics website?']},
bistro:{
title:['Вкусът започва много преди първата хапка.','The experience starts before the first bite.'],
lead:['OLIVE & STONE разширява концепцията с ресторантска история, сезонни предложения, групови събития, менюта за различни поводи и разпознаваема атмосфера. Няма реален ресторант или поръчки.','OLIVE & STONE explores restaurant storytelling, seasonal choices, gatherings, event menus and atmosphere. The brand and orders are fictional.'],
gallery:['Истории около масата.','Stories around the table.'],
services:[
['Закуски и брънч','Breakfast and brunch','Бързи сутрешни предложения и сезонни комбинации.','Morning favourites and seasonal combinations.'],
['Обедни менюта','Lunch menus','Селекции за обедната почивка с ясни цени и алергени.','Lunch selections with clear pricing and allergens.'],
['Вечерно меню','Dinner menu','Предястия, основни ястия, десерти и напитки.','Starters, mains, desserts and drinks.'],
['Сезонни предложения','Seasonal specials','Ротиращи идеи с продуктов акцент и фотография.','Rotating specials and seasonal photography.'],
['Групови събития','Group events','Примерни варианти за малки събития и частни поводи.','Private dining and event concepts.'],
['Поръчки за вземане','Takeaway ordering','Кошница и избор на час при реална интеграция.','Basket and pickup scheduling in a live build.'],
['Алергени и състав','Allergens and ingredients','Ясна продуктова информация за реалните менюта.','Clear ingredient and allergen information.'],
['Дигитално QR меню','Digital QR menu','Мобилно меню с категории, снимки и бързи промени.','Mobile menus with categories and photography.']
],
faq:[
['Ресторантът съществува ли?','Is this a real restaurant?','Не. Това е портфолио концепция и няма физически обект.','No. This is a fictional portfolio concept.'],
['Може ли да се плаща онлайн?','Are online payments available?','Не. Количката е демонстрационна.','No. The basket is a demo.'],
['Може ли да има резервации?','Could reservations be added?','Да, към реална система с график, капацитет и потвърждения.','Yes, with a capacity-aware booking backend.'],
['Как се обновява менюто?','How can a menu be updated?','Чрез административна система, която може да се изгради в пълната версия.','Through a content management system in a complete build.']
],
steps:[['Избери','Explore'],['Добави','Add'],['Прегледай','Review'],['Потвърди','Confirm']],
photos:['photo-1517248135467-4c7edcad34c4','photo-1547592180-85f173990554','photo-1414235077428-338989a2e8c0','photo-1552566626-52f8b828add9','photo-1512621776951-a57141f2eefd','photo-1546069901-ba9599a7e63c'],
captions:['Интериор','Кулинария','Вечеря','Атмосфера','Салата','Сезонно меню'],
cta:['Искаш ресторантски сайт с характер?','Need a restaurant website with personality?']},
beauty:{
title:['Красивото представяне заслужава и удобен клиентски процес.','Thoughtful styling needs an equally thoughtful booking journey.'],
lead:['LUMI BEAUTY е демонстрация на салон с процедури, избор на час, ценови листи и визуални истории за грижа. Резервациите се записват само локално и не отиват в истински салон.','LUMI BEAUTY showcases treatments, appointment selection, sample pricing and editorial beauty imagery. Appointments are local-only and not sent to a salon.'],
gallery:['Красота в малките детайли.','Beauty in the details.'],
services:[
['Маникюр','Manicure','Форма, подготовка, покритие и поддръжка на нокти.','Nail shaping, prep, finish and care.'],
['Педикюр','Pedicure','Козметична грижа за стъпала и нокти.','Cosmetic foot and nail care.'],
['Коса и стилизиране','Hair and styling','Подстригване и стилизация спрямо желаната визия.','Cutting and styling for different looks.'],
['Цвят и тониране','Colour and toning','Консултация за цвят и предварително уточняване на процедура.','Colour consultation and treatment planning.'],
['Вежди и мигли','Brows and lashes','Оформяне и козметична поддръжка.','Brow shaping and cosmetic care.'],
['Грижа за лице','Facial care','Козметични ритуали с ясни описания на услугите.','Skin-focused cosmetic treatments with clear service details.'],
['Подаръчни ваучери','Gift vouchers','Подаръчна концепция със стойност или конкретна процедура.','Gift credits or treatment vouchers.'],
['Пакетни процедури','Treatment packages','Комбиниране на подходящи козметични услуги.','Bundled cosmetic services.']
],
faq:[
['Часът реално ли се записва?','Is an appointment actually booked?','Не. Записът остава в браузъра и няма получател.','No. Appointments are saved in the browser only.'],
['Цените реални ли са?','Are prices genuine?','Не. Това са примерни тарифи за дизайн демонстрация.','No. Pricing is illustrative.'],
['Може ли да има няколко специалисти?','Can staff calendars be added?','Да, с отделни графици и блокирани часове в реална система.','Yes, with staff-specific calendars and availability.'],
['Може ли сайтът да приема ваучери?','Could gift vouchers be sold?','Да, при реален модул за плащания и проследяване на ваучери.','Yes, with a real payment and voucher redemption system.']
],
steps:[['Избери процедура','Choose'],['Час','Time'],['Потвърди','Confirm'],['Посети','Visit']],
photos:['photo-1560066984-138dadb4c035','photo-1604654894610-df63bc536371','photo-1570172619644-dfd03ed5d881','photo-1522335789203-aabd1fc54bc9','photo-1596462502278-27bfdc403348','photo-1515377905703-c4788e51af15'],
captions:['Салон','Маникюр','Грижа за лице','Козметика','Продукти','Релакс'],
cta:['Искаш модерен сайт за салон?','Need a beautiful salon website?']}

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
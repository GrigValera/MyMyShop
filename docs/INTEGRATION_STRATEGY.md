# SHOP-INTEGRATIONS-01 — стратегия интеграций

Исследование и архитектурное решение от 2026-10-17. **CURRENT** — подтверждено работающим кодом; **PROPOSED** — согласованное направление, ещё не реализованное как контракт или конфигурация; **PLANNED** — отдельная будущая работа. Упоминание sandbox, backend или поставщика не означает, что они уже подключены. Текущий запуск описан в [README](../README.md), концептуальные домены — в [DOMAIN_MODEL](DOMAIN_MODEL.md), компактные целевые контракты — в [INTEGRATIONS](INTEGRATIONS.md).

## Решение и граница

**CURRENT:** MyMyShop — React/Vite storefront с самостоятельным demo без credentials и отдельный Fastify/SQLite backend foundation. Локальный снимок товаров и прямое публичное чтение DummyJSON обслуживают каталог; frontend demo-сессия и профиль живут в памяти; корзина хранится в браузере; Checkout Preview не создаёт заказ; Order History и Details читают три фиксированные записи через `orderService → demoOrderAdapter`. Эти записи не связаны с корзиной, покупателем или платёжной транзакцией. Backend хранит только локальные test actor profiles и не подключён к frontend.

**TARGET public demo — PLANNED:** внешний reviewer открывает стабильный публичный URL без credentials и без чтения документации проходит Home/Catalog, Search/Filters, PDP, Cart, Checkout, создание demo/test Order, Orders/Details и session flow. Order действительно сохраняется в изолированном demo/test источнике, а Orders/Details читают ту же запись; UI явно обозначает demo/test state и отсутствие реального списания. Для такого flow допустимы развёрнутый demo backend, mock/test API, test database и детерминированный reset/seed. Позднее можно добавить согласованные demo fulfillment/tracking; reviews/addresses показываются как функции только после реализации. Это целевой критерий, не описание CURRENT.

**PROPOSED:** UI → domain service → demo/test adapter либо MyMyShop API adapter. Внутри backend: application/domain service → provider connector. DTO DummyJSON, PSP, перевозчика и identity provider преобразуются до customer-facing UI. CURRENT demo доступен без backend; TARGET public demo может использовать развёрнутый demo backend. CURRENT foundation создаёт серверную основу перед trusted payment/shipping integration, но ещё не реализует provider connector.

`Order` — сущность MyMyShop и источник Order History. Платёжный поставщик владеет транзакцией, перевозчик — событиями отгрузки; их ID и подтверждённые события привязываются к `Order`, а не заменяют его. `Order`, `Payment` и `Shipment/Fulfillment` имеют разные состояния. Статус платежа или отгрузки нельзя напрямую выдавать за статус заказа.

## CURRENT — focused integration inventory

| Домен и поверхность | Источник, граница, поведение и хранение | Ошибки и препятствие замене |
| --- | --- | --- |
| Products / Catalog / PDP | Локальный снимок; `?source=api` включает прямой RTK Query к DummyJSON; API асинхронен и кэшируется, снимок локален | Страницы выбирают источник и знают форму DTO; нет общего `Product` mapper, семантика локальных/API фильтров различается |
| Auth / Session / Account gate | `sessionService → demoSessionAdapter`; async sign-in, identity только в памяти, reload возвращает anonymous | `RequireSession` не имеет checking/expiry/deep-link return; demo-сессия не авторизует серверные операции |
| Profile / Avatar | `accountService → demoAccountAdapter`; async чтение/изменение, синхронные snapshot/subscribe, только память JS | Есть `unavailable`/validation, но server fetch, invalidation и upload contract отсутствуют |
| Cart / Cart Drawer | Redux + версионированный `localStorage`; синхронные действия, строка содержит снимок товара и цены | Повреждённые записи отбрасываются; сохранение может не удаться; browser price и stock не доверены |
| Checkout | Синхронный `checkoutService → demoCheckoutAdapter`; только позиции, count и subtotal из Cart | Нет quote, адреса, payment, delivery, submit, Order и транзакционных ошибок |
| Orders / Details | Async `orderService → demoOrderAdapter`, фиксированные записи без persistence; `success/error/not-found`, UI loading/retry | Нет создания, пагинации, проверки владельца и разделения payment/fulfillment state в текущем DTO |
| Images / Reviews | URL внешнего CDN + fallback; PDP может читать поле `reviews` DummyJSON | Нет app-owned media/review contract, загрузки или публикации отзывов |
| Router / Localization / Config | React Router, RU/EN JSON, язык в `localStorage`; нет integration env mode или общего HTTP client | Локализация должна получать коды ошибок, а не тексты поставщика; режим сейчас определяется страницей/query |

Кодовая проверка: `src/features/*/api`, `src/features/cart/store`, `src/pages/ProductsPage`, `src/pages/ProductDetailsPage`, `src/pages/CheckoutPage`, `src/pages/AccountPage`, `src/app/App.jsx`. Текущие архитектурные ограничения также описаны в [FRONTEND_ARCHITECTURE](FRONTEND_ARCHITECTURE.md).

| Область | CURRENT / demo | Sandbox candidate | Будущий владелец и подход | Чувствительность |
| --- | --- | --- | --- | --- |
| Products | Снимок / DummyJSON | Не нужен | App Catalog, публичный `list/get Product` | Низкая для публикации |
| Search/Catalog | Local pipeline / DummyJSON | Не нужен | App Catalog, единые query/page semantics | Низкая |
| Auth | Demo identity | Auth0, Clerk, Firebase, Supabase | IdP либо app backend; backend проверяет доступ | Высокая |
| Session | Память | Test identity/session | App backend подтверждает session и expiry | Высокая |
| Profile | In-memory fixture | Test Customer | App Customer | Персональные данные |
| Addresses | Placeholder | Не нужен | App Customer, серверная валидация | Персональные данные |
| Cart | Redux / `localStorage` | Не нужен | Локальное намерение; backend пересчитывает quote | Цена недоверенная |
| Checkout | Preview | Test PSP через backend | App Checkout, quote/submit/status | Высокая |
| Orders | Фиксированные demo-записи | Test backend Orders | App Orders, проверка принадлежности | Высокая |
| Payments | Нет | Stripe test / PayPal Sandbox | App Payment + PSP transaction | Секреты и деньги |
| Shipping | Нет | EasyPost / Shippo test | App Fulfillment + carrier | Ключи и адрес |
| Tracking | Только demo delivery snapshot | Test tracking events | App Fulfillment, нормализованные события | Адрес и события |
| Reviews | Поле внешнего продукта / placeholder | Не нужен | App Reviews, модерация | Пользовательский контент |
| Notifications | Нет бизнес-доставки | Test channel позднее | App Notifications, канал заменяем | Контакты и согласие |
| Images/media | DummyJSON CDN / fallback | Не нужен | App Catalog/Media metadata | Публичные URL; upload защищён |

## PROPOSED — владение и режимы

| Домен | Demo: CURRENT → TARGET | Sandbox: PLANNED | Backend / production-like: PLANNED |
| --- | --- | --- | --- |
| Products/Search | Датированный локальный снимок, optional публичный DummyJSON | Нормализованный test catalog | App Catalog: цена и наличие проверяются сервером |
| Auth/Session | CURRENT identity в памяти → TARGET reviewable demo session flow | Test user через backend | Проверяемая session, expiry/logout |
| Cart | Локальное намерение | Локальное намерение + server quote | App Cart при необходимости синхронизации |
| Checkout/Orders | CURRENT Preview и независимые fixtures → TARGET сохранённый demo/test Order, связанный с Orders/Details | Quote → pending Order → test payment → история | App-owned Order lifecycle |
| Payment | CURRENT нет → TARGET честный demo payment state без реального списания | Test PSP через backend | PSP через backend, сверка и возвраты |
| Shipping/Tracking | CURRENT только обозначенные snapshots → TARGET согласованный demo fulfillment позже | Test rates/shipment/tracker | Подтверждённые Shipment events |
| Account/Addresses | Demo profile / placeholder | Test Customer | App Customer с проверкой доступа |
| Reviews | Данные публичного источника / placeholder | Fixture либо test app data | App Reviews |

**PROPOSED — capability parity:** demo/test adapter и MyMyShop API adapter сохраняют одну domain-facing форму вызова и customer-facing flow; страницы, формы и routing не переписываются при смене источника. Доступность возможностей зависит от реализации. Для CURRENT неподдерживаемого `Checkout.submit(...)` возвращается явное нормализованное `not_available_in_demo` (точное имя кода открыто). TARGET demo adapter вправе создать Order в изолированном demo/test repository, если состояние сохраняется и Orders/Details читают именно его; UI показывает demo/test operation. Это functional demo transaction, а не fake success. Запрещено объявлять оплату/доставку успешной без соответствующего demo/test state или скрыто превращать ошибку provider в успешный fixture. Provider DTO остаются за adapters/connectors, не в UI.

**PROPOSED config:** `VITE_APP_DATA_MODE=demo|sandbox|backend` и, только при отдельном API origin, `VITE_APP_API_BASE_URL`. Сейчас этих переменных в runtime нет. Предлагаемый default для обычного reviewer — demo: CURRENT без API, TARGET при необходимости с развёрнутым demo/test API. Выбор adapters делается в одном composition point; URL страницы не включает транзакционный режим. Для target demo с API и для sandbox/backend допустим заранее настроенный same-origin `/api` либо явный API URL; если нужный API не настроен или mode неизвестен, приложение показывает ошибку конфигурации. Сбой транзакции никогда не переключает её на успешный fixture другого режима. `VITE_*` публичны и попадают в клиентскую сборку: [Vite env guide](https://vite.dev/guide/env-and-mode).

**Frontend-safe:** публичный каталог/media, публичная конфигурация и только явно разрешённый поставщиком publishable key либо ограниченный client token. **Backend-only для доверенных операций:** secret API keys и webhook secrets, проверка session/access, авторитетные цены и создание настоящего Order, capture/refund, проверка подлинности provider callbacks/webhooks, purchase shipping label, операции с персональными данными. Изолированный demo/test Order не выдаётся за доверенную production transaction. Клиентский cart snapshot — входное намерение, не источник коммерческой истины. Подробные действующие ограничения — в [SECURITY_BOUNDARIES](SECURITY_BOUNDARIES.md).

## PROPOSED — сравнение поставщиков

Оценки сложности, переносимости и портфолио-ценности ниже — выводы для MyMyShop, а не обещания поставщиков. При любом выборе app-owned `Order` и контракт UI сохраняются; провайдер меняется внутри серверного connector.

### Payments — test candidates

| Кандидат | Test flow, server/browser и secrets | Events и повторы | Fit, сложность и путь замены |
| --- | --- | --- | --- |
| Stripe | Test keys и серверный PaymentIntent; браузер выполняет только разрешённую часть платёжного UI с publishable key/client secret, выданным для конкретного flow. Secret API key остаётся на backend. [Keys](https://docs.stripe.com/api/authentication), [PaymentIntent](https://docs.stripe.com/api/payment_intents) | Backend проверяет webhook и обновляет связанный Payment; API поддерживает idempotency key для безопасных повторов. [Webhooks](https://docs.stripe.com/events/manage-webhook-endpoints), [idempotency](https://docs.stripe.com/api/idempotent_requests) | Хорош для портфолио-показа `pending payment → confirmed payment`. Требуются backend, платёжный UI, persistent Order/PaymentAttempt и webhook handling. Риски — настройка test account/методов и зависимость платёжного UI от Stripe; при замене адаптируются серверный PaymentConnector и provider-specific UI, app Order остаётся своим |
| PayPal | Sandbox accounts, серверные REST Orders/capture и browser approval/SDK; client ID используется согласно browser flow, client secret и access token остаются на backend. [REST setup](https://developer.paypal.com/api/rest), [Orders API](https://developer.paypal.com/api/rest/integration/orders-api) | Backend обрабатывает проверенные payment webhooks; `PayPal-Request-Id` обеспечивает идемпотентные повторы поддерживаемых операций. [Webhooks](https://developer.paypal.com/payment-methods/webhooks/), [API requests](https://developer.paypal.com/api/make-api-requests/) | Валидная альтернатива для wallet checkout. Добавляются approval/return и capture flow; PayPal Order нужно явно сопоставлять с MyMyShop Order. Заменяется серверный connector, но тесты и платёжный UI провайдера придётся адаптировать |

**Почему Stripe — preferred first TEST candidate:** для предложенной первой vertical slice его серверный PaymentIntent-like flow, test environment, webhook lifecycle и idempotent retries прямо показывают переход `pending_payment → confirmed payment` при сохранении app-owned Order. PayPal предоставляет те же ключевые категории возможностей и остаётся альтернативой. Это не выбор production provider и не зависимость домена Orders от Stripe. Перед implementation обязателен отдельный provider gate: доступность аккаунта и региона, поддерживаемые test flows, условия, требуемая модель browser UI и фактическая сложность интеграции.

### Shipping — test candidates

| Кандидат | Test flow и backend boundary | Events, реализм и ограничения |
| --- | --- | --- |
| EasyPost | Отдельный test API key хранится на backend; test Shipment даёт rates, покупка выбранного Rate создаёт test label/tracker. [Authentication](https://docs.easypost.com/docs/authentication), [Shipments](https://docs.easypost.com/docs/shipments) | Предопределённые tracking codes моделируют статусы и test webhook Events; webhook допускает проверку подлинности. Это полезно для демонстрации переходов, но test rates и canned события не обещают live стоимость или фактическую доставку. [Trackers](https://docs.easypost.com/docs/trackers), [webhooks](https://docs.easypost.com/docs/webhooks) |
| Shippo | Test token хранится на backend; доступны test rates и labels, tracking API. Для test labels может понадобиться test mode carrier account. [Authentication](https://docs.goshippo.com/docs/guides_general/authentication/), [tracking](https://docs.goshippo.com/shippoapi/public-api/tracking-status/gettrack) | Tracking updates могут приходить через webhooks; test/live webhook mode настраивается отдельно. Реалистичны API lifecycle и асинхронные updates, но test rates/labels не равны live обязательствам; проверить carrier setup и нужные test events. [Официальная поддержка Shippo](https://support.goshippo.com/hc/en-us/articles/4404415886491-Get-started-with-the-Shippo-API), [пример Shippo webhook subscriptions](https://github.com/goshippo/shippo-demos-webhooks) |

EasyPost и Shippo остаются кандидатами. Shipping slice следует после app-owned Order: иначе rates, label и tracking не к чему устойчиво привязать в истории покупателя.

### Auth / identity — варианты для будущего gate

| Вариант | Restore, expiry/logout и deep links | Проверка, browser модель и риски | Сложность, зависимость и портфолио-ценность |
| --- | --- | --- | --- |
| App-owned secure cookie session | Backend восстанавливает/завершает session; приложение реализует checking, expiry и возврат к исходному protected route | Backend авторизует каждый чувствительный запрос; `HttpOnly` cookie ограничивает доступ JS, но не устраняет XSS, а cookie-запросы требуют CSRF-защиты. [OWASP](https://community.owasp.org/HttpOnly) | Больше собственной работы, меньше зависимости от IdP; показывает владение серверной границей |
| Auth0 | Hosted identity; SPA restore/refresh требует настройки rotation, callback и logout; deep-link return согласуется с redirect | Backend проверяет session/token и права на Customer/Order; browser token storage и XSS/CSRF зависят от выбранного flow. [Официальная support page](https://support.auth0.com/center/s/article/Why-is-authentication-lost-after-refreshing-my-SPA) | Снижает работу с учётными данными, но добавляет tenant/SDK и зависимость. Текущий источник — support page, не полный architecture guide; на `SHOP-AUTH-SESSION-02` нужны официальные architecture/session docs |
| Clerk | Session tokens и React/Vite integration помогают restore; expiry/logout и возврат к deep link требуют проверки в маршрутах MyMyShop | Backend проверяет токен и авторизацию; publishable key допустим в браузере, secret key — только backend. Cookie/token transport и CSRF/XSS оцениваются для выбранной схемы. [Sessions](https://clerk.com/docs/guides/sessions/session-tokens), [backend verification](https://clerk.com/docs/reference/backend/authenticate-request) | Быстрый UI путь, но SDK/config и зависимость от модели поставщика; портфолио показывает hosted identity + app authorization |
| Firebase Auth | Browser persistence настраивается; restore, expiry/logout и deep-link return синхронизируются с app state | Backend проверяет ID token и права; browser token handling требует XSS-оценки, cookie-вариант — CSRF-оценки. [Persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence), [verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens) | SDK и token lifecycle добавляют работу; hosted identity не заменяет App Customer/Orders |
| Supabase Auth | Access JWT/refresh token поддерживают persistence/refresh; expiry/logout и deep-link return зависят от выбранного client/server flow | Backend проверяет identity и права; browser refresh-token storage влияет на XSS-риск, cookie-схема требует оценки CSRF. [Sessions](https://supabase.com/docs/guides/auth/sessions) | Может ускорить Auth+DB, но усиливает платформенную зависимость; не заменяет payment/order orchestration |

Победитель auth не выбран. Для всех вариантов обязательны checking/restore, expiry, logout, protected deep-link return и backend authorization; окончательное решение — `SHOP-AUTH-SESSION-02`.

### Product / demo data

Локальный снимок и публичный DummyJSON подходят для demo-каталога. DummyJSON write requests лишь имитируются: ни он, ни снимок не являются авторитетным источником цены, наличия, Order или Payment и не заменяют backend. [Официальные docs DummyJSON](https://dummyjson.com/docs/products). Fake Store API не добавляется без конкретного пробела в доменной модели; это вывод для MyMyShop, а не сравнительное утверждение о возможностях Fake Store API.

Выбор зависит от test lifecycle, REST/SDK, webhook, секретов, лимитов, persistence, сложности настройки, переносимости и портфолио-ценности. Тарифы, лимиты, регионы и условия следует повторно проверить на provider gate будущего implementation ticket. Sandbox полезен, когда демонстрирует подтверждаемую транзакцию или переходы состояний, а не просто ещё один внешний JSON.

## PROPOSED — minimal backend и auth gate

**Foundation scope:** перед payment/shipping slice нужен небольшой API с выбранным на implementation gate stack, persistent DB и миграциями, config/server secrets boundary, ограниченным test actor и проверкой доступа, основой application/repository layer, нормализованными ошибками, requestId/logging, детерминированными contract/integration tests и provider-neutral connector boundary. Foundation не обязан завершать quote/submit, PSP integration, production PaymentAttempt lifecycle, рабочий payment webhook или customer-facing payment states. К завершению commerce slice нужны authoritative quote, persistent `Order`/`PaymentAttempt`, submit/status, provider connector, проверка подлинности webhook, idempotency/deduplication и reconciliation. In-memory repository может проверить интерфейс, но не сохранит оплаченный Order после перезапуска. Microservices, CMS, full OMS и распределённая очередь не входят в минимальный scope.

| Stack candidate | Fit и trade-off |
| --- | --- |
| Node + Express | Быстрый и понятный старт; schema validation и error discipline нужно собрать явно. [Routing](https://expressjs.com/en/guide/routing/) |
| Node + Fastify | **Предпочтительный кандидат**, компактный сервер с JSON Schema validation/serialization; не утверждён окончательно. [Schema](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/) |
| NestJS | Модули и TypeScript, но для первой небольшой вертикали больше инфраструктуры. [First steps](https://docs.nestjs.com/first-steps/) |
| Serverless functions | Компактный hosting, но сложнее локально повторить webhooks, transactions и storage lifecycle |
| Supabase capabilities | Быстрый путь к Auth/DB, но платформенная зависимость; server-side payment orchestration всё равно нужна |

Рекомендован один repo для frontend и небольшого API: reviewer сможет видеть контракт, запуск и tests вместе. Отдельный backend repo повышает нагрузку на версионирование и настройку; functions рядом с frontend допустимы при подходящем hosting. Структура repo сейчас не меняется. Окончательный stack, persistence и deployment утверждаются на gate `SHOP-BACKEND-FOUNDATION-01`. Foundation создаёт проверяемую границу доступа и тестового actor; решение о настоящем identity provider остаётся для auth ticket.

Auth остаётся отдельным решением: (A) app-owned secure cookie session с защитой изменяющих запросов; (B) hosted IdP с backend verification. SPA JWT сам по себе не даёт backend authorization. Независимо от варианта нужны `checking/restore`, expiry, logout, возврат к protected deep link и безопасное обращение с credential/token. Финальный выбор — `SHOP-AUTH-SESSION-02`; backend foundation не объявляет поставщика identity выбранным. Ограниченный test actor foundation достаточен для проверки серверной границы, но `SHOP-AUTH-SESSION-02` блокирует завершённый customer-facing commerce slice: Orders/Details должны принадлежать проверенному Customer.

## PROPOSED — commerce flow и ошибки

Cart → backend пересчитывает quote → checkout submit с idempotency key → app-owned `pending_payment` Order и PaymentAttempt → test PSP → проверенный provider webhook/backend confirmation → обновление Payment state → отдельное бизнес-решение об Order state → Order History/Details. Item, amount, currency и delivery snapshots фиксируются Order, чтобы позднее изменение каталога не меняло историю. Redirect браузера не считается подтверждением оплаты. Повтор submit и webhook не создаёт второй Order или повторный эффект; провайдерные idempotency правила проверяются отдельно. [Stripe idempotency](https://docs.stripe.com/api/idempotent_requests) и [webhook retries/signature](https://docs.stripe.com/events/manage-webhook-endpoints) подтверждают необходимость этого слоя.

**PROPOSED — момент создания Order:** после повторной серверной проверки quote и подтверждённого submit сохраняется `pending_payment` Order, затем создаётся/запускается PaymentAttempt. Это даёт устойчивую связь с provider operation при закрытии браузера и позднем webhook. Будущая реализация определит правила для abandoned pending Orders, duplicate submit, delayed webhook и retries, включая idempotency, reconciliation и завершение pending state; полный lifecycle здесь не проектируется.

**PROPOSED — проверка submit:** полученный ранее quote не принимается автоматически. До создания Order или следующего транзакционного шага backend повторно проверяет текущую identity, право этой session/Customer использовать quote, срок его действия, актуальные серверные цены, наличие и допустимость позиций, валюту, допустимость состояния submit и отсутствие уже выполненного либо конфликтующего submit. При истечении quote или изменении данных операция не завершается скрытым успехом: backend возвращает нормализованную доменную/API ошибку (`conflict`, `validation` или `expired_quote` согласно будущему контракту).

**PROPOSED — проверка provider event:** backend проверяет криптографическую подпись либо эквивалентный механизм подлинности поставщика, применимый provider/account context, связь события с известной Payment/Order operation, допустимость перехода состояния и правила повторов/replay/idempotency. Дубликат события не повторяет эффект. Произвольный ID от клиента не позволяет обновить неизвестный Order; browser redirect или client callback не доказывают успешную оплату.

Поздний shipping flow: адрес вводит Customer → backend валидирует и получает rate quote → покупатель выбирает service → backend покупает shipment/label после допустимого Order/Payment state → проверенные tracking events обновляют Shipment. Provider rate и tracking не становятся полями статуса Order без преобразования бизнес-правилами.

| Сбой | Честное поведение UI |
| --- | --- |
| Payment provider недоступен | Не показывать success; сохранить проверяемый pending/failed state и дать безопасный retry/status |
| Shipping quote не получен | Не выдумывать стоимость и срок; предложить повтор, оставить ввод адреса |
| Session expired | Показать вход и затем вернуть к разрешённому deep link |
| Order creation failed | Не начинать оплату и не очищать Cart; показать ошибку и возможность повторить без дубля |

## PROPOSED — test, secrets и reviewer contract

PR baseline будущей реализации: deterministic domain/contract tests, adapter tests с mocks, webhook fixtures и дубликаты событий, demo-mode Playwright, lint/build. Реальные provider sandbox tests, webhook tunnel и проверки доступности — optional/manual/nightly; PR не зависит от сети Stripe/PayPal/EasyPost. Для наблюдаемости достаточно нормализованных provider errors, `requestId/orderId`, неуспешных webhook и видимых retries без ключей и лишних персональных данных.

Локальные server secrets остаются в игнорируемом окружении; GitHub Actions и hosting используют собственные secret stores с разделением test/live и ротацией. В repo допустим только `.env.example` с безопасными placeholders, когда появится backend. Реальные ключи и токены не записываются в код, документацию, fixtures или логи.

**CURRENT reviewer:** `npm install` и `npm run dev` достаточны для просмотра demo без credentials; поддерживаемые версии Node/npm и более строгая проверка через `npm ci` указаны в [README](../README.md). **PLANNED sandbox:** отдельные backend и test credentials, явная инструкция и webhook URL. **PLANNED backend/production-like:** отдельные hosting, HTTPS, secret store и миграции. Demo остаётся доступным при отказе provider только при явном выборе demo mode; текущая sandbox-транзакция не получает скрытой подмены успехом.

**PLANNED public deployment:** стабильный публичный URL — требование для портфолио; reviewer должен проходить ключевые demo/test journeys без credentials и чтения docs. Поставщик размещения ещё не выбран: Vercel, Netlify, Cloudflare Pages и GitHub Pages остаются кандидатами, причём последний подходит только если ограничения static hosting совместимы с выбранным mode. Для persistent demo commerce может потребоваться отдельный backend hosting и test database. Выбор делается на будущем implementation/deployment gate, без утверждения production readiness.

**PLANNED — live provider gate:** backend/production-like environment само по себе не разрешает live PSP или live shipping account, реальные транзакции и не доказывает финансовую готовность. Переход от test provider к live provider требует отдельного release/security decision: проверить хранение live credentials, доступность аккаунта и региона, условия/compliance, production webhook setup, ротацию секретов, наблюдаемость, обработку сбоев и готовность deployment/security. Полный release process определяется вне `SHOP-INTEGRATIONS-01`; live integration пока не реализована и не разрешена.

## Кандидаты vertical slice и последовательность

Это сравнение трёх candidate vertical slices — session, commerce и shipping, а не глобальный рейтинг всех будущих tickets или порядок их запуска. Оценка 1–5, где 5 лучше. Веса: portfolio 15%, архитектура 20%, реализм 15%, простота 10%, безопасность 10%, проверяемость 10%, стабильность 5%, переносимость 5%, малый regression risk 5%, time-to-value 5%. Балл commerce не отменяет backend foundation и auth prerequisites; оценка не прогнозирует сроки.

| Кандидат | Портфолио | Архитектура | Реализм | Простота | Безопасность | Тесты | Стабильность | Переносимость | Малая регрессия | Скорость | Итог / 5 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| A. Session → deep link → Account | 3 | 4 | 4 | 3 | 3 | 4 | 4 | 4 | 3 | 4 | **3.60** |
| B. Checkout → app Order → test payment → Orders | 5 | 5 | 5 | 2 | 2 | 4 | 3 | 3 | 2 | 2 | **3.80** |
| C. Rates → test shipment → tracking | 4 | 3 | 4 | 2 | 2 | 3 | 2 | 3 | 2 | 2 | **2.95** |

**Решение:** B — первая полноценная commerce vertical slice после minimal backend и session gate. Она должна дать один связный domain flow для public demo/test и sandbox provider, позднее — для real backend/provider через тот же UI и contracts. A обеспечивает принадлежность персональных заказов; C следует после устойчивого Order/Payment lifecycle. Foundation остаётся provider-neutral и допускает раздельные demo/test и sandbox/production-like data environments: окончательный test PSP выбирается на provider gate непосредственно перед `SHOP-CHECKOUT-ORDER-PAYMENT-01`. Stripe — preferred first test candidate, но не dependency foundation.

**Core dependency chain:** `SHOP-BACKEND-FOUNDATION-01` → `SHOP-AUTH-SESSION-02` → `SHOP-CHECKOUT-ORDER-PAYMENT-01` → `SHOP-SHIPPING-TRACKING-01`. `SHOP-UX-COPY-PROMISES-01` — независимый truthful-UX hygiene, который можно выполнить быстро при наличии capacity, не задерживая foundation; `SHOP-ACCOUNT-AVATAR-01` — независимый visual fix. Следующий domain/product ticket выбирается только после review commerce и/или shipping slice. Новый architecture-only contract ticket не нужен: [INTEGRATIONS](INTEGRATIONS.md) фиксирует достаточное направление; конкретные схемы/contract tests входят в backend implementation. Для будущего major checkout UI отдельно выполнить UX Product Benchmark Gate. [Baymard order review](https://baymard.com/checkout-usability/benchmark/step-type/order-review) поддерживает проверку и исправление данных до подтверждения, [исследование checkout errors](https://baymard.com/research-articles/current-state-of-checkout-ux) — ясное восстановление после ошибки. Оценить зрелые checkout, desktop/tablet/mobile, keyboard, RU/EN и light/dark до runtime-изменений.

`SHOP-CHECKOUT-ORDER-PAYMENT-01` может потребовать максимум два связанных reviewable increments; решение принимается на его implementation gate без новых ticket IDs сейчас. Первый доводит verified Customer → server quote/validated submit → persistent `pending_payment` Order → Orders/Details до честного unpaid state без success confirmation. Второй добавляет PaymentAttempt, один test PSP, проверенные события, reconciliation и Payment state в тех же Orders/Details. Ни один промежуточный результат не изображает состоявшуюся оплату.

**Риски:** доступность test accounts по региону и условиям, расхождение DummyJSON/cart prices с серверным quote, cookie/CORS/CSRF при раздельном hosting, устойчивое хранение и миграции, публичный webhook URL и повторы, отделение demo Orders от настоящей истории. Эти риски проверяются на отдельных implementation gates, не маскируются текущим demo.

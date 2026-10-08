# MyMyShop — Roadmap

## Target State

MyMyShop должен стать production-oriented e-commerce storefront/reference implementation. UI и domain logic должны быть готовы к реальному backend: явные API contracts, service/repository interfaces и сменные demo/local, mock HTTP и real HTTP adapters позволяют подключить backend без переписывания страниц и компонентов. Cart, checkout, auth, orders, delivery и profile получают backend-ready границы. Приложение должно быть responsive, accessible, resilient, observable, secure и ограничено измеренным performance budget. Публичный GitHub Pages demo остаётся безопасным и самодостаточным; optional reference backend не блокирует завершение frontend.

Цель — production-ready storefront/frontend architecture, а не инфраструктурный клон крупного marketplace или marketplace backend platform. Текущее поведение не объявляется production-ready до выполнения release gates ниже.

Целевые возможности:

- демонстрационный магазин;

- React + Redux Toolkit / RTK Query;

- TypeScript на ключевых domain/API границах;

- безопасный demo-mode через заменяемый adapter;

- рабочий поиск, фильтрация и корзина;

- локальный demo-checkout;

- unit/integration/E2E tests;

- visual regression;

- accessibility и responsive verification;

- CI;

- GitHub Pages deployment;

- README, соответствующий реальному поведению;
- backend-ready contracts, устойчивость, безопасность, наблюдаемость и измеренный performance budget.

Магазин показывает обработку ошибок и качественный UX. Посетитель может найти товар, изменить корзину и создать локальный демонстрационный заказ. Реальные credentials и оплата в публичном demo не запрашиваются. Полноценные интеграции планируются по контрактам, но roadmap не выдаёт их за уже реализованные.

## Основание и порядок работы

Источник: утверждённый пользователем Master Development Plan для MyMyShop и утверждённый Backlog Reconciliation Audit для исходных T-001…T-039. SHOP-00…03 merged в main; остальные этапы остаются планом. Этот roadmap сам по себе не начинает следующий ticket.

Рекомендуемые branch и commit message исходных SHOP-tickets сохранены из плана. Поля «Проблема» для SHOP-90/91/92 и tests для SHOP-90 сформулированы из их целей, изменений и acceptance criteria, поскольку отдельных полей в источнике нет. Это не дополнительные требования.

Каждый ticket начинается только после явного подтверждения пользователя и выполняется по [CODEX_WORKFLOW.md](CODEX_WORKFLOW.md). Зависимости перечислены в каждом ticket.

## Направления и порядок реализации

### SHOP-ARCH-01 — Архитектурная схема системы

Статус: **документация на ручной проверке**. [Архитектурный обзор](docs/ARCHITECTURE.md) фиксирует CURRENT/PLANNED/PROPOSED/OPTIONAL, бизнес-домены и серверную границу интеграций. Эта документация не меняет работу приложения и не закрывает задачи реализации SHOP-ARCH или SHOP-API-CONTRACT. После ручной проверки и отдельного подтверждения commit статус обновляется по факту.

Для следующих отдельных tickets реализации явно учитывать:

| Область | Планируемый объём и текущая граница |
| --- | --- |
| Авторизация | Настоящий интерфейс входа и серверный адаптер сессии — SHOP-08/SHOP-API-CONTRACT; сейчас demo-сессия только в памяти. |
| Аккаунт | Обзор аккаунта, редактирование профиля/аватара, адреса, заказы/детали, отзывы/оценки, недавно просмотренные товары и настройки — отдельные tickets класса B в SHOP-ACCOUNT/CATALOG-POLISH; текущая страница Profile демонстрационная. |
| Торговые операции | Оформление, платежи, доставка/самовывоз, создание и история заказа, детали, отслеживание, отмена и возвраты — отдельные tickets по контрактам, доменам и UI после базовых SHOP-04/05/06; сейчас нет реального заказа или оплаты. |
| Поддержка | Обратная связь, переписка и при необходимости адаптер CRM/helpdesk — SHOP-COMMERCE-CONTENT и отдельный ticket интеграции; текущий ChatBot локальный, контактная форма не отправляет заявку. |
| Платформа/backend | Контракты API, преобразование DTO, серверные адаптеры и интеграции — SHOP-ARCH, SHOP-API-CONTRACT и следующие tickets реализации; конкретные поставщики и устройство системы не утверждены. |

Реальный магазин направляет операции через MyMyShop Backend/Application API, доменную/прикладную границу и адаптер интеграции; frontend не хранит учётные данные backend API CRM/ERP/WMS/PSP. Исключение возможно только для защищённого браузерного сценария конкретного платёжного поставщика при сохранении серверной проверки. Это принцип будущей реализации, а не описание текущих интеграций.

Это группировка roadmap, а не изменение существующих ID или объявление tickets выполненными:

| Направление | Tickets / epics |
| --- | --- |
| Foundation | SHOP-00, SHOP-01, SHOP-02, SHOP-03 |
| Product experience | SHOP-UI-01…07 и SHOP-UI-DEC, SHOP-CATALOG-POLISH, SHOP-COMMERCE-CONTENT |
| Commerce domain | SHOP-04, SHOP-05, SHOP-06, SHOP-08; последующие SHOP-COMMERCE-FLOW и SHOP-ACCOUNT |
| Platform / architecture | SHOP-ARCH, SHOP-API-CONTRACT, SHOP-MOCK-API, SHOP-RESILIENCE, SHOP-PERF, SHOP-OBSERVABILITY, SHOP-SECURITY; SHOP-07 обеспечивает dependency baseline |
| Delivery / release | SHOP-90, SHOP-91, SHOP-92 |
| Optional after frontend completion | SHOP-BACKEND-REF, SHOP-INTEGRATION-TELEGRAM |

### Release classes и milestones

Каждый новый epic/ticket ниже имеет один release class: **A — PRODUCTION V1 BLOCKING** (обязательный минимум), **B — POST-V1 / PRODUCT ENHANCEMENT** (плановое улучшение после v1), **C — OPTIONAL INTEGRATION** (внешняя интеграция без влияния на выпуск frontend). Класс A относится только к явно названному v1 scope; расширенные функции внутри того же направления получают отдельный B PR, а не наследуют блокирующий статус. Существующие tickets SHOP-04…08 сохраняют согласованный scope; продуктовые дополнения не вставляются в них задним числом.

| Milestone | Acceptance для v1 |
| --- | --- |
| M1 — Product/UI Foundation | Завершены SHOP-03 (уже DONE), SHOP-UI-01/02/03/04/06 и core SHOP-CATALOG-POLISH: детерминированный catalog/product behavior, product page, базовые UI primitives, responsive/accessibility foundation. SHOP-UI-DEC/05 и косметический SHOP-UI-07 выполняются после v1, если review не выявит конкретный release blocker. |
| M2 — Backend-ready Commerce Frontend | SHOP-04/05/06, core SHOP-ARCH/API-CONTRACT, SHOP-07/08, SHOP-MOCK-API и core SHOP-COMMERCE-FLOW: типизированные границы, версия хранения, cart, безопасный demo checkout, delivery contract, auth и сменные adapters. M1 и M2 могут перекрываться; commerce/API расширения используют готовые границы. |
| M3 — Production Readiness | SHOP-RESILIENCE, SHOP-PERF baseline/budget, SHOP-SECURITY, минимальный SHOP-OBSERVABILITY, сквозная accessibility проверка, финальные исправления блокирующих UI дефектов, SHOP-90/91/92. После M3 frontend готов к подключению настоящего backend по contract. |

- **A / production v1 blockers:** SHOP-04/05/06/07/08; SHOP-UI-01/02/03/04/06; core SHOP-CATALOG-POLISH и SHOP-COMMERCE-FLOW; core SHOP-ARCH/API-CONTRACT/MOCK-API/RESILIENCE/PERF/SECURITY; Logger/ErrorReporter baseline SHOP-OBSERVABILITY; SHOP-90/91/92. SHOP-00…03 уже DONE и остаются обязательной основой.
- **B / post-v1 product enhancements:** SHOP-ACCOUNT, SHOP-COMMERCE-CONTENT, SHOP-UI-DEC/05/07; autocomplete, recent searches, favorites, recently viewed, comparison, advanced facets/recommendations, расширенные account/delivery/checkout conveniences и analytics event funnels. Эти функции полезны, но не требуются для критических v1 flows; каждая реализуется отдельным PR после проверки фактической ценности.
- **C / optional integrations:** SHOP-BACKEND-REF, SHOP-INTEGRATION-TELEGRAM, внешний AI support adapter, Sentry/analytics vendor adapters и другие non-core integrations. Они не блокируют M3; безопасность их tokens/данных определяется отдельно перед включением.

**Backend-ready acceptance:** подключение backend, соблюдающего SHOP-API-CONTRACT, не требует переписывать pages/components. Допустимы изменения environment/config, конкретных HTTP adapters, DTO mappings в рамках contract и реализация backend endpoints. Недопустимы перенос business logic из pages после релиза, переписывание UI flow или смена store architecture только из-за появления backend. Это проверяется adapter parity в M2 и итоговым audit SHOP-92.

**Production-ready frontend v1 acceptance:** критические browse/search → PDP → cart → demo checkout/confirmation и demo auth flows завершены и покрыты tests; нет известных blocker/critical defects, white screens, случайного business behavior, client credentials/secrets. Loading/error/empty состояния предсказуемы; pricing/discounts детерминированы; backend contracts документированы; responsive и keyboard accessibility baseline пройдены; production bundle в согласованном budget; production build deployable, GitHub Pages demo работает, ограничения документированы. Это означает готовность frontend архитектуры, а не наличие реального backend или production payments.

### Dependency-aware execution order

1. **Foundation DONE:** SHOP-00/01/02/03 уже merged. Сейчас возможны SHOP-UI-01, затем параллельно SHOP-UI-02/03/06; SHOP-04 и независимые core catalog/PDP fixes также могут идти параллельно. SHOP-UI-04 controls/thumbnails ждёт image slot SHOP-UI-02, но не весь SHOP-05. SHOP-UI-DEC остаётся gate только для post-v1 mobile flow SHOP-UI-05.
2. **Базовый commerce/domain:** SHOP-04 → SHOP-05 → SHOP-06 согласно существующим зависимостям; SHOP-06 даёт typed domain/Price foundation и поэтому предшествует core SHOP-ARCH. SHOP-ARCH не блокирует уже согласованные локальные SHOP-04/05, но обязателен до новых HTTP-backed/cart/checkout расширений. Core SHOP-CATALOG-POLISH можно вести после SHOP-03; скидка/Price и DTO-dependent части ждут SHOP-06.
3. **Контракты до расширений:** core SHOP-ARCH → SHOP-API-CONTRACT до проектирования новых HTTP flows и SHOP-COMMERCE-FLOW. SHOP-07 следует за SHOP-06, SHOP-08 — за SHOP-07 по действующему плану; auth-specific часть SHOP-ARCH/API-CONTRACT дополняется после SHOP-08, не задерживая catalog/cart contracts.
4. **Backend-ready flows:** core SHOP-COMMERCE-FLOW после SHOP-04/05/06 и contracts. SHOP-MOCK-API вводится после соответствующего API contract и HTTP adapter boundary; catalog/product mock может идти раньше, auth mock — после SHOP-08. SHOP-ACCOUNT как B enhancement не блокирует v1; безопасные базовые auth/profile states остаются в SHOP-08 и SHOP-UI.
5. **Quality и release:** SHOP-RESILIENCE state model начинается с core UI/catalog, HTTP recovery следует SHOP-ARCH; после основных flows SHOP-PERF фиксирует baseline, затем budget. SHOP-SECURITY завершается после auth/config boundaries; SHOP-OBSERVABILITY v1 ограничен Logger/ErrorReporter boundary и безопасным Noop. Критические accessibility и UI исправления выполняются в своих implementation PR до SHOP-90. Затем SHOP-90 → SHOP-91 → SHOP-92. B/C items не являются prerequisites этих gates.

Параллельность не отменяет отдельные branches/PR и manual gates. Architecture/API contracts стоят сразу после необходимого SHOP-06 domain foundation и до новых HTTP/business flows, чтобы не переносить business logic из UI позднее. Новые epics делятся на reviewable tickets; cross-reference не создаёт вторую реализацию.

## Сквозные product и quality contracts

- **UI/accessibility:** ориентир WCAG 2.2 AA во всех SHOP-UI tickets: keyboard navigation, focus-visible, labels, form errors, semantic headings, управляемый фокус dialog/drawer, нужные live announcements, contrast, target sizes и reduced motion. SHOP-90 выполняет комплексный gate, но доступность исправляется в implementation PR.
- **Responsive:** контракты для 320/390/480/768/1024/1280/1440+ px на catalog, product details, cart, checkout, profile и orders. Требуется устойчивый layout без horizontal overflow и сломанных controls; pixel-perfect на каждом размере не требуется.
- **Localization:** никаких hardcoded UI strings в затронутых сценариях; `Intl.NumberFormat`, `Intl.DateTimeFormat`, pluralization, проверка пропущенных переводов и длинных RU/EN строк. T-018/T-019 дают единый Price/Intl layer в SHOP-06, presentation аудит — SHOP-UI; fake currency conversion запрещена. Реальная конверсия возможна только с rate provider/backend.
- **Testing pyramid:** unit → domain/integration → component → E2E → visual regression/accessibility → performance smoke. Critical flows: browse → PDP → cart, search/filter → PDP, cart → checkout → confirmation, auth/demo session, offline degradation, API failure/recovery и mobile checkout. Базовые visual screenshots: 390 light/dark и 1280 light/dark для ключевых экранов; дополнительные состояния выбираются по риску.
- **CI/CD target:** PR: lint, typecheck, unit/integration, E2E, accessibility, build, bundle budget и visual smoke. `npm run verify` позже объединит локальные pre-PR checks. `main`: build → deploy → deployed smoke. Команду и новые gates вводить отдельными runtime/CI tickets, а не этим roadmap change.
- **Config:** typed/validated boundary для development, test, demo, production и `API_BASE_URL`, `DATA_SOURCE`, `ANALYTICS_ENABLED`, `ERROR_REPORTING_ENABLED`, простых typed feature flags без внешнего SaaS. Неверная конфигурация должна быть явной ошибкой, а не молчаливым смешением источников.
- **Routing/SEO:** route title/description, canonical strategy, OpenGraph, уместные Product JSON-LD, 404, breadcrumb, deep links, refresh-safe routing, scroll restoration и возврат product → catalog с восстановлением состояния. Catalog/product implementation принадлежит SHOP-CATALOG-POLISH, Pages routing/deploy — SHOP-91, итоговая проверка — SHOP-90/92. Реализация должна учитывать ограничения GitHub Pages SPA; SEO-метаданные не обещают серверный рендеринг.

**Non-goals текущей frontend программы:** seller cabinet, warehouse system, fraud engine, recommendation ML infrastructure, Elasticsearch cluster, microservices, Kubernetes, production payment processing, realtime inventory sockets и complex marketplace logistics backend. Comparison добавлять только при обоснованном ассортименте/спецификациях; не наращивать функции ради количества.

## Traceability / Reconciliation — исходный backlog T-001…T-039

Матрица основана на утверждённом Backlog Reconciliation Audit из постановки SHOP-GOV-02, уточнениях аудита и текущем состоянии main. Исходный полный текст backlog в репозитории отсутствует, но формулировки T-001…T-039 предоставлены в аудите. `SOURCE UNAVAILABLE` применяется только к записям без спецификации: назначение, критерии и реализацию нельзя придумывать. `PARTIALLY IMPLEMENTED` фиксирует видимый задел, но не закрывает требование целиком. `PLANNED` означает roadmap mapping, а не начатую работу. `REPLACED / SUPERSEDED BY APPROVED ARCHITECTURE` означает сознательно изменённый контракт, который нельзя считать исходным `IMPLEMENTED`.

| Original requirement | Судьба | Roadmap mapping / ограничение |
| --- | --- | --- |
| T-001 — прежний mock-auth / ProtectedRoute | REPLACED / SUPERSEDED BY APPROVED ARCHITECTURE | SHOP-01 demo-session уже merged; старую модель credentials и ложную защищённость не восстанавливать. |
| T-002 — исправить категории, убрать дубли фильтров | PARTIALLY IMPLEMENTED | SHOP-02 исправил работу категорий; устранение дублей фильтров и согласованное состояние в SHOP-03. |
| T-003 — единая скидка для badge и цены | PLANNED | SHOP-CATALOG-POLISH; domain Price contract в SHOP-06, Product Details presentation без второго расчёта. |
| T-004 — убрать `console.log` / `alert` из продуктовых сценариев | PLANNED | SHOP-CATALOG-POLISH, заменить на согласованные пользовательские уведомления; SHOP-OBSERVABILITY задаёт Logger/ErrorReporter boundary. |
| T-005 — корректная прокрутка Product Details | PLANNED | SHOP-CATALOG-POLISH. |
| T-006 — слой entities для Product/User/Cart/Order | PLANNED | SHOP-06, типизированные domain entities; SHOP-ARCH использует их в service/repository interfaces. |
| T-007 — вынести нормализацию товаров из страниц и sale | PLANNED | SHOP-06, единая нормализация на domain/API границе; DTO mapping в SHOP-ARCH/API-CONTRACT. |
| T-008 — дублирующие hooks прокрутки | PLANNED | SHOP-CATALOG-POLISH. |
| T-009 — пересмотр `forwardRef` для React 19 | PLANNED | SHOP-07, проверить необходимость при текущей версии React 19 и совместимость компонентов. |
| T-010 — порядок `variables.css`/`global.css` | PLANNED | SHOP-UI. |
| T-011 — Vite aliases | PLANNED | SHOP-06, в рамках миграции domain/API модулей. |
| T-012 — hardcoded strings/i18n | PARTIALLY IMPLEMENTED | RU/EN инфраструктура есть; аудит строк в SHOP-UI, locale-safe Price/Intl layer в SHOP-06 и сквозной localization contract. |
| T-013 — Error Boundary / уведомления / общий error handling | PLANNED | Catalog-level SHOP-CATALOG-POLISH; общий failure/recovery contract SHOP-RESILIENCE без дублирования реализации. |
| T-014 — не показывать поисковую подсказку до ввода | PLANNED | SHOP-CATALOG-POLISH, поведение подсказки в продуктовых сценариях. |
| T-015 — согласовать поиск и фильтры, debounce, убрать мигание состояний | PARTIALLY IMPLEMENTED | Debounce уже реализован SHOP-02; согласование комбинаций в SHOP-03, отсутствие мигания в SHOP-UI и regression checks SHOP-90. |
| T-016 — +/- и изображения корзины | PLANNED | SHOP-UI. |
| T-017 — единая система иконок | PLANNED | SHOP-UI. |
| T-018 — Price abstraction | PLANNED | SHOP-06, единый domain contract и locale-safe Intl presentation; без fake currency conversion. |
| T-019 — Currency abstraction | PLANNED | SHOP-06, форматирование и границы валюты; реальные rates только через provider/backend. |
| T-020 — общий EmptyState | PLANNED | SHOP-CATALOG-POLISH, согласовать state model с SHOP-RESILIENCE. |
| T-021 — 404 route | PLANNED | SHOP-CATALOG-POLISH; deep-link/Pages routing проверить в SHOP-91. |
| T-022 — mobile cart/profile pages | PARTIALLY IMPLEMENTED | Страницы существуют; mobile UX вместо drawers уточнить и реализовать в SHOP-UI, если он остаётся утверждённым. |
| T-023 — cart icon in drawer | PLANNED | SHOP-UI, в контексте единой системы иконок и решения по mobile drawers. |
| T-024 — delivery details / promo | PARTIALLY IMPLEMENTED | Базовая delivery page есть; детали/promo в SHOP-COMMERCE-CONTENT, provider contract через SHOP-ARCH/API-CONTRACT. |
| T-025 — pickup points / map | PLANNED | SHOP-COMMERCE-CONTENT; источник данных согласовать перед реализацией, backend-ready DeliveryProvider/API contract. |
| T-026 — реальная/ложная оплата | REPLACED / SUPERSEDED BY APPROVED ARCHITECTURE | SHOP-04 допускает только явно обозначенный локальный demo-checkout без реальных платёжных данных. |
| T-027 — quiz «Не знаю чего хочу» | PLANNED | SHOP-COMMERCE-CONTENT. |
| T-028 — полноценная contact form | PARTIALLY IMPLEMENTED | Форма есть, но сейчас только локально логирует ввод; поведение и ограничения согласовать в SHOP-COMMERCE-CONTENT. |
| T-029 — chatbot | PARTIALLY IMPLEMENTED | Простой локальный chatbot есть; границы и ожидаемый сценарий уточнить в SHOP-COMMERCE-CONTENT. Telegram и AI optional, не обязательны для T-029. |
| T-030 — полный responsive-аудит 320–1440 px | PLANNED | Исправления в SHOP-UI; итоговая проверка 320/390/768/1280/1440 в SHOP-90. |
| T-031 — CSS audit | PLANNED | SHOP-UI. |
| T-032 — microanimations | PLANNED | SHOP-UI, с учётом доступности и reduced motion. |
| T-033 — lazy/preload | PARTIALLY IMPLEMENTED | Route-level lazy loading есть; catalog loading в SHOP-CATALOG-POLISH, visible placeholders в SHOP-UI-02, измерение/policy в SHOP-PERF. |
| T-034 — image optimization | PLANNED | SHOP-CATALOG-POLISH владеет источником/доставкой, SHOP-UI-02 — стабильным slot/fallback, SHOP-PERF — измерением. |
| T-035 — bundle analysis/code splitting | PARTIALLY IMPLEMENTED | Route-level splitting есть; catalog changes в SHOP-CATALOG-POLISH, baseline/budget/CI в SHOP-PERF. |
| T-036 — unit/component tests | PARTIALLY IMPLEMENTED | Отдельные unit-проверки добавлены SHOP-00…02; component coverage на implementation stages, testing pyramid и итоговый SHOP-90. |
| T-037 — integration tests | PARTIALLY IMPLEMENTED | Базовые проверки добавлены SHOP-00…02; contract/adapter сценарии на каждом stage, testing pyramid и итоговый SHOP-90. |
| T-038 — architecture documentation | PLANNED | SHOP-92, сверить с фактическими контрактами и release commit. |
| T-039 — cart persistence / server sync | REPLACED / SUPERSEDED BY APPROVED ARCHITECTURE | Локальное versioned persistence в SHOP-05; server sync не реализуется в публичном demo без backend, но future reconciliation boundary планируется в SHOP-ARCH. |

Отдельная запись исходного материала «Названание 1-1-7»: `SOURCE UNAVAILABLE / NEEDS CLARIFICATION`. Смысл не установлен; implementation ticket не создаётся.

Перед SHOP-92 необходимо уточнить спецификацию «Названание 1-1-7» либо явно подтвердить её исключение/отсрочку. SHOP-92 переводит эту рабочую матрицу в итоговую таблицу с колонками `original requirement`, `implemented`, `replaced`, `deferred`, `excluded`, `known limitation` и фактическими доказательствами.

## SHOP-00 — Foundation

Статус: DONE. Implementation: `f0f2a867dbd5ddfeb124030a7f289e462031592a`; merge: `77933d996e14ab0651a8bfe379093258bdb18f93`. Automated checks и manual QA пройдены при закрытии ticket.

Цель:
получить воспроизводимую исходную точку и ранний CI.

Проблема:
автоматизированные тесты и workflows отсутствуют; среда выполнения не закреплена.

Основные изменения:

- зафиксировать поддерживаемые Node/npm и lockfile;

- добавить необходимые команды проверок;

- минимальный тест основного работающего сценария;

- PR workflow на Linux.

Acceptance criteria:

- установка и проверки воспроизводятся в чистом checkout;

- CI запускает хотя бы один содержательный тест;

- нет скрытого continue-on-error;

- известные дефекты перечислены явно.

Необходимые tests:

- integration: загрузка приложения/entry point;

- E2E: smoke существующего работающего сценария;

- проверка CI на PR.

Рекомендуемая branch:
chore/shop-00-baseline

Рекомендуемый commit message:
chore(shop): establish reproducible checks

Зависимости:
нет.

Риски:
первый запуск может выявить неизвестные build/lint-проблемы; исправлять только необходимое для воспроизводимости, без смешивания с рефакторингом.

---

## SHOP-01 — Безопасная демонстрационная сессия

Статус: DONE. Implementation: `0158ec2467882dc8c191338b858c274056538ca0`; merge: `774b5bd00a59a04e48cdd90912c72c8f54ed4057`. Automated checks и manual QA пройдены при закрытии ticket.

Цель:
убрать небезопасную имитацию авторизации.

Проблема:
plaintext-пароли, Base64-токены и доверие изменяемому localStorage.

Основные изменения:

- заменить регистрацию/пароль на «Войти как демо-пользователь»;

- удалить генерацию псевдо-JWT;

- явно обозначить отсутствие защищённого аккаунта;

- удалить только legacy-ключи credentials, принадлежащие приложению.

Acceptance criteria:

- приложение не собирает, не сохраняет и не логирует пароли;

- изменение storage не предоставляет «защищённых» возможностей;

- старые credential-записи очищаются без удаления корзины/темы.

Необходимые tests:

- unit: очистка legacy-ключей;

- integration: вход/выход;

- E2E: обновление страницы и подмена storage;

- проверка отсутствия credentials в storage и запросах.

Рекомендуемая branch:
fix/shop-01-demo-session

Рекомендуемый commit message:
fix(auth): replace mock credentials with demo session

Зависимости:
SHOP-00

Риски:
старые mock-профили перестанут работать; это намеренная миграция.

---

## SHOP-02 — Корректный поиск и категории

Статус: DONE. Implementation: `de94848132bd5f4667079debc3db719b2d4e95b6`; merge: `de7beb5943381d80dbce77fecf4ba34f61fd2f30`. Automated checks и manual QA пройдены при закрытии ticket.

Цель:
восстановить контракт infinite query.

Проблема:
пользовательские аргументы читаются не из queryArg, поиск формирует обычный запрос каталога.

Основные изменения:

- исправить чтение queryArg/pageParam;

- согласовать cache keys;

- сбрасывать страницы при смене поиска/категории;

- обрабатывать empty/error/retry.

Acceptance criteria:

- запрос содержит текущую строку;

- категории не смешиваются;

- следующая страница относится к текущему запросу;

- поздний ответ старого поиска не заменяет новый.

Необходимые tests:

- unit: построение параметров;

- integration: RTK Query с mock API, пагинация и ответы в обратном порядке;

- E2E: поиск, очистка, категория, retry.

Рекомендуемая branch:
fix/shop-02-product-query

Рекомендуемый commit message:
fix(products): honor infinite query arguments

Зависимости:
SHOP-00

Риски:
изменение ключей кэша и логики загрузки страниц.

---

## SHOP-03 — Catalog semantics & advanced filtering

Статус: DONE. Implementation: `b40c5e86d8379be5cc20149558d8f04ce76d0a9b` (snapshot/filtering) и `95b2511fe3525c9a5dfb1283a85ad2e9d442ff83` (checksum correction); merge: `95a845b6adee4d52b0ef9d18c84fa4f2ba460c77` в main. Принятые catalog semantics сохраняются; UI observation о сообщениях API mode остаётся follow-up SHOP-UI-03.

Цель:
сделать поиск, категории, диапазон цен и сортировку единым, понятным и воспроизводимым сценарием.

Проблема:
фильтры работают только по уже загруженным страницам.

Основные изменения:

- для основного demo использовать полный фиксированный набор товаров, доступный без внешнего API;

- построить единый pipeline поиска, фильтрации и сортировки по полному набору;

- поддержать несколько одновременно выбранных категорий и диапазон цен;

- устранить дубли фильтров и согласовать состояние категорий, поиска и остальных фильтров (T-002/T-015);

- хранить и явно показывать активные фильтры; визуальный счётчик и summary уточнены в SHOP-UI;

- сохранить уже реализованный в SHOP-02 debounce поиска, без повторной реализации;

- сохранить внешний API за adapter как дополнительный режим;

- явно показывать источник данных.

Acceptance criteria:

- результат не зависит от прокрутки;

- точный count совпадает с полной выборкой после поиска и фильтров;

- комбинации строки поиска, нескольких категорий, диапазона цен и сортировки дают согласованный стабильный результат;

- сброс и изменение любого фильтра обновляют явное состояние активных фильтров и результат;

- debounce поиска из SHOP-02 сохраняется;

- основной demo работает без DummyJSON.

Необходимые tests:

- unit: комбинации поиска, нескольких категорий и диапазона цен, точный count и стабильность сортировки;

- integration: fixture/API adapter, сброс состояния при смене фильтров и пагинация результата;

- E2E: одинаковая выдача и count до и после прокрутки; regression для существующего debounce поиска.

Рекомендуемая branch:
fix/shop-03-catalog-semantics

Рекомендуемый commit message:
fix(catalog): make demo filtering deterministic

Зависимости:
SHOP-02

Риски:
расхождение fixture и внешнего API.

---

## SHOP-04 — Локальный demo-checkout

Статус: NOT STARTED.

Цель:
завершить сценарий корзины без ложного заказа.

Проблема:
checkout сообщает об оформлении и очищает корзину без сохранения.

Основные изменения:

- создать локальный demo-order;

- сохранять его до очистки корзины;

- показать сообщение «Демо-заказ сохранён на этом устройстве, продавцу не отправлен»;

- исключить реальные платёжные данные.

- не восстанавливать реальную или имитирующую реальную оплату из T-026: допустим только явно обозначенный demo-checkout.

Acceptance criteria:

- при ошибке сохранения корзина остаётся;

- повторное нажатие не создаёт дубликат;

- summary доступен после refresh;

- ограничен размер локальной истории.

Необходимые tests:

- unit: итог и модель заказа;

- integration: storage failure и повторная отправка;

- E2E: каталог → корзина → demo-order → refresh.

Рекомендуемая branch:
feat/shop-04-demo-checkout

Рекомендуемый commit message:
feat(checkout): persist explicit demo orders

Зависимости:
SHOP-01

Риски:
storage quota и дублирование заказа; demo-история не должна содержать реальные персональные данные.

Следующий backend-ready checkout stage планируется отдельно в SHOP-COMMERCE-FLOW после выполнения этого ограниченного SHOP-04: Cart → Contact → Delivery → Address/Pickup → Payment method → Review → Demo confirmation. Нужны validation, recoverable errors и возврат вперёд/назад между шагами. `PaymentProvider` имеет DemoPaymentProvider и возможный будущий RealPaymentProvider; настоящий provider допускается только за отдельной безопасной backend границей. Не хранить данные реальных карт и не имитировать реальную оплату. Этот future flow не расширяет acceptance criteria SHOP-04 молча.

---

## SHOP-05 — Версионированная корзина и чистые reducers

Статус: NOT STARTED.

Цель:
сохранять корзину и отделить побочные эффекты.

Проблема:
корзина существует только в памяти; reducer темы обращается к localStorage.

Основные изменения:

- вынести persistence в adapter/listener;

- добавить схему корзины и валидацию;

- обрабатывать повреждённые данные;

- согласовать хранение demo-order.

- реализовать только локальное cart persistence: server sync из T-039 требует backend и не входит в текущую demo-архитектуру.

Acceptance criteria:

- корзина восстанавливается;

- reducer не выполняет I/O;

- неверный JSON не ломает запуск;

- недоступный storage оставляет приложение работоспособным с уведомлением.

Необходимые tests:

- unit: reducer и schema;

- integration: восстановление, повреждение и quota;

- E2E: refresh, изменение количества, удаление.

Рекомендуемая branch:
refactor/shop-05-persistence

Рекомендуемый commit message:
refactor(state): isolate versioned persistence

Зависимости:
SHOP-04

Риски:
несовместимость storage при откате; вводить новую версию ключа без массового удаления старых данных.

Backend-ready cart model после базового SHOP-05 реализуется в SHOP-COMMERCE-FLOW: `CartLine` — отдельная domain сущность, не `Product + quantity`. Планировать quantity controls, remove, уместный restore/undo, stock limit, unavailable item, price recalculation, subtotal/discount/delivery/total, promo, optimistic UI и rollback при API failure. SHOP-05 владеет local persistence: `schemaVersion`, migrations, runtime validation, safe reset, corrupted/unavailable storage handling без слепого доверия `JSON.parse`. Future server reconciliation остаётся границей service/repository, а не реализованным server sync T-039; цена и итог должны исходить из согласованной domain логики, не из произвольного UI состояния.

---

## SHOP-06 — TypeScript для domain и API

Статус: NOT STARTED.

Цель:
проверять ключевые контракты статически.

Проблема:
заявленная миграция отсутствует; ошибки границ API не обнаруживаются типами.

Основные изменения:

- добавить TS с постепенным сосуществованием JS;

- создать слой entities для Product/User/Cart/Order и типизировать Product, CartItem, DemoOrder, query args, store hooks и adapters (T-006);

- вынести нормализацию товаров из страниц и sale на общую domain/API границу (T-007);

- определить общую Price/Currency abstraction для расчётов, отображения и форматирования (T-018/T-019);
- использовать locale-safe Price/Intl formatting без фиктивной конвертации валют; реальные rates требуют отдельного provider/backend;

- проверить Vite aliases для мигрируемых модулей (T-011);

- включить strict для мигрируемых модулей.

Acceptance criteria:

- typecheck проходит;

- новые контракты не используют необоснованный any;

- runtime-валидация внешних данных сохранена;

- поведение UI прежнее.

Необходимые tests:

- unit/integration: существующие domain/API проверки;

- E2E: каталог и checkout.

Рекомендуемая branch:
refactor/shop-06-domain-types

Рекомендуемый commit message:
refactor(shop): type domain and api boundaries

Зависимости:
SHOP-03, SHOP-05

Риски:
слишком широкий diff; UI-компоненты мигрировать отдельными PR при необходимости.

---

## SHOP-07 — Контролируемое обновление зависимостей

Статус: NOT STARTED.

Цель:
получить поддерживаемую воспроизводимую базу.

Проблема:
отсутствие dependency policy и подтверждённой проверки всего дерева.

Основные изменения:

- проверить direct/transitive dependencies;

- обновить одну совместимую группу;

- настроить небольшие отдельные update-PR;

- документировать временные исключения с причиной и сроком.

- при текущей версии React 19 проверить необходимость `forwardRef` и совместимость компонентов (T-009), без механического удаления;

Acceptance criteria:

- lock согласован;

- нет необработанных применимых high/critical advisories;

- scripts и production build работают.

Необходимые tests:

- текущий unit/integration/E2E набор;

- production smoke.

Рекомендуемая branch:
chore/shop-07-dependencies

Рекомендуемый commit message:
chore(deps): update verified shop dependencies

Зависимости:
SHOP-06

Риски:
несовместимые React/RTK/Router/toolchain изменения; major upgrades выносить отдельно.

---

## SHOP-08 — Typed Client Authentication Architecture / Mock API

Статус: NOT STARTED.

Цель:
определить типизированную клиентскую архитектуру авторизации с тестовым HTTP-режимом без реального backend.

Roadmap-level scope:

- публичным режимом остаётся SHOP-01 demo-session;
- AuthService abstraction с Demo Adapter и HTTP Adapter;
- typed contracts для login/register/logout/getSession;
- runtime validation ответов HTTP;
- mock HTTP server для tests;
- mock-api login UI доступен только в непубличном режиме; public build не собирает mock-login flow;
- реальный backend вне scope.

Future account domain в SHOP-ACCOUNT на той же AuthService/API границе: profile, addresses, favorites, order history/details, session expiry, unauthorized handling, refresh-session strategy interface и safe logout. Реализацию делить на отдельные tickets; public demo-session SHOP-01 остаётся безопасным, исходная mock-password архитектура T-001 не возвращается. SHOP-MOCK-API позже переиспользует тот же HTTP contract, не внедряя mock-логику в страницы.

Зависимости:
SHOP-01, SHOP-06, SHOP-07.

---

## SHOP-AUTH-UI — Authentication UX and demo-safe form contract

Статус: IN PROGRESS — реализовано в `feat/shop-auth-ui`, ожидает manual QA. Формы `/login`, `/register`, `/forgot-password` имеют локальную validation, RU/EN и состояния отправки, ошибки и информации. Публичный demo adapter не проверяет credentials, не создаёт аккаунт и не отправляет email; session остаётся в памяти до refresh. UI обращается к `sessionService`, который позже может получить backend adapter. Настоящий reset-token flow ждёт backend recovery contract.

Следующий отдельный ticket: SHOP-ACCOUNT-01 — Account shell и overview/dashboard. Его реализация сюда не входит.

---

## SHOP-COMMERCE-FLOW — Cart and staged checkout

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** для core CartLine/pricing/checkout/delivery contracts; расширенные undo, promo и server reconciliation получают отдельные B PR. Делить на cart model и checkout flow PR после базовых SHOP-04/05.

Цель: завершить backend-ready cart/checkout frontend без изменения ограниченного demo-checkout scope SHOP-04 задним числом. Владеет `CartLine` и правилами stock/unavailable/price/promo/total, optimistic mutation/rollback через service interface, а также staged Cart → Contact → Delivery → Address/Pickup → Payment method → Review → Demo confirmation с validation, recoverable errors и back/forward. `PaymentProvider` отделяет DemoPaymentProvider от возможного будущего RealPaymentProvider. Данные реальных карт, production payment и отправка реального заказа продавцу не входят в публичный demo. UI controls/thumbnails принадлежат SHOP-UI-04, local persistence — SHOP-05, delivery contract — SHOP-COMMERCE-CONTENT/SHOP-API-CONTRACT, общие ошибки — SHOP-RESILIENCE.

Зависимости: SHOP-04/05/06, SHOP-ARCH/API-CONTRACT для backend-ready boundaries. Критические cart → checkout → demo confirmation и failure/retry проверяются до SHOP-90.

---

## SHOP-ACCOUNT — Account and order-facing frontend

Статус: PLANNED. Release class: **B — POST-V1 / PRODUCT ENHANCEMENT**; делить на profile/addresses, favorites и orders PR. Базовая безопасная demo-session и auth architecture v1 принадлежат SHOP-01/08.

Цель: backend-ready profile, addresses, favorites, order history/details и session lifecycle поверх SHOP-08 AuthService. Нужны session expiry, unauthorized handling, refresh-session strategy interface и safe logout; public demo-session SHOP-01 остаётся без реальных credentials и без ложной защищённости. Recently viewed относится к catalog/product experience, а не требует реального аккаунта; comparison optional. Order data следует SHOP-COMMERCE-FLOW и SHOP-API-CONTRACT, а не отдельному состоянию внутри ProfilePage.

Зависимости: SHOP-08, SHOP-ARCH/API-CONTRACT, SHOP-COMMERCE-FLOW для order-facing paths. Mobile profile flow следует SHOP-UI-DEC/05; не блокировать независимые UI icons/grid работы.

---

## SHOP-ARCH — Application boundaries

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** для границ критических catalog/cart/checkout/auth flows; перед реализацией разбить на reviewable PR по feature boundaries.

Цель: UI не зависит напрямую от DummyJSON, snapshot, `fetch` или конкретного backend. Целевая цепочка: UI → feature/use-case layer → domain models → service/repository interfaces → adapters. Demo/Local Adapter, Mock HTTP Adapter и Real HTTP Adapter заменяемы без переписывания страниц/components. Применить последовательно к Catalog, Product Details, Auth, Cart, Checkout, Orders, Profile, Delivery, Promotions и Favorites, только по мере соответствующего product scope.

Scope: service/repository interfaces, DTO → domain mappers, normalized errors, abort/cancellation, timeout/retry/cache policy, environment/config boundary и отсутствие API implementation details в pages. Runtime validation внешних данных сохраняется. SHOP-06 владеет базовыми typed domain/API моделями, SHOP-08 — auth abstraction, SHOP-05 — local cart persistence; здесь согласуются границы между ними, а не выполняется mass refactor. Config использует typed/validated modes и flags из сквозного contract выше.

Зависимости: SHOP-06 для core domain models; SHOP-04/05 нужны для привязки уже согласованных локальных cart/checkout flows, но core SHOP-ARCH не ставится перед их базовой реализацией. Auth-specific adapter boundary дополняется после SHOP-08. Выход: документированные и проверенные interfaces и как минимум demo + HTTP adapter path для критических flows; отдельные PR сохраняют SHOP-01…03 semantics.

---

## SHOP-API-CONTRACT — Backend contract

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** для versioned contracts критических v1 flows; контракты будущих product enhancements дополняются в B PR.

Цель: backend можно заменить, если он соблюдает опубликованный contract. План: versioned OpenAPI specification, например `openapi/storefront.yaml`, для products/product details, auth, cart, checkout, orders, addresses, delivery, profile, favorites и promotions. V1 публикует критические product/cart/checkout/auth/delivery contracts; account/favorites/promotions расширяются B PR по мере реализации продукта. Включить error, pagination и validation contracts, API versioning strategy, совместимость контрактов и mapping API DTO → domain models. Разделить spec и contract tests на небольшие PR, не выдумывая уже существующие backend endpoints.

Зависимости: SHOP-06 и core границы SHOP-ARCH; catalog/cart/checkout/delivery contract определить до новых HTTP-backed flows, auth-specific contract согласовать после SHOP-08. Pricing использует T-018/T-019 и SHOP-04. Выход: проверяемый contract, по которому независимый backend способен обслуживать frontend без UI rewrite.

---

## SHOP-MOCK-API — Replaceable HTTP demo

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** для parity критических v1 endpoints и безопасного demo/mock HTTP переключения.

Цель: демонстрировать HTTP boundary, не только прямой импорт local objects. Предпочтителен MSW или эквивалентный HTTP mock layer: те же endpoints, схемы и ошибки, что у Real HTTP Adapter; demo fixtures обслуживаются mock server, а API adapter не знает, какой сервер ответил. Конфигурация явно выбирает `local/demo`, `mock-api` или `real-http`; public Pages demo остаётся самодостаточным и безопасным. Synthetic test fixtures не включаются в пользовательский production catalog. Mock HTTP login из SHOP-08 остаётся непубличным.

Зависимости: SHOP-API-CONTRACT и соответствующие HTTP boundaries SHOP-ARCH; auth mock flow — после SHOP-08. Catalog/product HTTP mock можно вводить раньше, но M2 закрывается только после parity всех критических v1 endpoints. Не подменять SHOP-03 deterministic fixture semantics.

---

## SHOP-RESILIENCE — Failure and recovery model

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** для failure/recovery критических flows.

Цель: сбой одного route/request/image не приводит к white screen или противоречивым состояниям. Scope: root и route-level Error Boundaries, 404, единая модель loading/empty/error/retry/end-of-list, safe reset/recovery, image degradation/fallback, offline/degraded mode, timeout, отмена stale requests, safe retry, partial failures и отсутствие user data в logs.

T-013/T-020/T-021 реализуются catalog-level в SHOP-CATALOG-POLISH; этот epic задаёт общий contract и покрывает остальные routes без дублирующей системы компонентов. SHOP-UI-03 устраняет видимый конфликт «Вы просмотрели все товары!» + «Товары не найдены» в API mode, а SHOP-RESILIENCE согласует underlying mutually exclusive state model. Это follow-up SHOP-03, а не дефект его scope. Image geometry/fallback остаются SHOP-UI-02, request policy — SHOP-ARCH.

Зависимости: SHOP-03, SHOP-ARCH для HTTP policy, SHOP-CATALOG-POLISH для shared primitives. Выход: воспроизводимые failure/recovery checks для критических flows.

---

## SHOP-PERF — Measured storefront performance

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** для измеренного baseline, согласованного budget и CI gate; точечные оптимизации после достижения budget могут быть B.

Scope: route-level code splitting, оправданные `React.lazy`/dynamic imports, bundle analysis, JS size baseline и затем budget в CI, lazy loading, preload/prefetch policy, image sizing/aspect ratio, CLS reduction, Core Web Vitals targets, Lighthouse/performance smoke и font loading strategy. Учитывать T-033/T-034/T-035 и наблюдаемый Vite warning о main chunk около 500 KB; warning служит поводом измерить baseline, а не случайным жёстким лимитом. SHOP-CATALOG-POLISH владеет catalog loading/splitting changes, SHOP-UI-02 — стабильным image slot; epic владеет измерением, budget и cross-route оптимизацией.

Release targets: нет существенного CLS на ключевых flows; route chunks вместо монолитного bundle; JS budget документирован по измеренному baseline и контролируется в CI; нет неконтролируемого роста bundle. Числовые пороги Core Web Vitals и bundle устанавливаются после baseline для согласованных устройств/сети. Не выполнять преждевременную micro-optimization.

Зависимости: основные routes и SHOP-CATALOG-POLISH/SHOP-UI image work; CI budget до SHOP-90.

---

## SHOP-OBSERVABILITY — Privacy-safe signals

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** только для Logger/ErrorReporter interfaces, безопасного Dev/Noop adapter и отсутствия чувствительных данных в logs. Advanced analytics/event funnels — **B — POST-V1 / PRODUCT ENHANCEMENT**; внешние vendor adapters — **C — OPTIONAL INTEGRATION**. Их отдельные PR не блокируют v1.

V1 interfaces: `Logger`, `ErrorReporter`; adapters: Dev Console и Noop для публичного production/demo без подключения сервиса. Post-v1: `Analytics`, `PerformanceReporter`, будущие Sentry-compatible и analytics adapters. Commerce events для будущих B PR: `product_view`, `search`, `filter_apply`, `add_to_cart`, `remove_from_cart`, `checkout_start`, `checkout_complete`, `favorite_add`. Схемы событий версионировать и не включать секреты, credentials или лишние персональные данные. Demo не отправляет реальные analytics без явного включения; `ANALYTICS_ENABLED` и `ERROR_REPORTING_ENABLED` валидируются конфигурацией. Убрать случайные `console.log`/`alert` по T-004 в SHOP-CATALOG-POLISH, а не скрыть их reporter-ом.

Зависимости: SHOP-ARCH/config boundary, критические commerce flows. Выход: проверяемое поведение Noop/demo и безопасный путь для будущих интеграций без привязки страниц к vendor SDK.

---

## SHOP-SECURITY — Frontend production hardening

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** для client/deployment hardening; backend security находится вне frontend ticket.

Scope: отсутствие secrets и реальных credentials в client/bundle, CSP-ready deployment и документированные secure headers/clickjacking guidance, запрет unsafe HTML, sanitization внешнего контента при его появлении, safe external links, token/session boundaries, отказ от доверия editable `localStorage` в production auth adapter, dependency/supply-chain review, safe logs и validated environment config. SHOP-01 остаётся публичной demo-session, T-001 mock-password не восстанавливается; SHOP-07 владеет самими dependency upgrades, SHOP-08 — auth contract, SHOP-91 — фактическими deployment settings. Не обещать, что GitHub Pages обеспечивает серверную защиту или обрабатывает реальные платежи.

Зависимости: SHOP-07/08 и SHOP-ARCH config/auth boundaries. Frontend hardening завершается до SHOP-90; SHOP-91 затем проверяет фактические deployment settings и опубликованный demo. Это последующая проверка, не обратная зависимость SHOP-SECURITY от SHOP-91.

---

## SHOP-CATALOG-POLISH — Catalog resilience & navigation

Статус: NOT STARTED. Release class: **A — PRODUCTION V1 BLOCKING** для детерминированной скидки, PDP/navigation defects, error/empty/404 и нужных loading/image defects; autocomplete, recent searches, расширенные facets и related/recently viewed — **B — POST-V1 / PRODUCT ENHANCEMENT** в отдельных PR.

Цель:
закрыть небольшие функциональные и технические пробелы каталога, не смешивая их с визуальной стабилизацией.

Scope:

- единая скидка как источник для badge и цены (T-003);
- убрать `console.log` / `alert` из продуктовых сценариев, согласовать пользовательские уведомления (T-004);
- корректная прокрутка Product Details и устранение дублирующих hooks прокрутки (T-005/T-008);
- не показывать поисковую подсказку до ввода (T-014);
- общий EmptyState, маршрут 404, Error Boundary и согласованные уведомления об ошибках (T-013/T-020/T-021);
- lazy loading, preload и качество загрузки изображений, где это улучшает каталог (T-033/T-034); согласовать с visual/layout работой SHOP-UI;
- bundle analysis и обоснованное code splitting для каталога (T-035).

Catalog/search work для отдельных reviewable PR после SHOP-03: v1 сохраняет deterministic query/filter/sort и навигацию без потери состояния; URL-synchronized search/filter/sort, shareable deep links и browser back/forward recovery выполняются в core PR там, где нужны критическим flows. Suggestions/autocomplete, recent searches, расширенные relevance/rating sorting и backend-ready facets brand/rating/availability/discount — B enhancements. Query normalization и zero-result recovery оцениваются по конкретным дефектам v1. Facet values, counts и ranges могут позже приходить от backend по SHOP-API-CONTRACT; текущий demo использует определённые fixtures. Это не требует Elasticsearch или server search сейчас. T-014/T-015 и SHOP-03 semantics не переопределяются.

Product Details scope также разбить позже: gallery, thumbnails, zoom/lightbox, текущая и старая цена с детерминированной скидкой (T-003), stock, variants, quantity, delivery estimate, add to cart, favorites, specifications, description, breadcrumb, related products и recently viewed. V1 core: работоспособная PDP, согласованные цена/скидка/добавление в корзину и навигация; расширенная gallery/zoom, variants, related products, favorites и recently viewed — B PR после подтверждения данных и пользы. T-005 остаётся про навигацию/прокрутку; source данных и DTO mapping принадлежат SHOP-ARCH/API-CONTRACT. Comparison — optional B только при достаточном ассортименте.

Разграничение общих состояний: текущие T-013/T-020/T-021 сохраняются здесь для catalog-level реализации; SHOP-RESILIENCE определяет общий state/recovery contract для остальных routes, чтобы не создавать конкурирующие EmptyState/Error Boundary.

Перед реализацией разделить на небольшие PR, если единый diff станет слишком широким. Regression tests покрывают скидку, навигацию, пустые и ошибочные состояния и загрузку изображений.

Зависимости:
SHOP-03 (DONE) для независимых core catalog/PDP fixes; T-003/Price и DTO-dependent PR — после SHOP-06/SHOP-ARCH. B search/facet enhancements используют SHOP-API-CONTRACT. Весь epic не ждёт SHOP-06 целиком.

---

## SHOP-COMMERCE-CONTENT — Delivery & engagement

Статус: NOT STARTED. Release class: **B — POST-V1 / PRODUCT ENHANCEMENT** для delivery content/pickup map, quiz, contact и support UX; минимальный delivery/checkout contract v1 принадлежит SHOP-COMMERCE-FLOW и SHOP-API-CONTRACT, без ожидания всего этого epic.

Цель:
довести информационные и демонстрационные сценарии магазина до явно описанного поведения.

Scope:

- детали доставки, промокод и пункты выдачи/карта (T-024/T-025);
- quiz «Не знаю чего хочу» (T-027);
- полноценная contact form (T-028);
- chatbot с явно ограниченным demo-поведением (T-029).

Delivery scope для будущих отдельных PR: `DeliveryProvider` с методами, ценой, ETA и pickup points по явному contract; demo adapter использует fixtures, real adapter позже backend (T-024/T-025). Promotions получают service boundary, чтобы promo не рассчитывался отдельно в UI. Support/chat из T-029 может остаться rule-based/non-AI; optional AI adapter не входит в checkout или business-critical flows. Реальная отправка через Telegram относится только к SHOP-INTEGRATION-TELEGRAM.

Никаких реальных платежей, отправки заказа продавцу или backend-интеграции эта группа сама по себе не обещает. Конкретные данные, поведение и tests утверждаются перед реализацией; крупную группу разделить на небольшие PR.

Зависимости:
SHOP-04, SHOP-05.

---

## SHOP-UI — Visual and Layout Stabilization

Статус: PLANNED. Release class: **A — PRODUCTION V1 BLOCKING** для SHOP-UI-01/02/03/04/06; **B — POST-V1 / PRODUCT ENHANCEMENT** для SHOP-UI-DEC/05/07 при отсутствии обнаруженного blocker. Семь отдельных runtime tickets ниже; ни один не начат. Каждый требует отдельного подтверждения и branch по CODEX_WORKFLOW.md. SHOP-90 остаётся финальным comprehensive QA gate после исправлений, а не местом их первичной реализации.

Общие границы: SHOP-03 нужен для каталожных UI tickets; SHOP-05 нужен для persistence-dependent cart проверки, но не блокирует все cart controls; SHOP-08 нужен для auth-dependent profile flow, но не для сетки или иконок. Для изображений согласовать границу с SHOP-CATALOG-POLISH: там остаются catalog lazy/preload, оптимизация источника/доставки изображений и bundle work; здесь — размеры места под изображение, fallback и видимое состояние загрузки. T-011 (Vite aliases) остаётся в SHOP-06 и не входит в визуальные PR. Общий EmptyState, Error Boundary, 404 и уведомления принадлежат SHOP-CATALOG-POLISH; SHOP-UI настраивает представление затронутых состояний, не дублируя их архитектуру. Существующий debounce поиска из SHOP-02 и semantics/count/adapter SHOP-03 сохраняются. Каждый runtime PR проходит применимые unit/integration checks, lint, production build/preview и собственный manual QA gate по CODEX_WORKFLOW.md; SHOP-90 затем проверяет систему целиком.

Internal UI primitives target (не отдельный npm package): Button, IconButton, Input, Select, Checkbox, Radio, Badge, Chip, Tooltip, Modal, Drawer, Toast, Skeleton, EmptyState, ErrorState, Price, ProductImage и QuantityControl. Design tokens: colors, spacing, typography, radius, shadow, breakpoints, z-index и motion. Вводить или унифицировать только там, где конкретный SHOP-UI PR устраняет наблюдаемое дублирование; архитектура общих EmptyState/ErrorState согласуется с SHOP-CATALOG-POLISH/SHOP-RESILIENCE, Price — с SHOP-06. Не превращать SHOP-UI-06/07 в массовое создание всех primitives. Для каждого SHOP-UI ticket действуют accessibility и responsive contracts из раздела выше, включая 480/1024 px и WCAG 2.2 AA как ориентир.

Observation из SHOP-03: в API mode сейчас одновременно возможны «Вы просмотрели все товары!» и «Товары не найдены». Это follow-up по взаимоисключающему представлению empty-result и end-of-pagination в SHOP-UI-03, не дефект и не расширение scope SHOP-03. При исправлении не менять выборку, count или смысл `hasNextPage` SHOP-03.

### Порядок и зависимости

1. SHOP-UI-01 — сетка и стабильность карточек; после SHOP-03, без зависимости от SHOP-08.
2. SHOP-UI-02 — изображения и видимая загрузка; после SHOP-UI-01, с согласованной границей SHOP-CATALOG-POLISH.
3. SHOP-UI-03 — представление фильтров и состояний выдачи; после SHOP-03 и SHOP-UI-01. Может идти параллельно SHOP-UI-02.
4. SHOP-UI-04 — корзина; controls и empty state после SHOP-UI-02, без полной блокировки SHOP-05. Persistence-dependent regression — после SHOP-05; не зависит от SHOP-UI-03.
5. SHOP-UI-DEC — отдельное non-runtime UX-решение по T-022; подготовить после оценки действующих cart/profile routes и drawers, утвердить до SHOP-UI-05. Не считать отсутствие решения согласием на замену drawers.
6. SHOP-UI-05 — выбранный mobile cart/profile flow; после SHOP-UI-DEC и SHOP-UI-04.
7. SHOP-UI-06 — иконки и общие интерактивные состояния можно выполнять после SHOP-UI-01, включая cart icon в существующем drawer (T-023). Будущее решение SHOP-UI-DEC может изменить mobile placement, но не блокирует этот PR.
8. SHOP-UI-07 — точечная CSS уборка; после SHOP-UI-01…06, чтобы удалять только подтверждённые дубли и устаревшие правила.

Независимость означает отдельные PR и самостоятельный manual QA каждого ticket, а не автоматический старт следующего. Если один PR потребует незапланированного изменения data/API или крупного redesign, согласовать отдельный scope до реализации.

### SHOP-UI-01 — Product grid and card layout

- **Release class:** A — PRODUCTION V1 BLOCKING.
- **Цель:** предсказуемая сетка и стабильные размеры product cards на 320–1440 px.
- **Scope:** размеры и выравнивание карточек, одинаковое поведение рядов, spacing, centering, перенос длинных RU/EN названий, отсутствие горизонтального скролла и заметных layout shifts от геометрии карточек; исправить выявленные responsive дефекты каталога и связанного layout (T-030).
- **Не входит:** загрузка/оптимизация изображений, фильтрация и сортировка, глобальный CSS refactor, mobile cart/profile navigation.
- **Зависимости:** SHOP-03; основа для SHOP-UI-02/03/07. SHOP-08 не требуется.
- **Expected files/areas:** `src/pages/ProductsPage`, `src/pages/HomePage`, product card/shared layout styles, `src/shared/layouts/MainLayout` при подтверждённой связи с сеткой.
- **Automated checks:** lint и production build; существующие catalog tests; при необходимости узкие component/responsive assertions для геометрии и длинных названий.
- **Manual QA:** 320/390/768/1280/1440 px, light/dark, RU/EN, короткие и длинные названия, несколько рядов, loading/empty/error; проверить отступы, центровку, стабильность рядов и отсутствие горизонтального скролла.
- **Критерии завершения:** карточки и ряды сохраняют предсказуемую геометрию при смене ширины и контента; текст не перекрывает controls; нет заметных сдвигов, вызванных каркасом карточек.

### SHOP-UI-02 — Product image slots and fallback

- **Release class:** A — PRODUCTION V1 BLOCKING.
- **Цель:** равномерное появление карточек и изображений без прыжков layout.
- **Scope:** фиксированное место/соотношение сторон изображения в карточке и затронутом product view, placeholder или skeleton, видимый fallback при ошибке/отсутствии изображения, согласованное появление контента. Учесть, что snapshot содержит внешние image URLs: отсутствие сети или недоступность источника должно оставлять корректный fallback, а не требовать копирования внешних assets.
- **Не входит:** замена источника данных, массовая загрузка изображений в репозиторий, catalog-level lazy/preload и asset optimization из SHOP-CATALOG-POLISH (T-033/T-034), изменение API semantics.
- **Зависимости:** SHOP-UI-01; согласование с SHOP-CATALOG-POLISH до изменения механики загрузки.
- **Expected files/areas:** product image/card components, `src/features/products/components/productImageFallback.js`, styles карточки и `src/pages/ProductDetailsPage` только для общего image slot.
- **Automated checks:** lint, build, существующие catalog tests; узкие component checks для loading/error/fallback и сохранения размеров, если добавляется новая логика.
- **Manual QA:** медленная и недоступная внешняя картинка, пустой URL, нормальная загрузка, несколько рядов, 320/390/768/1280/1440 px; убедиться, что места зарезервированы и карточки не скачут.
- **Критерии завершения:** изображение, placeholder и fallback занимают одинаковую область; недоступный внешний image URL не ломает карточку; ограничения snapshot отражены в проверке.

### SHOP-UI-03 — Filters UI and catalog result states

- **Release class:** A — PRODUCTION V1 BLOCKING.
- **Цель:** сделать состояние поиска/фильтров читаемым и исключить противоречивые сообщения выдачи.
- **Scope:** UI выбора нескольких категорий и диапазона цен поверх контрактов SHOP-03; badge числа активных фильтров и доступный tooltip/summary с конкретными активными значениями и сбросом; убрать мигание при смене поиска и фильтров (T-015); взаимоисключающие loading, empty-result, error и end-of-pagination presentations, включая observation API mode из SHOP-03.
- **Не входит:** новый pipeline, count, sort semantics, query adapter или debounce SHOP-02/03; общая архитектура EmptyState/Error Boundary из SHOP-CATALOG-POLISH; изменение состава товаров.
- **Зависимости:** SHOP-03, SHOP-UI-01; независимо от image ticket.
- **Expected files/areas:** `src/features/products/components/Sidebar.jsx`, `CategoryFilter.jsx`, `SearchInput.jsx`, `src/pages/ProductsPage`, локали RU/EN и соответствующие styles.
- **Automated checks:** lint, build; component/integration regression для badge/summary и переходов loading→empty/end, в том числе API mode, без изменения результатов SHOP-03.
- **Manual QA:** несколько категорий + цена + поиск + сброс, 0 результатов, последняя страница, ошибка/retry, fixture/API mode, клавиатура, touch, RU/EN, light/dark и узкий viewport.
- **Критерии завершения:** badge и summary точно отражают активные фильтры; empty и end никогда не видны одновременно; переходы не мигают старыми состояниями; count/выборка SHOP-03 не меняются.

### SHOP-UI-04 — Cart controls and thumbnails

- **Release class:** A — PRODUCTION V1 BLOCKING.
- **Цель:** сделать корзину удобной при сохранении её существующего контракта.
- **Scope:** качественные thumbnail slots/fallback в cart page и drawer; удобные кнопки `−`/`+` вместо number input в соответствии с T-016; видимое empty-cart состояние, disabled/focus/hover и accessible names controls; responsive layout затронутых cart surfaces.
- **Не входит:** checkout semantics SHOP-04, cart persistence/schema SHOP-05, изменение цены/итога/discount contract, новый drawer/page navigation.
- **Зависимости:** SHOP-UI-02 для общего thumbnail/fallback; SHOP-05 только для проверки восстановления количества после refresh и соседних persistence scenarios. Mobile navigation решается отдельно.
- **Expected files/areas:** `src/pages/CartPage`, `src/shared/components/CartDrawer`, cart item UI/styles, image fallback и локали RU/EN при необходимости; `cartSlice` только если существующие actions не позволяют корректный UI без расширения semantics.
- **Automated checks:** lint, build; component/integration tests для `+`/`−`, границ количества, удаления/пустой корзины и сохранения прежнего итога.
- **Manual QA:** добавить/изменить/удалить товар, пустая корзина, битая картинка, keyboard/touch, 320/390/768/1280/1440 px, light/dark, RU/EN; сверить итог до/после и отсутствие влияния на demo-checkout.
- **Критерии завершения:** controls понятны и доступны, thumbnail стабилен, пустая корзина однозначна, итог и SHOP-04 сценарий не изменены.

### SHOP-UI-DEC — Mobile cart/profile UX decision (non-runtime)

- **Release class:** B — POST-V1 / PRODUCT ENHANCEMENT; decision gate перед SHOP-UI-05, если текущий mobile flow пройдёт v1 accessibility/responsive gate. Выявленный blocker оформляется и исправляется в текущем core UI scope до SHOP-90.
- **Цель:** явно решить T-022 на основании существующих cart/profile pages и drawers.
- **Scope:** описать текущие mobile entry points, сравнить drawers и отдельные pages по навигации, возврату, доступности и согласованности, предложить один вариант и получить отдельное UX-утверждение до реализации SHOP-UI-05; указать судьбу cart icon in drawer (T-023) для выбранного варианта.
- **Не входит:** runtime-код, CSS и молчаливая замена mobile flow. При отсутствии утверждённого решения SHOP-UI-05 не стартует.
- **Зависимости:** оценка после SHOP-UI-04; блокирует SHOP-UI-05.
- **Expected files/areas:** отдельная запись решения в `ROADMAP.md` или явно согласованная UX decision note.
- **Automated checks:** проверка ссылок/структуры документа и `git diff --check`; runtime checks неприменимы к чисто документальному решению.
- **Manual review:** пользователь утверждает выбранный mobile flow и последствия для drawer/icon.
- **Критерии завершения:** вариант и причины записаны, граница SHOP-UI-05 определена, есть явное подтверждение решения.

### SHOP-UI-05 — Mobile cart/profile flow

- **Release class:** B — POST-V1 / PRODUCT ENHANCEMENT; не блокирует v1 при работоспособном и доступном существующем flow.
- **Цель:** реализовать утверждённый mobile flow для cart/profile без скрытого UX-решения в CSS.
- **Scope:** только согласованная в SHOP-UI-DEC навигация между header, cart/profile page или drawer на mobile, возврат/закрытие, focus/keyboard handling и видимые состояния. Сохранить desktop flow, если решение не требует его изменения.
- **Не входит:** новый auth model SHOP-08, checkout SHOP-04, cart data SHOP-05, массовый redesign header.
- **Зависимости:** SHOP-UI-DEC, SHOP-UI-04, SHOP-08.
- **Expected files/areas:** `src/shared/components/Header`, `CartDrawer`, `ProfileDrawer`, `src/pages/CartPage`, `ProfilePage`, маршрутизация `src/app/App.jsx` только если утверждены mobile pages.
- **Automated checks:** lint, build; navigation/component tests для выбранного mobile route/drawer, возврата и клавиатуры.
- **Manual QA:** 320/390/768 px mobile и 1280/1440 px desktop, открыть/закрыть/вернуться, keyboard и touch, пустая корзина, demo-session profile, light/dark и RU/EN.
- **Критерии завершения:** реализован именно утверждённый вариант; пользователь не теряет контекст при возврате; cart/profile доступны клавиатурой; соседние desktop flows сохранены.

### SHOP-UI-06 — Icons, controls and interface states

- **Release class:** A — PRODUCTION V1 BLOCKING для доступных icons/controls/states; декоративные microanimations допускаются в B PR.
- **Цель:** согласовать видимые controls и базовые состояния без массового redesign.
- **Scope:** единый подход к используемым icons (T-017), cart icon в существующем drawer (T-023); последовательные button/hover/focus/disabled states и небольшие microanimations (T-032) с reduced motion; аудит hardcoded UI strings затронутых surfaces и RU/EN (T-012); keyboard usability, loading/empty/error presentations там, где они принадлежат затронутому UI. Если будущий SHOP-UI-DEC выберет иной mobile flow, placement корректируется в SHOP-UI-05.
- **Не входит:** замена всего component library, новый общий Error Boundary/EmptyState, логика авторизации/корзины/каталога, animation redesign.
- **Зависимости:** SHOP-UI-01 для базового layout; SHOP-CATALOG-POLISH/SHOP-RESILIENCE нужны для общих error/empty primitives, если они затронуты. Не зависит от SHOP-UI-05 или SHOP-UI-DEC.
- **Expected files/areas:** `src/shared/icons`, `src/shared/ui/Button`, header/drawer controls, затронутые CSS modules, `src/shared/lib/locales/ru|en/translation.json`.
- **Automated checks:** lint, build; узкие component/accessibility checks для names, focus/disabled и reduced-motion поведения при новой логике.
- **Manual QA:** keyboard tab/activate, focus visibility, disabled/hover, reduced motion, light/dark, RU/EN и длинные labels на 320/390/768/1280/1440 px.
- **Критерии завершения:** icons и controls на затронутых экранах последовательны; нет безымянных интерактивных иконок или недоступного фокуса; анимация не мешает reduced-motion; строки согласованы в RU/EN.

### SHOP-UI-07 — Targeted CSS cleanup

- **Release class:** B — POST-V1 / PRODUCT ENHANCEMENT; конкретный CSS дефект, нарушающий v1 acceptance, исправляется раньше в своём A ticket.
- **Цель:** убрать подтверждённые дубли и устаревшие правила после UI-изменений.
- **Scope:** аудит текущего порядка импортов `global.css` → `variables.css` в `src/main.jsx` (T-010), дублированных/неиспользуемых selectors и конфликтующих declarations (T-031); минимальные удаления или перестановки с документируемой причиной и проверкой затронутых экранов.
- **Не входит:** mass refactor, переименование всех классов, новый design system, Vite aliases (T-011), правки бизнес-логики или новые UX-решения.
- **Зависимости:** SHOP-UI-01…06; отдельный reviewable PR только для подтверждённых CSS проблем.
- **Expected files/areas:** `src/shared/styles/variables.css`, `global.css`, конкретные CSS modules, `src/main.jsx` только если порядок импортов действительно нарушен.
- **Automated checks:** lint, build, существующие tests; targeted style/render checks для каждого удалённого или переставленного правила при наличии покрытия.
- **Manual QA:** affected screens до/после в light/dark, RU/EN и 320/390/768/1280/1440 px; проверить cascade, spacing, alignment, focus и отсутствие горизонтального скролла.
- **Критерии завершения:** каждый cleanup имеет конкретное основание и не меняет намеренный UI; порядок variables/global предсказуем; визуальных регрессий нет.

### Mapping исходных и связанных UI требований

| Requirement / observation | SHOP-UI ticket | Граница с другими этапами |
| --- | --- | --- |
| T-010, T-031 — порядок global variables, CSS audit | SHOP-UI-07 | Только точечный cleanup; T-011 Vite aliases остаётся SHOP-06. |
| T-016 — cart +/- и thumbnails | SHOP-UI-04 | Не менять SHOP-04 checkout и SHOP-05 persistence. |
| T-017 — icon system | SHOP-UI-06 | Без массового redesign. |
| T-022 — mobile cart/profile pages vs drawers | SHOP-UI-DEC → SHOP-UI-05 | UX decision явно утверждается до runtime PR. |
| T-023 — cart icon in drawer | SHOP-UI-06 | В существующем drawer для v1; SHOP-UI-DEC решает будущее mobile placement. |
| T-030 — responsive 320–1440 | SHOP-UI-01, затронутые surfaces в SHOP-UI-02…07 | SHOP-90 выполняет итоговую комплексную проверку. |
| T-032 — microanimations | SHOP-UI-06 | Reduced motion и keyboard/focus. |
| T-033/T-034 — preload/loading и image optimization | SHOP-UI-02 для видимых image slots/loading/fallback | Источник, lazy/preload и delivery optimization — SHOP-CATALOG-POLISH. |
| T-012 — hardcoded strings, RU/EN | SHOP-UI-03/04/05 для новых строк; SHOP-UI-06 для общего аудита | Не менять i18n architecture. |
| T-015 — отсутствие мигания поиска/фильтров | SHOP-UI-03 | Комбинации и debounce принадлежат SHOP-03/SHOP-02. |
| SHOP-03 — multi-category, price, active-filter count/summary | SHOP-UI-03 | Data semantics, count и adapter остаются SHOP-03. |
| SHOP-03 observation — одновременные empty/end сообщения в API mode | SHOP-UI-03 | Follow-up представления, не дефект SHOP-03. |
| Card geometry, rows, spacing, alignment, centering | SHOP-UI-01 | SHOP-90 подтверждает результат. |
| Image slot, placeholder/fallback, внешний snapshot | SHOP-UI-02 | SHOP-CATALOG-POLISH владеет загрузкой и оптимизацией. |
| Cart empty state | SHOP-UI-04 | Общий EmptyState — SHOP-CATALOG-POLISH. |
| Loading/empty/error, disabled/hover/focus, keyboard, light/dark, RU/EN и длинные названия | SHOP-UI-01…06 по затронутым surfaces | SHOP-90 — финальный comprehensive QA gate. |

Запись «Названание 1-1-7» сохраняет статус `SOURCE UNAVAILABLE / NEEDS CLARIFICATION`; ни один SHOP-UI ticket не приписывает ей содержание.

---

## SHOP-90 — Interface Quality

Статус: NOT STARTED.

Цель:
провести финальный QA gate для доступности, адаптивности и визуальной устойчивости после implementation stages.

Проблема (сформулирована из цели и критериев плана):
доступность, responsive-поведение и визуальная устойчивость интерфейса требуют подтверждения проверками.

Основные изменения:

- добавить Playwright E2E;

- axe-проверки;

- visual regression screenshots;

- loading/empty/error состояния, где применимо;

- responsive проверки 320/390/768/1280/1440;

- keyboard accessibility;

- light/dark;

- длинные названия товаров;

- RU/EN и mobile cart/profile flows;

- фильтры и их активные состояния после SHOP-03/SHOP-UI.

- критические flows и деградацию из сквозной testing strategy; visual baseline минимум 390/1280 в light/dark, расширение по риску, а не screenshots каждого состояния;

- сверить bundle budget, API contract/mock adapter parity и отсутствие секретов вместе с профильными gates.

Acceptance criteria:

- основные сценарии работают клавиатурой;

- фокус видим;

- controls имеют accessible names;

- нет известных serious/critical accessibility нарушений;

- нет горизонтального скролла страницы;

- нет существенных layout shifts;

- ключевые визуальные состояния покрыты baseline.

Необходимые tests (из изменений и acceptance criteria плана):

- Playwright E2E основных пользовательских сценариев;

- axe и ручная проверка клавиатуры, видимого фокуса и accessible names;

- visual regression ключевых состояний, light/dark, RU/EN, длинных названий и mobile flows;

- responsive verification на 320/390/768/1280/1440, включая отсутствие горизонтального скролла и существенных layout shifts;

- targeted checks на 480/1024 и 1440+ для затронутых catalog/PDP/cart/checkout/profile/orders surfaces;

- проверки loading/empty/error состояний и комбинаций фильтров, где применимо.

Рекомендуемая branch:
test/shop-90-interface

Рекомендуемый commit message:
test(shop): cover accessible responsive journeys

Зависимости:
SHOP-04…08, core SHOP-COMMERCE-FLOW, core SHOP-CATALOG-POLISH, A tickets SHOP-UI-01/02/03/04/06 и A scope SHOP-ARCH, SHOP-API-CONTRACT, SHOP-MOCK-API, SHOP-RESILIENCE, SHOP-PERF, SHOP-OBSERVABILITY baseline, SHOP-SECURITY. SHOP-ACCOUNT, SHOP-COMMERCE-CONTENT, SHOP-UI-DEC/05/07 и advanced catalog/analytics B scope не блокируют v1. SHOP-90 проверяет итоговую систему, а не откладывает implementation fixes до финала.

Риски:
flaky screenshots и слишком широкий scope; крупные независимые дефекты выносить отдельно.

---

## SHOP-91 — GitHub Pages Deployment

Статус: NOT STARTED.

Цель:
дать воспроизводимый публичный demo.

Проблема (сформулирована из цели и критериев плана):
публичный demo требует воспроизводимого deployment с проверкой project-subpath, маршрутов и assets.

Основные изменения:

- Pages workflow после успешных checks;

- корректный base path;

- SPA routing, пригодный для Pages;

- deploy только из доверенной ветки;

- post-deploy smoke.

- PR pipeline target: lint, typecheck, unit/integration, E2E, accessibility, build, bundle budget, visual smoke; `npm run verify` как будущий единый локальный pre-PR entry point;

- `main` pipeline target: build, deploy, smoke опубликованной версии с проверенным commit;

- учесть canonical/deep-link/refresh-safe SPA routing и документировать ограничения GitHub Pages по headers и server rendering.

Acceptance criteria:

- приложение работает под /MyMyShop/;

- refresh поддерживаемых маршрутов не даёт 404;

- assets загружаются;

- в bundle нет secrets;

- известен commit deployment.

Необходимые tests:

- E2E production build под project-subpath;

- post-deploy smoke;

- artifact validation.

Рекомендуемая branch:
ci/shop-91-pages

Рекомендуемый commit message:
ci(shop): deploy verified Pages demo

Зависимости:
SHOP-90

Риски:
различия local preview и GitHub Pages, cache и routing.

---

## SHOP-92 — Release Readiness

Статус: NOT STARTED.

Цель:
подтвердить и документировать production-oriented frontend readiness для пользователя и проверяющего.

Проблема (сформулирована из цели и критериев плана):
готовность портфельного релиза требует документации фактических возможностей и ограничений и связи с проверенным commit.

Production-readiness audit должен подтвердить: нет white screens, случайного console noise, dead routes, broken links, fake security и случайного business behavior; pricing/discounts детерминированы; loading/empty/error предсказуемы; основные keyboard flows доступны; layout устойчив и без horizontal overflow/существенных shifts; production bundle вписывается в согласованный budget; API contracts и границы demo/mock/real adapters документированы; нет client secrets; production build чист; GitHub Pages demo работает без credentials. README объясняет архитектуру, trade-offs, setup и известные ограничения, а все T-001…T-039 имеют финальный disposition.

Основные изменения:
README с:

- назначением;

- screenshots;

- demo;

- установкой;

- реальными scripts;

- архитектурой;

- тестами;

- demo-session;

- локальными заказами;

- fixture/API modes;

- отсутствием реальных платежей;

- deployment;

- known limitations;

- rollback/release notes.

- итоговая traceability table по каждому исходному требованию: original requirement, implemented, replaced, deferred, excluded, known limitation; сверить её с матрицей выше и фактическим release commit.

Acceptance criteria:

- README выполняется в чистом checkout;

- README не обещает отсутствующие функции;

- release привязан к проверенному commit;

- нет открытых release-blocking дефектов;

- ограничения перечислены честно.

Необходимые tests:

- повтор инструкций README;

- весь CI-набор;

- smoke опубликованного demo;

- ручная проверка ссылок.

Рекомендуемая branch:
docs/shop-92-release

Рекомендуемый commit message:
docs(shop): document verified portfolio release

Зависимости:
SHOP-91 и все A — PRODUCTION V1 BLOCKING tickets/epics. B product enhancements и C integrations не блокируют frontend release; если не реализованы, их статус и ограничения указать явно.

Риски:
не называть проект production-ready без соответствующих доказательств.

---

## SHOP-BACKEND-REF — Optional reference backend

Статус: PLANNED. Release class: **C — OPTIONAL INTEGRATION**; поздний reference backend не блокирует SHOP-90/91/92 или завершение frontend.

Цель: показать, что независимый backend может обслуживать SHOP-API-CONTRACT. Предпочтителен небольшой Node.js + Fastify или эквивалент: routes → services → repositories → adapters, `MemoryRepository` с заменяемым будущим `PostgresRepository`. Минимальный contract: `GET /products`, `GET /products/:id`, auth/session endpoints, cart, checkout и orders. Contract tests подтверждают совместимость с frontend adapters. Не строить microservices, production payment или обязательную БД; реальные credentials/secrets остаются только на server side. Backend security проектируется отдельно и не объявляется выполненной SHOP-SECURITY frontend проверкой.

Зависимости: SHOP-API-CONTRACT и SHOP-ARCH; по желанию после frontend release.

---

## SHOP-INTEGRATION-TELEGRAM — Optional support/notification integration

Статус: PLANNED. Release class: **C — OPTIONAL INTEGRATION**; feature-flagged Telegram не блокирует frontend release и не делает AI chatbot обязательным.

Цель: реальный полезный канал для order-created/status notification, support request, contact-operator flow или ограниченного demo notification channel. `NotificationService` имеет Noop/DemoNotificationAdapter, TelegramBotAdapter и возможный будущий Email/Webhook adapter. Frontend вызывает только безопасный backend notification endpoint; Telegram bot token никогда не хранится в frontend и требует backend/serverless/SHOP-BACKEND-REF boundary. Передача персональных данных минимальна и обоснована, события не должны содержать ненужный PII. Отказ канала не ломает checkout. Для in-app support сначала rule-based/non-AI flow; AI adapter — только optional future extension вне business-critical checkout.

Зависимости: SHOP-API-CONTRACT/SHOP-ARCH и отдельная server-side boundary; SHOP-BACKEND-REF может её предоставить, но не обязателен при другом безопасном backend/serverless варианте.

---

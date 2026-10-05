# MyMyShop — Roadmap

## Target State

MyMyShop должен стать основным React/TypeScript-кейсом портфеля:

- демонстрационный магазин;

- React + Redux Toolkit / RTK Query;

- TypeScript на ключевых domain/API границах;

- безопасный demo-mode;

- рабочий поиск, фильтрация и корзина;

- локальный demo-checkout;

- unit/integration/E2E tests;

- visual regression;

- accessibility и responsive verification;

- CI;

- GitHub Pages deployment;

- README, соответствующий реальному поведению.

Магазин показывает обработку ошибок и качественный UX. Посетитель может найти товар, изменить корзину и создать локальный демонстрационный заказ. Реальные credentials и оплата не запрашиваются.

## Основание и порядок работы

Источник: утверждённый пользователем Master Development Plan для MyMyShop и утверждённый Backlog Reconciliation Audit для исходных T-001…T-039. Статусы отражают состояние после merge SHOP-00, SHOP-01 и SHOP-02 в main; остальные этапы остаются планом. Этот roadmap сам по себе не начинает следующий ticket.

Рекомендуемые branch и commit message исходных SHOP-tickets сохранены из плана. Поля «Проблема» для SHOP-90/91/92 и tests для SHOP-90 сформулированы из их целей, изменений и acceptance criteria, поскольку отдельных полей в источнике нет. Это не дополнительные требования.

Каждый ticket начинается только после явного подтверждения пользователя и выполняется по [CODEX_WORKFLOW.md](CODEX_WORKFLOW.md). Зависимости перечислены в каждом ticket.

Порядок основных этапов: SHOP-00 → SHOP-01/SHOP-02 → SHOP-03/SHOP-04 → SHOP-05 → SHOP-06 → SHOP-07 → SHOP-08 → SHOP-CATALOG-POLISH/SHOP-COMMERCE-CONTENT/SHOP-UI → SHOP-90 → SHOP-91 → SHOP-92. Параллельность допустима только с учётом зависимостей конкретного этапа.

## Traceability / Reconciliation — исходный backlog T-001…T-039

Матрица основана на утверждённом Backlog Reconciliation Audit из постановки SHOP-GOV-02, уточнениях аудита и текущем состоянии main. Исходный полный текст backlog в репозитории отсутствует, но формулировки T-001…T-039 предоставлены в аудите. `SOURCE UNAVAILABLE` применяется только к записям без спецификации: назначение, критерии и реализацию нельзя придумывать. `PARTIALLY IMPLEMENTED` фиксирует видимый задел, но не закрывает требование целиком. `PLANNED` означает roadmap mapping, а не начатую работу. `REPLACED / SUPERSEDED BY APPROVED ARCHITECTURE` означает сознательно изменённый контракт, который нельзя считать исходным `IMPLEMENTED`.

| Original requirement | Судьба | Roadmap mapping / ограничение |
| --- | --- | --- |
| T-001 — прежний mock-auth / ProtectedRoute | REPLACED / SUPERSEDED BY APPROVED ARCHITECTURE | SHOP-01 demo-session уже merged; старую модель credentials и ложную защищённость не восстанавливать. |
| T-002 — исправить категории, убрать дубли фильтров | PARTIALLY IMPLEMENTED | SHOP-02 исправил работу категорий; устранение дублей фильтров и согласованное состояние в SHOP-03. |
| T-003 — единая скидка для badge и цены | PLANNED | SHOP-CATALOG-POLISH. |
| T-004 — убрать `console.log` / `alert` из продуктовых сценариев | PLANNED | SHOP-CATALOG-POLISH, заменить на согласованные пользовательские уведомления при необходимости. |
| T-005 — корректная прокрутка Product Details | PLANNED | SHOP-CATALOG-POLISH. |
| T-006 — слой entities для Product/User/Cart/Order | PLANNED | SHOP-06, типизированные domain entities и границы. |
| T-007 — вынести нормализацию товаров из страниц и sale | PLANNED | SHOP-06, единая нормализация на domain/API границе. |
| T-008 — дублирующие hooks прокрутки | PLANNED | SHOP-CATALOG-POLISH. |
| T-009 — пересмотр `forwardRef` для React 19 | PLANNED | SHOP-07, проверить необходимость при текущей версии React 19 и совместимость компонентов. |
| T-010 — порядок `variables.css`/`global.css` | PLANNED | SHOP-UI. |
| T-011 — Vite aliases | PLANNED | SHOP-06, в рамках миграции domain/API модулей. |
| T-012 — hardcoded strings/i18n | PARTIALLY IMPLEMENTED | RU/EN инфраструктура есть; аудит оставшихся строк в SHOP-UI. |
| T-013 — Error Boundary / уведомления / общий error handling | PLANNED | SHOP-CATALOG-POLISH. |
| T-014 — не показывать поисковую подсказку до ввода | PLANNED | SHOP-CATALOG-POLISH, поведение подсказки в продуктовых сценариях. |
| T-015 — согласовать поиск и фильтры, debounce, убрать мигание состояний | PARTIALLY IMPLEMENTED | Debounce уже реализован SHOP-02; согласование комбинаций в SHOP-03, отсутствие мигания в SHOP-UI и regression checks SHOP-90. |
| T-016 — +/- и изображения корзины | PLANNED | SHOP-UI. |
| T-017 — единая система иконок | PLANNED | SHOP-UI. |
| T-018 — Price abstraction | PLANNED | SHOP-06, единый domain contract. |
| T-019 — Currency abstraction | PLANNED | SHOP-06, форматирование и границы валюты. |
| T-020 — общий EmptyState | PLANNED | SHOP-CATALOG-POLISH. |
| T-021 — 404 route | PLANNED | SHOP-CATALOG-POLISH. |
| T-022 — mobile cart/profile pages | PARTIALLY IMPLEMENTED | Страницы существуют; mobile UX вместо drawers уточнить и реализовать в SHOP-UI, если он остаётся утверждённым. |
| T-023 — cart icon in drawer | PLANNED | SHOP-UI, в контексте единой системы иконок и решения по mobile drawers. |
| T-024 — delivery details / promo | PARTIALLY IMPLEMENTED | Базовая delivery page есть; детали и promo в SHOP-COMMERCE-CONTENT. |
| T-025 — pickup points / map | PLANNED | SHOP-COMMERCE-CONTENT; конкретный источник данных согласовать перед реализацией. |
| T-026 — реальная/ложная оплата | REPLACED / SUPERSEDED BY APPROVED ARCHITECTURE | SHOP-04 допускает только явно обозначенный локальный demo-checkout без реальных платёжных данных. |
| T-027 — quiz «Не знаю чего хочу» | PLANNED | SHOP-COMMERCE-CONTENT. |
| T-028 — полноценная contact form | PARTIALLY IMPLEMENTED | Форма есть, но сейчас только локально логирует ввод; поведение и ограничения согласовать в SHOP-COMMERCE-CONTENT. |
| T-029 — chatbot | PARTIALLY IMPLEMENTED | Простой локальный chatbot есть; границы и ожидаемый сценарий уточнить в SHOP-COMMERCE-CONTENT. |
| T-030 — полный responsive-аудит 320–1440 px | PLANNED | Исправления в SHOP-UI; итоговая проверка 320/390/768/1280/1440 в SHOP-90. |
| T-031 — CSS audit | PLANNED | SHOP-UI. |
| T-032 — microanimations | PLANNED | SHOP-UI, с учётом доступности и reduced motion. |
| T-033 — lazy/preload | PARTIALLY IMPLEMENTED | Route-level lazy loading есть; недостающие preload/loading решения в SHOP-CATALOG-POLISH и SHOP-UI. |
| T-034 — image optimization | PLANNED | SHOP-CATALOG-POLISH и SHOP-UI. |
| T-035 — bundle analysis/code splitting | PARTIALLY IMPLEMENTED | Route-level splitting есть; bundle analysis и обоснованное дальнейшее splitting в SHOP-CATALOG-POLISH. |
| T-036 — unit/component tests | PARTIALLY IMPLEMENTED | Отдельные unit-проверки добавлены SHOP-00…02; component coverage ещё требуется на implementation stages и к SHOP-90. |
| T-037 — integration tests | PARTIALLY IMPLEMENTED | Базовые проверки добавлены SHOP-00…02; сценарии новых контрактов на каждом stage и итоговая проверка в SHOP-90. |
| T-038 — architecture documentation | PLANNED | SHOP-92, сверить с фактическими контрактами и release commit. |
| T-039 — cart persistence / server sync | REPLACED / SUPERSEDED BY APPROVED ARCHITECTURE | Локальное versioned persistence в SHOP-05; server sync исключена из текущей demo-архитектуры без backend. |

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

Статус: NOT STARTED.

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

Зависимости:
SHOP-01, SHOP-06, SHOP-07.

---

## SHOP-CATALOG-POLISH — Catalog resilience & navigation

Статус: NOT STARTED.

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

Перед реализацией разделить на небольшие PR, если единый diff станет слишком широким. Regression tests покрывают скидку, навигацию, пустые и ошибочные состояния и загрузку изображений.

Зависимости:
SHOP-03, SHOP-06.

---

## SHOP-COMMERCE-CONTENT — Delivery & engagement

Статус: NOT STARTED.

Цель:
довести информационные и демонстрационные сценарии магазина до явно описанного поведения.

Scope:

- детали доставки, промокод и пункты выдачи/карта (T-024/T-025);
- quiz «Не знаю чего хочу» (T-027);
- полноценная contact form (T-028);
- chatbot с явно ограниченным demo-поведением (T-029).

Никаких реальных платежей, отправки заказа продавцу или backend-интеграции эта группа сама по себе не обещает. Конкретные данные, поведение и tests утверждаются перед реализацией; крупную группу разделить на небольшие PR.

Зависимости:
SHOP-04, SHOP-05.

---

## SHOP-UI — Visual and Layout Stabilization

Статус: NOT STARTED. Implementation stage до финального SHOP-90.

Цель:
стабилизировать layout и привести основные состояния интерфейса к единой визуальной системе.

Scope:

- стабильные размеры карточек и изображений, устранение layout shifts;
- более ранняя и равномерная подгрузка карточек, placeholders/skeleton при необходимости;
- сетки, размеры, отступы, центрирование и responsive layout;
- полный responsive-аудит 320–1440 px (T-030) с исправлением выявленных дефектов;
- качество миниатюр корзины и +/- controls количества (T-016);
- единая система иконок, включая иконку корзины в drawer (T-017/T-023);
- mobile cart/profile pages вместо drawers, если этот UX остаётся утверждённым (T-022);
- порядок `variables.css`/`global.css`, CSS audit/cleanup (T-010/T-031);
- согласованные кнопки и состояния, microanimations (T-032);
- устранение hardcoded strings и согласованность RU/EN (T-012);
- счётчик активных фильтров и tooltip/summary их состояния после SHOP-03;
- убрать мигание состояний при совместной работе поиска и фильтров (T-015).

Перед реализацией разбить этап на SHOP-UI-01, SHOP-UI-02 и последующие небольшие PR с собственными критериями и проверками. Основные визуальные исправления реализуются здесь; SHOP-90 проверяет итоговое качество.

Зависимости:
SHOP-03, SHOP-05, SHOP-08; согласовать пересечения по загрузке изображений с SHOP-CATALOG-POLISH.

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

- проверки loading/empty/error состояний и комбинаций фильтров, где применимо.

Рекомендуемая branch:
test/shop-90-interface

Рекомендуемый commit message:
test(shop): cover accessible responsive journeys

Зависимости:
SHOP-08, SHOP-CATALOG-POLISH, SHOP-COMMERCE-CONTENT, SHOP-UI.

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
сделать проект понятным и проверяемым для работодателя.

Проблема (сформулирована из цели и критериев плана):
готовность портфельного релиза требует документации фактических возможностей и ограничений и связи с проверенным commit.

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
SHOP-91 и все предыдущие tickets.

Риски:
не называть проект production-ready без соответствующих доказательств.

---

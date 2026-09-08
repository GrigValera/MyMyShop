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

Источник: утверждённый пользователем Master Development Plan для MyMyShop. Ниже описано планируемое состояние, а не уже реализованные возможности. Все tickets имеют статус NOT STARTED; создание этого roadmap не начинает SHOP-00 или любой следующий ticket.

Рекомендуемые branch и commit message сохранены из плана. Поля «Проблема» для SHOP-90/91/92 и tests для SHOP-90 сформулированы из их целей, изменений и acceptance criteria, поскольку отдельных полей в источнике нет. Это не дополнительные требования.

Каждый ticket начинается только после явного подтверждения пользователя и выполняется по [CODEX_WORKFLOW.md](CODEX_WORKFLOW.md). Зависимости перечислены в каждом ticket.

## SHOP-00 — Foundation

Статус: NOT STARTED.
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

Статус: NOT STARTED.

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

Статус: NOT STARTED.

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

## SHOP-03 — Честная фильтрация и сортировка

Статус: NOT STARTED.

Цель:
сделать результаты понятными и воспроизводимыми.

Проблема:
фильтры работают только по уже загруженным страницам.

Основные изменения:

- для основного demo использовать полный фиксированный набор товаров;

- вынести pipeline поиска/фильтрации/сортировки;

- сохранить внешний API за adapter как дополнительный режим;

- явно показывать источник данных.

Acceptance criteria:

- результат не зависит от прокрутки;

- счётчик совпадает с выборкой;

- комбинации фильтров дают стабильный результат;

- основной demo работает без DummyJSON.

Необходимые tests:

- unit: комбинации и стабильность сортировки;

- integration: adapter и пагинация результата;

- E2E: одинаковая выдача до и после прокрутки.

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

- типизировать Product, CartItem, DemoOrder, query args, store hooks и adapters;

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

## SHOP-90 — Interface Quality

Статус: NOT STARTED.

Цель:
доказать доступность и устойчивость интерфейса.

Проблема (сформулирована из цели и критериев плана):
доступность, responsive-поведение и визуальная устойчивость интерфейса требуют подтверждения проверками.

Основные изменения:

- добавить Playwright E2E;

- axe-проверки;

- visual regression screenshots;

- loading/empty/error состояния, где применимо;

- responsive проверки 320/390/768/1280;

- keyboard accessibility;

- light/dark;

- длинные названия товаров;

- основные локали.

Acceptance criteria:

- основные сценарии работают клавиатурой;

- фокус видим;

- controls имеют accessible names;

- нет известных serious/critical accessibility нарушений;

- нет горизонтального скролла страницы;

- ключевые визуальные состояния покрыты baseline.

Необходимые tests (из изменений и acceptance criteria плана):

- Playwright E2E основных пользовательских сценариев;

- axe и ручная проверка клавиатуры, видимого фокуса и accessible names;

- visual regression ключевых состояний, light/dark, длинных названий и основных локалей;

- responsive verification на 320/390/768/1280, включая отсутствие горизонтального скролла;

- проверки loading/empty/error состояний, где применимо.

Рекомендуемая branch:
test/shop-90-interface

Рекомендуемый commit message:
test(shop): cover accessible responsive journeys

Зависимости:
SHOP-07

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

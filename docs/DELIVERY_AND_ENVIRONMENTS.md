# Поставка и среды

**SHOP-AUTH-SESSION-02:** backend проверяет публичные demo credentials и выдаёт сессию постоянному demo actor в SQLite только при `ENABLE_DEMO_SIGN_IN=true` в development/test/demo. `PUBLIC_ORIGIN` обязателен; demo/production требуют HTTPS. Локальная сборка и Vite preview используют `/api` proxy, а прямые SPA URL при публичном размещении требуют fallback. В production без identity integration создание сессии запрещено; ранее выданные demo sessions также не принимаются. До открытого demo deployment нужны rate limiting/abuse protection для попыток входа, постоянная БД, HTTPS и проверка операционного восстановления. Cookie содержит непрозрачный токен, БД — только его SHA-256; срок действия фиксирован на семь суток. Старый test actor остаётся отдельным loopback diagnostic mechanism.

| Среда | Назначение | Фактическое состояние | Статус |
| --- | --- | --- | --- |
| Локальная разработка | Работа с Vite dev server | Доступна команда `npm run dev` | CURRENT |
| Локальный backend foundation | Отдельный Fastify API с SQLite | `npm run server:migrate`, затем `npm run server:start`; development/test actor только по явному флагу | CURRENT |
| Локальная проверка production-сборки | Просмотр собранной SPA через Vite preview | `npm run build`, затем `npm run preview`; для runtime tickets действует ручной QA | CURRENT процесс |
| CI | Базовые проверки pull request на Linux | GitHub Actions выполняет установку, lint, backend tests, Playwright в Chromium и сборку через `npm test` | CURRENT конфигурация; конкретный запуск требует PR |
| Статический demo | Возможное публичное размещение текущего frontend | GitHub Pages — кандидат только при совместимости static hosting и прямых SPA-маршрутов | PLANNED публикация |
| Функциональный public demo | Стабильная ссылка, показанные в UI demo credentials и связные demo/test journeys | Может потребовать demo backend, persistent test data и reset/seed; provider размещения не выбран | PLANNED целевой showcase |
| Приложение с backend | Реальные операции магазина | Размещение, поставщик, backend и эксплуатационные контроли не выбраны | PLANNED |

Vite dev предназначен для разработки. Preview локально обслуживает production-сборку, но не является развёрнутой системой. Статический demo без backend показывает каталог и корзину; demo-сессии нужен работающий API. Реальные платежи и исполнение заказов отсутствуют. Настоящему приложению нужны запланированные серверные, защитные, информационные и операционные части. В текущем `vite.config.js` нет настройки базового пути GitHub Pages или fallback для маршрутов SPA; [ROADMAP](../ROADMAP.md) относит проверку размещения к SHOP-91/92.

**SHOP-INTEGRATIONS-01 — PROPOSED modes:** CURRENT каталог работает без backend; demo-вход требует backend и публичные credentials; TARGET public `demo` может использовать отдельный demo/test API и хранилище для связного Order flow без реальных списаний. `sandbox` использует собственный test backend и серверные test secrets; `backend` предполагает отдельно развёрнутый API и environment-specific secrets. `VITE_APP_DATA_MODE` и `VITE_APP_API_BASE_URL` — предложенные имена, runtime их пока не читает. Сбой sandbox операции не переключает её на успешный demo adapter. `VITE_*` попадает в браузерный bundle и не хранит секреты. Стабильный публичный URL обязателен для будущего portfolio review, но выбор hosting и решение о live providers остаются отдельными gates. См. [стратегию интеграций](INTEGRATION_STRATEGY.md).

**SHOP-BACKEND-FOUNDATION-01 — CURRENT server modes:** `APP_ENV=development|test|demo|production` управляет отдельным API, не frontend adapter. Test actor разрешён только в development/test, при `ENABLE_TEST_ACTOR=true` и loopback host; включение в demo/production останавливает запуск. `test` использует изолированный файл БД, demo/production требуют явный абсолютный `DATABASE_PATH`. Никаких provider calls или секретов поставщиков foundation не выполняет. `demo` здесь не означает готовый публичный demo backend: `/me` без настоящей сессии возвращает `401`.

## Требования к качеству

**CURRENT — частичный задел:** RU/EN, мобильная навигация, загрузка/заглушки изображений, состояния загрузки/ошибки/пустой выдачи в каталоге, проверка локальных данных корзины, Playwright и CI. Это не доказывает полной доступности, устойчивости, производительности или готовности к production.

**PLANNED — цели:** управление с клавиатуры, фокус, семантическая разметка и удобные сенсорные цели; проверка ширин 320–1440+ px; безопасная обработка ошибок без пустого экрана и с повтором; серверная проверка чувствительных операций; измерение размера bundle и загрузки изображений; при необходимости ошибки frontend, серверные журналы, состояние интеграций и аудит заказов/платежей. Числа SLO/SLA, размещение, инструмент телеметрии и бюджет производительности остаются открытыми. Реализация и проверки относятся к runtime tickets.

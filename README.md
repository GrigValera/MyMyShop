# MyMyShop

Демонстрационный магазин: React, JavaScript, Redux Toolkit / RTK Query, Vite.
Реальных заказов и платежей нет. TypeScript пока не настроен.

## SHOP-00: воспроизводимый запуск

Поддерживаемая пара: **Node 24.12.0 / npm 11.7.0**. Node также закреплён в
`.nvmrc`, версии проверяются через `engines` и `.npmrc` (`engine-strict=true`).
Установите эту пару до `npm ci`. Существующий lockfile сохранён без обновления
зависимостей приложения; добавлен только Playwright и его зависимости.

В чистом checkout:

```sh
node --version
npm --version
npm ci
npx playwright install chromium
npm run lint
npm test
git diff --check
```

На Linux: `npx playwright install --with-deps chromium` для системных библиотек
(может требоваться sudo).

## Команды

- `npm run dev` — development server.
- `npm run lint` — ESLint всего проекта.
- `npm run build` — production build в `dist/`.
- `npm test` — новый production build, затем два Playwright-теста Chromium.
- `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` — просмотр `dist/`.

Production preview: http://127.0.0.1:4173/ . Сначала выполните `npm run build`.
Перед `npm test` освободите порт 4173: тесты намеренно запускают собственный preview.

## Tests и CI

`tests/baseline.spec.js`: browser integration реального entry point с отображением
API-товара; E2E добавления товара, повторного добавления, изменения количества,
перехода в корзину и удаления до пустого состояния. Только DummyJSON заменяется
тестовым ответом; entry point, Redux и маршруты работают реально. Случайная скидка
не фиксируется, тест не подтверждает корректность скидок.

Linux PR workflow `.github/workflows/pr.yml`: Node/npm → npm ci → lint → Chromium
→ npm test (включает production build) → diff checks. Actions закреплены на SHA,
проверенные через git ls-remote официальных репозиториев. Только contents: read,
checkout credentials не сохраняются, deployment secrets/environments не используются.
Нет continue-on-error и retries. Фактический GitHub PR run требует отдельно разрешённых
commit/push и PR; локальный запуск не подтверждает Linux CI.
Отдельные unit runner, typecheck, visual regression и axe не настроены.

## Известные дефекты

- SHOP-01: plaintext-пароли, Base64-токены и доверие localStorage. Только demo-данные.
- SHOP-02: поиск/категория читают параметры вне queryArg.
- SHOP-03: фильтры работают лишь по загруженным страницам; зависимость от DummyJSON.
  При недоступном API главная может оставаться пустой/повторять загрузку.
- Значок скидки и цена используют два независимых случайных значения.
- Drawer checkout ведёт на отсутствующий `/checkout`.
- SHOP-04: checkout страницы корзины показывает alert/console и очищает корзину,
  заказ не сохраняется и продавцу не отправляется.
- SHOP-05: корзина теряется при refresh; reducer темы обращается к storage.
- Online `npm audit` 2026-09-08: 8 затронутых пакетов (7 high, 1 low):
  @babel/core (low), brace-expansion, browserslist, nanoid, postcss, react-router,
  react-router-dom, vite (high). Это registry findings, применимость всех advisories
  к SPA ещё не установлена. Анализ и обновления — SHOP-07; npm audit fix не выполнялся.
  Offline сообщение «0 vulnerabilities» не является security-проверкой.

## Manual QA: именно production build

Новый профиль/приватное окно, русский язык, только безопасные demo-данные.

- [ ] Главная: шапка, «Ограниченное предложение», товары (нужен живой DummyJSON).
- [ ] Дважды добавить один товар: drawer показывает одну позицию, количество 2.
- [ ] Изменить количество на 3; «Перейти в корзину»: тот же товар, количество 3,
  сумма позиции равна цене × 3.
- [ ] Удалить: показано «Здесь пока пусто, пора это исправить!».
- [ ] Открыть «О нас», вернуться; переключить язык и тему, проверить консоль.
- [ ] Повторить основной сценарий при ширине 390 и 1280 px: controls доступны.
- [ ] Refresh `/cart`: пустая корзина — известное ограничение.
- [ ] README-команды и diff соответствуют SHOP-00; src не менялся.

Сбой живого API фиксируйте отдельно от тестов с mock API.
Реальные платежи/заказ: NOT APPLICABLE, backend отсутствует.

## Откат

База: ticket/SHOP-GOV-governance, HEAD 5134169fbf4b35bd51de5dc45641a0c460f8cf74.
Нет миграций данных и публикации. До commit базу можно изучить в отдельном checkout,
сохранив текущие изменения. После разрешённого commit — согласованный revert SHOP-00,
затем npm ci, применимые проверки, build и manual QA. Автоматического reset нет.

# UX / Product audit — SHOP-ACCOUNT-02

Дата: 2026-10-10. Статус: retrospective review текущей рабочей ветки, до ручной приёмки. Метод: изучение опубликованных UX-исследований и документации зрелых продуктов, чтение реализации и существующих E2E, выборочная проверка production preview: Home на desktop/mobile, Catalog/PDP/Cart на mobile, Account и Profile на desktop/mobile. Это экспертная оценка интерфейса и контрактов, не пользовательское исследование и не доказательство готовности будущих доменов.

## Account benchmark и решение до runtime-изменений

**Jobs:** узнать, кто вошёл; быстро открыть профиль, корзину, заказы, адреса, отзывы и настройки; безопасно выйти. На малом экране полезные действия должны появляться до вспомогательной навигации. Редактирование имени и аватара должно быть самостоятельной понятной задачей.

**Источники и продукты:** [Baymard Account Dashboard](https://baymard.com/ecommerce-design-examples/58-account-dashboard), [Baymard Self-Service](https://baymard.com/research/self-service), [Baymard о навигации кабинета](https://baymard.com/research-articles/use-icons-in-the-account-dashboard), [WAI о структуре навигации](https://www.w3.org/WAI/tutorials/menus/structure/); официальная документация [Shopify Customer Accounts](https://help.shopify.com/en/manual/customers/customer-accounts/new-customer-accounts), [Walmart Account](https://www.walmart.com/help/article/create-or-edit-an-account/147a20c9cada4d75b8e0128b16fb6fda) и [Amazon Your Account](https://digprjsurvey.amazon.com/csad/help/node/GSD587LKW72HKU2V). Повторяются конкретные направления по задаче клиента, понятная группировка, отдельное редактирование профиля и доступный выход. Это вывод из источников применительно к нашему ограниченному demo scope, а не утверждение об одинаковом layout этих сервисов.

**Решение:** оставить уже созданную в текущем ticket модель: на mobile Account Home с пользователем и прямыми сгруппированными строками; на desktop устойчивую боковую навигацию и основную область; `/account/profile` как отдельный редактор. Корзина показывает реальное количество; неготовые Orders/Addresses/Reviews/Settings открывают честные страницы состояния без вымышленных записей. На mobile выход размещён только после направлений Account Home; вложенные страницы дают явную ссылку назад, без повторной кнопки выхода. На desktop выход остаётся отдельным действием в sidebar. Небольшой Demo badge и одна короткая note сообщают ограничение сервиса. В RU/EN и light/dark сохраняются те же IA и приоритеты; на tablet композиция должна переходить без обрезки и горизонтального скролла. Активный пункт, семантические ссылки и клавиатурный focus остаются видимыми.

**Отклонены для текущих пяти направлений:** dropdown как единственный вход, dashboard из больших равноправных карточек, многочисленные декоративные иконки, ложные заказы/статусы, длинное demo объяснение перед задачами. Длинные текстовые списки в крупном кабинете могут потребовать иконок с подписями согласно Baymard; текущая краткая группировка этого не требует. После benchmark новых runtime правок Account не понадобилось: существующая модель соответствует решению. Это решение не закрывает ручной product review.

## Матрица поверхностей

Приоритет: P0 — риск ложного завершения ключевой операции; P1 — существенный дефект доверия или понимания; P2 — согласованность и заметное качество. Классы применены к конкретной находке, а не ко всей странице.

| Surface / user job | Текущий pattern и сила | Находка / evidence | Класс / приоритет | Действие |
| --- | --- | --- | --- | --- |
| Header, MobileNavigation, Footer / перейти в раздел | Глобальные ссылки и нижняя mobile навигация дают стабильные входы; есть отдельные тесты адаптива | В mobile Header подписи `Theme` и `Language` не локализованы (`src/shared/components/Header/Header.jsx:163-168`) | POLISH / P2 | SHOP-UX-SYSTEM-01 |
| ChatBot / получить помощь | Локальный помощник доступен на страницах | После локального ответа copy обещает контакт поддержки, хотя отправки нет (`src/shared/components/ChatBot/ChatBot.jsx`, `src/shared/lib/locales/ru/translation.json:200`) | UX DEBT + DOMAIN GAP / P1 | SHOP-UX-SUPPORT-01 |
| Login, Register, Forgot Password / войти или восстановить доступ | Формы и честные ограничения demo пути существуют; session изолирована от cart | Повтор demo объяснения конкурирует с основным действием; будущие register/recovery требуют отдельной capability | POLISH / P2 | SHOP-UX-SYSTEM-01; будущий auth ticket |
| Home / начать поиск товара | Hero CTA ведёт в каталог, есть промо товары (`src/pages/HomePage/HomePage.jsx`) | Ассортимент и товарные категории раскрыты ограниченно | POLISH / P2 | SHOP-UX-DISCOVERY-01 |
| Catalog / найти и сузить товары | Поиск, категория, цена, сортировка, chips, loading/error/empty и mobile drawer (`src/pages/ProductsPage/ProductsPage.jsx`) | Категорийные атрибуты в карточках/фильтрах ограничены текущей моделью данных | PASS для текущего scope; DOMAIN GAP / P2 для расширения | SHOP-UX-DISCOVERY-01 |
| Product Card / оценить товар | Изображение, цена и переход поддерживают каталог | Набор признаков общий для всех товаров; нужен product data contract перед категорийным улучшением | POLISH / P2 | SHOP-UX-DISCOVERY-01 |
| PDP / оценить и добавить товар | Галерея, цена, действие корзины, отзывы (`src/pages/ProductDetailsPage/ProductDetailsPage.jsx`) | Подставляются придуманные бренд и наличие, часть labels только RU (`:206-208`) | UX DEBT + DOMAIN GAP / P1 | SHOP-UX-PDP-01 |
| Cart Page + Drawer / проверить и изменить покупку | Количество, удаление, сумма, empty state и сохранение работают; drawer имеет dialog/focus поведение | Page сообщает `Order placed`, затем очищает cart без создания заказа (`src/pages/CartPage/CartPage.jsx:31-35`) | DOMAIN GAP / P0 | SHOP-UX-COMMERCE-01 |
| Checkout / завершить покупку | Ссылка/маршрут существует | `/checkout` перенаправляет в cart (`src/app/App.jsx:107`), поэтому обещанное оформление отсутствует | DOMAIN GAP / P0 | SHOP-UX-COMMERCE-01 |
| Account Home + Profile / управлять учётной записью | Прямые destinations на mobile, sidebar на desktop, editor с валидацией, avatar и dirty state | Runtime review после benchmark не выявил новую обязательную переделку; ручная оценка ещё нужна | PASS для текущего scope | SHOP-ACCOUNT-02 Manual QA |
| Account placeholders / открыть будущие разделы | Доступные маршруты и честные состояния Orders, Addresses, Reviews, Settings | Будущая бизнес-функция пока отсутствует, что обозначено явно | PASS для IA; DOMAIN GAP будущих capabilities | Соответствующие domain tickets roadmap |
| 404, API error, empty results/cart / восстановиться | Есть базовое сообщение и маршрут восстановления; empty states в catalog/cart | Общие подписи и иерархия требуют общей редакторской проверки | PASS для восстановления; POLISH / P2 | SHOP-UX-SYSTEM-01 |

Обоснование ожидаемого поведения: [Baymard Product Lists](https://baymard.com/research/ecommerce-product-lists) и [Product Page](https://baymard.com/research/product-page) поддерживают важность достаточных данных для выбора; [Baymard Checkout](https://baymard.com/research/checkout-usability) — прозрачного пути завершения покупки. Применение этих принципов к конкретному коду выше является нашим выводом.

## Reviewer journeys

| Путь | Оценка и граница |
| --- | --- |
| A. Home → Catalog → PDP → Cart | Навигация и добавление в cart поддержаны существующими E2E; доверие к product detail снижает вымышленное наличие/бренд. P1 PDP ticket. |
| B. Login → Account → Profile | Текущий demo session, защитный маршрут, редактирование имени/аватара и возврат поддержаны E2E; новая Account IA ожидает ручной приёмки. |
| C. Mobile Home → Catalog → Cart → Account | Global mobile navigation и cart/account маршруты существуют; проверяются responsive collision и 320px. Пункт Account требует login. |
| D. Search → Filters → Product → Back | Поиск, filters, сортировка и reset функциональны по catalog E2E; после возврата состояние списка следует сохранить как часть текущего сценария в проверке. |
| E. Cart → current Checkout placeholder | Не завершает заказ: cart показывает ложный success, `/checkout` ведёт назад. P0 release gap, не исправляется в SHOP-ACCOUNT-02. |

## Сквозная согласованность

Кнопки, ссылки, заголовки и секции в основном следуют общим компонентам и навигационным маршрутам. Primary action в Account — переход к редактированию; sign out имеет вторичную семантику. Карточки в каталоге и строки в Account соответствуют разным задачам, поэтому не обязаны иметь одну форму. Формы профиля имеют labels, helper/error и focus; auth demo тексты и общие empty/error состояния требуют компактной редакторской ревизии. Badges и иконки в Account ограничены и служат ориентации. RU/EN, light/dark, keyboard focus и desktop/tablet/mobile являются обязательной матрицей последующих product tickets. Значимые находки сгруппированы в [ROADMAP](../ROADMAP.md) по capabilities; **ARCHITECTURE GAP и подтверждённых REGRESSION/BLOCKER текущего Account ticket в этом аудите не выявлено**. Отсутствие backend capability не следует ошибочно считать регрессией.

Аудит не менял runtime вне Account. Финальное качество отдельных размеров и состояний требует ручного просмотра нового preview; автоматические тесты подтверждают только описанные в них контракты.

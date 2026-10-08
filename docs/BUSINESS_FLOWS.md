# Бизнес-процессы

Стрелки обозначают ответственность и порядок, а не утверждённые API или наборы статусов. Шаги **CURRENT** подтверждены в SPA; для **PLANNED** нужны отдельные implementation tickets. Если участвует внешняя система, путь проходит через `веб-приложение → MyMyShop Application API → доменная/прикладная граница → адаптер → внешняя система`.

## Выбор товара, корзина и сессия

| Процесс | CURRENT | Продолжение PLANNED / PROPOSED |
| --- | --- | --- |
| Поиск товара | Покупатель → каталог → локальный поиск/категории/фильтры/сортировка → PDP; дополнительный режим DummyJSON ограничен загруженными страницами | PLANNED API каталога и преобразование DTO; PIM OPTIONAL |
| Корзина | Товар → добавление/количество/удаление → Redux → версионированный `localStorage` | PLANNED серверная корзина Customer; правило объединения открыто |
| Сессия/аккаунт | Анонимный посетитель → demo-сессия в памяти → demo Profile; обновление страницы завершает сессию | PLANNED настоящая авторизация, истечение сессии, Account, редактирование Profile/аватара и настройки |
| Недавно просмотренные | Сервиса истории нет | PLANNED просмотр PDP → возможно, сначала локальная история; серверная синхронизация требует Customer-идентичности |

```mermaid
sequenceDiagram
  actor Customer as Покупатель
  participant Web as Веб-приложение
  participant Service as sessionService
  participant Demo as demoSessionAdapter
  Customer->>Web: Включить demo-сессию
  Web->>Service: startSession
  Service->>Service: Удалить известные старые credentials
  Service->>Demo: startSession
  Demo-->>Service: Только demo-идентичность
  Service-->>Web: Данные сессии для отображения
  Note over Web: CURRENT, только память, без прав доступа
```

```mermaid
sequenceDiagram
  actor Customer as Покупатель
  participant Web as Веб-приложение
  participant API as MyMyShop API
  participant Identity as Граница идентификации
  Customer->>Web: Войти
  Web->>API: Запрос сессии
  API->>Identity: Проверить личность и создать сессию
  Identity-->>API: Результат серверной сессии
  API-->>Web: Безопасное представление сессии
  Note over Web,Identity: PLANNED, транспорт и поставщик открыты
```

```mermaid
sequenceDiagram
  actor Customer as Покупатель
  participant Web as Интерфейс корзины
  participant Store as Redux cart
  participant Storage as cartPersistence/localStorage
  Customer->>Web: Добавить товар или изменить количество
  Web->>Store: Действие корзины
  Store->>Storage: Сохранить проверенный снимок с версией
  Note over Store,Storage: CURRENT, данные браузера изменяемы
```

## Оформление и жизненный цикл заказа

**CURRENT:** кнопка CartPage пишет корзину и итог в console, показывает alert и очищает корзину. Order и Payment не создаются. Статическая DeliveryPage не выбирает доставку.

**PLANNED:** корзина → выбор доставки/самовывоза → серверная проверка цены, наличия и данных Customer → при необходимости инициация оплаты → создание и подтверждение заказа. Точный порядок и обработка отказов определяются контрактами заказов/платежей; следующая схема **PROPOSED**, а не спецификация API. Возможные состояния — создан, ожидает оплаты, авторизован/оплачен, исполняется, отправлен, доставлен, завершён. Окончательный набор и переходы утверждает ticket домена Orders. История и детали заказа должны показывать неизменяемые снимки OrderItem, статусы оплаты и отгрузки, отслеживание и отмену там, где её допускают правила.

```mermaid
sequenceDiagram
  actor Customer as Покупатель
  participant Web as Веб-приложение
  participant API as MyMyShop API
  participant Domain as Оформление/Заказы/Платежи
  participant Adapter as Платёжный адаптер
  participant PSP as Платёжный поставщик
  Customer->>Web: Проверить оформление
  Web->>API: Передать намерение и выбор
  API->>Domain: Проверить корзину, цену и наличие
  Domain->>Adapter: При необходимости инициировать оплату
  Adapter->>PSP: Запрос поставщику
  PSP-->>Adapter: Результат поставщика
  Adapter-->>Domain: Преобразованный результат
  Domain-->>API: Состояние заказа и оплаты
  API-->>Web: Подтверждение или исправимая ошибка
  Note over Web,PSP: PLANNED, защищённый интерфейс PSP зависит от поставщика
```

**PLANNED — исполнение и отслеживание:** заказ → операции/исполнение → отгрузка → перевозчик при его использовании → обновление статусов через backend → детали заказа. Статус для покупателя должен опираться на серверные данные, а не создаваться браузером.

```mermaid
sequenceDiagram
  participant Ops as Операции
  participant API as MyMyShop API
  participant Domain as Граница исполнения
  participant Adapter as Адаптер WMS/перевозчика
  participant External as WMS или перевозчик
  participant Web as Детали заказа
  Ops->>API: Передать заказ в исполнение
  API->>Domain: Зафиксировать работу по отгрузке
  Domain->>Adapter: Обменяться данными об отгрузке
  Adapter->>External: Операция поставщика
  External-->>Adapter: Обновление отслеживания
  Adapter-->>Domain: Нормализованный статус
  Domain-->>API: Статус для покупателя
  API-->>Web: Данные отслеживания
  Note over Ops,Web: PLANNED, поставщик и способ обновления открыты
```

## Поддержка, отзывы и действия после покупки

**PLANNED — поддержка:** покупатель → интерфейс поддержки → MyMyShop Support API/домен → необязательный адаптер CRM/helpdesk → сотрудник поддержки. Ответ сотрудника возвращается через интеграционную и серверную границы в переписку/уведомление. **CURRENT** ChatBot отвечает локально по правилам: нет истории обращений, сотрудника или CRM. ContactPage пишет введённые данные в console. Будущие возможности: история, номер обращения, контекст заказа, причина, эскалация, непрочитанные сообщения, ответ сотрудника и уведомления; вложения **OPTIONAL**.

```mermaid
sequenceDiagram
  actor Customer as Покупатель
  participant Web as Интерфейс поддержки
  participant API as MyMyShop API
  participant Support as Домен поддержки
  participant Adapter as Адаптер CRM
  participant CRM as CRM/helpdesk
  actor Agent as Сотрудник поддержки
  Customer->>Web: Отправить обращение
  Web->>API: Сообщение переписки
  API->>Support: Проверить и сохранить
  Support->>Adapter: Передать обращение при настройке
  Adapter->>CRM: Создать или обновить обращение
  Agent->>CRM: Ответить
  CRM-->>Adapter: Ответ сотрудника
  Adapter-->>Support: Преобразованный ответ
  Support-->>API: Безопасное сообщение
  API-->>Web: Обновление переписки
  Note over Web,CRM: PLANNED, CRM необязательна
```

**PLANNED — отзыв/оценка:** Customer → купленный или просмотренный товар → отправка → домен Reviews → необязательная модерация → PDP и Account. Правила допуска, модерации и публикации открыты. Сейчас API-режим запрашивает поле `reviews`, но в локальном снимке его нет; базовый компонент PDP не является полноценной функцией отзывов. Отдельный ticket должен проверить путь от данных источника через нормализацию и модель до представления на PDP.

**PLANNED — возврат товара/денег:** запрос Customer → проверка условий в Orders/Returns → при одобрении серверный платёжный адаптер/PSP → необязательное обновление ERP → статус для покупателя. Правила возврата, разрешения, частичных сумм и сроков открыты.

```mermaid
sequenceDiagram
  actor Customer as Покупатель
  participant Web as Аккаунт/детали заказа
  participant API as MyMyShop API
  participant Domain as Возвраты/Платежи
  participant Adapter as Платёжный адаптер
  participant PSP as Платёжный поставщик
  Customer->>Web: Запросить возврат
  Web->>API: Передать запрос
  API->>Domain: Проверить правила и заказ
  Domain->>Adapter: Вернуть средства при одобрении
  Adapter->>PSP: Запрос возврата поставщику
  PSP-->>Adapter: Подтверждённый результат
  Adapter-->>Domain: Нормализованный статус
  Domain-->>API: Статус возврата
  API-->>Web: Обновление для покупателя
  Note over Web,PSP: PLANNED, правила одобрения и статусы открыты
```

**PLANNED — профиль и адреса:** Customer редактирует профиль/аватар или адреса в Account → Customer API/домен → серверная запись → необязательная передача в CRM. При оформлении используется выбранный адрес; изменение в браузере не подтверждает право владения. Хранение аватара, проверка ввода, сроки хранения и адрес по умолчанию определяются позднее.

# TandeHooks

Хуки для сайта работающие на технологии rabbitMQ

### Установка

```sh
$ npm install
```

Для установки среды можете воспользоваться nodeenv

```sh
$ pip install nodeenv
$ nodeenv env
$ source env/bin/activate
```

### Настройка

Для настройки нужно создать файл с именем .env которое
содержит подключение к бд и другие настройки. Пример:

```s
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=
```

### Запуск

```sh
$ npm run start
```

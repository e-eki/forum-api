## Backend форума

NodeJS + MongoDB + Socket.io

Frontend форума [здесь](https://github.com/e-eki/forum-app).

## О форуме
Форум с системой оповещений об изменениях в режиме реального времени (как в мессенджерах).

В классических форумах, чтобы увидеть изменения, например, сообщения или информации юзера, надо перезагрузить страницу.
Здесь же изменения отрисовываются сразу же, без перезагрузки. Под изменениями подразумевается добавление/редактирование/удаление/перемещение разделов/подразделов/чатов/сообщений, а также изменение прав юзера на форуме.

Идея и внешнее представление оповещений о новых сообщениях (превью последнего сообщения, количество новых сообщений с момента последнего просмотра), а также отображение личной информации юзера были позаимствованы у мессенджера Telegram. Поэтому и классические для форума темы, в которых юзеры переписываются сообщениями, здесь не темы, а чаты, аналогичные чатам в Telegram. В них так же присутствует возможность закрепить наверху сообщение, т.к. это удобный способ пояснить цель обсуждения.

## Структура форума
Форум состоит из разделов, включающих в себя подразделы, в которых и находятся чаты. В чатах происходит общение юзеров посредством сообщений.
Есть возможность обмена личными сообщениями между залогиненными юзерами (личные чаты).
Присутствует также система юзерских прав: админ/модератор/юзер с возможностью добавления в черный список.

## Реализация
Для реализации такой системы на бэкенде используется связка NodeJS + Socket.io, на фронтенде ReactJS + Redux + Socket.io.

Каждой странице на форуме соответствует комната (room в Socket.io) с определенным id. Клиент, переходя на страницу, после загрузки ее содержимого отправляет на сервер по сокетам id комнаты, в которой находится, и id комнаты, которую только что покинул. Сервер получает эти сообщения и отключает/присоединяет клиента к соответствующим комнатам. В качестве id комнат используются id того раздела/подраздела/чата, на странице которого находится юзер.

Далее, когда на форуме происходит какое-то изменение, это изменение будет видно в определенных частях форума (например, новое сообщение в чате будет видно тем, кто просматривает чат или подраздел с этим чатом, но не будет видно тем, кто на главной странице). В соответствии с типом изменения, сервер отправляет по сокетам информацию об изменении клиентам, подключенным к нужным комнатам.

Похожим образом реагирует на изменения и клиент, то есть если было добавлено новое сообщение, а юзер на главной странице, то ничего не меняется и не отрисовывается. На клиенте определение его местоположения на форуме осуществляется с помощью состояния store (Redux). В store хранятся данные для текущей страницы, например, чат, который просматривает юзер. И если в store хранится чат, а по сокетам пришла информация о новом сообщении в нем, то содержимое store обновляется, в результате чего происходит отрисовка чата и нового сообщения.

Таким образом, цепочка изменений выглядит так: клиент отправляет на апи сервера запрос об изменении -> сервер выполняет запрос и отправляет ответ -> клиент получает ответ и отправляет на сервер по сокетам информацию о сделанном изменении -> сервер получает по сокетам эту информацию и рассылает ее по сокетам тем клиентам, которые это изменение могут увидеть. В целях упрощения, информация, передаваемая туда-сюда по сокетам, была названа actions и выглядит как действия из Redux.

Еще есть изменения, которые юзер может увидеть, находясь в любом месте форума - для залогиненного юзера это новые личные сообщения/изменения его прав/внесение в ЧС. Поэтому если юзер залогинен, то клиент, помимо прочего, всегда подключен к комнате с id юзера. Так он получает и отрисовывает соответствующие изменения (уведомления о новых сообщениях в меню и доступные элементы управления форумом).

## Аутентификация на форуме
Для авторизации используется схема **Token-Based Authentication**, описанная в [статье](https://gist.github.com/zmts/802dc9c3510d79fd40f9dc38a12bccfc).
При этом получение fingerprint устройства используется не только при получении токенов - для предотвращения кражи токенов, но и при отправке письма для подтверждения имейла/письма для восстановления пароля - для подсчета и ограничения количества запросов, поступивших с одного устройства, и предотвращения атак, связанных с блокированием приложения почтовыми службами.


'use strict';

const config = require('../../config');

const mainLink = `${config.server.protocol}://${config.server.host}:${config.server.port}`;
  
const successConfirmPage =  
	`<!DOCTYPE HTML>
	<html>
		<head>
			<meta charset="utf-8">
			<title>Успешная регистрация</title>
			<style type="text/css">
				.wrapper {
					margin: 10vmin;
				}
			</style>
		</head> 
		<body>
			<div class="wrapper">
				<p>Поздравляем, ваша почта успешно подтверждена!</p>
				<p><a href="${mainLink}">Перейти на главную страницу</a></p>
			</div>
		</body>
	</html>`;

module.exports = successConfirmPage;

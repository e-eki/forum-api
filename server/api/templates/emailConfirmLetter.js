'use strict';

const config = require('../../config');

module.exports = new function() {

    this.get = function(data) {		
		const mainLink = `${config.server.protocol}://${config.server.host}:${config.server.port}`;

		let letter =  
			`<!DOCTYPE HTML>
			<html>
				<head>
					<meta charset="utf-8">
					<title>Подтверждение адреса электронной почты на сайте «Игра в шашки онлайн.»</title>
					<style type="text/css">
						.wrapper {
							margin: 5vmin;
						}
					</style>
				</head> 
				<body>
					<div class="wrapper">
						<p>Здравствуйте, ${data.login}!</p>
						<p>Мы рады приветствовать вас на нашем сайте!
						<br/>Чтобы продолжить регистрацию, перейдите по <a href="${mainLink}/api/emailconfirm/${data.confirmEmailCode}/">ссылке</a>.</p>
						<p>Ваша «Игра в шашки онлайн».
						<br/><a href="${mainLink}">На главную страницу</a></p>
					</div>
				</body>
			</html>`;

		return letter;
    }
};

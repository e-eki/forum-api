'use strict';

const config = require('../config');

module.exports = new function() {

    this.get = function(data) {		
		const mainLink = `${config.server.protocol}://${config.server.host}:${config.server.port}`;

		let letter =  
			`<!DOCTYPE HTML>
			<html>
				<head>
					<meta charset="utf-8">
					<title>Подтверждение адреса электронной почты на форуме «${config.forumName}»</title>
					<style type="text/css">
						.wrapper {
							margin: 5vmin;
						}
					</style>
				</head> 
				<body>
					<div class="wrapper">
						<p>Здравствуйте, ${data.login}!</p>
						<p>Мы рады приветствовать вас на нашем форуме!
						<br/>Чтобы продолжить регистрацию, перейдите по <a href="${mainLink}/api/${config.apiRoutes.emailConfirm}/${data.emailConfirmCode}">ссылке</a>.</p>
						<p>Ваш форум «${config.forumName}».
						<br/><a href="${mainLink}">На главную страницу</a></p>
					</div>
				</body>
			</html>`;

		return letter;
    }
};

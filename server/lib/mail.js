'use strict';

const Promise = require('bluebird');
const nodemailer = require('nodemailer');
const config = require('../../config');

const mail = new function() {

	// отправка письма подтверждения имейла
	this.sendConfirmEmailLetter = function(data) {

		let transport = nodemailer.createTransport({
			service: config.mail_settings.service, 
			auth: { 
				user: config.mail_settings.auth.user 
				, pass: config.mail_settings.auth.pass
			}
		});

		// собственно письмо
		const letterHtml = require('../templates/emailConfirmLetter').get(data);

		// отправляем
		return transport.sendMail({
			from: config.mail_settings.from,
			to: data.email,
			subject: config.mail_settings.confirmEmailSubject,
			html: letterHtml
		})
            .then((result) => {
				
                transport.close();
                return result;
            });
	};

	// отправка письма сброса пароля
	this.sendResetPasswordLetter = function(data) {

		let transport = nodemailer.createTransport({
			service: config.mail_settings.service, 
			auth: { 
				user: config.mail_settings.auth.user 
				, pass: config.mail_settings.auth.pass
			}
		});

		// собственно письмо
		const letterHtml = require('../templates/resetPasswordLetter').get(data);

		// отправляем
		return transport.sendMail({
			from: config.mail_settings.from,
			to: data.email,
			subject: config.mail_settings.resetPasswordSubject,
			html: letterHtml
		})
            .then((result) => {
				
                transport.close();
                return result;
            });
	}


};

module.exports = mail;
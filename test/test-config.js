'use strict';

let env = process.env;

module.exports = {
	'rabbitmqUrl' : env.RABBITMQURL || 'amqp://192.168.99.100',
	'redisHost'   : env.REDISHOST || '192.168.99.100'
};

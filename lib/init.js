'use strict';

const amqplib = require( 'amqplib' );
const redis   = require( 'redis' );
const Promise = require( 'bluebird' );

// Start debug
let debug = require( 'debug' )( 'init' );

module.exports = function ( options ) {
	debug( 'options', options );
	return new Promise( function ( resolve, reject ) {
		options = options || {
			'rabbitmqUrl'  : null,
			'redisOptions' : null
		};

		// Assign Default configs
		let rabbitmqUrl         = options.rabbitmqUrl;
		let redisDefaultOptions = options.redisOptions;
		let rabbitmq            = amqplib.connect( rabbitmqUrl );
		let redisClient         = redis.createClient( redisDefaultOptions );

		redisClient.on( 'connect', function () {
			debug( 'connected to redis' );
			rabbitmq
				.then( ( rabbitmqConnection ) => {
					debug( 'connected to rabbitmq' );
					return rabbitmqConnection.createChannel();
				} )
				.then( ( channel ) => {
					debug( 'created rabbitmq channel' );
					return resolve( {
						'rabbitmqConnection' : channel,
						'redisClient'        : redisClient
					} );
				} )
				.catch( ( rabbitError ) => {
					debug( 'diconnected to rabbitmq' );
					return reject( rabbitError );
				} );
		} );
		redisClient.on( 'error', function ( redisError ) {
			debug( 'diconnected to redis' );
			reject( redisError );
		} );
	} );
};

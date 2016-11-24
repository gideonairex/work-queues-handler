'use strict';

// To test
let init = require( '../lib/init' );
const config = require( './test-config' );

describe( 'Connection to redis and rabbitmq', () => {
	it( 'Should connect to redis and rabbitmq', ( done ) => {
		init( {
			'rabbitmqUrl'  : config.rabbitmqUrl,
			'redisOptions' : {
				'host' : config.redisHost
				}
		} )
			.then( function () {
				true.should.be.true();
				done();
			} )
			.catch( function () {
				false.should.be.true();
				done();
			} );
	} );
	it( 'Should not connect to redis', ( done ) => {
		init( {
			'rabbitmqUrl'  : config.rabbitmqUrl,
			'redisOptions' : {
				'host'            : '192.168.99.123',
				'connect_timeout' : 1000,
				'retry_max_delay' : 400,
				'max_attempts'    : 2
				}
		} )
			.then( function () {
				false.should.be.true();
				done();
			} )
			.catch( function () {
				true.should.be.true();
				done();
			} );
	} );
	// Find a way to handle this waiting for issue
	// it( 'Should not connect to rabbitmq', ( done ) => {} );
} );

'use strict';

let index    = require( '../lib' );
const config = require( './test-config' );

describe( 'Attaching handlers', () => {
	it( 'should attach handlers', () => {
		let worker = {
			'config' : {
				'consumeQueue' : 'test'
			}
		};

		index( {
			'rabbitmqUrl'  : config.rabbitmqUrl,
			'redisOptions' : {
				'host' : config.redisHost
				}
			},
			[worker] )
			.then( function () {
				true.should.be.true();
			} );
	} );
} );

'use strict';

let init    = require( './init' );
let handler = require( './handler' );

// Start debug
let debug = require( 'debug' )( 'index' );

module.exports = function ( options, workers ) {
	debug( 'connecting to rabbitmq and redis', options );

	return init( options )
		.then( function ( connections ) {
				debug( 'attach workers', workers.length );

				for ( let i = 0; i < workers.length; ++i ) {
					let worker = workers[i];
					handler( connections.rabbitmqConnection,
									connections.redisClient,
									worker );
				}
				return connections;
		} );
};

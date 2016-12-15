'use strict';

let publisher = require( './publisher' );

// Start debug
let debug = require( 'debug' )( 'handler' );

module.exports = function ( channel, redisClient, worker ) {
	const consumeQueue = worker.config.consumeQueue;
	const queueOptions = worker.config.queueOptions || {};
	debug( 'check worker', worker );

	// Assert and init queue
	channel.assertQueue( consumeQueue, queueOptions );
	debug( 'assert queue', consumeQueue );

	// Only 1 work per worker
	channel.prefetch( worker.config.prefetch || 1 );
	debug( 'prefetch set to 1' );

	debug( 'start consuming' );
	function workMessage ( message, done ) {
		// Initialize publisher
		debug( 'initialize publisher' );
		let publish = publisher( channel, redisClient, consumeQueue, done );

		// Check where its coming from
		switch ( message.properties.headers.callType ) {
			case 'parent':
				// Parse message content
				message.content = message.content.toString();
				debug( 'stringify message', message.content );
				debug( 'consume from parent', message );

				worker.consumeFromParent( message, publish( message ) );
				break;
			case 'child':
				// Parse message content
				message.content = message.content.toString();
				debug( 'stringify message', message.content );
				debug( 'consume from child', message );
				let handler  = 'consume-' + message.properties.headers.child;

				worker[handler]( message, publish( message ) );
				break;
			default:
				debug( 'consume from default', message );
				worker.consume( message, publish( message ) );
				break;
		}
	}

	channel.consume( consumeQueue, function ( message ) {
		setImmediate( () => {
			let done = {
				'status' : false
			};

			workMessage( message, done );

			setTimeout( () => {
				if ( !done.status ) {
					debug( 'timeout' );
					done.status = true;
					channel.nack( message, {'requeue' : true} );
				}
			}, 1200000 );

		} );
	},
	// Let the worker ack the message
	{'noAck' : false} );
};

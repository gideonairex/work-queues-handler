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
	channel.prefetch( 1 );
	debug( 'prefetch set to 1' );

	// Initialize publisher
	let publish = publisher( channel, redisClient, consumeQueue );
	debug( 'initialize publisher' );

	debug( 'start consuming' );
	channel.consume( consumeQueue, ( message ) => {
		// Parse message content
		message.content = message.content.toString();
		debug( 'stringify message', message.content );

		// Check where its coming from
		switch ( message.properties.headers.callType ) {
			case 'parent':
				debug( 'consume from parent', message );
				worker.consumeFromParent( message, channel, publish( message ) );
				break;
			case 'child':
				debug( 'consume from child', message );
				let handler  = 'consume-' + message.properties.headers.child;

				worker[handler]( message, channel, publish( message ) );
				break;
			default:
				debug( 'consume from default', message );
				worker.consume( message, channel, publish( message ) );
				break;
		}
	},
	// Let the worker ack the message
	{'noAck' : false} );
};

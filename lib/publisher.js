'use strict';

let uuid = require( 'uuid' );

// Start debug
let debug = require( 'debug' )( 'publisher' );

module.exports = function ( channel, redisClient, consumeQueue ) {
	debug( 'initialized publisher for queue:', consumeQueue );

	return function ( parentMessage ) {
		return {
			'sendToQueueParent' : function ( queue, message ) {
				let options = {
					'persistent' : true,
					'headers'    : {
						'origin'   : 'child',
						'child'    : consumeQueue,
						'type'     : parentMessage.properties.headers.type || null,
						'expected' : parentMessage.properties.headers.expected || null,
						'refId'    : parentMessage.properties.headers.refId || null
					}
				};

				debug( 'sendToQueueParent', options, message );
				channel.sendToQueue( queue, new Buffer( message ), options );
			},
			'sendToQueueChild' : function ( queue, message ) {
				let options = {
					'persistent' : true,
					'headers'    : {
						'origin'   : 'parent',
						'child'    : queue,
						'type'     : parentMessage.properties.headers.type || null,
						'expected' : parentMessage.properties.headers.expected || null,
						'refId'    : parentMessage.properties.headers.refId || null
					}
				};

				debug( 'sendToQueueChild', options, message );
				channel.sendToQueue( queue, new Buffer( message ), options );
			},
			'parallelJobs' : function ( jobs ) {
				let refId = uuid.v4();
				let expectedFulfillment = jobs.length;
				let options = {
					'persistent' : true,
					'headers'    : {
						'origin'   : 'parent',
						'type'     : 'parallel',
						'expected' : expectedFulfillment,
						'refId'    : refId
					}
				};

				debug( 'parallelJobs', options );
				for ( let i = 0; i < jobs.length; ++i ) {
					let job = jobs[i];
					channel.sendToQueue( job.queue, new Buffer( job.body ), options );
				}
			},
			'sendConfirmForParallel' : function ( queue, body ) {
				let key   = parentMessage.properties.headers.type + '-' + parentMessage.properties.headers.refId;
				let child = parentMessage.properties.headers.child;
				debug( 'sendConfirmForParallel', key, child );

				function checkLength ( checkKey ) {
					debug( 'llen', checkKey );
					redisClient.llen( checkKey, function ( errLlen, expected ) {
						if ( errLlen ) {
							return debug( 'error on redis llen', errLlen );
						}
						// Check if all are the same
						debug( 'check expectations', expected, parentMessage.properties.headers.expected );
						if ( expected === parentMessage.properties.headers.expected ) {
							let options = {
								'persistent' : true,
								'headers'    : {
									'origin' : 'parent'
								}
							};
							debug( 'sendToQueue from confirmation', queue, options, body );
							return channel.sendToQueue( queue, new Buffer( JSON.stringify( body ) ), options );
						}
						return 0;
					} );
				}

				// Check now for exisisting reference for parallel jobs
				debug( 'check if exists', key );
				redisClient.exists( key, function ( err ) {
					if ( err ) {
						return debug( 'error on redis exists', err );
					}
					debug( 'lpush', key, child );
					return redisClient.lpush( key, child, function ( errPush ) {
						if ( err ) {
							return debug( 'error on redis lpush', errPush );
						}
						debug( 'check length', key );
						return checkLength( key );
					} );
				} );
			}
		};
	};
};

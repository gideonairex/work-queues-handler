'use strict';

let uuid = require( 'uuid' );

// Start debug
let debug = require( 'debug' )( 'publisher' );

module.exports = function ( channel, redisClient, consumeQueue ) {
	debug( 'initialized publisher for queue:', consumeQueue );

	return function ( parentMessage ) {
		return {
			'sendToQueueParent' : function ( message ) {
				let origin      = parentMessage.properties.headers.origin;
				let parentQueue = origin.pop();

				let options = {
					'persistent' : true,
					'headers'    : {
						'origin'   : origin,
						'callType' : 'child',
						'child'    : consumeQueue,
						'method'   : parentMessage.properties.headers.method || null,
						'expected' : parentMessage.properties.headers.expected || null,
						'refId'    : parentMessage.properties.headers.refId || null
					}
				};

				debug( 'sendToQueueParent', options, message );
				channel.sendToQueue( parentQueue, new Buffer( message ), options );
			},
			'sendToQueueChild' : function ( queue, message ) {
				let origin = parentMessage.properties.headers.origin || [];
				origin.push( consumeQueue );

				let options = {
					'persistent' : true,
					'headers'    : {
						'origin'   : origin,
						'callType' : 'parent',
						'child'    : queue,
						'method'   : parentMessage.properties.headers.method || null,
						'expected' : parentMessage.properties.headers.expected || null,
						'refId'    : parentMessage.properties.headers.refId || null
					}
				};

				debug( 'sendToQueueChild', options, message );
				channel.sendToQueue( queue, new Buffer( message ), options );
			},
			'parallelJobs' : function ( jobs ) {
				let origin = parentMessage.properties.headers.origin || [];
				origin.push( consumeQueue );
				let refId = uuid.v4();
				let expectedFulfillment = jobs.length;

				let options = {
					'persistent' : true,
					'headers'    : {
						'origin'   : origin,
						'callType' : 'parent',
						'method'   : 'parallel',
						'expected' : expectedFulfillment,
						'refId'    : refId
					}
				};

				debug( 'parallelJobs', options );
				for ( let i = 0; i < jobs.length; ++i ) {
					let job = jobs[i];

					options.child = job.queue;
					channel.sendToQueue( job.queue, new Buffer( job.body ), options );
				}
			},
			'sendConfirmForParallel' : function ( queue, body ) {
				let origin = parentMessage.properties.headers.origin || [];
				origin.push( consumeQueue );
				let key   = parentMessage.properties.headers.method + '-' + parentMessage.properties.headers.refId;
				let child = parentMessage.properties.headers.child;

				debug( 'sendConfirmForParallel', key );

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
									'origin'   : origin,
									'callType' : 'parent'
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

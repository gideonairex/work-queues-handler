'use strict';

let publisher = require( '../lib/publisher' );

describe( 'Publisher methods', () => {
	it( 'it should sendtoqueueparent', ( done ) => {
		let channel = {
			'sendToQueue' : function ( queue, message, options ) {
				queue.should.equal( 'recieve-queue' );
				JSON.parse( message.toString() ).should.containEql( {
					'body' : 'testme'
				} );
				options.headers.origin.should.equal( 'child' );
				options.headers.type.should.equal( 'parallel' );
				options.headers.expected.should.equal( 2 );
				options.headers.refId.should.equal( 3 );
				done();
			}
		};

		let publishertest = publisher( channel, null, 'test-queue' );
		let messenger = publishertest( {
			'properties' : {
				'headers' : {
					'type'     : 'parallel',
					'expected' : 2,
					'refId'    : 3
				}
			}
		} );
		messenger.sendToQueueParent( 'recieve-queue', JSON.stringify( {
			'body' : 'testme'
		} ) );
	} );
	it( 'it should sendToQueueChild', ( done ) => {
		let channel = {
			'sendToQueue' : function ( queue, message, options ) {
				queue.should.equal( 'recieve-queue' );
				JSON.parse( message.toString() ).should.containEql( {
					'body' : 'testme'
				} );
				options.headers.origin.should.equal( 'parent' );
				options.headers.type.should.equal( 'parallel' );
				options.headers.expected.should.equal( 2 );
				options.headers.refId.should.equal( 3 );
				done();
			}
		};

		let publisherTest = publisher( channel, null, 'test-queue' );
		let messenger = publisherTest( {
			'properties' : {
				'headers' : {
					'type'     : 'parallel',
					'expected' : 2,
					'refId'    : 3
				}
			}
		} );
		messenger.sendToQueueChild( 'recieve-queue', JSON.stringify( {
			'body' : 'testme'
		} ) );
	} );
	it( 'it should parallelJobs', ( done ) => {
		let counter = 0;
		let jobs = [
			{
				'queue' : 'queue1',
				'body'  : JSON.stringify( {'test' : 1} )
			},
			{
				'queue' : 'queue2',
				'body'  : JSON.stringify( {'test' : 2} )
			}
		];

		function checkCount () {
			if ( counter === jobs.length ) {
				true.should.be.true();
				done();
			}
		}

		let channel = {
			'sendToQueue' : function ( queue, message, options ) {
				options.headers.origin.should.equal( 'parent' );
				options.headers.expected.should.equal( 2 );
				++counter;
				checkCount();
			}
		};

		let publisherTest = publisher( channel, null, 'test-queue' );
		let messenger = publisherTest( {
			'properties' : {
				'headers' : {
					'type'     : 'parallel',
					'expected' : 2
				}
			}
		} );

		messenger.parallelJobs( jobs );
	} );
	it( 'it should sendConfirmForParallel', ( done ) => {
		let channel = {
			'sendToQueue' : function ( queue, message, options ) {
				queue.should.equal( 'recieve-queue' );
				JSON.parse( message.toString() ).should.containEql( {
					'body' : 'testme'
				} );
				options.headers.origin.should.equal( 'parent' );
				done();
			}
		};

		let publishertest = publisher( channel, {
			'exists' : function ( key, cb ) {
				cb( null, null );
			},
			'lpush' : function ( key, child, cb ) {
				cb( null );
			},
			'llen' : function ( key, cb ) {
				cb( null, 1 );
			}
		}, 'test-queue' );
		let messenger = publishertest( {
			'properties' : {
				'headers' : {
					'type'     : 'parallel',
					'expected' : 1,
					'refid'    : 3
				}
			}
		} );
		messenger.sendConfirmForParallel( 'recieve-queue', {
			'body' : 'testme'
		} );
	} );
} );

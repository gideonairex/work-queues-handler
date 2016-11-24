'use strict';

let should  = require( 'should' );
let handler = require( '../lib/handler' );

describe( 'Handler', () => {
	it( 'it should consume from parent', ( done ) => {
		let triggerCB;
		let channel = {
			'assertQueue' : function () {},
			'prefetch'    : function () {},
			'consume'     : function ( queue, cb ) {
				triggerCB = cb;
			}
		};
		let redisClient = {};
		let worker = {
			'config' : {
				'consumeQueue' : 'test',
				'queueOptions' : {}
			},
			'consumeFromParent' : function ( message ) {
				should( message.content ).equal( 'test' );
				done();
			}
		};

		handler( channel, redisClient, worker );
		triggerCB( {
			'properties' : {
				'headers' : {
					'origin' : 'parent'
				}
			},
			'content' : new Buffer( 'test' )
		} );
	} );
	it( 'it should consume from child', ( done ) => {
		let triggerCB;
		let channel = {
			'assertQueue' : function () {},
			'prefetch'    : function () {},
			'consume'     : function ( queue, cb ) {
				triggerCB = cb;
			}
		};
		let redisClient = {};
		let worker = {
			'config' : {
				'consumeQueue' : 'test',
				'queueOptions' : {}
			},
			'consume-child-queue' : function ( message ) {
				message.content.should.equal( 'test' );
				done();
			}
		};

		handler( channel, redisClient, worker );
		triggerCB( {
			'properties' : {
				'headers' : {
					'origin' : 'child',
					'child'  : 'child-queue'
				}
			},
			'content' : new Buffer( 'test' )
		} );
	} );
	it( 'it should consume default', ( done ) => {
		let triggerCB;
		let channel = {
			'assertQueue' : function () {},
			'prefetch'    : function () {},
			'consume'     : function ( queue, cb ) {
				triggerCB = cb;
			}
		};
		let redisClient = {};
		let worker = {
			'config' : {
				'consumeQueue' : 'test',
				'queueOptions' : {}
			},
			'consume' : function ( message ) {
				message.content.should.equal( 'test' );
				done();
			}
		};

		handler( channel, redisClient, worker );
		triggerCB( {
			'properties' : {
				'headers' : {
					'child' : 'child-queue'
				}
			},
			'content' : new Buffer( 'test' )
		} );
	} );
} );

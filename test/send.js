
var qs = require("querystring");
var uuid = require("uuid");
var should = require("should");
var sinon = require("sinon");
var url = require("url");

global.XMLHttpRequest = sinon.useFakeXMLHttpRequest();

var ua = require("../lib/index.js");
var utils = require("../lib/utils.js")
var config = require("../lib/config.js")


describe("ua", function () {

	describe("#send", function () {
		var post;
		var postCallCount = 0;

		beforeEach(function () {
			post = sinon.useFakeXMLHttpRequest();
			post.onCreate = function (xhr) {
	          postCallCount++;
	        };
		});

		afterEach(function () {
			postCallCount = 0;
			post.restore()
		});

		it("should immidiately return with an empty queue", function () {
			var visitor = ua();
			var fn = sinon.spy();

			visitor.send(fn);

			postCallCount.should.equal(0, "no request should have been sent")
			fn.calledOnce.should.equal(true, "callback should have been called once")
			fn.thisValues[0].should.equal(visitor, "callback should be called in the context of the visitor instance");
			fn.args[0].should.eql([null, 0], "no error, no requests");
		});

		it("should include data in POST body", function (done) {
			var paramSets = [
				{first: "123"}
			]

			var fn = sinon.spy(function () {
				fn.calledOnce.should.equal(true, "callback should have been called once")
				fn.thisValues[0].should.equal(visitor, "callback should be called in the context of the visitor instance");
				fn.args[0].should.eql([null, 1], "no error, 1 requests");

				postCallCount.should.equal(paramSets.length, "each param set should have been POSTed");

				for (var i = 0; i < paramSets.length; i++) {
					var params = paramSets[i];

					var parsedUrl = url.parse(post.url);

					Math.random(); // I have absolutely no idea why it fails unless there was some processing to be done after url.parse…

					(parsedUrl.protocol + "//" + parsedUrl.host).should.equal(config.hostname);
					args[1].body.should.equal(qs.stringify(params));
				}

				done();
			});

			var visitor = ua();
			visitor._queue.push.apply(visitor._queue, paramSets);
			visitor.send(fn);
		});

		it("should send individual requests when batchting is false", function(done) {
			var paramSets = [
				{first: Math.random()},
				{second: Math.random()},
				{third: Math.random()}
			]

			var fn = sinon.spy(function () {
				fn.calledOnce.should.equal(true, "callback should have been called once")
				fn.thisValues[0].should.equal(visitor, "callback should be called in the context of the visitor instance");

				fn.args[0].should.eql([null, 3], "no error, 3 requests");

				done();
			});

			var visitor = ua({enableBatching:false});
			visitor._queue.push.apply(visitor._queue, paramSets)
			visitor.send(fn);
		});

		describe("#batching is true", function() {
			it("should send request to collect path when only one payload", function(done) {
				var paramSets = [
					{first: Math.random()}
				]

				var fn = sinon.spy(function () {
					fn.args[0].should.eql([null, 1], "no error, 1 requests");

					var parsedUrl = url.parse(post.url);

					parsedUrl.pathname.should.eql(config.path);
					done();
				});

				var visitor = ua({enableBatching:true});
				visitor._queue.push.apply(visitor._queue, paramSets)
				visitor.send(fn);
			});

			it("should send request to batch path when more than one payload sent", function(done) {
				var paramSets = [
					{first: Math.random()},
					{second: Math.random()},
					{third: Math.random()}
				]

				var fn = sinon.spy(function () {
					fn.args[0].should.eql([null, 1], "no error, 1 requests");

					var parsedUrl = url.parse(post.url);

					parsedUrl.pathname.should.eql(config.batchPath);
					done();
				});

				var visitor = ua({enableBatching:true});
				visitor._queue.push.apply(visitor._queue, paramSets)
				visitor.send(fn);
			});

			it("should batch data in Post form", function(done) {
				var paramSets = [
					{first: Math.random()},
					{second: Math.random()},
					{third: Math.random()}
				]

				var fn = sinon.spy(function () {
					fn.calledOnce.should.equal(true, "callback should have been called once")
					fn.thisValues[0].should.equal(visitor, "callback should be called in the context of the visitor instance");

					fn.args[0].should.eql([null, 1], "no error, 1 requests");
					var args = post.args[0];

					var params = paramSets;
					var formParams = args[1].body.split("\n");
					formParams.should.have.lengthOf(3);
					formParams[0].should.equal(qs.stringify(params[0]));

					done();
				});

				var visitor = ua({enableBatching:true});
				visitor._queue.push.apply(visitor._queue, paramSets)
				visitor.send(fn);
			})

			it("should batch data based on batchSize", function(done) {
				var paramSets = [
					{first: Math.random()},
					{second: Math.random()},
					{third: Math.random()}
				]

				var fn = sinon.spy(function () {
					fn.calledOnce.should.equal(true, "callback should have been called once")
					fn.thisValues[0].should.equal(visitor, "callback should be called in the context of the visitor instance");

					fn.args[0].should.eql([null, 2], "no error, 2 requests");

					var body = post.args[0][1].body;

					body.split("\n").should.have.lengthOf(2);

					done();
				});

				var visitor = ua({enableBatching:true, batchSize: 2});
				visitor._queue.push.apply(visitor._queue, paramSets)
				visitor.send(fn);
			});
		});






		it("should add custom headers to request header", function (done) {
			var fn = sinon.spy(function () {
				fn.calledOnce.should.equal(true, "callback should have been called once");
				fn.thisValues[0].should.equal(visitor, "callback should be called in the context of the visitor instance");

				postCallCount.should.equal(1, "request should have been POSTed");

				var parsedUrl = url.parse(post.url);

				(parsedUrl.protocol + "//" + parsedUrl.host).should.equal(config.hostname);

				post.requestHeaders.should.have.key("User-Agent");
				post.requestHeaders["User-Agent"].should.equal("Test User Agent");

				done();
			});

			var visitor = ua({
				headers: {'User-Agent': 'Test User Agent'}
			});
			visitor._queue.push({});
			visitor.send(fn);
		});



	})

});











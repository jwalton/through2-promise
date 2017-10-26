"use strict";
var Promise = require("any-promise");
var test = require("tape");
var spigot = require("stream-spigot");
var concat = require("terminus").concat;
var pump = require("pump");

var throughPromise = require("../");

test("simple transform", function (t) {
	var stream = throughPromise(function (data) {
		return Promise.resolve(data);
	});

	function confirm(results) {
		t.equals(results.toString(), "helloworld", "passed through properly");
		t.end();
	}

	spigot(["hello", "world"]).pipe(stream).pipe(concat(confirm));

});

test("simple transform with push", function (t) {
	var stream = throughPromise(function (data) {
		this.push(data);
		return Promise.resolve();
	});

	function confirm(results) {
		t.equals(results.toString(), "helloworld", "passed through properly");
		t.end();
	}

	spigot(["hello", "world"]).pipe(stream).pipe(concat(confirm));

});

test("changing transform", function (t) {
	var stream = throughPromise(function (data) {
		return data.toString().toUpperCase();
	});

	function confirm(results) {
		t.equals(results.toString(), "HELLOWORLD", "capitalized properly");
		t.end();
	}

	spigot(["hello", "world"]).pipe(stream).pipe(concat(confirm));
});

test("rejection", function (t) {
	var stream = throughPromise(function () {
		return Promise.reject(new Error("Whoops"));
	});

	function confirm() {
		t.fail("Shouldn't ever resolve");
	}

	stream.on("error", function (e) {
		t.ok(e, "passed error properly");
		t.end();
	});

	spigot(["hello", "world"]).pipe(stream).pipe(concat(confirm));
});

test("throwing", function (t) {
	var stream = throughPromise(function () {
		throw new Error("Whoops");
	});

	function confirm() {
		t.fail("Shouldn't ever resolve");
	}

	stream.on("error", function (e) {
		t.ok(e, "passed error properly");
		t.end();
	});

	spigot(["hello", "world"]).pipe(stream).pipe(concat(confirm));
});

// Tests scenario from in https://github.com/RangerMauve/through2-map-promise/issues/2
test("unpiped", function (t) {
	var VALUES = 100;
	var data = [];
	var i = VALUES;
	while(i--) data.push(i);

	var seen = 0;
	var out = throughPromise.obj(function(item) {seen++;});

	out.on('finish', function() {
		t.equal(seen, VALUES, "expected " + VALUES + " results");
		t.end();
	});

	spigot({objectMode: true}, data)
	.pipe(out);
});

test("flush function", function (t) {
	debugger;
	var stream = throughPromise(
		function (data) {return data;},
		function () {return "!";}
	);

	var results;

	function confirm(err) {
		if(err) {
			return t.end(err);
		}

		t.equals(results.toString(), "helloworld!", "passed through properly");
		t.end();
	}

	pump(
		spigot(["hello", "world"]),
		stream,
		concat(function(answer) {results = answer;}),
		confirm
	);
});

test("flush function (with push)", function (t) {
	debugger;
	var stream = throughPromise(
		function (data) {this.push(data);},
		function () {this.push("!");}
	);

	var results;

	function confirm(err) {
		if(err) {
			return t.end(err);
		}

		t.equals(results.toString(), "helloworld!", "passed through properly");
		t.end();
	}

	pump(
		spigot(["hello", "world"]),
		stream,
		concat(function(answer) {results = answer;}),
		confirm
	);
});

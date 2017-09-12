/**
 * Created by rtholmes on 17-08-2016.
 */
/*
import Server from "../src/rest/Server";
import Log from "../src/Util";

// https://www.npmjs.com/package/icedfrisby
var frisby = require('icedfrisby');
var Joi = require('joi');
var FormData = require('form-data');
var fs = require('fs');
var http = require('http');
var lodash = require('lodash');
import {expect, assert} from 'chai';

describe("Query Service", function () {
    this.timeout(15000);

    const URL = 'http://localhost:4321/query';
    var server: Server;

    before(function () {
        return new Promise(function (fulfill, reject) {
            server = new Server(4321);
            server.start().then(function (val: boolean) {
                Log.test("QueryService::before() - started: " + val);

                var readStream = fs.createReadStream("public_suite/310courses.1.0.zip");

                var options = {
                    host:   'localhost',
                    port:   4321,
                    path:   '/dataset/courses',
                    method: 'PUT'
                };

                var req = http.request(options, function (res: any) {
                    server.stop().then(function (val: boolean) {
                        Log.test("QueryService::before() - stopped: " + val);
                        fulfill();
                    }).catch(function (err) {
                        Log.error("QueryService::before() - ERROR: " + err);
                        reject();
                    });
                });
                readStream.pipe(req);
            }).catch(function (err) {
                Log.error("QueryService::before() - ERROR: " + err);
                reject();
            });
        });
    });


    beforeEach(function (done) {
        server = new Server(4321);
        server.start().then(function (val: boolean) {
            Log.test("QueryService::beforeEach() - started: " + val);
            done();
        }).catch(function (err) {
            Log.error("QueryService::beforeEach() - ERROR: " + err);
            done();
        });
    });

    afterEach(function (done) {
        server.stop().then(function (val: boolean) {
            Log.test("QueryService::afterEach() - closed: " + val);
            done();
        }).catch(function (err) {
            Log.error("QueryService::afterEach() - ERROR: " + err);
            done();
        });
    });
    var file = fs.readFileSync("public_suite/queries.json");
    var tests = JSON.parse(file);
    for (let test of tests) {
        let types = getJSONTypes(JSON.parse(test["expected-json-types"]));
        let expectedResult: any = generateResultJSON(test["expected-json"]);
        frisby.create(test["title"])
            .post(URL, test["query"], {
                json: true
            })
            .inspectRequest('Request: ')
            .inspectStatus('Response status: ')
            .inspectBody('Response body: ')
            .expectStatus(test["expected-status"])
            .expectJSONTypes(types)
            .afterJSON(function (json: any) {

                expect(typeof json.result).not.to.equal('undefined');

                // Generates a count of objects in the result and in the expected result
                let a = lodash.countBy(json["result"], JSON.stringify);
                // console.log("Our result:" + json["result"]);
                let b = lodash.countBy(expectedResult["result"], JSON.stringify);
                // Compares the two counts to check that the result is equal to the expected result
                let c = lodash.isEqual(a, b);
                if (!c) {
                    Log.test("Expected:");
                    console.log(expectedResult["result"]);
                    Log.test("Received:");
                    console.log(json["result"]);
                }
                expect(c).to.be.true;

                expect(typeof json.render).not.to.equal('undefined');
                c = lodash.isEqual(json["render"], expectedResult["render"]);
                if (!c) {
                    Log.test("Expected:");
                    Log.test(expectedResult["result"]);
                    Log.test("Received:");
                    Log.test(json["result"]);
                }
                expect(c).to.be.true;
                let order = test["query"]["ORDER"];
                if(order != undefined) {
                    let previous = -1;
                    let previousEntry = {}
                    for(let entry of json["result"]) {
                        let current = entry[order]
                        assert.isAtMost(previous, current, JSON.stringify(entry) + " should appear before " + JSON.stringify(previousEntry));
                        previous = current;
                        previousEntry = entry;
                    }
                }
            })
            .toss()
    }

    function getJSONTypes(json: any): {} {
        let types: any = {};
        for (let key in json) {
            let t = json[key]
            types[key] = eval(t)
        }
        return types;

    }

    function generateResultJSON(query: any): {} {
        let file = fs.readFileSync("public_suite/results/" + query)
        return JSON.parse(file);
    }


    frisby.create('Should not be able to submit an empty query')
        .post(URL, {})
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(400)
        .toss();

    frisby.create('Should not be able to hit an endpoint that does not exist')
        .post('http://localhost:4321/post')
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(404)
        .toss();

}); // describe
*/


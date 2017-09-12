/**
 * Created by rtholmes on 17-08-2016.
 */

import Server from '../src/rest/Server';
import Log from "../src/Util";

// https://www.npmjs.com/package/icedfrisby
var frisby = require('icedfrisby');
var Joi = require('joi');
import JSZip = require('jszip');

describe("Dataset Service", function () {
    this.timeout(15000);

    const URL = 'http://localhost:4321/dataset/';
    var server: Server;

    beforeEach(function (done) {
        server = new Server(4321);
        server.start().then(function (val: boolean) {
            Log.test("DatasetService::beforeEach() - started: " + val);
            done();
        });
    });

    afterEach(function (done) {
        server.stop().then(function (val: boolean) {
            Log.test("DatasetService::afterEach() - closed: " + val);
            done();
        }).catch(function (err) {
            Log.error("DatasetService::afterEach() - ERROR: " + err);
            done();
        });
    });

    // base64 representation of a zip file; could also get this by reading a file from fs
     var zipContent = 'UEsDBAoAAAAIAAEiJEm/nBg/EQAAAA8AAAALAAAAY29udGVudC5vYmqrVspOrVSyUipLzClNVaoFAFBLAQIUAAoAAAAIAAEiJEm/nBg/EQAAAA8AAAALAAAAAAAAAAAAAAAAAAAAAABjb250ZW50Lm9ialBLBQYAAAAAAQABADkAAAA6AAAAAAA=';
     var buf = new Buffer(zipContent, 'base64');
    frisby.create('Should not be able to set a valid zip that does not contain an invalid dataset')
        .put(URL + 'courses', buf, {json: false, headers: {'content-type': 'application/octet-stream'}})
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(400)
        .expectJSONTypes({
            error: Joi.string() // we don't care what the error says, but it should be there
        })
        .toss();

    buf = new Buffer('adfadsfad', 'base64');
    frisby.create('Should not be able to set a dataset that is not a zip file')
        .put(URL + 'courses', buf, {json: false, headers: {'content-type': 'application/octet-stream'}})
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(400)
        .toss();

});



"use strict";
var Server_1 = require('../src/rest/Server');
var Util_1 = require("../src/Util");
var frisby = require('icedfrisby');
var Joi = require('joi');
describe("Dataset Service", function () {
    this.timeout(15000);
    var URL = 'http://localhost:4321/dataset/';
    var server;
    beforeEach(function (done) {
        server = new Server_1.default(4321);
        server.start().then(function (val) {
            Util_1.default.test("DatasetService::beforeEach() - started: " + val);
            done();
        });
    });
    afterEach(function (done) {
        server.stop().then(function (val) {
            Util_1.default.test("DatasetService::afterEach() - closed: " + val);
            done();
        }).catch(function (err) {
            Util_1.default.error("DatasetService::afterEach() - ERROR: " + err);
            done();
        });
    });
    var zipContent = 'UEsDBAoAAAAIAAEiJEm/nBg/EQAAAA8AAAALAAAAY29udGVudC5vYmqrVspOrVSyUipLzClNVaoFAFBLAQIUAAoAAAAIAAEiJEm/nBg/EQAAAA8AAAALAAAAAAAAAAAAAAAAAAAAAABjb250ZW50Lm9ialBLBQYAAAAAAQABADkAAAA6AAAAAAA=';
    var buf = new Buffer(zipContent, 'base64');
    frisby.create('Should not be able to set a valid zip that does not contain an invalid dataset')
        .put(URL + 'courses', buf, { json: false, headers: { 'content-type': 'application/octet-stream' } })
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(400)
        .expectJSONTypes({
        error: Joi.string()
    })
        .toss();
    buf = new Buffer('adfadsfad', 'base64');
    frisby.create('Should not be able to set a dataset that is not a zip file')
        .put(URL + 'courses', buf, { json: false, headers: { 'content-type': 'application/octet-stream' } })
        .inspectRequest('Request: ')
        .inspectStatus('Response status: ')
        .inspectBody('Response body: ')
        .expectStatus(400)
        .toss();
});
//# sourceMappingURL=ServerDatasetSpec.js.map
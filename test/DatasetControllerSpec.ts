/**
 * Created by rtholmes on 2016-09-03.
 */

import DatasetController from "../src/controller/DatasetController";
import Log from "../src/Util";

import JSZip = require('jszip');
import {expect} from 'chai';
import InsightFacade from "../src/controller/InsightFacade";

describe("DatasetController", function () {

    this.timeout(20000);

    beforeEach(function () {
    });

    afterEach(function () {
    });

    it("Should be able to receive a Dataset", function () {
        Log.test('Creating dataset');
        let content = {key: 'value'};
        let zip = new JSZip();
        zip.file('content.obj', JSON.stringify(content));
        const opts = {
            compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
        };
        zip.generateAsync(opts).then(function (data) {
            Log.test('Dataset created');
            let controller = new DatasetController();
            controller.process('setA', data);
        }).then(function (result) {
            Log.test('Dataset processed; result: ' + result);
            expect(result).to.equal(204);
        });
    });

    it("Should be able to get few Datasets", function () {
        Log.test('Creating dataset');
        let content = {key: 'value'};
        let zip = new JSZip();
        zip.file('content.obj', JSON.stringify(content));
        const opts = {
            compression: 'deflate', compressionOptions: {level: 2}, type: 'base64'
        };
        var controller = new DatasetController();
        zip.generateAsync(opts).then(function (data) {
            Log.test('Dataset created');
            controller.process('setA', data);
        }).then(function (result) {
            zip.generateAsync(opts).then(function (data) {
                Log.test('Dataset created');
                controller.process('setB', data);
            }).then(function (result) {
                var datasets = controller.getDatasets();
                expect(datasets).to.not.be(null);
            }).catch(function (err) {
                expect.fail();
            });
        }).catch(function (err) {
            expect.fail();
        });
    });


    it("Should return 404 if datasets at a specified ID doesnt exist", function () {
        let controller = new DatasetController();
        var response = controller.deleteDataset("elad");
        expect(response).to.be.equal(404);
    });
    
    it("deleteFile Should return 404 if id isn't real type (through getDataset)", function () {
        let controller = new DatasetController();
        var response = controller.deleteDataset(null);
        expect(response).to.be.equal(404);
    });


    it("Test isEmpty when true)", function () {
        let controller: DatasetController = new DatasetController();
        let obj = {"NAME": "elad"};
        var bool = controller.isEmpty(obj);
        expect(bool).to.be.equal(false);
    });

});

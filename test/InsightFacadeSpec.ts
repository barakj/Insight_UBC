/**
 * Created by Owner on 10/21/2016.
 */
import fs = require('fs');
import Log from "../src/Util";
import {expect} from 'chai';
import InsightFacade from "../src/controller/InsightFacade";
import {InsightResponse} from "../src/controller/IInsightFacade";

describe("InsightFacade", function () {

    this.timeout(20000);

    var zipFileContents: string = null;
    var facade: InsightFacade = null;
    before(function () {
        Log.info('InsightController::before() - start');
        // this zip might be in a different spot for you
        zipFileContents = new Buffer(fs.readFileSync('test/310courses.1.0.zip')).toString('base64');
        try {
            // what you delete here is going to depend on your impl, just make sure
            // all of your temporary files and directories are deleted
            fs.unlinkSync('src/controller/data/courses.json');
        } catch (err) {
            // silently fail, but don't crash; this is fine
            Log.warn('InsightController::before() - courses.json not removed (probably not present)');
        }
        Log.info('InsightController::before() - done');
    });

    beforeEach(function () {
        facade = new InsightFacade();
    });

    it("Should be able to add a add a new dataset (204)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Should be able to update an existing dataset (201)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('courses', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("Should not be able to add an invalid dataset (400)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('courses', 'some random bytes').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it("Should be able to invalidate a query with either group or apply, and missing the other one", function () {
        var that = this;
        let query: any ={
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response:InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });
    //----------------------------------------------------------------------------------------------------

    it("Should be able to invalidate a query with both group and apply, but group has no body", function () {
        var that = this;
        let query: any ={
            "GET": ["courses_id","courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response:InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    //----------------------------------------------------------------------------------------------------



    it("Should be able to invalidate a query with GET elements that are not in GROUP", function () {
        var that = this;
        let query: any ={
            "GET": ["courses_dept", "courses_id", "courseAverage", "courses_title"],
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response:InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    //----------------------------------------------------------------------------------------------------

    it("Should be able to invalidate a query with GET elements that are not in APPLY", function () {
        var that = this;
        let query: any ={
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response:InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    //----------------------------------------------------------------------------------------------------

    it("Should be able to invalidate a query with more elements in GROUP and APPLY than GET", function () {
        var that = this;
        let query: any ={
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id", "courses_title" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response:InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it("Should be able to invalidate queries with no GET ", function () {
        var that = this;
        let query: any = {
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("should be able to validate a query with GROUP and APPLY", function () {
        var that = this;
        let query: any = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect(response.code).to.equal(200);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });

    it("should return 424 if resource hasnt been PUT ", function () {
        var that = this;
        let query: any = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {
                "IS": {
                    "team_dept": "cpsc"
                }
            },

            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(424);
        });
    });

    it("should return 400 if invalid (keys of apply not unique)", function () {
        var that = this;
        let query: any = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "courseAverage"],
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"courseAverage": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courseAverage", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    /*
    it("Should not be able to remove dataset which is not there", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.removeDataset('axzczxsddas').then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(404)
        });
    });
    */



    it("Should be able to add a new rooms dataset (204)", function () {
        var that = this;
        zipFileContents = new Buffer(fs.readFileSync('test/310rooms.1.1.zip')).toString('base64');
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('rooms', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(204);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });


    it("should return 400 if querying multiple datasets in get", function () {
        var that = this;
        let query: any =  {
            "GET": ["courses_fullname", "rooms_number"],
            "WHERE": {"IS": {"rooms_shortname": "DMP"}},
            "ORDER": { "dir": "UP", "keys": ["rooms_number"]},
            "AS": "TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });


    it("should return 400 if querying multiple datasets other way", function () {
        var that = this;
        let query: any =  {
            "GET": ["rooms_fullname", "courses_number"],
            "WHERE": {"IS": {"rooms_shortname": "DMP"}},
            "ORDER": { "dir": "UP", "keys": ["rooms_number"]},
            "AS": "TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("should return 400 if querying multiple datasets in WHERE", function () {
        var that = this;
        let query: any =  {
            "GET": ["rooms_fullname", "rooms_number"],
            "WHERE": {"IS": {"courses_dept": "CPSC"}},
            "AS": "TABLE"
        };

        return facade.performQuery(query).then(function (response: InsightResponse) {
            expect.fail();
        }).catch(function (response: InsightResponse) {
            expect(response.code).to.equal(400);
        });
    });

    it("Should be able to update an existing dataset for rooms (201)", function () {
        var that = this;
        Log.trace("Starting test: " + that.test.title);
        return facade.addDataset('rooms', zipFileContents).then(function (response: InsightResponse) {
            expect(response.code).to.equal(201);
        }).catch(function (response: InsightResponse) {
            expect.fail('Should not happen');
        });
    });




});
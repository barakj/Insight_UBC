/**
 * Created by rtholmes on 2016-10-31.
 */

import {Datasets} from "../src/controller/DatasetController";
import QueryController from "../src/controller/QueryController";
import {QueryRequest} from "../src/controller/QueryController";
import Log from "../src/Util";

import {expect} from 'chai';
import fs = require('fs');
import path = require('path');
import {QueryResponse} from "../src/controller/QueryController";
describe("QueryController", function () {

    this.timeout(30000);

    beforeEach(function () {
    });

    afterEach(function () {
    });

    it("Should be able to validate a valid query", function () {
        // NOTE: this is not actually a valid query for D1
        let query: QueryRequest = {GET: 'food', WHERE: {IS: 'apple'}, ORDER: 'food', AS: 'table'};
        let dataset: Datasets = {};
        let controller = new QueryController(dataset);
        let isValid = controller.isValid(query);
        expect(isValid).to.equal(true);
    });

    it("Should be able to invalidate an invalid query", function () {
        let query: any = null;
        let dataset: Datasets = {};
        let controller = new QueryController(dataset);
        let isValid = controller.isValid(query);
        expect(isValid).to.equal(false);
    });

    it("Should be able to query, although the answer will be empty", function () {
        // NOTE: this is not actually a valid query for D1, nor is the result correct.
        let query: QueryRequest = {GET: 'food', WHERE: {IS: 'apple'}, ORDER: 'food', AS: 'table'};
        let dataset: Datasets = {};
        let controller = new QueryController(dataset);
        let ret = controller.query(query);
        Log.test('In: ' + JSON.stringify(query) + ', out: ' + JSON.stringify(ret));
        expect(ret).not.to.be.equal(null);
        expect(controller.responseCode).to.be.equal(424);
    });


        it("Should be able to invalidate number when string is expected (error code: 400)", function () {
            let query: QueryRequest = {
                "GET": ["courses_dept", "courses_id", "courses_avg"],
                        "WHERE": {
                           "AND": [
                                    {"AND": [
                                            {"IS": {"courses_id": 310}},
                                            {"IS": {"courses_dept": "cpsc"}}
                                        ]},
                                    {"GT": {"courses_avg": 75}}
                                ]
                        },
                    "ORDER": "courses_avg",
                        "AS": "TABLE"
                };

            let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
            let controller = new QueryController(dataset);
            let response = controller.query(query);
            expect(response).to.deep.equal({"render":"TABLE","result":[]});
            expect(controller.responseCode).to.be.equal(400);
        });

    it("Should be able to invalidate string when number is expected (error code: 400)", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "AND": [
                    {"AND": [
                        {"EQ": {"courses_id": 310}},
                        {"EQ": {"courses_dept": "cpsc"}}
                    ]},
                    {"GT": {"courses_avg": 75}}
                ]
            },
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.deep.equal({"render":"TABLE","result":[]});
        expect(controller.responseCode).to.be.equal(400);
    });



    it("Should be able to process a query where the response is sorted by a string", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"GT": {"courses_avg": 96}},
            "ORDER": "courses_dept",
            "AS": "TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let query_1 = controller.query(query);
        let file: string = "query1.json";
        let fullpath: string = path.join('./test/', file);
        let content: any = null;
        try {
            fs.accessSync(fullpath,fs.F_OK);// Check if file exists/is accessable before reading
            content = JSON.parse(fs.readFileSync(fullpath).toString()); // Read file
        } catch (err) {
            expect.fail(err);
        }
        expect(query_1).to.deep.equal(content);
        expect(controller.responseCode).to.be.equal(200);
    });

    it("Should be able to process a complex query", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "OR": [
                    {"AND": [
                        {"GT": {"courses_avg": 70}},
                        {"IS": {"courses_dept": "adhe"}}
                    ]},
                    {"EQ": {"courses_avg": 90}}
                ]
            },
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let query_2 = controller.query(query);
        let file: string = "query2.json";
        let fullpath: string = path.join('./test/', file);
        let content: any = null;
        try {
            fs.accessSync(fullpath,fs.F_OK);// Check if file exists/is accessable before reading
            content = JSON.parse(fs.readFileSync(fullpath).toString()); // Read file
        } catch (err) {
            expect.fail(err);
        }
        expect(query_2).to.deep.equal(content);
        expect(controller.responseCode).to.be.equal(200);
    });

    it("Should be able to process a query with two AND's", function () {
        let query: QueryRequest ={
            "GET": ["courses_dept", "courses_id", "courses_avg"],
            "WHERE": {
                "AND": [
                    {"AND": [
                        {"IS": {"courses_id": "304"}},
                        {"IS": {"courses_dept": "cpsc"}}
                    ]},
                    {"LT": {"courses_avg": 80}}
                ]
            },
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let query_3 = controller.query(query);
        let file: string = "query3.json";
        let fullpath: string = path.join('./test/', file);
        let content: any = null;
        try {
            fs.accessSync(fullpath,fs.F_OK);// Check if file exists/is accessable before reading
            content = JSON.parse(fs.readFileSync(fullpath).toString()); // Read file
        } catch (err) {
            expect.fail(err);
        }
        expect(query_3).to.deep.equal(content);
        expect(controller.responseCode).to.be.equal(200);
    });


    it("Should be able to process a query simple group and apply", function () {
        let query: any ={
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let query_6 = controller.query(query);
        let file: string = "query6.json";
        let fullpath: string = path.join('./test/', file);
        let content: any = null;
        try {
            fs.accessSync(fullpath,fs.F_OK);// Check if file exists/is accessable before reading
            content = JSON.parse(fs.readFileSync(fullpath).toString()); // Read file
        } catch (err) {
            expect.fail(err);
        }
        expect(query_6).to.deep.equal(content);
        expect(controller.responseCode).to.be.equal(200);
    });

    it("Empty result, response code should be 200", function () {
        let query: any = {
            "GET": ["courses_dept"],
            "WHERE": {
                "IS": {
                    "courses_dept": "cpsdsdsadsc"
                }
            },
            "ORDER": "courses_dept",
            "AS": "TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let query_6 = controller.query(query);
        expect(query_6).to.deep.equal({"render":"TABLE","result":[]});
        expect(controller.responseCode).to.be.equal(200);
    });


    // GROUP and APPLY Errors:
    // Tests of wrong types for AVG, MAX, MIN --------------------------------------------------------------------------------
    it("AVG is given a string, expecting a number", function () {
        let query: any = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_dept"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.errorMessage).to.deep.equal("Can\'t average on a value that is not a number");
        expect(controller.responseCode).to.be.equal(400);
    });

    it("MAX is given a string, expecting a number", function () {
        let query: any = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"MAX": "courses_dept"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.errorMessage).to.deep.equal("Can\'t find max on a value that is not a number");
        expect(controller.responseCode).to.be.equal(400);
    });

    it("MIN is given a string, expecting a number", function () {
        let query: any = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"MIN": "courses_dept"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.errorMessage).to.deep.equal("Can\'t find min on a value that is not a number");
        expect(controller.responseCode).to.be.equal(400);
    });

    it("Not a valid token of APPLY", function () {
        let query: any = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"MEDIAN": "courses_dept"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.errorMessage).to.deep.equal("No such apply token");
        expect(controller.responseCode).to.be.equal(400);
    });

    it("If a key appears in GROUP or in APPLY, it cannot appear in the other one", function () {
        let query: any = {
            "GET": ["courses_id", "courseIdAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseIdAverage": {"AVG": "courses_id"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.errorMessage).to.deep.equal("If a key appears in GROUP or in APPLY, it cannot appear in the other one.");
        expect(controller.responseCode).to.be.equal(400);
    });

    it("An apply target should be unique", function () {
        let query: any = {
            "GET": ["courses_id", "courseAverage", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"courseAverage": {"AVG": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.errorMessage).to.deep.equal("An apply target should be unique");
        expect(controller.responseCode).to.be.equal(400);
    });

    it("COUNT courses fail", function () {
        let query: any = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "countFail"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"countFail": {"COUNT": "courses_fail"}} ],
            "ORDER": { "dir": "DOWN", "keys": ["courseAverage", "countFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });


    
    // ORDER:
    it("ORDER with dir: DOWN with multiple keys", function () {
        let query: any = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "DOWN", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });

    it("ORDER with no keys", function () {
        let query: any = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "DOWN"},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(400);
    });

    it("ORDER with dir that does not exist (not UP or DOWN)", function () {
        let query: any = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "DIAGONAL", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(400);
    });

    it("No ORDER", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"GT": {"courses_avg": 96}},
            "AS": "TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });

    // AND:
    it("AND without a body", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"AND": []},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.deep.equal({"render":"TABLE","result":[]});
        expect(controller.responseCode).to.be.equal(400);
    });

    it("AND with only one block", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"AND": [{"GT": {"courses_avg": 80}}]},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });

    // OR:
    it("OR without a body", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"OR": []},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.deep.equal({"render":"TABLE","result":[]});
        expect(controller.responseCode).to.be.equal(400);
    });

    it("OR with only one block", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"OR": [{"GT": {"courses_avg": 80}}]},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });



    // Compare MATH and compare STRING with wrong types (for both)
    it("Compare MATH and compare STRING with wrong types (for both)", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"OR": [{"GT": {"courses_hey": 80}},
                {"IS": {"courses_bye": "cpsc"}}]},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(400);
    });

    // Referencing invalid dataset in both processSTRING and processMATH
    it("Referencing invalid dataset in both processSTRING and processMATH", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"OR": [{"GT": {"games_avg": 80}},
                             {"IS": {"games_name": "cpsc"}}]},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(424);
    });

    // Comparator doesn't exist
    it("Comparator does not exist", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"HEY": "courses_avg"},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(400);
    });


    it("MIN query", function () {
        let query: any = {
            "GET": ["courses_id", "courseAverage"],
            "WHERE": {"IS": {"courses_dept": "cpsc"}} ,
            "GROUP": [ "courses_id" ],
            "APPLY": [ {"courseAverage": {"MIN": "courses_avg"}} ],
            "ORDER": { "dir": "UP", "keys": ["courseAverage", "courses_id"]},
            "AS":"TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });

    it("Empty WHERE", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });

    it("GET is only a string, D1 template", function () {
        let query: QueryRequest = {
            "GET": "courses_dept",
            "WHERE": {},
            "ORDER": "courses_avg",
            "AS": "TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });

    // Break ties in descending:
    it("Break ties in descending", function () {
        let query: any = {
            "GET": ["courses_dept", "courses_id", "courseAverage", "maxFail"],
            "WHERE": {},
            "GROUP": [ "courses_dept", "courses_id" ],
            "APPLY": [ {"courseAverage": {"AVG": "courses_avg"}}, {"maxFail": {"MAX": "courses_fail"}} ],
            "ORDER": { "dir": "DOWN", "keys": ["courseAverage", "maxFail", "courses_dept", "courses_id"]},
            "AS":"TABLE"
        };
        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });


    // NOT tests:
    it("NOT course average greater than 96", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"NOT": {"GT": {"courses_avg": 96}}},
            "ORDER": "courses_dept",
            "AS": "TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });

    it("Nested NOTs", function () {
        let query: QueryRequest = {
            "GET": ["courses_dept", "courses_avg"],
            "WHERE": {"NOT": {"NOT": {"GT": {"courses_avg": 96}}}},
            "ORDER": "courses_dept",
            "AS": "TABLE"
        };

        let dataset: Datasets = {'courses': JSON.parse(fs.readFileSync('src/controller/data/courses.json').toString())};
        let controller = new QueryController(dataset);
        let response = controller.query(query);
        expect(response).to.not.be.equal(null);
        expect(controller.responseCode).to.be.equal(200);
    });


    it("Should be able to process simple query with rooms", function () {
        let query: any = {
            "GET": ["rooms_fullname", "rooms_number"],
            "WHERE": {"IS": {"rooms_shortname": "DMP"}},
            "ORDER": { "dir": "UP", "keys": ["rooms_number"]},
            "AS":"TABLE"
        };


        let dataset: Datasets = {'rooms': JSON.parse(fs.readFileSync('src/controller/data/rooms.json').toString())};
        let controller = new QueryController(dataset);
        let query_7 = controller.query(query);
        let file: string = "query7.json";
        let fullpath: string = path.join('./test/', file);
        let content: any = null;
        try {
            fs.accessSync(fullpath,fs.F_OK);// Check if file exists/is accessable before reading
            content = JSON.parse(fs.readFileSync(fullpath).toString()); // Read file
        } catch (err) {
            expect.fail(err);
        }
        console.log(query_7);
        expect(query_7).to.deep.equal(content);
        expect(controller.responseCode).to.be.equal(200);
    });


    it("Should be able to process query with GROUP and APPLY using rooms dataset", function () {
        let query: any =  {
            "GET": ["rooms_shortname", "numRooms"],
            "WHERE": {"GT": {"rooms_seats": 160}},
            "GROUP": [ "rooms_shortname" ],
            "APPLY": [ {"numRooms": {"COUNT": "rooms_name"}} ],
            "AS": "TABLE"
        };


        let dataset: Datasets = {'rooms': JSON.parse(fs.readFileSync('src/controller/data/rooms.json').toString())};
        let controller = new QueryController(dataset);
        let query_8 = controller.query(query);
        let file: string = "query8.json";
        let fullpath: string = path.join('./test/', file);
        let content: any = null;
        try {
            fs.accessSync(fullpath,fs.F_OK);// Check if file exists/is accessable before reading
            content = JSON.parse(fs.readFileSync(fullpath).toString()); // Read file
        } catch (err) {
            expect.fail(err);
        }
        console.log(query_8);
        expect(query_8).to.deep.equal(content);
        expect(controller.responseCode).to.be.equal(200);
    });


    it("Should be able to process complex query with rooms", function () {
        let query: any =  {
            "GET": ["rooms_fullname", "rooms_number", "rooms_seats"],
            "WHERE": {"AND": [
                {"GT": {"rooms_lat": 49.261292}},
                {"LT": {"rooms_lon": -123.245214}},
                {"LT": {"rooms_lat": 49.262966}},
                {"GT": {"rooms_lon": -123.249886}},
                {"IS": {"rooms_furniture": "*Movable Tables*"}}
            ]},
            "ORDER": { "dir": "UP", "keys": ["rooms_number"]},
            "AS": "TABLE"
        } ;


        let dataset: Datasets = {'rooms': JSON.parse(fs.readFileSync('src/controller/data/rooms.json').toString())};
        let controller = new QueryController(dataset);
        let query_9 = controller.query(query);
        let file: string = "query9.json";
        let fullpath: string = path.join('./test/', file);
        let content: any = null;
        try {
            fs.accessSync(fullpath,fs.F_OK);// Check if file exists/is accessable before reading
            content = JSON.parse(fs.readFileSync(fullpath).toString()); // Read file
        } catch (err) {
            expect.fail(err);
        }
        console.log(query_9);
        expect(query_9).to.deep.equal(content);
        expect(controller.responseCode).to.be.equal(200);
    });

});

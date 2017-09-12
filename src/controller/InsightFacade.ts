/**
 * Created by Owner on 10/21/2016.
 */
/*
 * This should be in the same namespace as your controllers
 */

import {IInsightFacade, InsightResponse} from "./IInsightFacade";
import DatasetController from "./DatasetController";
import Log from "../Util";
import {QueryRequest, default as QueryController, QueryResponse} from "./QueryController";
import SchedulingController from "./SchedulingController";



export default class InsightFacade implements IInsightFacade {

    //I added
    private static datasetController = new DatasetController();


    public addDataset(id: string, content: string): Promise<InsightResponse> {
        let controller = InsightFacade.datasetController;
        return new Promise(function (fulfill, reject) {
            try {
                controller.process(id, content).then(function (result) {
                    console.log("InsightFacade: addDataset successful: " + result);
                    fulfill({code: result, body: {}});
                }).catch(function (err: Error) {
                    console.log("InsightFacade: addDataset unsuccessful: " + err);
                    reject({code: 400, body: {}});
                });
            }
            catch (err) {
                Log.error('InsightFacade::addDataset(..) - ERROR: ' + err);
                reject({code: 400, body: {}});
            }
        });
    }



    public removeDataset(id: string): Promise<InsightResponse> {
        let controller = InsightFacade.datasetController;
        var that = this;
        return new Promise(function (fulfill, reject){
            try {
                var response: number = controller.deleteDataset(id);
                if (response == 204) {
                    fulfill({code: 204, body: {}});
                }
                else {
                    reject({code: 404, body: {status: "the operation was unsuccessful because the delete was for a resource what wasnt PUT"}});
                }
            }
            catch (err) {
                Log.error('InsightFacade::removeDataset(..) - ERROR: ' + err);
                reject({code: 404, body: {status: "the operation was unsuccessful because the delete was for a resource what wasnt PUT"}});
            }
        });
    }

    //gotta understand what to do with all the error message, wait for elad
    //also need to change route handler completely and only communicate with InsightFacade from there
    public performQuery(query: QueryRequest): Promise<InsightResponse> {
        return new Promise(function (fulfill, reject) {
            try {
                let controller = new QueryController(InsightFacade.datasetController.getDatasets());
                let isValid = controller.isValid(query);


                if (isValid == true) {
                    try {
                        let result = controller.query(query);
                        if (controller.responseCode == 200)
                            fulfill({code: controller.responseCode, body: result});
                        else if (controller.responseCode == 424)
                            reject({code: controller.responseCode, body: {missing: controller.invalidIds}});
                        else
                            reject({code: controller.responseCode, body: controller.errorMessage});
                    } catch (err) {
                        reject({code: controller.responseCode, body: controller.errorMessage});
                    }
                } else {
                    reject({code: 400, body: {error: 'Invalid query'}});
                }
            } catch (err) {
                reject({code: 400, body: {}});//may not be needed?
            }
        });
    }


    public schedule(coursesQuery: QueryRequest, roomsResult: any): Promise<InsightResponse> {
        let that = this;
        return new Promise(function (fulfill, reject) {
            let resp: InsightResponse = {
                code: 400, // TODO Assume 200 but should assign it anyways
                body: {}
            };
            try {
                let courses: Array<any> = null;
                let rooms: Array<any> = null;
                var promiseArr: Promise<void>[] = [];
                promiseArr.push(that.performQuery(coursesQuery).then(function(result) {
                    courses = (<QueryResponse>result.body).result;
                }));
                rooms = roomsResult;
                Promise.all(promiseArr).then(function() {
                    let controller = new SchedulingController(courses, rooms);
                    resp.code = 200;
                    resp.body = controller.schedule();
                    console.log("DONE SCHEDULE");
                    fulfill(resp);
                }).catch(function(err) {
                });
            } catch (err) {
                Log.error('InsightFacade::schedule(..) - ERROR: ' + err);
                resp.code = 400;
                resp.body = {error: 'error'};
                reject(resp);
            }
        });
    }

}
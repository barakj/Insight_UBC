/**
 * Created by rtholmes on 2016-06-14.
 */
import restify = require('restify');
import fs = require('fs');

import DatasetController from '../controller/DatasetController';
import {Datasets} from '../controller/DatasetController';
import QueryController from '../controller/QueryController';

import {QueryRequest} from "../controller/QueryController";
import Log from '../Util';
import InsightFacade from "../controller/InsightFacade";export default class RouteHandler {



    // private static datasetController = new DatasetController();
    private static insightFacade = new InsightFacade();
    

    public static getHomepage(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RoutHandler::getHomepage(..)');
        fs.readFile('./src/rest/views/index.html', 'utf8', function (err: Error, file: Buffer) {
            if (err) {
                res.send(500);
                Log.error(JSON.stringify(err));
                return next();
            }
            res.write(file);
            res.end();
            return next();
        });
    }

    public static putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::postDataset(..) - params: ' + JSON.stringify(req.params));

        try {
            let buffer:any = [];
            req.on('data', function onRequestData(chunk:any) {
                Log.trace('RouteHandler::postDataset(..) on data; chunk length: ' + chunk.length);
                buffer.push(chunk);
            });


            var id:string = req.params.id;

            req.once('end', function () {
                let concated = Buffer.concat(buffer);
                req.body = concated.toString('base64');
                Log.trace('RouteHandler::postDataset(..) on end; total length: ' + req.body.length);

                RouteHandler.insightFacade.addDataset(id, req.body).then(function (result) {
                    Log.trace('RouteHandler::postDataset(..) - processed');
                    res.json(result["code"], result["body"]);
                    return next();
                }).catch(function (err:Error) {
                    Log.trace('RouteHandler::postDataset(..) - ERROR: ' + err.message);
                    res.json(400, {error: err.message});
                    return next();
                });
            });
        } catch (err) {
            Log.error('RouteHandler::postDataset(..) - ERROR: ' + err.message);
            res.send(400, {error: err.message});
            return next();
        }
    }

    public static postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::postQuery(..) - params: ' + JSON.stringify(req.params));
        try {
            let query: QueryRequest = req.params;
            RouteHandler.insightFacade.performQuery(query).then(function(result) {
                console.log("THIS IS MY RESULT "+JSON.stringify(result));
                res.json(result.code, result.body);
                return next();
            }).catch(function (err) {
                res.json(err["code"], err["body"]);
                return next();
            });
        } catch (err) {
            Log.error('RouteHandler::postQuery(..) - ERROR: ' + err);
            res.send(400);
            return next();
        }
    }

    public static deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::deleteDataset(..) - params: ' + JSON.stringify(req.params));
        try {
            var id: string = req.params.id;
            RouteHandler.insightFacade.removeDataset(id).then(function(result) {
                res.json(result.code, result.body);
                return next();
            }).catch(function (err) {
                res.json(err["code"], err["body"]);
                return next();
            });
        } catch (err) {
            Log.error('RouteHandler::deleteDataset(..) - ERROR: ' + err);
            res.send(404);
            return next();
        }
    }

    public static schedule(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace('RouteHandler::makeSchedule(..)');
        var courses: QueryRequest = req.params.courseQuery;
        var rooms: QueryRequest = req.params.roomResult;
        RouteHandler.insightFacade.schedule(courses, rooms).then(function(result: any) {
            Log.trace('RouteHandler::makeSchedule(..) - Made Schedule');
            res.json(result.code, result.body);
        }).catch(function(err) {
            Log.error('RouteHandler::makeSchedule(..) - ERROR: ' + JSON.stringify(err));
            res.json(err.code, err.body);
        });
        return next();
    }




}

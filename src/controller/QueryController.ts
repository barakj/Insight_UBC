/**
 * Created by rtholmes on 2016-06-19.
 */

import {Datasets} from "./DatasetController";
import Log from "../Util";
import filter = require("core-js/fn/array/filter");
import {queryParser} from "restify";
import {type} from "os";

export interface QueryRequest {
    GET: string|string[];
    WHERE: {};
    ORDER?: string;
    AS: string;
    GROUP?: string[];
    APPLY?: any[];
}

export interface QueryResponse {
    render: string;
    result: any[];
}

export default class QueryController {
    private datasets: Datasets = null;
    //array containing all sections
    public allSections: any = [];
    //array containing all filtered sections
    public filteredSections: any[] = [];
    //variables to pass response codes and error messages to the RouteHandler
    public responseCode: number = 200;
    public errorMessage: string = null;
    //array containing all ID's that are invalid in the query
    public invalidIds: string[] = [];
    // our constant id for deliverable 1
    public id: string;

    public groupsOfSections: any = [];
    public applyObj: any = {};

    public groupKeys: any = [];
    public applyKeys: any = [];


    constructor(datasets: Datasets) {
        this.datasets = datasets;
    }

    /**
     * This function will check whether a certain query is valid or not
     */
    public isValid(query: QueryRequest): boolean {
        //removed where from here, since if empty need to return info about all sections
        if (typeof query === 'undefined' || query == null || !query.AS || !query.GET || Object.keys(query).length < 1) {
            return false;
        }


        if (typeof query.ORDER === 'string') {
            if (query.GET.indexOf(query.ORDER) == -1) {
                return false;
            }
        }

        //id check
        this.id = this.determineId(query.GET);
        for (var i = 0; i < query.GET.length; i++) {
            if (query.GET[i].indexOf('_') !== -1 && query.GET[i].split('_')[0] !== this.id) {
                //if got here, we have underscore keys with different key than ID
                this.errorMessage = "Multiple datasets are not supported";
                return false;
            }
        }

        if (!query.APPLY && !query.GROUP) {
            return true;
        }
        if (!query.APPLY || !query.GROUP) {
            return false;
        }

        if (this.isEmpty(query.GROUP)) {
            return false;
        }

        //need to check that all elements in GET are in either GROUP or APPLY
        var keys: string|string[];
        keys = query.GET;
        Log.trace("isValid(..)");
        for (let key of keys) {
            if (key.indexOf("_") != -1) {
                if (!this.isInGroup(query.GROUP, key))
                    return false;
            } else {
                if (!this.isInApply(query.APPLY, key))
                    return false;
            }
        }

        if (query.GROUP.length + query.APPLY.length != query.GET.length) {
            return false;
        }

        return true;
    }


    //check if the ey with underscore is part of group
    private isInGroup(group: any, key: any): boolean {
        Log.trace("isInGroup(..)");
        for (let k of group) {
            if (k == key) {
                return true;
            }
        }
        return false;
    }

    //check if the key with no underscore is part if apply
    private isInApply(apply: any, key: any): boolean {
        Log.trace("isInApply(..)");
        for (let k of apply) {
            for (let ok of Object.keys(k)) {
                if (ok == key) {
                    return true;
                }
            }
        }
        return false;
    }


    /**
     * This function will process the full query using its GET, WHERE, ORDER and AS fields
     * will generate a result array of data to be shown in the UI as a response to the query
     */
    public query(query: QueryRequest): QueryResponse {
        Log.trace('QueryController::query( ' + JSON.stringify(query) + ' )');
        //need to do that again
        this.id = this.determineId(query.GET);

        if (!this.datasets || !this.datasets.hasOwnProperty(this.id)) {
            this.responseCode = 424;
            this.errorMessage = "{missing: [" + this.id + "]}";
            this.invalidIds.push(this.id);
            return {render: query.AS, result: []};
        }


        //get all sections from cache
        this.allSections = this.datasets[this.id];

        //filter the sections based on the Where part of the query
        this.filteredSections = this.processQuery(query.WHERE);

        if (this.invalidIds.length != 0) {
            this.responseCode = 424;
            return {render: query.AS, result: []};
        }

        this.groupKeys = query.GROUP;

        var result: any[];
        if (query.GROUP) {
            this.processGROUP(query.GROUP);
            this.processAPPLY(query.APPLY);
            result = this.processGETwithGroupAndApply(query.GET);
        } else {
            result = this.processGET(query.GET);
        }

        result = this.processORDER(result, query.ORDER);
        return {render: query.AS, result: result};
    }

    public processGETwithGroupAndApply(queryGet: any): any {
        Log.trace("processGETwithGroupAndApply(..)");
        var result: any = [];

        for (var i = 0; i < this.groupsOfSections.length; i++) {
            var obj: any = {};
            var group = this.groupsOfSections[i];
            for (var j = 0; j < queryGet.length; j++) {
                var key = queryGet[j];
                if (key.indexOf("_") != -1) {
                    obj[key] = group[0][key];
                }
                else {
                    obj[key] = this.applyObj[key][i];
                }
            }
            result.push(obj);
        }
        return result;
    }

    public processAPPLY(applyQuery: any[]): any {
        Log.trace("processAPPLY(..)");
        for (let objectOfApply of applyQuery) {
            var key = Object.keys(objectOfApply)[0]; // courseAverage
            if (this.contains(this.applyKeys, key)) {
                this.responseCode = 400;
                this.errorMessage = "An apply target should be unique";
                return [];
            } else {
                this.applyKeys.push(key);
            }
            this.applyObj[key] = this.processApplyQuery(objectOfApply[key]); // {"AVG": "courses_avg"}
        }
    }


    public processApplyQuery(query: any): any {
        Log.trace("processApplyQuery(..)");
        var key = Object.keys(query)[0];

        if (this.contains(this.groupKeys, query[key])) {
            this.responseCode = 400;
            this.errorMessage = "If a key appears in GROUP or in APPLY, it cannot appear in the other one.";
            return [];
        }

        if (key == "AVG") {
            return this.processAVG(query["AVG"]);
        }
        else if (key == "COUNT") {
            return this.processCOUNT(query["COUNT"]);
        }
        else if (key == "MAX") {
            return this.processMAX(query["MAX"]);
        }
        else if (key == "MIN") {
            return this.processMIN(query["MIN"]);
        }
        else {
            this.responseCode = 400;
            this.errorMessage = "No such apply token";
            return [];
        }
    }

    public processAVG(key: any): any {
        Log.trace("processAVG(..)");
        var result: any[] = [];
        for (let group of this.groupsOfSections) {
            var sum = 0;
            var count = 0;
            for (var i = 0; i < group.length; i++) {
                var section = group[i];
                if (typeof section[key] !== 'number') {
                    this.responseCode = 400;
                    this.errorMessage = "Can't average on a value that is not a number";
                    return [];
                }
                sum += section[key];
                count++;
            }
            var avg = 0;
            if (count != 0) {
                avg = sum / count;
            }
            avg = Number(avg.toFixed(2));

            result.push(Number(avg.toString()));
        }
        return result;
    }

    public processCOUNT(key: any): any {
        var result: any[] = [];
        for (let group of this.groupsOfSections) {
            var temp: any[] = [];
            for (var i = 0; i < group.length; i++) {
                var section = group[i];
                if (!this.contains(temp, section[key])) {
                    temp.push(section[key]);
                }
            }
            result.push(temp.length);
        }
        return result;
    }

    public processMAX(key: any): any {
        var result: any[] = [];
        for (let group of this.groupsOfSections) {
            var currentMax = 0;
            for (var i = 0; i < group.length; i++) {
                var section = group[i];
                if (typeof section[key] !== 'number') {
                    this.responseCode = 400;
                    this.errorMessage = "Can't find max on a value that is not a number";
                    return [];
                }
                if (currentMax < section[key]) {
                    currentMax = section[key];
                }
            }
            result.push(currentMax);
        }
        return result;
    }

    public processMIN(key: any): any {
        var result: any[] = [];
        for (let group of this.groupsOfSections) {
            var currentMin = Number.MAX_VALUE;
            for (var i = 0; i < group.length; i++) {
                var section = group[i];
                if (typeof section[key] !== 'number') {
                    this.responseCode = 400;
                    this.errorMessage = "Can't find min on a value that is not a number";
                    return [];
                }
                if (currentMin > section[key]) {
                    currentMin = section[key];
                }
            }
            result.push(currentMin);
        }
        return result;
    }


    /**
     * This function will process the WHERE part of the query
     */
    public processQuery(query: any): any {
        Log.trace("QueryController::processQuery(..)");
        //have to check if the actual object is empty
        if (this.isEmpty(query)) {
            //if its empty, show fields for all sections
            return this.allSections;
        }
        //get the first key/comparator
        var comparator: any = Object.keys(query)[0];


        if (comparator == "GT"  || comparator == "LT" || comparator == "EQ" || comparator == "IS"){
            var currentDataset: string = Object.keys(query[comparator])[0].split("_")[0];
            if (this.id != currentDataset && this.datasets.hasOwnProperty(currentDataset)) {
                this.responseCode = 400;
                this.errorMessage = "Multiple datasets are not supported";
                return [];
            }
            if (comparator == "IS")
                return this.processSTRING(query["IS"], "IS");
            else
                return this.processMATH(query[comparator], comparator);
        }
        else if (comparator == "AND") {
            return this.processAND(query["AND"], "AND");
        }
        else if (comparator == "OR") {
            return this.processOR(query["OR"], "OR");
        }
        else if (comparator == "NOT") {
            return this.processNOT(query["NOT"], "NOT");
        }
        //if invalid comparator, send 400 error
        else {
            this.responseCode = 400;
            this.errorMessage = "processQuery() - invalid comparator " + comparator;
            return [];
        }
    }

    /**
     * Check if the key given is an ID of a valid dataset
     */
    public isInvalidDataset(key: string) {
        //get the first word of the key, which is the ID
        let keyId = key.split('_')[0];
        //if it is not the same as our current ID, its invalid
        if (keyId != this.id)
            return true;
        return false;
    }


    /**
     * Function that processes a Math comparator
     */
    public processMATH(query: any, comparator: string): any {
        Log.trace("QueryController::processMATH(..)");
        var key: any = Object.keys(query)[0];  //courses_avg | dept, etc

        if (this.isInvalidDataset(key)) {
            this.responseCode = 424;
            this.invalidIds.push(key.split('_')[0]);
            return [];
        }
        //the actual number to be compared to
        var value: any = query[key];
        if (typeof value !== 'number') {
            this.responseCode = 400;
            this.errorMessage = "processMATH: expected a number, given a string";
            return [];
        }

        return this.filterMath(comparator, key, value);

    }


    /**
     * Function that processes a String comparator
     */
    public processSTRING(query: any, comparator: string): any {
        Log.trace("QueryController::processSTRING(..)");
        var key: any = Object.keys(query)[0];//course_avg | dept, etc
        if (this.isInvalidDataset(key)) {
            this.responseCode = 424;
            this.errorMessage = "referencing an invalid dataset: " + key.split('_')[0];
            this.invalidIds.push(key.split('_')[0]);
            return [];
        }

        var value: any = query[key];
        if (typeof value !== 'string') {
            this.responseCode = 400;
            this.errorMessage = "processSTRING: expected a string, given a number";
            return [];
        }

        return this.filterString(comparator, key, value);
    }

    /**
     * Function that processes an AND comparator
     */
    public processAND(query: any, comparator: string): any {
        Log.trace("QueryController::processAND(..)");
        //array of filtered sections
        var filtered: any[] = [];
        for (var i = 0; i < query.length; i++) {
            //recursively go deeper in the query, process outer query every time
            //at every recursive call, add all the filtered section array into this big array
            filtered.push(this.processQuery(query[i]));
        }
        //AND has no body
        if (filtered.length == 0) {
            this.responseCode = 400;
            this.errorMessage = "AND without a body";
            return [];
        }
        else if (filtered.length == 1) {
            return filtered[0];
        }

        //return the intersection of all arrays in the filtered array
        return this.intersection(filtered);

    }

    /**
     * Function that processes an OR comparator
     */
    public processOR(query: any, comparator: string): any {
        Log.trace("QueryController::processOR(..)");
        var filtered: any[] = [];

        for (var i = 0; i < query.length; i++) {
            //recursively go deeper in the query, process outer query every time
            //at every recursive call, add all the filtered section array into this big array
            filtered.push(this.processQuery(query[i]));
        }
        //OR has no body
        if (filtered.length == 0) {
            this.responseCode = 400;
            this.errorMessage = "OR without a body";
            return [];
        }
        else if (filtered.length == 1) {
            return filtered[0];
        }

        //return the union of all arrays in the filtered array
        return this.union(filtered);

    }

    /**
     * Function that processes a NOT comparator
     */
    public processNOT(query: any, comparator: string): any {
        Log.trace("QueryController::processNOT(..)");
        var filtered: any[] = [];
        var nextQueryFiltered: any[];
        //Cancelling double NOT'S - make sure no timeouts
        if (Object.keys(query)[0] == "NOT") {
            return this.processQuery(query["NOT"]);
        }
        nextQueryFiltered = this.processQuery(query);

        for (var section of this.allSections) {
            //iterate over all sections, adding them to the final filtered array if not in query filtered array
            if (!this.contains(nextQueryFiltered, section)) {
                filtered.push(section);
            }
        }
        return filtered;
    }


    public union(filtered: any[]): any[] {
        Log.trace("QueryController::union(..)");
        var unionElements: any[] = [];
        //filtered is guaranteed to have at least 2 elements (look at processAnd)
        for (var i = 0; i < filtered.length; i++) {
            for (var j = 0; j < filtered[i].length; j++) {
                if (!this.contains(unionElements, filtered[i][j])) {
                    unionElements.push(filtered[i][j]);
                }
            }
        }

        return unionElements;
    }


    public intersection(filtered: any[]): any[] {
        Log.trace("QueryController::intersection(..)");
        var intersect: any[] = [];
        //filtered is guaranteed to have at least 2 elements (look at processAnd)
        var previous = filtered[0];
        for (var i = 1; i < filtered.length; i++) {
            intersect = this.getCommonElements(previous, filtered[i]);
            previous = intersect;
        }

        return intersect;
    }

    public getCommonElements(resultSoFar: any[], a: any[]): any[] {
        var common: any[] = [];
        for (var i = 0; i < a.length; i++) {
            if (this.contains(resultSoFar, a[i]) && !this.contains(common, a[i])) {
                common.push(a[i]);
            }
        }
        return common;
    }


    public contains(result: any[], element: any): boolean {
        for (var i = 0; i < result.length; i++) {
            if (result[i] === element)
                return true;
        }
        return false;
    }


// FILTERED METHODS --------------------------------------------------------------------------------

    public filterString(comparator: string, key: string, value: string): any {
        var filtered: any[] = [];

        for (let section of this.allSections) {
            if (typeof section[key] === 'undefined') {
                this.responseCode = 400;
                this.errorMessage = "section does not contain this key";
                return [];
            }
            if (this.compareString(comparator, section[key], value)) {
                filtered.push(section);
            }
        }

        return filtered;
    }

    public filterMath(comparator: string, key: string, value: number): any {
        Log.trace("QueryController::filterMATH(..)");
        var filtered: any[] = [];

        for (let section of this.allSections) {
            if (typeof section[key] === 'undefined') {
                this.responseCode = 400;
                this.errorMessage = "section does not contain this key";
                return [];
            }
            if (this.compareMath(comparator, section[key], value)) {
                filtered.push(section);
            }
        }
        return filtered;
    }


    // COMPARE METHODS --------------------------------------------------------------------------------

    public compareMath(comparator: string, sectionKey: number, value: number): boolean {
        // if (sectionKey == null || (typeof sectionKey) === 'undefined') {
        //     return false; // skip
        // }
        if (comparator == "GT")
            return (sectionKey > value);
        else if (comparator == "EQ")
            return (sectionKey == value);
        else if (comparator == "LT")
            return (sectionKey < value);

    }

    public compareString(comparator: string, sectionKey: any, value: string): boolean {
        // if (sectionKey == null || (typeof sectionKey) === 'undefined') {
        //     return false; // skip
        // }
        if (comparator == "IS") {
            var regex: RegExp = new RegExp('^' + value.split('*').join('.*') + '$');
            return (sectionKey.match(regex));
        }
    }


// PROCESS GET AND ORDER --------------------------------------------------------------------------------------------------------
    public processGROUP(groupQuery: any): any {
        Log.trace("processGROUP(..)");
        var keys: string[] = groupQuery;

        var map: any = new Map();

        for (var i = 0; i < this.filteredSections.length; i++) {
            let section = this.filteredSections[i];
            var values: any = [];
            for (let key of keys) {
                values.push(section[key]);
            }

            var hashKey = JSON.stringify(values);

            if (!map.has(hashKey)) {
                var arr: any = [];
                arr.push(section);
                map.set(hashKey, arr);
            }

            else {
                var tmp: any = map.get(hashKey);
                tmp.push(section);
                map.set(hashKey, tmp);
            }
        }

        var iterator: any = map.values();
        while (true) {
            var next: any = iterator.next();
            if (next.done == true)
                break;
            this.groupsOfSections.push(next.value);
        }
    }

    public processGET(getQuery: any): any {
        // Handling a case where getQuery is a string and not a string[]..
        var keys: string[] = [];
        if (typeof getQuery === 'string') {
            keys.push(getQuery);
        }
        else {
            keys = getQuery;
        }

        var sectionInfoArray: any = [];
        for (let section of this.filteredSections) {
            var sectionInfo: any = {};
            for (let key of keys) {
                sectionInfo[key] = section[key];
            }
            sectionInfoArray.push(sectionInfo);
        }

        return sectionInfoArray;
    }


// ORDER -----------------------------------------------------------------
    public processORDER(sections: any, orderQuery: any): any {
        Log.trace("processORDER(..)");
        // No order query:
        if (!orderQuery) {
            return sections;
        }

        // order query only contains the keys i.e. "courses_avg"
        if (typeof orderQuery === 'string') {
            var sortKey: string[] = [];
            sortKey.push(orderQuery);
            return this.sortAscending(sections, sortKey);
        }

        var keys: any[] = Object.keys(orderQuery);

        var dirKey: string = keys[0]; // "dir"
        var orderKey: string = keys[1]; // "keys"
        if (dirKey != "dir" || orderKey != "keys") {
            this.responseCode = 400;
            this.errorMessage = "must have a dir and a key";
            return sections;
        }

        var sortDir = orderQuery[dirKey]; // "UP" or "DOWN"
        var sortKeys = orderQuery[orderKey]; // courses_avg, etc.

        if (sortDir == "UP") {
            return this.sortAscending(sections, sortKeys);
        }
        else if (sortDir == "DOWN") {
            return this.sortDescending(sections, sortKeys);
        }
        else {
            this.responseCode = 400;
            this.errorMessage = "must be UP or DOWN";
            return sections;
        }
    }


    public sortAscending(sections: any[], sortKeys: any[]): any[] {
        Log.trace("sortAscending(..)");
        var that = this;
        sections.sort(function (a: any, b: any) {
            if (a[sortKeys[0]] > b[sortKeys[0]]) {
                return 1;
            }
            else if (a[sortKeys[0]] < b[sortKeys[0]]) {
                return -1;
            }
            else {
                return that.breakTieAscending(a, b, sortKeys);
            }
        });
        return sections;
    }


    private breakTieAscending(secA: any, secB: any, sortKeys: any[]): number {
        for (var i = 1; i < sortKeys.length; i++) {
            if (secA[sortKeys[i]] > secB[sortKeys[i]]) {
                return 1;
            }
            else if (secA[sortKeys[i]] < secB[sortKeys[i]]) {
                return -1;
            }
        }
        return 0;
    }


    public sortDescending(sections: any[], sortKeys: any): any[] {
        var that = this;
        sections.sort(function (a: any, b: any) {
            if (a[sortKeys[0]] < b[sortKeys[0]]) {
                return 1;
            }
            else if (a[sortKeys[0]] > b[sortKeys[0]]) {
                return -1;
            }
            else {
                return that.breakTieDescending(a, b, sortKeys);
            }
        });
        return sections;
    }


    private breakTieDescending(secA: any, secB: any, sortKeys: any[]): number {
        for (var i = 1; i < sortKeys.length; i++) {
            if (secA[sortKeys[i]] < secB[sortKeys[i]]) {
                return 1;
            }
            else if (secA[sortKeys[i]] > secB[sortKeys[i]]) {
                return -1;
            }
        }
        return 0;
    }

    private isEmpty(obj: any): boolean {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }
        return true;
    }

    private determineId(getQuery: any): string {
        var key: string;
        if (typeof getQuery === 'string')
            key = getQuery;
        else
            key = getQuery[0];

        return key.split('_')[0];
    }
}


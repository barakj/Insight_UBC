/**
 * Created by rtholmes on 2016-09-03.
 */

import Log from "../Util";
import JSZip = require('jszip');
import fs = require('fs');
import Section from "../model/Section";
import Room from "../model/Room";
import parse5 = require('parse5');
import {ASTNode} from "parse5";
import {ASTAttribute} from "parse5";

/**
 * In memory representation of all datasets.
 */
export interface Datasets {
    [id: string]: {};
}

export default class DatasetController {

    private datasets: Datasets = {};
    private dirPath: string = __dirname + '/data/';
    private links: any[] = [];
    private rooms: any[] = [];

    private shortNames: any = [];

    constructor() {
        Log.trace('DatasetController::init()');
    }
    /**
    * Checks whether the dataset with the given id is on disk (in the data drirectory) if not already in cache
     */
    public getDataset(id: string): any {
        Log.trace('DatasetController::getDataset( ' + id + '... )');
        if (!id) {
            return null;
        }

        if (!this.datasets.hasOwnProperty(id)) {
            var data: any = null;
            try {
                //reading file synchronously from disk
                data = fs.readFileSync(this.dirPath + id + '.json');
            } catch(err) {
                return null;
            }
            return data;
        }
        else {
            return this.datasets[id];
        }

    }

    /**
     * it datasets is empty, loads all datasets from the data directory
     */
    public getDatasets(): Datasets {
        Log.trace('DatasetController::getDatasetS(... )');
        if (this.isEmpty(this.datasets)) {
            var files: string[] = [];
            try {
                //reading all files from data directory
                files = fs.readdirSync(this.dirPath);
            } catch (err) {
                return null;
            }

            for (var file of files) {
                //for every file in data directory, load into datasets at the corresponding file name position
                file = file.substring(0,(file.indexOf(".")));
                this.datasets[file] = this.getDataset(file);
            }
        }
        return this.datasets;
    }

    public isEmpty(obj: any):boolean{
        for(var prop in obj) {
            return false;
        }
        return true;
    }

    /**
     * Process the dataset; save it to disk when complete.
     * Extracting information about all sections from the zip file, and storing it in a big array of Section objects.
     */
    public process(id: string, data: any): Promise<number> {
        Log.trace('DatasetController::process( ' + id + '... )');
        let that = this;
        return new Promise(function (fulfill, reject) {
            try {
                let myZip = new JSZip();
                myZip.loadAsync(data, {base64: true}).then(function (zip: JSZip) {
                    Log.trace('DatasetController::process(..) - unzipped');
                    var allPromises: any = []; //remove later
                    let processedDataset = {};
                    var alreadyExisted: boolean = false;

                    //if the datasets already has this id, it already exists
                    if(that.datasets && that.datasets.hasOwnProperty(id)) {
                        alreadyExisted = true;
                    }


                    /*
                    redundant check with the if's, fix that tomorrow at lab!!!!!!!!!!!!
                     */
                    if(id === "rooms") {
                        for (let key of Object.keys(zip.files)) {
                            //console.log(key);
                            //key is file names in the zip file
                            if (key == "index.htm") {
                                //read the index file
                                allPromises.push(zip.file(key).async("string"));
                            }
                        }
                    } else if(id === "courses"){
                        for (let fileName of Object.keys(zip.folder(id).files)) {
                            //inside of courses folder, now browsing all files
                            if (zip.file(fileName) == null) {
                                continue;
                            }
                            //every file read will be async and will therefore return a promise
                            //so add every promise to an array of promises
                            allPromises.push(zip.file(fileName).async("string"));
                        }
                    } else {
                            console.log("id entered by the user is invalid");
                            reject(400);
                    }

                    //after all file reads finish, do that
                    Promise.all(allPromises).then(function (content: any) {
                        if (id === "courses") {
                            processedDataset = that.parseSections(content);
                            that.save(id, processedDataset).then(function () {
                                if (alreadyExisted)
                                    fulfill(201);
                                else
                                    fulfill(204);
                            }).catch(function (err) {
                                reject(400);
                            });
                        } else if (id === "rooms") {
                            that.rooms = [];
                            that.parseRooms(zip, content).then(function (newContent: any) {
                                processedDataset = newContent;
                                that.save(id, processedDataset).then(function () {
                                    if (alreadyExisted)
                                        fulfill(201);
                                    else
                                        fulfill(204);
                                }).catch(function (err) {
                                    reject(400);
                                });
                            }).catch(function (e) {
                                console.log(e);
                            });
                        } else {
                            console.log("id entered by the user is invalid");
                            reject(400);
                        }
                    });
                }).catch(function (err) {
                    console.log('DatasetController::process(..) - ERROR: ' + err);
                    reject(400);
                });
            } catch (err) {
                Log.trace('DatasetController::process(..) - ERROR: ' + err);
                reject(err);
            }
        });
    }

    public parseRooms(zip: any, content: any): Promise<any> {
        Log.trace("in parseRooms(..)");
        var that = this;
        return new Promise(function (fulfil, reject) {
            //where table begins
            var firstTag = content[0].indexOf("<tbody>");
            //where table ends
            var lastTag = content[0].indexOf("</tbody>");
            //adding 8 to end index to include closing body tag
            var fragment = content[0].substring(firstTag, lastTag + 8);
            var document = parse5.parseFragment(fragment);
            //populate the link array with all the links
            that.getLinks(document);

            var allPromises:any[] = [];
            //for every link, open the file it refers to
            for (let link of that.links) {
                var file = link.substring(link.indexOf("/") + 1);//campus/discover....../shortname
                var path:any[] = link.split('/');
                // ['.', 'discover', 'campus', ...]
                var fileName:any = null;
                for (fileName of Object.keys(zip.folder(path[1]).files)) {
                    //inside of courses folder, now browsing all files
                    //filename will give path of every file in the zip folder
                    if (zip.file(fileName) == null) {
                        continue;
                    }
                    //if paths match, read the file
                    if (fileName == file) {
                        //console.log("this is the file we need to enter: " + fileName);
                        allPromises.push(zip.file(fileName).async("string"));
                        that.shortNames.push(fileName.split('/')[3]);
                    }
                }
            }

            //after all files have been read
            Promise.all(allPromises).then(function (content:any) {
                var newAllPromises:any[] = [];
                for (var i = 0; i < content.length; i++) {
                    newAllPromises.push(that.parseBuilding(content[i], that.shortNames[i]));
                }
                Promise.all(newAllPromises).then(function (newContent:any) {
                    for (let array of newContent) {
                        that.rooms.push.apply(that.rooms, array);
                    }
                    //console.log(that.rooms);
                    fulfil(that.rooms);
                }).catch(function (e) {
                    reject(e);
                });
            }).catch(function (e) {
                reject(e);
            });
        });
    }

    public parseBuilding(building: any, shortName: any): Promise<any> {
        //Log.trace("parseBuilding(..)");
        var that = this;
        return new Promise(function (fulfil, reject) {
            var buildingInfo:any = {};
            var roomsInfo:any[] = [];
            try {
                buildingInfo = that.parseBuildingInfo(building); // shortName, fullName, address
                roomsInfo = that.parseRoomsInfo(building); // number, href, seats, furniture, type
            } catch (e) {
                fulfil([]); // Building with no rooms or some other data error
            }

            var roomsNoLatLon:any[] = [];
            
            for (let i = 0; i < roomsInfo.length; i++) {
                let room:any = new Room(buildingInfo["fullName"],
                                        shortName,
                                        roomsInfo[i]["number"],
                                        buildingInfo["address"],
                                        roomsInfo[i]["seats"],
                                        roomsInfo[i]["type"],
                                        roomsInfo[i]["furniture"],
                                        roomsInfo[i]["href"]);
                roomsNoLatLon.push(room);
            }

            
            var url:any = encodeURI(buildingInfo["address"]);

            that.httpfunction(url).then(function (content:any) {
                for (let j = 0; j < roomsNoLatLon.length; j++) {
                    roomsNoLatLon[j].setLatLon(content["lat"], content["lon"]);
                }
                fulfil(roomsNoLatLon);
                }).catch (function (e) {
                    reject(e);
            });
        });
    }

    public httpfunction(address:string): Promise<any> {
        var options = {
            host: 'skaha.cs.ubc.ca',
            port: 8022,
            path: "/api/v1/team44/" + address
        };
        var new_http = require('http');
        return new Promise(function(fullfil, reject) {
            new_http.get(options, function(res: any) {
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk: any) => rawData += chunk);
                res.on('end', () => {
                    try {
                        let parsedData = JSON.parse(rawData);
                        fullfil(parsedData);
                    } catch (e) {
                        reject(e);
                    }
                });
            }).on('error', (e: any) => {
                console.log("why");
                console.log(`Got error: ${e.message}`);
            });
        });
    }

    public parseRoomsInfo(building: any): any[] {
        //Log.trace("parseRoomsInfo(..)");
        var roomsInfo: any[] = [];
        var firstTag = building.indexOf("<tbody>");
        var lastTag = building.indexOf("</tbody>") + 8;
        var fragment = building.substring(firstTag,lastTag);
        var document = parse5.parseFragment(fragment);

        var roomLinks:any[] = document.childNodes[0].childNodes;
        for (let i=1; i<roomLinks.length; i+=2) {
            roomsInfo.push(this.parseRoomInfo(roomLinks[i]));
        }
        return roomsInfo;
    }

    public parseRoomInfo(room: any): any {
        //Log.trace("parseRoomInfo(..)");
        var roomInfo: any = {};
        var roomData: any[] = room.childNodes;
        roomInfo["number"] = roomData[1].childNodes[1].childNodes[0]["value"].toString().trim();
        roomInfo["href"] = roomData[1].childNodes[1].attrs[0]["value"].trim();
        roomInfo["seats"] = Number(roomData[3].childNodes[0]["value"]);
        roomInfo["furniture"] = roomData[5].childNodes[0]["value"].trim();
        roomInfo["type"] = roomData[7].childNodes[0]["value"].trim();
        return roomInfo;
    }




    public parseBuildingInfo(building: any):any{
        //Log.trace("parseBuildingInfo(..)");
        var firstTag = building.indexOf("<div id=\"buildings-wrapper\">");
        var lastTag = building.indexOf("<div id=\"building-image\">");
        var fragment = building.substring(firstTag,lastTag);
        var document = parse5.parseFragment(fragment);
        var buildingInfo: any = document.childNodes[0]["childNodes"][1]["childNodes"];
        var fullName: any = buildingInfo[1]["childNodes"][0]["childNodes"][0]["value"];
        var address: any = buildingInfo[3]["childNodes"][0]["childNodes"][0]["value"];
        return {fullName: fullName, address: address};

    }



    public getLinks(node: ASTNode) {
       // Log.trace("in getLinks(..");
        var that = this;
        if (node.attrs) {
            if(node.nodeName == "a") {
                node.attrs.forEach(function (value: ASTAttribute) {
                    //if its a link, add it to the links array
                    if(value.name == "href") {
                        if (!that.contains(that.links, value.value))
                            that.links.push(value.value);
                    }

                });
            }
        }
        //recurse over child nodes if present
        if(node.childNodes){
            for(let child of node.childNodes)
                this.getLinks(child);
        }


    }



    public parseSections(content: any): any[] {
        var sections: any = [];
        // Iterate over all courses:
        for (let course of content) {
            course = JSON.parse(course);
            // Iterate over all sections:
            var result:any = course["result"];
            for (let section of result) {
                // Create Section and add to the array
                var sectionObject = new Section(
                    section["Subject"],
                    section["Course"],
                    section["Avg"],
                    section["Professor"],
                    section["Title"],
                    section["Pass"],
                    section["Fail"],
                    section["Audit"],
                    section["id"].toString());

                if (section["Section"] === "overall")
                    sectionObject.setYear(1900);
                else
                    sectionObject.setYear(Number(section["Year"]));

                sections.push(sectionObject);
            }
        }
        return sections;
    }

    /**
     * Writes the processed dataset to disk as 'id.json'.
     * The function overwrites any existing dataset with the same name.
     */
    private save(id: string, processedDataset: any): Promise<any> {
        Log.trace("save(..)");
        // add it to the memory model
        this.datasets[id] = processedDataset;

        //if the data directory doesnt exist, create it
        if (!fs.existsSync(this.dirPath)){
            fs.mkdirSync(this.dirPath);
        }

        var that = this;
        //write the dataset with the given id onto file 'id.json'
        return new Promise(function (fullfil, reject) {
            fs.writeFile(that.dirPath + id + '.json',JSON.stringify(that.datasets[id]),function (err){
                if(err)
                    reject(err);
                fullfil();
            });
        })
    }

    /**
     * This will delete both disk and memory caches for the dataset for the id given
     */
    public deleteDataset (id: string): number {
        var numToReturn = 404;
        var filePath: string = this.dirPath + id + '.json';
        if (this.datasets.hasOwnProperty(id)) {
            //  console.log("Error in deleteDataset: dataset with id " + id + " doesn't exist");
            delete this.datasets[id];
            numToReturn = 204;
        }
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath); // Think fs.delete(filepath) if it were named better
            numToReturn = 204;
        }
        else{
            numToReturn = 404;
        }

        return numToReturn;
    }



    public contains(result: any[], element: any): boolean {
        for (var i=0; i<result.length; i++) {
            if (result[i] === element)
                return true;
        }
        return false;
    }
    
    
}

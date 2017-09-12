/**
 * Created by Elad on 28/11/16.
 */
var courses = [];


$(document).on("click", "#routeBtn", function(e){
    e.preventDefault();
});



function submitRoutesQuery() {
    var userCoursesQuery = makeCoursesQuery();
    var queryAllRooms = {
        "GET": ["rooms_shortname", "rooms_number","rooms_seats"],
        "WHERE": {},
        "ORDER": "rooms_seats",
        "AS": "TABLE"
    };

    try {
        $.ajax("/query", {
            type: "POST",
            data: JSON.stringify(queryAllRooms),
            contentType: "application/json",
            dataType: "json",
            success: function (data) {
                if (data["result"].length != 0) {
                    makeScheduling(data["result"], userCoursesQuery);
                }
                else {
                    alert("No results found!");
                }
            }
        }).fail(function (e) {
            //spawnHttpErrorModal(e)
            console.log("Fail");
        });
    } catch (err) {
        //spawnErrorModal("Query Error", err);
        console.log("Catched Error");
    }
}

function makeCoursesQuery(){
    //var coursesChosen = $("#fullCourse");
    var keys = getNewWHEREKeys(courses);
    var GET = ["courses_dept", "courses_id"];
    var WHERE;
    if (keys.length == 0) {
        WHERE = {"EQ":{"courses_year":2014}};
    }
    else {
        WHERE = {"AND": [{"OR": keys},{"EQ":{"courses_year":2014}}]};
    }

    var GROUP = ["courses_dept", "courses_id"];
    var APPLY =  [ {"numSections": {"COUNT": "courses_uuid"}}, {"courseSize": {"MAX": "courses_size"}} ];
    var ORDER = { "dir": "UP", "keys": ["courseSize", "numSections"]};
    GET = getNewGET(APPLY, GET);
    return {"GET": GET, "WHERE": WHERE, "GROUP": GROUP, "APPLY": APPLY, "ORDER": ORDER, "AS": "TABLE"};
}
function getNewWHEREKeys(courses){
    var res = [];
    for(var i =0;i<courses.length;i++){
        var courseDept = courses[i].split(" ")[0];
        var courseNum = courses[i].split(" ")[1];
        res.push({"AND": [{"IS": {"courses_dept" : courseDept }},{"IS": {"courses_id" : courseNum }}]});
    }
    return res;
}

function makeScheduling(allRooms, specifiedCoursesQuery){
    var query = {
        courseQuery: specifiedCoursesQuery,
        roomResult: allRooms
    };

    try {
        $.ajax("/schedule", {type:"POST", data: JSON.stringify(query), contentType: "application/json", dataType: "json", success: function(data) {
            var roomsScheduled = extractCoursesAndRooms(data["schedule"]);
            getLatLonOfRooms(roomsScheduled);
        }}).fail(function (e) {
            console.log("err");
        });
    } catch (err) {
        console.log('catch');
    }
}
function getLatLonOfRooms(rooms){
    var whereKeys = [];
    for(var i =0;i<rooms.length;i++){
        var roomName = Object.keys(rooms[i])[0];
        roomName = roomName.replace(" ","_");
        whereKeys.push({"IS":{"rooms_name": roomName}});
    }
    var WHERE = {"OR": whereKeys};
    var GET = ["rooms_name","rooms_lat","rooms_lon"];
    var query = {"GET":GET, "WHERE": WHERE, "AS":"TABLE"};
    try {
        $.ajax("/query", {
            type: "POST",
            data: JSON.stringify(query),
            contentType: "application/json",
            dataType: "json",
            success: function (data) {
                var locations = getLocations(rooms, data["result"]);
                var ns = setMarkers(locations);
                setNeighborhood(ns);
                drop();
            }
        }).fail(function (e) {
            //spawnHttpErrorModal(e)
            console.log("Fail");
        });
    } catch (err) {
        //spawnErrorModal("Query Error", err);
        console.log("Catched Error");
    }

}

function setMarkers(locations){
    var res = [];
    for (var i = 0;i<locations.length;i++){
        var finalObj = {};
        var obj = {};
        obj["lat"] = locations[i]["lat"];
        obj["lng"] = locations[i]["lon"];
        finalObj["location"] = obj;
        var courses = "";
        var seen = [];
        for(var j=0;j<locations[i]["courses"].length;j++){
            var courseName = locations[i]["courses"][j];
            if (seen.indexOf(courseName) == -1) {
                seen.push(courseName);
                courses += courseName + "<br>";
            }
        }
        finalObj["courses"] = courses;
        finalObj["room"] = locations[i]["roomsName"];
        res.push(finalObj);
    }

    return res;
}



function getLocations(rooms, location) {
    var res = [];

    for (var i=0; i<location.length; i++) {
        var roomsName = location[i]["rooms_name"].replace("_", " ");
        var lat = location[i]["rooms_lat"];
        var lon = location[i]["rooms_lon"];
        var courses = rooms[i][roomsName];
        res.push({"lat": lat,"lon": lon, "roomsName": roomsName, "courses": courses});
    }

    return res;
}


function extractCoursesAndRooms(schedule) {
    var res = [];
    for (var i=0; i<schedule.length; i++) {
        var obj = getCourseAtRoom(schedule[i]);

        if (obj[schedule[i]["roomName"]].length != 0) {
            res.push(obj);
        }

    }
    return res;
}

function getCourseAtRoom(room) {
    var obj = {};
    var tmp = [];
    for (var i=0; i<room["coursesInMWF"].length; i++) {
        if (room["coursesInMWF"][i]) {
            tmp.push(room["coursesInMWF"][i]["courseName"]);
        }
    }

    for (var j=0; j<room["coursesInTT"].length; j++) {
        if (room["coursesInTT"][j]) {
            tmp.push(room["coursesInTT"][j]["courseName"]);
        }
    }

    obj[room["roomName"]] = tmp;

    return obj;
}

$(document).on("click", "#addCourse", function(e){
    e.preventDefault();
    var c = $("#fullCourse").val().trim();
    if(!c || courses.indexOf(c) != -1){
        return;
    }
    courses.push(c);
    for (var i = 0; i < courses.length; i++) {
        var newC = "<div class='addRemoveProperty'><button class='removeC' id='remove" + i + "'>x</button> " + courses[i] + " </div>";
    }
    $("#selectedCourses").append(newC);
});

$(document).on("click", ".removeC", function(e){
    var curElement = e.currentTarget.getAttribute('id').substring(6);
    courses.splice(Number(curElement), 1);
    var newC = "";
    for (var i = 0; i < courses.length; i++) {
        newC += "<div class='addRemoveProperty'><button class='removeC' id='remove" + i + "' value='X'>X</button> " + courses[i] + " </div>";
    }
    $("#selectedCourses").html(newC);
});
/**
 * Created by Elad on 26/11/16.
 */
var courseDepts = [];
var courseNumbers = [];
var buildingNames = [];

var coursesQuery;
var roomsResult;

function submitSchedulingQuery() {
    //need to build two queries
    coursesQuery = createCoursesQuery();
    sendQueries();
}

function sendQueries() {
    var buildingName = $("#buildingName1");
    var radius = $("#radius");
    var from = $("#from");
    var latFrom;
    var lonFrom;
    var isValid = validateDistance(radius, from);
    var GET;
    if (isValid == ONE_INPUT) {
        alert("ERROR: Please enter either both distance and building or none");
        return;
    }
    else if (isValid == NO_INPUT) {
        GET = [buildingName.attr("name"),
               "rooms_number",
                "rooms_seats"
        ];
    }
    else {//both
        GET = [buildingName.attr("name"),
            "rooms_number",
            "rooms_seats",
            "rooms_lat",
            "rooms_lon"
        ];

        var getFrom = {
            "GET": ["rooms_lat", "rooms_lon"],
            "WHERE": {"IS": {"rooms_shortname": from.val()}},
            "AS": "TABLE"
        };
        var latLonArr = [];
        try {
            $.ajax("/query", {
                type: "POST",
                data: JSON.stringify(getFrom),
                contentType: "application/json",
                dataType: "json",
                success: function (data) {
                    if (data["result"].length == 0) {
                        //small bug here, doesnt return completely so 2 error messages when from building doesnt exist
                        alert("From building doesnt exist!");
                        return;
                    }
                    latFrom = data["result"][0]["rooms_lat"];
                    lonFrom = data["result"][0]["rooms_lon"];
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
    var keys = getWHEREKeysForRooms(buildingNames);

    var WHERE = {};
    if (keys.length == 1)
        WHERE = keys[0];
    else if (keys.length > 1)
        WHERE = {"AND": keys};

    var ORDER = "rooms_seats";
    var query = {"GET": GET, "WHERE": WHERE, "ORDER": ORDER, "AS": "TABLE"};


    try {
        $.ajax("/query", {
            type: "POST",
            data: JSON.stringify(query),
            contentType: "application/json",
            dataType: "json",
            success: function (data) {
                //make sure data is not empty
                if (data["result"].length != 0) {
                    //if they both exist, calculate the distance, if not, dont modify result
                    if (data["result"][0]["rooms_lat"] && data["result"][0]["rooms_lon"]) {
                        var newResult = [];
                        for (var i = 0; i < data["result"].length; i++) {
                            var latTo = data["result"][i]["rooms_lat"];
                            var lonTo = data["result"][i]["rooms_lon"];
                            var distance = calculateDistance(latFrom, lonFrom, latTo, lonTo);
                            if (distance <= radius.val()) {
                                var newRoom = data["result"][i];
                                delete newRoom["rooms_lat"];
                                delete newRoom["rooms_lon"];
                                newResult.push(newRoom);
                            }
                        }
                        data["result"] = newResult;
                    }
                }
                if (data["result"].length != 0) {
                    afterSuccess(data["result"]);
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


function afterSuccess(roomsRes) {
    roomsResult = roomsRes;

    var query = {
        courseQuery: coursesQuery,
        roomResult: roomsResult
    };
    
    try {
        $.ajax("/schedule", {type:"POST", data: JSON.stringify(query), contentType: "application/json", dataType: "json", success: function(data) {
            $('#render').html("");
            $('#render').append('<h2>Timetable</h2>');
            $('#render').append('<p class="qualityMes">Quality Measure: ' + data["score"] + '%</p>');
            data["schedule"].sort(function (a, b) {
                if (a["roomName"] > b["roomName"]) {
                    return 1;
                }
                else if (a["roomName"] < b["roomName"]) {
                    return -1;
                }
                else {
                    return 0;
                }
            });

            var i;
            for (i=0; i<data["schedule"].length; i++) {
                generateScheduleTable(data["schedule"][i], i);
            }
            paintBackgroundOfCells(i);
        }}).fail(function (e) {
            console.log("err");
        });
    } catch (err) {
        console.log('catch');
    }
}


function generateScheduleTable(room, index) {
    var tablename = "table_" + index;
    var roomname = room['roomName'];
    var roomsize = room['roomSize'];

    var coursesMWF = [];
    for (var m=0; m<9; m+=3) {
        var tmp = [];
        tmp.push(room["coursesInMWF"][m]);
        tmp.push(room["coursesInMWF"][m+1]);
        tmp.push(room["coursesInMWF"][m+2]);
        coursesMWF.push(tmp);
    }


    var coursesTT = [];
    for (var k=0; k<6; k+=2) {
        var tmp2 = [];
        tmp2.push(room["coursesInTT"][k]);
        tmp2.push(room["coursesInTT"][k+1]);
        coursesTT.push(tmp2);
    }


    $('#render').append('<h4 class="roomNameResult">' + roomname + '</h4>');
    $('#render').append('<p class="roomSeatsResult">' + "Room seats: " + roomsize + '</p>');

    if (room["coursesInMWF"].length == 0 && room["coursesInTT"].length == 0) {
        $('#render').append('<p>No courses were scheduled for this room.</p>');
        return;
    }


    $('#render').append('<table id="' + tablename + '"></table>');
    $('#' + tablename).append('<tr><th>Time</th><th>Monday</th><th>Tuesday</th><th>Wednesday</th><th>Thursday</th><th>Friday</th></tr>');
    for(var i = 0; i < 3; i++) {
        var odd = [];
        var even = [];
        for(var j = 0;j<3;j++){
            if(!coursesMWF[i][j]){
                odd.push("");
            }
            else {
                odd.push(coursesMWF[i][j]["courseName"] + "<br>Seats: " + coursesMWF[i][j]["courseSeats"]);
            }
        }

        for(j = 0;j<2;j++){
            if(!coursesTT[i][j]){
                even.push("");
            }
            else {
                even.push(coursesTT[i][j]["courseName"] + "<br>Seats: " + coursesTT[i][j]["courseSeats"]);
            }
        }

        var hour = 8 + (3*i);
        var halfMin = '30';
        var wholeMin = '00';


        $('#' + tablename).append(
            $('<tr id="timetableTR">').append(
                $('<td>').append(
                    $('<tr>').append($('<td class="daysTH daysLighterBG">').text(hour + ':' + wholeMin)),
                    $('<tr>').append($('<td class="daysTH">').text(hour + ':' + halfMin)),
                    $('<tr>').append($('<td class="daysTH daysLighterBG">').text(hour+1 + ':' + wholeMin)),
                    $('<tr>').append($('<td class="daysTH">').text(hour+1 + ':' + halfMin)),
                    $('<tr>').append($('<td class="daysTH daysLighterBG">').text(hour+2 + ':' + wholeMin)),
                    $('<tr>').append($('<td class="lastTD daysTH">').text(hour+2 + ':' + halfMin))
                ),
                $('<td>').append(
                    $('<tr>').append($('<td class="mwfTD">').html(odd[0])),
                    $('<tr>').append($('<td class="mwfTD">').html(odd[1])),
                    $('<tr>').append($('<td class="lastTD mwfTD">').html(odd[2]))
                ),
                $('<td>').append(
                    $('<tr>').append($('<td class="ttTD">').html(even[0])),
                    $('<tr>').append($('<td class="lastTD ttTD">').html(even[1]))
                ),
                $('<td>').append(
                    $('<tr>').append($('<td class="mwfTD">').html(odd[0])),
                    $('<tr>').append($('<td class="mwfTD">').html(odd[1])),
                    $('<tr>').append($('<td class="lastTD mwfTD">').html(odd[2]))
                ),
                $('<td>').append(
                    $('<tr>').append($('<td class="ttTD">').html(even[0])),
                    $('<tr>').append($('<td class="lastTD ttTD">').html(even[1]))
                ),
                $('<td>').append(
                    $('<tr>').append($('<td class="mwfTD">').html(odd[0])),
                    $('<tr>').append($('<td class="mwfTD">').html(odd[1])),
                    $('<tr>').append($('<td class="lastTD mwfTD">').html(odd[2]))
                )
            )
        )
    }
    $('#render').append('<br>');
}

function paintBackgroundOfCells(tables) {
    for (var i=0; i<tables; i++) {
        var tableName = "table_" + i;
        $("#" + tableName + " tr td tr").each(function () {
            $('td', this).each(function () {
                var value = $(this).text();
                if (value != "" && !$(this).hasClass("daysTH")) {
                    $(this).css("background-color", "#f0f8ff");
                }
            });
        });
    }
}




function createCoursesQuery(){
    var courseDept = $("#courseDept1");
    var courseNumber = $("#courseNumber1");

    var GET = [courseDept.attr("name"), courseNumber.attr("name")];
    var keys = getWHEREKeys(courseDepts, courseNumbers);
    var WHERE = {};
    if (keys.length == 1)
        WHERE = keys[0];
    else if (keys.length > 1)
        WHERE = {"AND": keys};
    var GROUP = ["courses_dept", "courses_id"];
    var APPLY =  [ {"numSections": {"COUNT": "courses_uuid"}}, {"courseSize": {"MAX": "courses_size"}} ];
    var ORDER = { "dir": "UP", "keys": ["courseSize", "numSections"]};
    GET = getNewGET(APPLY, GET);
    return {"GET": GET, "WHERE": WHERE, "GROUP": GROUP, "APPLY": APPLY, "ORDER": ORDER, "AS": "TABLE"};
}

function getNewGET(apply, GETArray) {
    for (var i = 0; i < apply.length; i++) {
        GETArray.push(Object.keys(apply[i])[0]);
    }
    return GETArray;
}


function getWHEREKeys(courseDepts, courseNumbers) {
    var res = [];
    if (courseDepts.length != 0) {
        res.push(getWHEREKey($("#courseDept1").attr("name"), courseDepts, "IS"));
    }

    if (courseNumbers.length != 0) {
        res.push(getWHEREKey($("#courseNumber1").attr("name"), courseNumbers, "EQ"));
    }

    res.push({"EQ":{"courses_year":2014}});
    return res;
}

function getWHEREKeysForRooms(buildingNames){
    var res = [];
    if (buildingNames.length != 0) {
        res.push(getWHEREKey($("#buildingName1").attr("name"), buildingNames, "IS"));
    }
    return res;
}


function getWHEREKey(key, values, comparator) {
    var res = [];
    var obj = {};
    var finalObject = {};
    for (var i = 0; i < values.length; i++) {
        obj = {};
        finalObject = {};
        if (comparator == "IS")
            obj[key.toString()] = values[i];
        else
            obj[key.toString()] = Number(values[i]);
        finalObject[comparator] = obj;
        res.push(finalObject);
    }
    return {"OR": res};
}
function validateDistance(radius,from){
    radius = radius.val().trim();
    from = from.val().trim();
    if(!radius && !from)
        return NO_INPUT;
    else if(!radius || !from)
        return ONE_INPUT;
    else
        return TWO_INPUTS;
}

function calculateDistance(lat1, lon1, lat2, lon2){
    var R = 6371e3; // metres
    var lat1Rad = toRadians(lat1);
    var lat2Rad = toRadians(lat2);
    var latDiff = toRadians(lat2-lat1);
    var lonDiff = toRadians(lon2-lon1);

    var a = Math.sin(latDiff/2) * Math.sin(latDiff/2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(lonDiff/2) * Math.sin(lonDiff/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}


function toRadians(angle){
    return angle * Math.PI / 180;
}















// Add / Remove Department --------------------------------------
$(document).on("click", "#addDept1", function(e){
    e.preventDefault();
    var dept = $("#courseDept1").val().trim();
    if(!dept || courseDepts.indexOf(dept) != -1){
        return;
    }
    courseDepts.push(dept);
    for (var i = 0; i < courseDepts.length; i++) {
      //  var newDept = "<div class='addRemoveProperty'><button class='removeDept' id='remove" + i + "' value='X>x</button> " + courseDepts[i] + " </div>";
        var newDept = "<div class='addRemoveProperty'><button class='removeDept1' id='remove" + i + "'>x</button> " + courseDepts[i] + " </div>";
    }
    $("#selectedDepts").append(newDept);
});

$(document).on("click", ".removeDept1", function(e){
    var curElement = e.currentTarget.getAttribute('id').substring(6);
    courseDepts.splice(Number(curElement), 1);
    var newDept = "";
    for (var i = 0; i < courseDepts.length; i++) {
        newDept += "<div class='addRemoveProperty'><button class='removeDept1' id='remove" + i + "' value='X'>x</button> " + courseDepts[i] + " </div>";
    }
    $("#selectedDepts").html(newDept);
});

// Add / Remove Number --------------------------------------
$(document).on("click", "#addCourseNumber1", function(e){
    e.preventDefault();
    var dept = $("#courseNumber1").val().trim();
    if(!dept || courseNumbers.indexOf(dept) != -1){
        return;
    }
    courseNumbers.push(dept);
    for (var i = 0; i < courseNumbers.length; i++) {
        var newDept = "<div class='addRemoveProperty'><button class='removeCourseNumber1' id='remove" + i + "'>x</button> " + courseNumbers[i] + " </div>";
    }
    $("#selectedCourseNumbers").append(newDept);
});

$(document).on("click", ".removeCourseNumber1", function(e){
    var curElement = e.currentTarget.getAttribute('id').substring(6);
    courseNumbers.splice(Number(curElement), 1);
    var newCourseNum = "";
    for (var i = 0; i < courseNumbers.length; i++) {
        newCourseNum += "<div class='addRemoveProperty'><button class='removeCourseNumber1' id='remove" + i + "' value='X'>x</button> " + courseNumbers[i] + " </div>";
    }
    $("#selectedCourseNumbers").html(newCourseNum);
});

//for building name
$(document).on("click", "#addBuildingName1", function(e){
    e.preventDefault();
    var bName = $("#buildingName1").val().trim();
    if(!bName || buildingNames.indexOf(bName) != -1){
        return;
    }
    buildingNames.push(bName);
    for (var i = 0; i < buildingNames.length; i++) {
        var newName = "<div class='addRemoveProperty'><button class='removeBuildingName1' id='remove" + i + "'>x</button> " + buildingNames[i] + " </div>";
    }
    $("#selectedBuildingNames").append(newName);
});


$(document).on("click", ".removeBuildingName1", function(e){
    var curElement = e.currentTarget.getAttribute('id').substring(6);
    buildingNames.splice(Number(curElement), 1);
    var newBuildingName = "";
    for (var i = 0; i < buildingNames.length; i++) {
        newBuildingName += "<div class='addRemoveProperty'><button class='removeBuildingName1' id='remove" + i + "' value='X'>x</button> " + buildingNames[i] + " </div>";
    }
    $("#selectedBuildingNames").html(newBuildingName);
});
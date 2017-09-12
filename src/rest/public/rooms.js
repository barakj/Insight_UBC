/**
 * Created by Elad on 22/11/16.
 */
const NO_INPUT = 0;
const ONE_INPUT = 1;
const TWO_INPUTS = 2;



//URGENT!!!@#@!#@!#@#!
//CHANGE id of form dynamically
function submitRoomsQuery() {
    //e.preventDefault();

    var buildingName = $("#buildingName");
    var roomNumber = $("#roomNumber");
    var roomSize = $("#roomSize");
    var roomSizeOperator = $("#roomSizeOperator");
    var roomFurniture = $("#roomFurniture");
    var roomType = $("#roomType");
    var radius = $("#radius");
    var from = $("#from");
    var latFrom;
    var lonFrom;
    var isValid = validateDistance(radius,from);
    var GET;
    if(isValid == ONE_INPUT){
        alert("ERROR: Please enter either both distance and building or none");
        return;
    }
    else if(isValid == NO_INPUT) {
        GET = [buildingName.attr("name"),
            roomNumber.attr("name"),
            roomSize.attr("name"),
            roomFurniture.attr("name"),
            roomType.attr("name")
        ];
    }
    else{//both
        GET = [buildingName.attr("name"),
            roomNumber.attr("name"),
            roomSize.attr("name"),
            roomFurniture.attr("name"),
            roomType.attr("name"),
            "rooms_lat",
            "rooms_lon"
        ];


        var getFrom = {"GET": ["rooms_lat","rooms_lon"], "WHERE": {"IS": {"rooms_shortname": from.val()}}, "AS": "TABLE"};
        var latLonArr = [];
        try {
            $.ajax("/query", {type:"POST", data: JSON.stringify(getFrom), contentType: "application/json", dataType: "json", success: function(data) {
                if(data["result"].length == 0){
                    //small bug here, doesnt return completely so 2 error messages when from building doesnt exist
                    alert("From building doesnt exist!");
                    return;
                }
                latFrom = data["result"][0]["rooms_lat"];
                lonFrom = data["result"][0]["rooms_lon"];
            }}).fail(function (e) {
                //spawnHttpErrorModal(e)
                console.log("Fail");
            });
        } catch (err) {
            //spawnErrorModal("Query Error", err);
            console.log("Catched Error");
        }

        // latFrom = preformLatLonQuery()[0];
        // lonFrom =  preformLatLonQuery()[1];

    }
    var keys = getWHEREKeys(buildingName,roomNumber,roomSize,roomSizeOperator,roomFurniture,roomType);

    var WHERE = {};
    if (keys.length == 1)
        WHERE = keys[0];
    else if (keys.length > 1)
        WHERE = {"AND": keys};

    var query = {"GET":  GET, "WHERE": WHERE, "AS": "TABLE"};


    try {
        $.ajax("/query", {type:"POST", data: JSON.stringify(query), contentType: "application/json", dataType: "json", success: function(data) {
            //make sure data is not empty
            if(data["result"].length != 0) {
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
            if (data["render"] === "TABLE" && data["result"].length != 0) {
                generateTable(data["result"]);
            }
            else{
                alert("No results found!");
            }
        }}).fail(function (e) {
            //spawnHttpErrorModal(e)
            console.log("Fail");
        });
    } catch (err) {
        //spawnErrorModal("Query Error", err);
        console.log("Catched Error");
    }

    function getWHEREKeys(buildingName, roomNumber, roomSize, roomSizeOperator, roomFurniture, roomType) {
        var res = [];
        if (buildingName.val().trim()) {
            res.push(getWHEREKey(buildingName, "IS"));
        }
        if (roomNumber.val().trim()) {
            res.push(getWHEREKey(roomNumber, "EQ"));
        }

        if (roomSize.val().trim()) {
            res.push(getWHEREKey(roomSize, roomSizeOperator.val()));
        }

        if (roomFurniture.val() != "Any") {
            res.push(getWHEREKey(roomFurniture, "IS"));
        }

        if (roomType.val() != "Any") {
            res.push(getWHEREKey(roomType, "IS"));
        }

        return res;

    }

    function getWHEREKey(key, comparator) {
        var obj = {};
        var finalObject = {};
        if (comparator == "EQ" || comparator == "GT" || comparator == "LT")
            obj[key.attr("name").toString()] = Number(key.val());
        else
            obj[key.attr("name").toString()] = key.val();
        finalObject[comparator] = obj;
        return finalObject;
    }

    function generateTable(data) {
        var columns = [];
        Object.keys(data[0]).forEach(function (title) {
            columns.push({
                head: title,
                cl: "title",
                html: function (d) {
                    return d[title]
                }
            });
        });
        var container = d3.select("#render");
        container.html("");
        container.selectAll("*").remove();
        var table = container.append("table").style("margin", "auto");

        table.append("thead").append("tr")
            .selectAll("th")
            .data(columns).enter()
            .append("th")
            .attr("class", function (d) {
                return d["cl"]
            })
            .text(function (d) {
                return d["head"]
            });

        table.append("tbody")
            .selectAll("tr")
            .data(data).enter()
            .append("tr")
            .selectAll("td")
            .data(function (row, i) {
                return columns.map(function (c) {
                    // compute cell values for this specific row
                    var cell = {};
                    d3.keys(c).forEach(function (k) {
                        cell[k] = typeof c[k] == "function" ? c[k](row, i) : c[k];
                    });
                    return cell;
                });
            }).enter()
            .append("td")
            .html(function (d) {
                return d["html"]
            })
            .attr("class", function (d) {
                return d["cl"]
            });
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

}

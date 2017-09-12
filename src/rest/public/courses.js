/**
 * Created by Elad on 25/11/16.
 */

var courseDepts = [];
var courseNumbers = [];
var courseInsts = [];
var courseTitles = [];


function submitCoursesQuery() {
    var showBy = $('input[name=showBy]:checked');
    var sectionSize = $("#sectionSize");
    var sectionSizeOperator = $("#sectionSizeOperator");
    var courseDept = $("#courseDept");
    var courseNumber = $("#courseNumber");
    var courseInst = $("#courseInstructor");
    var courseTitle = $("#courseTitle");
    

    var keys = getWHEREKeys(courseDepts, courseNumbers, courseInsts, courseTitles, sectionSize, sectionSizeOperator);
    var WHERE = {};
    if (keys.length == 1)
        WHERE = keys[0];
    else if (keys.length > 1)
        WHERE = {"AND": keys};

    var query = {};
    var GET = [];

    if (showBy.attr("id") == "showBySection") {
        // TODO: grey out irrelevant fields
        console.log("at show by");
        GET = [courseDept.attr("name"),
            courseNumber.attr("name"),
            courseInst.attr("name"),
            courseTitle.attr("name"),
            sectionSize.attr("name")
        ];
        query = {"GET": GET, "WHERE": WHERE, "AS": "TABLE"};
        console.log(JSON.stringify(query));

    }
    else {
        GET = [courseDept.attr("name"),
            courseNumber.attr("name")
        ];
        var average = $('input[name=avg]:checked');
        var passOrFail = $('input[name=pass-fail]:checked');
        var mostSections = $("input[type=checkbox]:checked");
        var GROUP = ["courses_dept", "courses_id"];
        var APPLY = getAPPLY(average, passOrFail, mostSections);
        GET = getNewGET(APPLY, GET);
        var ORDER = getORDER(GET, average,passOrFail,mostSections);
        query = {"GET": GET, "WHERE": WHERE, "GROUP": GROUP, "APPLY": APPLY, "ORDER": ORDER, "AS": "TABLE"};
        console.log(JSON.stringify(query));
    }

    try {
        $.ajax("/query", {
            type: "POST",
            data: JSON.stringify(query),
            contentType: "application/json",
            dataType: "json",
            success: function (data) {
                if (data["render"] === "TABLE" && data["result"].length != 0) {
                    generateTable(data["result"]);
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


    function getWHEREKeys(courseDepts, courseNumbers, courseInsts, courseTitles, sectionSize, sectionSizeOperator) {
        var res = [];
        console.log("here");
        if (courseDepts.length != 0) {
            res.push(getWHEREKey($("#courseDept").attr("name"), courseDepts, "IS"));
        }

        if (courseNumbers.length != 0) {
            res.push(getWHEREKey($("#courseNumber").attr("name"), courseNumbers, "EQ"));
        }

        if (courseInsts.length != 0) {
            res.push(getWHEREKey($("#courseInstructor").attr("name"), courseInsts, "IS"));
        }

        if (courseTitles.length != 0) {
            res.push(getWHEREKey($("#courseTitle").attr("name"), courseTitles, "IS"));
        }

        if (sectionSize.val().trim()) {
            var obj = {};
            var secSize = {};
            obj[sectionSize.attr("name").toString()] = Number(sectionSize.val());
            secSize[sectionSizeOperator.val().toString()] = obj;
            res.push(secSize);
        }

        res.push({"NOT": {"EQ": {"courses_year": 1900}}});

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

    function getAPPLY(average, passOrFail, mostSections) {
        var res = [];
        var obj = {};
        if (average.attr("id")) {
            obj["courseAverage"] = {"AVG": "courses_avg"};
            res.push(obj);
            obj = {};
        }
        if (passOrFail.attr("id")) {
            obj = getPassOrFailObj(passOrFail);
            res.push(obj);
            obj = {};
        }
        if (mostSections.attr("id")) {
            obj["mostSections"] = {"COUNT": "courses_uuid"};
            res.push(obj);
            obj = {};
        }

        obj["courseSize"] = {"MAX": "courses_size"};
        res.push(obj);

        return res;
    }

    function getPassOrFailObj(passOrFail) {
        if (passOrFail.attr("id") == "mostPass")
            return {"mostPasses": {"MAX": "courses_pass"}};
        else
            return {"mostFails": {"MAX": "courses_fail"}};
    }

    function getNewGET(apply, GETArray) {
        for (var i = 0; i < apply.length; i++) {
            GETArray.push(Object.keys(apply[i])[0]);
        }
        return GETArray;
    }

    function getORDER(GETArray, average,passOrFail,mostSections) {
        var averageDir = getSortDir(average,passOrFail,mostSections);
        var keys = getORDERKeys(GETArray);
        var obj = {};
        obj["dir"] = averageDir;
        if (keys.length > 0)
            obj["keys"] = keys;
        return obj;
    }

    function getSortDir(average,passOrFail,mostSections) {
        console.log(average.attr("id"));
        if (average.attr("id")){
            if (average.attr("id") == "lowestAVG")
                return "UP";
            else
                return "DOWN";
        }
        else if(passOrFail.attr("id")){
            return "DOWN"
        }
        else if(mostSections.attr("id"))
            return "DOWN";
        else
            return "UP";

    }

    function getORDERKeys(GETArray) {
        var orderArr = [];
        if (GETArray.indexOf("courseAverage") != -1)
            orderArr.push("courseAverage");
        if (GETArray.indexOf("mostPasses") != -1)
            orderArr.push("mostPasses");
        if (GETArray.indexOf("mostFails") != -1)
            orderArr.push("mostFails");
        if (GETArray.indexOf("mostSections") != -1)
            orderArr.push("mostSections");
        orderArr.push("courses_dept");
        orderArr.push("courses_id");


        return orderArr;
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
}




$(document).on('change', '#showByFieldSet', function() {
    var buttonPressedID = $('input[name=showBy]:checked').attr("id");
    clearGrey();
    if(buttonPressedID == "showBySection")
        greyOutSection();
});

function greyOutSection(){
    setGreyButton($("#lowestAVG"));
    setGreyButton($("#highestAVG"));
    setGreyButton($("#mostPass"));
    setGreyButton($("#mostFail"));
    setGreyButton($("#mostSections"));
}


function setGreyButton(selector){
    selector.attr('disabled', true);
    selector.css('background-color' , '#DEDEDE');
}

function clearGrey(){
    clear($("#lowestAVG"));
    clear($("#highestAVG"));
    clear($("#mostPass"));
    clear($("#mostFail"));
    clear($("#mostSections"));
    clearField($("#sectionSize"));
    $('input[name="avg"]').prop('checked', false);
    $('input[name="pass-fail"]').prop('checked', false);
    $('input[name="mostSecs"]').prop('checked', false);
    $("#sectionSizeOperator").prop("disabled", false);


}

function clear(selector){
    selector.attr('disabled', false);
    selector.css('background-color' , '#ffffff');
}

function clearField(selector){
    selector.attr('readonly', false);
    selector.css('background-color' , '#ffffff');

}








// Add / Remove Department --------------------------------------
$(document).on("click", "#addDept", function(e){
    e.preventDefault();
    var dept = $("#courseDept").val().trim();
    if(!dept || courseDepts.indexOf(dept) != -1){
        return;
    }
    courseDepts.push(dept);
    for (var i = 0; i < courseDepts.length; i++) {
        var newDept = "<div class='addRemoveProperty'><button class='removeDept' id='remove" + i + "'>x</button> " + courseDepts[i] + " </div>";
    }
    $("#selectedDepts").append(newDept);
});

$(document).on("click", ".removeDept", function(e){
    var curElement = e.currentTarget.getAttribute('id').substring(6);
    courseDepts.splice(Number(curElement), 1);
    var newDept = "";
    for (var i = 0; i < courseDepts.length; i++) {
        newDept += "<div class='addRemoveProperty'><button class='removeDept' id='remove" + i + "' value='X'>x</button> " + courseDepts[i] + " </div>";
    }
    $("#selectedDepts").html(newDept);
});

// Add / Remove Number --------------------------------------
$(document).on("click", "#addCourseNumber", function(e){
    e.preventDefault();
    var dept = $("#courseNumber").val().trim();
    if(!dept || courseDepts.indexOf(dept) != -1){
        return;
    }
    courseNumbers.push(dept);
    for (var i = 0; i < courseNumbers.length; i++) {
        var newDept = "<div class='addRemoveProperty'><button class='removeCourseNumber' id='remove" + i + "'>x</button> " + courseNumbers[i] + " </div>";
    }
    $("#selectedCourseNumbers").append(newDept);
});

$(document).on("click", ".removeCourseNumber", function(e){
    var curElement = e.currentTarget.getAttribute('id').substring(6);
    courseNumbers.splice(Number(curElement), 1);
    var newCourseNum = "";
    for (var i = 0; i < courseNumbers.length; i++) {
        newCourseNum += "<div class='addRemoveProperty'><button class='removeCourseNumber' id='remove" + i + "' value='X'>x</button> " + courseNumbers[i] + " </div>";
    }
    $("#selectedCourseNumbers").html(newCourseNum);
});

// Add / Instructor --------------------------------------
$(document).on("click", "#addInst", function(e){
    e.preventDefault();
    var inst = $("#courseInstructor").val().trim();
    if(!inst || courseInsts.indexOf(inst) != -1){
        return;
    }
    courseInsts.push(inst);
    for (var i = 0; i < courseInsts.length; i++) {
        var newInst = "<div class='addRemoveProperty'><button class='removeCourseInst' id='remove" + i + "'>x</button> " + courseInsts[i] + " </div>";
    }
    $("#selectedInsts").append(newInst);
});

$(document).on("click", ".removeCourseInst", function(e){
    var curElement = e.currentTarget.getAttribute('id').substring(6);
    courseInsts.splice(Number(curElement), 1);
    var newCourseInst = "";
    for (var i = 0; i < courseInsts.length; i++) {
        newCourseInst += "<div class='addRemoveProperty'><button class='removeCourseInst' id='remove" + i + "' value='X'>x</button> " + courseInsts[i] + " </div>";
    }
    $("#selectedInsts").html(newCourseInst);
});

//Add / Title ------------------------------------------
$(document).on("click", "#addTitle", function(e){
    e.preventDefault();
    var title = $("#courseTitle").val().trim();
    if(!title || courseTitles.indexOf(title) != -1){
        return;
    }
    courseTitles.push(title);
    for (var i = 0; i < courseTitles.length; i++) {
        var newTitle = "<div class='addRemoveProperty'><button class='removeCourseTitle' id='remove" + i + "'>x</button> " + courseTitles[i] + " </div>";
    }
    $("#selectedTitles").append(newTitle);
});

$(document).on("click", ".removeCourseTitle", function(e){
    var curElement = e.currentTarget.getAttribute('id').substring(6);
    courseTitles.splice(Number(curElement), 1);
    var newCourseTitle = "";
    for (var i = 0; i < courseTitles.length; i++) {
        newCourseTitle += "<div class='addRemoveProperty'><button class='removeCourseTitle' id='remove" + i + "' value='X'>x</button> " + courseTitles[i] + " </div>";
    }
    $("#selectedTitles").html(newCourseTitle);
});
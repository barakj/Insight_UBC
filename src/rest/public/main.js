$(function () {
    $(document).ready(function() {
        $("#rooms").click(function (e) {
            e.preventDefault();
            var href = $(this).attr('href');
            $('#main').load(href);
            $("#query").addClass("roomsQuery");
            $("#query").removeClass("coursesQuery");
            $("#query").removeClass("schedulingQuery");
            $("#query").removeClass("routesQuery");
            $("#map").hide();

            $(this).addClass("currentPage");
            $("#courses").removeClass("currentPage");
            $("#scheduling").removeClass("currentPage");
            $("#routes").removeClass("currentPage");

        });

        $("#courses").click(function (e) {
            e.preventDefault();
            var href = $(this).attr('href');
            $('#main').load(href, function () {
                greyOutSection();
            });
            $("#query").addClass("coursesQuery");
            $("#query").removeClass("roomsQuery");
            $("#query").remove("schedulingQuery");
            $("#query").removeClass("routesQuery");
            courseDepts = [];
            courseNumbers = [];
            courseInsts = [];
            courseTitles = [];
            $("#map").hide();


            $(this).addClass("currentPage");
            $("#rooms").removeClass("currentPage");
            $("#scheduling").removeClass("currentPage");
            $("#routes").removeClass("currentPage");

        });

        $("#scheduling").click(function (e) {
            e.preventDefault();
            var href = $(this).attr('href');
            $('#main').load(href, function () {
                greyOutSection();
            });
            $("#query").addClass("schedulingQuery");
            $("#query").removeClass("roomsQuery");
            $("#query").removeClass("coursesQuery");
            $("#query").removeClass("routesQuery");
            courseDepts = [];
            courseNumbers = [];
            buildingNames = [];
            $("#map").hide();


            $(this).addClass("currentPage");
            $("#courses").removeClass("currentPage");
            $("#rooms").removeClass("currentPage");
            $("#routes").removeClass("currentPage");

        });

        $("#routes").click(function (e) {
            e.preventDefault();
            $("#map").show();
            var href = $(this).attr('href');
            $('#main').load(href);
            $("#query").addClass("routesQuery");
            $("#query").removeClass("coursesQuery");
            $("#query").removeClass("schedulingQuery");
            $("#query").removeClass("roomsQuery");
            courses = [];
            initMap();


            $(this).addClass("currentPage");
            $("#courses").removeClass("currentPage");
            $("#scheduling").removeClass("currentPage");
            $("#rooms").removeClass("currentPage");
        });


        $("#query").submit(function (e) {
            e.preventDefault();
            if ($(this).hasClass("roomsQuery")) {
                submitRoomsQuery();
            }
            if ($(this).hasClass("coursesQuery")) {
                submitCoursesQuery();
            }

            if ($(this).hasClass("schedulingQuery")) {
                submitSchedulingQuery();
            }

            if ($(this).hasClass("routesQuery")) {
                submitRoutesQuery();
            }
        });

        $("#datasetAdd").click(function () {
            var id;

            var zip = $("#datasetZip").prop('files')[0];
            if(zip["name"].indexOf("rooms") != -1)
                id = "rooms";
            else if(zip["name"].indexOf("courses") != -1)
                id = "courses";
            else
            //invalid zip file
                console.log("ERROR");
            var data = new FormData();
            data.append("zip", zip);
            $.ajax("/dataset/" + id,
                {
                    type: "PUT",
                    data: data,
                    processData: false
                }).fail(function (e) {
                console.log("add dataset error");
            });
        });


    });
});
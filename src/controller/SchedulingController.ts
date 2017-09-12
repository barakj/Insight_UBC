/**
 * Created by Elad on 26/11/16.
 */
export interface ScheduleResponse {
    schedule: any[];
    score: number;
}

export default class ScheduleController {

    private courses: any[] = [];
    private rooms: any[] = [];

    constructor(courses: any[], rooms: any[]) {
        this.courses = courses;
        this.rooms = rooms;
    }

    public schedule():ScheduleResponse {
        var totalSections = this.calculateTotalSections();

        this.modifyNumSections();
        for (let room of this.rooms) {
            room["roomSchedule"] = {"MWF": [], "TT": []};
            for (var i=0; i < this.courses.length; i++) {
                var course = this.courses[i];
                if (course["courseSize"] <= room["rooms_seats"]) {
                     while(!this.isRoomFull(room)){
                         this.addToSchedule(room,course);
                         course["numSections"] -= 1;
                         if(course["numSections"] == 0){
                             this.removeCourse(course);
                             i--;
                             break;
                         }
                     }
                }
            }
        }
        var schedule = this.buildScheduleObject();

        var numberOfSectionsLeft = this.calculateTotalSections();
        var quality = Number(((1 - (numberOfSectionsLeft / totalSections)) * 100).toFixed(2));


        return {"schedule": schedule, "score": quality};
    }

    public calculateTotalSections(): number {
        var count = 0;
        for (let course of this.courses) {
            count += course["numSections"];
        }
        return count;
    }

    public isRoomFull(room:any): boolean{
        if(room["roomSchedule"]["MWF"].length == 9 && room["roomSchedule"]["TT"].length == 6){
            return true;
        }
        return false;
    }

    public addToSchedule(room:any, course:any){
        if (room["roomSchedule"]["MWF"].length != 9)
            room["roomSchedule"]["MWF"].push(course);
        else
            room["roomSchedule"]["TT"].push(course);
    }

    public removeCourse(course: any) {
        var index = this.courses.indexOf(course);
        if(index != -1){
            this.courses.splice(index,1);
        }
    }

    public modifyNumSections(){
        for(let course of this.courses){
            //only one term
            course["numSections"] =  Math.ceil(course["numSections"] / 3);
        }
    }

    public buildScheduleObject():any[]{
        var obj:any;
        var res:any = [];
        for(let room of this.rooms){
            obj = {};
            obj["roomName"] = room["rooms_shortname"] + " " +room["rooms_number"];
            obj["roomSize"] = room["rooms_seats"];
            obj["coursesInMWF"] = [];
            for (let mwfCourse of room["roomSchedule"]["MWF"]) {
              //  obj["coursesInMWF"].push(mwfCourse["courses_dept"] + " " + mwfCourse["courses_id"] + "<br>" + "Seats: " + mwfCourse["courseSize"]);
                obj["coursesInMWF"].push({
                    "courseName": mwfCourse["courses_dept"] + " " + mwfCourse["courses_id"],
                    "courseSeats": mwfCourse["courseSize"]
                });
            }

            obj["coursesInTT"] = [];
            for (let ttCourse of room["roomSchedule"]["TT"]) {
              //  obj["coursesInTT"].push(ttCourse["courses_dept"] + " " + ttCourse["courses_id"]  + "<br>" + "Seats: " + ttCourse["courseSize"]);
                obj["coursesInTT"].push({
                    "courseName": ttCourse["courses_dept"] + " " + ttCourse["courses_id"],
                    "courseSeats": ttCourse["courseSize"]
                });
            }
            res.push(obj);
        }
        return res;
    }

}
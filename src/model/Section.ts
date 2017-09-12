export default class Section {
    private courses_dept:       string;     // The department that offered the course.
    private courses_id:         string;     // The course number (will be treated as a string (e.g., 499b)).
    private courses_avg:        number;     // The average of the course offering.
    private courses_instructor: string;     // The instructor teaching the course offering.
    private courses_title:      string;     // The name of the course.
    private courses_pass:       number;     // The number of students that passed the course offering.
    private courses_fail:       number;     // The number of students that failed the course offering.
    private courses_audit:      number;     // The number of students that audited the course offering.
    private courses_uuid:       string;     // The unique ID of a class
    private courses_year:       number;
    private courses_size:       number;

    constructor(dept:string, id:string, avg:number, ins:string, tit:string, pass:number, fail:number, audit:number, uuid:string) {
        this.courses_dept = dept;
        this.courses_id = id;
        this.courses_avg = avg;
        this.courses_instructor = ins;
        this.courses_title = tit;
        this.courses_pass = pass;
        this.courses_fail = fail;
        this.courses_audit = audit;
        this.courses_uuid = uuid;
        this.courses_size = fail + pass;
    }

    public setYear(year: number) {
        this.courses_year = year;
    }
}


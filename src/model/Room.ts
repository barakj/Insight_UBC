export default class Room {
    private rooms_fullname:     string;
    private rooms_shortname:    string;
    private rooms_number:       string;
    private rooms_name:         string;
    private rooms_address:      string;
    private rooms_lat:          number;
    private rooms_lon:          number;
    private rooms_seats:        number;
    private rooms_type:         string;
    private rooms_furniture:    string;
    private rooms_href:         string;

    constructor(fullname:string, shortname: string, number:string, address:string, seats:number, type:string, furniture:string, href:string) {
        this.rooms_fullname = fullname;
        this.rooms_shortname = shortname;
        this.rooms_number = number;
        this.rooms_address = address;
        this.rooms_seats = seats;
        this.rooms_type = type;
        this.rooms_furniture = furniture;
        this.rooms_href = href;
        this.setName();
    }

    private setName() {
        this.rooms_name = this.rooms_shortname + "_" + this.rooms_number;
    }

    public setLatLon(lat: any, lon: any) {
        this.rooms_lat = lat;
        this.rooms_lon = lon;
    }
}
import moment from "moment";
import momentTimezone from "moment-timezone";

class TimeService {
    // this should be all holidays for 2025 
    public static readonly HOLIDAYS_2025 = [
        { name: "New Year's Day", date: "2025-01-01" },
        { name: "Martin Luther King Jr. Day", date: "2025-01-20" },
        { name: "Presidents Day", date: "2025-02-17" },
        { name: "Memorial Day", date: "2025-05-26" },
        { name: "Juneteenth", date: "2025-06-19" },
        { name: "Independence Day", date: "2025-07-04" },
        { name: "Labor Day", date: "2025-09-01" },
        { name: "Veterans Day", date: "2025-11-11" },
        { name: "Thanksgiving Day", date: "2025-11-27" },
        { name: "Native American Heritage Day", date: "2025-11-28" },
        { name: "Christmas Day", date: "2025-12-25" }
      ];

  static inServicableTime(): boolean {
    const currentTime = momentTimezone.tz(moment(), moment.tz.guess());
    const startTime = momentTimezone.tz(moment(), moment.tz.guess()).set({ hour: 18, minute: 30 }); // 6:30 PM
    const endTime = momentTimezone.tz(moment(), moment.tz.guess()).set({ hour: 2, minute: 0 }); // 2:00 AM

    // Check if it's a holiday
    if (this.isHoliday(currentTime)) {
        return false;
      }

    // If current time is between 6:30 PM and 2:00 AM
    if (currentTime.isBetween(startTime, endTime)) {
      return true;
    }

    // if current time is after 2 AM but before 6:30 PM
    if (currentTime.hour() >= 2 && currentTime.hour() < 18) {
      return false;
    }

    return true;
  }

  static getCurrentTime(): string {
    return momentTimezone.tz(moment(), moment.tz.guess()).format("h:mm A");
  }
  static isHoliday(date: moment.Moment): boolean {
    const dateString = date.format('YYYY-MM-DD');
    return this.HOLIDAYS_2025.some(holiday => holiday.date === dateString);
  }
}

export default TimeService;
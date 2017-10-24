import { Injectable, Pipe } from '@angular/core';

@Pipe({
  name: 'toNow'
})
@Injectable()
export class ToNow {
  /*
    Takes a value and makes it lowercase.
   */
  transform(value: any = "", args: any[] = []): string {
    if (value == "") { return "" }
    let now = new Date();
    let tmpDate = new Date(value);

    tmpDate = new Date(tmpDate.getTime())//+ offset);

    let nowYear = now.getFullYear()
    let feb = 28
    if (((nowYear % 4) == 0 && (nowYear % 100) != 0) || (nowYear % 400 == 0)) {
      feb = 29
    }
    let nowMonth = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    let nowMonthDay = 0
    for (let i = 0; i < now.getMonth(); i++) {
      nowMonthDay += nowMonth[i]
    }

    let tmpYear = tmpDate.getFullYear()
    feb = 28
    if (((tmpYear % 4) == 0 && (tmpYear % 100) != 0) || (tmpYear % 400 == 0)) {
      feb = 29
    }
    let tmpMonth = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

    let tmpMonthDay = 0
    for (let i = 0; i < tmpDate.getMonth(); i++) {
      tmpMonthDay += tmpMonth[i]
    }


    let nowDate = (nowYear - 1) * 360 + nowMonthDay + now.getDate()
    let evtDate = (tmpYear - 1) * 360 + tmpMonthDay + tmpDate.getDate()

    let soon = (Math.floor(evtDate - nowDate));

    let backVal = "J-" + soon.toString();

    if (isNaN(soon)) {
      backVal = "J-0";
    }

    if (soon == 0) {
      let minutes = tmpDate.getMinutes().toString()
      if (minutes.length == 1) {
        minutes = "0" + minutes
      }
      let hours = tmpDate.getHours().toString()
      if (hours.length == 1) {
        hours = "0" + hours
      }
      backVal = hours + "h" + minutes;
    }

    if (soon < 0) {
      let day = tmpDate.getDate().toString()
      if (day.length == 1) {
        day = "0" + day
      }
      let month = (tmpDate.getMonth() + 1).toString()
      if (month.length == 1) {
        month = "0" + month
      }
      let year = tmpDate.getFullYear().toString()
      year = year.slice(2, 4);
      backVal = day + "." + month + "." + year;
    }
    return backVal;
  }
}

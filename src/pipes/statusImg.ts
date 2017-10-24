import { Injectable, Pipe } from '@angular/core';

@Pipe({
  name: 'statusImg'
})
@Injectable()
export class StatusImg {
  /*
    Takes a value and makes it lowercase.
   */
  transform(value: any = "", args: any[] = []) {
    value = value.toString()

    let imgPath: string = "";

    if (value == "0") {
      imgPath = "assets/images/status-no-thin.svg";
    } else if (value == "1") {
      imgPath = "assets/images/status-yes-thin.svg";
    } else if (value == "2") {
      imgPath = "assets/images/status-maybe-thin.svg";
    } else if (value == "3") {
      imgPath = "assets/images/status-wait.svg";
    }
    return imgPath;
  }
}

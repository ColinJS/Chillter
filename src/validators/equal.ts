import { FormGroup } from '@angular/forms';

export class EqualValidator {

  static isValid(group: FormGroup) {
    let val;

    for (let name in group.controls) {
      if (val === undefined) {
        val = group.controls[name].value
      } else {
        if (val !== group.controls[name].value) {
          return { notEqual: true };
        }
      }
    }

    return null;
  }

}

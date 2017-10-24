import { Injectable } from '@angular/core';
import { Contacts } from 'ionic-native';
import { LoadingController } from 'ionic-angular';
import { parse, format } from 'libphonenumber-js';
import { TranslateService } from 'ng2-translate';
import { CacheService } from './cache';
import { ApiService } from './api';

@Injectable()
export class ContactsService {
  lgnDetected: string;
  lgnUsed: any;
  enLgnTxt: any;
  frLgnTxt: any;

  constructor(
    private cache: CacheService,
    private api: ApiService,
    public loadingCtrl: LoadingController,
    private translate: TranslateService
  ) {
    this.enLgnTxt = {
      "loader_config": "Configuration"
    }

    this.frLgnTxt = {
      "loader_config": "Configuration"
    }

    this.lgnDetected = translate.getBrowserLang();
    this.lgnDetected == "en" ? this.lgnUsed = this.enLgnTxt : this.lgnUsed = this.frLgnTxt;
    this.lgnDetected != "en" && this.lgnDetected != "fr" ? this.lgnUsed = this.enLgnTxt : null;
  }

  getContacts(state: number) {
    if (state == 0) {
      let loading = this.loadingCtrl.create({
        spinner: 'crescent',
        content: this.lgnUsed.loader_config,
        duration: 10000
      });

      loading.present();
    }

    Contacts.find(['phoneNumbers', 'displayName'], { multiple: true, hasPhoneNumber: true, desiredFields: ['phoneNumbers', 'displayName'] })
      .then((contacts) => {
        let contactsList;
        contactsList = contacts;
        this.setPermissionCache(true);
        this.formatPhoneNumbers(contactsList);
      },
      (err) => {
        if (err) {
          console.log(err);
          err >= 0 && err <= 20 ? this.setPermissionCache(false) : null;
        }
      });
  }

  setPermissionCache(value: boolean) {
    this.cache.setCache('CONTACTS_PERMISSION', value)
  }

  formatPhoneNumbers(data: any) {
    let toFormatContacts = [];
    let toFormattedPhoneName = [];
    let formattedContacts = [];
    let formatted;

    for (let c in data) {
      if (data[c]._objectInstance.phoneNumbers != null) {
        if (data[c]._objectInstance.phoneNumbers[0].value.length > 3) {
          let numberName = {
            "name": data[c]._objectInstance.displayName,
            "phone": data[c]._objectInstance.phoneNumbers[0].value
          };
          toFormatContacts.push(data[c]._objectInstance.phoneNumbers[0].value);
          toFormattedPhoneName.push(numberName);
        }
      }
    }

    for (let c in toFormatContacts) {
      formatted = this.formatPhoneNumber(toFormatContacts[c]);
      formattedContacts.push(formatted);
    }

    setTimeout(() => {
      this.api.uploadPhotoBook(formattedContacts).subscribe(
        res => {
          if (res) {
            res.not_found_phone_numbers.forEach((item, i) => {
              res.not_found_phone_numbers[i] = { "phone": item };
            });
            this.formatNonChillterFriends(res, toFormattedPhoneName);
          }
        })
    }, 400);
  }

  formatPhoneNumber(number) {
    let formatted;

    if (parse(number).country != undefined) {
      let countryCode = parse(number).country;
      if (countryCode != "FR") {
        formatted = format(number, countryCode, 'National');
        formatted = formatted.replace(/\s/g, "").replace(/-/g, "").replace(/\(|\)/g, "");
        return formatted;
      } else {
        formatted = format(number, countryCode, 'National');
        formatted = formatted.replace(/\s/g, "").replace(/-/g, "").replace(/\(|\)/g, "");
        return formatted;
      }
    } else {
      formatted = format(number, 'FR', 'National');
      formatted = formatted.replace(/\s/g, "").replace(/-/g, "").replace(/\(|\)/g, "");
      return formatted;
    }
  }

  formatNonChillterFriends(data, toFormattedPhoneName) {
    let formattedPhoneName = [];
    let notFoundFriends = [];
    let formatted;
    let formattedPhoneNameObj;

    for (let pn in toFormattedPhoneName) {
      formatted = this.formatPhoneNumber(toFormattedPhoneName[pn].phone);
      formattedPhoneNameObj = {
        "name": toFormattedPhoneName[pn].name,
        "phone": formatted
      }
      formattedPhoneName.push(formattedPhoneNameObj);
    }

    for (let o in formattedPhoneName) {
      for (let api in data.not_found_phone_numbers) {
        if (formattedPhoneName[o].phone == data.not_found_phone_numbers[api].phone) {
          let occurrenceObj = {
            "firstname": formattedPhoneName[o].name,
            "phone": data.not_found_phone_numbers[api].phone,
            "have_chillter": false,
            "id": null,
            "picture": ""
          };
          notFoundFriends.push(occurrenceObj);
        }
      }
    }

    notFoundFriends = this.deDuplicate(x => x.phone, notFoundFriends);

    this.cache.getCache('CONTACTS').subscribe(
      data => {
        if (data == undefined) {
          this.cache.addCache('CONTACTS', notFoundFriends);

          this.getFriends();
        } else {
          this.cache.clearCache('CONTACTS');
          this.cache.addCache('CONTACTS', notFoundFriends);
        }
      }
    )
  }

  getFriends() {
    this.api.getFriends().subscribe(
      data => {
        if (data) {
          this.mergeContactsFriends(data);
        }
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      },
      () => console.log("Error")
    )
  }

  mergeContactsFriends(data) {
    let friendsList = data;

    this.cache.getCache('CONTACTS').subscribe(
      data => {
        if (data != undefined) {
          Array.prototype.push.apply(friendsList, data[0]);
          friendsList = friendsList.sort(this.sortFriends("firstname"));
          this.cache.setCache('MERGED_CONTACTS_FRIENDS', friendsList);
        }
      }
    )
  }

  sortFriends(sortBy): any {
    let sortOrder = 1;

    if (sortBy[0] === "-") {
      sortOrder = -1;
      sortBy = sortBy.substr(1);
    }
    return function (a, b) {
      let result = (a[sortBy] < b[sortBy]) ? -1 : (a[sortBy] > b[sortBy]) ? 1 : 0;
      return result * sortOrder;
    }
  }

  deDuplicate(keyFn, friends) {
    var newSet = new Set();
    return friends.filter(function (x) {
      var key = keyFn(x), isNew = !newSet.has(key);
      if (isNew) newSet.add(key);
      return isNew;
    });
  }

  resetAll() {
    this.cache.setCache('CONTACTS', null);
    this.cache.setCache('MERGED_CONTACTS_FRIENDS', null);

    setTimeout(() => {
      this.getContacts(1);
    }, 100)
  }
}


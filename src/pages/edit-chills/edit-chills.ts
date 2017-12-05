import { Component, ViewChild } from '@angular/core';
import {
  NavController,
  App,
  ViewController,
  NavParams,
  ModalController,
  ToastController,
  AlertController
} from 'ionic-angular';
import { Keyboard } from 'ionic-native';
import { TranslateService } from 'ng2-translate';
import { ImgPickerService } from '../../providers/img-picker';
import { ApiService } from '../../providers/api';
import { SyncService } from '../../providers/sync';
import { DatePicker } from 'ionic-native';
import { AskFriends } from '../ask-friends/ask-friends';
import { ChillUtils } from "../chill-utils/chill-utils";
import { MoreFriendsPage } from '../more-friends/more-friends';
import { StorageService } from '../../providers/storage';

declare var google: any;

@Component({
  selector: 'edit-chills',
  templateUrl: 'edit-chills.html'
})
export class EditChills {
  private custom: boolean = false;
  editCustom: boolean = false;
  private transaltions: any;

  // Handle swipe
  transformLeftPan: string;
  transformRightPan: string;
  transformTopPan: string;
  overlayTextSend: string;
  overlayTextDelete: string;
  overlayTextMaybe: string;

  swiping: boolean = false;

  creator: any;
  creatorId: number;

  logo: string = "";
  banner: string = "";

  cars: number = 0;
  elements: any = [];
  expenses: any = [];
  apiExpenses: any = [];
  parentChill: any;

  chillId: string = "";
  name: string = "";
  geo: string = "";
  geoSpec: string = "";
  chillType: string = "";

  stringDay: string = "";
  numberDay: string = "";
  stringMonth: string = "";
  hours: string = "";
  min: string = "";
  soon: string = "";

  eventDate: Date = new Date();
  haveEndingDate: boolean = false;
  endingDate: Date = new Date();
  soonDate: Date = new Date();

  comment: string = "";
  firstName: string = "";
  lastName: string = "";

  friends: any = [];
  shownFriends: any = [];
  utils: any = { "cars": [], "list": [], "exps": [] };
  showMoreFriends: boolean = false;
  formattedList: boolean = false;
  formattedExps: boolean = false;
  formattedCars: boolean = false;

  color: string = "ff862a";

  swipeToastDone: boolean = false;

  // Autocomplete address
  autocompleteAddress: any;
  acService: any;

  pictChange: boolean = false;

  textH1Tapped: boolean = false;

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private mod: ModalController,
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private api: ApiService,
    private sync: SyncService,
    private app: App,
    private storage: StorageService,
    private imgPickerService: ImgPickerService
  ) {
    translate.get(['chill-detail.day-sun',
      'chill-detail.day-mon',
      'chill-detail.day-tues',
      'chill-detail.day-wed',
      'chill-detail.day-thurs',
      'chill-detail.day-fri',
      'chill-detail.day-sat',
      'chill-detail.month-jan',
      'chill-detail.month-feb',
      'chill-detail.month-mar',
      'chill-detail.month-apr',
      'chill-detail.month-may',
      'chill-detail.month-jun',
      'chill-detail.month-jul',
      'chill-detail.month-aug',
      'chill-detail.month-sep',
      'chill-detail.month-oct',
      'chill-detail.month-nov',
      'chill-detail.month-dec',
      'edit-chills.swipe-toast.message',
      'edit-chills.not-sended',
      'edit-chills.punchline-title',
      'edit-chills.punchline-placeholder',
      'offline.save-send-chill',
      'overlay.sended',
      'overlay.deleted',
      'overlay.saved',
      'global.ok',
      'global.cancel',
      'global.date-time']).subscribe(value => this.transaltions = value);

    this.overlayTextDelete = this.transaltions['overlay.deleted'];

    this.formatDate();

    this.getChillerInfo();
    this.getChill();

    this.editCustom = this.navParams.get("edit");

    let myFriends = this.navParams.get("friends");
    if (myFriends) {
      this.friends.push(myFriends);
    }
  }

  formatDate() {
    let dayName = [this.transaltions['chill-detail.day-sun'],
    this.transaltions['chill-detail.day-mon'],
    this.transaltions['chill-detail.day-tues'],
    this.transaltions['chill-detail.day-wed'],
    this.transaltions['chill-detail.day-thurs'],
    this.transaltions['chill-detail.day-fri'],
    this.transaltions['chill-detail.day-sat']];

    let monthName = [this.transaltions['chill-detail.month-jan'],
    this.transaltions['chill-detail.month-feb'],
    this.transaltions['chill-detail.month-mar'],
    this.transaltions['chill-detail.month-apr'],
    this.transaltions['chill-detail.month-may'],
    this.transaltions['chill-detail.month-jun'],
    this.transaltions['chill-detail.month-jul'],
    this.transaltions['chill-detail.month-aug'],
    this.transaltions['chill-detail.month-sep'],
    this.transaltions['chill-detail.month-oct'],
    this.transaltions['chill-detail.month-nov'],
    this.transaltions['chill-detail.month-dec']];

    this.soonDate = new Date(this.eventDate.getTime());

    this.stringDay = dayName[this.eventDate.getDay()];
    this.numberDay = (this.eventDate.getDate()).toString();
    this.stringMonth = monthName[this.eventDate.getMonth()];
    this.hours = (this.eventDate.getHours()).toString();
    if (this.hours.length == 1) {
      this.hours = "0" + this.hours
    }
    this.min = (this.eventDate.getMinutes()).toString();
    if (this.min.length == 1) {
      this.min = "0" + this.min
    }
  }

  getChill() {
    const chill = this.navParams.get("chill");

    // Create new from schema
    if (chill) {
      this.overlayTextSend = this.transaltions['overlay.sended'];

      if (chill.type == 'chill') {
        this.api.getChill(chill.chill_id).subscribe(
          (data) => {
            if (data) {
              this.chillId = data.id;
              this.parentChill = data;
              this.name = data.name;
              this.logo = ("http://www.chillter.fr/api/images/chill-" + data.logo + ".svg");
              this.banner = ("assets/images/banner-" + data.category + ".jpg");
              this.color = data.color;
              this.chillType = "chill";
            }
          }
        );
      } else if (chill.type == 'custom') {
        this.api.getCustomChill(chill.chill_id).subscribe(
          data => {
            // Reset value
            this.banner = "";
            this.logo = "";
            this.chillId = data.id;
            this.parentChill = data;
            this.name = data.name;
            !data.logo ? data.logo = "assets/images/default-profil.svg" : null;
            this.logo = data.logo;
            data.banner ? this.banner = data.banner : this.banner = "assets/images/blank.png";
            this.geo = data.place;
            this.geoSpec = data.address;
            this.chillType = "custom";
            data.comment != "" ? this.comment = data.comment : this.comment = "";
            if (data.participants) {
              for (let p of data.participants) {
                !p.picture ? p.picture = "assets/images/default-profil.svg" : null;
              }
              this.friends = data.participants;
              this.sliceFriends();
            }
            data.elements ? this.formatUtils(data.elements, "elements") : null;
            data.expenses ? this.formatUtils(data.expenses, "expenses") : null;
            data.car_seats ? this.formatUtils(data.car_seats, "cars") : null;
          }
        )
      }
    } else {
      this.overlayTextSend = this.transaltions['overlay.saved'];

      // Create new custom chill
      this.api.getMyProfile().subscribe(data => {
        this.parentChill = null;
        this.name = '';
        !data.picture ? data.picture = "assets/images/default-profil.svg" : null;
        this.logo = data.picture;
        this.banner = null;
        this.color = '#000';
      });

      this.custom = true;
    }
  }

  getChillerInfo() {
    this.api.getMyProfile().subscribe(
      data => {
        if (data) {
          this.creator = data;
          this.firstName = data.firstname;
          this.lastName = data.lastname;
          !this.creator.picture ? this.creator.picture = "assets/images/default-profil.svg" : null;
        }
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )

    this.api.getProfileId().subscribe(
      data => {
        if (data) {
          this.creatorId = data;
        }
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )
  }

  // When getting chill utils from custom chills by API, data is formatted to follow same path as regular
  formatUtils(data, type) {
    if (type == "elements" && !this.formattedList) {
      this.formattedList = true;
      let objFormat = {};

      for (let d of data) {
        objFormat = {
          assigned_to: {
            id: null,
            firstname: null
          },
          content: d.name,
          created_by: {
            id: null,
            firstname: null
          },
          id: data.indexOf(d) + 1,
          mine: true
        };

        this.utils.list.push(objFormat);
      }
    } else if (type == "expenses" && !this.formattedExps) {
      this.formattedExps = true;
      this.storage.getValue('id').subscribe(
        id => {
          if (id) {
            this.creatorId = id;
            let objFormat = [{
              expenses: [],
              payer: {
                id: null,
                firstname: null
              },
              sum: null
            }];
            let objExpFormat;
            let arrayInheritors;
            let sum = 0;

            for (let d of data) {
              objExpFormat = {
                id: null,
                element: d.name,
                price: d.price,
                inheriters: null
              };
              arrayInheritors = [];
              sum = sum + d.price

              for (let i of d.inheritors) {
                arrayInheritors.push(i.id);
              }

              objExpFormat.inheriters = arrayInheritors;
              objFormat[0].expenses.push(objExpFormat);
              objFormat[0].payer.id = this.creatorId;
              objFormat[0].payer.firstname = this.creator.firstname;
              objFormat[0].sum = sum;
            }

            this.utils.expenses = objFormat;
          }
        }
      )
    } else if (type == "cars" && !this.formattedCars) {
      this.formattedCars = true;
      let objFormat = [{
        driver: {
          firstname: this.creator.firstname,
          id: undefined,
          picture: this.creator.picture
        },
        passengers: [],
        seats: data
      }];
      this.utils.cars = objFormat;
    }
  }

  deleteFriend(id: any) {
    this.friends = this.friends.filter((v) => {
      if (v.id != id) {
        return true;
      } else {
        return false;
      }
    });

    this.sliceFriends();
  }

  sendInvitation() {
    // this.custom is here when create a custom chill from chillist
    if (this.custom) {
      let chillersId: any = [];
      let body = {
        name: this.name,
        address: this.geoSpec,
        place: this.geo,
        comment: this.comment,
        take_logo: false
      };
      let bodyImg = {
        image: null
      };

      this.imgPickerService.getImgResultBanner() != this.imgPickerService.getFirstImgSrcBanner()

      if (this.imgPickerService.getFirstImgSrcLogo == this.imgPickerService.getFirstImgSrcLogo && this.logo != "assets/images/default-profil.svg") {
        body.take_logo = true;
      }

      for (let f of this.friends) {
        f.id != this.creatorId ? chillersId.push(f.id) : null;
      }

      body.name == "" ? body.name = "Chill" : null;

      this.sync.status ? null : this.showToast(1);

      this.api.createChill(body).subscribe(
        data => {
          let customChillId = JSON.parse(data._body);

          if (this.cars) {
            let body = {
              seats: this.cars
            };

            this.api.addCarCustomChill(customChillId.id, body).subscribe();
          }

          if (this.elements.length > 0) {
            let body;

            for (let element of this.elements) {
              body = {
                element: element
              };

              this.api.addElementCustomChill(customChillId.id, body).subscribe();
            }
          }

          if (this.expenses != undefined) {
            if (this.expenses.length > 0) {
              let body;

              for (let expense of this.apiExpenses[0].expenses) {
                body = {
                  name: expense.element,
                  inheritors: expense.inheriters,
                  price: expense.price
                };

                this.api.addExpenseCustomChill(customChillId.id, body).subscribe();
              }
            }
          }

          if (chillersId.length > 0) {
            let body;

            for (let chillerId of chillersId) {
              body = chillerId;

              this.api.addParticipantToCustomChill(customChillId.id, body).subscribe();
            }
          }

          if (this.imgPickerService.getImgResultBanner() != this.imgPickerService.getFirstImgSrcBanner() || this.imgPickerService.getImgResultLogo() != this.imgPickerService.getFirstImgSrcLogo()) {
            if (this.imgPickerService.getImgResultLogo() != this.imgPickerService.getFirstImgSrcLogo() && this.imgPickerService.getFirstImgSrcLogo() != "default-profil.svg") {
              bodyImg.image = this.imgPickerService.getImgResultLogo();
              this.api.sendCustomChillLogo(customChillId.id, bodyImg).subscribe();
            }

            if (this.imgPickerService.getImgResultBanner() != this.imgPickerService.getFirstImgSrcBanner() && this.imgPickerService.getImgResultBanner()) {
              bodyImg.image = this.imgPickerService.getImgResultBanner();
              this.api.sendCustomChillBanner(customChillId.id, bodyImg).subscribe();
            }
          }
        });

      // Else when not creating a custom chill from chillist, simply create an event, chillType = chill when regular chill, = custom when create event from custom chill
    } else {
      let chillersId: any = [];
      let body;

      for (let f of this.friends) {
        f.id != this.creatorId ? chillersId.push(f.id) : null;
      }

      if (this.chillType == "chill") {
        body = {
          event: {
            category: this.parentChill.category,
            name: this.name,
            color: this.color,
            place: this.geo,
            address: this.geoSpec,
            date: ("@" + (Math.round((this.eventDate.getTime()) / 1000)).toString()),
            comment: this.comment,
            status: 1,
            chill: {
              type: "chill",
              id: this.chillId
            }
          },
          chillers: chillersId
        }
      } else if (this.chillType == "custom") {
        body = {
          event: {
            category: this.parentChill.category,
            name: this.name,
            color: this.color,
            place: this.geo,
            address: this.geoSpec,
            date: ("@" + (Math.round((this.eventDate.getTime()) / 1000)).toString()),
            comment: this.comment,
            status: 1,
            chill: {
              type: "custom",
              id: this.chillId,
              banner_changed: undefined,
              logo_changed: undefined
            }
          },
          chillers: chillersId
        }

        // Because it's custom chill, category is set to 2 to get orange layout
        // The banner is set to null because by default with custom chill banner is undefined and api use null, so using null
        !body.event.category ? body.event.category = 2 : null;
        !body.event.banner ? body.event.banner = null : null;

        if (this.imgPickerService.getFirstImgSrcLogo() != this.imgPickerService.getImgResultLogo()  && this.imgPickerService.getFirstImgSrcLogo() != "default-profil.svg") {
          body.event.chill.logo_changed = true;
        } else {
          body.event.chill.logo_changed = false;
        }

        if (this.imgPickerService.getFirstImgSrcBanner() != this.imgPickerService.getImgResultBanner() && this.imgPickerService.getImgResultBanner()) {
          body.event.chill.banner_changed = true;
        } else {
          body.event.chill.banner_changed = false;
        }

        if (this.imgPickerService.getFirstImgSrcLogo() == "default-profil.svg") {
          body.event.chill.logo_changed = null;
        }

        if (this.imgPickerService.getFirstImgSrcBanner() == "") {
          body.event.chill.banner_changed = null;
        }

      }

      if (this.cars) {
        body["cars"] = this.cars
      }
      if (this.elements.length > 0) {
        body["elements"] = this.elements
      }

      if (this.expenses != undefined) {
        if (this.expenses.length > 0) {
          body["expenses"] = this.apiExpenses[0].expenses;
        }
      }

      this.sync.status ? null : this.showToast(1);

      this.api.sendInvitation(body).subscribe(
        data => {
          let eventId = JSON.parse(data._body);
          this.uploadEventLogoBanner(eventId.id, body);
        },
        res => {
          if (res.status != undefined) {
            console.log("Http request error :" + res.status);
          }
        }
      );
    }
  }

  updateCustomChill(){

    let customId = this.navParams.get("chill").id

    let chillersId: any = [];
      let body = {
        name: this.name,
        address: this.geoSpec,
        place: this.geo,
        comment: this.comment,
        take_logo: false
      };
      let bodyImg = {
        image: null
      };

      this.imgPickerService.getImgResultBanner() != this.imgPickerService.getFirstImgSrcBanner()

      if (this.imgPickerService.getFirstImgSrcLogo == this.imgPickerService.getFirstImgSrcLogo && this.logo != "assets/images/default-profil.svg") {
        body.take_logo = true;
      }

      for (let f of this.friends) {
        f.id != this.creatorId ? chillersId.push(f.id) : null;
      }

      body.name == "" ? body.name = "Chill" : null;

      this.sync.status ? null : this.showToast(1);

      this.api.updateCustomChill(customId,body).subscribe(
        data => {

          if (this.cars) {
            let body = {
              seats: this.cars
            };

            this.api.addCarCustomChill(customId.id, body).subscribe();
          }

          if (this.elements.length > 0) {
            let body;

            for (let element of this.elements) {
              body = {
                element: element
              };

              this.api.addElementCustomChill(customId.id, body).subscribe();
            }
          }

          if (this.expenses != undefined) {
            if (this.expenses.length > 0) {
              let body;

              for (let expense of this.apiExpenses[0].expenses) {
                body = {
                  name: expense.element,
                  inheritors: expense.inheriters,
                  price: expense.price
                };

                this.api.addExpenseCustomChill(customId.id, body).subscribe();
              }
            }
          }

          if (chillersId.length > 0) {
            let body;

            for (let chillerId of chillersId) {
              body = chillerId;

              this.api.addParticipantToCustomChill(customId.id, body).subscribe();
            }
          }

          if (this.imgPickerService.getImgResultBanner() != this.imgPickerService.getFirstImgSrcBanner() || this.imgPickerService.getImgResultLogo() != this.imgPickerService.getFirstImgSrcLogo()) {
            if (this.imgPickerService.getImgResultLogo() != this.imgPickerService.getFirstImgSrcLogo() && this.imgPickerService.getFirstImgSrcLogo() != "default-profil.svg") {
              bodyImg.image = this.imgPickerService.getImgResultLogo();
              this.api.sendCustomChillLogo(customId.id, bodyImg).subscribe();
            }

            if (this.imgPickerService.getImgResultBanner() != this.imgPickerService.getFirstImgSrcBanner() && this.imgPickerService.getImgResultBanner()) {
              bodyImg.image = this.imgPickerService.getImgResultBanner();
              this.api.sendCustomChillBanner(customId.id, bodyImg).subscribe();
            }
          }
        });
  }

  uploadEventLogoBanner(eventId, body) {
    let bodyImg = {
      image: null
    };

    if (this.chillType == "chill") {
      if (this.imgPickerService.getImgResultBanner() != this.imgPickerService.getFirstImgSrcBanner() || this.imgPickerService.getImgResultLogo() != this.imgPickerService.getFirstImgSrcLogo()) {
        if (this.imgPickerService.getImgResultLogo() != this.imgPickerService.getFirstImgSrcLogo()  && this.imgPickerService.getFirstImgSrcLogo() != "default-profil.svg") {
          bodyImg.image = this.imgPickerService.getImgResultLogo();
          this.api.sendEventLogo(eventId, bodyImg).subscribe();
        }

        if (this.imgPickerService.getImgResultBanner() != this.imgPickerService.getFirstImgSrcBanner() && this.imgPickerService.getImgResultBanner()) {
          bodyImg.image = this.imgPickerService.getImgResultBanner();
          this.api.sendEventBanner(eventId, bodyImg).subscribe();
        }
      }
    } else if (this.chillType == "custom") {
      if (body.event.chill.banner_changed) {
        bodyImg.image = this.imgPickerService.getImgResultBanner();
        this.api.sendEventBanner(eventId, bodyImg).subscribe(
          data => {
            data ? console.log("banner 200") : console.log("banner error");
          }
        );
      }

      if (body.event.chill.logo_changed) {
        bodyImg.image = this.imgPickerService.getImgResultLogo();
        this.api.sendEventLogo(eventId, bodyImg).subscribe(
          data => {
            data ? console.log("logo 200") : console.log("logo error");
          }
        )
      }
    }
  }

  showUtils(init: number) {
    let modal;

    // A custom chill does not have a parentChill, so if custom don't send it has nav params
    if (this.parentChill) {
      modal = this.mod.create(ChillUtils, { "init": init, "utils": this.utils, "creator": this.creator, "creatorId": this.creatorId, "newMode": true, "friends": this.friends, "eventId": this.parentChill.id });
    } else {
      modal = this.mod.create(ChillUtils, { "init": init, "utils": this.utils, "creator": this.creator, "creatorId": this.creatorId, "newMode": true, "friends": this.friends });
    }

    modal.onDidDismiss((utilsObj) => {
      for (let friend in this.friends) {
        this.friends[friend].id == this.creatorId ? this.friends.splice(friend, 1) : null;
      }

      this.utils = utilsObj;

      if (utilsObj.cars.length > 0) {
        this.cars = utilsObj.cars[0].seats
      }

      if (utilsObj.list.length > 0) {
        this.elements = []
        for (let e of utilsObj.list) {
          this.elements.push(e.content);
        }
      }

      if (utilsObj.expenses == undefined) {
        utilsObj.expenses = undefined;
        this.expenses = undefined;
        this.apiExpenses = undefined;
        return;
      } else {
        if (utilsObj.expenses[0].expenses.length == 0) {
          utilsObj.expenses = undefined;
          this.expenses = [];
          this.apiExpenses = [];
          return;
        }
        if (utilsObj.expenses.length > 0) {
          this.expenses = [];
          this.apiExpenses = [];

          for (let e of utilsObj.expenses) {
            this.expenses.push(e);
            this.apiExpenses.push(e);
            delete this.apiExpenses[0].payer;
          }

          for (let e in this.apiExpenses) {
            for (let el of this.apiExpenses[e].expenses) {
              if (el.payer != undefined) {
                delete el.payer;
              }
            }
          }
        }
      }
    })

    modal.present();
  }

  showFriends() {
    let modal = this.mod.create(AskFriends, { "friendsList": this.friends })

    modal.onDidDismiss((data) => {
      if (data) {
        for (let d in data) {
          !data[d].picture ? data[d].picture = "assets/images/default-profil.svg" : null;
          this.friends.push(data[d]);
        }

        this.sliceFriends();

        if (this.name != "" && this.geo != "" && !this.swipeToastDone) {
          this.presentSwipeToast();
          this.swipeToastDone = false;
        }
      }
    });

    modal.present();
  }

  showMoreFriendsPage() {
    let modal = this.mod.create(MoreFriendsPage, { friends: this.friends });

    modal.onDidDismiss((data) => {
      if (data) {
        this.friends = data;
        this.sliceFriends();
      }
    });

    modal.present();
  }

  sliceFriends() {
    if (this.friends.length > 3) {
      this.shownFriends = this.friends.slice(0, 3);
      this.showMoreFriends = true;
    } else {
      this.shownFriends = this.friends;
      this.showMoreFriends = false;
    }
  }

  showDatePicker() {
    DatePicker.show({
      date: this.eventDate,
      mode: 'datetime',
      okText: this.transaltions['global.ok'],
      cancelText: this.transaltions['global.cancel'],
      titleText: this.transaltions['global.date-time'],
      is24Hour: true,
      androidTheme: 5,
      allowOldDates: false,
      minDate: new Date().getTime(),
      locale: "fr_FR"
    }).then(
      date => {
        this.eventDate = date;
        this.formatDate();
      },
      err => console.log("Error occurred while getting date:", err)
      );
  }

  presentSwipeToast() {
    if (!this.custom) {
      let toast = this.toastCtrl.create({
        message: this.transaltions['edit-chills.swipe-toast.message'],
        duration: 3000,
        position: 'top'
      });

      toast.present();
    }
  }

  // Autocomplete address
  ngOnInit() {
    this.acService = new google.maps.places.AutocompleteService();
    this.autocompleteAddress = [];
  }

  // On each input change, get geocode, only if evt.length is >= 3
  autoAddress(evt) {
    if (evt == '') {
      this.autocompleteAddress = [];
      return;
    }

    let self = this;
    let config = {
      types: ['geocode'],
      input: evt
    }

    if (evt.length >= 3) {
      this.acService.getPlacePredictions(config, function (predictions, status) {
        self.autocompleteAddress = [];
        if (predictions != null) {
          predictions.forEach(function (prediction) {
            self.autocompleteAddress.push(prediction);
          });
        }
      });
    }
  }

  // When choosing an address from autocomplete, set it in the input
  chooseAddress(address: any) {
    Keyboard.close();
    this.geoSpec = address.description;
    this.autocompleteAddress = [];
  }

  clearAutocomplete() {
    Keyboard.close();
    this.autocompleteAddress = [];
  }

  // Handle swipe
  swipeEvent(evt) {
    if (evt.angle >= -30 && evt.angle <= 30 && evt.direction == 4 && evt.direction == evt.offsetDirection) {
      this.animateTo("accept");
    }

    if (evt.angle >= 150 && evt.angle <= 180 || evt.angle >= -180 && evt.angle <= -150) {
      if (evt.direction == 2 && evt.direction == evt.offsetDirection) {
        this.animateTo("refuse");
      }
    }
  }

  animateTo(obj: any) {
    if (obj == "accept" || obj == 1) {
      this.transformLeftPan = "anim-left-pan";
      this.updateCustomChill();
      this.sendInvitation();
      setTimeout(() => {
        this.viewCtrl.dismiss();
      }, 800);
    }

    if (obj == "maybe" || obj == 2) {
        this.transformTopPan = "anim-top-pan";
        this.updateCustomChill();
        setTimeout(() => {
          this.viewCtrl.dismiss(2);
        }, 800);
      }

    if (obj == "refuse" || obj == 0) {
      this.transformRightPan = "anim-right-pan";
      setTimeout(() => {
        this.viewCtrl.dismiss();
      }, 800);
    }
  }

  openChat() {
    let prompt = this.alertCtrl.create({
      title: this.transaltions['edit-chills.punchline-title'],
      inputs: [
        {
          name: 'punchline',
          placeholder: this.transaltions['edit-chills.punchline-placeholder'],
          type: 'string'

        }
      ],
      buttons: [
        {
          text: this.transaltions['global.cancel']
        },
        {
          text: this.transaltions['global.ok'],
          handler: data => {
            data != "" ? this.comment = data.punchline : null;
          }
        }
      ]
    });

    prompt.present();
  }

  close() {
    this.viewCtrl.dismiss();
  }

  showToast(type) {
    if (type == 1) {
      const toast = this.toastCtrl.create({
        message: this.transaltions['offline.save-send-chill'],
        duration: 3000
      });
      toast.present();
    }
  }
}

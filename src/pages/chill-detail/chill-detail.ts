import { Component, ViewChildren, ViewChild } from '@angular/core';
import {
  NavController,
  NavParams,
  ViewController,
  ModalController,
  ToastController,
  Platform,
  Events,
  List
} from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { ChillUtils } from "../chill-utils/chill-utils";
import { ChillerDetails } from "../chiller-details/chiller-details";
import { AskFriends } from '../ask-friends/ask-friends';
import { ApiService } from '../../providers/api';
import { SyncService } from '../../providers/sync';
import { DatePicker, Keyboard } from 'ionic-native';
import { DomSanitizer } from '@angular/platform-browser';
import { ImgLoader } from '../../components/img-loader/img-loader';
import { WeatherService } from '../../providers/weather';
import { Calendar } from 'ionic-native';
import { ChillChatPage } from '../chill-chat/chill-chat';
declare var google: any;

@Component({
  selector: 'chill-detail',
  templateUrl: 'chill-detail.html',
})
export class ChillDetail {
  private transaltions: any;
  // Handle swipe
  transformLeftPan: string;
  transformRightPan: string;
  transformTopPan: string;

  event: any;
  name: string;
  comment: string;
  punchline: string;
  id: String;
  logo: string;
  banner: string;

  eventDate: Date;
  soonDate: Date;
  soonDateDisplay: boolean = false;
  day: string;
  hours: string;
  min: string;

  geo: string;
  geoSpec: string;

  noPlace: boolean = false;
  noPunchline: boolean = false;

  firstName: string;
  lastName: string;
  lastNameCreator: string;
  firstNameCreator: string;
  friends: any[] = [];
  allFriends: any[] = [];
  @ViewChildren(ImgLoader) imgPicker: any;
  @ViewChild(List) list: List;
  stringDay: string = "";
  numberDay: string = "";
  stringMonth: string = "";
  eventId: any;
  isPastEvent: boolean = false;

  color: string = "ff862a";
  isEdit: boolean = false;
  iconSrc: string = "assets/images/edit.svg";
  swipeToastDone: boolean = false;

  // Fill utils icon or not
  filledCarIcon: boolean = false;
  filledListIcon: boolean = false;
  filledExpIcon: boolean = false;

  // Autocomplete address
  autocompleteAddress: any;
  acService: any;

  // Weather var
  weatherDisplay: boolean = false;
  chillWeatherDay: any;
  //chillWeatherHourOcc: any;
  chillWeatherTemp: number;
  chillWeatherCondition: string;
  weatherConditionType: any[] = [];
  weatherIcon: string;

  // GMaps opening links and condition
  enableMaps: boolean = false;
  isIos: boolean = false;
  geoSpecSafe: string;

  // Handle empty events
  events: any[] = [];
  noEvent: boolean = false;
  dayNow: number = 0;
  noEventSoon: boolean = false;
  idProfile: string;
  chillCreatorId: string;

  viewEvents: any[] = [];
  searchWord: string = "";

  constructor(
    private mod: ModalController,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private api: ApiService,
    private sync: SyncService,
    private weatherApi: WeatherService,
    private platform: Platform,
    public sanitizer: DomSanitizer,
    private notif: Events,
  ) {
    if (this.platform.is('ios')) {
      this.isIos = true;
    }

    this.eventId = this.navParams.get("eventId");
    this.weatherConditionType = ['cloudy',
      'overcast',
      'mist',
      'fog',
      'sunny',
      'rain',
      'drizzle',
      'thundery',
      'thunder',
      'snow',
      'sleet',
      'freezing',
      'blizzard',
      'pellets'];

    this.getEventDetail();

    translate.get(['chill-box.event-added',
      'chill-box.event-removed',
      'chill-box.invited-you',
      'chill-detail.day-sun',
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
      'chill-detail.edited-chill',
      'offline.blocked',
      'global.date-time']).subscribe(value => this.transaltions = value);

    this.isPastEvent = this.navParams.get("pastEvent");

    this.api.getMyProfile().subscribe(data => {
      this.lastNameCreator = data.lastname;
      this.firstNameCreator = data.firstname;
    });
    this.api.getEvents().subscribe(data => {
      this.events = data;
    });

    this.api.getProfileId().subscribe(data => {
      this.idProfile = data;
    });

    this.notif.subscribe("notif:update", () => {
      this.getEventDetail();
    });


  }

  ionViewDidEnter() {
    this.getUtils(this.eventId);
    this.getEvents();
  }

  filterEvents() {
    this.viewEvents = this.events;

    this.viewEvents = this.events.filter((v) => {
      return v.info.name.toLowerCase().indexOf(this.searchWord.toLowerCase()) > -1 || this.searchWord == "";
    });
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
    this.transaltions['chill-detailsmonth-jun'],
    this.transaltions['chill-detail.month-jul'],
    this.transaltions['chill-detail.month-aug'],
    this.transaltions['chill-detail.month-sep'],
    this.transaltions['chill-detail.month-oct'],
    this.transaltions['chill-detail.month-nov'],
    this.transaltions['chill-detail.month-dec']];

    this.getSoonDate();

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

  getEventDetail() {
    this.api.getEvent(this.eventId).subscribe(
      data => {
        if (data) {
          this.chillCreatorId = data.chillerid;
          this.event = data;
          this.id = data.id;
          this.name = data.name;
          this.comment = data.comment;
          this.punchline = data.chat_message;
          this.allFriends = data.chillers;
          if (data.logo) {
            data.logo ? this.logo = data.logo : null;
            !data.logo && !data.chill.logo ? this.logo = "assets/images/default-profil.svg" : null;
          } else {
            !data.chill.logo && !data.logo ? this.logo = "assets/images/default-profil.svg" : null;
            data.chill.logo && !data.logo ? this.logo = data.chill.logo : null;
          }
          this.banner = data.banner ? data.banner : ("assets/images/banner-" + data.category.id + ".jpg");
          this.geo = data.place;
          this.geoSpec = data.address;
          this.eventDate = new Date(data.date);
          this.formatDate();
          this.getNames();
          this.color = data.color;

          if (this.geo.length == 0 && this.geoSpec.length == 0) {
            this.noPlace = true;
          }
          if (!this.punchline) {
            this.noPunchline = true;
          }
          if (this.geoSpec.length != 0) {
            this.enableMaps = true;
            this.slugAddress(this.geoSpec);
          }

          if (!this.isPastEvent) {
            this.getForecastWeather();
          }

          this.getUtils(this.eventId);

        } else {
          this.event = [];
        }
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )
  }

  /* Get weather forecast for provided geoSpec (address) of a created Chill
  * If geoSpec is not defined for this Chill get soon date
  * If no result by address (data.error), throw error, get soon date instead and exit function
  * If API error, throw error, get soon date instead and exit function
  * If no error, get the forecast weather for the date of the Chill
  * If an event is in 8 days, don't get weather forecast
  * If an event is the same day, don't show
  */
  getForecastWeather() {
    if (this.geoSpec.length != 0) {
      let weatherForecastLimit = new Date();
      weatherForecastLimit.setDate(weatherForecastLimit.getDate() + 7);

      if (this.eventDate >= weatherForecastLimit) {
        this.getSoonDate();
        return;
      }

      this.weatherApi.getForcastWeather(this.geoSpec).subscribe(
        data => {
          if (data) {
            if (data.error) {
              console.log(data.error.code);
              console.log(data.error.message);
              this.getSoonDate();
              return;
            }

            // keep the commented code (weather for hour, not needed now)
            /*this.chillWeatherHourOcc = Number(this.hours);

            if (this.chillWeatherHourOcc >= 30) {
                this.chillWeatherHourOcc = this.chillWeatherHourOcc + 1;
            }*/

            for (let d in data.forecast.forecastday) {
              this.chillWeatherDay = data.forecast.forecastday[d].date;
              let chillWeatherDayFormat = new Date(this.chillWeatherDay);

              if (chillWeatherDayFormat.getDay() == this.eventDate.getDay()) {
                this.chillWeatherDay = data.forecast.forecastday[d];

                this.chillWeatherTemp = Math.round(this.chillWeatherDay.day.avgtemp_c);

                let weatherArrayLength = this.weatherConditionType.length;
                for (let i = 0; i < weatherArrayLength; i++) {
                  let index = this.chillWeatherDay.day.condition.text.toLowerCase().indexOf(this.weatherConditionType[i])

                  if (index >= 0) {
                    if (i >= 0 && i <= 3) {
                      this.weatherIcon = "ios-cloud-outline";
                      this.soonDateDisplay = false;
                      this.weatherDisplay = true;
                    }

                    if (i == 4) {
                      let hoursNum = +this.hours;
                      if (hoursNum >= 22 && hoursNum <= 23 || hoursNum == 0 || hoursNum >= 1 && hoursNum <= 6) {
                        this.weatherIcon = "ios-moon-outline"
                        this.soonDateDisplay = false;
                        this.weatherDisplay = true;
                      } else {
                        this.weatherIcon = "ios-sunny-outline";
                        this.soonDateDisplay = false;
                        this.weatherDisplay = true;
                      }
                    }

                    if (i == 5 || i == 6) {
                      this.weatherIcon = "ios-rainy-outline";
                      this.soonDateDisplay = false;
                      this.weatherDisplay = true;
                    }

                    if (i == 7 || i == 8) {
                      this.weatherIcon = "ios-thunderstorm-outline";
                      this.soonDateDisplay = false;
                      this.weatherDisplay = true;
                    }

                    if (i >= 9 && i <= 13) {
                      this.weatherIcon = "ios-snow-outline";
                      this.soonDateDisplay = false;
                      this.weatherDisplay = true;
                    }
                  } else {
                    this.getSoonDate();
                  }
                }

                // keep the commented code (weather for hour, not needed now)
                /*for (let h in this.chillWeatherDay.hour) {
                    this.chillWeatherHourOcc = this.chillWeatherDay.hour[h];
                    let chillWeatherHourFormat = new Date(this.chillWeatherHourOcc.time_epoch);

                    console.log(new Date(this.chillWeatherHourOcc.time_epoch));
                    console.log(chillWeatherHourFormat.getHours());

                    if (chillWeatherHourFormat.getHours() == Number(this.hours)) {
                        this.chillWeatherHourOcc = this.chillWeatherDay[h];
                        console.log("OCCURENCE HOUR");
                        console.log(this.chillWeatherHourOcc);
                    }
                }*/
              } else {
                this.getSoonDate();
              }
            }

          } else {
            console.log("Weather API error check key in providers/config.ts getApiWeatherUrl()");
            this.getSoonDate();
            return;
          }
        },
        res => {
          if (res.status != 200) {
            console.log("Http request error :" + res.status);
          }
        }
      )
    } else {
      this.getSoonDate();
    }
  }

  getSoonDate() {
    if (!this.isPastEvent) {
      this.soonDate = new Date(this.eventDate.getTime())

      let now = new Date();
      now = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      let eventDateFormat = new Date();
      eventDateFormat = new Date(this.eventDate.getFullYear(), this.eventDate.getMonth(), this.eventDate.getDate());

      if (now.getTime() === eventDateFormat.getTime()) {
        this.soonDateDisplay = false;
        return;
      }

      this.soonDateDisplay = true;
    }
  }

  getNames() {
    this.friends = [];
    let id = localStorage.getItem("_id");
    let i = 0;
    for (let f of this.allFriends) {
      if (f.id == this.event.chillerid) {
        this.firstName = f.firstname;
        this.lastName = f.lastname
      }
      if (id != f.id) {
        this.friends.push(f)
      }
      i++
    }
  }

  addFriends(friendId: string) {
    this.api.addFriendWithEvent(friendId, this.eventId).subscribe();
  }

  deleteFriend(friendId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    this.api.deleteFriendFromEvent(this.eventId, friendId).subscribe();
    let ind;
    for (let i = 0; i < this.allFriends.length; i++) {
      if (this.allFriends[i].id == friendId) {
        ind = i;
      }
    }
    this.allFriends.splice(ind, 1);
    this.getNames();
  }

  showFriends() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let modal = this.mod.create(AskFriends, { "friendsList": this.friends })
    modal.onDidDismiss((data) => {
      if (data) {
        for (let f of data) {
          this.addFriends(f.id);
          this.allFriends.push(f);
          this.getNames();
        }
      }
    });

    modal.present();
  }

  showChillerDetails(friendId: string) {
    this.navCtrl.push(ChillerDetails, { "friendId": friendId,  "have_chillter": true });
  }

  showUtils(init: number) {
    let eventId = this.navParams.get("eventId");
    this.navCtrl.push(ChillUtils, { "init": init, "eventId": eventId, "creatorId": this.idProfile, "friends": this.allFriends, "newMode": false });
  }

  updateEvent() {
    let loader = this.imgPicker._results[1];
    let loaderBan = this.imgPicker._results[0];
    let body = {
      event: {
        name: this.name,
        place: this.geo,
        address: this.geoSpec,
        date: this.eventDate,
      },
    };
    if (this.imgPicker._results[0].file != this.imgPicker._results[0].firstSrc || this.imgPicker._results[1].file != this.imgPicker._results[1].firstSrc) {
      if (this.imgPicker._results[1].file != this.imgPicker._results[1].firstSrc) {
        this.api.updateLogo(this.eventId, loader.file, loader).subscribe();
      }
      if (this.imgPicker._results[0].file != this.imgPicker._results[0].firstSrc) {
        this.api.updateBanner(this.eventId, loaderBan.file, loaderBan).subscribe();
      }
      this.viewCtrl.dismiss();
    }

    this.api.updateEvent(this.eventId, body).subscribe();
  }

  editInfo(bool) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    if (!bool) {
      this.isEdit = true;
    } else {
      this.updateEvent();
      let toast = this.toastCtrl.create({
        message: this.transaltions['chill-detail.edited-chill'],
        duration: 3000,
        position: 'top'
      });

      toast.present();
      this.isEdit = false;
      this.autocompleteAddress = [];
    }
  }

  showDatePicker(bool) {
    if (bool) {
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
        err => console.log("Error occurred while getting date : ", err)
        );
    }
  }

  presentSwipeToast() {
    let toast = this.toastCtrl.create({
      message: this.transaltions['edit-chills.swipe-toast.message'],
      duration: 3000,
      position: 'top'
    });

    toast.present();
  }

  // When entering the chill-detail, get list, car, expenses. If != "" fill the corresponding icon
  getUtils(eventId) {
    // Get transport data
    this.api.getCar(eventId).subscribe(
      data => {
        if (data) {
          if (data.length != 0) {
            this.filledCarIcon = true;
          } else {
            this.filledCarIcon = false;
          }
        }
      },
      res => {
        console.log(res.status)
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )

    // Get list data
    this.api.getList(eventId).subscribe(
      data => {
        if (data) {
          if (data.length != 0) {
            this.filledListIcon = true;
          } else {
            this.filledListIcon = false;
          }
        }
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )

    // Get expenses data
    this.api.getExps(eventId).subscribe(
      data => {
        if (data) {
          if (data.length != 0) {
            this.filledExpIcon = true;
          } else {
            this.filledExpIcon = false;
          }
        }
      },
      res => {
        console.log(res.status)
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )
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

  // Gmaps opening by platform
  openMaps() {
    if (this.platform.is('android')) {
      window.open('geo://?q=' + this.geoSpec, '_system');
    }
  }

  slugAddress(value) {
    var rExps = [
      { re: /[\xC0-\xC6]/g, ch: 'A' },
      { re: /[\xE0-\xE6]/g, ch: 'a' },
      { re: /[\xC8-\xCB]/g, ch: 'E' },
      { re: /[\xE8-\xEB]/g, ch: 'e' },
      { re: /[\xCC-\xCF]/g, ch: 'I' },
      { re: /[\xEC-\xEF]/g, ch: 'i' },
      { re: /[\xD2-\xD6]/g, ch: 'O' },
      { re: /[\xF2-\xF6]/g, ch: 'o' },
      { re: /[\xD9-\xDC]/g, ch: 'U' },
      { re: /[\xF9-\xFC]/g, ch: 'u' },
      { re: /[\xC7-\xE7]/g, ch: 'c' },
      { re: /[\xD1]/g, ch: 'N' },
      { re: /[\xF1]/g, ch: 'n' }];

    for (var i = 0, len = rExps.length; i < len; i++)
      value = value.replace(rExps[i].re, rExps[i].ch);

    this.geoSpecSafe = value.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/\-{2,}/g, '-');
  }

  participate(ind: number) {
    let currentEvent;
    this.events.forEach((evt) => {
      if (evt.info.id == this.id) {
        currentEvent = evt;
      }
    });
    if (!currentEvent) {
      this.viewCtrl.dismiss();
    } else {
      let startDate = new Date(currentEvent.date);
      startDate = new Date(startDate.getTime());

      // Prepare creating event reminder in phone calendar (Google by default)
      let title = this.capitalizeFirstLetter(currentEvent.info.name);
      let notes = this.capitalizeFirstLetter(currentEvent.info.chiller) + this.transaltions['chill-box.invited-you'] + this.capitalizeFirstLetter(currentEvent.info.name);

      let calendarOptions = Calendar.getCalendarOptions();
      calendarOptions.firstReminderMinutes = 60;
      this.api.participateEvent(ind, this.event.id).subscribe();


      if (window.hasOwnProperty('cordova') && (ind == 0 || ind == 2)) {
        Calendar.findEvent(title, "", notes, startDate, startDate).then((data) => {
          if (data.length > 0) {
            Calendar.deleteEvent(title, "", notes, startDate, startDate).then((d) => {
              this.showToast(this.transaltions['chill-box.event-removed']);
            });
          }
        })
      } else if (window.hasOwnProperty('cordova') && ind == 1) {
        Calendar.createEventWithOptions(title, "", notes, startDate, startDate, calendarOptions).then((d) => {
          this.showToast(this.transaltions['chill-box.event-added']);
        });
      }
    }
  }

  getEvents(ref: any = false) {
    this.dayNow = new Date().getDate();
    this.api.getEvents().subscribe(
      data => {
        this.noEvent = false;
        if (data) {
          this.noEvent = false;
          this.events = data.filter((d) => {
            let now = new Date();
            let tmpDate = new Date(d.date);
            if (isNaN(tmpDate.getTime())) {
              return false;
            }
            let time = tmpDate.getTime() - now.getTime();

            return time > 0;
          });

          this.events.forEach((index) => {
            let now = new Date();
            let nowPlusOne = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 24);
            let d = new Date(index.date);

            index.soon = (d < nowPlusOne ? "today" : "later");
          })

        }
      }
    )
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  showToast(message: string) {
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'top'
    });
    toast.present();
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

    if (evt.angle >= 60 && evt.angle <= 120 && evt.direction == 16 && evt.direction == evt.offsetDirection) {
      this.animateTo("maybe");
    }
  }

  animateTo(obj: any) {
    if (!this.isPastEvent) {
      if (obj == "accept" || obj == 1) {
        this.transformLeftPan = "anim-left-pan";
        setTimeout(() => {
          this.viewCtrl.dismiss(1);
        }, 800);
      }

      if (obj == "refuse" || obj == 0) {
        this.transformRightPan = "anim-right-pan";
        setTimeout(() => {
          this.viewCtrl.dismiss(0);
        }, 800);
      }

      if (obj == "maybe" || obj == 2) {
        this.transformTopPan = "anim-top-pan";
        setTimeout(() => {
          this.viewCtrl.dismiss(2);
        }, 800);
      }
    }
  }

  openChat() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let eventId = this.navParams.get("eventId");

    this.navCtrl.push(ChillChatPage, { "eventId": eventId, "eventName": this.name });
  }

  close() {
    this.viewCtrl.dismiss();
  }

  showOfflineToast(type) {
    if (type == 1) {
      const toast = this.toastCtrl.create({
        message: this.transaltions['offline.blocked'],
        duration: 3000
      });
      toast.present();
    }
  }
}

import { Component } from '@angular/core';
import {
  NavController,
  NavParams,
  ViewController,
  ToastController,
  ModalController
} from 'ionic-angular';
import { ApiService } from '../../providers/api';
import { SyncService } from '../../providers/sync';
import { ChillDetail } from '../chill-detail/chill-detail';
import { ChillList } from '../chill-list/chill-list';
import { EditChills } from '../edit-chills/edit-chills';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from 'ng2-translate';
import { Platform } from 'ionic-angular';

@Component({
  selector: "chiller-details",
  templateUrl: 'chiller-details.html',
})
export class ChillerDetails {
  private transaltions: any;

  info: any;
  firstName: string = "";
  lastName: string = "";
  picture: string = "assets/images/default-profil.svg"
  phone: string = "";
  email: string = "";
  dayNow: number = 0;
  have_chillter: boolean = false;
  smsMsg: string;

  events: any[] = [];
  comingEvents: any[] = [];
  historyEvents: any[] = [];

  constructor(
    private modal: ModalController,
    private toastCtrl: ToastController,
    private navCtrl: NavController,
    private navParams: NavParams,
    private api: ApiService,
    private sync: SyncService,
    private viewCtrl: ViewController,
    public sanitizer: DomSanitizer,
    private translate: TranslateService,
    public plt: Platform
  ) {
    translate.get(['offline.blocked',
      'chiller-details.sms-content-invite',
      'global.back']).subscribe(value => this.transaltions = value);

  }

  ionViewDidEnter() {
    if (this.navParams.get("have_chillter") == true) {
      this.have_chillter = true;
      this.getChillerInfo();
    } else {
      this.firstName = this.navParams.get("firstname");
      this.phone = this.navParams.get("phone");
      this.have_chillter = false;
      this.picture = "assets/images/default-profil.svg";
      if (this.plt.is('ios')) {
        this.smsMsg = "&body=" + this.transaltions['chiller-details.sms-content-invite'];
      }
      if (this.plt.is('android')) {
        this.smsMsg = "?body=" + this.transaltions['chiller-details.sms-content-invite'];
      }
    }
  }

  getChillerInfo() {
    let friendId = this.navParams.get("friendId");

    this.api.getChiller(friendId).subscribe(
      data => {
        if (data) {
          this.info = data;
          this.firstName = data.firstname;
          this.lastName = data.lastname;
          this.picture = data.picture;
          this.email = data.email;
          this.phone = data.phone;
          this.getEventsList(friendId);
        }
        !this.picture ? this.picture = "assets/images/default-profil.svg" : null;
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )
  }

  getEventsList(friendId) {
    this.api.getEventsList(friendId).subscribe(
      data => {
        if (data) {
          this.events = data;
          this.sortEvents();
        } else {
          this.events = [];
        }
      },
      res => {
        console.log(res.status);
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )
  }

  sortEvents() {
    this.historyEvents = [];
    this.comingEvents = [];

    let now = new Date();

    this.dayNow = new Date().getDate();

    for (let i = 0; i < this.events.length; i++) {

      this.events[i].info.logo ? this.events[i].type = "custom" : null;
      this.events[i].info.chill.logo ? this.events[i].type = "regular" : null;
      !this.events[i].info.chill.logo && !this.events[i].info.logo || this.events[i].info.chill.logo && this.events[i].info.logo ? this.events[i].type = "custom" : null;

      let tmpDate = new Date(this.events[i].date);
      if (tmpDate.getTime() > (now.getTime() + now.getTimezoneOffset())) {
        this.comingEvents.push(this.events[i]);
      } else {
        this.historyEvents.push(this.events[i]);
      }
    }
    this.historyEvents = this.historyEvents.reverse();
  }

  showDetailEvent(eventId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let modal = this.modal.create(ChillDetail, { "eventId": eventId, "pastEvent": true });

    modal.present(modal);
    this.sortEvents();
  }

  sendAChill() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let modal = this.modal.create(ChillList);

    modal.onDidDismiss((chill) => {
      if (chill) {
        let chillObj = { "link": { "chills": chill.info.id } };
        let friendObj = { "id": this.navParams.get("friendId"), "firstname": this.firstName, "lastname": this.lastName, "picture": this.picture };
        let editModal = this.modal.create(EditChills, { "chill": chillObj, "friends": friendObj });

        editModal.present();
      }
    });

    modal.present();
  }

  swipeEvent(evt) {
    if (evt.deltaX < -25) {
      this.close()
    }
  }

  close() {
    this.viewCtrl.dismiss();
  }

  // Set text for back button (navbar)
  ionViewWillEnter() {
    this.viewCtrl.setBackButtonText(this.transaltions['global.back']);
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

import { Component } from '@angular/core';
import {
  ToastController,
  NavParams,
  ViewController,
  ModalController
} from 'ionic-angular';
import { ApiService } from '../../providers/api';
import { SyncService } from '../../providers/sync';
import { ChillDetail } from '../chill-detail/chill-detail';
import { DomSanitizer } from '@angular/platform-browser';
import { ConfigService } from '../../providers/config';
import { TranslateService } from 'ng2-translate';

@Component({
  selector: "history",
  templateUrl: 'history.html',
})
export class History {
  private baseUrl: string;
  private transaltions: any;

  dayNow: number = 0;
  noEvents: boolean = false;
  searchWord: string;

  events: any[] = [];
  unsortedEvents: any = [];
  previousEvents: any[] = [];
  nextEvents: any[] = [];
  sorted: boolean = false;

  constructor(
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private translate: TranslateService,
    private toastCtrl: ToastController,
    private api: ApiService,
    private sync: SyncService,
    private viewCtrl: ViewController,
    public sanitizer: DomSanitizer,
    private configService: ConfigService
  ) {
    translate.get(['offline.blocked']).subscribe(value => this.transaltions = value);

    this.baseUrl = configService.getBaseUrl();
  }

  ionViewDidLoad() {
    // setTimeout used to force page load all Chill after a delay to avoid big lag.
    setTimeout(() => {
      this.getEvents();
    }, 400)
  }

  getEvents() {
    this.api.getEvents().subscribe(
      data => {
        if (data) {
          this.events = data;
          this.sortEvents();
          return;
        } else {
          this.noEvents = true;
        }
      },
      res => {
        console.log(res.status);
        if (res.status != 200) {
          console.log("Http request error : " + res.status);
        }
      }
    );
  }

  sortEvents() {
    if (!this.sorted) {
      this.sorted = true;
      let now = new Date();

      // Sort all events, if event date < date now, push to previousEvents, else do nothing
      for (var i = 0; i < this.events.length; i++) {
        let event_date = new Date(this.events[i].date);
        if (event_date.getTime() > (now.getTime() + now.getTimezoneOffset())) {
          this.nextEvents.push(this.events[i]);
        } else {
          this.previousEvents.push(this.events[i]);
        }
      }
      // Reverse previousEvents to show events from the most recent to the old one
      // unsortedEvents is used for the search function, to avoid modify previousEvents
      this.previousEvents = this.previousEvents.reverse();
      this.unsortedEvents = this.previousEvents;
    } else {
      return;
    }
  }

  showDetailEvent(eventId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let modal = this.modalCtrl.create(ChillDetail, { "eventId": eventId, "pastEvent": true });

    modal.present(modal);
  }

  inputChange(evt) {
    this.searchWord = evt.target.value;
    this.filterEvents();
  }

  filterEvents() {
    this.previousEvents = this.unsortedEvents.filter((v) => {
      if (this.searchWord == undefined) {
        this.searchWord = "";
        return;
      }
      if (v.info.name.toLowerCase().indexOf(this.searchWord.toLowerCase()) > -1) {
        return true;
      } else {
        return false;
      }
    });
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

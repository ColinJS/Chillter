import { Component } from '@angular/core';
import { NavController, ModalController, ToastController, Events, NavParams } from 'ionic-angular';
import { Vibration, Keyboard } from 'ionic-native';
import { ApiService } from '../../providers/api';
import { SyncService } from '../../providers/sync';
import { ChillList } from '../chill-list/chill-list';
import { EditChills } from '../edit-chills/edit-chills';
import { ViewChild } from '@angular/core';
import { Slides } from 'ionic-angular';
import { ConfigService } from '../../providers/config';
import { TranslateService } from 'ng2-translate';
import { CacheService } from '../../providers/cache';

@Component({
  selector: "home",
  templateUrl: 'home.html'
})
export class Home {
  private baseUrl: string;
  private transaltions: any;
  private sortablejsOptChills;

  isTapping: boolean = false;

  @ViewChild(Slides) slider: Slides;

  deleting: boolean = false;
  slides: any[] = [];
  idList: any[] = [];
  deleteMode: boolean = false;
  shakingMode: boolean = false;
  chills_order: any[];
  placeholderLogo: string = "assets/images/default-profil.svg";
  trashIconType: string = "ios-trash-outline";
  trashIconTypeOutline: string = "ios-trash-outline";
  trashIconTypeDone: string = "md-checkmark"
  trashIcon: boolean = false;
  private myProfile: Object = {};

  view: string;

  constructor(
    private configService: ConfigService,
    private notif: Events,
    private navCtrl: NavController,
    private modal: ModalController,
    private translate: TranslateService,
    private api: ApiService,
    private sync: SyncService,
    private toastCtrl: ToastController,
    private cache: CacheService,
    public params: NavParams
  ) {
    translate.get(['offline.save-delete-chill',
      'offline.blocked',
      'home.move-chill-error']).subscribe(value => this.transaltions = value);

    this.baseUrl = configService.getBaseUrl();
    this.notif.publish("notif:update");

    this.getHome();

    this.api.getMyProfile().subscribe(
      (data) => {
        this.myProfile = data
      });
  }

  ionViewWillEnter() {
    this.getHome();
    this.provideSortableOpt(1);
  }

  // Take the home chills (logo of event) from the dataBase
  getHome() {
    this.api.getHome().subscribe(
      data => {
        if (data) {
          this.changeSlides(data)
        }
        this.notif.publish("notif:update");
      }
    )
  }

  // Update the "sliders" list with the data that server return
  changeSlides(home: any) {
    let chillPlus = {
      "logo": this.baseUrl + "/api/images/chills/plus.svg",
      "name": "plus",
      "id": "plus"
    };

    let pageCount = 0;
    let chillCount = 0;
    let sortHome = [chillPlus];

    this.slides = [[]];
    this.idList = [];

    for (let h in home) {
      sortHome[home[h].position] = home[h];
      this.idList.push(home[h].chill_id);
    }

    for (let i = 0; i < sortHome.length; i++) {
      if (chillCount > 11) {
        chillCount = 0;
        pageCount++;
        this.slides[pageCount] = [];
      }

      if (sortHome[i]) {
        this.slides[pageCount][chillCount] = sortHome[i];
        chillCount++;
      }
    }
  }

  deleteChill(chill: any) {
    if (this.deleting) {
      return;
    }

    this.deleting = true;

    this.sync.status ? null : this.showToast(1);

    this.api.deleteChill(chill.id).subscribe(
      response => {
        this.cache.clearCache('home');
        this.getHome();
        this.deleting = false;
      },
      error => {
        this.deleting = false;
      }
    );

    this.shakingMode = false;
    this.slider.lockSwipes(false);
    this.provideSortableOpt(1);
  }

  moveChill(evt) {
    this.sync.status ? null : this.showToast(2);
    if (this.sync.status) {
      if (evt.newIndex == 0) {
        const toast = this.toastCtrl.create({
          message: this.transaltions['home.move-chill-error'],
          duration: 3000
        });
        toast.present();
        this.navCtrl.setRoot(this.navCtrl.getActive().component);
        return;
      } else {
        this.sortablejsOptChills = {
          disabled: true
        };

        this.shakingMode = false;
        this.slider.lockSwipes(false);

        evt.clone.lastElementChild.id = evt.clone.lastElementChild.id.trim();

        this.api.moveChill(parseInt(evt.clone.lastElementChild.className), parseInt(evt.newIndex)).subscribe(
          data => {
            return true;
          },
          err => {
            console.error(err);
          }
        )

        this.trashIcon = false;
        let lastIndex = this.slides.lastIndexOf(undefined);
        if (this.slides[lastIndex] == undefined) {
          this.slides.pop();
        }
      }
    } else {
      this.showToast(0);
      return;
    }
  }

  tapDistrib(clicker: any) {
    this.isTapping = true;

    if (clicker.name === "plus") {
      this.shakingMode = false;
      this.slider.lockSwipes(false);
      this.showList();
    } else {
      if (this.deleteMode) {
        this.deleteChill(clicker);
      } else {
        this.showEditChills(clicker);
      }
    }
  }

  pressDistrib(clicker: any) {
    if (this.isTapping) { return false }

    if (clicker.name === "plus") {
      this.shakingMode = false;
      return;
    } else if (this.deleteMode && this.shakingMode) {
      Vibration.vibrate(100);
      this.shakingMode = !this.shakingMode;
      this.slider.lockSwipes(false);
      this.provideSortableOpt(1);
    } else {
      if (this.deleteMode || this.shakingMode) {
        this.navCtrl.setRoot(this.navCtrl.getActive().component);
      } else {
        // Not compatible with iOS11
        //Vibration.vibrate(100);
        this.shakingMode = !this.shakingMode;
        this.slider.lockSwipes(true);
        this.provideSortableOpt(2);
        this.trashIcon = true;
      }
    }
  }

  showEditChills(chill: any) {
    let modal = this.modal.create(EditChills, { chill: chill });

    modal.onDidDismiss(() => {
      Keyboard.close()
      this.isTapping = false
    });
    modal.present()
  }

  showList() {
    this.getHome();
    this.navCtrl.push(ChillList, { idList: this.idList });
  }

  toggleTrash() {
    !this.deleteMode ? this.trashIconType = this.trashIconTypeDone : this.trashIconType = this.trashIconTypeOutline;

    if (!this.deleteMode) {
      this.shakingMode = false;
      this.provideSortableOpt(1);
      this.deleteMode = true;
    } else {
      this.navCtrl.setRoot(this.navCtrl.getActive().component);
    }
  }

  showToast(type) {
    if (type == 0) {
      const toast = this.toastCtrl.create({
        message: this.transaltions['offline.blocked'],
        duration: 3000
      });
      toast.present();
    }
    if (type == 1) {
      const toast = this.toastCtrl.create({
        message: this.transaltions['offline.save-delete-chill'],
        duration: 3000
      });
      toast.present();
    }
  }

  provideSortableOpt(value) {
    if (value == 1) {
      this.sortablejsOptChills = {
        disabled: true
      }
      this.shakingMode = false;
      this.slider.lockSwipes(false);
      return;
    }

    if (value == 2) {
      this.sortablejsOptChills = {
        filter: ".chill_plus",
        disabled: false,
        animation: 100,
        dragClass: "sortable-drag",
        ghostClass: "sortable-ghost",
        chosenClass: "sortable-chosen",
        onStart: ((evt) => {
          this.slider.lockSwipes(true);
        }),
        onMove: ((evt)=> {
          if (evt.related) {
            return !evt.related.classList.contains('chill_plus');
          }
        }),
        onEnd: ((evt) => {
          if (evt.oldIndex != evt.newIndex) {
            let that = this;

            that.sortablejsOptChills = {
              disabled: true
            }
            this.moveChill(evt);
          }
        })
      };
    }
  }

}

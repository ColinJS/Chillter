import { ApiService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { Component, ViewChild } from '@angular/core';
import {
  Content,
  NavController,
  ViewController,
  ToastController,
  NavParams,
  Events
} from 'ionic-angular';
import { SyncService } from '../../providers/sync';
import { EditChills } from '../edit-chills/edit-chills';
import { Home } from '../home/home';
import { TranslateService } from 'ng2-translate';

@Component({
  templateUrl: 'chill-list.html',
})
export class ChillList {
  @ViewChild(Content) content: Content;

  placeholderLogo: string = "assets/images/default-profil.svg";
  fakeArray4: any = new Array(2); // Used for content placeholder
  fakeArray5: any = new Array(3); // Used for content placeholder

  private transaltions: any;
  private chills: any = [];
  private slides: any[] = [];
  private customChills: any;
  private baseUrl: string;
  private myProfile: Object = {};

  constructor(
    private navCtrl: NavController,
    private notif: Events,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private api: ApiService,
    private sync: SyncService,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private configService: ConfigService
  ) {
    this.baseUrl = configService.getBaseUrl();
    translate.get(['offline.blocked',
      'offline.save-add-chill',
      'global.back']).subscribe(value => this.transaltions = value);

    this.api.getMyProfile().subscribe(
      (data) => {
        this.myProfile = data
      });
  }

  ionViewDidEnter() {
    // setTimeout used to force page load all Chill after a delay to avoid big lag.
    setTimeout(() => {
      this.getAllChills();
      this.getHome();
    }, 400)
  }

  getAllChills() {
    this.api.getAllChills().subscribe((data) => this.addChills(data));
    this.api.getCustomChills().subscribe(
      (data) => {
        console.log(data);
        this.customChills = data;
      });
  }

  addChills(chills: any) {
    this.chills = chills;
    let idList = this.navParams.get('idList');

    for (let c in this.chills) {
      this.chills[c].chills = this.chills[c].chills.filter((v) => {
        for (let i in idList) {
          if (v.info.id == idList[i]) {
            return false;
          }
        }
        return true;
      });
    }
    this.chills = this.chills.filter((v) => {
      if (v.chills.length == 0) {
        return false;
      } else {
        return true;
      }
    })
  }

  getHome() {
    this.api.getHome().subscribe(
      data => {
        this.slides = data;
        this.changeSlides(data)
      }
    )
  }

  changeSlides(home: any) {
    let chillPlus = {
      "info": {
        "logo": "plus",
        "name": "plus",
        "id": "plus"
      },
      "link": {
        "plus": true
      }
    };

    let pageCount = 0;
    let chillCount = 0;
    let sortHome = [chillPlus];

    this.slides = [[]];

    for (let h in home) {
      sortHome[parseInt(home[h].pos)] = home[h];
    }

    for (let i = 0; i < sortHome.length; i++) {

      if (chillCount > 11) {
        chillCount = 0;
        pageCount++;
        this.slides[pageCount] = [];
      }
      this.slides[pageCount][chillCount] = sortHome[i];
      chillCount++
    }
  }

  addChill(chill: any) {
    let custom = !!chill.id;

    let lgt = this.slides.length;
    let inLgt = this.slides[lgt - 1].length;

    if (inLgt > 12) {
      lgt++;
      inLgt = 1;
      this.slides.push([chill]);
    } else {
      inLgt++;
    }

    this.api.addChill(custom ? chill.id : chill.info.id, custom ? 'custom' : 'chill').subscribe(
      data => {
        this.viewCtrl.dismiss().then(() => {
          /*
          * If view = undefined (from chiller-details -> Send a Chill) do nothing
          * else, if = to ChillList return to Homepage with the selected Chill added to Homepage and set Tabs to 0 (Chills), this from when add Chill from Chillbox
          */
          if (this.navCtrl.getActive() == undefined) {
            return;
          } else {
            let currentView = this.navCtrl.getActive().name;

            if (currentView == "ChillBox" || currentView == undefined) {
              // This wil generate an error, like cannot read property 'then' of undefined, and it's normal. This is the only solution to set tab and reload selected tab view.
              this.navCtrl.parent.select(0).then(() => {
                console.log('Regular error');
              })

            }
          }
        });
      },
      err => { console.log(err) }
    )
  }

  close(chill: any = undefined) {
    /*
    * If current view is ChillList add the Chill to Homepage (from Chillbox)
    * else (from Chiller-details -> Send a Chill), dismiss ChilllList and open chill-edit with choosen friends
    */
    if (this.navCtrl.getActive().name == "ChillList") {
      if (chill) {
        this.sync.status ? null : this.showToast(2);
        this.addChill(chill);
      } else {
        this.viewCtrl.dismiss(chill);
      }
    } else {
      this.viewCtrl.dismiss(chill);
    }
  }

  addPersonalized() {
    if (!this.sync.status) {
      this.showToast(1);
      return;
    }
    this.navCtrl.push(EditChills, { chill: null }, { animate: true, direction: 'back' });
  }

  // Set text for back button (navbar)
  ionViewWillEnter() {
    this.viewCtrl.setBackButtonText(this.transaltions['global.back']);
  }

  slideChanged() {
    this.content.scrollToTop();
  }

  showToast(type) {
    if (type == 1) {
      const toast = this.toastCtrl.create({
        message: this.transaltions['offline.blocked'],
        duration: 3000
      });
      toast.present();
    }
    if (type == 2) {
      const toast = this.toastCtrl.create({
        message: this.transaltions['offline.save-add-chill'],
        duration: 3000
      });
      toast.present();
    }
  }
}

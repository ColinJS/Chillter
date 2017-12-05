import { ApiService } from '../../providers/api';
import { ConfigService } from '../../providers/config';
import { Component, ViewChild } from '@angular/core';
import {
  Content,
  NavController,
  ViewController,
  ToastController,
  NavParams,
  ModalController,
  Events
} from 'ionic-angular';
import { SyncService } from '../../providers/sync';
import { EditChills } from '../edit-chills/edit-chills';
import { Home } from '../home/home';
import { TranslateService } from 'ng2-translate';

@Component({
  selector: 'chill-list',
  templateUrl: 'chill-list.html',
})
export class ChillList {
  @ViewChild(Content) content: Content;

  placeholderLogo: string = "assets/images/default-profil.svg";
  fakeArray4: any = new Array(6); // Used for content placeholder
  fakeArray5: any = new Array(8); // Used for content placeholder
  chillListDisplay: string = "chills"; // First segment selected

  private transaltions: any;
  private homeChills: any = [];
  private chills: any = [];
  private customChills: any;
  private baseUrl: string;
  private myProfile: Object = {};
  private fromHomePage: boolean;

  constructor(
    private navCtrl: NavController,
    private notif: Events,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private modal: ModalController,
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

  ngOnInit(){
    this.getAllChills();
    this.fromHomePage = this.navCtrl.getPrevious().name == "Home" ? true : false;
  }

  getAllChills() {

    this.api.getAllChills().subscribe(
      (data) => {
        this.chills = data;
        for(let i = 0; i < this.chills.length; i++){
          for(let j = 0; j < this.chills[i].chills.length; j++){
            this.chills[i].chills[j].homeState = false;
          }
        }
        console.log(this.chills);
      });

    this.api.getCustomChills().subscribe(
      (data) => {
        this.customChills = [].concat(data);
        for(let i = 0; i < this.customChills.length; i++){
          this.customChills[i].homeState = false;
        }
        console.log(this.customChills);
      });

    this.api.getHome().subscribe(
      data => {

        this.homeChills = data;
        for(let i = 0; i < this.homeChills.length; i++){

          homeLoop:{
            for(let j = 0; j < this.chills.length; j++){
              for(let k = 0; k < this.chills[j].chills.length; k++){
                if(this.chills[j].chills[k].info.id == this.homeChills[i].chill_id){
                  this.chills[j].chills[k].homeState = true;
                  break homeLoop;
                }
              }
            }
            for(let j = 0; j < this.customChills.length; j++){
              if(this.customChills[j].id == this.homeChills[i].chill_id){
                console.log("I'm in");
                this.customChills[j].homeState = true;
                break homeLoop;
              }
            }
          }
        }
        //I don't know why but this log is needed to make the homeState change effective
        console.log(this.customChills);
      });
  }

  homeSwitcher(chill: any){
    if(chill.homeState){
      this.deleteChill(chill);
    }else{
      this.addChill(chill);
    }
  }

  deleteCustomChill(chill: any){
    this.api.deleteCustomChill(chill.id).subscribe(
      data=>{
        this.getAllChills();
      }
    )
  }

  editCustomChill(chill){

    chill.chill_id = chill.id;
    chill.type = "custom";

    let modal = this.modal.create(EditChills, { chill: chill, edit:true });

    modal.onDidDismiss(() => {
      this.getAllChills();
    });
    modal.present()

  }

  addChill(chill: any) {

    let custom = !!chill.id;
    let currentId = custom ? chill.id : chill.info.id;

    this.api.addChill(currentId, custom ? 'custom' : 'chill').subscribe(
      data => {
        chill.homeState = !chill.homeState;
      },
      err => { console.log(err) }
    )
  }

  deleteChill(chill: any) {

    let custom = !!chill.id;
    let tmpId = custom ? chill.id : chill.info.id;
    let currentId = 0;

    for(let i = 0; i < this.homeChills.length; i++){
      if(tmpId == this.homeChills[i].chill_id){
        currentId = this.homeChills[i].id;
      }
    }

    this.sync.status ? null : this.showToast(1);
    this.api.deleteChill(currentId).subscribe(
      data=>{
        chill.homeState = !chill.homeState;
      }
    );

  }

  trackByChills(index,item){
    return item.info.id;
  }

  trackByCustomChills(index,item){
    return item.id;
  }

  close(chill: any = undefined) {
    /*
    * If current view is ChillList add the Chill to Homepage (from Chillbox)
    * else (from Chiller-details -> Send a Chill), dismiss ChilllList and open chill-edit with choosen friends
    */
    if (!this.fromHomePage) {
      this.viewCtrl.dismiss(chill);
    }
  }

  addPersonalized() {
    if (!this.sync.status) {
      this.showToast(1);
      return;
    }
    let modal = this.modal.create(EditChills, { chill: null });

    modal.onDidDismiss(() => {
      this.getAllChills();
    });
    modal.present()

    //this.navCtrl.push(EditChills, { chill: null }, { animate: true, direction: 'back' });
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

import { Component } from '@angular/core';
import {
  NavController,
  ViewController,
  NavParams
} from 'ionic-angular';
import { TranslateService } from 'ng2-translate';

@Component({
  selector: 'more-friends',
  templateUrl: 'more-friends.html'
})
export class MoreFriendsPage {
  private transaltions: any;
  friends: any = [];
  eventCreated: boolean;
  arrayToDelete: any = [];
  chillCreatorId: any;
  idProfile: any;

  constructor(
    private translate: TranslateService,
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams
  ) {

    this.friends = this.navParams.get("friends");
    this.eventCreated = this.navParams.get("eventCreated");
    this.chillCreatorId = this.navParams.get("chillCreatorId");
    this.idProfile = this.navParams.get('idProfile');
  }

  removeFriend(id) {
    this.eventCreated ? this.arrayToDelete.push(id) : null;

    this.friends = this.friends.filter((v) => {
      if (v.id != id) {
        return true;
      } else {
        return false;
      }
    });
  }

  closeValid() {
    this.viewCtrl.dismiss(this.friends, this.arrayToDelete);
  }

  closeCancel() {
    this.viewCtrl.dismiss();
  }
}

import { Component } from '@angular/core';
import { NavController, Events } from 'ionic-angular';
import { ApiService } from '../../providers/api';
import { Home } from '../home/home';
import { LogIn } from '../login/login';
import { FriendList } from '../friend-list/friend-list';
import { ChillBox } from '../chill-box/chill-box';
import { ChillSet } from '../chill-set/chill-set';

@Component({
  templateUrl: 'tabs.html',
})
export class TabsPage {
  tab1Root: any = Home;
  tab2Root: any = ChillBox;
  tab3Root: any = FriendList;
  tab4Root: any = ChillSet;

  eventBadge: number = null;
  friendBadge: number = null;
  timer: any;

  constructor(
    private navCtrl: NavController,
    private notif: Events,
    private api: ApiService
  ) {
    this.getNotification();
    this.notif.subscribe("notif:update", () => {
      this.getNotification();
    });
    this.notif.subscribe("nav:login", () => {
      this.backToLogin();
    });
  }

  getNotification() {
    this.api.getPendingFriends().subscribe(
      data => {
        if (data.length > 0) {
          this.friendBadge = data.length;
        } else {
          this.friendBadge = null;
        }
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      },
      () => console.log("Error")
    )

    this.api.getEvents().subscribe(
      data => {
        if (data) {
          this.eventBadge = null;
          for (let e in data) {
            if (data[e].participation_status == 3) {
              let now = new Date();
              let chillDate = new Date(data[e].date);
              if (chillDate > now) {
                this.eventBadge++;
              }
            }
          }
        } else {
          this.eventBadge = null;
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

  backToLogin() {
    this.notif.unsubscribe("notif:update");
    this.notif.unsubscribe("nav:login");
    this.navCtrl.setRoot(LogIn);
  }
}

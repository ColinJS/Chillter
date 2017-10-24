import { Component } from '@angular/core';
import { ApiService } from '../../providers/api';
import { SyncService } from '../../providers/sync';
import { NavController, AlertController, Events, ToastController } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { ChillerDetails } from "../chiller-details/chiller-details";
import { StorageService } from "../../providers/storage";
import { CacheService } from '../../providers/cache';
import { ContactsService } from '../../providers/contacts'

@Component({
  selector: 'friend-list',
  templateUrl: 'friend-list.html',
})
export class FriendList {
  private transaltions: any;

  searchWord: string;
  pendingFriends: any = [];
  friends: any = [];
  friendsUnfilter: any = [];
  notFriends: any = [];
  unsortFriends: any = [];
  noFriends: boolean = false;
  profileId: number;

  noResultFriends: boolean = false;
  noResultNotFriends: boolean = false;
  searchNotFriends: boolean = false;
  resultFound: boolean = false;
  logoSunWhite: string = "assets/images/logo-sun-white.png";
  logoSunColor: string = "assets/images/logo-sun.svg";
  logoSun: string;

  contactPermState: boolean = false;

  constructor(
    private notif: Events,
    private translate: TranslateService,
    private al: AlertController,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private api: ApiService,
    private sync: SyncService,
    private storage: StorageService,
    private cache: CacheService,
    private contacts: ContactsService
  ) {
    translate.get(['friend-list.delete-alert.title',
      'friend-list.delete-alert.message',
      'friend-list.delete-alert.button-text-del-block',
      'friend-list.delete-alert.button-text-del',
      'friend-list.request-subtitle',
      'friend-list.request-subtitle',
      'offline.blocked']).subscribe(value => this.transaltions = value);

    this.logoSun = this.logoSunWhite;

    this.storage.getValue('id').subscribe(
      res => {
        this.profileId = res;
      }
    )

    this.notif.subscribe("notif:friends", () => {
      this.contactPermState ? this.getCacheFriends() : this.getFriends();
      this.getPendingFriends();
    })
  }

  ionViewDidEnter() {
    this.cache.getCache('CONTACTS_PERMISSION').subscribe(
      data => {
        data == true ? this.contactPermState = true : this.contactPermState = false;
        data == undefined ? this.contactPermState = false : null;
        this.contactPermState ? this.getCacheFriends() : this.getFriends();
        this.getPendingFriends();
      }
    )
  }

  doRefresh(refresher) {
    if (this.contactPermState) {
      this.friends = [];
      this.contacts.resetAll();
      this.getPendingFriends();
      setTimeout(() => {
        this.notif.publish("notif:update");
        this.getCacheFriends();
        this.filterFriends();
      }, 3000)
      this.friendsUnfilter = [];
      !(this.logoSun != this.logoSunColor) ? this.logoSun = this.logoSunWhite : null;
    } else {
      this.getPendingFriends()
      this.getFriends()
      this.filterFriends()
    }
    this.getPendingFriends(refresher);
  }

  getFriends() {
    this.api.getFriends().subscribe(
      data => {
        data.length == 0 ? this.noFriends = true : this.noFriends = false;
        if (data) {
          this.friends = data;
          this.unsortFriends = data;
        } else {
          this.friends = [];
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

  getPendingFriends(ref: any = false) {
    this.api.getPendingFriends().subscribe(
      data => {
        if (data) {
          this.pendingFriends = data;
        } else {
          this.pendingFriends = [];
        }
        if (ref) {
          ref.complete();
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

  getCacheFriends() {
    this.cache.getCache('MERGED_CONTACTS_FRIENDS').subscribe(
      data => {
        data.length == 0 ? this.noFriends = true : this.noFriends = false;
        if (data != undefined) {
          this.noFriends = false;
          this.friends = data;
          this.unsortFriends = this.friends;
        } else {
          this.noFriends = true;
        }
      }
    )
  }

  acceptFriend(friendId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    this.api.acceptFriend(friendId).subscribe(
      data => {
        if (this.contactPermState) {
          this.friends = [];
          this.contacts.resetAll();
          this.getPendingFriends();
          setTimeout(() => {
            this.notif.publish("notif:update");
            this.getCacheFriends();
            this.filterFriends();
          }, 2000)
          this.friendsUnfilter = [];
          !(this.logoSun != this.logoSunColor) ? this.logoSun = this.logoSunWhite : null;
        } else {
          this.getPendingFriends()
          this.getFriends()
          this.filterFriends()
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

  showDeleteAlert(friendId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let confirm = this.al.create({
      title: this.transaltions['friend-list.delete-alert.title'],
      message: this.transaltions['friend-list.delete-alert.message'],
      buttons: [
        {
          text: this.transaltions['friend-list.delete-alert.button-text-del-block'],
          handler: () => {
            this.blockFriend(friendId);
          }
        },
        {
          text: this.transaltions['friend-list.delete-alert.button-text-del'],
          handler: () => {
            this.deleteFriend(friendId);
          }
        }
      ]
    });
    confirm.present();
  }

  deleteFriend(friendId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    this.api.deleteFriend(friendId).subscribe(
      data => {
        if (this.contactPermState) {
          this.friends = [];
          this.contacts.resetAll();
          this.getPendingFriends();
          setTimeout(() => {
            this.notif.publish("notif:update");
            this.getCacheFriends();
            this.filterFriends();
          }, 3000)
          this.friendsUnfilter = [];
          !(this.logoSun != this.logoSunColor) ? this.logoSun = this.logoSunWhite : null;
        } else {
          this.getPendingFriends()
          this.getFriends()
          this.filterFriends()
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

  blockFriend(friendId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    this.api.blockFriend(friendId).subscribe(
      data => {
        if (this.contactPermState) {
          this.friends = [];
          this.contacts.resetAll();
          this.getPendingFriends();
          setTimeout(() => {
            this.notif.publish("notif:update");
            this.getCacheFriends();
            this.filterFriends();
          }, 3000)
          this.friendsUnfilter = [];
          !(this.logoSun != this.logoSunColor) ? this.logoSun = this.logoSunWhite : null;
        } else {
          this.getPendingFriends()
          this.getFriends()
          this.filterFriends()
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

  inputChange(evt) {
    this.noResultFriends = false;
    this.searchWord = evt.target.value;

    if (this.searchWord == "" || this.searchWord == undefined) {
      this.contactPermState ? this.getCacheFriends() : this.getFriends();
      this.searchNotFriends = false;
      this.noResultFriends = false;
      this.notFriends = [];
      !(this.logoSun != this.logoSunColor) ? this.logoSun = this.logoSunWhite : null;
      return;
    }

    // Retrieve chiller not in friend list, filter by input value
    if (this.searchWord.length >= 2) {
      this.api.findUser(this.searchWord).subscribe(
        data => {
          if (data) {
            data = data.slice(0, 15);
            for (let d in data) {
              data[d].id == this.profileId ? data = data.slice([d + 1]) : null;
            }
            this.notFriends = data;
            this.searchNotFriends = true;
            this.noResultNotFriends = false;
          }

          if (data.length == 0 || this.notFriends.length == 0) {
            this.notFriends = [];
            this.searchNotFriends = false;
            this.noResultNotFriends = true;
            return;
          }
        },
        res => {
          if (res.status != 200) {
            console.log("Http request error :" + res.status);
          }
        },
        () => console.log("Error")
      )

      // Call function to filter our already added friends
      this.filterFriends();
    }
  }

  getNotFriends() {
    this.api.findUser(this.searchWord).subscribe(
      data => {
        if (data) {
          this.notFriends = data;
          this.searchNotFriends = true;
          this.noResultNotFriends = false;
        }

        if (data.length == 0) {
          this.notFriends = [];
          this.noResultNotFriends = true;
          return;
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

  filterFriends() {
    this.resultFound = false;
    this.friends = this.unsortFriends.filter((v) => {
      // If searchbar become empty by tap on little cross, reset all
      if (this.searchWord == undefined) {
        this.searchWord = "";
        this.notFriends = [];
        this.searchNotFriends = false;
        this.contactPermState ? this.getCacheFriends() : this.getFriends();
        return;
      }

      if (v.firstname.toLowerCase().indexOf(this.searchWord.toLowerCase()) > -1) {
        this.resultFound = true;
        this.noResultFriends = false;
        return true;
      }
      // Fix to avoid getting no result. Set resultFound to true when found result.
      // The condition below check that. So show no result only when no result in array and resultFound = true
      // With no verification it will show no result even if there is result
      if (v.firstname.toLowerCase().indexOf(this.searchWord.toLowerCase()) == -1 && this.resultFound != true) {
        this.noResultFriends = true;
        return false;
      }
    });
  }

  showChillerDetails(friendId: string, firstname: string, phone: string, have_chillter: boolean) {
    this.navCtrl.push(ChillerDetails, { "friendId": friendId, "firstname": firstname, "phone": phone, "have_chillter": have_chillter }, { animate: true, direction: 'back' });
  }

  addFriend(notFriendId: any) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    this.api.addFriend(notFriendId).subscribe();
    this.getNotFriends();
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

  toggleFilter() {
    this.logoSun != this.logoSunColor ? this.logoSun = this.logoSunColor : this.logoSun = this.logoSunWhite;
    this.friendsUnfilter.length == 0 ? this.friendsUnfilter = this.friends : null;

    if (!(this.logoSun != this.logoSunColor)) {
      this.friends = this.friendsUnfilter.filter(itm => {
        return itm.have_chillter == true;
      });
    } else {
      this.friends = this.friendsUnfilter;
    }

  }

}

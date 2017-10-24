import { Component } from '@angular/core';
import { NavController, ViewController, NavParams } from 'ionic-angular';
import { ApiService } from '../../providers/api';

@Component({
  selector: 'ask-friends',
  templateUrl: 'ask-friends.html',
})
export class AskFriends {
  arrayTmp: any = {};
  arrayFriends: any = [];
  friends: any = [];
  filteredFriends: any = [];
  viewFriends: any = [];
  friendsList: any = [];

  constructor(
    private nav: NavController,
    private viewCtrl: ViewController,
    private api: ApiService,
    private navP: NavParams
  ) {
    this.friendsList = this.navP.get("friendsList");
    this.getFriends();
  }

  onInput(searchbar: any) {
    console.log(searchbar.target.value);
    if (searchbar.target.value == "" || searchbar.target.value == undefined) {
      searchbar.target.value = "";
      this.getFriends();
      return;
    }
    this.viewFriends = this.filteredFriends.filter((v) => {
      if (v.firstname.toLowerCase().indexOf(searchbar.target.value.toLowerCase()) > -1) {
        return true;
      } else {
        return false;
      }
    });
  }

  getFriends() {
    this.api.getFriends().subscribe(
      data => {
        console.log(data);
        console.log(this.friendsList);

        if (data) {
          this.friends = data;
          if (this.friendsList.length > 0) {

            let filterList = [];

            for (let f of this.friendsList) {
              filterList.push(f.id);
            }

            console.log(filterList);

            this.filteredFriends = this.friends.filter((v) => {
              if (filterList.indexOf(v.id) == -1) {
                return true;
              } else {
                return false;
              }
            });
          } else {
            this.filteredFriends = this.friends;
          }
          this.viewFriends = this.filteredFriends;
        } else {
          this.friends = [];
          this.filteredFriends = [];
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

  addFriend(friend: any) {
    for (var prop in this.arrayTmp) {
      this.arrayFriends.push(this.arrayTmp[prop]);
    }
    console.log(this.arrayFriends)
    this.close(friend);
  }
  addToArray(id, e) {
    if (e.checked) {
      this.arrayTmp[id.id] = id;
    } else {
      delete this.arrayTmp[id.id];
    }
  }

  close(friend: any = undefined) {
    this.viewCtrl.dismiss(friend);
  }
}

import { Component } from '@angular/core';
import {
  NavController,
  ViewController,
  NavParams,
  ToastController,
  AlertController
} from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { ApiService } from '../../providers/api';
import { ChillerDetails } from '../chiller-details/chiller-details'
import { SyncService } from '../../providers/sync';
import { ResolveExpenses } from "../resolve-expenses/resolve-expenses";

@Component({
  selector: 'chill-utils',
  templateUrl: 'chill-utils.html'
})

export class ChillUtils {
  private transaltions: any;

  arraySeats: any[];
  title: string;
  slidesOptions: any;
  slideInit: number = 0;
  slidePager: boolean = false;

  cars: any[];

  seats: string = "";
  addCarBool: boolean = false;

  list: any[] = [];

  element: string = "";

  expsList: any[];
  exps: any[];
  expensesPage: boolean = false;

  expense: string = "";
  price: string = "";

  newMode: boolean = false;
  creator: any;
  creatorId: number;
  utilsObj: any;
  profileId: any;

  // Used to control expense list
  tmpList: any[];
  isTmpList: boolean = false;

  // Fix navbar when coming from chill-detail
  fixNav: boolean = false;

  // Don't show addCar icon if chiller already own a car
  foundDriver: boolean = false;

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private translate: TranslateService,
    private api: ApiService,
    private sync: SyncService,
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams
  ) {
    translate.get(['chill-utils.global-title',
      'chill-utils.title-transport',
      'chill-utils.title-list',
      'chill-utils.title-expense',
      'chill-utils.input-add-element.title',
      'chill-utils.input-add-element.placeholder',
      'chill-utils.input-add-car.title',
      'chill-utils.input-add-car.placeholder',
      'chill-utils.input-add-expense.placeholder-element',
      'chill-utils.input-add-expense.placeholder-price',
      'chill-utils.no-invited',
      'chill-utils.not-sended',
      'chill-utils.no-exp-info',
      'chill-utils.no-exp-inheriter',
      'chill-utils.add-inheriter',
      'chill-utils.already-in-car1',
      'chill-utils.already-in-car2',
      'chill-utils.already-in-car2',
      'offline.blocked',
      'global.add',
      'global.cancel',
      'global.ok']).subscribe(value => this.transaltions = value);

    if (this.navParams.get("init")) {
      this.slideInit = this.navParams.get("init");
    }
    if (this.navParams.get("newMode")) {
      this.newMode = this.navParams.get("newMode");
    }

    if (this.newMode && this.navParams.get("utils")) {
      this.utilsObj = this.navParams.get("utils");
      this.cars = this.utilsObj.cars;
      if (this.cars.length == 0) {
        this.addCarBool = true;
      } else {
        this.addCarBool = false;
      }
      this.list = this.utilsObj.list;
      this.exps = this.utilsObj.expenses;
    }

    this.creator = this.navParams.get("creator");


    this.changeSlide({ activeIndex: this.slideInit });

    if (this.newMode) {
      this.fixNav = false;
      this.creatorId = this.navParams.get("creatorId");
      if (this.utilsObj.expenses != undefined) {
        this.tmpList = this.utilsObj.expenses;
        this.formatExps();
      }
    } else {
      this.fixNav = true;
      this.creatorId = this.navParams.get("creatorId");
      this.getExps();
    }

    this.api.getProfileId().subscribe(data => {
      this.profileId = data;
    });

    this.arraySeats = [
      'place-av-driver',
      'place-av-passenger',
      'place-ar-one',
      'place-ar-two',
      'place-ar-three',
      'place-ar-four',
      'place-ar-five',
      'place-ar-six'];
  }

  changeSlide(evt) {
    let slideId = evt.realIndex

    this.title = this.transaltions['chill-utils.global-title'];

    switch (slideId) {
      case undefined:
        this.title = this.transaltions['chill-utils.title-transport'];
        this.expensesPage = false;
        if (!this.newMode) {
          this.getCar();
        }
        break;
      case 1:
        this.title = this.transaltions['chill-utils.title-list'];
        this.expensesPage = false;
        if (!this.newMode) {
          this.getList();
        }
        break;
      case 2:
        this.title = this.transaltions['chill-utils.title-expense'];
        this.expensesPage = true;
        break;
    }
  }

  getCar() {
    let evtId = this.navParams.get("eventId");

    this.api.getCar(evtId).subscribe(
      data => {
        this.cars = [];

        if (data.length == 0) {
          this.addCarBool = true;
          return;
        } else {
          for (let c in data) {
            if (!this.foundDriver) {
              if (data[c].driver_id == this.creatorId || this.creatorId == undefined) {
                this.addCarBool = false;
                this.foundDriver = true;
              } else {
                this.addCarBool = true;
              }
            }

            let obj = {
              "id": data[c].id,
              "seats": data[c].seats,
              "driver": {
                "id": data[c].driver_id, "firstname": data[c].passengers[0].firstname, "picture": data[c].passengers[0].picture
              },
              "passengers": data[c].passengers,
              "seats_left": data[c].seats - data[c].passengers.length
            };

            obj.driver.picture == "" || !obj.driver.picture ? obj.driver.picture = "assets/images/default-profil.svg" : null;

            for (let p in obj.passengers) {
              obj.passengers[p].picture == "" || !obj.passengers[p].picture ? obj.passengers[p].picture = "assets/images/default-profil.svg" : null;
            }

            this.cars.push(obj);
          }
        }
      },
      res => {
        if (res.status != undefined) {
          console.log("Http request error :" + res.status);
        }
      }
    )
  }

  getList() {
    let evtId = this.navParams.get("eventId");

    this.api.getList(evtId).subscribe(
      data => {
        if (data) {
          this.list = data;
        } else {
          this.list = [];
        }
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )
  }

  getExps() {
    let evtId = this.navParams.get("eventId");

    this.api.getExps(evtId).subscribe(
      data => {
        if (data) {
          this.expsList = data;
          let tmpList: any[] = [];

          for (let e of data) {
            let toDo = true;

            for (let i in tmpList) {
              if (e.payer.id == tmpList[i].payer.id) {
                let tmpExp = {
                  "id": e.id,
                  "element": e.element,
                  "price": e.price,
                  "inheriters": e.inheriters,
                  "payer": e.payer
                }

                tmpList[i].expenses.push(tmpExp);
                toDo = false;
              }
            }

            if (toDo) {
              let tmpExp = {
                "payer": e.payer,
                "expenses": [{
                  "id": e.id,
                  "element": e.element,
                  "price": e.price,
                  "inheriters": e.inheriters,
                  "payer": e.payer
                }]
              }
              tmpList.push(tmpExp);
            }
          }

          for (let i in tmpList) {
            let tmpSum: number = 0.0;
            for (let p of tmpList[i].expenses) {
              tmpSum += parseFloat(p.price);
            }
            tmpList[i].sum = tmpSum;
          }

          this.exps = tmpList;
        } else {
          this.expsList = [];
          this.exps = [];
        }
      },
      res => {
        if (res.status != 200) {
          console.log("Http request error :" + res.status);
        }
      }
    )
  }

  addCar(seats: number) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    if (!seats) {
      return false;
    }

    if (this.newMode) {
      this.addCarBool = false;
      this.cars = [{
        "seats": seats,
        "driver": { "id": this.creator.id, "firstname": this.creator.firstname, "picture": this.creator.picture },
        "passengers": []
      }];
      this.utilsObj.cars = this.cars;
      return;

    } else {
      let evtId = this.navParams.get("eventId");
      let body = {
        seats: seats
      };

      this.api.addCar(evtId, body).subscribe(
        data => {
          if (!data) {
            console.log("Error" + data);
          }
        },
        res => {
          if (res.status != undefined) {
            console.log("Http request error :" + res.status);
          } else {
            this.addCarBool = false;
            this.cars = [];
            this.getCar();
          }
        }
      );
    }
  }

  deleteCar(carId: any) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    if (this.newMode) {
      this.addCarBool = true;
      this.cars = [];
      this.utilsObj.cars = [];

      return;
    } else {
      let evtId = this.navParams.get("eventId");

      this.api.deleteCar(evtId, carId).subscribe(
        data => {
          this.cars = [];
          this.addCarBool = true;
          this.getCar();
        },
        res => {
          if (res.status != 200) {
            console.log("Http request error :" + res.status);
          }
        }
      )
    }
  }

  passengerTap(carId, profileId) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    if (this.newMode) {
      return
    } else {
      for (let c in this.cars) {
        if (profileId == this.cars[c].driver.id) {
          return;
        }
        for (let p of this.cars[c].passengers) {
          if (p.id == profileId) {
            if (carId != this.cars[c].id) {
              let evtId = this.navParams.get("eventId");

              this.api.deletePassenger(evtId, this.cars[c].id).subscribe(
                data => {
                  this.cars = [];
                  this.getCar();
                  this.api.addPassenger(evtId, carId).subscribe(
                    data => {
                      this.cars = [];
                      this.getCar();
                      return;
                    },
                    res => {
                      if (res.status != 200) {
                        console.log("Http request error :" + res.status);
                      }
                    }
                  );
                },
                res => {
                  if (res.status != 200) {
                    console.log("Http request error :" + res.status);
                  }
                }
              );
            }
          }
        }
      }

      for (let c in this.cars) {
        let driver_id = this.cars[c].driver.id;

        if (this.cars[c].id == carId) {
          for (let p of this.cars[c].passengers) {
            if (p.id == profileId) {
              if (p.id == driver_id) {
                return;
              } else {
                let evtId = this.navParams.get("eventId");

                this.api.deletePassenger(evtId, carId).subscribe(
                  data => {
                    this.cars = [];
                    this.getCar();
                    return;
                  },
                  res => {
                    if (res.status != 200) {
                      console.log("Http request error :" + res.status);
                    }
                  }
                );
              }
              return;
            } else {
              let evtId = this.navParams.get("eventId");

              this.api.addPassenger(evtId, carId).subscribe(
                data => {
                  this.cars = [];
                  this.getCar();
                  return;
                },
                res => {
                  if (res.status != 200) {
                    console.log("Http request error :" + res.status);
                  }
                }
              );
            }
          }
          return;
        }
      }
    }
  }

  addElement(element: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    if (!element) {
      return false;
    }

    if (this.newMode) {
      let elemId = this.list.length;

      this.list.push({
        assigned_to: {
          "id": null,
          "firstname": null
        },
        created_by: {
          "id": 0,
          "firstname": null
        },
        "id": elemId,
        "content": element,
        "mine": true
      });

      this.utilsObj.list = this.list;
    } else {
      let evtId = this.navParams.get("eventId");

      let body = {
        element: element
      };

      this.api.addElement(evtId, body).subscribe(
        data => {
          this.getList();
        },
        res => {
          if (res.status != undefined) {
            console.log("Http request error :" + res.status);
          } else {
            this.getList();
          }
        }
      );
    }
  }

  deleteElement(elemId) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    if (this.newMode) {
      this.list = this.list.filter(item => elemId !== item.id);
      this.utilsObj.list = this.list;
    } else {
      let evtId = this.navParams.get("eventId");

      this.api.deleteElement(evtId, elemId).subscribe(
        data => {
          this.getList();
        },
        res => {
          if (res.status != null) {
            console.log("Http request error :" + res.status);
          } else {
            this.getList();
          }
        }
      );
    }
  }

  elementTap(elemId: string, firstName: string, takerId: number) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    if (this.newMode) {
      let prompt = this.alertCtrl.create();

      prompt.setTitle(this.transaltions['chill-utils.not-sended']);
      prompt.addButton({
        text: this.transaltions['global.ok'],
      });
      prompt.present();

      return;
    }

    if (firstName == null) {
      this.takeElement(elemId);
    } else {
      if (takerId != this.creatorId) {
        return false;
      }
      this.leaveElement(elemId);
    }
  }

  takeElement(elemId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let evtId = this.navParams.get("eventId");

    this.api.takeElement(evtId, elemId).subscribe(
      data => {
        this.getList();
      },
      res => {
        if (res.status != null) {
          console.log("Http request error :" + res.status);
        } else {
          this.getList();
        }
      }
    )
  }

  leaveElement(elemId: string) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let evtId = this.navParams.get("eventId");

    this.api.leaveElement(evtId, elemId).subscribe(
      data => {
        this.getList();
      },
      res => {
        if (res.status != null) {
          console.log("Http request error :" + res.status);
        } else {
          this.getList();
        }
      }
    )
  }

  showChillerDetails(friendId: string) {
    this.navCtrl.push(ChillerDetails, { "friendId": friendId }, { animate: true, direction: 'back' });
  }

  resolve() {
    if (this.newMode) {
      let prompt = this.alertCtrl.create();
      prompt.setTitle(this.transaltions['chill-utils.not-sended']);

      prompt.addButton({
        text: this.transaltions['global.ok'],
      });

      prompt.present();
    } else {
      this.navCtrl.push(ResolveExpenses, { "expenses": this.expsList });
    }
  }

  addElementPrompt() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let prompt = this.alertCtrl.create({
      title: this.transaltions['chill-utils.input-add-element.title'],
      inputs: [
        {
          name: 'Element',
          placeholder: this.transaltions['chill-utils.input-add-element.placeholder'],
          type: 'text'
        }
      ],
      buttons: [
        {
          text: this.transaltions['global.cancel']
        },
        {
          text: this.transaltions['global.add'],
          handler: data => {
            this.addElement(data.Element);
          }
        }
      ]
    });
    prompt.present();
  }

  addCarPrompt() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let profileId = this.creatorId;

    for (let c in this.cars) {
      for (let p of this.cars[c].passengers) {
        if (profileId == p.id) {
          let prompt = this.alertCtrl.create({
            subTitle: this.transaltions['chill-utils.already-in-car1'] + this.cars[c].passengers[0].firstname + this.transaltions['chill-utils.already-in-car2'],
            buttons: [{
              text: this.transaltions['global.ok']
            }]
          });

          prompt.present();
          return;
        }
      }
    }

    let prompt = this.alertCtrl.create({
      title: this.transaltions['chill-utils.input-add-car.title'],
      inputs: [
        {
          name: 'Seats',
          placeholder: this.transaltions['chill-utils.input-add-car.placeholder'],
          type: 'number'

        }
      ],
      buttons: [
        {
          text: this.transaltions['global.cancel']
        },
        {
          text: this.transaltions['global.add'],
          handler: data => {
            this.addCar(parseInt(data.Seats) + 1);
          }
        }
      ]
    });
    prompt.present();
  }

  addExpensePrompt() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let prompt = this.alertCtrl.create();
    let friends = this.navParams.get("friends");

    if (friends.length == 0) {
      prompt.setTitle(this.transaltions['chill-utils.no-invited']);

      prompt.addButton({
        text: this.transaltions['global.ok'],
      });

      prompt.present();
    } else {
      prompt.setTitle(this.transaltions['chill-utils.input-add-expense.placeholder-element']);

      prompt.addInput({
        name: 'Element',
        placeholder: this.transaltions['chill-utils.input-add-expense.placeholder-element'],
        type: 'text'
      });

      prompt.addInput({
        name: 'Price',
        placeholder: this.transaltions['chill-utils.input-add-expense.placeholder-price'],
        type: 'number'
      });

      prompt.addButton({
        text: this.transaltions['global.cancel']
      });

      prompt.addButton({
        text: this.transaltions['global.add'],
        handler: data => {
          if (data.Element == "" || data.Price == "") {
            this.assertExps(1);
            return;
          }
          this.addFriendsToExpensePrompt(data.Element, data.Price)
        }
      });

      prompt.present();
    }
  }

  addFriendsToExpensePrompt(element: string, price: string) {
    let friends = this.navParams.get("friends");
    let prompt = this.alertCtrl.create();

    for (let friend in friends) {
      friends[friend].id == this.creatorId ? friends.splice(friend, 1) : null;
    }

    this.creator.id = this.creatorId;
    this.creator.have_chillter = true;
    friends.push(this.creator);

    /*for (let friend in friends) {
      for (let f of friend) {
        if (friends[f].id == this.creatorId) {
          let indexOf = friends.indexOf(friends[f]);
          friends.splice(indexOf, 1);
        }
      }
    }*/

    prompt.setTitle(this.transaltions['chill-utils.add-inheriter']);

    for (let i = 0; i < friends.length; i++) {
      if (friends[i].id == this.creatorId) {
        prompt.addInput({
          type: 'checkbox',
          label: (friends[i].firstname + " " + friends[i].lastname),
          value: ("value" + i.toString()),
          checked: true
        });
      } else {
        prompt.addInput({
          type: 'checkbox',
          label: (friends[i].firstname + " " + friends[i].lastname),
          value: ("value" + i.toString()),
          checked: false
        });
      }
    }

    prompt.addButton({
      text: this.transaltions['global.cancel']
    });

    prompt.addButton({
      text: this.transaltions['global.add'],
      handler: data => {
        if (data.length == 0) {
          this.assertExps(2);
          return;
        }

        let inheritersList = []
        for (let i = 0; i < friends.length; i++) {
          if (data.indexOf("value" + i.toString()) > -1) {
            inheritersList.push(friends[i].id);
          }
        }

        this.addExpense(element, price, inheritersList);
      }
    });

    prompt.present();
  }

  addExpense(element: string, price: string, inheriters: any[]) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    if (element == "" || price == "") {
      return false;
    }

    if (this.newMode) {
      let Uexps = [{
        "id": null,
        "price": price,
        "element": element,
        "payer": {
          "id": this.creatorId,
          "firstname": this.creator.firstname
        },
        "inheriters": inheriters
      }];


      // If tmpList !undefined add expense to the existing exps list, don't reset tmpList
      if (this.isTmpList == false) {
        this.expsList = Uexps;
        this.tmpList = [];
      }

      for (let e of Uexps) {
        let toDo = true;

        for (let i in this.tmpList) {
          if (e.payer.id == this.tmpList[i].payer.id) {
            let tmpExp = {
              "id": e.id,
              "element": e.element,
              "price": e.price,
              "inheriters": e.inheriters,
              "payer": e.payer
            }

            this.expsList.push(tmpExp);
            this.tmpList[i].expenses.push(tmpExp);
            toDo = false;
          }
        }

        if (toDo) {
          this.isTmpList = true;
          let tmpExp = {
            "payer": e.payer,
            "expenses": [{
              "id": e.id,
              "element": e.element,
              "price": e.price,
              "inheriters": e.inheriters
            }]
          }

          this.tmpList.push(tmpExp);
        }
      }

      for (let i in this.tmpList) {
        let tmpSum: number = 0.0;
        for (let p of this.tmpList[i].expenses) {
          tmpSum += parseFloat(p.price);
        }
        this.tmpList[i].sum = tmpSum;
      }

      this.exps = this.tmpList;
      this.utilsObj.expenses = this.exps;
    }

    if (!this.newMode) {
      let evtId = this.navParams.get("eventId");
      let body = {
        expenses: [{
          "element": element,
          "price": price,
          "inheriters": inheriters
        }]
      };

      this.api.addExpense(evtId, body).subscribe(
        data => {
          if (!data) {
            return false;
          }
        },
        res => {
          if (res.status != undefined) {
            console.log("Http request error :" + res.status);
          } else {
            this.getExps();
          }
        });
    }
  }

  // Format exps object when coming back from edit-chill
  formatExps() {
    let formatUtilsObj = this.utilsObj.expenses;

    for (let e in formatUtilsObj) {
      for (let u of formatUtilsObj[e].expenses) {
        if (u.element != undefined && u.price != undefined && u.inheriters != undefined) {
          this.addExpense(u.element, u.price, u.inheriters);
        }
      }
    }
  }

  deleteExp(expId, expPrice, expExpense) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    let expsDel = this.exps;

    if (this.newMode) {
      for (let e in expsDel) {
        for (let el of expsDel[e].expenses) {
          if (el.price == expPrice && el.element == expExpense) {
            let indexOf = expsDel[e].expenses.indexOf(el);

            expsDel[e].expenses.splice(indexOf, 1);
            this.utilsObj.expenses = [];
            this.exps = [];
            this.tmpList = [];
            this.utilsObj.expenses = expsDel;
            this.formatExps();
            return;
          }
        }
      }
    } else {
      let evtId = this.navParams.get("eventId");

      this.api.deleteExpense(evtId, expId).subscribe(
        data => {
          this.getExps();
        },
        res => {
          if (res.status != null) {
            console.log("Http request error :" + res.status);
          } else {
            this.getExps();
          }
        }
      );
    }
  }

  // Constraint to give information about expenses
  assertExps(type) {
    let prompt = this.alertCtrl.create();

    if (type == 1) {
      prompt.setTitle(this.transaltions['chill-utils.no-exp-info']);

      prompt.addButton({
        text: this.transaltions['global.ok'],
        handler: data => {
          this.addExpensePrompt();
        }
      });

      prompt.present();
    }

    if (type == 2) {
      prompt.setTitle(this.transaltions['chill-utils.no-exp-inheriter']);

      prompt.addButton({
        text: this.transaltions['global.ok']
      });

      prompt.present();
    }
  }

  close() {
    this.viewCtrl.dismiss(this.utilsObj);
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

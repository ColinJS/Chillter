import { Component } from '@angular/core';
import { NavController, ViewController, NavParams } from 'ionic-angular';

@Component({
  selector: 'resolve-expenses',
  templateUrl: 'resolve-expenses.html',
})
export class ResolveExpenses {

  pay: any[];

  constructor(
    public nav: NavController,
    public viewCtrl: ViewController,
    public navParams: NavParams) {

    let baseExps = this.navParams.get("expenses");
    let tmpList: any[] = [];

    for (let e of baseExps) {
      let neo: boolean = true;

      for (let i in tmpList) {
        if (tmpList[i].chiller.id == e.payer.id) {
          tmpList[i].credit += parseFloat(e.price);
          neo = false;
        }
      }

      if (neo) {
        let tmpExp = {
          "chiller": e.payer,
          "credit": parseFloat(e.price)
        }
        tmpList.push(tmpExp);
      }

      let count = e.inheriters.length

      for (let i of e.inheriters) {
        neo = true;

        for (let j in tmpList) {
          if (tmpList[j].chiller.id == i.id) {
            tmpList[j].credit -= parseFloat(e.price) / count;
            neo = false;
          }
        }

        if (neo) {
          let tmpExp = {
            "chiller": i,
            "credit": -(parseFloat(e.price) / count)
          }
          tmpList.push(tmpExp);
        }
      }
    }

    let posList = tmpList.filter((a) => {
      if (a.credit > 0) {
        return true
      } else {
        return false
      }
    });

    let negList = tmpList.filter((a) => {
      if (a.credit < 0) {
        return true
      } else {
        return false
      }
    });

    let otherTmp: any[] = [];
    let toSplice: any[] = [];

    for (let p = 0; p < posList.length; p++) {
      let tmpCredit = posList[p].credit;

      for (let n = 0; n < negList.length; n++) {
        tmpCredit += negList[n].credit

        if (tmpCredit == 0) {
          let tmpPay = {
            "from": negList[n].chiller,
            "to": posList[p].chiller,
            "sum": Math.abs(negList[n].credit)
          }

          toSplice.push(n);
          tmpPay.sum = (Math.trunc(tmpPay.sum * 100) / 100)
          otherTmp.push(tmpPay);
          break;
        } else if (tmpCredit > 0) {
          let tmpPay = {
            "from": negList[n].chiller,
            "to": posList[p].chiller,
            "sum": Math.abs(negList[n].credit)
          }
          toSplice.push(n);
          tmpPay.sum = (Math.trunc(tmpPay.sum * 100) / 100)
          otherTmp.push(tmpPay);
        } else {
          let tmpPay = {
            "from": negList[n].chiller,
            "to": posList[p].chiller,
            "sum": (Math.abs(negList[n].credit) + tmpCredit)
          }
          negList[n].credit = tmpCredit;
          tmpPay.sum = (Math.trunc(tmpPay.sum * 100) / 100)
          otherTmp.push(tmpPay);
          break;
        }
      }

      for (let i = 0; i < toSplice.length; i++) {
        negList.splice((toSplice[i] - i), 1);
      }
    }
    this.pay = otherTmp;
  }

  swipeEvent(evt: any): void {
    if (evt.deltaX < -25) {
      this.close()
    }
  }

  close() {
    this.viewCtrl.dismiss();
  }
}

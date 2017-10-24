import { Component } from '@angular/core';
import {
  NavController,
  ViewController,
  AlertController
} from 'ionic-angular';
import { ApiService } from '../../providers/api';
import { TabsPage } from '../tabs/tabs';
import { SignIn } from '../signin/signin';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { TranslateService } from 'ng2-translate';

@Component({
  selector: 'login',
  templateUrl: 'login.html',
})
export class LogIn {
  private transaltions: any;

  form: FormGroup;
  submitted: boolean = false;

  constructor(
    private viewCtrl: ViewController,
    private translate: TranslateService,
    private nav: NavController,
    private api: ApiService,
    private alertCtrl: AlertController,
    private formBuilder: FormBuilder
  ) {
    translate.get(['login.login-failed',
      'login.error',
      'login.notice',
      'global.ok']).subscribe(value => this.transaltions = value);

    this.form = formBuilder.group({
      email: ['', Validators.compose([Validators.required])],
      pass: ['', Validators.compose([Validators.required])]
    });
  }

  ionViewDidEnter() {
    let prompt = this.alertCtrl.create({
      subTitle: this.transaltions['login.notice'],
      buttons: [{
        text: this.transaltions['global.ok']
      }]
    });

    prompt.present();
  }

  showSignUp() {
    this.nav.push(SignIn, {}, { animate: true, direction: 'back' });
  }

  onSubmit() {
    this.submitted = true;

    if (this.form.valid) {
      this.api.login(this.form.value).subscribe(
        res => {
          this.nav.setRoot(TabsPage);
        },
        res => {
          if (404 === res.status) {
            this.alertCtrl.create({
              title: this.transaltions['login.error'],
              subTitle: this.transaltions['login.login-failed'],
              buttons: ['OK']
            }).present();
          }

          if (403 === res.status) {
            this.alertCtrl.create({
              title: this.transaltions['login.error'],
              subTitle: this.transaltions['login.login-failed'],
              buttons: ['OK']
            }).present();
          }
        }
      );
    }
  }
}

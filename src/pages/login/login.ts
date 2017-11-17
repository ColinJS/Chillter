import { Component } from '@angular/core';
import {
  NavController,
  ViewController,
  AlertController,
  ToastController
} from 'ionic-angular';
import { ApiService } from '../../providers/api';
import { TabsPage } from '../tabs/tabs';
import { SignIn } from '../signin/signin';
import { SyncService } from '../../providers/sync';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { TranslateService } from 'ng2-translate';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';

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
    private formBuilder: FormBuilder,
    private sync: SyncService,
    private toastCtrl: ToastController
  ) {
    translate.get(['login.login-failed',
      'login.error',
      'login.notice',
      'offline.blocked',
      'global.ok']).subscribe(value => this.transaltions = value);

    this.form = formBuilder.group({
      email: ['', Validators.compose([Validators.required])],
      pass: ['', Validators.compose([Validators.required])]
    });
  }

  showSignUp() {
    this.nav.push(SignIn, {}, { animate: true, direction: 'back' });
  }

  onSubmit() {
    if (!this.sync.status) {
      this.showToast(1);
      return;
    }

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

  showToast(type) {
    if (type == 1) {
      const toast = this.toastCtrl.create({
        message: this.transaltions['offline.blocked'],
        duration: 3000
      });
      toast.present();
    }
  }

  openForgotPage() {
    if (!this.sync.status) {
      this.showToast(1);
      return;
    }

    this.nav.push(ForgotPasswordPage);
  }
}

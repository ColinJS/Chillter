import { Component } from '@angular/core';
import {
  NavController,
  ViewController,
  AlertController,
  ToastController
} from 'ionic-angular';
import { ApiService } from '../../providers/api';
import { SyncService } from '../../providers/sync';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { LogIn } from '../login/login';
import { CustomValidators } from 'ng2-validation';
import { TranslateService } from 'ng2-translate';
import { EqualValidator } from '../../validators/equal';

@Component({
  selector: 'forgot-password',
  templateUrl: 'forgot-password.html',
})
export class ForgotPasswordPage {
  private transaltions: any;

  formEmail: FormGroup;
  userEmail: string = undefined;
  submittedEmail: boolean = false;

  userPasswordToken: string = undefined;
  submittedToken: boolean = false;
  tokenValid: boolean = false;

  formPasswords: FormGroup;
  newUserPassword: string = undefined;
  submittedPasswords: boolean = false;

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
    translate.get(['forgot-password.email-placeholder',
      'forgot-password.verification',
      'forgot-password.sent-email1',
      'forgot-password.sent-email2',
      'forgot-password.token-placeholder',
      'forgot-password.verify-token-alert',
      'forgot-password.set-new-password-title',
      'forgot-password.set-new-password',
      'forgot-password.email-invalid',
      'forgot-password.token-expired',
      'forgot-password.token-invalid',
      'forgot-password.error',
      'offline.blocked',
      'global.cancel',
      'global.ok']).subscribe(value => this.transaltions = value);

    this.formEmail = formBuilder.group({
      email: ['', Validators.compose([Validators.required, CustomValidators.email])]
    });

    this.formPasswords = formBuilder.group({
      passwords: formBuilder.group({
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required]
      }, { validator: EqualValidator.isValid })
    })
  }

  onSubmitEmail() {
    if (!this.sync.status) {
      this.showToast(1);
      return;
    }

    if (this.formEmail.valid && !this.submittedEmail) {
      this.submittedEmail = true;
      this.userEmail = this.formEmail.value.email;
      this.api.sendResetPasswordToken(this.formEmail.value).subscribe(
        res => {
          this.alertCtrl.create({
            title: this.transaltions['forgot-password.verification'],
            subTitle: this.transaltions['forgot-password.sent-email1'] + this.userEmail + this.transaltions['forgot-password.sent-email2'],
            buttons: [this.transaltions['global.ok']]
          }).present();
        },
        err => {
          const error = JSON.parse(err._body);
          if (!error.success) {
            this.submittedEmail = false;
            this.showAlert(error.code);
            return;
          }
        }
      );
    }
  }

  verifyToken() {
    if (!this.sync.status) {
      this.showToast(1);
      return;
    }

    if (this.userEmail) {
      this.alertCtrl.create({
        title: this.transaltions['forgot-password.verification'],
        inputs: [
          {
            name: 'token',
            placeholder: this.transaltions['forgot-password.token-placeholder'],
            type: 'text'
          },
        ],
        buttons: [
          {
            text: this.transaltions['global.cancel']
          },
          {
            text: this.transaltions['forgot-password.verify-token-alert'],
            handler: data => {
              this.submitToken(undefined, data.token)
            }
          }
        ]
      }).present();
    } else {
      this.alertCtrl.create({
        title: this.transaltions['forgot-password.verification'],
        inputs: [
          {
            name: 'email',
            placeholder: this.transaltions['forgot-password.email-placeholder'],
            type: 'email'
          },
          {
            name: 'token',
            placeholder: this.transaltions['forgot-password.token-placeholder'],
            type: 'token'
          },
        ],
        buttons: [
          {
            text: this.transaltions['global.cancel']
          },
          {
            text: this.transaltions['forgot-password.verification'],
            handler: data => {
              this.submitToken(data.email, data.token);
            }
          }
        ]
      }).present();
    }
  }

  submitToken(email, token) {
    if (!this.sync.status) {
      this.showToast(1);
      return;
    }

    email ? this.userEmail = email : null;
    if (!this.userEmail || !token) {
      return;
    }
    let body = {
      email: undefined,
      token: undefined
    }

    this.userPasswordToken = token;
    body.email = this.userEmail;
    body.token = token;

    this.api.verifyResetPasswordToken(body).subscribe(
      res => {
        this.tokenValid = true;
      },
      err => {
        const error = JSON.parse(err._body);
        if (!error.success) {
          this.showAlert(error.code);
          return;
        }
      }
    );
  }

  submitPasswords() {
    if (!this.userEmail || !this.userPasswordToken) {
      this.tokenValid = false;
      return;
    }
    let body = {
      email: undefined,
      token: undefined,
      password: undefined
    };

    if (this.formPasswords.valid) {
      this.newUserPassword = this.formPasswords.value.passwords.confirmPassword;
      body.email = this.userEmail;
      body.token = this.userPasswordToken;
      body.password = this.newUserPassword;

      this.api.setNewPassword(body).subscribe(
        res => {
          this.alertCtrl.create({
            title: this.transaltions['forgot-password.set-new-password-title'],
            subTitle: this.transaltions['forgot-password.set-new-password'],
            buttons: [this.transaltions['global.ok']]
          }).present();

          this.nav.setRoot(LogIn);
        },
        err => {
          const error = JSON.parse(err._body);
          if (!error.success) {
            this.showAlert(error.code);
            return;
          }
        })
    }
  }

  // Showing alert when password reset process fail
  showAlert(type) {
    if (type == 1) {
      this.alertCtrl.create({
        title: this.transaltions['forgot-password.error'],
        subTitle: this.transaltions['forgot-password.email-invalid'],
        buttons: [this.transaltions['global.ok']]
      }).present();
    }

    if (type == 2) {
      this.alertCtrl.create({
        title: this.transaltions['forgot-password.error'],
        subTitle: this.transaltions['forgot-password.token-expired'],
        buttons: [this.transaltions['global.ok']]
      }).present();
    }

    if (type == 3) {
      this.alertCtrl.create({
        title: this.transaltions['forgot-password.error'],
        subTitle: this.transaltions['forgot-password.token-invalid'],
        buttons: [this.transaltions['global.ok']]
      }).present();
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
}

import { Component } from '@angular/core';
import {
  NavController,
  ViewController,
  App,
  AlertController,
  ToastController
} from 'ionic-angular';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { EqualValidator } from '../../validators/equal';
import { ApiService } from '../../providers/api';
import { TabsPage } from '../tabs/tabs';
import { CustomValidators } from 'ng2-validation';
import { TranslateService } from 'ng2-translate';
import { StorageService } from '../../providers/storage';
import { ContactsService } from '../../providers/contacts'
import { ImgPickerService } from '../../providers/img-picker';
import { SyncService } from '../../providers/sync';
import { Home } from '../home/home';

@Component({
  selector: "signin",
  templateUrl: 'signin.html'
})
export class SignIn {
  private transaltions: any;

  form: FormGroup;
  submitted: boolean = false;
  picture: string = "assets/images/default-profil.svg";

  constructor(
    private app: App,
    private nav: NavController,
    private api: ApiService,
    private alertCtrl: AlertController,
    private viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private storage: StorageService,
    private contacts: ContactsService,
    private imgPickerService: ImgPickerService,
    private sync: SyncService,
    private toastCtrl: ToastController

  ) {
    translate.get([
      'signup.error1',
      'signup.error2',
      'signup.error3',
      'offline.blocked',
      'global.ok',
      'global.back']).subscribe(value => this.transaltions = value);

    this.form = formBuilder.group({
      firstname: ['', Validators.compose([Validators.required])],
      lastname: ['', Validators.compose([Validators.required])],
      passwords: formBuilder.group({
        password: ['', Validators.required],
        confirmPassword: ['', Validators.required]
      }, { validator: EqualValidator.isValid }),
      sex: [false, Validators.compose([Validators.required])],
      phone: ['', Validators.compose([Validators.required, CustomValidators.number])],
      email: ['', Validators.compose([Validators.required, CustomValidators.email])],
      language: ['fr', Validators.compose([Validators.required])],
      currency: ['euro', Validators.compose([Validators.required])]
    });
  }

  onSubmit() {
    let imgResult = this.imgPickerService.getImgResultLogo();
    let firstSrc = this.imgPickerService.getFirstImgSrcLogo();

    if (!this.sync.status) {
      this.showToast(1);
      return;
    }

    this.submitted = true;

    if (this.form.valid) {
      const body = {
        'firstname': this.form.value.firstname,
        'lastname': this.form.value.lastname,
        'sex': this.form.value.sex,
        'phone': this.form.value.phone,
        'email': this.form.value.email,
        'language': this.form.value.language,
        'currency': this.form.value.currency,
        'pass': this.form.value.passwords.password,
        'image': null
      };

      if (imgResult && imgResult != firstSrc) {
        body.image = imgResult;
      }

      this.api.signUp(body).subscribe(data => {
        if (data) {
          this.storage.setValue("id", data.id);
          this.nav.setRoot(TabsPage);
          this.getContacts();
        } else {
          let prompt = this.alertCtrl.create();

          prompt.setTitle(this.transaltions['signup.error1']);
          prompt.setSubTitle(this.transaltions['signup.error2']);
          prompt.addButton({
            text: this.transaltions['global.ok']
          });
          prompt.present();
        }
      },
        err => {
          if (err) {
            if (err.type == 2 && err.status == 400) {
              let prompt = this.alertCtrl.create();

              prompt.setTitle(this.transaltions['signup.error1']);
              prompt.setSubTitle(this.transaltions['signup.error3']);
              prompt.addButton({
                text: this.transaltions['global.ok']
              });
              prompt.present();
            }
          }
        });
    }
  }

  getContacts() {
    this.contacts.getContacts(0);
    this.nav.setRoot(Home);
  }

  // Set text for back button (navbar)
  ionViewWillEnter() {
    this.viewCtrl.setBackButtonText(this.transaltions['global.back']);
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

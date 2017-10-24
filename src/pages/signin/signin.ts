import {
  Component,
  ViewChild
} from '@angular/core';
import {
  NavController,
  ViewController,
  App,
  AlertController
} from 'ionic-angular';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { EqualValidator } from '../../validators/equal';
import { ApiService } from '../../providers/api';
import { ImgLoader } from '../../components/img-loader/img-loader';
import { TabsPage } from '../tabs/tabs';
import { CustomValidators } from 'ng2-validation';
import { TranslateService } from 'ng2-translate';
import { StorageService } from '../../providers/storage';
import { ContactsService } from '../../providers/contacts'

@Component({
  selector: "signin",
  templateUrl: 'signin.html'
})
export class SignIn {
  private transaltions: any;

  form: FormGroup;
  submitted: boolean = false;

  @ViewChild(ImgLoader) loader: ImgLoader;

  constructor(
    private app: App,
    private nav: NavController,
    private api: ApiService,
    private alertCtrl: AlertController,
    private viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private storage: StorageService,
    private contacts: ContactsService

  ) {
    translate.get([
      'signup.error1',
      'signup.error2',
      'signup.error3',
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
    this.submitted = true;

    if (this.form.valid) {
      const body = {
        'info': {
          'firstname': this.form.value.firstname,
          'lastname': this.form.value.lastname,
          'sex': this.form.value.sex,
          'phone': this.form.value.phone,
          'email': this.form.value.email,
          'language': this.form.value.language,
          'currency': this.form.value.currency,
          'pass': this.form.value.passwords.password
        }
      };

      this.api.signUp(body).subscribe(data => {
        if (data) {
          this.storage.setValue("id", data.id);
          this.sendPicture();
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
  }

  sendPicture() {
    if (this.loader) {
      console.log('this.loader')
      console.log(this.loader)
      this.api.sendPicture(this.loader.file, this.loader)
        .subscribe((data: any) => {
          this.form.value.picture = data.url;
        });
    }
  }

  // Set text for back button (navbar)
  ionViewWillEnter() {
    this.viewCtrl.setBackButtonText(this.transaltions['global.back']);
  }
}

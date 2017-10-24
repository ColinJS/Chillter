import {
  Component,
  ViewChild
} from '@angular/core';
import {
  NavController,
  App,
  Events,
  AlertController,
  ToastController,
  LoadingController
} from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import { ImgLoader } from '../../components/img-loader/img-loader';
import { ApiService } from '../../providers/api';
import { SyncService } from '../../providers/sync';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { ContactsService } from '../../providers/contacts'
import { CacheService } from '../../providers/cache'

@Component({
  selector: 'chill-set',
  templateUrl: 'chill-set.html'
})
export class ChillSet {
  private form: FormGroup;

  private transaltions: any;

  @ViewChild(ImgLoader) loader: any;

  picture: string = "";
  pictChange: boolean = false;
  synchronizeFinished: boolean = false;

  constructor(
    private translate: TranslateService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private notif: Events,
    private formBuilder: FormBuilder,
    private nav: NavController,
    private app: App,
    private api: ApiService,
    private sync: SyncService,
    private contacts: ContactsService,
    private loadingCtrl: LoadingController,
    private cache: CacheService
  ) {
    this.api.getMyProfile().subscribe(data => {
      this.picture = data.picture ? data.picture : null;

      this.form.controls['phone'].setValue(data.phone, { emitEvent: false });
      this.form.controls['email'].setValue(data.email, { emitEvent: false });
    });

    translate.get(['chill-set.change-password',
      'chill-set.inputs.old-password',
      'chill-set.inputs.new-password',
      'chill-set.error-password',
      'offline.blocked',
      'global.cancel',
      'global.save',
      'global.loading']).subscribe(value => this.transaltions = value);

    this.form = formBuilder.group({
      phone: ['', Validators.compose([Validators.required, CustomValidators.number])],
      email: ['', Validators.compose([Validators.required, CustomValidators.email])]
    });

    this.notif.publish("notif:update");
  }

  sendPicture() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    this.pictChange = false;
    if (this.loader) {
      this.api.sendPicture(this.loader.file, this.loader)
        .subscribe((data: any) => {
          this.picture = data.url;
        });
    }
  }

  cancelPicture() {
    this.loader.drawPreview(this.picture);

    setTimeout(() => {
      this.pictChange = false;
    }, 1);
  }

  changeInfo() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }
    const body: any = {
      info: {
        phone: this.form.value.phone,
        email: this.form.value.email
      }
    };

    this.api.updateMyProfile(body).subscribe();
  }

  sendPasswordRequest(oldPass: string, newPass: string) {
    const body: any = {
      oldPassword: oldPass,
      newPassword: newPass
    };

    this.api.passwordRequest(body).subscribe();
  }

  changePassword() {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }

    this.alertCtrl.create({
      title: this.transaltions['chill-set.change-password'],
      inputs: [
        {
          name: 'oldPass',
          placeholder: this.transaltions['chill-set.inputs.old-password'],
          type: 'password'
        },
        {
          name: 'newPass',
          placeholder: this.transaltions['chill-set.inputs.new-password'],
          type: 'password'
        },
      ],
      buttons: [
        {
          text: this.transaltions['global.cancel']
        },
        {
          text: this.transaltions['global.save'],
          handler: data => {
            this.sendPasswordRequest(data.oldPass, data.newPass)
          }
        }
      ]
    }).present();
  }

  loadChange(evt) {
    if (!this.sync.status) {
      this.showOfflineToast(1);
      return;
    }

    this.pictChange = true;
  }

  logout() {
    this.api.logout();
  }

  synchronizeContacts() {
    let loading = this.loadingCtrl.create({
      spinner: 'crescent',
      content: this.transaltions['global.loading'],
      duration: 10000
    });

    loading.present();
    this.contacts.resetAll();

    setTimeout(() => {
      this.synchronizeFinished = true;
    }, 10050)
    setTimeout(() => {
      this.synchronizeFinished = false;
    }, 12500)
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

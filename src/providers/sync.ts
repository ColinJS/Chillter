import { Injectable } from '@angular/core';
import { Network } from '@ionic-native/network';
import { CacheService } from './cache';
import { Http } from '@angular/http';
import { ToastController, Events } from 'ionic-angular';
import { TranslateService } from 'ng2-translate';

@Injectable()
export class SyncService {
  public status: boolean = false;
  lgnDetected: string;
  lgnUsed: any;
  enLgnTxt: any;
  frLgnTxt: any;

  constructor(
    private http: Http,
    private notif: Events,
    private network: Network,
    private cache: CacheService,
    private toastCtrl: ToastController,
    private translate: TranslateService,
  ) {
    this.status = network.type !== 'none';

    this.status ? this.sync() : null;

    network.onDisconnect().subscribe(() => {
      this.status = false;
    });

    network.onConnect().subscribe(() => {
      this.status = true;
      this.sync();
      this.notif.publish("notif:update");
    });
  }

  stash(data: Object): boolean {
    if (!this.status) {
      this.cache.addCache('SYNC', data);

      return true;
    }

    return false;
  }

  sync() {
    this.cache.getCache('SYNC')
      .subscribe(data => {
        data = data || [];

        if (data.length == 0) {
          return;
        } else {
          data.forEach(element => {
            switch (element.method) {
              case 'post':
                this.http.post(element.url, element.body, element.options).subscribe();
                break;
              case 'put':
                this.http.put(element.url, element.body, element.options).subscribe();
                break;
              case 'delete':
                this.http.delete(element.url, element.options).subscribe();
                break;
            }
          });

          this.cache.clearCache('SYNC');
        }
      });
  }

}

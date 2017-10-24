import { Component, ViewChild } from '@angular/core';
import {
  Platform,
  Events,
  NavController
} from 'ionic-angular';
import { TranslateService } from 'ng2-translate';
import {
  StatusBar,
  Splashscreen
} from 'ionic-native';
import { TabsPage } from '../pages/tabs/tabs';
import { LogIn } from '../pages/login/login';
import { Keyboard } from 'ionic-native';
import { ApiService } from '../providers/api';
import ImgCache from 'imgcache.js';
import { OneSignal } from '@ionic-native/onesignal';
import { ChillDetail } from '../pages/chill-detail/chill-detail';

@Component({
  templateUrl: 'app.html',
})

export class ChillterApp {
  @ViewChild('nav') nav: NavController;
  rootPage: any = LogIn;

  constructor(
    private notif: Events,
    private translate: TranslateService,
    private platform: Platform,
    private api: ApiService,
    private oneSignal: OneSignal
  ) {
    translate.setDefaultLang('fr');
    translate.use(translate.getBrowserLang());

    platform.ready().then(() => {
      // TestFairy.begin("f19649910e4277942e0b30324951a914cfa2ffd1");
      StatusBar.styleDefault();

      ImgCache.init();

      api.isLoggedIn().subscribe(val => this.rootPage = val ? TabsPage : LogIn);

      if (window.hasOwnProperty('cordova')) {
        this.oneSignal
          .startInit('be2f4c2c-0d4e-4ca8-a9c8-9d48673e2261', '508977073579')
          .handleNotificationOpened(jsonData => {

            let additionalData = jsonData.notification.payload.additionalData;
            console.info('OneSignal pushed event "' + additionalData.event + '".');

            switch (additionalData.event) {
              case 'chillter.friend_request':
                // Change tab to friends list
              break;

              case 'chillter.event_participation_created':
              case 'chillter.event_participation_updated':
              case 'chillter.event_list_element_action':
              case 'chillter.event_updated':
                this.nav.push(ChillDetail, { "eventId": additionalData.event_id });
              break;
            }
          })
          .endInit();
      }

      Splashscreen.hide();
      Keyboard.hideKeyboardAccessoryBar(false);
      Keyboard.disableScroll(true);
    });
  }
}

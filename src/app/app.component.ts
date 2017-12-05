import { Component, ViewChild } from '@angular/core';
import {
  Platform,
  Events,
  NavController,
  App
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
import { ChillChatPage } from '../pages/chill-chat/chill-chat';
import { ChillUtils } from '../pages/chill-utils/chill-utils';

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
    private oneSignal: OneSignal,
    private app: App
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
            let additionalData;

            jsonData.notification.payload.additionalData ? additionalData = jsonData.notification.payload.additionalData : null;

            // Need a timeout before selecting tab because the app need to be entirely ready
            switch (additionalData.event) {
              case 'chillter.friend_request':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(2);
                }, 500);
              break;
              case 'chillter.event_message_created':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(1);
                  this.nav.push(ChillChatPage, { "eventId": additionalData.event_id, "eventName": additionalData.event_name });
                }, 500);
              break;
              case 'chillter.event_updated':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(1);
                  this.nav.push(ChillDetail, { "eventId": additionalData.event_id })
                }, 500);
              break;
              case 'chillter.event_participant_updated':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(1);
                  this.nav.push(ChillDetail, { "eventId": additionalData.event_id })
                }, 500);
              break;
              case 'chillter.event_cancelled':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(1);
                }, 500);
              break;
              case 'chillter.event_car_created':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(1);
                  this.nav.push(ChillDetail, { "eventId": additionalData.event_id });
                }, 500);
              break;
              case 'chillter.event_car_removed':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(1);
                  this.nav.push(ChillDetail, { "eventId": additionalData.event_id });
                }, 500);
              break;
              case 'chillter.event_list_element':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(1);
                  this.nav.push(ChillDetail, { "eventId": additionalData.event_id });
                }, 500);
              break;
              case 'chillter.event_participant_created':
                setTimeout(() => {
                  this.app.getRootNav().getActiveChildNav().select(1);
                  this.nav.push(ChillDetail, { "eventId": additionalData.event_id });
                }, 500);
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

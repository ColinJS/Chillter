import {
  NgModule,
  ErrorHandler
} from '@angular/core';
import {
  IonicApp,
  IonicModule,
  IonicErrorHandler,
  Config
} from 'ionic-angular';
import {
  TranslateModule,
  TranslateStaticLoader,
  TranslateLoader
} from 'ng2-translate/ng2-translate';
import { SortablejsModule } from 'angular-sortablejs';
import { Http } from '@angular/http';
import { Network } from '@ionic-native/network';
import { OneSignal } from '@ionic-native/onesignal';
import { Contacts } from 'ionic-native';

import { ChillterApp } from './app.component';
import { AskFriends } from '../pages/ask-friends/ask-friends';
import { ChillBox } from '../pages/chill-box/chill-box';
import { ChillDetail } from '../pages/chill-detail/chill-detail';
import { ChillList } from '../pages/chill-list/chill-list';
import { ChillSet } from '../pages/chill-set/chill-set';
import { ChillUtils } from '../pages/chill-utils/chill-utils';
import { ChillerDetails } from '../pages/chiller-details/chiller-details';
import { EditChills } from '../pages/edit-chills/edit-chills';
import { FriendList } from '../pages/friend-list/friend-list';
import { History } from '../pages/history/history';
import { Home } from '../pages/home/home';
import { LogIn } from '../pages/login/login';
import { ResolveExpenses } from '../pages/resolve-expenses/resolve-expenses';
import { SignIn } from '../pages/signin/signin';
import { TabsPage } from '../pages/tabs/tabs';
import { PhotoEditPage } from '../pages/photo-edit/photo-edit';
import { ChillChatPage } from '../pages/chill-chat/chill-chat';
import { MoreFriendsPage } from '../pages/more-friends/more-friends';
import { ForgotPasswordPage } from '../pages/forgot-password/forgot-password';

import { ImgPickerLogo } from '../components/img-picker-logo/img-picker-logo';
import { ImgPickerBanner } from '../components/img-picker-banner/img-picker-banner';
import { StatusImg } from '../pipes/statusImg'
import { ToNow } from '../pipes/toNow'

import { ApiService } from '../providers/api';
import { ConfigService } from '../providers/config';
import { ImgPickerService } from '../providers/img-picker'
import { StorageService } from '../providers/storage';
import { HttpService } from '../providers/http';
import { TransferService } from '../providers/transfer';
import { CacheService } from '../providers/cache';
import { ContactsService } from '../providers/contacts';
import { SyncService } from '../providers/sync';
import { WeatherService } from '../providers/weather';

import { ImageCacheDirective } from '../directives/image';

import { CustomModalEnterTransition } from '../transitions/custom-modal-enter';
import { CustomModalLeaveTransition } from '../transitions/custom-modal-leave';

import {
  ImageCropperComponent
} from 'ng2-img-cropper';

@NgModule({
  declarations: [
    ChillterApp,
    AskFriends,
    ChillBox,
    ChillDetail,
    ChillList,
    ChillSet,
    ChillUtils,
    ChillerDetails,
    EditChills,
    FriendList,
    History,
    Home,
    LogIn,
    SignIn,
    ResolveExpenses,
    TabsPage,
    ChillChatPage,
    MoreFriendsPage,
    ForgotPasswordPage,
    PhotoEditPage,
    ImgPickerLogo,
    ImgPickerBanner,
    StatusImg,
    ToNow,
    ImageCacheDirective,
    ImageCropperComponent
  ],
  imports: [
    IonicModule.forRoot(ChillterApp, {
      mode: "ios",
      tabbarPlacement: "bottom",
      pageTansition: "ios",
      modalEnter: 'custom-modal-enter',
      modalLeave: 'custom-modal-leave',
      scrollPadding: false,
      scrollAssist: true,
      autoFocusAssist: false
    }),
    TranslateModule.forRoot({
      provide: TranslateLoader,
      useFactory: ((http: Http) => new TranslateStaticLoader(http, './assets/i18n', '.json')),
      deps: [Http]
    }),
    SortablejsModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    ChillterApp,
    AskFriends,
    ChillBox,
    ChillDetail,
    ChillList,
    ChillSet,
    ChillUtils,
    ChillerDetails,
    EditChills,
    FriendList,
    History,
    Home,
    LogIn,
    SignIn,
    ResolveExpenses,
    TabsPage,
    ChillChatPage,
    MoreFriendsPage,
    ForgotPasswordPage,
    PhotoEditPage,
    ImageCropperComponent
  ],
  providers: [
    Network,
    ApiService,
    ConfigService,
    ImgPickerService,
    StorageService,
    HttpService,
    TransferService,
    CacheService,
    ContactsService,
    Contacts,
    SyncService,
    OneSignal,
    WeatherService,
    { provide: ErrorHandler, useClass: IonicErrorHandler }
  ]
})
export class AppModule {
  constructor(public config: Config) {
    this.config.setTransition('custom-modal-enter', CustomModalEnterTransition);
    this.config.setTransition('custom-modal-leave', CustomModalLeaveTransition);
  }
}


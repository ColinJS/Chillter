import { Injectable, isDevMode } from '@angular/core';

@Injectable()
export class ConfigService {

  devMode: boolean = false;
  localMode: boolean = true;
  masterUrl: string = 'http://chillter-app.publish-it.fr';
  constructor() {
    if (isDevMode()) { this.devMode = true; }
    this.masterUrl = this.localMode ? 'http://chillter' : this.masterUrl;
  }

  getBaseUrl(): string {
    // we are on mobile
    /*if (window.hasOwnProperty('cordova')) {
      return this.devMode ? 'http://chillter-app.publish-it.fr' : 'http://www.chillter.fr';
    }*/

    // we are on the web
    //return this.devMode ? '/api-dev' : '/api';

    // Fixed URL while not on chillter.fr
    return this.masterUrl;
  }

  getApiUrl(): string {
    let url = this.getBaseUrl() + '/api';

    return this.devMode ? url : url + '/v0.1';
  }

  getLocale(): string {
    return this.devMode ? 'fr' : 'fr';
  }

  getUrl(): string {
    return this.masterUrl;
  }

  getWeatherApiUrl(): string {
    return 'http://api.apixu.com/v1/forecast.json?key=02d5d206fede4b74b6f133114171807';
  }

  getChatUrl(): string {
    return 'ws://194.146.226.13:5878';
  }
}

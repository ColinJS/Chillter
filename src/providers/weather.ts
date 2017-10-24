import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ConfigService } from './config';

import 'rxjs/add/operator/map';

@Injectable()
export class WeatherService {
  private weatherApiUrl: string;

  constructor(
    private http: Http,
    private configService: ConfigService
  ) {
    this.weatherApiUrl = configService.getWeatherApiUrl();
  }

  // Search weather forecast by address and get weather forecast for 7 days (&days=7)
  getForcastWeather(addressToForecast) {
    var url = this.weatherApiUrl + '&q=' + addressToForecast + '&days=7';
    var weatherApiResponse = this.http.get(url).map(res => res.json());
    return weatherApiResponse;
  }
}

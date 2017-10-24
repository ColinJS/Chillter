import { Injectable } from '@angular/core';
import { StorageService } from './storage';
import { Observable } from 'rxjs/Observable';
import { ConfigService } from './config';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';

@Injectable()
export class CacheService {

  constructor(
    private storage: StorageService,
    private config: ConfigService
  ) { }

  getCache(key: string): Observable<any> {
    return Observable.fromPromise(this.storage.getValuePromise(key))
      .map(res => res.value)
      //.filter(res => !this.config.devMode);
  }

  setCache(key: string, data: {}) {
    this.storage.setValue(key, data);
  }

  addCache(key: string, data: {}) {
    this.storage.addValue(key, data);
  }

  clearCache(key: string) {
    this.storage.removeValue(key);
  }
}

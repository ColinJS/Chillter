import { Injectable } from '@angular/core';
import {
  Http,
  Headers,
  Response,
  ResponseOptions,
  RequestOptionsArgs
} from '@angular/http';
import { StorageService } from './storage';
import { SyncService } from './sync';
import { Observable } from 'rxjs/Rx';

@Injectable()
export class HttpService {
  private headers: Headers = new Headers();

  constructor(
    private http: Http,
    private storage: StorageService,
    private sync: SyncService
  ) {
    this.storage.getValue('token').subscribe(token => {
      this.headers.set('Content-Type', 'application/json');
      this.headers.set('X-Token', token);
    });
  }

  get(url: string, options?: RequestOptionsArgs): Observable<Response> {
    options = options || {};
    options.headers = this.headers;

    if (!this.sync.status) {
      let response: Response = new Response({
        body: false,
        status: 400,
        headers: new Headers(),
        url: url,
        merge: function (responseOptions: ResponseOptions) { return this; }
      });

      return Observable.of(response);
    }

    return this.http.get(url, options);
  }

  post(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    options = options || {};
    options.headers = this.headers;

    let stored = this.sync.stash({
      method: 'post',
      url: url,
      body: body,
      options: options
    });

    if (stored) {
      let response: Response = new Response({
        body: true,
        status: 200,
        headers: new Headers(),
        url: url,
        merge: function (responseOptions: ResponseOptions) { return this; }
      });

      return Observable.of(response);
    }

    return this.http.post(url, body, options);
  }

  put(url: string, body: any, options?: RequestOptionsArgs): Observable<Response> {
    options = options || {};
    options.headers = this.headers;

    let stored = this.sync.stash({
      method: 'put',
      url: url,
      body: body,
      options: options
    });

    if (stored) {
      let response: Response = new Response({
        body: true,
        status: 200,
        headers: new Headers(),
        url: url,
        merge: function (responseOptions: ResponseOptions) { return this; }
      });

      return Observable.of(response);
    }

    return this.http.put(url, body, options);
  }

  delete(url: string, options?: RequestOptionsArgs): Observable<Response> {
    options = options || {};
    options.headers = this.headers;

    let stored = this.sync.stash({
      method: 'delete',
      url: url,
      options: options
    });

    if (stored) {
      let response: Response = new Response({
        body: true,
        status: 200,
        headers: new Headers(),
        url: url,
        merge: function (responseOptions: ResponseOptions) { return this; }
      });

      return Observable.of(response);
    }

    return this.http.delete(url, options);
  }
}

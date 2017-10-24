import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import PouchDB from 'pouchdb';
import * as pouchdbUpsert from 'pouchdb-upsert';

import 'rxjs/add/operator/map';

@Injectable()
export class StorageService {
  private db;

  constructor() {
    this.db = new PouchDB('chillter', { adapter: 'websql' });
    PouchDB.plugin(pouchdbUpsert);
  }

  setValue(key: string, value: any): Promise<any> {
    return this.db.upsert(key, doc => {
      doc.value = value;

      return doc;
    });
  }

  addValue(key: string, value: any): Promise<any> {
    return this.db.upsert(key, doc => {
      doc.value = doc.value || [];
      doc.value.push(value);

      return doc;
    });
  }

  getValue(key: string): Observable<any> {
    return Observable.create(observer => {
      this.db.get(key).then((res) => {
        observer.next(res.value);
      }).catch(() => {
        observer.next(null);
      });

      this.db.changes({ live: true, since: 'now', include_docs: true, doc_ids: [key] }).on('change', change => {
        observer.next(change.doc.value);
      });
    });
  }

  getValuePromise(key: string): Promise<any> {
    return this.db.get(key).then(res => res).catch(error => false);
  }

  removeValue(key: string): { ok: string } {
    return this.db.get(key).then((doc) => {
      return this.db.remove(doc);
    });
  }

}

import { Injectable } from '@angular/core';
import { URLSearchParams } from '@angular/http';
import { Events } from 'ionic-angular';
import { Observable } from 'rxjs/Rx';
import { ConfigService } from './config';
import { StorageService } from './storage';
import { HttpService } from './http';
import { TransferService } from './transfer';
import { CacheService } from './cache';
import { SyncService } from './sync';
import { OneSignal } from '@ionic-native/onesignal';

import { RegisterRequest } from '../interfaces/api/requests/register';
import { LoginRequest } from '../interfaces/api/requests/login';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeAll';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/switchMap';

@Injectable()
export class ApiService {
  private baseUrl: string;
  private chatUrl: string;

  constructor(
    private storage: StorageService,
    private http: HttpService,
    private configService: ConfigService,
    private notif: Events,
    private transfer: TransferService,
    private cache: CacheService,
    private sync: SyncService,
    private oneSignal: OneSignal
  ) {
    this.baseUrl = configService.getApiUrl();
    this.chatUrl = configService.getChatUrl();
  }

  /**
   *
   * Return true if logged in, false if not
   */
  isLoggedIn(): Observable<boolean> {
    return this.storage.getValue('token').map(val => !!val);
  }

  /**
   *
   * Return the profile id: number
   */
  getProfileId(): Observable<any> {
    let id = this.storage.getValue('id')
      .filter(id => id)
      .switchMap(id => {
        return this.http.get(this.baseUrl + '/chillers/' + id)
          .map(res => res.json())
          .filter(res => res)
          .map(res => {
            return id;
          });
      }
      );

    return Observable.merge(id)
      .filter(res => res);
  }

  /**
   *
   * @param body email: string, pass: string
   * Login to account
   */
  login(body: LoginRequest): Observable<boolean> {
    return this.http.post(this.baseUrl + '/login', {
      email: body.email,
      password: body.pass
    })
      .map(res => res.json().token ? res.json() : false)
      .map(res => {
        if (res) {
          this.storage.setValue('id', parseInt(res.id));
          this.storage.setValue('token', res.token);
        }

        if (window.hasOwnProperty('cordova')) {
          this.oneSignal.getIds().then(res => {
            this.registerPush(res.userId).subscribe();
          });
        }

        return res;
      });
  }

  /**
   *
   * Logout the account, clear cache
   */
  logout() {
    this.cache.getCache('CONTACTS').subscribe(
      data => {
        if (data != undefined) {
          this.cache.clearCache('CONTACTS');
          this.cache.clearCache('MERGED_CONTACTS_FRIENDS');
          this.cache.clearCache('CONTACTS_PERMISSIONS');
        }
      }
    )
    this.cache.setCache('CONTACTS_PERMISSION', false)
    this.cache.clearCache('SYNC');
    this.storage.removeValue('id');
    this.storage.removeValue('token');
    this.notif.publish('nav:login');
  }

  /**
   *
   * Return data about current account
   */
  getMyProfile(): Observable<any> {
    const cacheKey: string = 'my_profile';

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id')
      .filter(id => id)
      .switchMap(id => {
        return this.http.get(this.baseUrl + '/chillers/' + id)
          .map(res => res.json())
          .filter(res => res)
          .map(res => {
            this.cache.setCache(cacheKey, res);

            return res;
          });
      }
      );

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param body same data as creating a new chiller
   * Update account informations
   */
  updateMyProfile(body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id, body)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId number
   * @param body array of object contain expense data
   * Add expense to an event
   */
  addExpenses(evtId, body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/expenses', body)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param body object
   * Update account password
   */
  passwordRequest(body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/update_password', body)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param name string
   * When searching for new friends in friend-list (autocomplete of result)
   */
  findUser(name: string): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      let params = new URLSearchParams();

      params.set('name', name);
      params.set('id', id);

      return this.http.get(this.baseUrl + '/chillers', { search: params })
        .map(res => res.json())
        .filter(res => res.id !== id);
    });
  }

  /**
   *
   * @param userId any
   * Add as friend another Chiller by his id
   */
  addFriend(userId: any): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/friends/' + userId, null);
    });
  }

  /**
   *
   * @param userId any
   * @param eventId any
   * Add participant to the event
   */
  addFriendWithEvent(userId: any, eventId: any): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/events/' + eventId + '/participants/' + userId, null)
      /*.map(res => res.json());*/
    });
  }

  /**
   *
   * Return friends, used in friend-list
   */
  getFriends(): Observable<any> {
    const cacheKey: string = 'friends';

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/friends')
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);
          res.map(res => res.have_chillter = true);
          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param friendId string
   * Get account informations, used in chiller-details
   */
  getChiller(friendId): Observable<any> {
    const cacheKey: string = 'chiller_' + friendId;

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/friends/' + friendId)
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param friendId string
   * Get friend event list
   */
  getEventsList(friendId) {
    const cacheKey: string = 'event_list_' + friendId;

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      let params = new URLSearchParams();
      params.set('chiller', friendId);

      return this.http.get(this.baseUrl + '/chillers/' + id + '/events', { search: params })
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   * Get pending friends
   */
  getPendingFriends(): Observable<any> {
    const cacheKey: string = 'pending_friends';

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      let params = new URLSearchParams();
      params.set('pending', 'yes');

      return this.http.get(this.baseUrl + '/chillers/' + id + '/friends', { search: params })
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param friendId string
   * Accept a friend
   */
  acceptFriend(friendId: string): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/friends/' + friendId, null)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param friendId string
   * Delete a friend
   */
  deleteFriend(friendId: string): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.delete(this.baseUrl + '/chillers/' + id + '/friends/' + friendId)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param friendId string
   * Block a friend is choosen
   */
  blockFriend(friendId: string): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/friends/' + friendId + '/block', null)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param ind number
   * @param eventId any
   * Answer if participate to an event or not
   */
  participateEvent(ind: number, eventId: any): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/events/' + eventId + '/participate', { status: ind })
        .map(res => res.json());
    });
  }

  /**
   * Get all events, used in chill-box
   */
  getEvents(): Observable<any> {
    const cacheKey: string = 'events';

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/events')
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param eventId string
   * Cancel an event, only creator of the event can do this
   */
  cancelEvent(eventId: string): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/events/' + eventId + '/cancel', null)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param eventId string
   * Hide an event, the chiller that participate to a cancelled event can hide the event from there chillbox
   */
  hideEvent(eventId: string): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/events/' + eventId + '/hide', null)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param eventId string
   * @param body object
   * Update event informations
   */
  updateEvent(eventId, body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/events/' + eventId, body)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param eventId string
   * Get event informations
   */
  getEvent(eventId): Observable<any> {
    const cacheKey: string = 'event_' + eventId;

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/events/' + eventId)
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          if (res.chillerid == id) {
            res.mine = true;
          } else {
            res.mine = false;
          }

          return res;
        })
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param evtId string
   * Get saved car of this event
   */
  getCar(evtId): Observable<any> {
    const cacheKey: string = 'car_' + evtId;

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/cars')
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param evtId string
   * Get saved elements in the list of this event
   */
  getList(evtId): Observable<any> {
    const cacheKey: string = 'list_' + evtId;

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/elements')
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param evtId string
   * Get saved expenses of this event
   */
  getExps(evtId): Observable<any> {
    const cacheKey: string = 'expenses_' + evtId;

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/expenses')
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param evtId string
   * @param body object
   * Add car to the event, body is {seats: number}
   */
  addCar(evtId, body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/cars', body)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId string
   * @param carId string
   * Delete a car from an event, only the creator of the car can do it
   */
  deleteCar(evtId, carId): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.delete(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/cars/' + carId)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId string
   * @param carId string
   * Add the chiller as passenger is the choosen car. Only if the account is not already a driver. If in another car as passengers, the chiller is changed of car
   */
  addPassenger(evtId, carId): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/cars/' + carId + '/get_in', null)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId string
   * @param carId string
   * Only the chiller as passenger can remove himself from passenger
   */
  deletePassenger(evtId, carId): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/cars/' + carId + '/get_out', null)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId string
   * @param body string
   * Add an element to the list of an event
   */
  addElement(evtId, body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/elements', body)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId string
   * @param elemId string
   * Remove an element from the list of an event, only the creator of the element can remove it
   */
  deleteElement(evtId, elemId): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.delete(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/elements/' + elemId)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId string
   * @param elemId string
   * Say 'I bring this element to the event' by tap on it. Only if nobody already bring it.
   */
  takeElement(evtId, elemId): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/elements/' + elemId + '/take', null)
        .map(res => res.json());
    });

  }

  /**
   *
   * @param evtId string
   * @param expId string
   * Delete an expense from the event, only the creator of the expense can do it
   */
  deleteExpense(evtId, expId): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.delete(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/expenses/' + expId)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId string
   * @param elemId string
   * Say 'I bring this element, but not anymore', only the chiller choose to bring an element can leave an element
   */
  leaveElement(evtId, elemId): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.put(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/elements/' + elemId + '/leave', null)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param evtId string
   * @param body string
   * Add an expense to the event
   */
  addExpense(evtId, body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/events/' + evtId + '/expenses', body)
        .map(res => res.json());
    });
  }

  /**
   *
   * @param eventId string
   * @param friendId string
   * Delete a chiller from the event, only the creator of the event can do it
   */
  deleteFriendFromEvent(eventId: any, friendId: any): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.delete(this.baseUrl + '/chillers/' + id + '/events/' + eventId + '/participants/' + friendId)
        .map(res => res.json())
        .filter(res => res);
    });
  }

  /**
   * Get all chills, used in chill-list
   */
  getAllChills(): Observable<any> {
    const cacheKey: string = 'all_chills';

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.http.get(this.baseUrl + '/chills')
      .map(res => res.json())
      .filter(res => res)
      .map(res => {
        this.cache.setCache(cacheKey, res);

        return res;
      });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param body register interface
   * Create an account
   */
  signUp(body: RegisterRequest): Observable<any> {
    return this.http.post(this.baseUrl + '/chillers', body)
      .map(res => res.json())
      .switchMap(() => this.login({ email: body.info.email, pass: body.info.pass }));
  }

  /**
   *
   * @param pushToken string
   * Save the pushtoken in db, used to send notification to particular chiller
   */
  registerPush(pushToken: string): Observable<any> {
    return this.storage.getValue('id')
      .filter(id => id)
      .switchMap(id => {
        return this.http.put(this.baseUrl + '/chillers/' + id + '/notification_token', {
          notification_token: pushToken
        }
        );
      });
  }

  /**
   * Get all chill in Homepage, used in home
   */
  getHome(): Observable<any> {
    const cacheKey: string = 'home';

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id')
      .filter(id => id)
      .switchMap(id => {
        return this.http.get(this.baseUrl + '/chillers/' + id + '/home')
          .map(res => res.json())
          .filter(res => res)
          .map(res => {
            this.cache.setCache(cacheKey, res);

            return res;
          });
      });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param id string
   * @param type string
   * Add a chill to the Homepage
   */
  addChill(id, type): Observable<any> {
    return this.storage.getValue('id').switchMap(userId => {
      return this.http.post(this.baseUrl + '/chillers/' + userId + '/home', { "insert": [{ "id": id, "type": type }] })
        .map(res => res.json());
    });
  }

  /**
   *
   * @param id string
   * Delete a chill from the Homepage
   */
  deleteChill(id): Observable<any> {
    return this.storage.getValue('id').switchMap(userId => {
      return this.http.post(this.baseUrl + '/chillers/' + userId + '/home', { "delete": [{ "id": id }] });
    });
  }

  /**
   *
   * @param id string
   * @param position string
   * Move a chill on the Homepage, position is the new position of the chill, id is the moved chill
   */
  moveChill(id, position): Observable<any> {
    return this.storage.getValue('id').switchMap(userId => {
      return this.http.post(this.baseUrl + '/chillers/' + userId + '/home', { "move": [{ "id": id, "pos": position }] })
    });
  }

  /**
   *
   * @param id string
   * Get chill information when editing
   */
  getChill(id): Observable<any> {
    const cacheKey: string = 'chill_' + id;

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.http.get(this.baseUrl + '/chills/' + id)
      .map(res => res.json())
      .filter(res => res)
      .map(res => {
        this.cache.setCache(cacheKey, res);

        return res;
      });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param body object
   * Create an event
   */
  sendInvitation(body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      body.event.chillerId = id;

      return this.http.post(this.baseUrl + '/chillers/' + id + '/events', body);
    });
  }

  /**
   *
   * @param body object
   * Create a custom chill (from chillist)
   */
  createChill(body: { name: string, address: string }): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/custom_chills', body);
    });
  }

  /**
   * Get all custom chills, used in chilllist
   */
  getCustomChills(): Observable<any> {
    const cacheKey: string = 'my_custom';

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/custom_chills')
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param customChillId string
   * Get details of a custom chill
   */
  getCustomChill(customChillId): Observable<any> {
    const cacheKey: string = 'my_custom';

    let cacheStream = this.cache.getCache(cacheKey);

    let webStream = this.storage.getValue('id').switchMap(id => {
      return this.http.get(this.baseUrl + '/chillers/' + id + '/custom_chills/' + customChillId)
        .map(res => res.json())
        .filter(res => res)
        .map(res => {
          this.cache.setCache(cacheKey, res);

          return res;
        });
    });

    return Observable.merge(cacheStream, webStream)
      .filter(res => res);
  }

  /**
   *
   * @param file
   * @param loader
   */
  sendPicture(file, loader): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      const url = this.baseUrl + '/chillers/' + id + '/photos';

      const fileExtension = file.substr(file.lastIndexOf('.') + 1);
      const firstDirectory = file.substr(0, file.indexOf('/'));

      file = (fileExtension == 'svg' || firstDirectory == 'images') ? null : file;

      if (!loader.file) {
        return this.http.post(url, {}, []);
      }

      const uri = encodeURI(url + '?crop=' + JSON.stringify(loader.getCropInfo()));
      return Observable.fromPromise(this.transfer.upload(file, uri))
        .map(res => JSON.parse(res.response));
    });
  }

  /**
   *
   * @param file
   * @param loader
   * @param cId
   * @param logo
   */
  sendChillterPicture(file, loader, cId, logo): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      const url = this.baseUrl + '/chillers/' + id + '/events' + cId + '/logo';

      const fileExtension = file.substr(file.lastIndexOf('.') + 1);
      const firstDirectory = file.substr(0, file.indexOf('/'));

      let params = new URLSearchParams();
      params.set('crop', JSON.stringify(loader.getCropInfo()));
      params.set('chill', logo);

      file = (fileExtension == 'svg' || firstDirectory == 'images') ? null : file;

      if (!loader.file) {
        return this.http.post(url, {}, params);
      }

      const uri = encodeURI(url + '?crop=' + JSON.stringify(loader.getCropInfo() + '&chill=' + logo));

      return Observable.fromPromise(this.transfer.upload(file, uri))
        .map(res => JSON.parse(res.response));
    });
  }

  /**
   *
   * @param file
   * @param loader
   * @param cId
   * @param category
   */
  sendBanner(file, loader, cId, category): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      const url = this.baseUrl + '/chillers/' + id + '/events' + cId + '/banners';

      const fileExtension = file.substr(file.lastIndexOf('.') + 1);
      const firstDirectory = file.substr(0, file.indexOf('/'));

      let params = new URLSearchParams();
      params.set('crop', JSON.stringify(loader.getCropInfo()));
      params.set('cat', category);

      file = (fileExtension == 'svg' || firstDirectory == 'images') ? null : file;

      if (!loader.file) {
        return this.http.post(url, {}, params);
      }

      const uri = encodeURI(url + '?crop=' + JSON.stringify(loader.getCropInfo()) + '&chill=' + category);

      return Observable.fromPromise(this.transfer.upload(file, uri))
        .map(res => JSON.parse(res.response));
    });
  }

  /**
   *
   * @param eventId
   * @param file
   * @param loader
   */
  updateLogo(eventId, file, loader): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      const url = this.baseUrl + '/chillers/' + id + '/events/' + eventId + '/logo';

      const fileExtension = file.substr(file.lastIndexOf('.') + 1);
      const firstDirectory = file.substr(0, file.indexOf('/'));

      file = (fileExtension == 'svg' || firstDirectory == 'images') ? null : file;

      if (!loader.file) {
        return this.http.post(url, {}, []);
      }

      const uri = encodeURI(url + '?crop=' + JSON.stringify(loader.getCropInfo()));

      return Observable.fromPromise(this.transfer.upload(file, uri))
        .map(res => JSON.parse(res.response));
    });
  }

  /**
   *
   * @param eventId
   * @param file
   * @param loader
   */
  updateBanner(eventId, file, loader): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      const url = this.baseUrl + '/chillers/' + id + '/events/' + eventId + '/banner';

      const fileExtension = file.substr(file.lastIndexOf('.') + 1);
      const firstDirectory = file.substr(0, file.indexOf('/'));

      file = (fileExtension == 'svg' || firstDirectory == 'images') ? null : file;

      if (!loader.file) {
        return this.http.post(url, {}, []);
      }

      const uri = encodeURI(url + '?crop=' + JSON.stringify(loader.getCropInfo()));

      return Observable.fromPromise(this.transfer.upload(file, uri))
        .map(res => JSON.parse(res.response));
    });
  }

  /**
   *
   * @param customChillId string
   * @param file object
   * @param loader object
   * Upload a logo for a custom chill
   */
  updateLogoCustom(customChillId, file, loader): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      const url = this.baseUrl + '/chillers/' + id + '/custom_chills/' + customChillId + '/logo';

      const fileExtension = file.substr(file.lastIndexOf('.') + 1);
      const firstDirectory = file.substr(0, file.indexOf('/'));

      file = (fileExtension == 'svg' || firstDirectory == 'images') ? null : file;

      if (!loader.file) {
        return this.http.post(url, {}, []);
      }

      const uri = encodeURI(url + '?crop=' + JSON.stringify(loader.getCropInfo()));

      return Observable.fromPromise(this.transfer.upload(file, uri))
        .map(res => JSON.parse(res.response));
    });
  }

  /**
   *
   * @param customChillId string
   * @param file object
   * @param loader object
   * Upload a banner for a custom chill
   */
  updateBannerCustom(customChillId, file, loader): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      const url = this.baseUrl + '/chillers/' + id + '/custom_chills/' + customChillId + '/banner';

      const fileExtension = file.substr(file.lastIndexOf('.') + 1);
      const firstDirectory = file.substr(0, file.indexOf('/'));

      file = (fileExtension == 'svg' || firstDirectory == 'images') ? null : file;

      if (!loader.file) {
        return this.http.post(url, {}, []);
      }

      const uri = encodeURI(url + '?crop=' + JSON.stringify(loader.getCropInfo()));

      return Observable.fromPromise(this.transfer.upload(file, uri))
        .map(res => JSON.parse(res.response));
    });
  }

  /**
   *
   * @param eventId string
   * Get corresponding url to connect to the ws
   */
  getChatConn(eventId) {
    return this.chatUrl + '/events/' + eventId;
  }

  /**
   *
   * @param body object
   * Upload phone book, used for contacts
   */
  uploadPhotoBook(body): Observable<any> {
    return this.storage.getValue('id').switchMap(id => {
      return this.http.post(this.baseUrl + '/chillers/' + id + '/phone_book', body)
        .map(res => res.json());
    });
  }
}

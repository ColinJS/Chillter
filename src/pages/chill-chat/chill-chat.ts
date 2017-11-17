import { Component, ViewChild } from '@angular/core';
import {
  NavController,
  ViewController,
  NavParams,
  Content,
  Platform
} from 'ionic-angular';
import {
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { Keyboard } from 'ionic-native';
import { StorageService } from '../../providers/storage';
import { ConfigService } from '../../providers/config';
import { ApiService } from '../../providers/api';

@Component({
  selector: 'page-chill-chat',
  templateUrl: 'chill-chat.html'
})

export class ChillChatPage {
  @ViewChild(Content) content: Content;
  private form: FormGroup;
  private myId = null;
  private myToken = null;

  conn: any;
  gettedMessages: any;
  messages: any[] = undefined;

  connClosed: boolean = false;
  reloadingChat: boolean = false;
  eventName: string;

  constructor(
    private navCtrl: NavController,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private formBuilder: FormBuilder,
    private storage: StorageService,
    private api: ApiService,
    private config: ConfigService,
    public plt: Platform
  ) {
    this.plt.pause.subscribe(() => {
      this.conn.close();
    });

    this.plt.resume.subscribe(() => {
      this.getConversation();
    });

    Keyboard.onKeyboardShow().subscribe(() => {
      setTimeout(() => { this.content.scrollToBottom(100) }, 100);
    });

    Keyboard.onKeyboardHide().subscribe(() => {
      setTimeout(() => { this.content.scrollToBottom(100) }, 100);
    })

    this.form = formBuilder.group({
      message: ['', Validators.compose([Validators.required])]
    });

    // Fix keyboard overlapping inputs
    if (plt.is('ios')) {
      let 
        appEl = <HTMLElement>(document.getElementsByTagName('ION-APP')[0]),
        appElHeight = appEl.clientHeight;
    
      window.addEventListener('native.keyboardshow', (e) => {
        appEl.style.height = (appElHeight - (<any>e).keyboardHeight) + 'px';
      });
    
      window.addEventListener('native.keyboardhide', () => {
        appEl.style.height = '100%';
      });
    }
  }

  ionViewDidEnter() {
    this.eventName = this.navParams.get("eventName");
    this.storage.getValue("id").subscribe(
      id => {
        if (id) {
          this.myId = id;
          this.getConversation();
        }
      }
    );
  }

  getConversation() {
    const that = this;
    const eventId = that.navParams.get("eventId");
    const url = that.api.getChatConn(eventId);

    that.storage.getValue('token').subscribe(
      token => {
        if (token) {
          that.myToken = token;
          that.conn = new WebSocket(url, encodeURIComponent("Bearer " + that.myToken));

          that.conn.onclose = function () {
            that.reloadingChat = false;
            that.connClosed = true;
          };

          that.conn.onmessage = function (e) {
            this.reloadingChat = false;
            this.connClosed = false;
            that.gettedMessages = JSON.parse(e.data);

            that.getMessages();
          };
        }
      }
    );
  }

  getMessages() {
    setTimeout(() => { this.content.scrollToBottom(150) }, 1);
    if (this.messages == undefined) {
      this.reloadingChat = false;
      this.connClosed = false;
      this.messages = this.gettedMessages;
    } else {
      this.reloadingChat = false;
      this.connClosed = false;
      this.messages.push(this.gettedMessages);
    }
  }

  reloadChat() {
    this.reloadingChat = true;
    this.getConversation();
  }

  onSubmit() {
    if (this.form.valid) {
      this.conn.send(this.form.value.message);
      this.form.reset();
      setTimeout(() => { this.content.scrollToBottom(150) }, 100);
    }
  }

  ionViewDidLeave() {
    this.conn.close();
  }

}

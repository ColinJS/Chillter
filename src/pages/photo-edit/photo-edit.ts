import { Component, ViewChild } from '@angular/core';
import {
  NavController,
  NavParams,
  ViewController
} from 'ionic-angular';
import {
  ImageCropperComponent,
  CropperSettings
} from 'ng2-img-cropper';

@Component({
  selector: 'page-photo-edit',
  templateUrl: 'photo-edit.html'
})
export class PhotoEditPage {
  @ViewChild('cropper', undefined) cropper: ImageCropperComponent;

  data: any = {};
  image: HTMLImageElement;
  cropperSettings: CropperSettings;
  substractWidth: number;
  substractHeight: number;

  constructor(
    private navCtrl: NavController,
    private navParams: NavParams,
    private viewCtrl: ViewController
  ) {
    let round = this.navParams.get('round') !== undefined;

    // If iPad (or tablet) screen size point = 768x1004 apply substract to img cropper canvas, else apply regular substract
    if (window.innerWidth == 768 && window.innerHeight == 1004) {
      this.substractWidth = 168;
      this.substractHeight = 470;
    } else {
      this.substractWidth = 0;
      this.substractHeight = 200;
    }

    this.cropperSettings = new CropperSettings();
    this.cropperSettings.width = 500;
    this.cropperSettings.height = round ? 500 : 300;
    this.cropperSettings.croppedWidth = 500;
    this.cropperSettings.croppedHeight = round ? 500 : 300;
    this.cropperSettings.canvasWidth = window.innerWidth - this.substractWidth;
    this.cropperSettings.canvasHeight = window.innerHeight - this.substractHeight;
    this.cropperSettings.noFileInput = true;
    this.cropperSettings.touchRadius = 30;
    this.cropperSettings.rounded = round;
    this.cropperSettings.cropperDrawSettings.strokeWidth = 2;

    this.image = new Image();
    this.image.src = this.navParams.get('data');
  }

  ionViewDidEnter() {
    this.cropper.setImage(this.image);
  }

  close() {
    this.viewCtrl.dismiss(this.data.image);
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }
}

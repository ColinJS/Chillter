import { Component, ViewChild, ElementRef, Input } from '@angular/core';
import { ActionSheetController } from 'ionic-angular';
import { Camera, CameraOptions } from 'ionic-native';
import { TranslateService } from 'ng2-translate';
import { ImgPickerService } from '../../providers/img-picker'

@Component({
  selector: 'img-picker-banner',
  templateUrl: 'img-picker-banner.html'
})
export class ImgPickerBanner {
  private transaltions: any;
  picture: string;
  firstSrc: string;

  @Input("src") definedSrc: string;
  @ViewChild('imgSrc') imgSrc: ElementRef;

  imageOptions: CameraOptions = {
    quality: 100,
    destinationType: Camera.DestinationType.DATA_URL,
    mediaType: Camera.MediaType.PICTURE,
    allowEdit: true,
    encodingType: Camera.EncodingType.JPEG,
    saveToPhotoAlbum: false,
    correctOrientation: true
  };

  constructor(
    private actionSheetCtrl: ActionSheetController,
    private translate: TranslateService,
    private imgPickerService: ImgPickerService
  ) {
    translate.get(['img-loader.get-picture',
      'img-loader.take-picture',
      'img-loader.picture',
      'global.cancel']).subscribe(value => this.transaltions = value);
  }

  ngAfterViewInit() {
    this.firstSrc = this.imgSrc.nativeElement.currentSrc;
    !this.firstSrc ? this.picture = "assets/images/blank.png" : null;
    this.imgPickerService.setFirstImgSrcBanner(undefined);
    this.imgPickerService.setImgResultBanner(undefined);
  }

  ngOnChanges(evt) {
    !evt.definedSrc.currentValue ? this.imgPickerService.setFirstImgSrcBanner("") : null;
    evt.definedSrc.currentValue ? this.picture = evt.definedSrc.currentValue : this.picture = "assets/images/blank.png";
  }

  chooseActions() {
    let actionSheet = this.actionSheetCtrl.create({
      title: this.transaltions['img-loader.picture'],
      buttons: [
        {
          text: this.transaltions['img-loader.take-picture'],
          handler: () => {
            this.takePicture();
          }
        }, {
          text: this.transaltions['img-loader.get-picture'],
          handler: () => {
            this.getPicture();
          }
        }, {
          text: this.transaltions['global.cancel'],
          role: 'cancel'
        }
      ]
    });

    actionSheet.present();
  }

  /**
   * Take picture from camera
   */
  takePicture() {
    this.imageOptions.sourceType = Camera.PictureSourceType.CAMERA;

    Camera.getPicture(this.imageOptions).then(
      (imageData) => {
        this.picture = 'data:image/jpeg;base64,' + imageData.replace(/(\r\n|\n|\r)/gm, "");
        this.imgPickerService.setFirstImgSrcBanner(this.firstSrc);
        this.imgPickerService.setImgResultBanner(this.picture);
      },
      (err) => { console.error(err) });
  }

  /**
   * Get picture from photo library
   */
  getPicture() {
    this.imageOptions.sourceType = Camera.PictureSourceType.PHOTOLIBRARY;

    Camera.getPicture(this.imageOptions).then(
      (imageData) => {
        this.picture = 'data:image/jpeg;base64,' + imageData.replace(/(\r\n|\n|\r)/gm, "");
        this.imgPickerService.setFirstImgSrcBanner(this.firstSrc);
        this.imgPickerService.setImgResultBanner(this.picture);
      },
      (err) => { console.error(err) });
  }

}


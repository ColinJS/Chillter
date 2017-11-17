import { Injectable } from '@angular/core';

@Injectable()
export class ImgPickerService {
  imgResultLogo: string;
  firstSrcLogo: string;

  imgResultBanner: string;
  firstSrcBanner: string;

  constructor(

  ) {

  }

  // Store the image result from img-picker-logo component for logo, profile picture
  setImgResultLogo(base64) {
    this.imgResultLogo = base64;
  }

  // Return the base64 result of logo, profile picture
  getImgResultLogo() {
    return this.imgResultLogo;
  }

  // Store the first image src to avoid sending while the image not changed, for logo, profile picture
  setFirstImgSrcLogo(firstSrc) {
    this.firstSrcLogo = firstSrc;
  }

  // Return the first image src of logo, profile picture
  getFirstImgSrcLogo() {
    return this.firstSrcLogo;
  }

  // Store the image result from img-picker-banner component for banner
  setImgResultBanner(base64) {
    this.imgResultBanner = base64;
  }

  // Return the base64 result of banner
  getImgResultBanner() {
    return this.imgResultBanner;
  }

  // Store the first image src to avoid sending while the image not changed, for banner
  setFirstImgSrcBanner(firstSrc) {
    this.firstSrcBanner = firstSrc;
  }

  // Return the first image src of banner
  getFirstImgSrcBanner() {
    return this.firstSrcBanner;
  }
}

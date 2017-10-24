import { Injectable } from '@angular/core';
import {
  Transfer,
  FileUploadOptions,
  FileUploadResult
} from 'ionic-native';
import { StorageService } from './storage';

@Injectable()
export class TransferService {
  private options: FileUploadOptions;

  constructor(
    private storage: StorageService
  ) {
    this.storage.getValue('token').subscribe(token => {
      this.options = {
        fileKey: 'photo',
        headers: {
          'X-Token': token
        },
        chunkedMode: false
      };
    });
  }

  upload(fileUrl: string, url: string): Promise<FileUploadResult> {
    if (fileUrl && url) {
      let transfer = new Transfer();

      return transfer.upload(fileUrl, url, this.options, false);
    }
  }
}

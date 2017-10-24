import {
  Directive,
  ElementRef
} from '@angular/core';
import ImgCache from 'imgcache.js';

@Directive({
  selector: '[image-cache]'
})
export class ImageCacheDirective {
  constructor(
    private el: ElementRef
  ) { }

  ngOnInit() {
    ImgCache.isCached(this.el.nativeElement.src, (path: string, success: any) => {
      if (success) {
        ImgCache.useCachedFile(this.el.nativeElement);
      } else {
        ImgCache.cacheFile(this.el.nativeElement.src, () => { });
      }
    });
  }
}

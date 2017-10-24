import {
  Animation,
  PageTransition
} from 'ionic-angular';

export class CustomModalEnterTransition extends PageTransition {

  public init() {
    const ele = this.enteringView.pageRef().nativeElement;
    const wrapper = new Animation(this.plt, ele.querySelector('.modal-wrapper'));

    wrapper.beforeStyles({ 'transform': 'scale(0)', 'opacity': 1 });
    wrapper.fromTo('transform', 'translate(-500px)', 'translate(0px)');
    wrapper.fromTo('opacity', 0.1, 1);

    this
      .element(this.enteringView.pageRef())
      .duration(500)
      .easing('cubic-bezier(.1, .7, .1, 1)')
      .add(wrapper);
  }
}

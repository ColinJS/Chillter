import {
  Animation,
  PageTransition
} from 'ionic-angular';

export class CustomModalLeaveTransition extends PageTransition {

  public init() {
    const ele = this.leavingView.pageRef().nativeElement;
    const wrapper = new Animation(this.plt, ele.querySelector('.modal-wrapper'));
    const contentWrapper = new Animation(this.plt, ele.querySelector('.wrapper'));

    wrapper.beforeStyles({ 'transform': 'scale(1)', 'opacity': 1 });
    wrapper.fromTo('transform', 'translate(0px)', 'translate(-500px)');
    wrapper.fromTo('opacity', 1, 0);

    this
      .element(this.leavingView.pageRef())
      .duration(700)
      .easing('cubic-bezier(.1, .7, .1, 1)')
      .add(contentWrapper)
      .add(wrapper);
  }
}

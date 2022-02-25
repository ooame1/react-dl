import { Component, Children, cloneElement, RefCallback } from 'react';
import { Size } from '../types';

type Props = {
  onResize?: (newSize: Size, oldSize: Size) => void;
};

class Resizable extends Component<Props> {
  element!: HTMLDivElement;

  lastSize!: Size;

  resizeObserver!: ResizeObserver;

  componentDidMount() {
    if(!this.element) {
      return;
    }
    this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const { onResize } = this.props;
      const { contentRect: {width, height} } = entries[0];
      onResize?.({width, height}, this.lastSize);
    });
    this.resizeObserver.observe(this.element);
  }

  componentWillUnmount() {
    this.resizeObserver?.disconnect();
  }

  handleRef: RefCallback<HTMLDivElement> = (element) => {
    this.element = element!;
    const { ref } = this.getChild();
    if(typeof ref === 'function') {
      ref(element);
    } else if(typeof ref === 'object') {
      ref.current = element;
    }
  }

  getChild() {
    return Children.only(this.props.children) as any;
  }

  render() {
    const newChild = cloneElement(this.getChild(), {
      ref: this.handleRef,
    });
    return newChild;
  }
}

export default Resizable;

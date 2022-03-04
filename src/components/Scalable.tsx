import React, { Children, cloneElement, RefCallback } from 'react';
import { RequiredLayout, Size } from '../types';
import { scaleLayout } from '../utils';

type Props = {
  baseLayout: RequiredLayout;
  onContainerShapeChange: (containerShape: Size) => void;
  onLayoutChange: (layout: RequiredLayout) => void;
};

class Resizable extends React.Component<Props> {
  element!: HTMLDivElement;

  resizeObserver!: ResizeObserver;

  componentDidMount() {
    if (!this.element) {
      return;
    }
    this.resizeObserver = new ResizeObserver(this.handleScale);
    this.resizeObserver.observe(this.element);
  }

  componentWillUnmount() {
    this.resizeObserver?.disconnect();
  }

  handleRef: RefCallback<HTMLDivElement> = (element) => {
    this.element = element!;
    const { ref } = this.getChild();
    if (typeof ref === 'function') {
      ref(element);
    } else if (typeof ref === 'object') {
      ref.current = element;
    }
  };

  handleScale: ResizeObserverCallback = (entries) => {
    const { baseLayout, onLayoutChange, onContainerShapeChange } = this.props;
    const {
      contentRect: { width, height },
    } = entries[0];
    const { width: lastWidth, height: lastHeight } = baseLayout;
    if (width === lastWidth && height === lastHeight) {
      return;
    }
    const [newLayout] = scaleLayout(baseLayout, {
      width: width - lastWidth,
      height: height - lastHeight,
    });
    onLayoutChange(newLayout);
    onContainerShapeChange({
      width: newLayout.width,
      height: newLayout.height,
    });
  };

  getChild() {
    return Children.only(this.props.children) as any;
  }

  render() {
    return cloneElement(this.getChild(), {
      ref: this.handleRef,
    });
  }
}

export default Resizable;

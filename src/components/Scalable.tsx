import React, { Children, cloneElement, RefCallback } from 'react';
import { RequiredLayout, Size, ScaleDetail, OptionHandler } from '../types';
import { applyScale } from '../utils';

type Props = {
  layout: RequiredLayout;
  baseLayout: RequiredLayout;
  onContainerShapeChange: (containerShape: Size) => void;
  onLayoutChange: (layout: RequiredLayout) => void;
  onScale?: OptionHandler<ScaleDetail>;
};

class Scalable extends React.Component<Props> {
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
    const { layout, baseLayout, onLayoutChange, onContainerShapeChange, onScale } = this.props;
    const { contentRect } = entries[0];
    const scaleDetail: ScaleDetail = {
      layout,
      baseLayout,
      size: {
        width: contentRect.width,
        height: contentRect.height,
      },
      oldSize: {
        width: baseLayout.width,
        height: baseLayout.height,
      },
    };
    const newLayout = applyScale(scaleDetail);
    onLayoutChange(newLayout);
    onContainerShapeChange({
      width: newLayout.width,
      height: newLayout.height,
    });
    onScale?.(newLayout, layout, scaleDetail);
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

export default Scalable;

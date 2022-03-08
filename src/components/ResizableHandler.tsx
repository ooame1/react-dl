import React, { cloneElement, MouseEventHandler } from 'react';
import { MousePosition } from '../types';

type Props = {
  onResize: (mouse: MousePosition, startMouse: MousePosition) => void;
  onResizeEnd: (mouse: MousePosition, startMouse: MousePosition) => void;
  onResizeStart: (mouse: MousePosition) => void;
  bodyClassNameWhenResizing: string;
};

type State = {};

class ResizableHandler extends React.Component<Props, State> {
  ownDocument!: Document;

  startMouse!: MousePosition;

  handleMouseDown: MouseEventHandler = (e) => {
    this.ownDocument = e.currentTarget.ownerDocument;
    this.ownDocument.addEventListener('mousemove', this.handleMouseMove);
    this.ownDocument.addEventListener('mouseup', this.handleMouseUp);
    this.ownDocument.body.classList.add(...this.props.bodyClassNameWhenResizing.split(' '));
    this.startMouse = {
      x: e.clientX,
      y: e.clientY,
    };
    this.props.onResizeStart(this.startMouse);
  };

  handleMouseMove = (e: MouseEvent) => {
    this.props.onResize({
      x: e.clientX,
      y: e.clientY,
    }, this.startMouse);
  };

  handleMouseUp = (e: MouseEvent) => {
    this.ownDocument.removeEventListener('mousemove', this.handleMouseMove);
    this.ownDocument.removeEventListener('mouseup', this.handleMouseUp);
    this.ownDocument.body.classList.remove(...this.props.bodyClassNameWhenResizing.split(' '));
    this.props.onResizeEnd({
      x: e.clientX,
      y: e.clientY,
    }, this.startMouse);
    this.startMouse = null!;
  };

  child() {
    return React.Children.only(this.props.children) as any;
  }

  render() {
    const child = this.child();
    return cloneElement(child, {
      onMouseDown: this.handleMouseDown,
    });
  }
}

export default ResizableHandler;

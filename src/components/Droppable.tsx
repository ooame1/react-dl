import React, { CSSProperties, DragEventHandler } from 'react';
import { DRAG_DATA_KEY } from '../constants';

type Props = {
  style?: CSSProperties;
};

type State = {};

class Droppable extends React.Component<Props, State> {

  // eslint-disable-next-line class-methods-use-this
  handleDragEnter: DragEventHandler = (e) => {
    // console.log(e);
  }

  // eslint-disable-next-line class-methods-use-this
  handleDragOver: DragEventHandler = (e) => {
    // console.log(e);
    e.preventDefault();
  };

  // eslint-disable-next-line class-methods-use-this
  handleDrop: DragEventHandler = (e) => {
    console.log(e.dataTransfer.getData(DRAG_DATA_KEY));
  }

  render() {
    const child = React.Children.only(this.props.children as any);
    return React.cloneElement(child, {
      style: {
        ...child.props.style,
        ...this.props.style,
      },
      onDragOver: this.handleDragOver,
      onDragEnter: this.handleDragEnter,
      onDrop: this.handleDrop,
    });
  }
}

export default Droppable;

import React, { CSSProperties, DragEventHandler } from 'react';
import { DRAG_DATA_KEY } from '../constants';
import { dragItem, noop } from '../utils';
import { RequiredLayout, Position } from '../types';

type Props = {
  style?: CSSProperties;
  position?: Position;
  layout: RequiredLayout;
  onLayoutChange: (layout: RequiredLayout) => void;
  onBaseLayoutChange: (layout: RequiredLayout) => void;
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
    let draggedItem: any;
    try {
      draggedItem = JSON.parse(e.dataTransfer.getData(DRAG_DATA_KEY));
    } catch {
      noop();
    }
    if (!draggedItem?.key) {
      return;
    }
    const { position, layout, onLayoutChange, onBaseLayoutChange } = this.props;
    if (!position) {
      return;
    }
    const newLayout = dragItem(layout, draggedItem, position.key, 'right');
    onLayoutChange(newLayout);
    onBaseLayoutChange(newLayout);
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

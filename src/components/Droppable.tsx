import React, { CSSProperties, DragEventHandler } from 'react';
import {
  RequiredLayout,
  Position,
  DragDirection,
  DragDetail,
  RequiredItem,
  OptionHandler,
} from '../types';
import { applyDrag, convertLayoutToFatherLayoutMap } from '../utils';
import { DraggingData } from './Draggable';

type Props = {
  style?: CSSProperties;
  position?: Position;
  layout: RequiredLayout;
  baseLayout: RequiredLayout;
  onLayoutChange: (layout: RequiredLayout) => void;
  onBaseLayoutChange: (layout: RequiredLayout) => void;
  onDrag?: OptionHandler<DragDetail>;
};

type State = {
  dragDirection: DragDirection | null;
};

class Droppable extends React.PureComponent<Props, State> {
  state: State = {
    dragDirection: null,
  };

  handleDragLeave: DragEventHandler = (e) => {
    this.setState({
      dragDirection: null,
    });
  };

  handleDragOver: DragEventHandler = (e) => {
    const { position } = this.props;
    const draggedItem = DraggingData.item;
    if (draggedItem && position) {
      e.preventDefault();
    }
    if (!draggedItem || !position || draggedItem.key === position.key) {
      this.setState({
        dragDirection: null,
      });
      return;
    }
    let dragDirection: DragDirection = 'center';
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const { clientX, clientY } = e;
    if (clientY - top < height / 6) {
      dragDirection = 'top';
    } else if (left + width - clientX < width / 6) {
      dragDirection = 'right';
    } else if (top + height - clientY < height / 6) {
      dragDirection = 'bottom';
    } else if (clientX - left < width / 6) {
      dragDirection = 'left';
    }
    this.setState({
      dragDirection,
    });
  };

  handleDrop: DragEventHandler = (e) => {
    const { position, layout, baseLayout, onLayoutChange, onBaseLayoutChange, onDrag } = this.props;
    const { dragDirection } = this.state;
    const draggedItem = DraggingData.item;
    if (!position || !draggedItem || !dragDirection) {
      return;
    }
    const fatherLayoutMap = convertLayoutToFatherLayoutMap(layout);
    const targetItem = fatherLayoutMap.get(position.key)!.children.find(c => c.key === position.key)! as RequiredItem;
    const dragDetail: DragDetail = {
      layout,
      baseLayout,
      draggedItem,
      targetItem,
      dragDirection,
      event: e.nativeEvent,
    };
    const newLayout = applyDrag(dragDetail);
    onLayoutChange(newLayout);
    onBaseLayoutChange(newLayout);
    this.setState({
      dragDirection: null,
    });
    onDrag?.(newLayout, layout, dragDetail);
  };

  createMaskStyle(): CSSProperties {
    const { dragDirection } = this.state;
    const { position } = this.props;
    if (!dragDirection || !position) {
      return {
        display: 'none',
      };
    }
    return {
      left: dragDirection === 'right' ? `${position.x + position.width / 2}px` : `${position.x}px`,
      top: dragDirection === 'bottom' ? `${position.y + position.height / 2}px` : `${position.y}px`,
      width: ['right', 'left'].includes(dragDirection)
        ? `${position.width / 2}px`
        : `${position.width}px`,
      height: ['top', 'bottom'].includes(dragDirection)
        ? `${position.height / 2}px`
        : `${position.height}px`,
    };
  }

  render() {
    const child = React.Children.only(this.props.children as any);
    const newChild = React.cloneElement(child, {
      style: {
        ...child.props.style,
        ...this.props.style,
      },
      onDragLeave: this.handleDragLeave,
      onDragOver: this.handleDragOver,
      onDrop: this.handleDrop,
    });
    return (
      <>
        {newChild}
        <div className="react-drag-mask" style={this.createMaskStyle()} />
      </>
    );
  }
}

export default Droppable;

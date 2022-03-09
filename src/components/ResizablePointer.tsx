import React, { CSSProperties } from 'react';
import classNames from 'classnames';
import {
  FatherLayoutMap,
  MousePosition,
  Offset,
  Position,
  RequiredLayout,
  ResizeDetail,
  OptionHandler,
} from '../types';
import { applyResize } from '../utils';
import ResizableHandler from './ResizableHandler';

type Props = {
  className?: string;
  style?: CSSProperties;
  positionTuple: [Position, Position];
  layout: RequiredLayout;
  baseLayout: RequiredLayout;
  baseFatherLayoutMap: FatherLayoutMap;
  onLayoutChange: (layout: RequiredLayout) => void;
  onBaseLayoutChange: (layout: RequiredLayout) => void;
  onResizingPositionTupleChange: (positionTuple: [Position, Position] | null) => void;
  onMouseEnterPositionTupleChange: (positionTuple: [Position, Position] | null) => void;
  onResize?: OptionHandler<ResizeDetail>;
};

type State = {
  resizing?: boolean;
  mouseEntering?: boolean;
};

class ResizablePointer extends React.Component<Props, State> {
  handleMouseEnter = () => {
    const { positionTuple, onMouseEnterPositionTupleChange } = this.props;
    onMouseEnterPositionTupleChange(positionTuple);
  };

  handleMouseLeave = () => {
    const { onMouseEnterPositionTupleChange } = this.props;
    onMouseEnterPositionTupleChange(null);
  };

  handleResizeStart = (mousePosition: MousePosition) => {
    const { positionTuple, onResizingPositionTupleChange, layout, onBaseLayoutChange } = this.props;
    onResizingPositionTupleChange(positionTuple);
    onBaseLayoutChange(layout);
  };

  handleResize = (mousePosition: MousePosition, oldMousePosition: MousePosition) => {
    const { positionTuple, baseLayout, baseFatherLayoutMap, onLayoutChange, onResize, layout } =
      this.props;
    const resizeDetail: ResizeDetail = {
      layout,
      baseLayout,
      mousePosition,
      oldMousePosition,
      resizeWidthNode: baseFatherLayoutMap.get(positionTuple[0].key)!.children.find(c => c.key === positionTuple[0].key),
      resizeHeightNode: baseFatherLayoutMap.get(positionTuple[1].key)!.children.find(c => c.key === positionTuple[1].key),
    };
    const newLayout = applyResize(resizeDetail);
    onLayoutChange(newLayout);
    onResize?.(newLayout, layout, resizeDetail);
  };

  handleResizeEnd = () => {
    const { layout, onBaseLayoutChange, onResizingPositionTupleChange } = this.props;
    onBaseLayoutChange(layout);
    onResizingPositionTupleChange(null);
  };

  createClassName(): string {
    const { className } = this.props;
    return classNames(className, 'react-drag-pointer');
  }

  createStyle(): CSSProperties {
    const { style } = this.props;
    const offset = this.createPointerOffset();
    return {
      left: offset.x,
      top: offset.y,
      ...style,
    };
  }

  createPointerOffset(): Offset {
    const { positionTuple } = this.props;
    return {
      x: positionTuple[0].x + positionTuple[0].width,
      y: positionTuple[1].y + positionTuple[1].height,
    };
  }

  render() {
    return (
      <ResizableHandler
        onResizeStart={this.handleResizeStart}
        onResize={this.handleResize}
        onResizeEnd={this.handleResizeEnd}
        bodyClassNameWhenResizing={classNames('react-drag-body-resizing', 'react-drag-both')}
      >
        <div
          className={this.createClassName()}
          style={this.createStyle()}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
        />
      </ResizableHandler>
    );
  }
}

export default ResizablePointer;

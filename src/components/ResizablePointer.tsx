import React, { CSSProperties } from 'react';
import classNames from 'classnames';
import {
  FatherLayoutMap,
  MousePosition,
  Offset,
  Position,
  RequiredLayout,
  ResizeDetail,
} from '../types';
import ResizableHandler from './ResizableHandler';
import { cloneNodeWith, convertLayoutToFatherLayoutMap, resizeElement } from '../utils';

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
  onResize?: (layout: RequiredLayout, oldLayout: RequiredLayout, detail: ResizeDetail) => void;
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
    const horizontalMoved = mousePosition.x - oldMousePosition.x;
    const baseFatherLayout = baseFatherLayoutMap.get(positionTuple[0].key)!;
    const [newFatherLayout] = resizeElement(
      baseFatherLayout,
      positionTuple[0].key,
      horizontalMoved
    );
    const newHorizontalLayout = cloneNodeWith(baseLayout, (child) => {
      if (child === baseFatherLayout) {
        return newFatherLayout;
      }
      return undefined;
    }) as RequiredLayout;
    const verticalMoved = mousePosition.y - oldMousePosition.y;
    const newLayout = this.resizeLayoutElementByPosition(
      newHorizontalLayout,
      positionTuple[1],
      verticalMoved
    );
    onLayoutChange(newLayout);
    onResize?.(newLayout, layout, {
      baseLayout,
      mousePosition,
      oldMousePosition,
      resizeItemKey: [positionTuple[0].key, positionTuple[1].key],
    });
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

  // eslint-disable-next-line class-methods-use-this
  resizeLayoutElementByPosition(layout: RequiredLayout, position: Position, moved: number) {
    const fatherLayoutMap = convertLayoutToFatherLayoutMap(layout);
    const fatherLayout = fatherLayoutMap.get(position.key)!;
    const [newFatherLayout] = resizeElement(fatherLayout, position.key, moved);
    return cloneNodeWith(layout, (child) => {
      if (child === fatherLayout) {
        return newFatherLayout;
      }
      return undefined;
    }) as RequiredLayout;
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

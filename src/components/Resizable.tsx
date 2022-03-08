import React from 'react';
import memoize from 'memoize-one';
import { Position, PositionMap, RequiredLayout } from '../types';
import {
  convertLayoutToFatherLayoutMap,
  convertLayoutToDividerPositions,
  convertLayoutToPointerPositionTuples,
} from '../utils';
import ResizableDivider from './ResizableDivider';
import ResizablePointer from './ResizablePointer';

type Props = {
  positionMap: PositionMap;
  baseLayout: RequiredLayout;
  layout: RequiredLayout;
  onResizeStart?: () => void;
  onResize?: () => void;
  onResizeEnd?: () => void;
  onBaseLayoutChange: (baseLayout: RequiredLayout) => void;
  onLayoutChange: (layout: RequiredLayout) => void;
};

type State = {
  mouseEnterPositionTuple: [Position, Position] | null;
  resizingPositionTuple: [Position, Position] | null;
};

class Resizable extends React.Component<Props, State> {
  convertFatherMap = memoize(convertLayoutToFatherLayoutMap);

  activeDividerPosition = memoize(
    (
      mouseEnterPositionTuple: [Position, Position] | null,
      resizingPositionTuple: [Position, Position] | null
    ) => {
      return [...(mouseEnterPositionTuple || []), ...(resizingPositionTuple || [])];
    }
  );

  state: State = {
    mouseEnterPositionTuple: null,
    resizingPositionTuple: null,
  };

  handleMouseEnterPositionTupleChange = (positionTuple: [Position, Position] | null) => {
    this.setState({
      mouseEnterPositionTuple: positionTuple,
    });
  };

  handleResizingPositionTupleChange = (positionTuple: [Position, Position] | null) => {
    this.setState({
      resizingPositionTuple: positionTuple,
    });
  };

  baseFatherLayoutMap() {
    return this.convertFatherMap(this.props.baseLayout);
  }

  processDividerPosition(position: Position) {
    const {
      onResizeStart,
      onResize,
      onResizeEnd,
      onLayoutChange,
      onBaseLayoutChange,
      layout,
      baseLayout,
    } = this.props;
    const { mouseEnterPositionTuple, resizingPositionTuple } = this.state;
    const baseFatherLayoutMap = this.baseFatherLayoutMap();
    const active = this.activeDividerPosition(mouseEnterPositionTuple, resizingPositionTuple).some(
      (p) => p.key === position.key
    );
    return (
      <ResizableDivider
        active={active}
        key={position.key}
        position={position}
        onResizeStart={onResizeStart}
        onResize={onResize}
        onResizeEnd={onResizeEnd}
        onLayoutChange={onLayoutChange}
        baseFatherLayoutMap={baseFatherLayoutMap}
        baseLayout={baseLayout}
        layout={layout}
        onBaseLayoutChange={onBaseLayoutChange}
      />
    );
  }

  processPointerPositionTuple(positionTuple: [Position, Position]) {
    const { onLayoutChange, layout, baseLayout, onBaseLayoutChange } = this.props;
    const { handleMouseEnterPositionTupleChange, handleResizingPositionTupleChange } = this;
    const baseFatherLayoutMap = this.baseFatherLayoutMap();
    return (
      <ResizablePointer
        key={`${positionTuple[0].key}__${positionTuple[1].key}`}
        positionTuple={positionTuple}
        onLayoutChange={onLayoutChange}
        baseLayout={baseLayout}
        layout={layout}
        onBaseLayoutChange={onBaseLayoutChange}
        onMouseEnterPositionTupleChange={handleMouseEnterPositionTupleChange}
        onResizingPositionTupleChange={handleResizingPositionTupleChange}
        baseFatherLayoutMap={baseFatherLayoutMap}
      />
    );
  }

  render() {
    const { layout, positionMap } = this.props;
    const dividerPositions = convertLayoutToDividerPositions(layout, positionMap);
    const pointerPositionTuples = convertLayoutToPointerPositionTuples(layout, positionMap);
    return (
      <>
        {dividerPositions.map((position) => this.processDividerPosition(position))}
        {pointerPositionTuples.map((positionTuple) =>
          this.processPointerPositionTuple(positionTuple)
        )}
      </>
    );
  }
}

export default Resizable;

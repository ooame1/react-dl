import React, { createRef, CSSProperties, PropsWithChildren, ReactElement } from 'react';
import classNames from 'classnames';
import Droppable from './components/Droppable';
import Resizable from './components/Resizable';
import Scalable from './components/Scalable';
import DragItem from './DragItem';
import { ROOT_LAYOUT_KEY } from './constants';
import { Layout, Size, PositionMap, Position, RequiredLayout, Key } from './types';
import { formatLayout, convertLayoutToPositionMap } from './utils';

type Props = {
  initLayout?: Layout;
  layout?: Layout;
  baseLayout?: Layout;
  className?: string;
  style?: CSSProperties;
  onDrag?: (layout: RequiredLayout) => void; // 拖拽调整布局
  onResize?: (layout: RequiredLayout) => void; // 拖拽分割线
  onScale?: (layout: RequiredLayout) => void; // 自动填满父窗口
  onLayoutChange?: (layout: RequiredLayout) => void;
  onBaseLayoutChange?: (layout: RequiredLayout) => void;
};

type State = {
  baseLayout: RequiredLayout;
  containerShape?: Size;
  layout: RequiredLayout;
  positionMap: PositionMap;
};

const emptyLayout: RequiredLayout = {
  key: ROOT_LAYOUT_KEY,
  type: 'layout',
  children: [],
  direction: 'horizontal',
  height: 0,
  width: 0,
};

class DragLayout extends React.Component<Props, State> {
  containerRef = createRef<HTMLDivElement>();

  state: State = {
    baseLayout: emptyLayout,
    layout: emptyLayout,
    positionMap: new Map<Key, Position>(),
  };

  static getDerivedStateFromProps(
    nextProps: PropsWithChildren<Props>,
    prevState: State
  ): Partial<State> {
    // 未初始化或非受控时不修改state
    if (!prevState.containerShape || !nextProps.layout || !nextProps.baseLayout) {
      return {};
    }
    const layout = formatLayout(nextProps.layout, prevState.containerShape);
    const baseLayout = formatLayout(nextProps.baseLayout, prevState.containerShape);
    const positionMap = convertLayoutToPositionMap(layout);
    return {
      layout,
      baseLayout,
      positionMap,
    };
  }

  componentDidMount() {
    const { initLayout, layout } = this.props;
    const containerShape: Size = {
      width: this.containerRef.current!.clientWidth,
      height: this.containerRef.current!.clientHeight,
    };
    const formattedLayout = formatLayout(layout || initLayout || emptyLayout, containerShape);
    this.setState({
      containerShape,
      layout: formattedLayout,
      baseLayout: formattedLayout,
    });
  }

  handleBaseLayoutChange = (baseLayout: RequiredLayout) => {
    this.setState({
      baseLayout,
    });
    this.props.onBaseLayoutChange?.(baseLayout);
  };

  handleContainerShapeChange = (containerShape: Size) => {
    this.setState({
      containerShape,
    });
  };

  handleLayoutChange = (layout: RequiredLayout) => {
    this.setState({
      layout,
    });
    this.props.onLayoutChange?.(layout);
  };

  createClassName() {
    return classNames(this.props.className, 'react-drag-container');
  }

  processItem(child: ReactElement<any>) {
    const { layout } = this.state;
    const { handleLayoutChange, handleBaseLayoutChange } = this;
    const position = this.state.positionMap.get(child.key as string);
    return (
      <DragItem key={child.key} position={position}>
        <Droppable
          position={position}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          onBaseLayoutChange={handleBaseLayoutChange}
        >
          {child}
        </Droppable>
      </DragItem>
    );
  }

  render() {
    const { children, style } = this.props;
    const { positionMap, baseLayout, layout } = this.state;
    const { handleLayoutChange, handleBaseLayoutChange, handleContainerShapeChange } = this;

    return (
      <Scalable
        baseLayout={baseLayout}
        onLayoutChange={handleLayoutChange}
        onContainerShapeChange={handleContainerShapeChange}
      >
        <div ref={this.containerRef} className={this.createClassName()} style={style}>
          {React.Children.map(children, (child) => this.processItem(child as any))}
          <Resizable
            positionMap={positionMap}
            layout={layout}
            baseLayout={baseLayout}
            onLayoutChange={handleLayoutChange}
            onBaseLayoutChange={handleBaseLayoutChange}
          />
        </div>
      </Scalable>
    );
  }
}

export default DragLayout;

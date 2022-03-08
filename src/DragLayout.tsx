import React, { CSSProperties, PropsWithChildren, ReactElement, Ref, RefCallback } from 'react';
import classNames from 'classnames';
import Droppable, { DragDetail } from './components/Droppable';
import Resizable from './components/Resizable';
import Scalable, { ScaleDetail } from './components/Scalable';
import DragItem from './DragItem';
import { ROOT_LAYOUT_KEY } from './constants';
import { Layout, Size, PositionMap, Position, RequiredLayout, Key, ResizeDetail } from './types';
import { formatLayout, convertLayoutToPositionMap, noop } from './utils';

type Props = {
  initLayout?: Layout;
  layout?: Layout;
  baseLayout?: Layout;
  innerRef?: Ref<HTMLDivElement>;
  onLayoutChange?: (layout: RequiredLayout) => void;
  onBaseLayoutChange?: (layout: RequiredLayout) => void;
  className?: string;
  style?: CSSProperties;
  autoSize?: boolean;
  height?: number;
  width?: number;
  onDrag?: (layout: RequiredLayout, oldLayout: RequiredLayout, detail: DragDetail) => void; // 拖拽调整布局
  onResize?: (layout: RequiredLayout, oldLayout: RequiredLayout, detail: ResizeDetail) => void; // 拖拽调整布局元素尺寸
  onScale?: (layout: RequiredLayout, oldLayout: RequiredLayout, detail: ScaleDetail) => void; // 自动填满父窗口
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
  static defaultProps: Partial<Props> = {
    initLayout: emptyLayout,
    onLayoutChange: noop,
    onBaseLayoutChange: noop,
    autoSize: true,
    onDrag: noop,
    onResize: noop,
    onScale: noop,
  };

  dom: HTMLDivElement | null = null;

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
      width: this.dom!.clientWidth,
      height: this.dom!.clientHeight,
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

  handleRef: RefCallback<HTMLDivElement> = (element) => {
    this.dom = element;
    const { innerRef } = this.props;
    if (!innerRef) {
      return;
    }
    if (typeof innerRef === 'function') {
      innerRef(element);
    } else {
      Object.assign(innerRef, {
        current: element,
      });
    }
  };

  createClassName() {
    return classNames(this.props.className, 'react-drag-container');
  }

  createStyle(): CSSProperties {
    const { style, height, width, autoSize } = this.props;
    const returnStyle: CSSProperties = {
      ...style,
    };
    if (height !== undefined) {
      Object.assign(returnStyle, {
        height: `${height}px`,
      });
    }
    if (width !== undefined) {
      Object.assign(returnStyle, {
        width: `${width}px`,
      });
    }
    if (autoSize) {
      returnStyle.width = '100%';
      returnStyle.height = '100%';
    }
    return returnStyle;
  }

  processItem(child: ReactElement<any>) {
    const { onDrag } = this.props;
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
          onDrag={onDrag}
        >
          {child}
        </Droppable>
      </DragItem>
    );
  }

  render() {
    const { children, onScale, onResize } = this.props;
    const { positionMap, baseLayout, layout } = this.state;
    const { handleRef, handleLayoutChange, handleBaseLayoutChange, handleContainerShapeChange } =
      this;

    return (
      <Scalable
        baseLayout={baseLayout}
        onLayoutChange={handleLayoutChange}
        onContainerShapeChange={handleContainerShapeChange}
        layout={layout}
        onScale={onScale}
      >
        <div ref={handleRef} className={this.createClassName()} style={this.createStyle()}>
          {React.Children.map(children, (child) => this.processItem(child as any))}
          <Resizable
            positionMap={positionMap}
            layout={layout}
            baseLayout={baseLayout}
            onLayoutChange={handleLayoutChange}
            onBaseLayoutChange={handleBaseLayoutChange}
            onResize={onResize}
          />
        </div>
      </Scalable>
    );
  }
}

export default DragLayout;

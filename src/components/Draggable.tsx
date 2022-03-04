import React, { useCallback, useEffect, useRef } from 'react';
import { Item } from '../types';
import { DRAG_DATA_KEY } from '../constants';

type Props = {
  item: Item;
};

const Draggable: React.FC<Props> = ({ item, children }) => {
  const ref = useRef<HTMLElement>(null!);
  const child = React.Children.only(children) as any;

  const handleDragStart = useCallback((e: DragEvent) => {
    e.dataTransfer?.setData(DRAG_DATA_KEY, JSON.stringify(item));
  }, []);

  const handleRef = (element: HTMLElement) => {
    ref.current = element;
    if (!child.ref) {
      return;
    }
    if (typeof child.ref === 'function') {
      child.ref(element);
    } else if (typeof child.ref === 'object') {
      child.ref.current = element;
    }
  };

  useEffect(() => {
    ref.current.addEventListener('dragstart', handleDragStart);
    return () => ref.current.removeEventListener('dragstart', handleDragStart);
  }, [ref.current]);

  return React.cloneElement(child, {
    ref: handleRef,
    draggable: true,
  });
};

export default Draggable;

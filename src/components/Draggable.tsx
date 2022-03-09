import React, { useCallback, useEffect, useRef } from 'react';
import { Item } from '../types';

type Props = {
  item: Item;
};

export const DraggingData: { item: Item | null } = { item: null };

const Draggable: React.FC<Props> = ({ item, children }) => {
  const ref = useRef<HTMLElement>(null!);
  const child = React.Children.only(children) as any;

  const handleDragStart = useCallback(() => {
    DraggingData.item = item;
  }, [item]);

  const handleDragEnd = useCallback(() => {
    DraggingData.item = null;
  }, [item]);

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
    ref.current.addEventListener('dragend', handleDragEnd);
    return () => {
      ref.current.removeEventListener('dragstart', handleDragStart);
      ref.current.removeEventListener('dragend', handleDragEnd);
    };
  }, [ref.current, handleDragStart, handleDragEnd]);

  return React.cloneElement(child, {
    ref: handleRef,
    draggable: true,
  });
};

export default Draggable;

"use client";

import { useState, useRef } from "react";

interface DragDropListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number, isDragging: boolean) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export default function DragDropList<T>({ items, onReorder, renderItem, keyExtractor }: DragDropListProps<T>) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItem.current = index;
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newItems = [...items];
      const draggedItem = newItems[dragItem.current];
      newItems.splice(dragItem.current, 1);
      newItems.splice(dragOverItem.current, 0, draggedItem);
      onReorder(newItems);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={keyExtractor(item)}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
          className={`cursor-move transition-all ${draggedIndex === index ? "opacity-50 scale-95" : ""}`}
        >
          {renderItem(item, index, draggedIndex === index)}
        </div>
      ))}
    </div>
  );
}
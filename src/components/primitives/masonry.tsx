import type React from "react";

interface MasonryProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  columns?: number;
  gap?: number;
}

export function Masonry<T>({ items, renderItem, columns = 3, gap = 4 }: MasonryProps<T>) {
  return (
    <section id="masonry">
      <div
        className={`columns-${columns} gap-${gap}`}
        style={{ columnCount: columns, columnGap: `${gap * 0.25}rem` }}
      >
        {items.map((item, idx) => (
          <div key={idx} className="mb-4 break-inside-avoid">{renderItem(item, idx)}</div>
        ))}
      </div>
    </section>
  );
}

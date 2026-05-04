"use client";

interface SortToggleProps {
  sort: "loved" | "recent";
  onSortChange: (sort: "loved" | "recent") => void;
}

export default function SortToggle({ sort, onSortChange }: SortToggleProps) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
      <button
        onClick={() => onSortChange("loved")}
        className={`px-3 py-1 rounded-md transition-colors ${
          sort === "loved" ? "bg-white shadow text-gray-900" : "text-gray-500"
        }`}
      >
        Most Loved
      </button>
      <button
        onClick={() => onSortChange("recent")}
        className={`px-3 py-1 rounded-md transition-colors ${
          sort === "recent" ? "bg-white shadow text-gray-900" : "text-gray-500"
        }`}
      >
        Most Recent
      </button>
    </div>
  );
}

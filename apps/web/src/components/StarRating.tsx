"use client";

import { useState } from "react";

// A reusable, slightly refined SVG star icon component
const StarIcon = ({
  filled,
  className,
}: {
  filled: boolean;
  className?: string;
}) => (
  <svg
    className={`w-8 h-8 ${filled ? "text-yellow-400" : "text-gray-300"} ${className}`}
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.366 2.446a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.446a1 1 0 00-1.175 0l-3.366 2.446c-.784.57-1.838-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.064 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
  </svg>
);

interface StarRatingProps {
  rating: number;
  setRating: (rating: number) => void;
}

export default function StarRating({ rating, setRating }: StarRatingProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex items-center space-x-1" aria-label="Star rating">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <button
            type="button" // Important to prevent form submission
            key={starValue}
            aria-label={`Rate ${starValue} out of 5 stars`}
            onClick={() => setRating(starValue)}
            onMouseEnter={() => setHover(starValue)}
            onMouseLeave={() => setHover(0)}
            className="transform transition-transform duration-150 ease-in-out hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-full"
          >
            <StarIcon
              filled={starValue <= (hover || rating)}
              className="transition-colors duration-200"
            />
          </button>
        );
      })}
    </div>
  );
}

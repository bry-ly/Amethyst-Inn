"use client";

import { useState, useEffect, useRef } from "react";
import { testimonials } from "@/components/data/testimonials";

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll functionality
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000); // Change slide every 5 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle pagination click
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section
      id="testimonials"
      className="py-16  transition-colors duration-200"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4 font-poppins text-gray-900 dark:text-white">
            What Guests Say
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-roboto px-4">
            Feedback from guests who enjoyed their stay at Amethyst Inn
            House.
          </p>
        </div>

        <div className="relative overflow-hidden">
          {/* Carousel Container */}
          <div
            className="flex transition-transform duration-700 ease-in-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
          >
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="w-full flex-shrink-0 px-3 sm:px-4"
              >
                <div className="max-w-2xl mx-auto">
                  <div className=" dark:bg-primary rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8 lg:p-10 text-center transition-colors duration-200">
                    {/* Quote */}
                    <blockquote className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 dark:text-primary-foreground font-normal leading-relaxed mb-4 sm:mb-6 md:mb-8 font-roboto italic">
                      "{testimonial.quote}"
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-600 font-roboto mt-1">
                        {testimonial.role}
                      </p>
                      {testimonial.location && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-foreground font-roboto mt-1">
                          {testimonial.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Dots */}
          <div className="flex justify-center mt-6 sm:mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 sm:w-3 sm:h-3 rounded-full transition-all duration-300 min-w-[9px] min-h-[9px] align-middle ${
                  index === currentIndex
                    ? "dark:bg-primary bg-gray-300 scale-110 "
                    : "bg-primary dark:bg-gray-300 hover:bg-gray-400 dark:hover:bg-gray-100 mb-3"
                }`}
                style={index === currentIndex ? { verticalAlign: "middle" } : {}}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

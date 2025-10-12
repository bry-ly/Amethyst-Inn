"use client";

import { useState, useEffect, useRef } from "react";
import { testimonials as fallbackTestimonials } from "@/components/data/testimonials";
import { Feedback } from "@/types/feedback";
import { Star } from "lucide-react";
import Link from "next/link";

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch real testimonials from API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/feedback?approved=true");
        const data = await response.json();

        if (data.success && data.data.length > 0) {
          // Convert feedback to testimonial format and take top 6 by rating
          const converted = data.data
            .sort((a: Feedback, b: Feedback) => b.rating - a.rating)
            .slice(0, 6)
            .map((feedback: Feedback, index: number) => ({
              id: index + 1,
              name: feedback.user.name,
              role: feedback.category.charAt(0).toUpperCase() + feedback.category.slice(1),
              quote: feedback.message,
              rating: feedback.rating,
              title: feedback.title,
            }));
          setTestimonials(converted);
        } else {
          // Use fallback testimonials if no real data
          setTestimonials(fallbackTestimonials);
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error);
        // Use fallback testimonials on error
        setTestimonials(fallbackTestimonials);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  // Auto-scroll functionality
  useEffect(() => {
    if (testimonials.length === 0) return;

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
  }, [testimonials.length]);

  // Handle pagination click
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1 justify-center mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <section
        id="testimonials"
        className="py-16 transition-colors duration-200"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4 font-poppins text-gray-900 dark:text-white">
              What Guests Say
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-roboto px-4">
              Loading testimonials...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section
      id="testimonials"
      className="py-16 transition-colors duration-200"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-3 sm:mb-4 font-poppins text-gray-900 dark:text-white">
            What Guests Say
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-roboto px-4">
            Feedback from guests who enjoyed their stay at Amethyst Inn House.
          </p>
          <Link
            href="/testimonials"
            className="inline-block mt-4 text-primary hover:text-primary/80 font-medium transition-colors"
          >
            View All Testimonials →
          </Link>
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
                  <div className="dark:bg-primary rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 md:p-8 lg:p-10 text-center transition-colors duration-200">
                    {/* Rating Stars */}
                    {testimonial.rating && renderStars(testimonial.rating)}
                    
                    {/* Title (if available) */}
                    {testimonial.title && (
                      <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 dark:text-white font-poppins mb-3">
                        {testimonial.title}
                      </h3>
                    )}

                    {/* Quote */}
                    <blockquote className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 dark:text-primary-foreground font-normal leading-relaxed mb-4 sm:mb-6 md:mb-8 font-roboto italic">
                      "{testimonial.quote}"
                    </blockquote>

                    {/* Author Info */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white font-poppins">
                        {testimonial.name}
                      </h4>
                      <p className="text-sm sm:text-base text-primary-foreground dark:text-primary font-roboto mt-1 capitalize">
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

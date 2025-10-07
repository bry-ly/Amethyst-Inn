import { amenities } from "./data/aminities";

export function AmenitiesSection() {
  return (
    <section
      id="amenities"
      className="py-16 bg-gray-50 dark:bg-gray-900 transition-colors duration-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold mb-4 text-gray-900 dark:text-white">
            Guest Amenities
          </h2>
          <p className="text-lg text-muted-foreground dark:text-gray-300 max-w-2xl mx-auto">
            Enjoy our comprehensive range of amenities designed to make your
            stay comfortable, convenient, and memorable.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {amenities.map((amenity, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="text-primary  mb-4">{amenity.icon}</div>
              <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                {amenity.title}
              </h3>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                {amenity.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

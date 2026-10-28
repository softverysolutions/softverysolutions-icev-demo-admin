export function buildCourseServiceOptions(courseServices, durationWeeks) {
  return (courseServices || [])
    .filter((cs) => !cs.service || cs.service.isActive !== false)
    .map((courseService) => {
      const serviceId = courseService.service?.id || courseService.serviceId;
      const serviceName = courseService.service?.name || "Unknown Service";

      let servicePrice = courseService.price || 0;

      if (
        courseService.durationPrices &&
        courseService.durationPrices.length > 0 &&
        durationWeeks > 0
      ) {
        const matchingPrice = courseService.durationPrices.find((dp) => {
          const minWeeks = dp.minWeeks || 0;
          const maxWeeks = dp.maxWeeks || Infinity;
          return durationWeeks >= minWeeks && durationWeeks <= maxWeeks;
        });

        if (matchingPrice) {
          if (matchingPrice.mode === "PER_WEEK") {
            servicePrice = matchingPrice.price * durationWeeks;
          } else {
            servicePrice = matchingPrice.price;
          }
        } else {
          const firstPrice = courseService.durationPrices[0];
          if (firstPrice.mode === "PER_WEEK") {
            servicePrice = firstPrice.price * durationWeeks;
          } else {
            servicePrice = firstPrice.price;
          }
        }
      }

      return {
        value: serviceId,
        label: serviceName,
        courseServiceId: courseService.id,
        price: servicePrice,
        currency: courseService.service?.currency,
        courseService: courseService,
        isMandatory: Boolean(courseService.isMandatory),
      };
    });
}

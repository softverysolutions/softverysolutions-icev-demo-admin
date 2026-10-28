import { useState, useCallback } from "react";

const useFormValidation = (initialErrors = {}) => {
  const [errors, setErrors] = useState(initialErrors);

  const fieldDisplayNames = {
    name: "Course Name",
    minAge: "Minimum Age",
    courseType: "Course Type",
    specificCourse: "Specific Course",
    startDates: "Start Dates",
    startDatesPattern: "Start Dates Pattern",
    coursePatternStartDate: "Course Pattern Start Date",
    durationType: "Duration Type",
    duration: "Duration Value",
    durationPeriod: "Duration Period",
  };

  const validateField = useCallback((field, value, rules) => {
    const fieldErrors = [];
    const displayName = fieldDisplayNames[field] || field;

    if (rules.required && (!value || value.toString().trim() === "")) {
      fieldErrors.push(`${displayName} is required`);
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      fieldErrors.push(`${displayName} must be at least ${rules.minLength} characters`);
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      fieldErrors.push(`${displayName} must be no more than ${rules.maxLength} characters`);
    }

    if (rules.min && value && Number(value) < rules.min) {
      fieldErrors.push(`${displayName} must be at least ${rules.min}`);
    }

    if (rules.max && value && Number(value) > rules.max) {
      fieldErrors.push(`${displayName} must be no more than ${rules.max}`);
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      fieldErrors.push(`${displayName} format is invalid`);
    }

    if (rules.custom && value) {
      const customError = rules.custom(value);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    return fieldErrors;
  }, []);

  const validateForm = useCallback(
    (formData, validationRules) => {
      const newErrors = {};
      let hasErrors = false;

      Object.keys(validationRules).forEach((field) => {
        const fieldErrors = validateField(field, formData[field], validationRules[field]);
        if (fieldErrors.length > 0) {
          newErrors[field] = fieldErrors;
          hasErrors = true;
        }
      });

      setErrors(newErrors);
      return { isValid: !hasErrors, errors: newErrors };
    },
    [validateField]
  );

  const setFieldError = useCallback((field, error) => {
    setErrors((prev) => ({
      ...prev,
      [field]: error ? [error] : [],
    }));
  }, []);

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldErrorOnChange = useCallback(
    (field) => {
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const getFieldError = useCallback(
    (field) => {
      return errors[field]?.[0] || null;
    },
    [errors]
  );

  const hasFieldError = useCallback(
    (field) => {
      return Boolean(errors[field]?.length);
    },
    [errors]
  );

  return {
    errors,
    validateForm,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    clearFieldErrorOnChange,
    getFieldError,
    hasFieldError,
    validateField,
  };
};

export default useFormValidation;

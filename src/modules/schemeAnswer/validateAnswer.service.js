import { ApiError } from "../../utils/ApiError.js";
export const validateAnswerData = async ({
  definition,
  data,
  allowPartial = false,
}) => {
  for (const field of definition.fields) {
    const value = data[field.key];

    // required check
    if (
      !allowPartial &&
      field.required &&
      (value === undefined || value === null || value === "")
    ) {
      throw new ApiError(
        400,
        `Field '${field.label}' is required`
      );
    }

    if (
      value === undefined ||
      value === null ||
      (allowPartial && value === "")
    ) {
      continue;
    }

    // type validation
    switch (field.type) {
      case "NUMBER":
      case "AMOUNT":
        if (isNaN(value)) {
          throw new ApiError(
            400,
            `Field '${field.label}' must be a number`
          );
        }
        break;

      case "DATE":
        if (isNaN(Date.parse(value))) {
          throw new ApiError(
            400,
            `Field '${field.label}' must be a valid date`
          );
        }
        break;

      case "SELECT":
        if (
          field.options?.length &&
          !field.options.includes(value)
        ) {
          throw new ApiError(
            400,
            `Invalid option for '${field.label}'`
          );
        }
        break;
    }
  }
};

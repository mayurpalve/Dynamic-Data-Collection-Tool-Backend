import { ApiError } from "../../utils/ApiError.js";

const toComparableDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const validateSchemeWindow = ({ opensAt, closesAt }) => {
  const openDate = toComparableDate(opensAt);
  const closeDate = toComparableDate(closesAt);

  if (opensAt && !openDate) {
    throw new ApiError(400, "Invalid scheme open date");
  }

  if (closesAt && !closeDate) {
    throw new ApiError(400, "Invalid scheme close date");
  }

  if (openDate && closeDate && openDate > closeDate) {
    throw new ApiError(400, "Scheme open date must be before close date");
  }
};

export const isSchemeWithinWindow = (scheme, currentTime = new Date()) => {
  if (!scheme) return false;

  const openDate = toComparableDate(scheme.opensAt);
  const closeDate = toComparableDate(scheme.closesAt);

  if (openDate && currentTime < openDate) {
    return false;
  }

  if (closeDate && currentTime > closeDate) {
    return false;
  }

  return true;
};

export const isSchemeAcceptingSubmissions = (scheme, currentTime = new Date()) =>
  scheme?.status === "ACTIVE" && isSchemeWithinWindow(scheme, currentTime);

export const assertSchemeAcceptingSubmissions = (scheme) => {
  if (!scheme || scheme.deletedAt) {
    throw new ApiError(404, "Scheme not found");
  }

  if (scheme.status !== "ACTIVE") {
    throw new ApiError(403, "Scheme is not currently active");
  }

  if (!isSchemeWithinWindow(scheme)) {
    throw new ApiError(403, "Scheme is outside its submission window");
  }
};

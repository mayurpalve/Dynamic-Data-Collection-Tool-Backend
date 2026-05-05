import { isSchemeAcceptingSubmissions } from "../scheme/schemeWindow.service.js";

export const isPublicSchemeAccessible = ({ scheme, definition }) => {
  return (
    !!scheme &&
    !scheme.deletedAt &&
    definition?.isPublic === true &&
    isSchemeAcceptingSubmissions(scheme)
  );
};

import { ApiError } from "./errorHandler.js";

export const validateRequest =
  ({ body, params, query } = {}) =>
  (req, res, next) => {
    try {
      for (const [source, schema] of Object.entries({ body, params, query })) {
        if (typeof schema !== "function") continue;
        const result = schema(req[source]);
        if (result !== true) {
          throw new ApiError(400, `Invalid ${source}`, result);
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  };

export const requireFields = (fields) => (value) => {
  const missing = fields.filter(
    (field) =>
      value?.[field] === undefined ||
      value[field] === null ||
      value[field] === "",
  );
  return missing.length === 0 || { missing };
};

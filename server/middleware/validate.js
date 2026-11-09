// A factory: validate(schema) returns a middleware that checks one part of the request.
// source is 'body' (default), 'query' (the ?a=b part of the URL) or 'params'.
export const validate =
    (schema, source = "body") =>
    (req, res, next) => {
        const result = schema.safeParse(req[source]); // safeParse never throws; it returns success/failure

        if (!result.success) {
            return res.status(400).json({
                message: "Validation failed",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        // Controllers read ONLY req.valid: data that has passed the gate and been cleaned.
        req.valid = result.data;
        next(); // continue to the next middleware or the controller
    };

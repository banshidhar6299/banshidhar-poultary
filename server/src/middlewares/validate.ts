import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

interface ValidateOptions {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

/**
 * Reusable Zod validation middleware.
 * Validates request body, query, and/or params against Zod schemas.
 * Returns structured 400 responses without stack traces or internal details.
 */
export const validateRequest = (schemas: ValidateOptions) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as any;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        // Assign parsed values back (types are coerced)
        Object.assign(req.query, parsed);
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const messages = error.errors.map((e) => {
          const path = e.path.join('.');
          return path ? `${path}: ${e.message}` : e.message;
        });
        res.status(400).json({
          success: false,
          message: 'Validation failed.',
          errors: messages
        });
        return;
      }
      next(error);
    }
  };
};

/**
 * Escape special regex characters to prevent ReDoS attacks from user search input.
 */
export const escapeRegExp = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

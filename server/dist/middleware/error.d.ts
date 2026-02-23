import { Request, Response, NextFunction } from "express";
export interface AppError extends Error {
    statusCode?: number;
    details?: unknown;
}
export declare function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction): void;
export declare function createError(message: string, statusCode: number, details?: unknown): AppError;
//# sourceMappingURL=error.d.ts.map
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export function transformQueryParamMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const newQueryParam = {};

  Object.keys(req.query).forEach(
    (key) => (newQueryParam[key.toLowerCase()] = req.query[key]),
  );

  req.query = newQueryParam;

  next();
}

import { ErrorHandler } from '@nestjs/common/interfaces';
import { CustomError } from './customError';

export const errorHandler: ErrorHandler = (error, req, res, next) => {
  if (error instanceof CustomError) {
    return res
      .status(error.code)
      .json({ name: error.name, message: JSON.parse(error.message) });
  }

  return res.status(500).json({ message: "What' wrong with you", error });
};

export default errorHandler;

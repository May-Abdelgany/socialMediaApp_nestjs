import { BilingualMessage } from '../constants/error-catalog';
import { SupportedLang } from '../utils/get-request-lang.util';


export interface ApiFieldError {
  field: string;
  message: BilingualMessage;
}
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  errors?: ApiFieldError[];
  lang: SupportedLang;
  message: BilingualMessage;
  path?: string;
  timestamp?: string;
}


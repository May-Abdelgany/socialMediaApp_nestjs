import { BilingualMessage } from '../constants/error-catalog';
import { SupportedLang } from '../utils/get-request-lang.util';

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  lang: SupportedLang;
  message: BilingualMessage;
  path?: string;
  timestamp?: string;
}
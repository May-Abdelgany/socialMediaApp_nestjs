import { createParamDecorator, ExecutionContext } from '@nestjs/common';
 
export interface CurrentUserPayload {
  sub: string; // user id
  email: string;
  sid: string; // session id — identifies which device this token belongs to
}
export const CurrentUser = createParamDecorator(
  (field: keyof CurrentUserPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: CurrentUserPayload = request.user;
    return field ? user?.[field] : user;
  },
);
 
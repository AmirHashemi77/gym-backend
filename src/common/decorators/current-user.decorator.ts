import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser } from '../entities/jwt-user.entity';

export const CurrentUser = createParamDecorator((data: keyof JwtUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<{ user: JwtUser }>();
  return data ? request.user[data] : request.user;
});

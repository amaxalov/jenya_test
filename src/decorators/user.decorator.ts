import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { AccessTokenPayload } from '../auth/types/access-token-payload';

export const User = createParamDecorator(
  (data: keyof AccessTokenPayload, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<FastifyRequest & { user: AccessTokenPayload }>();
    const user = request.user;

    return data ? user[data] : user;
  },
);

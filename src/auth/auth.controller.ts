import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { FastifyReply } from 'fastify';
import { LoginDto } from './dto/login.dto';
import { Public } from 'src/common/decorators/public.decorator';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() initData: LoginDto, @Res() response: FastifyReply) {
    const loginResponse = await this.authService.login(initData);

    return response.send(loginResponse);
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { User } from 'src/users/user.entity';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(initData: LoginDto): Promise<User> {
    try {
      const user = await this.usersService.findOneBy({
        firstName: initData.firstName,
        lastName: initData.lastName,
      });

      if (!user) {
        const newUser = await this.usersService.create({
          firstName: String(initData.firstName),
          lastName: String(initData.lastName),
        });
        return newUser;
      }

      return user;
    } catch (e) {
      throw new UnauthorizedException(e);
    }
  }

  async login(initData: LoginDto) {
    const user = await this.validateUser(initData);
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    return {
      user,
      accessToken,
    };
  }
}

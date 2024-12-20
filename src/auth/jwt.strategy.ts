import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy as JwtPassportStrategy, ExtractJwt } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../users/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(JwtPassportStrategy) {
  constructor(
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'SECRET_KEY',
    });
  }

  async validate(payload: JwtPayload): Promise<Partial<User>> {
    const { username } = payload;
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado ou inválido.');
    }
    const { password, ...result } = user;
    return result;
  }
}

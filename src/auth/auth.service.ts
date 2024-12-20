import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';
import * as jwt from 'jsonwebtoken'; 

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await this.usersService.validatePassword(pass, user.password)) {
      return {
        email: user.email,
        username: user.username,
        _id: user._id.toString(),
      };
    }
    return null;
  }
  

  async login(user: any) {
    const payload: JwtPayload = { username: user.username, sub: user._id.toString() };
    const access_token = this.jwtService.sign(payload, {
      expiresIn: '24h',
    });

    const remainingTime = this.getRemainingTime(access_token);

    return {
      access_token,
      expires_in: remainingTime,
    };
  }

  getRemainingTime(token: string): number {
    const decoded: any = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      throw new Error('Token inválido ou não contém a expiração.');
    }

    const expirationTimeInMillis = decoded.exp * 1000;
    const remainingTime = expirationTimeInMillis - new Date().getTime();
    return remainingTime;
  }
}

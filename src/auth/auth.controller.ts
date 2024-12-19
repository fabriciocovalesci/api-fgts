import { Controller, Post, Body, UseGuards, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  async register(@Body() userData: { username: string; email: string; password: string }) {
    return await this.usersService.createUser(userData);
  }

  @Post('login')
  async login(@Body() credentials: { username: string; password: string }) {
    const user = await this.authService.validateUser(credentials.username, credentials.password);
    if (!user) {
      throw new UnauthorizedException('Usuário ou senha inválidos.');
    }
    return this.authService.login(user);
  }
}

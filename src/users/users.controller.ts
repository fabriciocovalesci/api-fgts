import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './user-dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

}

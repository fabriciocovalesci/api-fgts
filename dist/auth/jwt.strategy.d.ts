import { Strategy as JwtPassportStrategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './jwt-payload.interface';
import { User } from '../users/user.schema';
declare const JwtStrategy_base: new (...args: any[]) => JwtPassportStrategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly usersService;
    constructor(usersService: UsersService);
    validate(payload: JwtPayload): Promise<Partial<User>>;
}
export {};

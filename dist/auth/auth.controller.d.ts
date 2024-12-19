import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
export declare class AuthController {
    private authService;
    private usersService;
    constructor(authService: AuthService, usersService: UsersService);
    register(userData: {
        username: string;
        email: string;
        password: string;
    }): Promise<Omit<import("../users/user.schema").User, "_id" | "__v" | "password"> & {
        id: string;
    }>;
    login(credentials: {
        username: string;
        password: string;
    }): Promise<{
        access_token: string;
        expires_in: number;
    }>;
}

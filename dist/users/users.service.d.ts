import { User, UserDocument } from './user.schema';
import { Model } from 'mongoose';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    createUser(userData: Partial<User>): Promise<Omit<User, 'password' | '__v' | '_id'> & {
        id: string;
    }>;
    checkIfUserExists(username: string, email: string): Promise<boolean>;
    findById(id: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean>;
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async createUser(userData: Partial<User>): Promise<Omit<User, 'password' | '__v' | '_id'> & { id: string }> {
    const userExists = await this.checkIfUserExists(userData.username, userData.email);
    if (userExists) {
      throw new BadRequestException('Username or email already exists');
    }
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = new this.userModel({ ...userData, password: hashedPassword });
    const savedUser = await user.save();
    const { password, _id, ...userWithoutPassword } = savedUser.toObject();
    return { ...userWithoutPassword, id: _id.toString() };
  }
  
  async checkIfUserExists(username: string, email: string): Promise<boolean> {
    const userByUsername = await this.userModel.findOne({ username }).exec();
    if (userByUsername) {
      return true;
    }
    const userByEmail = await this.userModel.findOne({ email }).exec();
    if (userByEmail) {
      return true;
    }
    return false;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}

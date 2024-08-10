import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from 'src/dto/user/registerUser.dto';

@Injectable()
export class UserService {
  private users: User[] = [
    {
      user_id: 'admin',
      username: 'admin',
      password: '$2b$10$O/OTgFsDi2TnBByk8j3MIucR/10As8TRWyHZbD8/2.vkqg7r1bqSu',
      status: false,
      tags: ['football', 'game'],
      created_at: new Date(),
    },
  ];

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // DTO 생성 필요
  async create(user: RegisterUserDto): Promise<User> {
    const createdUser = new this.userModel(user);
    return createdUser.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<User> {
    return this.userModel.findOne({ user_id: id }).exec();
  }

  async update(id: string, updateUserDto: any): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();
  }

  async delete(id: string): Promise<User> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

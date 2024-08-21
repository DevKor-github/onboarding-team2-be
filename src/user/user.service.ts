import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from './dtos/user.dto';

@Injectable()
export class UserService {
  private users: User[] = [
    {
      userId: 'admin',
      username: 'admin',
      password: '$2b$10$O/OTgFsDi2TnBByk8j3MIucR/10As8TRWyHZbD8/2.vkqg7r1bqSu',
      status: false,
      chats: [],
      tags: ['football', 'game'],
      createdAt: new Date(),
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

  async findOne(id: string): Promise<UserDocument> {
    return await this.userModel.findOne({ _id: id }).exec();
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

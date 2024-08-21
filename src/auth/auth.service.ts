import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../user/schemas/user.schema';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '../user/dtos/user.dto';
import { JwtTokenDto } from './jwt.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService
  ) {}

  async validateUser(userId: string, pass: string): Promise<any> {
    const user = await this.userService.findByUserId(userId);
    if (
      user &&
      (await this.userService.validatePassword(pass, user.password))
    ) {
      const { _id, userId, username } = user;
      return { _id, userId, username };
    }
    return null;
  }

  async register(user: RegisterUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    return this.userService.create(user);
  }

  async login(user: JwtTokenDto) {
    const payload = {
      _id: user._id,
      userId: user.userId,
      username: user.username,
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

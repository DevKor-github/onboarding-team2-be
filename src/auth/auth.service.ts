import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.schema';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterUserDto } from '../dto/user/registerUser.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService
  ) {}

  async validateUser(userId: string, pass: string): Promise<any> {
    const user = await this.userService.findOne(userId);
    if (
      user &&
      (await this.userService.validatePassword(pass, user.password))
    ) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(user: RegisterUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    user.password = hashedPassword;
    return this.userService.create(user);
  }

  async login(user: any) {
    const payload = { userId: user.id, sub: user.username };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

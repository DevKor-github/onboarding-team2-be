import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody } from '@nestjs/swagger';
import { RegisterUserDto } from 'src/dto/user/registerUser.dto';
import { LoginUserDto } from 'src/dto/user/loginUser.dto';
import { UserService } from 'src/user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  @Post('login')
  @ApiBody({ type: LoginUserDto })
  async login(@Body() req: LoginUserDto) {
    const user = await this.authService.validateUser(req.user_id, req.password);
    if (!user) {
      return 'Invalid credentials';
    }
    return this.authService.login(user);
  }

  @Post('register')
  @ApiBody({ type: RegisterUserDto })
  async register(@Body() req: RegisterUserDto) {
    const user = await this.userService.findOne(req.user_id);
    if (user) {
      return 'User Id Already Exists';
    }
    return this.authService.register(req);
  }
}

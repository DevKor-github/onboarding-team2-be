import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody } from '@nestjs/swagger';
import { RegisterUserDto, LoginUserDto } from '../user/dtos/user.dto';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  @Post('login')
  @ApiBody({ type: LoginUserDto })
  async login(@Body() req: LoginUserDto, @Res() res: Response) {
    const user = await this.authService.validateUser(req.userId, req.password);
    if (!user) {
      return res.status(401).json('Invalid credentials');
    }
    const jwt = await this.authService.login(user);
    console.log(jwt);
    res.setHeader('Authorization', 'Bearer ' + jwt.access_token);
    return res.status(200).json(jwt);
  }

  @Post('register')
  @ApiBody({ type: RegisterUserDto })
  async register(@Body() req: RegisterUserDto, @Res() res: Response) {
    const user = await this.userService.findOne(req.userId);
    if (user) {
      return res.json('User Id Already Exists');
    }
    return res.json(await this.authService.register(req));
  }
}

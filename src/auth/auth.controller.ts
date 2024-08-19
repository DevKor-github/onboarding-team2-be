import { Controller, Post, Body, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { RegisterUserDto, LoginUserDto } from '../user/dtos/user.dto';
import { UserService } from 'src/user/user.service';
import { Response } from 'express';
import { JwtTokenDto } from './jwt.dto';

@Controller('auth')
@ApiTags('Auth')
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
    console.log();
    const payload: JwtTokenDto = {
      _id: user._id,
      userId: user.userId,
      username: user.username,
    };
    const jwt = await this.authService.login(payload);
    res.setHeader('Authorization', 'Bearer ' + jwt.access_token);
    return res.status(200).json({ message: 'Login Successfully' });
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

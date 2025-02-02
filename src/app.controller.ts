import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ApiTags } from '@nestjs/swagger';

@Controller()
@ApiTags('Test APIs')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @UseGuards(JwtAuthGuard)
  @Get('protected')
  HelloAuth(@Request() req): string {
    return `Hello ${req.user.username}`;
  }
}

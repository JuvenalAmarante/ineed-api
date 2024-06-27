import { Controller, Get, Post, Body, Patch, Param, Delete, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(@Body() loginDto: LoginDto, @Headers('device') device: string) {
    return this.authService.login(loginDto, device);
  }
}

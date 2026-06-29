import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';

interface RequestWithUser extends Request {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @Post('register')
  @ApiOperation({ summary: 'Register a new HR user (Admin only)' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login HR user and get JWT access token' })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged in and generated token',
  })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get current HR profile details' })
  @ApiResponse({ status: 200, description: 'Current user profile returned' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }
}

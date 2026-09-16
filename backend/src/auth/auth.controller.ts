import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { AzureCallbackDto } from './dto/azure-callback.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('verify-code')
  @HttpCode(HttpStatus.OK)
  async verifyCode(@Body() verifyCodeDto: VerifyCodeDto) {
    return this.authService.verifyCode(verifyCodeDto);
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.OK)
  async resendCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.authService.resendCode(resendCodeDto);
  }

  @Post('azure-callback')
  @HttpCode(HttpStatus.OK)
  async azureCallback(@Body() azureCallbackDto: AzureCallbackDto) {
    return this.authService.azureCallback(azureCallbackDto);
  }

  @Post('complete-profile')
  @HttpCode(HttpStatus.OK)
  async completeProfile(@Body() completeProfileDto: CompleteProfileDto) {
    return this.authService.completeProfile(completeProfileDto);
  }
}

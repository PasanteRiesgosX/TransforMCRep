import { Controller, Post, Body, HttpCode, HttpStatus, Get, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AzureCallbackDto } from './dto/azure-callback.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: any) {
    const user = req.user;
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      area: user.area,
      appRole: user.appRole,
      position: user.position,
    };
  }
}

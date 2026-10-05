import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getJwtSecret } from './jwt-secret';

const passportModule = PassportModule.register({ defaultStrategy: 'jwt' });

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    passportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = Number(
          configService.get<string>('JWT_EXPIRES_IN') ?? '86400',
        );
        if (!Number.isSafeInteger(expiresIn) || expiresIn <= 0) {
          throw new Error('JWT_EXPIRES_IN must be a positive number of seconds.');
        }

        return {
          secret: getJwtSecret(configService),
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, passportModule],
})
export class AuthModule {}

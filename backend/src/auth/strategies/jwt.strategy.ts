import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { getJwtSecret } from '../jwt-secret';

export interface JwtPayload {
  sub: string;
  email: string;
  position: string;
  appRole: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getJwtSecret(configService),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { appRole: true },
    });

    if (!user) {
      throw new UnauthorizedException(
        'Usuario no autorizado o token inválido.',
      );
    }

    return {
      ...user,
      appRole: user.appRole?.code,
    };
  }
}

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AzureCallbackDto } from './dto/azure-callback.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async azureCallback(azureCallbackDto: AzureCallbackDto) {
    const { code } = azureCallbackDto;
    
    const tenantId = process.env.AZURE_TENANT_ID;
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;
    const redirectUri = process.env.AZURE_REDIRECT_URI;

    if (!tenantId || !clientId || !clientSecret || !redirectUri) {
      throw new BadRequestException('Falta configuración de Azure AD en el servidor.');
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    });

    try {
      const msResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!msResponse.ok) {
        const errorData = await msResponse.json();
        throw new UnauthorizedException(`Error al canjear token con Microsoft: ${errorData.error_description || errorData.error}`);
      }

      const tokenData = await msResponse.json();
      const idToken = tokenData.id_token;

      if (!idToken) {
        throw new UnauthorizedException('No se recibió id_token de Microsoft.');
      }

      // Decodificar payload del id_token de manera insegura (fue recibido por back-channel directo de MS)
      const decodedToken = this.jwtService.decode(idToken) as any;
      if (!decodedToken || !decodedToken.preferred_username) {
        throw new UnauthorizedException('El id_token no contiene la información del usuario requerida.');
      }

      const emailNormalized = (decodedToken.preferred_username || decodedToken.email || '').toLowerCase().trim();
      const fullName = decodedToken.name || emailNormalized;

      if (!emailNormalized) {
        throw new UnauthorizedException('No se pudo determinar el correo del usuario desde Azure AD.');
      }

      // Aprovisionamiento JIT (Just in Time)
      let user = await this.prisma.user.findUnique({
        where: { email: emailNormalized },
        include: { appRole: true }
      });

      if (!user) {
        // Crear usuario automáticamente
        user = await this.prisma.user.create({
          data: {
            email: emailNormalized,
            fullName: fullName,
            area: 'Por Definir',
            position: 'Por Definir',
          },
          include: { appRole: true }
        });
      }

      // Generar Token JWT interno
      const payload = {
        sub: user.id,
        email: user.email,
        position: user.position,
        area: user.area,
        appRole: user.appRole?.code,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        statusCode: 200,
        message: 'Autenticación exitosa mediante Microsoft Entra ID.',
        accessToken,
        user,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Error procesando la autenticación de Microsoft: ' + error.message);
    }
  }

  // 6. COMPLETAR PERFIL JIT (Azure AD)
  // -------------------------------------------------------------
  async completeProfile(completeProfileDto: CompleteProfileDto) {
    const emailNormalized = completeProfileDto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Actualizar área y cargo
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        area: completeProfileDto.area.trim(),
        position: completeProfileDto.position.trim(),
      },
      include: { appRole: true }
    });

    // Generar nuevo JWT interno con los datos actualizados
    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      position: updatedUser.position,
      area: updatedUser.area,
      appRole: updatedUser.appRole?.code,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      statusCode: 200,
      message: 'Perfil completado exitosamente.',
      accessToken,
      user: updatedUser,
    };
  }
}

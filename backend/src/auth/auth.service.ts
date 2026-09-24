import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyCodeDto } from './dto/verify-code.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // -------------------------------------------------------------
  // 1. REGISTRO DE USUARIOS
  // -------------------------------------------------------------
  async register(registerDto: RegisterDto) {
    const emailNormalized = registerDto.email.toLowerCase().trim();

    // Verificar si el usuario ya existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existingUser) {
      throw new ConflictException(
        'El correo electrónico ya se encuentra registrado.',
      );
    }

    // Hashear la contraseña con bcrypt (10 rondas de sal)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(registerDto.password, saltRounds);

    // Crear usuario con estado inicial isVerified: false
    const newUser = await this.prisma.user.create({
      data: {
        email: emailNormalized,
        password: hashedPassword,
        fullName: registerDto.fullName.trim(),
        area: registerDto.area.trim(),
        position: registerDto.position.trim(),
        isVerified: false,
      },
    });

    const { password, ...userWithoutPassword } = newUser;

    return {
      statusCode: 201,
      message: 'Usuario registrado exitosamente. Procede al inicio de sesión para verificar tu acceso.',
      user: userWithoutPassword,
    };
  }

  // -------------------------------------------------------------
  // 2. INICIO DE SESIÓN - PASO 1 (Validar credenciales y enviar código)
  // -------------------------------------------------------------
  async login(loginDto: LoginDto) {
    const emailNormalized = loginDto.email.toLowerCase().trim();

    // Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales incorrectas.');
    }

    // Generar código seguro de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Expiración a 15 minutos exactos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Eliminar códigos anteriores pendientes para este correo
    await this.prisma.emailVerification.deleteMany({
      where: { email: emailNormalized },
    });

    // Guardar nuevo código de verificación
    await this.prisma.emailVerification.create({
      data: {
        code,
        email: emailNormalized,
        expiresAt,
      },
    });

    // Enviar código por correo (y mostrar en consola)
    await this.mailService.sendVerificationCode(emailNormalized, code);

    return {
      statusCode: 200,
      message:
        'Credenciales válidas. Se ha enviado un código de 6 dígitos a tu correo electrónico.',
      email: emailNormalized,
      expiresInMinutes: 15,
    };
  }

  // -------------------------------------------------------------
  // 3. INICIO DE SESIÓN - PASO 2 (Verificar código y emitir JWT)
  // -------------------------------------------------------------
  async verifyCode(verifyCodeDto: VerifyCodeDto) {
    const emailNormalized = verifyCodeDto.email.toLowerCase().trim();
    const codeEntered = verifyCodeDto.code.trim();

    // Buscar el código en EmailVerification
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        email: emailNormalized,
        code: codeEntered,
      },
    });

    if (!verification) {
      throw new BadRequestException(
        'El código ingresado es incorrecto o no existe.',
      );
    }

    // Verificar expiración (15 minutos)
    if (verification.expiresAt < new Date()) {
      throw new BadRequestException(
        'El código de verificación ha caducado. Por favor solicita uno nuevo.',
      );
    }

    // Buscar el usuario
    const user = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado.');
    }

    // Activar usuario como verificado (isVerified = true)
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true },
      include: { appRole: true },
    });

    // Invalidar el código consumido para que no pueda volver a usarse
    await this.prisma.emailVerification.deleteMany({
      where: { email: emailNormalized },
    });

    // Generar Token JWT de acceso
    const payload = {
      sub: updatedUser.id,
      email: updatedUser.email,
      position: updatedUser.position,
      area: updatedUser.area,
      appRole: updatedUser.appRole?.code,
    };

    const accessToken = this.jwtService.sign(payload);

    const { password, ...userWithoutPassword } = updatedUser;

    return {
      statusCode: 200,
      message: 'Verificación exitosa. Inicio de sesión concedido.',
      accessToken,
      user: userWithoutPassword,
    };
  }

  // -------------------------------------------------------------
  // 4. REENVIAR CÓDIGO DE VERIFICACIÓN
  // -------------------------------------------------------------
  async resendCode(resendCodeDto: ResendCodeDto) {
    const emailNormalized = resendCodeDto.email.toLowerCase().trim();

    // Validar que el usuario exista
    const user = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      throw new NotFoundException(
        'No se encontró ningún usuario registrado con este correo.',
      );
    }

    // Invalidar cualquier código anterior
    await this.prisma.emailVerification.deleteMany({
      where: { email: emailNormalized },
    });

    // Generar un nuevo código de 6 dígitos con 15 minutos de caducidad
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.emailVerification.create({
      data: {
        code: newCode,
        email: emailNormalized,
        expiresAt,
      },
    });

    // Enviar nuevo código por correo y consola
    await this.mailService.sendVerificationCode(emailNormalized, newCode);

    return {
      statusCode: 200,
      message:
        'Se ha enviado un nuevo código de verificación a tu correo. El código anterior ha quedado anulado.',
      email: emailNormalized,
      expiresInMinutes: 15,
    };
  }
  // -------------------------------------------------------------
  // 5. AZURE AD CALLBACK (OAuth2)
  // -------------------------------------------------------------
  async azureCallback(azureCallbackDto: import('./dto/azure-callback.dto').AzureCallbackDto) {
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
        const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
        
        user = await this.prisma.user.create({
          data: {
            email: emailNormalized,
            password: randomPassword,
            fullName: fullName,
            area: 'Por Definir',
            position: 'Por Definir',
            isVerified: true, // Ya viene verificado por Microsoft
          },
          include: { appRole: true }
        });
      } else if (!user.isVerified) {
        // Si existía pero no estaba verificado, lo verificamos porque MS avala el login
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { isVerified: true },
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
      const { password, ...userWithoutPassword } = user;

      return {
        statusCode: 200,
        message: 'Autenticación exitosa mediante Microsoft Entra ID.',
        accessToken,
        user: userWithoutPassword,
      };
    } catch (error: any) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new UnauthorizedException('Error procesando la autenticación de Microsoft: ' + error.message);
    }
  }

  // -------------------------------------------------------------
  // 6. COMPLETAR PERFIL JIT (Azure AD)
  // -------------------------------------------------------------
  async completeProfile(completeProfileDto: CompleteProfileDto) {
    const emailNormalized = completeProfileDto.email.toLowerCase().trim();

    // Buscar usuario
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
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      statusCode: 200,
      message: 'Perfil completado exitosamente.',
      accessToken,
      user: userWithoutPassword,
    };
  }
}

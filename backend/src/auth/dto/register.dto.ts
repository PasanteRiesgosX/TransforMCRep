import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
  email: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La contraseña es requerida.' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  password: string;

  @IsString({ message: 'El nombre completo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El nombre completo es requerido.' })
  fullName: string;

  @IsString({ message: 'El área de trabajo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El área de trabajo es requerida.' })
  area: string;

  @IsString({ message: 'El rol o cargo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El rol o cargo es requerido.' })
  role: string;
}

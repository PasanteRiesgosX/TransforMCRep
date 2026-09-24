import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CompleteProfileDto {
  @IsEmail({}, { message: 'El correo electrónico no es válido.' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido.' })
  email: string;

  @IsString({ message: 'El área debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El área es requerida.' })
  area: string;

  @IsString({ message: 'El cargo debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El cargo es requerido.' })
  position: string;
}

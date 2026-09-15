import { IsNotEmpty, IsString } from 'class-validator';

export class AzureCallbackDto {
  @IsNotEmpty({ message: 'El código de autorización es requerido' })
  @IsString({ message: 'El código debe ser una cadena de texto' })
  code: string;
}

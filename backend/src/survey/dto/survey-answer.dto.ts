import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SurveyAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  selectedOptionId?: string | null;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  numericValue?: number | null;

  @IsOptional()
  @IsString()
  textValue?: string | null;
}

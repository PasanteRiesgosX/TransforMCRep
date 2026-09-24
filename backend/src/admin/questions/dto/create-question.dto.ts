import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, ValidateIf, IsArray, ValidateNested, ArrayMinSize, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionOptionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  value: number;

  @IsNumber()
  orderIndex: number;

  @IsBoolean()
  @IsOptional()
  isPassing?: boolean;
}

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsIn(['MULTIPLE_CHOICE', 'SLIDER'])
  type: string;

  @IsString()
  @IsOptional()
  dimension?: string;

  @IsString()
  @IsOptional()
  rubricCategory?: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  weight: number;

  @IsBoolean()
  isGate: boolean;

  @IsBoolean()
  @IsOptional()
  scoreEligible?: boolean;

  @IsNumber()
  orderIndex: number;

  // Options for MULTIPLE_CHOICE
  @ValidateIf(o => o.type === 'MULTIPLE_CHOICE')
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  // Slider props
  @ValidateIf(o => o.type === 'SLIDER')
  @IsNumber()
  @Min(1)
  minValue?: number;

  @ValidateIf(o => o.type === 'SLIDER')
  @IsNumber()
  @Max(10)
  maxValue?: number;

  @ValidateIf(o => o.type === 'SLIDER')
  @IsNumber()
  @Min(1)
  stepValue?: number;

  @ValidateIf(o => o.type === 'SLIDER')
  @IsString()
  @IsOptional()
  minLabel?: string;

  @ValidateIf(o => o.type === 'SLIDER')
  @IsString()
  @IsOptional()
  maxLabel?: string;

  @ValidateIf(o => o.type === 'SLIDER' && o.isGate === true)
  @IsNumber()
  @IsOptional()
  passingValue?: number;
}

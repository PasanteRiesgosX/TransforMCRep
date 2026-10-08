import { Type } from 'class-transformer';
import { IsArray, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';
import { SurveyAnswerDto } from './survey-answer.dto';

export class SurveyProgressDto {
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(0)
  currentPage?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SurveyAnswerDto)
  answers?: SurveyAnswerDto[];
}

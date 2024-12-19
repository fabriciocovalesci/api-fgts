import { IsArray, IsInt, IsNumber, IsString, Min, Max, IsOptional } from 'class-validator';

export class RequestDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  cpfList?: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  delay?: number;

  @IsNumber()
  @Min(1)
  @IsOptional()
  timeout: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  rateLimitPoints: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  rateLimitDuration: number;

  @IsString()
  @IsOptional()
  productName?: string;
}

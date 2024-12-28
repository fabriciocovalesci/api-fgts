import { IsArray, IsInt, IsNumber, IsString, Min, Max, IsOptional, IsObject } from 'class-validator';

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
  timeout?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  rateLimitPoints?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  rateLimitDuration?: number;

  @IsString()
  @IsOptional()
  productName?: string;

  @IsString()
  @IsOptional()
  productId?: string;

  @IsNumber()
  @IsOptional()
  minimumInterestRate?: number;

  @IsObject()
  @IsOptional()
  schedule?: {
    startDate: string;
    endDate: string;
  };

  @IsInt()
  @IsOptional()
  teimosinha?: number;
}


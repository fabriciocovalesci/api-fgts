import { IsArray, IsInt, IsNumber, IsString, Min, Max, IsOptional } from 'class-validator';

export class CreateUserDto {

    @IsString()
    username: string;
    
    @IsString()
    email: string;
    
    @IsString()
    password: string;
}
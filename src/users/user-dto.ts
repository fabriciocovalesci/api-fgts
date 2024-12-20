import { IsArray, IsInt, IsNumber, IsString, Min, Max, IsOptional, IsMongoId } from 'class-validator';

export class CreateUserDto {

    @IsMongoId()
    @IsOptional()
    _id?: string;

    @IsString()
    username: string;
    
    @IsString()
    email: string;
    
    @IsString()
    password: string;
}
import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
    @ApiProperty({
        description: 'Username do usuário',
        minLength: 4,
        maxLength: 20,
        required: false,
        example: 'johndoe'
    })
    @IsOptional()
    @IsString({ message: 'Username deve ser uma string' })
    @MinLength(4, { message: 'Username deve ter no mínimo 4 caracteres' })
    @MaxLength(20, { message: 'Username deve ter no máximo 20 caracteres' })
    @Transform(({ value }) => value?.trim())
    username?: string;

    @ApiProperty({
        description: 'Senha do usuário',
        minLength: 8,
        required: false,
        example: 'Test@123'
    })
    @IsOptional()
    @IsString({ message: 'Senha deve ser uma string' })
    @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
    @Transform(({ value }) => value?.trim())
    password?: string;
}
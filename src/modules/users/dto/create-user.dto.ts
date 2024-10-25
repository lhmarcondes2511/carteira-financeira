import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({
        description: 'Username do usuário',
        minLength: 4,
        maxLength: 20,
        example: 'johndoe'
    })
    @IsString({ message: 'Username deve ser uma string' })
    @MinLength(4, { message: 'Username deve ter no mínimo 4 caracteres' })
    @MaxLength(20, { message: 'Username deve ter no máximo 20 caracteres' })
    username: string;

    @ApiProperty({
        description: 'Senha do usuário',
        minLength: 8,
        example: 'Test@123'
    })
    @IsString({ message: 'Senha deve ser uma string' })
    @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message: 'Senha deve conter pelo menos 8 caracteres, uma letra maiúscula, uma minúscula, um número e um caractere especial'
        }
    )
    password: string;
}
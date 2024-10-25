import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { IsStrongPassword } from '../../../utils/validators';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    username: string;

    @IsString()
    @IsNotEmpty()
    @IsStrongPassword()
    password: string;
}
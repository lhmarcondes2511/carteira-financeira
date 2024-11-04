import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    @ApiOperation({ summary: 'Registrar um novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário registrado com sucesso.' })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    @ApiBody({
        type: RegisterDto,
        description: 'Dados de registro do usuário',
        examples: {
            user: {
                value: {
                    username: 'johndoe',
                    password: 'Senha@123'
                }
            }
        }
    })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Autenticar usuário' })
    @ApiResponse({ status: 200, description: 'Usuário autenticado com sucesso.' })
    @ApiResponse({ status: 401, description: 'Credenciais inválidas.' })
    @ApiBody({
        type: LoginDto,
        description: 'Credenciais de login do usuário',
        examples: {
            user: {
                value: {
                    username: 'johndoe',
                    password: 'Senha@123'
                }
            }
        }
    })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }
}
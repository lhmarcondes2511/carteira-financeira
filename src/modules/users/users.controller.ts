import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';

@ApiTags('Usuários')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @ApiOperation({ summary: 'Criar um novo usuário' })
    @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.', type: UserDto })
    @ApiResponse({ status: 400, description: 'Dados inválidos.' })
    @ApiBody({
        type: CreateUserDto,
        examples: {
            user: {
                value: {
                    username: 'johndoe',
                    password: 'Senha@123'
                }
            }
        }
    })
    create(@Body() createUserDto: CreateUserDto): Promise<UserDto> {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos os usuários' })
    @ApiResponse({ status: 200, description: 'Lista de usuários retornada com sucesso.', type: [UserDto] })
    findAll(): Promise<UserDto[]> {
        return this.usersService.findAll();
    }

    @Get('profile')
    @ApiOperation({ summary: 'Obter perfil do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil do usuário retornado com sucesso.', type: UserDto })
    getProfile(@Request() req): Promise<UserDto> {
        return this.usersService.findOne(req.user.userId);
    }

    @Patch('profile')
    @ApiOperation({ summary: 'Atualizar perfil do usuário autenticado' })
    @ApiResponse({ status: 200, description: 'Perfil do usuário atualizado com sucesso.', type: UserDto })
    @ApiBody({
        type: UpdateUserDto,
        examples: {
            update: {
                value: {
                    username: 'johndoe',
                    password: 'Senha@123'
                }
            }
        }
    })
    updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto): Promise<UserDto> {
        return this.usersService.update(req.user.userId, updateUserDto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obter um usuário específico' })
    @ApiResponse({ status: 200, description: 'Usuário retornado com sucesso.', type: UserDto })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
    @ApiParam({ name: 'id', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' })
    findOne(@Param('id') id: string): Promise<UserDto> {
        return this.usersService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Atualizar um usuário específico' })
    @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.', type: UserDto })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
    @ApiParam({ name: 'id', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiBody({
        type: UpdateUserDto,
        examples: {
            update: {
                value: {
                    username: 'johndoe',
                    password: 'Senha@123'
                }
            }
        }
    })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserDto> {
        return this.usersService.update(id, updateUserDto);
    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remover um usuário' })
    @ApiResponse({ status: 204, description: 'Usuário removido com sucesso.' })
    @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
    @ApiParam({ name: 'id', type: 'string', example: '123e4567-e89b-12d3-a456-426614174000' })
    remove(@Param('id') id: string): Promise<void> {
        return this.usersService.remove(id);
    }
}
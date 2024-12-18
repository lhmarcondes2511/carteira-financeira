import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const user = await this.usersService.create(registerDto);
        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async login(loginDto: LoginDto) {
        try {
            const user = await this.usersService.findByUsername(loginDto.username);
            const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
            
            if (!isPasswordValid) {
                throw new UnauthorizedException('Invalid credentials');
            }

            const payload = { username: user.username, sub: user.id };
            return {
                access_token: this.jwtService.sign(payload),
            };
        } catch (error) {
            throw new UnauthorizedException('Invalid credentials');
        }
    }

    async validateUser(username: string, password: string): Promise<any> {
        try {
            const user = await this.usersService.findByUsername(username);
            if (user && await bcrypt.compare(password, user.password)) {
                const { password, ...result } = user;
                return result;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}
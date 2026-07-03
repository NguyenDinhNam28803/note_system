import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { RegisterUserDto, LoginUserDto, RefreshTokenDto } from './dto/auth-dto';
import { JwtUtilsService } from './jwt.service';
import { HashPasswordService } from './hashpassword.service';
import { UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtUtilsService,
        private readonly hashPasswordService: HashPasswordService
    ) { }
    async register(data: RegisterUserDto) {
        const userExsit = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (userExsit) {
            throw new UnauthorizedException('Email đã tồn tại');
        }
        const hashPassword = await this.hashPasswordService.hash(data.password);
        const user = await this.prisma.user.create({
            data: {
                email: data.email,
                password: hashPassword,
                name: data.name,
            },
        });
        return this.login({
            email: user.email,
            password: data.password,
        });
    }
    async login(data: LoginUserDto) {
        const user = await this.prisma.user.findUnique({ where: { email: data.email } });
        if (!user) {
            throw new UnauthorizedException('Email không tồn tại');
        }
        const CheckPassword = await this.hashPasswordService.compare(data.password, user.password);
        if (!CheckPassword) {
            throw new UnauthorizedException('Mật khẩu không chính xác');
        }
        const { accessToken, refreshToken } = this.jwtService.sign({ sub: user.id.toString(), email: user.email });
        return {
            user: { id: user.id, email: user.email, username: user.name },
            tokens: { accessToken, refreshToken }
        };
    }
    async refresh(refreshToken: string) {
        //TODO: implement refresh
    }
    async logout(refreshToken: string) {
        //TODO: implement logout
    }

}

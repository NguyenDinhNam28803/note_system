import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { RegisterUserDto, LoginUserDto } from './dto/auth-dto';
import { JwtUtilsService } from './jwt.service';
import { HashPasswordService } from './hashpassword.service';
import type { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtUtilsService,
    private readonly hashPasswordService: HashPasswordService,
  ) {}

  async register(data: RegisterUserDto) {
    const userExist = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (userExist) {
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
    return this.login({ email: user.email, password: data.password });
  }

  async login(data: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    const checkPassword = await this.hashPasswordService.compare(
      data.password,
      user.password,
    );
    if (!checkPassword) {
      throw new UnauthorizedException('Mật khẩu không chính xác');
    }
    const tokens = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      user: { id: user.id, email: user.email, name: user.name },
      tokens,
    };
  }

  /** Cấp cặp token mới từ một refresh token hợp lệ. */
  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verifyRefresh(refreshToken);
    } catch {
      throw new UnauthorizedException(
        'Refresh token không hợp lệ hoặc đã hết hạn',
      );
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }
    const tokens = this.jwtService.sign({ sub: user.id, email: user.email });
    return { tokens };
  }

  /**
   * JWT là stateless: server không lưu token, nên logout = client tự xoá token.
   * Muốn thu hồi token phía server cần lưu refresh token vào DB (chưa triển khai).
   */
  logout(_refreshToken: string) {
    return { message: 'Đăng xuất thành công' };
  }
}

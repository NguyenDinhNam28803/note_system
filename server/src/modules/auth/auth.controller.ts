import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterUserDto, LoginUserDto, RefreshTokenDto } from './dto/auth-dto';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ResponseMessage('Đăng ký thành công')
  @ApiOperation({
    summary: 'Đăng ký',
    description: 'Đăng ký tài khoản mới trong hệ thống',
  })
  async register(@Body() registerDto: RegisterUserDto) {
    return await this.authService.register(registerDto);
  }

  @Post('login')
  @ResponseMessage('Đăng nhập thành công')
  @ApiOperation({
    summary: 'Đăng nhập',
    description: 'Đăng nhập vào hệ thống',
  })
  async login(@Body() loginDto: LoginUserDto) {
    return await this.authService.login(loginDto);
  }

  @Post('refresh')
  @ResponseMessage('Làm mới token thành công')
  @ApiOperation({
    summary: 'Làm mới token',
    description: 'Cấp access token mới từ refresh token',
  })
  async refresh(@Body() dto: RefreshTokenDto) {
    return await this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ResponseMessage('Đăng xuất thành công')
  @ApiOperation({ summary: 'Đăng xuất', description: 'Đăng xuất khỏi hệ thống' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }
}

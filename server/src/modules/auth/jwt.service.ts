import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { JwtPayload } from "./interfaces/jwt-payload.interface";
import type { AuthTokens } from "./dto/token";

@Injectable()
export class JwtUtilsService {
    constructor(private readonly jwtService: JwtService) { }
    sign(payload: JwtPayload): AuthTokens {
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
        return { accessToken, refreshToken };
    }
    verify(token: string): JwtPayload {
        return this.jwtService.verify(token);
    }
    saveToken(userId: string, refreshToken: string) {
        const token = this.jwtService.sign({ userId, refreshToken });
        return token;
    }
}

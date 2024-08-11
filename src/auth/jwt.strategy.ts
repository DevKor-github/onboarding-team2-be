import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'secretKey', // 추후 환경변수로 설정 예정
    });
  }

  async validate(payload: any) {
    // payload에서 사용자 정보를 추출 후, 추가 검증을 수행 예정
    return { userId: payload.userId, username: payload.sub };
  }
}

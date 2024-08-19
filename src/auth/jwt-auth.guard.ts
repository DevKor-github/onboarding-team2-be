import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { WsException } from '@nestjs/websockets';
import { CustomSocket } from '../chat/gateway/chat.gateway.interface';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  private logger: Logger = new Logger(WsJwtAuthGuard.name);

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: CustomSocket = context.switchToWs().getClient();
    const authToken = client.handshake?.headers?.authorization;

    if (!authToken) {
      this.logger.warn('Missing authorization token');
      throw new WsException('Missing authorization token');
    }

    const token = authToken.split(' ')[1];
    if (!token) {
      this.logger.warn('Malformed authorization token');
      throw new WsException('Malformed authorization token');
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'secretKey',
      });
      client.user = payload;
      return true;
    } catch (err) {
      this.logger.error('Invalid or expired token', err.stack);
      throw new WsException('Invalid or expired token');
    }
  }
}

import { Socket } from 'socket.io';
import { JwtTokenDto } from 'src/auth/jwt.dto';

export interface CustomSocket extends Socket {
  user: JwtTokenDto;
}

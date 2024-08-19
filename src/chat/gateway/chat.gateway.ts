import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from '../chat.service';
import { Injectable, Logger, UseGuards } from '@nestjs/common';
import { ChatUserDto, SendMessageDto } from '../dtos/chat.dto';
import { WsJwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CustomSocket } from './chat.gateway.interface';
import { MarkAsReadAndUnreadMessagesReqDto } from './chat.gateway.dto';

@Injectable()
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: (req, callback) => {
      const allowedOrigin = process.env.CORS_ORIGIN || '*';
      callback(null, allowedOrigin);
    },
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}
  private logger: Logger = new Logger(ChatGateway.name);
  private clients: Map<string, CustomSocket> = new Map(); // 소켓 연결된 클라이언트 추적

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    this.logger.log('서버 시작');

    // setInterval(() => {
    //   this.checkInactiveClients();
    // }, 240000); // 240,000ms = 4분
  }

  @UseGuards(WsJwtAuthGuard)
  handleConnection(client: CustomSocket) {
    this.clients.set(client.id, client);
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: CustomSocket) {
    this.clients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() message: SendMessageDto,
    @ConnectedSocket() client: CustomSocket
  ) {
    try {
      // 모든 클라이언트에게 저장된 메시지 브로드캐스트
      const sendedMessage = await this.chatService.sendMessage(message);
      this.server
        .to(`room-${message.roomId}`)
        .emit('sendMessage', sendedMessage);

      // 새로운 메세지를 보낸 채팅방의 읽지 않은 메세지 수 브로드캐스트
      const unreadCount = await this.chatService.getUnreadMessageCount({
        roomId: message.roomId,
        userId: client.user._id,
      });
      this.server
        .to(`room-${message.roomId}`)
        .emit('chatUnreadCount', unreadCount);
    } catch {
      throw new WsException('Error with sending message');
    }
  }

  // 클라이언트가 메시지를 읽었다고 서버에 알리는 이벤트
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('readMessage')
  async handleReadMessage(
    @MessageBody() readInfo: MarkAsReadAndUnreadMessagesReqDto,
    @ConnectedSocket() client: CustomSocket
  ) {
    try {
      const id = client.user._id; // 여기서 사용자 정보
      const data = { ...readInfo, userId: id };

      // 메세지 읽음 처리 후 각 메세지 별 읽지 않은 사람 수 정보를 해당 채팅방으로 브로드캐스트
      await this.chatService.markMessagesAsRead(data);
      const counts = await this.chatService.getUnreadCountForMessages(data);

      this.server.to(`room-${data.roomId}`).emit('messageRead', counts);
    } catch {
      throw new WsException('Error with read message');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() joinInfo: ChatUserDto,
    @ConnectedSocket() client: CustomSocket
  ) {
    try {
      await this.chatService.joinChat(joinInfo);
      client.join(`room-${joinInfo.roomId}`);
      this.server.to(String(joinInfo.roomId)).emit('userJoined', joinInfo);
    } catch {
      throw new WsException('Error with joining');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() leaveInfo: ChatUserDto,
    @ConnectedSocket() client: CustomSocket
  ) {
    try {
      client.leave(`room-${leaveInfo.roomId}`);
      this.server.to(`room-${leaveInfo.roomId}`).emit('userLeft', leaveInfo);
    } catch {
      throw new WsException('Error with leaving');
    }
  }
}

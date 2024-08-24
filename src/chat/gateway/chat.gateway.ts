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
import { ChatUserDto, UnreadChatReqDto } from '../dtos/chat.dto';
import { WsJwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CustomSocket } from './chat.gateway.interface';
import {
  MarkAsReadAndUnreadMessagesReqDto,
  WsSendMessageDto,
} from './chat.gateway.dto';
import { Types } from 'mongoose';

@Injectable()
@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: (_, callback) => {
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
    this.logger.log(server, '서버 시작');

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
    @MessageBody() message: WsSendMessageDto,
    @ConnectedSocket() client: CustomSocket
  ) {
    try {
      const userId: Types.ObjectId = client.user._id;
      const data = { ...message, senderId: userId };

      // 모든 클라이언트에게 저장된 메시지 브로드캐스트
      const sendedMessage = await this.chatService.sendMessage(data);
      this.server
        .to(`room-${message.roomId}`)
        .emit('MessageSend', sendedMessage);

      // 새로운 메세지를 보낸 채팅방의 읽지 않은 메세지 수를 다시 계산하라고 브로드캐스트
      this.server.to(`room-${message.roomId}`).emit('chatUnreadCount');
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

      // messageRead가 오면 클라이언트에서 몇 명이 각각의 메세지를 읽지 않았는지 계산하는 이벤트 송신
      this.server.to(`room-${data.roomId}`).emit('messageRead', counts);
    } catch {
      throw new WsException('Error with read message');
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('unreadMessages')
  async handleUnreadMessage(
    @MessageBody() unreadInfo: UnreadChatReqDto,
    @ConnectedSocket() client: CustomSocket
  ) {
    try {
      const userId = client.user._id;
      const data = { ...unreadInfo, userId: userId };
      const counts = await this.chatService.getUnreadMessageCount(data);

      client.emit('chatUnreadCount', counts);
    } catch {
      throw new WsException('Error with count unread messages');
    }
  }

  /**
   * 이미 참여 중인 채팅방 서버에 입장할 때
   * @param joinInfo
   * @param client
   */
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() joinInfo: ChatUserDto,
    @ConnectedSocket() client: CustomSocket
  ) {
    try {
      client.join(`room-${joinInfo.roomId}`);
      this.server.to(`room-${joinInfo.roomId}`).emit('userJoined', joinInfo);
    } catch {
      throw new WsException('Error with joining');
    }
  }

  /**
   * 사용자가 새로운 채팅방 입장할 때
   * @param joinInfo
   * @param client
   */
  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('newlyJoinRoom')
  async handleNewlyJoinRoom(
    @MessageBody() joinInfo: ChatUserDto,
    @ConnectedSocket() client: CustomSocket
  ) {
    try {
      await this.chatService.joinChat(joinInfo);
      client.join(`room-${joinInfo.roomId}`);
      this.server.to(`room-${joinInfo.roomId}`).emit('newUserJoined', joinInfo);
    } catch {
      throw new WsException('Error with new joining');
    }
  }

  /**
   * 채팅방에서 탈퇴할 때 (단순 뒤로가기 X)
   * @param leaveInfo
   * @param client
   */
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

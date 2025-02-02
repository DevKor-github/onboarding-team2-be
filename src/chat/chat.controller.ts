import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiParam, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ChatUserDto,
  CreateRoomDto,
  GetChatReqDto,
  GetMessageDto,
  MarkMessagesAsReadDto,
  SendMessageDto,
  ChatResDto,
  UnreadChatReqDto,
  UnreadChatResDto,
  UnreadMessageReqDto,
  UnreadMessageResDto,
  GetMessageResDto,
} from './dtos/chat.dto';
import { ChatService } from './chat.service';
import { RoomDocument } from './schemas/room.schemas';
import { UserService } from 'src/user/user.service';
import { ChatDocument } from './schemas/chat.schema';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(
    private chatService: ChatService,
    private userService: UserService
  ) {}
  private logger: Logger = new Logger(ChatController.name);

  @Post('create-chat')
  @ApiTags('Chat')
  @ApiBody({ type: CreateRoomDto })
  async createChat(@Body() req: CreateRoomDto): Promise<RoomDocument> {
    return this.chatService.createRoom(req);
  }

  @Post('unread-chat')
  @ApiTags('Chat')
  @ApiBody({ type: [UnreadChatReqDto] })
  async unreadChat(
    @Body() body: UnreadChatReqDto[],
    @Request() req
  ): Promise<UnreadChatResDto[]> {
    const userId = req.user._id;
    let result = [] as UnreadChatResDto[];
    for (const room of body) {
      const roomId = room.roomId;
      const counts = await this.chatService.getUnreadMessageCount({
        roomId: roomId,
        userId: userId,
      });
      result.push({ roomId: roomId, counts: counts });
    }
    return result;
  }

  @Get('room/get/:roomId&:limit')
  @ApiTags('Chat Room')
  @ApiParam({
    name: 'roomId',
    type: String,
  })
  @ApiParam({
    name: 'offset',
    type: Number,
  })
  @ApiParam({
    name: 'limit',
    type: Number,
  })
  async getMessage(@Param() query: GetMessageDto): Promise<GetMessageResDto[]> {
    const messages = await this.chatService.getMessages(query);
    const result = await Promise.all(
      messages.map(async (message: ChatDocument) => {
        const sender = await this.userService.findOne(message.senderId);
        const senderName = sender.username;
        return {
          _id: message._id,
          roomId: message.roomId,
          senderId: message.senderId,
          senderName: senderName,
          message: message.message,
          createdAt: message.createdAt,
        } as GetMessageResDto;
      })
    );
    return result;
  }

  @Post('room/send')
  @ApiTags('Chat Room')
  @ApiBody({ type: SendMessageDto })
  async send(@Body() req: SendMessageDto): Promise<ChatDocument> {
    return this.chatService.sendMessage(req);
  }

  @Post('room/join')
  @ApiTags('Chat Room')
  @ApiBody({ type: ChatUserDto })
  async join(@Body() body: ChatUserDto): Promise<RoomDocument> {
    this.userService.joinChat(body);
    return this.chatService.joinChat(body);
  }

  @Post('room/leave')
  @ApiTags('Chat Room')
  @ApiBody({ type: ChatUserDto })
  async leave(@Body() body: ChatUserDto): Promise<RoomDocument> {
    this.userService.leaveChat(body);
    return this.chatService.leaveChat(body);
  }

  @Post('room/unread-chat')
  @ApiTags('Chat Room')
  @ApiBody({ type: UnreadMessageReqDto })
  async unreadMessage(
    @Body() req: UnreadMessageReqDto
  ): Promise<UnreadMessageResDto> {
    return this.chatService.getUnreadCountForMessages(req);
  }

  @Post('room/read-message')
  @ApiTags('Chat Room')
  @ApiBody({ type: MarkMessagesAsReadDto })
  async markMessageAsRead(
    @Body() body: MarkMessagesAsReadDto,
    @Request() req
  ): Promise<RoomDocument> {
    const userId = req.user._id;
    const data = { ...body, userId };
    return this.chatService.markMessagesAsRead(data);
  }

  @Get('room/total-chat/:offset&:limit')
  @ApiTags('Chat Room')
  @ApiParam({
    name: 'offset',
    type: Number,
  })
  @ApiParam({
    name: 'limit',
    type: Number,
  })
  async getTotalChat(@Param() query: GetChatReqDto): Promise<ChatResDto[]> {
    return await this.chatService.getTotalChat(query);
  }

  @Get('room/joined-chat/:offset&:limit')
  @ApiTags('Chat Room')
  @ApiParam({
    name: 'offset',
    type: Number,
  })
  @ApiParam({
    name: 'limit',
    type: Number,
  })
  async getJoinedChat(
    @Param() query: GetChatReqDto,
    @Request() req
  ): Promise<ChatResDto[]> {
    const userId = req.user._id;
    const roomIds = (await this.userService.findOne(userId)).chats;
    return await this.chatService.getJoinChat(roomIds, query);
  }
}

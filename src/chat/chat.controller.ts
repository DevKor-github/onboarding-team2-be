import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  RawBody,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import {
  ChatUserDto,
  CreateRoomDto,
  GetMessageDto,
  MarkMessagesAsReadDto,
  SendMessageDto,
  UnreadChatReqDto,
  UnreadChatResDto,
  UnreadMessageReqDto,
  UnreadMessageResDto,
} from './dtos/chat.dto';
import { ChatDocument } from './schemas/chat.schema';
import { ChatService } from './chat.service';
import { Room, RoomDocument } from './schemas/room.schemas';
import { Types } from 'mongoose';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

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
    name: 'limit',
    type: Number,
  })
  async getMessage(@Param() query: GetMessageDto) {
    return this.chatService.getMessages(query);
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
  async join(@Body() req: ChatUserDto): Promise<RoomDocument> {
    return this.chatService.joinChat(req);
  }

  @Post('room/leave')
  @ApiTags('Chat Room')
  @ApiBody({ type: ChatUserDto })
  async leave(@Body() req: ChatUserDto): Promise<RoomDocument> {
    return this.chatService.leavChat(req);
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
}

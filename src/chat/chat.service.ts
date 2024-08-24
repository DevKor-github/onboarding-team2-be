import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schemas';
import {
  ChatUserDto,
  CreateRoomDto,
  GetChatReqDto,
  GetMessageDto,
  SendMessageDto,
  ChatResDto,
  UnreadMessageReqDto,
  UnreadMessageResDto,
} from './dtos/chat.dto';

interface MarkMessagesAsRead {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
  lastMessageId: Types.ObjectId;
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>
  ) {}
  private logger: Logger = new Logger(ChatService.name);

  async createRoom(data: CreateRoomDto): Promise<RoomDocument> {
    const { creator, isGroup, name, tags } = data;
    const room = await this.roomModel.create({
      participants: [creator],
      name: name,
      isGroup: isGroup,
      tags: tags,
      createdAt: new Date(),
      lastReadMessage: { creator: null },
    });
    return await room.save();
  }

  async joinChat(data: ChatUserDto): Promise<RoomDocument> {
    const { roomId, userId } = data;
    const room = await this.roomModel.findById(roomId);
    room.participants.push(userId);
    const id: string = userId as any;
    room.lastReadMessage.set(id, null);
    return room.save();
  }

  async leaveChat(data: ChatUserDto): Promise<RoomDocument> {
    const { roomId, userId } = data;
    const room = await this.roomModel.findOne({ _id: roomId });
    room.participants = room.participants.filter((user) => {
      if (user !== userId) return user;
    });
    const id: string = userId as any;
    room.lastReadMessage.delete(id);
    return room.save();
  }

  /**
   * 채팅방 입장 시 정해진 개수만큼 채팅 불러오기
   * @param roomId
   * @param limit
   * @returns chats
   */
  async getMessages(data: GetMessageDto): Promise<ChatDocument[]> {
    const { roomId, limit } = data;
    const chats = await this.chatModel
      .find({ roomId: roomId })
      .sort({ createdAt: 'descending' })
      .limit(limit)
      .exec();
    return chats;
  }

  async markMessagesAsRead(message: MarkMessagesAsRead): Promise<RoomDocument> {
    const { roomId, userId, lastMessageId } = message;
    const room = await this.roomModel.findById(roomId);
    const lastReadMessage = room.lastReadMessage;
    const id: string = userId as any;
    lastReadMessage.set(id, lastMessageId);
    room.lastReadMessage = lastReadMessage;
    return room.save();
  }

  async getUnreadMessageCount(data: ChatUserDto): Promise<number> {
    const { roomId, userId } = data;
    const room = await this.roomModel.findById(roomId).exec();
    const id: string = userId as any;
    const lastReadMessageId = room.lastReadMessage.get(id);
    if (!lastReadMessageId) {
      const unreadCount = await this.chatModel
        .countDocuments({
          roomId, // 읽은 message가 없다면
        })
        .exec();
      return unreadCount;
    }
    const unreadCount = await this.chatModel
      .countDocuments({
        roomId,
        _id: { $gt: lastReadMessageId }, // ObjectId 비교를 통해 계산
      })
      .exec();

    // 사용자가 마지막으로 읽은 메시지 이후의 메시지 개수 계산
    return unreadCount;
  }

  /**
   * 각 채팅방 별 읽지 않은 메세지 수
   * @param roomId
   * @param limit
   * @returns unreadCounts
   */
  async getUnreadCountForMessages(
    data: UnreadMessageReqDto
  ): Promise<UnreadMessageResDto> {
    const { roomId, limit } = data;
    const room = await this.roomModel.findById(roomId).exec();

    const messages = await this.chatModel
      .find({ roomId: roomId })
      .sort({ createdAt: 'descending' })
      .limit(limit)
      .exec();

    const unreadCounts: { [messageId: string]: number } = {};

    // 방의 참여자 정보와 각 참여자의 마지막 읽은 메시지를 확인
    for (const message of messages) {
      let unreadCount = 0;

      for (const user of room.participants) {
        // 사용자의 마지막 읽은 메시지 ID
        const id: string = user as any;
        const lastReadMessageId = room.lastReadMessage.get(id);

        // lastReadMessageId가 없거나 현재 메시지 ID보다 이전이면 아직 읽지 않음
        if (
          !lastReadMessageId ||
          (message._id as Types.ObjectId) > lastReadMessageId
        ) {
          unreadCount++;
        }
      }

      // 메시지별로 읽지 않은 사람 수를 기록
      unreadCounts[message._id as string] = unreadCount;
    }
    return unreadCounts;
  }

  async sendMessage(sended: SendMessageDto): Promise<ChatDocument> {
    sended = {
      ...sended,
      createdAt: new Date(),
    } as ChatDocument;
    const chat = await this.chatModel.create(sended);
    await this.markMessagesAsRead({
      roomId: sended.roomId,
      userId: sended.senderId,
      lastMessageId: chat._id as Types.ObjectId,
    } as MarkMessagesAsRead).then((room) => room.save());
    return chat.save();
  }

  async getTotalChat(data: GetChatReqDto): Promise<ChatResDto[]> {
    const { offset, limit } = data;
    const rooms = await this.roomModel.find().skip(offset).limit(limit);
    const result = await Promise.all(
      rooms.map(async (room) => {
        const lastMsgSent = (
          await this.chatModel
            .findById(room._id)
            .sort({ createdAt: 'descending' })
            .limit(1)
        ).createdAt;
        return {
          roomId: room._id,
          name: room.name,
          tags: room.tags,
          size: room.participants.length,
          lastMsgSent: lastMsgSent,
        } as ChatResDto;
      })
    );
    return result;
  }

  async getJoinChat(
    roomIds: Types.ObjectId[],
    data: GetChatReqDto
  ): Promise<ChatResDto[]> {
    const { offset, limit } = data;
    const result = await Promise.all(
      roomIds.map(async (roomId) => {
        const lastMsgSent = await this.chatModel
          .findOne({ roomId: roomId })
          .sort({ createdAt: 'descending' })
          .limit(1);
        this.logger.log(lastMsgSent);
        const room = await this.roomModel
          .findById(roomId)
          .skip(offset)
          .limit(limit);
        return {
          roomId: room._id,
          name: room.name,
          tags: room.tags,
          size: room.participants.length,
          lastMsgSent: lastMsgSent.createdAt,
        } as ChatResDto;
      })
    );
    return result;
  }
}

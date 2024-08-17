import { Injectable, Type } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Chat, ChatDocument } from './schemas/chat.schema';
import { Model, Types } from 'mongoose';
import { Room, RoomDocument } from './schemas/room.schemas';
import {
  ChatUserDto,
  CreateRoomDto,
  GetMessageDto,
  MarkMessagesAsReadDto,
  SendMessageDto,
  UnreadMessageReqDto,
  UnreadMessageResDto,
} from './dtos/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
    @InjectModel(Room.name) private roomModel: Model<RoomDocument>
  ) {}

  /**
   *
   * @param data
   * @
   * @returns
   */
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
    await room.save();
    return room;
  }

  async participateChat(data: ChatUserDto): Promise<RoomDocument> {
    const { roomId, userId } = data;
    const room = await this.roomModel.findOne({ _id: roomId });
    await room.participants.push(userId);
    await room.lastReadMessage.set(userId, null);
    await room.save();
    return room;
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
      .sort({ createdAt: 'ascending' })
      .limit(limit)
      .exec();
    console.log(chats);
    return chats;
  }

  async markMessagesAsRead(
    message: MarkMessagesAsReadDto
  ): Promise<RoomDocument> {
    const { roomId, userId, lastMessageId } = message;
    const room = await this.roomModel.findById(roomId);
    room.lastReadMessage.set(userId, lastMessageId);
    return await room.save();
  }

  async getUnreadMessageCount(
    roomId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<number> {
    const room = await this.roomModel.findById(roomId).exec();
    const lastReadMessageId = room.lastReadMessage.get(userId);
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
   * @returns unreadCounts
   */
  async getUnreadCountForMessages(
    data: UnreadMessageReqDto
  ): Promise<UnreadMessageResDto> {
    const roomId = data.roomId;
    const room = await this.roomModel
      .findById(roomId)
      .populate('participants')
      .exec();

    // 해당 방에 존재하는 모든 메시지들을 가져옴
    const messages = await this.chatModel
      .find({ roomId })
      .sort({ createdAt: 'ascending' })
      .exec();

    // 메시지별로 읽지 않은 사람 수를 저장할 객체
    const unreadCounts: { [messageId: string]: number } = {};

    // 방의 참여자 정보와 각 참여자의 마지막 읽은 메시지를 확인
    for (const message of messages) {
      console.log(message);
      let unreadCount = 0;

      for (const userId of room.participants) {
        // 사용자의 마지막 읽은 메시지 ID
        const lastReadMessageId = room.lastReadMessage.get(userId);

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

    console.log(unreadCounts);
    return unreadCounts;
  }
  // TODO: 전체 조회 시 count 갱신과 채팅 하나 입력마다 새로 계산되는 것 다르게 구현

  async sendMessage(sended: SendMessageDto): Promise<ChatDocument> {
    sended = {
      ...sended,
      createdAt: new Date(),
    } as ChatDocument;
    return await this.chatModel.create(sended);
  }
}

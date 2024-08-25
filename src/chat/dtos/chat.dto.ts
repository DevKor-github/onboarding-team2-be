import { Types } from 'mongoose';

export class CreateRoomDto {
  creator: Types.ObjectId;
  isGroup: boolean;
  name: string;
  tags: string[];
}

export class SendMessageDto {
  roomId: Types.ObjectId;
  senderId: Types.ObjectId;
  message: string;
}

export class GetMessageDto {
  roomId: Types.ObjectId;
  offset: number;
  limit: number;
}

export class GetMessageResDto {
  _id: Types.ObjectId;
  roomId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderName: string;
  message: string;
  createdAt: Date;
}

export class ChatUserDto {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
}

export class MarkMessagesAsReadDto {
  roomId: Types.ObjectId;
  lastMessageId: Types.ObjectId;
}

export class UnreadChatReqDto {
  roomId: Types.ObjectId;
}

export class UnreadChatResDto {
  roomId: Types.ObjectId;
  counts: number;
}

export class UnreadMessageReqDto {
  roomId: Types.ObjectId;
  offset: number;
  limit: number;
}

export class UnreadMessageResDto {
  [roomId: string]: number;
}

export class GetChatReqDto {
  offset: number;
  limit: number;
}

export class ChatResDto {
  roomId: Types.ObjectId;
  name: string;
  tags: string[];
  size: number;
  lastMsgSent: Date;
}

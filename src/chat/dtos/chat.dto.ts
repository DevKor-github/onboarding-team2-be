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
  limit: number;
}

export class ChatUserDto {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
}

export class MarkMessagesAsReadDto {
  roomId: Types.ObjectId;
  userId: Types.ObjectId;
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
}

export class UnreadMessageResDto {
  [roomId: string]: number;
}

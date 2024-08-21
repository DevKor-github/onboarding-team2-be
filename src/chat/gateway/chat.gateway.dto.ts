import { Types } from 'mongoose';

export class MarkAsReadAndUnreadMessagesReqDto {
  roomId: Types.ObjectId;
  lastMessageId: Types.ObjectId;
  offset: number;
  limit: number;
}

export class WsSendMessageDto {
  roomId: Types.ObjectId;
  message: string;
}

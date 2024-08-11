export class CreateRoomDto {
  participants: string[];
  isGroupChat: boolean;
  name?: string;
}

export class SendMessageDto {
  roomId: string;
  senderId: string;
  message: string;
}

export class MarkMessagesAsReadDto {
  roomId: string;
  userId: string;
}

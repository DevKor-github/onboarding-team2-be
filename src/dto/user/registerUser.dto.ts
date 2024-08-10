import { IsString, IsNotEmpty, IsBoolean } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  readonly user_id: string;

  @IsString()
  password: string;

  @IsString()
  readonly username: string;

  @IsBoolean()
  readonly status: boolean;

  // 배열이면 each true
  @IsString({ each: true })
  readonly tags: string[];
}

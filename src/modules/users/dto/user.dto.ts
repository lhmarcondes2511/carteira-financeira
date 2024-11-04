import { ApiProperty } from '@nestjs/swagger';

export class UserDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiProperty()
    balance: number;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ type: [Object], required: false })
    sentTransfers?: any[];

    @ApiProperty({ type: [Object], required: false })
    receivedTransfers?: any[];
}
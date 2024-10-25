import { IUser } from '../../users/interfaces/user.interface';

export interface ITransfer {
    id: string;
    sender: IUser;
    receiver: IUser;
    amount: number;
    createdAt: Date;
    description?: string;
}
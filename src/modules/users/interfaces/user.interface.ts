export interface IUser {
    id: string;
    username: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
    sentTransfers?: any[];
    receivedTransfers?: any[];
}
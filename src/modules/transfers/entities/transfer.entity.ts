import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('transfers')
export class Transfer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, user => user.sentTransfers)
    sender: User;

    @ManyToOne(() => User, user => user.receivedTransfers)
    receiver: User;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    description: string;

    @Column({ default: false })
    isReversed: boolean;

    @Column({ nullable: true })
    reversalReason: string;

    @Column({ nullable: true })
    reversalDate: Date;

    @OneToOne(() => Transfer, { nullable: true })
    @JoinColumn()
    originalTransfer: Transfer;
}
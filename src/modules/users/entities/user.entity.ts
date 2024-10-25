import { Transfer } from 'src/modules/transfers/entities/transfer.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    password: string;

    @Column({
        type: 'decimal',
        precision: 10,
        scale: 2,
        default: 0,
        transformer: {
            to: (value: number): number => value,
            from: (value: string): number => parseFloat(value)
        }
    })
    balance: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Transfer, transfer => transfer.sender)
    sentTransfers: Transfer[];

    @OneToMany(() => Transfer, transfer => transfer.receiver)
    receivedTransfers: Transfer[];
}
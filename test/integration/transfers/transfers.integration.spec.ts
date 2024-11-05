import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../src/app.module';
import { Connection, Repository } from 'typeorm';
import { User } from '../../../src/modules/users/entities/user.entity';
import { Transfer } from '../../../src/modules/transfers/entities/transfer.entity';
import { v4 as uuidv4 } from 'uuid';

describe('Carteira Financeira (e2e)', () => {
    let app: INestApplication;
    let connection: Connection;
    let userRepository: Repository<User>;
    let transferRepository: Repository<Transfer>;
    
    let firstUserData = {
        id: '',
        username: '',
        token: '',
        password: 'Test@123'
    };

    let secondUserData = {
        id: '',
        username: '',
        token: '',
        password: 'Test@123'
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({
            whitelist: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            forbidNonWhitelisted: true,
        }));
        
        await app.init();

        connection = moduleFixture.get<Connection>(Connection);
        userRepository = connection.getRepository(User);
        transferRepository = connection.getRepository(Transfer);

        await connection.synchronize(true);
    });

    describe('Auth Module', () => {
        it('should register first user successfully', async () => {
            firstUserData.username = `user_${Date.now()}`;
            
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: firstUserData.username,
                    password: firstUserData.password
                })
                .expect(201);

            expect(response.body).toHaveProperty('access_token');
            firstUserData.token = response.body.access_token;

            const user = await userRepository.findOne({ 
                where: { username: firstUserData.username } 
            });
            expect(user).toBeDefined();
            firstUserData.id = user.id;

            await userRepository.update(
                { id: firstUserData.id },
                { balance: 1000 }
            );
        });

        it('should register second user successfully', async () => {
            secondUserData.username = `user2_${Date.now()}`;
            
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: secondUserData.username,
                    password: secondUserData.password
                })
                .expect(201);

            expect(response.body).toHaveProperty('access_token');
            secondUserData.token = response.body.access_token;

            const user = await userRepository.findOne({ 
                where: { username: secondUserData.username } 
            });
            expect(user).toBeDefined();
            secondUserData.id = user.id;
        });

        it('should login successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: firstUserData.username,
                    password: firstUserData.password
                })
                .expect(200);

            expect(response.body).toHaveProperty('access_token');
            firstUserData.token = response.body.access_token;
        });
    });

    describe('Transfers Module', () => {
        it('should make a transfer successfully', async () => {
            const transferAmount = 100;
        
            const response = await request(app.getHttpServer())
                .post('/transfers')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({
                    receiverId: secondUserData.id,
                    amount: transferAmount
                })
                .expect(201);
    
            expect(response.body).toHaveProperty('id');
            expect(response.body.amount).toBe(transferAmount);
        
            const sender = await userRepository.findOne({ 
                where: { id: firstUserData.id } 
            });
            expect(Number(sender.balance)).toBe(900);
        
            const receiver = await userRepository.findOne({ 
                where: { id: secondUserData.id } 
            });
            expect(Number(receiver.balance)).toBe(100);
        });
    
        it('should get transfer history', async () => {
            // Primeiro, vamos garantir que há pelo menos uma transferência
            if (!(await transferRepository.count())) {
                await request(app.getHttpServer())
                    .post('/transfers')
                    .set('Authorization', `Bearer ${firstUserData.token}`)
                    .send({
                        receiverId: secondUserData.id,
                        amount: 50
                    })
                    .expect(201);
            }
    
            const response = await request(app.getHttpServer())
                .get('/transfers/my-transfer')  // Corrigido aqui
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .expect(200);
    
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
            
            const transfer = response.body[0];
            expect(transfer).toHaveProperty('id');
            expect(transfer).toHaveProperty('amount');
            expect(transfer).toHaveProperty('sender');
            expect(transfer).toHaveProperty('receiver');
        });
    
        it('should increase balance successfully', async () => {
            const increaseAmount = 500;
    
            const response = await request(app.getHttpServer())
                .post('/transfers/increase-balance')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({ amount: increaseAmount })
                .expect(201);
    
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('newBalance');
            const expectedBalance = 900 + increaseAmount; // 900 (previous balance) + 500 (increase)
            expect(Number(response.body.newBalance)).toBe(expectedBalance);
        });

        it('should not transfer to non-existent user', async () => {
            await request(app.getHttpServer())
                .post('/transfers')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({
                    receiverId: uuidv4(),
                    amount: 100
                })
                .expect(404);
        });

        it('should not transfer negative amount', async () => {
            await request(app.getHttpServer())
                .post('/transfers')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({
                    receiverId: secondUserData.id,
                    amount: -100
                })
                .expect(400);
        });
    
        it('should increase balance successfully', async () => {
            // Primeiro, vamos verificar o saldo atual
            const profileResponse = await request(app.getHttpServer())
                .get('/users/profile')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .expect(200);
        
            const initialBalance = Number(profileResponse.body.balance);
        
            const increaseAmount = 500;
        
            const response = await request(app.getHttpServer())
                .post('/transfers/increase-balance')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({ amount: increaseAmount })
                .expect(201);
        
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('newBalance');
            const expectedBalance = initialBalance + increaseAmount;
            expect(Number(response.body.newBalance)).toBe(expectedBalance);
        
            // Verificar se o saldo foi realmente atualizado no perfil do usuário
            const updatedProfileResponse = await request(app.getHttpServer())
                .get('/users/profile')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .expect(200);
        
            expect(Number(updatedProfileResponse.body.balance)).toBe(expectedBalance);
        });

        it('should not increase balance with negative amount', async () => {
            await request(app.getHttpServer())
                .post('/transfers/increase-balance')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({ amount: -100 })
                .expect(400);
        });
    });

    afterAll(async () => {
        await connection.synchronize(true);
        await connection.close();
        await app.close();
    });
});
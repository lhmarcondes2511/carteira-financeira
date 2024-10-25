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

        it('should not register a user with existing username', async () => {
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({
                    username: firstUserData.username,
                    password: 'Test@123'
                })
                .expect(409);
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

        it('should not login with wrong password', async () => {
            await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    username: firstUserData.username,
                    password: 'wrongpassword'
                })
                .expect(401);
        });
    });

    describe('Users Module', () => {
        it('should get user profile', async () => {
            const response = await request(app.getHttpServer())
                .get('/users/profile')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .expect(200);
    
            expect(response.body).toHaveProperty('username', firstUserData.username);
            expect(response.body).toHaveProperty('balance');
            expect(Number(response.body.balance)).toBe(1000);
        });
    
        it('should not get profile without token', async () => {
            await request(app.getHttpServer())
                .get('/users/profile')
                .expect(401);
        });
    
        it('should update user profile', async () => {
            const newUsername = `user_${Date.now()}`;
            
            const response = await request(app.getHttpServer())
                .patch('/users/profile')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({ username: newUsername })
                .expect(200);
    
            expect(response.body.username).toBe(newUsername);
            firstUserData.username = newUsername;
        });
    
        it('should not update profile with invalid username', async () => {
            await request(app.getHttpServer())
                .patch('/users/profile')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({ username: 'abc' })
                .expect(400);
        });
    
        it('should not update profile without data', async () => {
            await request(app.getHttpServer())
                .patch('/users/profile')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({})
                .expect(400);
        });
    });

    describe('Transfers Module', () => {
        it('should make a transfer successfully', async () => {
            const transferAmount = 100;
        
            await request(app.getHttpServer())
                .post('/transfers')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({
                    receiverId: secondUserData.id,
                    amount: transferAmount
                })
                .expect(201);
        
            const sender = await userRepository.findOne({ 
                where: { id: firstUserData.id } 
            });
            expect(Number(sender.balance)).toBe(900);
        
            const receiver = await userRepository.findOne({ 
                where: { id: secondUserData.id } 
            });
            expect(Number(receiver.balance)).toBe(100);
        });

        it('should not transfer with insufficient balance', async () => {
            await request(app.getHttpServer())
                .post('/transfers')
                .set('Authorization', `Bearer ${firstUserData.token}`)
                .send({
                    receiverId: secondUserData.id,
                    amount: 10000
                })
                .expect(400);
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

        it('should get transfer history', async () => {
            const response = await request(app.getHttpServer())
                .get('/transfers')
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
    });

    afterAll(async () => {
        await connection.synchronize(true);
        await connection.close();
        await app.close();
    });
});
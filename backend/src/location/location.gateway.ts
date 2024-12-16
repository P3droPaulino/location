import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma.service';

interface ConnectedUser {
  socketId: string;
  userId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, ConnectedUser> = new Map();

  constructor(private prisma: PrismaService) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const user = this.connectedUsers.get(client.id);
    if (user) {
      this.server.emit('userStatusUpdate', { userId: user.userId, isOnline: false });
      this.connectedUsers.delete(client.id);
    }
  }

  @SubscribeMessage('register')
  handleRegister(client: Socket, userId: number) {
    this.connectedUsers.set(client.id, { socketId: client.id, userId });
    this.server.emit('userStatusUpdate', { userId, isOnline: true });
  }

  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(client: Socket, payload: { userId: number; latitude: number; longitude: number }) {
    try {
      // Delete previous locations for this user
      await this.prisma.location.deleteMany({
        where: { userId: payload.userId }
      });

      // Create new location
      const location = await this.prisma.location.create({
        data: {
          latitude: payload.latitude,
          longitude: payload.longitude,
          userId: payload.userId,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });

      // Broadcast the location update to all connected clients
      this.server.emit('locationUpdate', {
        ...location,
        userName: location.user.name,
      });
      
      return location;
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    }
  }

  @SubscribeMessage('getLastLocation')
  async handleGetLastLocation(client: Socket, userId: number) {
    try {
      const latestLocation = await this.prisma.location.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
      });
      
      if (latestLocation) {
        client.emit('locationUpdate', {
          ...latestLocation,
          userName: latestLocation.user.name,
        });
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      throw error;
    }
  }
}

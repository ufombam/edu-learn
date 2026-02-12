import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';

export let io: Server;

export const initSocket = (server: HttpServer) => {
    io = new Server(server, {
        cors: {
            origin: ['http://localhost:4000', 'http://localhost:5173'],
        },
    });

    // Initialize handlers
    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join_conversation', (conversationId: string) => {
            socket.join(conversationId);
            console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
        });

        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(conversationId);
        });
    });

    return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};
// fastify.d.ts
import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: { userId: number }; // Aqui você define a estrutura do seu `user`
  }
}

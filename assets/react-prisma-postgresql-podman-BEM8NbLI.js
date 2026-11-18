var e=`---
title: Full-stack React, Prisma, and PostgreSQL with Podman
summary: Build a user management app with React, Chakra UI, Express, Prisma, and PostgreSQL, and run it in Podman or Docker containers.
category: React
order: 20
---

# Full-stack React, Prisma, and PostgreSQL with Podman

This tutorial shows how to build a user management app with a React and Chakra UI frontend, an Express and Prisma backend, and a PostgreSQL database. Podman runs all parts in containers. Docker also works: the code blocks show the Docker commands as comments.

## Before you start

Install these tools on macOS:

| Tool | Version or note | Download |
| --- | --- | --- |
| Node.js | 18 or later | [nodejs.org](https://nodejs.org/) |
| Podman | | [podman.io](https://podman.io/) |
| Docker Desktop | Only if you use Docker | [docker.com](https://www.docker.com/products/docker-desktop) |
| Code editor | VS Code is recommended | [code.visualstudio.com](https://code.visualstudio.com/) |
| Terminal | The built-in Terminal or iTerm2 | |

Make sure that the tools are installed:

\`\`\`bash
node --version
npm --version
# docker --version
# docker-compose --version
podman --version
podman compose --version
\`\`\`

> **NOTE:** Dated (checked November 2026): Node.js 18 reached end of life in April 2025, and Node.js 20 in April 2026. Use an active LTS version (Node.js 22 or 24), and change \`node:20\` and \`node:20-alpine\` in the Containerfiles to the same version (for example \`node:22-alpine\`). Docker Compose v1 (\`docker-compose\`) is retired. With Docker, use \`docker compose\` (with a space).

## Project structure

The project uses the Repository Pattern. This design pattern keeps data access logic apart from business logic, so the code is easier to maintain and test.

\`\`\`text
user-management-app/
├── backend/
│   ├── src/
│   │   ├── repositories/
│   │   │   ├── BaseRepository.ts
│   │   │   └── UserRepository.ts
│   │   ├── routes/
│   │   │   └── users.ts
│   │   ├── types/
│   │   │   └── User.ts
│   │   └── server.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── Containerfile.dev
│   ├── Containerfile.prod
│   ├── .containerignore
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── repositories/
│   │   │   ├── BaseRepository.ts
│   │   │   └── UserRepository.ts
│   │   ├── components/
│   │   │   ├── UserList.tsx
│   │   │   └── UserForm.tsx
│   │   ├── viewmodels/
│   │   │   └── UserManagementViewModel.ts
│   │   ├── types/
│   │   │   └── User.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Containerfile.dev
│   ├── Containerfile.prod
│   ├── .containerignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── .env
├── compose.dev.yml
├── compose.prod.yml
└── README.md
\`\`\`

## Set up the project

1. Create the project directory:

   \`\`\`bash
   mkdir user-management-app
   cd user-management-app
   \`\`\`

2. Create the backend folders and start the backend project:

   \`\`\`bash
   mkdir -p backend/src/{repositories,routes,types}
   mkdir -p backend/prisma
   cd backend
   npm init -y
   \`\`\`

3. Install the backend dependencies:

   \`\`\`bash
   npm install express cors dotenv @prisma/client
   npm install -D typescript @types/node @types/express @types/cors ts-node nodemon prisma
   \`\`\`

4. Create the frontend with the Vite React TypeScript template:

   \`\`\`bash
   cd ..
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   \`\`\`

5. Install Chakra UI and its dependencies:

   \`\`\`bash
   npm install @chakra-ui/react@2 @emotion/react @emotion/styled framer-motion
   \`\`\`

Chakra UI is a React component library. It gives accessible components that you can customize, with built-in theme support.

> **NOTE:** Dated (checked November 2026): The components in this tutorial use the Chakra UI v2 API (for example \`FormControl\`, \`AlertIcon\`, \`AlertDialog\`, and \`ChakraProvider\` without a \`value\` prop), so the install command pins v2. The current major version is Chakra UI v3, which changed these APIs. To use v3, change the components.

## Configure the backend

1. Add the scripts to \`backend/package.json\`. The \`--legacy-watch\` flag makes hot reload work in Podman.

   \`\`\`json
   {
     "scripts": {
       "dev": "nodemon --legacy-watch --exec ts-node src/server.ts",
       "build": "tsc",
       "start": "node dist/server.js",
       "prisma:generate": "prisma generate",
       "prisma:migrate": "prisma migrate dev",
       "prisma:deploy": "prisma migrate deploy",
       "prisma:push": "prisma db push"
     }
   }
   \`\`\`

2. Create \`backend/tsconfig.json\`:

   \`\`\`json
   {
     "compilerOptions": {
       "target": "ES2020",
       "module": "commonjs",
       "lib": ["ES2020"],
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true,
       "skipLibCheck": true,
       "forceConsistentCasingInFileNames": true,
       "resolveJsonModule": true,
       "sourceMap": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules"]
   }
   \`\`\`

3. Create \`backend/prisma/schema.prisma\`:

   \`\`\`text
   generator client {
     provider = "prisma-client-js"
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }

   model User {
     id        Int      @id @default(autoincrement())
     name      String
     email     String   @unique
     role      String   @default("user")
     createdAt DateTime @default(now())
     updatedAt DateTime @updatedAt
   }
   \`\`\`

   Prisma is an ORM (Object-Relational Mapping) tool. It gives type-safe access to the database. The \`User\` model makes a matching table in PostgreSQL.

4. Create \`backend/.env\`:

   \`\`\`ini
   DATABASE_URL="postgresql://devuser:devpassword@postgres:5432/main_db?schema=public"
   PORT=3000
   \`\`\`

   > **WARNING:** Do not commit \`.env\` files. Add them to \`.gitignore\`.

## Create the backend repositories

1. Create \`backend/src/types/User.ts\`:

   \`\`\`ts
   export interface User {
     id: number;
     name: string;
     email: string;
     role: 'user' | 'admin';
     createdAt?: Date;
     updatedAt?: Date;
   }
   \`\`\`

2. Create the generic base repository in \`backend/src/repositories/BaseRepository.ts\`:

   \`\`\`ts
   import { PrismaClient } from '@prisma/client';

   export abstract class BaseRepository<T extends { id: number }> {
     protected prisma: PrismaClient;
     protected modelName: string;

     constructor(prisma: PrismaClient, modelName: string) {
       this.prisma = prisma;
       this.modelName = modelName;
     }

     async getAllAsync(): Promise<T[]> {
       const model = (this.prisma as any)[this.modelName];
       return await model.findMany();
     }

     async getByIdAsync(id: number): Promise<T | null> {
       const model = (this.prisma as any)[this.modelName];
       return await model.findUnique({
         where: { id }
       });
     }

     async createAsync(data: Omit<T, 'id'>): Promise<T> {
       const model = (this.prisma as any)[this.modelName];
       return await model.create({
         data
       });
     }

     async updateAsync(id: number, data: Partial<T>): Promise<T> {
       const model = (this.prisma as any)[this.modelName];
       return await model.update({
         where: { id },
         data
       });
     }

     async deleteAsync(id: number): Promise<void> {
       const model = (this.prisma as any)[this.modelName];
       await model.delete({
         where: { id }
       });
     }
   }
   \`\`\`

3. Create the concrete user repository in \`backend/src/repositories/UserRepository.ts\`:

   \`\`\`ts
   import { PrismaClient } from '@prisma/client';
   import { BaseRepository } from './BaseRepository';
   import { User } from '../types/User';

   export class UserRepository extends BaseRepository<User> {
     constructor(prisma: PrismaClient) {
       super(prisma, 'user');
     }

     async findByEmailAsync(email: string): Promise<User | null> {
       return await this.prisma.user.findUnique({
         where: { email }
       });
     }

     async findByRoleAsync(role: 'user' | 'admin'): Promise<User[]> {
       return await this.prisma.user.findMany({
         where: { role }
       });
     }

     async promoteToAdminAsync(id: number): Promise<User> {
       return await this.prisma.user.update({
         where: { id },
         data: { role: 'admin' }
       });
     }
   }
   \`\`\`

## Create the API routes and server

1. Create \`backend/src/routes/users.ts\`:

   \`\`\`ts
   import { Router, Request, Response } from 'express';
   import { UserRepository } from '../repositories/UserRepository';
   import { PrismaClient } from '@prisma/client';

   const router = Router();
   const prisma = new PrismaClient();
   const userRepository = new UserRepository(prisma);

   // GET /api/users - Get all users
   router.get('/', async (req: Request, res: Response) => {
     try {
       const users = await userRepository.getAllAsync();
       res.json(users);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch users' });
     }
   });

   // GET /api/users/:id - Get user by ID
   router.get('/:id', async (req: Request, res: Response) => {
     try {
       const user = await userRepository.getByIdAsync(Number(req.params.id));
       if (!user) {
         return res.status(404).json({ error: 'User not found' });
       }
       res.json(user);
     } catch (error) {
       res.status(500).json({ error: 'Failed to fetch user' });
     }
   });

   // POST /api/users - Create new user
   router.post('/', async (req: Request, res: Response) => {
     try {
       const { name, email, role } = req.body;
       const user = await userRepository.createAsync({ name, email, role: role || 'user' });
       res.status(201).json(user);
     } catch (error) {
       res.status(500).json({ error: 'Failed to create user' });
     }
   });

   // PUT /api/users/:id - Update user
   router.put('/:id', async (req: Request, res: Response) => {
     try {
       const user = await userRepository.updateAsync(Number(req.params.id), req.body);
       res.json(user);
     } catch (error) {
       res.status(500).json({ error: 'Failed to update user' });
     }
   });

   // DELETE /api/users/:id - Delete user
   router.delete('/:id', async (req: Request, res: Response) => {
     try {
       await userRepository.deleteAsync(Number(req.params.id));
       res.status(204).send();
     } catch (error) {
       res.status(500).json({ error: 'Failed to delete user' });
     }
   });

   // POST /api/users/:id/promote - Promote user to admin
   router.post('/:id/promote', async (req: Request, res: Response) => {
     try {
       const user = await userRepository.promoteToAdminAsync(Number(req.params.id));
       res.json(user);
     } catch (error) {
       res.status(500).json({ error: 'Failed to promote user' });
     }
   });

   export default router;
   \`\`\`

2. Create the Express server in \`backend/src/server.ts\`:

   \`\`\`ts
   import express from 'express';
   import cors from 'cors';
   import dotenv from 'dotenv';
   import userRoutes from './routes/users';

   dotenv.config();

   const app = express();
   const PORT = process.env.PORT || 3000;

   // Middleware
   app.use(cors());
   app.use(express.json());

   // Routes
   app.use('/api/users', userRoutes);

   // Health check
   app.get('/health', (req, res) => {
     res.json({ status: 'ok' });
   });

   app.listen(PORT, () => {
     console.log(\`Server running on http://localhost:\${PORT}\`);
   });
   \`\`\`

## Migrate the database

Do these steps when you change \`backend/prisma/schema.prisma\`:

1. In local development, capture the changes in a new migration:

   \`\`\`bash
   npx prisma migrate dev --name <migration_name>
   \`\`\`

2. On the production database, apply the pending migrations:

   \`\`\`bash
   npx prisma migrate deploy
   \`\`\`

3. Always generate the client again to update the types:

   \`\`\`bash
   npx prisma generate
   \`\`\`

| Script | Command | Use |
| --- | --- | --- |
| \`npm run prisma:migrate\` | \`prisma migrate dev\` | Development. It creates a migration file from the schema changes and applies it. |
| \`npm run prisma:deploy\` | \`prisma migrate deploy\` | Production or CI/CD pipelines. It applies all pending migrations. It does not create migration files. |
| \`npm run prisma:push\` | \`prisma db push\` | Prototypes. It syncs the schema with the database fast, without migration history. Do not use it in production. |

## Create the backend container files

The project uses different files for development and production. This keeps build times short and images small.

1. Create \`backend/Containerfile.dev\`. This file is for development with hot reload.

   \`\`\`dockerfile
   # THE "HEAVYWEIGHT": Includes everything. Best if your app needs to compile C++ modules.
   # FROM node:20 AS build
   # THE "LIGHTWEIGHT": Ultra-light and secure. Use this by default for 99% of web apps.
   FROM node:20-alpine

   WORKDIR /app

   # Install dependencies for Prisma
   RUN apk add --no-cache openssl libc6-compat

   # Copy package files
   COPY package*.json ./
   COPY prisma ./prisma/

   # Install dependencies
   RUN npm install

   # Generate Prisma Client
   RUN npx prisma generate

   # Copy source code
   COPY . .

   # Expose port
   EXPOSE 3000

   # Start command (Development with hot-reload)
   CMD ["sh", "-c", "npm install && npx prisma db push && npm run dev"]
   \`\`\`

2. Create \`backend/Containerfile.prod\`. This file uses a multi-stage build for production.

   \`\`\`dockerfile
   # Stage 1: Build
   FROM node:20-alpine AS builder

   WORKDIR /app

   RUN apk add --no-cache openssl libc6-compat

   COPY package*.json ./
   COPY prisma ./prisma/

   RUN npm install

   COPY . .

   RUN npx prisma generate
   RUN npm run build

   # Stage 2: Runtime
   FROM node:20-alpine

   WORKDIR /app

   RUN apk add --no-cache openssl libc6-compat

   # Only install production dependencies
   COPY package*.json ./
   COPY prisma ./prisma/
   RUN npm install --omit=dev

   COPY --from=builder /app/dist ./dist
   COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

   EXPOSE 3000

   CMD ["sh", "-c", "npm install && npx prisma db push && npm start"]
   \`\`\`

   > **NOTE:** Verify this start command before you use it in production. \`npm install\` at start adds the development dependencies again, and \`prisma db push\` changes the schema without migration history. The [migration guidance](#migrate-the-database) recommends \`npx prisma migrate deploy\` for production. If you have migration files, consider \`CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]\`, and make sure that the \`prisma\` CLI is in the runtime image.

3. Create \`backend/.containerignore\`. Podman and Docker both use this file.

   \`\`\`text
   node_modules
   dist
   .env
   \`\`\`

## Configure the frontend

1. Update \`frontend/vite.config.ts\`. The \`server\` settings make the dev server listen on all interfaces and make Hot Module Replacement (HMR) work in Podman on macOS.

   \`\`\`ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'

   // https://vite.dev/config/ 
   export default defineConfig({
     plugins: [react()],
     server: {
       // Listen on 0.0.0.0
       host: true,
       // Required for Hot Module Replacement (HMR) to work in Podman on macOS
       watch: {
         usePolling: true
       }
     }
   })
   \`\`\`

2. Create \`frontend/src/types/User.ts\`. The dates are strings, because they come from JSON.

   \`\`\`ts
   export interface User {
     id: number;
     name: string;
     email: string;
     role: 'user' | 'admin';
     createdAt?: string;
     updatedAt?: string;
   }
   \`\`\`

3. Create the client-side base repository in \`frontend/src/repositories/BaseRepository.ts\`:

   \`\`\`ts
   // Base generic repository for client-side data fetching
   export abstract class BaseRepository<T extends { id: number }> {
     protected baseUrl: string = '';

     async getAllAsync(): Promise<T[]> {
       const response = await fetch(this.baseUrl);
       if (!response.ok) throw new Error(\`Failed to fetch items\`);
       return response.json();
     }

     async getByIdAsync(id: number): Promise<T> {
       const response = await fetch(\`\${this.baseUrl}/\${id}\`);
       if (!response.ok) throw new Error(\`Item \${id} not found\`);
       return response.json();
     }

     async createAsync(item: Omit<T, 'id'>): Promise<T> {
       const response = await fetch(this.baseUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(item)
       });
       if (!response.ok) throw new Error('Failed to create item');
       return response.json();
     }

     async updateAsync(item: T): Promise<T> {
       const response = await fetch(\`\${this.baseUrl}/\${item.id}\`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(item)
       });
       if (!response.ok) throw new Error('Failed to update item');
       return response.json();
     }

     async deleteAsync(id: number): Promise<void> {
       const response = await fetch(\`\${this.baseUrl}/\${id}\`, {
         method: 'DELETE'
       });
       if (!response.ok) throw new Error('Failed to delete item');
     }
   }
   \`\`\`

## Create the frontend repository and view model

1. Create the client-side user repository in \`frontend/src/repositories/UserRepository.ts\`. It reads the API URL from \`VITE_API_URL\`.

   \`\`\`ts
   import { BaseRepository } from './BaseRepository';
   import { User } from '../types/User';

   export class UserRepository extends BaseRepository<User> {
     constructor() {
       super();
       this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/users';
     }

     async findByEmailAsync(email: string): Promise<User | null> {
       const users = await this.getAllAsync();
       return users.find(u => u.email === email) || null;
     }

     async findByRoleAsync(role: 'user' | 'admin'): Promise<User[]> {
       const users = await this.getAllAsync();
       return users.filter(u => u.role === role);
     }

     async promoteToAdminAsync(id: number): Promise<User> {
       const response = await fetch(\`\${this.baseUrl}/\${id}/promote\`, {
         method: 'POST'
       });
       if (!response.ok) throw new Error('Failed to promote user');
       return response.json();
     }
   }
   \`\`\`

2. Create the view model in \`frontend/src/viewmodels/UserManagementViewModel.ts\`. The view model keeps the state and tells subscribers when the state changes.

   \`\`\`ts
   import { UserRepository } from '../repositories/UserRepository';
   import { User } from '../types/User';

   export class UserManagementViewModel {
     private repository: UserRepository;
     private users: User[] = [];
     private isLoading: boolean = false;
     private error: string | null = null;
     private listeners: (() => void)[] = [];

     constructor() {
       this.repository = new UserRepository();
     }

     // Subscribe to state changes
     subscribe(listener: () => void): () => void {
       this.listeners.push(listener);
       return () => {
         this.listeners = this.listeners.filter(l => l !== listener);
       };
     }

     private notify(): void {
       this.listeners.forEach(listener => listener());
     }

     async initializeAsync(): Promise<void> {
       try {
         this.isLoading = true;
         this.notify();
         this.users = await this.repository.getAllAsync();
         this.error = null;
       } catch (err) {
         this.error = err instanceof Error ? err.message : 'Initialization failed';
       } finally {
         this.isLoading = false;
         this.notify();
       }
     }

     async createUserAsync(name: string, email: string): Promise<void> {
       try {
         this.isLoading = true;
         this.notify();
         const newUser = await this.repository.createAsync({
           name,
           email,
           role: 'user'
         });
         this.users.push(newUser);
         this.error = null;
       } catch (err) {
         this.error = err instanceof Error ? err.message : 'Failed to create user';
         throw err;
       } finally {
         this.isLoading = false;
         this.notify();
       }
     }

     async updateUserAsync(user: User): Promise<void> {
       try {
         this.isLoading = true;
         this.notify();
         const updated = await this.repository.updateAsync(user);
         const index = this.users.findIndex(u => u.id === user.id);
         if (index !== -1) {
           this.users[index] = updated;
         }
         this.error = null;
       } catch (err) {
         this.error = err instanceof Error ? err.message : 'Failed to update user';
         throw err;
       } finally {
         this.isLoading = false;
         this.notify();
       }
     }

     async deleteUserAsync(id: number): Promise<void> {
       try {
         this.isLoading = true;
         this.notify();
         await this.repository.deleteAsync(id);
         this.users = this.users.filter(u => u.id !== id);
         this.error = null;
       } catch (err) {
         this.error = err instanceof Error ? err.message : 'Failed to delete user';
         throw err;
       } finally {
         this.isLoading = false;
         this.notify();
       }
     }

     async promoteToAdminAsync(id: number): Promise<void> {
       const user = this.users.find(u => u.id === id);
       if (!user) throw new Error('User not found');

       user.role = 'admin';
       await this.updateUserAsync(user);
     }

     getUsers(): User[] {
       return this.users;
     }

     async getAdmins(): Promise<User[]> {
       return this.repository.findByRoleAsync('admin');
     }

     getError(): string | null {
       return this.error;
     }

     getIsLoading(): boolean {
       return this.isLoading;
     }
   }
   \`\`\`

## Create the React components

1. Create the form in \`frontend/src/components/UserForm.tsx\`:

   \`\`\`ts
   import { useState } from 'react';
   import {
     Box,
     FormControl,
     FormLabel,
     Input,
     Button,
     Heading,
     VStack,
   } from '@chakra-ui/react';

   interface UserFormProps {
     onSubmit: (name: string, email: string) => Promise<void>;
   }

   export const UserForm: React.FC<UserFormProps> = ({ onSubmit }) => {
     const [name, setName] = useState('');
     const [email, setEmail] = useState('');
     const [isSubmitting, setIsSubmitting] = useState(false);

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       setIsSubmitting(true);
       try {
         await onSubmit(name, email);
         setName('');
         setEmail('');
       } finally {
         setIsSubmitting(false);
       }
     };

     return (
       <Box
         as="form"
         onSubmit={handleSubmit}
         bg="white"
         p={8}
         borderRadius="xl"
         boxShadow="xl"
       >
         <VStack spacing={6} align="stretch">
           <Heading size="lg" color="purple.600">
             Add New User
           </Heading>

           <FormControl isRequired>
             <FormLabel>Name</FormLabel>
             <Input
               value={name}
               onChange={(e) => setName(e.target.value)}
               placeholder="John Doe"
               size="lg"
             />
           </FormControl>

           <FormControl isRequired>
             <FormLabel>Email</FormLabel>
             <Input
               type="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="john@example.com"
               size="lg"
             />
           </FormControl>

           <Button
             type="submit"
             colorScheme="purple"
             size="lg"
             isLoading={isSubmitting}
             loadingText="Adding..."
           >
             Add User
           </Button>
         </VStack>
       </Box>
     );
   };
   \`\`\`

2. Create the list in \`frontend/src/components/UserList.tsx\`. The list shows a confirmation dialog before it deletes a user.

   \`\`\`ts
   import {
     Box,
     Table,
     Thead,
     Tbody,
     Tr,
     Th,
     Td,
     Button,
     Badge,
     Heading,
     Text,
     HStack,
     useDisclosure,
     AlertDialog,
     AlertDialogBody,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogContent,
     AlertDialogOverlay,
   } from '@chakra-ui/react';
   import { useRef, useState } from 'react';
   import { User } from '../types/User';

   interface UserListProps {
     users: User[];
     onDelete: (id: number) => Promise<void>;
     onPromote: (id: number) => Promise<void>;
   }

   export const UserList: React.FC<UserListProps> = ({ users, onDelete, onPromote }) => {
     const { isOpen, onOpen, onClose } = useDisclosure();
     const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
     const cancelRef = useRef<HTMLButtonElement>(null);

     const handleDeleteClick = (id: number) => {
       setSelectedUserId(id);
       onOpen();
     };

     const handleConfirmDelete = async () => {
       if (selectedUserId !== null) {
         await onDelete(selectedUserId);
         onClose();
         setSelectedUserId(null);
       }
     };

     return (
       <Box bg="white" p={8} borderRadius="xl" boxShadow="xl">
         <Heading size="lg" mb={6} color="purple.600">
           User Management
         </Heading>

         {users.length === 0 ? (
           <Text color="gray.500" textAlign="center" py={8} fontStyle="italic">
             No users found. Add your first user!
           </Text>
         ) : (
           <Box overflowX="auto">
             <Table variant="simple">
               <Thead>
                 <Tr>
                   <Th>ID</Th>
                   <Th>Name</Th>
                   <Th>Email</Th>
                   <Th>Role</Th>
                   <Th>Actions</Th>
                 </Tr>
               </Thead>
               <Tbody>
                 {users.map((user) => (
                   <Tr key={user.id}>
                     <Td>{user.id}</Td>
                     <Td fontWeight="medium">{user.name}</Td>
                     <Td color="gray.600">{user.email}</Td>
                     <Td>
                       <Badge
                         colorScheme={user.role === 'admin' ? 'pink' : 'blue'}
                         fontSize="sm"
                         px={3}
                         py={1}
                         borderRadius="full"
                       >
                         {user.role.toUpperCase()}
                       </Badge>
                     </Td>
                     <Td>
                       <HStack spacing={2}>
                         {user.role === 'user' && (
                           <Button
                             size="sm"
                             colorScheme="green"
                             onClick={() => onPromote(user.id)}
                           >
                             Promote
                           </Button>
                         )}
                         <Button
                           size="sm"
                           colorScheme="red"
                           onClick={() => handleDeleteClick(user.id)}
                         >
                           Delete
                         </Button>
                       </HStack>
                     </Td>
                   </Tr>
                 ))}
               </Tbody>
             </Table>
           </Box>
         )}

         <AlertDialog
           isOpen={isOpen}
           leastDestructiveRef={cancelRef}
           onClose={onClose}
         >
           <AlertDialogOverlay>
             <AlertDialogContent>
               <AlertDialogHeader fontSize="lg" fontWeight="bold">
                 Delete User
               </AlertDialogHeader>

               <AlertDialogBody>
                 Are you sure you want to delete this user? This action cannot be undone.
               </AlertDialogBody>

               <AlertDialogFooter>
                 <Button ref={cancelRef} onClick={onClose}>
                   Cancel
                 </Button>
                 <Button colorScheme="red" onClick={handleConfirmDelete} ml={3}>
                   Delete
                 </Button>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialogOverlay>
         </AlertDialog>
       </Box>
     );
   };
   \`\`\`

3. Create the main component in \`frontend/src/App.tsx\`. The component subscribes to the view model and renders again when the state changes.

   \`\`\`ts
   import { useEffect, useState } from 'react';
   import {
     Box,
     Container,
     Heading,
     Text,
     VStack,
     Alert,
     AlertIcon,
     Spinner,
     Center,
     SimpleGrid,
   } from '@chakra-ui/react';
   import { UserManagementViewModel } from './viewmodels/UserManagementViewModel';
   import { UserList } from './components/UserList';
   import { UserForm } from './components/UserForm';

   const viewModel = new UserManagementViewModel();

   function App() {
     const [, setUpdate] = useState(0);

     useEffect(() => {
       const unsubscribe = viewModel.subscribe(() => {
         setUpdate(prev => prev + 1);
       });

       viewModel.initializeAsync();

       return unsubscribe;
     }, []);

     const handleCreateUser = async (name: string, email: string) => {
       await viewModel.createUserAsync(name, email);
     };

     const handleDeleteUser = async (id: number) => {
       await viewModel.deleteUserAsync(id);
     };

     const handlePromoteUser = async (id: number) => {
       await viewModel.promoteToAdminAsync(id);
     };

     const users = viewModel.getUsers();
     const isLoading = viewModel.getIsLoading();
     const error = viewModel.getError();

     return (
       <Box minH="100vh" bgGradient="linear(to-br, purple.600, purple.800)" py={10}>
         <Container maxW="container.xl">
           <VStack spacing={8} align="stretch">
             <Box textAlign="center" color="white">
               <Heading as="h1" size="2xl" mb={2} textShadow="2px 2px 4px rgba(0,0,0,0.2)">
                 User Management System
               </Heading>
               <Text fontSize="xl" opacity={0.9}>
                 Full-Stack React + Prisma + PostgreSQL
               </Text>
             </Box>

             {error && (
               <Alert status="error" borderRadius="md">
                 <AlertIcon />
                 {error}
               </Alert>
             )}

             {isLoading && users.length === 0 ? (
               <Center py={20}>
                 <VStack>
                   <Spinner size="xl" color="white" thickness="4px" />
                   <Text color="white">Loading...</Text>
                 </VStack>
               </Center>
             ) : (
               <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
                 <Box gridColumn={{ md: "span 1" }}>
                   <UserForm onSubmit={handleCreateUser} />
                 </Box>
                 <Box gridColumn={{ md: "span 2" }}>
                   <UserList
                      users={users}
                      onDelete={handleDeleteUser}
                      onPromote={handlePromoteUser}
                   />
                 </Box>
               </SimpleGrid>
             )}
           </VStack>
         </Container>
       </Box>
     );
   }

   export default App;
   \`\`\`

4. Update \`frontend/src/main.tsx\` to add the Chakra provider:

   \`\`\`ts
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import { ChakraProvider } from '@chakra-ui/react';
   import App from './App';

   ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
     <React.StrictMode>
       <ChakraProvider>
         <App />
       </ChakraProvider>
     </React.StrictMode>
   );
   \`\`\`

5. Create \`frontend/.env\`:

   \`\`\`ini
   VITE_API_URL=http://localhost:3000/api/users
   \`\`\`

## Create the frontend container files

1. Create \`frontend/Containerfile.dev\`. This file runs the Vite development server with hot reload.

   \`\`\`dockerfile
   # THE "HEAVYWEIGHT": Includes everything. Best if your app needs to compile C++ modules.
   # FROM node:20 AS build
   # THE "LIGHTWEIGHT": Ultra-light and secure. Use this by default for 99% of web apps.
   FROM node:20-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .

   # Expose Vite dev port
   EXPOSE 5173

   CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
   \`\`\`

2. Create \`frontend/Containerfile.prod\`. This file builds the app and serves it with Nginx.

   \`\`\`dockerfile
   # Stage 1: Build
   FROM node:20-alpine AS build

   WORKDIR /app

   COPY package*.json ./
   RUN npm install

   COPY . .
   RUN npm run build

   # Stage 2: Production
   FROM nginx:alpine

   # Copy built assets
   COPY --from=build /app/dist /usr/share/nginx/html

   # Copy nginx config
   COPY nginx.conf /etc/nginx/conf.d/default.conf

   EXPOSE 80

   CMD ["nginx", "-g", "daemon off;"]
   \`\`\`

3. Create \`frontend/nginx.conf\`. Nginx serves the app and sends \`/api\` requests to the backend.

   \`\`\`text
   server {
       listen 80;
       server_name localhost;

       root /usr/share/nginx/html;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       location /api {
           proxy_pass http://backend:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   \`\`\`

4. Create \`frontend/.containerignore\`:

   \`\`\`text
   node_modules
   dist
   .env
   \`\`\`

## Create the compose files

Podman Compose (and Docker Compose) defines and runs multi-container apps. It manages the networks between containers, controls the start order, and keeps the environment configuration in one file. The project uses one compose file for development and one for production.

### Development compose file

\`compose.dev.yml\` mounts the local folders for hot reload and contains the development credentials.

\`\`\`yaml
services:
  # PostgreSQL
  postgres:
    # THE "HEAVYWEIGHT": Based on Debian. Best for production. Handles different languages and sorting (locales) perfectly.
    # image: postgres:17
    # THE "LIGHTWEIGHT": Based on Alpine. Fast and tiny, but text sorting might behave differently (uses musl instead of glibc).
    image: postgres:17-alpine
    container_name: postgres-db
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: main_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U devuser -d main_db" ]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Containerfile.dev
    container_name: user-api
    environment:
      DATABASE_URL: postgresql://devuser:devpassword@postgres:5432/main_db?schema=public
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend:/app
      - /app/node_modules

  # Frontend React App
  frontend:
    build:
      context: ./frontend
      dockerfile: Containerfile.dev
    container_name: user-frontend
    environment:
      VITE_API_URL: http://localhost:3000/api/users
    ports:
      - "5173:5173"
    depends_on:
      - backend
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  pgdata:
    driver: local
\`\`\`

> **NOTE:** The browser calls the API, so \`VITE_API_URL\` uses \`localhost\`, not the \`backend\` service name.

### Production compose file

\`compose.prod.yml\` reads the credentials from environment variables.

\`\`\`yaml
services:
  # PostgreSQL
  postgres:
    image: postgres:17-alpine
    container_name: postgres-db-prod
    restart: always
    environment:
      POSTGRES_USER: \${POSTGRES_USER:-produser}
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-prodpassword}
      POSTGRES_DB: \${POSTGRES_DB:-prod_db}
    ports:
      - "5432:5432"
    volumes:
      - pgdata_prod:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U \${POSTGRES_USER:-produser} -d \${POSTGRES_DB:-prod_db}" ]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Containerfile.prod
    container_name: user-api-prod
    restart: always
    environment:
      DATABASE_URL: postgresql://\${POSTGRES_USER:-produser}:\${POSTGRES_PASSWORD:-prodpassword}@postgres:5432/\${POSTGRES_DB:-prod_db}?schema=public
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy

  # Frontend (Served via Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Containerfile.prod
    container_name: user-frontend-prod
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  pgdata_prod:
    driver: local
\`\`\`

For \`compose.prod.yml\`, the container engine reads these values from your shell or from a local \`.env\` file:

- \`POSTGRES_USER\`
- \`POSTGRES_PASSWORD\`
- \`POSTGRES_DB\`

> **CAUTION:** If a variable is not set, the stack uses the default values (\`produser\`, \`prodpassword\`, \`prod_db\`). Set all 3 variables before you start the production stack. Do not use the default password in production.

## Run the application

1. On macOS, start the Podman machine:

   \`\`\`bash
   podman machine start
   \`\`\`

   If you use Docker, open Docker Desktop and make sure that it runs.

2. In the project root directory, build and start the containers.

   For development:

   \`\`\`bash
   podman compose -f compose.dev.yml up --build
   \`\`\`

   For production:

   \`\`\`bash
   podman compose -f compose.prod.yml up -d --build
   \`\`\`

   The \`--build\` flag builds the images again. After the first build, you can leave out \`--build\`.

3. Open the application:

   | Part | URL |
   | --- | --- |
   | Frontend (development) | \`http://localhost:5173\` |
   | Frontend (production) | \`http://localhost:80\` |
   | Backend API | \`http://localhost:3000\` |
   | Health check | \`http://localhost:3000/health\` |

In development mode, the compose file maps the local directories into the containers. A change to a local file shows in the running container immediately.

### Build the images manually

| Image | Command |
| --- | --- |
| Backend (development) | \`podman build -t user-api-dev -f backend/Containerfile.dev ./backend\` |
| Backend (production) | \`podman build -t user-api-prod -f backend/Containerfile.prod ./backend\` |
| Frontend (development) | \`podman build -t user-frontend-dev -f frontend/Containerfile.dev ./frontend\` |
| Frontend (production) | \`podman build -t user-frontend-prod -f frontend/Containerfile.prod ./frontend\` |

### Test the API

Use curl to test each endpoint:

\`\`\`bash
# Create a user
curl -X POST http://localhost:3000/api/users \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","email":"john@example.com"}'

# Get all users
curl http://localhost:3000/api/users

# Get user by ID
curl http://localhost:3000/api/users/1

# Update user
curl -X PUT http://localhost:3000/api/users/1 \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Updated","email":"john@example.com","role":"user"}'

# Promote to admin
curl -X POST http://localhost:3000/api/users/1/promote

# Delete user
curl -X DELETE http://localhost:3000/api/users/1
\`\`\`

### Stop the application

\`\`\`bash
# docker-compose down
podman compose down
\`\`\`

To also remove the volumes, run this command. It deletes the database data.

\`\`\`bash
# docker-compose down -v
podman compose down -v
\`\`\`

## Run commands in containers

Use these commands to monitor the containers or to run commands inside them.

### List the containers

\`\`\`bash
# List only running containers
# docker ps
podman ps

# List ALL containers (including stopped ones)
# docker ps -a
podman ps -a
\`\`\`

### Run a command in a running container

\`\`\`bash
# Syntax: podman exec [options] <container_name_or_id> <command>
podman exec -it <container_name> /bin/sh
\`\`\`

| Option | Description |
| --- | --- |
| \`-i\`, \`--interactive\` | Keep STDIN open, also when you are not attached. |
| \`-t\`, \`--tty\` | Allocate a pseudo-TTY. |
| \`-it\` | Both options together let you use the shell of the container. |

### Common commands

| Task | Podman command | Docker command |
| --- | --- | --- |
| Open a shell in the backend container | \`podman exec -it user-api /bin/sh\` | \`docker exec -it user-api /bin/sh\` |
| Open a shell in the frontend container | \`podman exec -it user-frontend /bin/sh\` | \`docker exec -it user-frontend /bin/sh\` |
| Run a Prisma command in the backend | \`podman exec -it user-api npx prisma migrate status\` | \`docker exec -it user-api npx prisma migrate status\` |
| Connect to PostgreSQL with \`psql\` | \`podman exec -it postgres-db psql -U devuser -d main_db\` | \`docker exec -it postgres-db psql -U devuser -d main_db\` |
| Install a package that you added to \`package.json\` on the host, without a restart | \`podman exec -it user-api npm install\` | \`docker exec -it user-api npm install\` |

> **NOTE:** \`podman exec\` and \`podman restart\` use the container names from the development compose file (\`user-api\`, \`user-frontend\`, \`postgres-db\`), not the service names. \`podman compose\` commands use the service names (\`backend\`, \`frontend\`, \`postgres\`).

### Run a one-off command

This command runs in a new container. The container stops and removes itself when the command ends.

\`\`\`bash
# docker run --rm -it alpine echo "Hello World"
podman run --rm -it alpine echo "Hello World"
\`\`\`

## Debug the backend

A debugger that you attach to the code in a container lets you set breakpoints, look at variables, and step through the code. For the backend, enable the Node.js inspector and publish the debug port 9229 to the host.

1. Change the \`backend\` service in the compose file. Publish the debug port and send the inspector flag in an environment variable:

   \`\`\`yaml
     backend:
       ...
       ports:
         - "3000:3000"
         - "9229:9229" # Node.js Inspector port
       environment:
         - DATABASE_URL=postgresql://devuser:devpassword@postgres:5432/main_db?schema=public
         - NODE_OPTIONS=--inspect=0.0.0.0:9229
   \`\`\`

2. Create \`.vscode/launch.json\` in the project root. This file tells VS Code how to connect:

   \`\`\`json
   {
     "version": "0.2.0",
     "configurations": [
       {
         "name": "Podman: Attach to Backend",
         "type": "node",
         "request": "attach",
         "address": "localhost",
         "port": 9229,
         "localRoot": "\${workspaceFolder}/backend",
         "remoteRoot": "/app",
         "skipFiles": ["<node_internals>/**"]
       }
     ]
   }
   \`\`\`

3. Start the containers with \`podman compose up\`.
4. In VS Code, open the **Run and Debug** sidebar (\`Cmd+Shift+D\`).
5. Select **Podman: Attach to Backend** and press F5.
6. Set a breakpoint in a \`src/*.ts\` file and send a request to the API.

## Debug the frontend

The frontend code runs in the browser, so you debug it mainly in the browser. You can also connect VS Code to the browser.

### Use the browser DevTools

This is the recommended method.

1. Open the frontend in Chrome: \`http://localhost:5173\` (development) or \`http://localhost:80\` (production).
2. Press F12 or \`Cmd+Option+I\` to open DevTools.
3. Go to the **Sources** tab.
4. Press \`Cmd+P\` and type the name of the component, for example \`UserList.tsx\`.
5. Set breakpoints in the browser.

### Debug in VS Code with Chrome

1. Add this configuration to \`.vscode/launch.json\`:

   \`\`\`json
   {
     "name": "Podman: Debug Frontend (Chrome)",
     "type": "chrome",
     "request": "launch",
     "url": "http://localhost:5173",
     "webRoot": "\${workspaceFolder}/frontend/src"
   }
   \`\`\`

2. Press F5 in VS Code.

   **Result:** VS Code opens a new Chrome instance. The breakpoints in VS Code are synced with the source code.

> **TIP:** For hot reload and debugging, use the development containers, not the production Nginx build.

## Run PostgreSQL with Podman

Podman is a secure, rootless alternative to Docker. A database in Podman keeps the development environment clean and consistent.

### Keep data in a volume

A Podman volume keeps the data when the container restarts or when you delete the container. Volumes are the preferred way to keep data that containers make and use.

### Use a compose file for the database

This compose file runs only PostgreSQL. Podman uses the same format as Docker Compose. The standard \`postgres\` image is multi-arch, so it runs on ARM64 devices.

\`\`\`yaml
# version: '3.8'

services:
  # PostgreSQL Optimized for ARM64 device
  postgres:
    # Using the official arm64v8/postgres image or standard postgres which is multi-arch
    # THE "HEAVYWEIGHT": Based on Debian. Best for production. Handles different languages and sorting (locales) perfectly.
    # image: postgres:17
    # THE "LIGHTWEIGHT": Based on Alpine. Fast and tiny, but text sorting might behave differently (uses musl instead of glibc).
    image: postgres:17-alpine
    container_name: postgres-db
    # restart: always
    environment:
      POSTGRES_USER: devuser
      POSTGRES_PASSWORD: devpassword
      POSTGRES_DB: main_db
    ports:
      - "5432:5432"
    volumes:
      # Data persistence: maps local volume to container's data directory
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U devuser -d main_db" ]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
    driver: local
\`\`\`

### Start the database

1. On macOS, make sure that the Podman machine runs.
2. Pull the image and start the database:

   \`\`\`bash
   # docker compose -f docker-compose.yml up -d
   # podman compose -f compose.yml up -d
   podman compose -f compose.dev.yml up postgres
   \`\`\`

   | Part | Description |
   | --- | --- |
   | \`-f <file>\` | Use this file in place of the default \`compose.yml\`. |
   | \`up\` | Build, create (or create again), start, and attach to the containers of a service. |
   | \`-d\` | Run the containers in detached mode (in the background). |

3. Make sure that the volume exists:

   \`\`\`bash
   # docker volume ls
   podman volume ls
   # docker volume inspect pgdata
   podman volume inspect pgdata
   \`\`\`

> **NOTE:** Verify the volume name with \`podman volume ls\`. Compose usually adds the project name to the volume name (for example \`user-management-app_pgdata\`). Use that name with \`podman volume inspect\`.

### Connect to the database

| Method | Settings |
| --- | --- |
| Prisma on the host | \`DATABASE_URL="postgresql://devuser:devpassword@localhost:5432/main_db?schema=public"\` in \`.env\` |
| \`psql\` in the container | \`podman exec -it postgres-db psql -U devuser -d main_db\` (Docker: \`docker exec -it postgres-db psql -U devuser -d main_db\`) |
| Database GUI (for example TablePlus or DBeaver) | Host \`localhost\`, port \`5432\`, user \`devuser\`, password \`devpassword\`, database \`main_db\` |

> **NOTE:** Prisma in a container uses the host name \`postgres\` (the service name). Prisma on the host uses \`localhost\`.

### Connect with the VS Code PostgreSQL extension

Use the [PostgreSQL extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-ossdata.vscode-pgsql).

1. Click the **PostgreSQL** icon in the Activity Bar on the left side of VS Code.
2. In the **PostgreSQL explorer**, click the **+** button to add a connection.
3. Enter the connection details in the prompts at the top of the VS Code window:

   | Prompt | Value |
   | --- | --- |
   | Host Name | \`localhost\` |
   | PostgreSQL User | \`devuser\` (or the value in your \`.env\`) |
   | PostgreSQL Password | \`devpassword\` (or the value in your \`.env\`) |
   | Port | \`5432\` |
   | Connection Method | \`Standard\` (if you did not configure SSL) |
   | Database Name | \`main_db\` |
   | Display Name | \`main_db\` (or a name that you prefer) |

**Result:** The database shows in the PostgreSQL sidebar. Expand it to see \`main_db\`, its schemas (usually \`public\`), and your tables.

### Performance

On many systems, Podman performs better because it is rootless and has no daemon. Make sure that the Podman machine has sufficient resources. To see them, run \`podman machine inspect\`.

If you use Docker Desktop and the disk I/O is slow, enable VirtioFS:

1. Go to **Settings** > **General**.
2. Under **Choose which file sharing implementation to use**, select **VirtioFS**. VirtioFS gives better performance for volume mounts on ARM64 devices.

## Back up and restore a database on macOS

These steps back up a PostgreSQL database and restore it to a different environment, for example from staging to local development.

1. Install the PostgreSQL client tools without the server. If you do not have Homebrew, install it from [brew.sh](https://brew.sh) first.

   \`\`\`bash
   # Install the library containing psql and pg_dump
   brew install libpq

   # Force link it so the commands are available in your terminal
   echo 'export PATH="'$(brew --prefix)'/opt/libpq/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   \`\`\`

   **Result:** \`psql --version\` shows a version number.

2. Connect to the source database and make a plain-text \`.sql\` backup:

   \`\`\`bash
   pg_dump -h <source_host> -U <source_user> -d <database> -f backup.sql
   \`\`\`

   The command asks for the password. To skip the prompt, run \`export PGPASSWORD='your_password'\` before the command. This puts the password in your terminal history.

3. Change the owner in the backup file. This is the most important step. A dump usually contains \`OWNER TO <old_user>\` commands. If the new environment uses a different user name, the restore fails.

   \`\`\`bash
   # Replace 'old_owner' with the user from the original DB
   # Replace 'new_owner' with your current environment's username
   sed -i '' 's/OWNER TO old_owner/OWNER TO new_owner/g' backup.sql

   # Optional: Also replace any specific GRANT permissions if they cause errors
   sed -i '' 's/TO old_owner/TO new_owner/g' backup.sql
   \`\`\`

   > **TIP:** To find the old owner, open \`backup.sql\` and search for \`OWNER TO\`. A line such as \`ALTER TABLE public.mytable OWNER TO postgres;\` shows that \`postgres\` is the old owner.

4. If the target database does not exist, create it. The command connects to the default \`postgres\` database.

   \`\`\`bash
   # Connect to 'postgres' (default db) to create your new one
   psql -h <target_host> -U <target_user> -c "CREATE DATABASE <database>;"
   \`\`\`

5. Run the restore script. \`ON_ERROR_STOP=on\` is recommended, so that \`psql\` does not ignore failures.

   \`\`\`bash
   # -f: the file we just edited
   # --set ON_ERROR_STOP=on: highly recommended so it doesn't ignore failures
   psql -h <target_host> -U <target_user> -d <database> --set ON_ERROR_STOP=on -f backup.sql
   # pg_restore -h <target_host> -U <target_user> -d <database> --clean --if-exists backup.dump
   # Mention: update the production owner to the local db owner (see step 3)
   \`\`\`

### Maintenance commands

| Command | Description |
| --- | --- |
| \`podman machine start\` | Starts the Podman virtual machine (macOS). |
| \`podman compose -f compose.dev.yml up\` | Starts all services in the development environment. |
| \`podman compose -f compose.dev.yml up postgres\` | Starts only the PostgreSQL database service. |
| \`podman compose -f compose.dev.yml build backend --no-cache\` | Builds the backend service again without the cache. |
| \`dropdb -h localhost -U devuser "main_db";\` | Drops (deletes) the local development database. |
| \`createdb -h localhost -U devuser "main_db";\` | Creates a new local development database. |
| \`pg_dump -h <prod_host> -U <prod_user> -d <prod_db> -f prod_backup.sql;\` | Dumps the production database to a file. |
| \`pg_dump -h localhost -U devuser -d main_db -f local_backup.sql;\` | Dumps the local database to a file. |
| \`psql -h localhost -U devuser -d main_db -f backup.sql;\` | Restores a database from a backup file. |

### Backup summary

| Command | Why use it |
| --- | --- |
| \`brew install libpq\` | Gets the tools without the server background process. |
| \`pg_dump ... -f file.sql\` | Makes a text backup that people can read. |
| \`sed -i '' 's/.../.../g'\` | Changes the owner in the file on macOS. |
| \`psql ... -f file.sql\` | Reads the script and builds the database again. |

## Next steps

Try these improvements:

- **Authentication:** Add JWT-based authentication.
- **Validation:** Use Zod or Yup to validate data.
- **Testing:** Add Jest or Vitest unit tests.
- **Pagination:** Add pagination for large data sets.
- **Search:** Add a search function.
- **Deployment:** Deploy to AWS, Azure, or DigitalOcean.

## Troubleshooting

### Command not found: podman-compose

**Cause:** Podman Desktop contains the Podman engine, but not the legacy Python script \`podman-compose\`. Podman Desktop uses the official \`docker-compose\` binary as an external provider.

**Fix:**

1. Remove broken symlinks from earlier Docker installations:

   \`\`\`bash
   sudo rm -f /usr/local/bin/docker-compose
   \`\`\`

2. Open **Podman Desktop** > **Settings** > **Resources**.
3. Find **Compose** and click **Setup**.
4. Use the new syntax, with a space in place of the hyphen:

   \`\`\`bash
   podman compose up
   \`\`\`

### Credential error: docker-credential-desktop not found

**Error:** \`exec: "docker-credential-desktop": executable file not found\`

**Cause:** Old settings in \`~/.docker/config.json\` point to Docker Desktop tools that do not exist. This can occur after you move from Docker Desktop to Podman.

**Fix:** Reset the configuration. This is the most reliable way to remove old Docker settings.

1. Delete the old Docker configuration folder:

   \`\`\`bash
   rm -rf ~/.docker
   \`\`\`

2. In Podman Desktop, go to **Settings** > **Resources** > **Compose**.
3. Run **Setup** again.

   **Result:** Podman makes a new \`config.json\` for macOS (\`osxkeychain\`).

4. Show the file:

   \`\`\`bash
   cat ~/.docker/config.json
   \`\`\`

   **Result:** The file contains \`"credsStore": "osxkeychain"\`.

### Port already in use

**Error:** \`Bind for 0.0.0.0:5432 failed: port is already allocated\`

**Fix:** Stop the process that uses the port:

\`\`\`bash
# Find process using the port
lsof -i :5432

# Kill the process
kill -9 <PID>
\`\`\`

Or change the host port in the compose file:

\`\`\`yaml
ports:
  - "5433:5432"
\`\`\`

### Prisma Client not generated

**Error:** \`Cannot find module '@prisma/client'\`

**Fix:**

\`\`\`bash
cd backend
npx prisma generate
\`\`\`

### Prisma Client out of sync

**Error:** TypeScript errors such as \`Property 'phoneNumber' does not exist on type 'User'\` for a field that exists in \`schema.prisma\`.

**Cause:** The generated Prisma Client files do not match \`schema.prisma\`. This occurs when you change the schema and do not generate the client again.

**Fix:** Run \`npx prisma generate\` in the \`backend\` folder to update the type definitions.

### Prisma migration error P3015

**Error:** \`P3015: Could not find the migration file at prisma/migrations/.../migration.sql\`

**Cause:** A migration directory exists, but it is empty or has no \`migration.sql\` file. This occurs when a migration stops before it completes (for example, with Ctrl+C).

When you run \`npx prisma migrate dev\`, Prisma compares \`schema.prisma\` with the database schema. If there are changes, Prisma:

1. Creates a directory in \`prisma/migrations/\`.
2. Writes a \`migration.sql\` file with the SQL commands for the changes in that directory.
3. Applies the SQL to the database.

**Fix:**

1. Delete the empty migration folder from \`prisma/migrations\`.
2. Run \`npx prisma migrate dev\` again.

> **NOTE:** If Prisma finds drift (the schema is out of sync), it can ask to reset the database. See [Prevent data loss in migrations](#prevent-data-loss-in-migrations).

### Prevent data loss in migrations

> **CAUTION:** Prisma asks before it resets the database (\`...Do you want to continue? All data will be lost.\`). If you see this prompt and your data is important, type **N**.

In production:

- Never run \`migrate dev\` in production. It is for development, and it can try to reset the database when it finds conflicts.
- Always use \`migrate deploy\` in production. It applies pending migrations. If there is a conflict, it fails (exit code 1) and does not reset the database.

In development:

- If you are not sure about a change, run \`npx prisma migrate dev --create-only\`. This command writes the SQL file but does not apply it. Examine the SQL, for example to make sure that new non-null columns get default values.
- Before you fix drift or apply a risky change, back up the container data:

  \`\`\`bash
  podman exec -t <container_name> pg_dump -U <username> -d <dbname> > backup.sql
  \`\`\`

If \`migrate dev\` asks for a reset because of "Drift detected", fix the conflict without a reset:

1. Answer **No** to the reset.
2. Read the actual database state into the schema: \`npx prisma db pull\`.
3. Compare the updated \`schema.prisma\` with your earlier version to see the manual changes in the database.
4. Keep the manual changes (add them to your schema), or discard them (revert the database changes manually).

### Cannot reach database server

**Error:** \`Can't reach database server\`

**Fix:**

- Make sure that the PostgreSQL container is healthy: \`podman compose ps\` (Docker: \`docker compose ps\`).
- Examine the \`DATABASE_URL\` environment variable.
- Wait until the health check shows that the database is ready.

### CORS errors

**Error:** \`Access to fetch at 'http://localhost:3000' has been blocked by CORS policy\`

**Fix:**

- Make sure that the backend uses the \`cors()\` middleware.
- Make sure that the frontend sends requests to the correct URL.
- Build the containers again: \`podman compose up --build\` (Docker: \`docker compose up --build\`).

### Frontend cannot connect to the backend

**Fix:**

- Make sure that the backend runs: \`curl http://localhost:3000/health\`.
- Examine \`VITE_API_URL\` in \`frontend/.env\`.
- Look for errors in the browser console.
- Examine the proxy configuration in \`nginx.conf\`.

### New package not found

**Error:** You ran \`npm install <package>\` on your Mac, but the application in Podman fails with \`Error: Cannot find module '<package>'\`.

**Cause:** The compose file can isolate \`node_modules\` in the container from \`node_modules\` on the host. Also, packages that you install on macOS can contain binaries that do not work on Linux (Alpine) in the container.

**Fix:**

1. Install the package in the running container:

   \`\`\`bash
   podman exec -it user-api npm install
   \`\`\`

2. If that does not work, restart the container with a build. This is the most reliable method:

   \`\`\`bash
   podman compose up --build backend
   \`\`\`

3. Make sure that \`.containerignore\` (or \`.dockerignore\`) contains \`node_modules\`. Then the build does not copy the macOS modules into the container, and the container builds compatible versions.

### Vite import resolution error

**Error:** \`[plugin:vite:import-analysis] Failed to resolve import "@some/package" from "src/components/SomeComponent.tsx". Does the file exist?\`

**Cause:** The package is in \`package.json\` on the host, but it is not in \`node_modules\` in the container, because:

- The compose file uses an anonymous volume for \`node_modules\` (\`- /app/node_modules\`), so the host binaries do not overwrite it.
- The image was built before you added the dependency to \`package.json\`.
- The container uses old cached packages.

**Fix:** Build the image again to run a new \`npm install\` with the updated \`package.json\`:

\`\`\`bash
# Rebuild and restart all services
podman compose -f compose.dev.yml up --build

# Or rebuild just the frontend service (rather run these commands separately)
podman compose -f compose.dev.yml down frontend && podman compose -f compose.dev.yml build frontend --no-cache && podman compose -f compose.dev.yml up
\`\`\`

> **TIP:** Always build the image again after you add dependencies to \`package.json\`.

### Android emulator cannot open localhost

**Error:** The app in an Android emulator cannot connect to \`http://localhost:5173\` or \`http://localhost:3000\`.

**Cause:** The Android emulator has its own virtual network. On the emulator, \`localhost\` is the emulator, not your Mac.

**Fix:**

1. Make sure that the Vite dev server listens on all network interfaces. The \`server\` settings (\`host: true\` and \`usePolling: true\`) in [Configure the frontend](#configure-the-frontend) do this.
2. Restart the frontend container:

   \`\`\`bash
   podman restart user-frontend
   \`\`\`

3. Map the emulator ports to the ports on your computer with \`adb reverse\`:

   \`\`\`bash
   # Map frontend port
   adb reverse tcp:5173 tcp:5173
   
   # Map backend port
   adb reverse tcp:3000 tcp:3000
   \`\`\`

4. Open Chrome in the Android emulator and go to \`http://localhost:5173\`.

   **Result:** The app loads.

### Podman machine not running on macOS

**Fix:**

1. Open a terminal.
2. Start the machine: \`podman machine start\`.
3. Make sure that it runs: \`podman ps\`.

If you use Docker Desktop, open the Docker Desktop application and wait for the "Docker Desktop is running" status. Then run \`docker ps\`.

## Related links

- [Prisma documentation](https://www.prisma.io/docs)
- [React documentation](https://react.dev)
- [Podman documentation](https://docs.podman.io)
- [Docker documentation](https://docs.docker.com)
- [PostgreSQL documentation](https://www.postgresql.org/docs)
- [Express documentation](https://expressjs.com)
- [Vite configuration](https://vite.dev/config/)
- [PostgreSQL extension for VS Code](https://marketplace.visualstudio.com/items?itemName=ms-ossdata.vscode-pgsql)
- [Homebrew](https://brew.sh)
- [React cheat sheet](doc:react-cheatsheet)
`;export{e as default};
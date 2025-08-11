import NextAuth from 'next-auth';
import { authOptions } from '@Library/Authentication';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
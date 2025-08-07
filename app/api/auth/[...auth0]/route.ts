import { handleAuth, handleLogin } from '@auth0/nextjs-auth0/server'

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      prompt: 'login',
    },
  }),
})

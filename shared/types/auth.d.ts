declare module '#auth-utils' {
  interface User {
    id: string
    username: string
    displayName: string
  }

  interface UserSession {
    loggedInAt: number
  }
}

export {}

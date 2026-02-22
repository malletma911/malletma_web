export default function middleware(request) {
  const url = new URL(request.url)

  // Let auth routes through without checking
  if (url.pathname.startsWith('/api/auth')) {
    return
  }

  const token = request.cookies.get('session')?.value
  if (!token) {
    return Response.redirect(new URL('/api/auth/login', request.url))
  }
}

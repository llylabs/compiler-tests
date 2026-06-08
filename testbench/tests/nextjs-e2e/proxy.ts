// Middleware that redirects /old to /new and adds a header
import { NextResponse } from 'next/server';

export function proxy(request) {
  var path = request.nextUrl.pathname;
  if (path === "/old-path") {
    return NextResponse.redirect("/about");
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/old-path"],
};

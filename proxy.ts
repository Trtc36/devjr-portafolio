import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const nextIntlProxy = createMiddleware(routing);

export default nextIntlProxy;

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};

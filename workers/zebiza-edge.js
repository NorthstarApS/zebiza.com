/**
 * Edge router for zebiza.com
 * - WordPress paths → origin VPS via DNS-only hostname (avoids CF error 1003)
 * - Everything else → Cloudflare Pages (zebiza-com.pages.dev)
 */
const ORIGIN_RESOLVE = "origin.zebiza.com"; // DNS-only A → 62.66.144.161
const PAGES_HOST = "zebiza-com.pages.dev";

function isWordPressPath(pathname) {
  return (
    pathname.startsWith("/wp-json") ||
    pathname.startsWith("/wp-content") ||
    pathname.startsWith("/wp-includes") ||
    pathname.startsWith("/wp-admin") ||
    pathname.startsWith("/wp-login") ||
    pathname.startsWith("/wp-cron") ||
    pathname === "/xmlrpc.php" ||
    pathname.startsWith("/wc-api") ||
    pathname.startsWith("/wc-auth")
  );
}

async function proxyOrigin(request) {
  // Keep public URL host as zebiza.com for cookies/CORS, but resolve DNS to grey-cloud origin.
  return fetch(request, {
    cf: { resolveOverride: ORIGIN_RESOLVE },
    redirect: "manual",
  });
}

async function proxyPages(request) {
  const target = new URL(request.url);
  target.hostname = PAGES_HOST;
  target.protocol = "https:";
  return fetch(new Request(target.toString(), request));
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.hostname === "www.zebiza.com") {
      url.hostname = "zebiza.com";
      return Response.redirect(url.toString(), 301);
    }

    if (isWordPressPath(url.pathname)) {
      return proxyOrigin(request);
    }

    return proxyPages(request);
  },
};

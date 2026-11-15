export default {
  async fetch(request, env) {
    // 1. 你的 GitHub Client ID（已填好）
    const GITHUB_CLIENT_ID = "Ov23liHqblRTY454l0BV";
    
    // 2. ?? 请把下方引号里的中文字，替换为你真实的 Client Secret
    const GITHUB_CLIENT_SECRET = "e801ea2581a2ad7a462d79a8fbbf9f8a01eedf03"; 
    
    const url = new URL(request.url);
    
    // 处理跨域
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        }
      });
    }

    // 接收登录请求，跳转至 GitHub
    if (url.pathname === "/auth") {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // GitHub 授权后的回调
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing code", { status: 400 });

      // 换取 Token
      const response = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code: code
        })
      });

      const data = await response.json();
      const token = data.access_token;

      // 将 Token 传回给 Sveltia CMS 前端
      const html = `
        <html>
          <body>
            <script>
              window.opener.postMessage(
                'authorization:github:success:${JSON.stringify({ token, provider: "github" })}',
                '*'
              );
              window.close();
            </script>
          </body>
        </html>
      `;
      return new Response(html, { headers: { "Content-Type": "text/html" } });
    }

    return new Response("Not Found", { status: 404 });
  }
};
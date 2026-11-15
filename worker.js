export default {
  async fetch(request, env) {
    // 1. 你的 GitHub Client ID
    const GITHUB_CLIENT_ID = "Ov23liHqblRTY454l0BV";
    
    // 2. 你的 GitHub Client Secret
    const GITHUB_CLIENT_SECRET = "e801ea2581a2ad7a462d79a8fbbf9f8a01eedf03"; 
    
    const url = new URL(request.url);
    
    // 处理 OPTIONS 预检请求和全局跨域
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        }
      });
    }

    // 接收登录请求，跳转至 GitHub 授权页面
    if (url.pathname === "/auth") {
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=repo,user`;
      return Response.redirect(githubAuthUrl, 302);
    }

    // GitHub 授权后的回调处理
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      if (!code) return new Response("Missing code", { status: 400 });

      // 用 code 换取 GitHub Access Token
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

      if (!token) {
        return new Response("Failed to get token from GitHub", { status: 500 });
      }

      // 将 Token 传回给 Sveltia CMS 前端 (修复了原本的跨域传话问题)
      const html = `
        <html>
          <body>
            <script>
              // 1. 接收方（前端页面）
              const targetOrigin = "https://mall.docbulk.com"; 
              
              // 2. 发送登录成功消息
              window.opener.postMessage(
                'authorization:github:success:${JSON.stringify({ token, provider: "github" })}',
                targetOrigin
              );
              
              // 3. 尝试关闭这个弹窗
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

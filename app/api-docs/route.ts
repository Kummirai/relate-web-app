const SWAGGER_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Relate World API — Swagger UI</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background: #f5f8fb;
      }
      .rw-header {
        background: #1d2a4d;
        color: #fff;
        padding: 14px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }
      .rw-header h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
      }
      .rw-header h1 span {
        color: #13c5dd;
      }
      .rw-header nav {
        display: flex;
        align-items: center;
        gap: 16px;
        font-size: 13px;
      }
      .rw-header a {
        color: #fff;
        text-decoration: none;
        transition: color 0.15s;
      }
      .rw-header a:hover {
        color: #13c5dd;
      }
      .rw-header .pill {
        background: #13c5dd;
        color: #1d2a4d;
        font-weight: 600;
        padding: 5px 12px;
        border-radius: 999px;
      }
      .rw-header .pill:hover {
        background: #67e3f5;
        color: #1d2a4d;
      }
      .swagger-ui .topbar {
        display: none;
      }
      #swagger-ui {
        max-width: 1460px;
        margin: 0 auto;
        padding: 16px 20px 48px;
      }
    </style>
  </head>
  <body>
    <header class="rw-header">
      <h1>Relate World <span>API</span> — Swagger UI</h1>
      <nav>
        <a href="/">Developer docs</a>
        <a href="/openapi.json">openapi.json</a>
      </nav>
    </header>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.ui = SwaggerUIBundle({
          url: "/openapi.json",
          dom_id: "#swagger-ui",
          deepLinking: true,
          displayOperationId: true,
          docExpansion: "list",
          filter: true,
          persistAuthorization: false,
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1,
          tryItOutEnabled: true,
          presets: [SwaggerUIBundle.presets.apis],
          layout: "BaseLayout",
        });
      };
    </script>
  </body>
</html>`;

export async function GET() {
  return new Response(SWAGGER_HTML, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
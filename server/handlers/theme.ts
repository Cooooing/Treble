import { enhance } from "@universal-middleware/core";
import { json } from ".";

const handlers = [
  enhance(
    async (_request, context, _runtime) => {
      const theme = context.theme || "default";
      return new Response(json({ theme }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    },
    { name: "fishpi:get-theme", path: `/api/theme`, method: ["GET"], immutable: false },
  ),
  enhance(
    async (request, context, _runtime) => {
      const res = await request.json();
      const theme = res.theme || "default";
      context.theme = theme;
      // Here you can add logic to save the theme preference, e.g., in a database
      return new Response(json({ success: true, theme }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    },
    { name: "fishpi:set-theme", path: `/api/theme`, method: ["POST"], immutable: false },
  )
];

export default handlers;
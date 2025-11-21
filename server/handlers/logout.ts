import { enhance } from "@universal-middleware/core";
import { json } from ".";

const handlers = [
  enhance(
    async (request, context, _runtime) => {
      // 清除 session 中的 token 和 user 信息
      if (request.session) {
        request.session.token = null;
        request.session.user = null;
        request.session.save();
      }
      return new Response(json({ success: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      });
    },
    { name: "fishpi:logout", path: `/api/logout`, method: ["POST"], immutable: false },
  )
];

export default handlers;
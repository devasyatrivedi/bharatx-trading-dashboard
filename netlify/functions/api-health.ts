import type { Handler } from "@netlify/functions";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

const handler: Handler = async () => {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ status: "ok" }),
  };
};

export { handler };

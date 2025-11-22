import fs from "fs";

export function json(data: any, msg = '', code = 200) {
  return JSON.stringify({
    code,
    msg,
    data,
  });
}

const { FishPi, ArticleListType } = require('fishpi');

const apiKey = 'a9e6ef6afcce8725f81adf2f4dbffa760b220c896a938e7a01f36559e7c8e1603d21d5672dadffaf7edb3b90cd98b476e8ac60d34667778c577c25e87c15e2084b319e8ad17c20fa1cea3e86b2b676e4280f00f047e80c6bf74a56e5903c89b5';
const tokens = {
  imlinhanchao: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7IlVzZXIiOnsiaWQiOjIsIm5hbWUiOiJpbWxpbmhhbmNoYW8iLCJuaWNrbmFtZSI6IuaIkeaYr-i3s-i3s-WQpyIsImVtYWlsIjoiaW1saW5oYW5jaGFvQGZveG1haWwuY29tIiwiYXZhdGFyX3VybCI6Imh0dHBzOi8vdHJlYmxlLnN4aXNhLmNvbS9hcGkvdXNlci92MS91c2VyL2F2YXRhci9pbWxpbmhhbmNoYW8iLCJzdGF0dXMiOjAsImZvbGxvd19jb3VudCI6MCwiZm9sbG93ZXJfY291bnQiOjAsIm9ubGluZV9taW51dGVzIjowLCJjdXJyZW50X2NoZWNraW5fc3RyZWFrIjowLCJsb25nZXN0X2NoZWNraW5fc3RyZWFrIjowLCJsYW5ndWFnZSI6InpoLUNOIiwidGltZXpvbmUiOiJBc2lhL1NoYW5naGFpIiwidGhlbWUiOiJkZWZhdWx0IiwibW9iaWxlX3RoZW1lIjoiZGVmYXVsdCIsImVuYWJsZV93ZWJfbm90aWZ5Ijp0cnVlLCJlbmFibGVfZW1haWxfc3Vic2NyaWJlIjp0cnVlLCJwdWJsaWNfcG9pbnRzIjp0cnVlLCJwdWJsaWNfZm9sbG93ZXJzIjp0cnVlLCJwdWJsaWNfYXJ0aWNsZXMiOnRydWUsInB1YmxpY19jb21tZW50cyI6dHJ1ZSwicHVibGljX29ubGluZV9zdGF0dXMiOnRydWUsInB1YmxpY19sb2NhdGlvbiI6dHJ1ZSwiY3JlYXRlZF9hdCI6IjIwMjUtMTEtMjRUMDY6MzA6MDMuNzg2OTg4WiIsInVwZGF0ZWRfYXQiOiIyMDI1LTExLTI0VDA2OjMwOjAzLjc4Njk4OFoifSwiaXNfb25saW5lIjp0cnVlfSwiZXhwIjoxNzY2ODk5ODk1LCJuYmYiOjE3NjQzMDc4OTUsImlhdCI6MTc2NDMwNzg5NX0.vpv8cms8au_cdkNcTbc4ygbBRJNKiazLqNM6Z90IHqo`,
};
const fishpi = new FishPi(apiKey);
const host = `https://treble.sxisa.com/api`;
const user = [
    "littledead",
    "SadLarry",
    "xgy2025",
    "Gakkiyomi",
    "8573",
    "3249860962",
    "AziAzi",
    "xp",
    "23223",
    "Dominic",
    "fanzha",
    "cijiu121",
    "2864460459",
    "worker",
    "2474481080",
    "iwpz",
    "ottoli",
    "18",
    "KevinPeng",
    "178604120",
    "XZZ233",
    "xiaohui0927",
    "1284926",
    "nbtab",
    "Carrier",
    "BBIGBOSS",
    "suifeng113",
    "dreamtober",
    "woshiheihei",
    "cuijianzhe",
    "shengxiao",
    "qfxl",
    "LLzz888",
    "Hliang",
    "lucking",
    "Mogu0023",
    "RazerYang",
    "BH9527",
    "muxi147",
    "mqyo",
    "Leon007",
    "2695670521",
    "Alixy",
    "SShark",
    "pikafenger",
    "zgr123456",
    "ListeningRain",
    "ZDream03",
    "xh",
    "username",
    "star-wu",
    "dy66615",
    "OGC-KING",
    "abss",
    "M820",
    "moyupi",
    "Ivy",
    "LIYA",
    "caffish",
    "8888",
    "chenpp",
    "Cinmmyi",
    "linkin",
    "Kirito",
    "Ashe",
    "Linry",
    "baba22222",
    "ersdtfghdtrf",
    "Yui",
    "SHTJmoyuk",
    "pzjd",
    "Fenyun",
    "julismme",
    "jingjie",
    "whwhwwh",
    "tbw",
    "APTX-4869",
    "Lemon",
    "csfwff",
    "EM0",
    "wuang",
    "BoxWen",
    "yimoxuan",
    "QGNCHNA",
    "salted",
    "404notfoundd",
    "Elysia",
    "pmdm",
    "drda",
    "Liann",
    "deeplovebug",
    "BaiZaiSu",
    "Serene",
    "nini666",
    "LinkFish",
    "Aman223",
    "Emperor",
    "Hollower",
    "NgChiho",
    "z3ph",
    "dragon",
    "xiong",
    "BlackCat184",
    "xc",
    "zeshi",
    "ccc12138",
    "itsjoshua",
    "linyuan",
    "RenleyAlden",
    "zongjian",
    "wo1132930825",
    "HP12138",
    "mitu2",
    "cunliren",
    "gxy123",
    "moonnight317",
    "Sakana",
    "yizhi",
    "adlered",
    "fishpitester",
    "WTKE",
    "teminite",
    "CHANG01",
    "8624",
    "sudamasaki",
    "xiao5855",
    "fffs",
    "KipKwaiet",
    "gujiu666",
    "YueYue",
    "QianYinJX",
    "Kevin173777",
    "zainyy",
    "dissoluteFate",
    "Var",
    "KAIMI",
    "lihaoCC",
    "figer97",
    "China990517",
    "KLawrence",
    "zzz1110123",
    "hcxy0729",
    "9811",
    "mafia",
    "Hereen",
    "waynine",
    "treacy",
    "stillwarter",
    "Alivan",
    "custom",
    "hhxdy",
    "yunjisms",
    "Carzeye",
    "By-LQX",
    "Leon233",
    "aasx",
    "shilei4481",
    "yyy123",
    "JiuNian",
    "dzz",
    "xianchen",
    "MaxVerstappen",
    "S1310345286",
    "zhilian",
    "aaa12123",
    "zkl2333",
    "Lucaas",
    "BreezeHF",
    "pump",
    "javaNewCat",
    "Mani",
    "maozi",
    "yaiii",
    "AM0224",
    "littleshuang",
    "VON13",
    "moyuyu1998",
    "mrocto",
    "CSY666",
    "Morri",
    "goto",
    "single8",
    "llxiaojiu",
    "LMist",
    "xiv",
    "Yueyemeng",
    "aa1219034770",
    "HookDing",
    "Plouto",
    "otis1026",
    "gsx",
    "wwzzd",
    "Cgh"
];

async function checkUser(username) {
  if (tokens[username]) return;
  const info = await fishpi.user(username);
  if (!info) return;
  const user = await fetch(`${host}/user/v1/user/getOne`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: username,
    }),
  }).then((res) => res.json()).then(res => res.data);
  if (!user) {
    const { code_token, code } = await fetch(`${host}/user/v1/authentication/register/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: username,
        email: `${username}@example.com`,
        password: 'DefaultPassword123!',
        nickname: info.userNickname,
      }),
    }).then((res) => res.json()).then(res => {
      if (res.code !== 200) {
        throw new Error(`Failed to register: ${res.msg}`);
      }
      return res.data
    });
    // '/user/v1/authentication/register/email/verify'
    await fetch(`${host}/user/v1/authentication/register/email/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code_token,
        code,
      }),
    });
  }
  const { token } = await fetch(`${host}/user/v1/authentication/login/account`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      account: username,
      password: 'DefaultPassword123!',
    }),
  }).then((res) => res.json()).then(res => res.data);
  await fetch(`${host}/user/v1/user/updateSetting`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      avatar_url: info.avatar,
      nickname: info.userNickname,
      timezone: info.userNickname
    }),
  });
  console.log(`Registered user: ${username}`);
  tokens[username] = token;
}

async function postArticle(article) {
  if (['【市场】第三方物品交易功能已上线'].includes(article.title)) {
    console.log(`Skipping article: ${article.title}`);
    return {};
  }
  const author = article.author.userName;
  await checkUser(author);
  if (!tokens[author]) return {};
  article = await fishpi.article.detail(article.oId);
  const tArticle = {
      title: article.title,
      content: article.originalContent,
      tags: article.tags.map(tag => ({ name: tag.title })),
      anonymous: false,
      bounty_points: 0,
      commentable: true,
      type: 0,
      status: 0,
    }
  return fetch(`${host}/content/v1/article/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens[author]}`,
    },
    body: JSON.stringify({ article: tArticle }),
  }).then((res) => res.json()).then(async res => {
    if (res.code !== 200) {
      console.dir(tArticle);
      throw new Error(`Failed to post article: ${res.msg}`);
    }
    await postComment(res.data.article.id, article);
    return res.data
  });
}

async function postComment(articleId, article) {
  const comments = article.comments
  for (const comment of comments) {
    const user = comment.authorName;
    await checkUser(user);
    if (!tokens[user]) continue;
    const tComment = {
      article_id: articleId,
      content: comment.content,
    };
    // '/content/v1/comment/add'
    await fetch(`${host}/content/v1/comment/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens[user]}`,
      },
      body: JSON.stringify(tComment),
    }).then((res) => res.json()).then(res => {
      if (res.code !== 200) {
        throw new Error(`Failed to post comment: ${res.msg}`);
      }
      return res.data
    });
  }
}
async function getArticles(page = 1) {
  const articles = await fishpi.article.list({
    type: ArticleListType.Recent,
    page,
    pageSize: 20,
  }).then((response) => response.articles)
  for (const article of articles) {
    if (article.type != 0) return;
    try {
      const { article: postedArticle } = await postArticle(article);
      console.log(`Posted article: ${postedArticle?.title}, ID: ${postedArticle?.id}`);
    } catch (error) {
      console.error(`Error posting article: ${article.title}`, error.message);
    }
  }
}

async function main() {
  // for (let page = 13; page <= 23; page++) {
  //   await getArticles(page);
  // }
  for (const name of user) {
    await checkUser(name);
  }
}

main();

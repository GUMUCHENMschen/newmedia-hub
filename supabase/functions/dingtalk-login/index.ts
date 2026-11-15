// Supabase Edge Function: dingtalk-login
// 部署命令：supabase functions deploy dingtalk-login
//
// 需要在 Supabase 项目设置中配置以下 Secrets：
//   DINGTALK_APP_KEY=钉钉应用 AppKey
//   DINGTALK_APP_SECRET=钉钉应用 AppSecret
//
// 功能：用前端传来的 authCode 换取钉钉用户信息（姓名、手机号）

Deno.serve(async (req) => {
  // CORS 头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  }

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const code = url.searchParams.get('code')
    if (!code) {
      return new Response(JSON.stringify({ errcode: 400, errmsg: '缺少 code 参数' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const appKey = Deno.env.get('DINGTALK_APP_KEY')
    const appSecret = Deno.env.get('DINGTALK_APP_SECRET')
    if (!appKey || !appSecret) {
      return new Response(JSON.stringify({ errcode: 500, errmsg: '服务端未配置钉钉凭证' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // 1. 获取 access_token
    const tokenResp = await fetch(
      `https://oapi.dingtalk.com/gettoken?appkey=${appKey}&appsecret=${appSecret}`
    )
    const tokenData = await tokenResp.json()
    if (tokenData.errcode !== 0) {
      return new Response(JSON.stringify(tokenData), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const accessToken = tokenData.access_token

    // 2. 用 code 换用户 userid
    const userResp = await fetch(
      `https://oapi.dingtalk.com/topapi/v2/user/getuserinfo?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      }
    )
    const userData = await userResp.json()
    if (userData.errcode !== 0) {
      return new Response(JSON.stringify(userData), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const userid = userData.result?.userid

    // 3. 用 userid 获取用户详细信息（含手机号）
    const detailResp = await fetch(
      `https://oapi.dingtalk.com/topapi/v2/user/get?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid })
      }
    )
    const detailData = await detailResp.json()
    if (detailData.errcode !== 0) {
      return new Response(JSON.stringify(detailData), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const result = {
      userid,
      name: detailData.result?.name,
      mobile: detailData.result?.mobile,
      email: detailData.result?.email
    }

    return new Response(JSON.stringify({ errcode: 0, result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ errcode: 500, errmsg: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

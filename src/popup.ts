'use strict';

import './popup.css'; // ビルド時に読み込まれるのはここ

(function () {
  /**
   * 現在時刻を取得してDOMの書き換えを行う
   */
  function writeTime() {
    const realTime = new Date();
    const hour = realTime.getHours();
    const minutes = realTime.getMinutes();
    const seconds = realTime.getSeconds();
    const text = hour + ':' + minutes + ':' + seconds;
    document.getElementById('real-time')!.innerHTML = text;
  }

  /**
   * 1秒ごとに関数を実行
   */
  window.onload = () => {
    setInterval(writeTime, 1000);
  };

  /**
   * OAuth認証を行う
   */
  function auth() {
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;
    const scope = process.env.SCOPE;
    const accessType = 'offline';
    const responseType = 'code';

    const identityUrl =
      'https://accounts.google.com/o/oauth2/auth?' +
      `client_id=${clientId}&` +
      `redirect_uri=${redirectUri}&` +
      `scope=${scope}&` +
      `access_type=${accessType}&` +
      `response_type=${responseType}`;

    chrome.identity.launchWebAuthFlow(
      {
        url: identityUrl,
        interactive: true,
      },
      (responseUrl) => {
        if (responseUrl == undefined) throw Error('エラー');

        const url = new URL(responseUrl);
        const code = url.searchParams.get('code');

        fetch('https://accounts.google.com/o/oauth2/token', {
          method: 'post',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            code: code,
          }),
        })
          .then((response) => response.json())
          .then((json) => {
            const accessToken = json['access_token'];
            const refreshToken = json['refresh_token'];
            // ローカルにトークンを保存
            chrome.storage.local.set({
              accessToken: accessToken,
              refreshToken: refreshToken,
            });
          });
      }
    );
  }

  document.getElementById('btn')!.addEventListener('click', async () => {
    chrome.storage.local.get('accessToken', (items) => {
      alert(`accessToken: ${items.accessToken}`);
    });
  });
})();

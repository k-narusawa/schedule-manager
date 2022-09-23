'use strict';

import './popup.css'; // ビルド時に読み込まれるのはここ
import { calendarApiResponse } from './types';
import { useDate } from './util/dateUtil';

(function () {
  /**
   * 現在時刻を取得してDOMの書き換えを行う
   */
  const writeTime = async () => {
    const storage = await chrome.storage.local.get();
    const items = await storage.items;

    if (items.length == 0) {
      return;
    }
    const latestEventStartDate = items[0].start.dateTime;
    const text = useDate().getDiff(
      useDate().stringToDate(latestEventStartDate)
    );
    document.getElementById('real-time')!.innerHTML = text;
  };

  /**
   * OAuth認証を行う
   */
  const auth = () => {
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
  };

  async function createCalendarTable() {
    const storage = await chrome.storage.local.get();
    const items = await storage.items;

    // 予定が見つからなかった場合
    if (items.length == 0) return;

    const tableElement = document.createElement('table');
    const theadElement = document.createElement('thead');
    const tbodyElement = document.createElement('tbody');
    tableElement.appendChild(theadElement);
    tableElement.appendChild(tbodyElement);

    const row_1 = document.createElement('tr');
    const heading_1 = document.createElement('th');
    const heading_2 = document.createElement('th');
    const heading_3 = document.createElement('th');
    heading_1.innerHTML = '開始';
    heading_2.innerHTML = 'タイトル';
    heading_3.innerHTML = 'MeetUrl';
    row_1.appendChild(heading_1);
    row_1.appendChild(heading_2);
    row_1.appendChild(heading_3);
    theadElement.appendChild(row_1);

    for (const event of items) {
      const row_2 = document.createElement('tr');
      const row_2_data_1 = document.createElement('td');
      const row_2_data_2 = document.createElement('td');
      const row_2_data_3 = document.createElement('td');
      row_2_data_1.innerHTML = useDate().extractTimeFormat(
        event.start.dateTime
      );
      row_2_data_2.innerHTML = event.summary;
      const aTag = document.createElement('a');
      aTag.href = event.hangoutLink ? event.hangoutLink : '';
      aTag.target = '_blank'; // 別タブで開かせる
      aTag.appendChild(
        document.createTextNode(event.hangoutLink ? event.hangoutLink : '')
      );
      row_2_data_3.appendChild(aTag);
      row_2.appendChild(row_2_data_1);
      row_2.appendChild(row_2_data_2);
      row_2.appendChild(row_2_data_3);
      tbodyElement.appendChild(row_2);
    }
    const table = document.getElementById('table')!;

    // テーブルの子要素を全て削除する
    while (table.lastChild) {
      table.removeChild(table.lastChild);
    }
    document.getElementById('table')!.appendChild(tableElement);
  }

  chrome.runtime.sendMessage({ type: 'FETCH_CALENDAR' });

  chrome.alarms.create('FETCH_CALENDAR', {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name == 'FETCH_CALENDAR') {
      chrome.runtime.sendMessage({ type: 'FETCH_CALENDAR' });
    }
  });

  chrome.storage.onChanged.addListener(() => {
    createCalendarTable();
  });

  document.getElementById('reload')!.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: 'FETCH_CALENDAR' });
  });

  window.onload = () => {
    auth();
    //1分ごとに関数を実行
    setInterval(writeTime, 1000);
  };
})();

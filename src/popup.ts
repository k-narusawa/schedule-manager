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

    const header = document.createElement('tr');
    const startTimeColumn = document.createElement('th');
    const titleColumn = document.createElement('th');
    const noteColumn = document.createElement('th');
    startTimeColumn.innerHTML = '開始';
    titleColumn.innerHTML = 'タイトル';
    noteColumn.innerHTML = '備考';
    startTimeColumn.className = 'start-time';
    titleColumn.className = 'title';
    noteColumn.className = 'hang-out';
    header.appendChild(startTimeColumn);
    header.appendChild(titleColumn);
    header.appendChild(noteColumn);
    theadElement.appendChild(header);

    for (const event of items) {
      const main = document.createElement('tr');
      const startTimeColumnData = document.createElement('td');
      const titleColumnData = document.createElement('td');
      const noteColumnData = document.createElement('td');

      startTimeColumnData.innerHTML = useDate().extractTimeFormat(
        event.start.dateTime
      );
      const titleATag = document.createElement('a');
      titleATag.href = event.htmlLink ? event.htmlLink : '';
      titleATag.target = '_blank'; // 別タブで開かせる
      titleATag.appendChild(document.createTextNode(event.summary));
      titleColumnData.appendChild(titleATag);
      const noteATag = document.createElement('a');
      noteATag.href = event.hangoutLink ? event.hangoutLink : '';
      noteATag.target = '_blank'; // 別タブで開かせる
      noteATag.appendChild(
        document.createTextNode(event.hangoutLink ? 'Meet' : '')
      );
      noteColumnData.appendChild(noteATag);

      startTimeColumnData.className = 'start-time-data';
      titleColumnData.className = 'title-data';
      noteColumnData.className = 'note-data';

      main.appendChild(startTimeColumnData);
      main.appendChild(titleColumnData);
      main.appendChild(noteColumnData);
      tbodyElement.appendChild(main);
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

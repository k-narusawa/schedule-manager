'use strict';

import './popup.css'; // ビルド時に読み込まれるのはここ
import { useDate } from './util/dateUtil';

(function () {
  /**
   * 次の予定までの時刻を計算してHTMLを書き換える
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

  /**
   * 静的なHTMLを生成
   */
  const createHTML = () => {
    // ヘッダ部分の生成
    const subjectDiv = document.getElementById('subject')!;
    const subject = document.createElement('p');
    subject.innerText = chrome.i18n.getMessage('header_subject');
    subjectDiv.appendChild(subject);

    // next-schedule部分の生成
    const nextScheduleDiv = document.getElementById('next-schedule')!;
    const nextSchedule = document.createElement('p');
    nextSchedule.innerText = chrome.i18n.getMessage('main_next_appointment');
    const realTimeSpan = document.createElement('span');
    realTimeSpan.id = 'real-time';
    nextSchedule.appendChild(realTimeSpan);
    nextScheduleDiv.appendChild(nextSchedule);
  };

  /**
   * カレンダーのレンダリングを実行
   * @returns
   */
  const createCalendarTable = async () => {
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
    const summaryColumn = document.createElement('th');
    const noteColumn = document.createElement('th');
    startTimeColumn.innerHTML = chrome.i18n.getMessage('table_header_start');
    summaryColumn.innerHTML = chrome.i18n.getMessage('table_header_summary');
    noteColumn.innerHTML = chrome.i18n.getMessage('table_header_note');
    startTimeColumn.className = 'start-time';
    summaryColumn.className = 'title';
    noteColumn.className = 'hang-out';
    header.appendChild(startTimeColumn);
    header.appendChild(summaryColumn);
    header.appendChild(noteColumn);
    theadElement.appendChild(header);

    for (const event of items) {
      const main = document.createElement('tr');
      const startTimeColumnData = document.createElement('td');
      const summaryColumnData = document.createElement('td');
      const noteColumnData = document.createElement('td');

      startTimeColumnData.innerHTML = useDate().extractTimeFormat(
        event.start.dateTime
      );
      const titleATag = document.createElement('a');
      titleATag.href = event.htmlLink ? event.htmlLink : '';
      titleATag.target = '_blank'; // 別タブで開かせる
      titleATag.appendChild(document.createTextNode(event.summary));
      summaryColumnData.appendChild(titleATag);
      const noteATag = document.createElement('a');
      noteATag.href = event.hangoutLink ? event.hangoutLink : '';
      noteATag.target = '_blank'; // 別タブで開かせる
      noteATag.appendChild(
        document.createTextNode(event.hangoutLink ? 'Meet' : '')
      );
      noteColumnData.appendChild(noteATag);

      startTimeColumnData.className = 'start-time-data';
      summaryColumnData.className = 'summary-data';
      noteColumnData.className = 'note-data';

      main.appendChild(startTimeColumnData);
      main.appendChild(summaryColumnData);
      main.appendChild(noteColumnData);
      tbodyElement.appendChild(main);
    }
    const table = document.getElementById('table')!;

    // テーブルの子要素を全て削除する
    while (table.lastChild) {
      table.removeChild(table.lastChild);
    }
    document.getElementById('table')!.appendChild(tableElement);
  };

  createHTML();

  // 認証フローを実行
  auth();

  // 初回実行時にカレンダーAPIを実行
  chrome.runtime.sendMessage({ type: 'FETCH_CALENDAR' });

  // 1分間隔でカレンダーAPIをバックグラウンドで実行するアラームを設定
  chrome.alarms.create('FETCH_CALENDAR', {
    delayInMinutes: 1,
    periodInMinutes: 1,
  });

  // 1分間隔でカレンダーAPIをバックグラウンドで実行
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name == 'FETCH_CALENDAR') {
      chrome.runtime.sendMessage({ type: 'FETCH_CALENDAR' });
    }
  });

  // バックグラウンドで書き換えられたカレンダーの状態を監視
  chrome.storage.onChanged.addListener(() => {
    createCalendarTable();
  });

  // リロードボタンの押下を検知
  document.getElementById('reload')!.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: 'FETCH_CALENDAR' });
  });

  window.onload = () => {
    // 1秒ごとに関数を実行
    setInterval(writeTime, 1000);
  };
})();
